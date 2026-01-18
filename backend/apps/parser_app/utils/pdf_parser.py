# project/app/utils/pdf_parser.py
from __future__ import annotations
from typing import List, Dict, Any
import pdfplumber
import io
from .elements import (
    make_text_element, make_table_element, make_image_element, 
    make_signature_element, make_divider_element, is_likely_signature
)

def parse_pdf(file_obj) -> Dict[str, Any]:
    elements: List[Dict[str, Any]] = []
    
    current_y_offset = 0
    # PDF coordinates are in points (1/72 inch). Web is approx 96 DPI.
    # Scale factor 1.33 maps PDF points to likely CSS pixels.
    SCALE = 1.33 

    plain_text_parts = []

    try:
        with pdfplumber.open(file_obj) as pdf:
            for page in pdf.pages:
                page_height = page.height
                
                # --- 1. ТАБЛИЦЫ ---
                # Находим таблицы, чтобы потом исключить текст внутри них
                tables = page.find_tables()
                table_rects = []

                for table in tables:
                    bbox = table.bbox
                    table_rects.append(bbox) # (x0, top, x1, bottom)
                    
                    data = table.extract()
                    if not data: continue

                    x = bbox[0] * SCALE
                    y = (bbox[1] * SCALE) + current_y_offset
                    w = (bbox[2] - bbox[0]) * SCALE
                    h = (bbox[3] - bbox[1]) * SCALE
                    
                    elements.append(make_table_element(
                        x=max(0, x), y=y, width=w, height=h,
                        data=data
                    ))

                # --- 2. КАРТИНКИ И ПОДПИСИ ---
                for img in page.images:
                    x0, top, x1, bottom = img['x0'], img['top'], img['x1'], img['bottom']
                    w_px = (x1 - x0) * SCALE
                    h_px = (bottom - top) * SCALE
                    
                    # Фильтр мусора
                    if w_px < 5 or h_px < 5: continue

                    try:
                        # Самый надежный способ достать картинку в pdfplumber - кропнуть и сохранить
                        cropped_page = page.crop((x0, top, x1, bottom))
                        # to_image создает объект Image из библиотеки PIL (pypdfium2 wrapper)
                        # resolution=150 достаточно для экрана
                        pil_image = cropped_page.to_image(resolution=150).original
                        
                        buf = io.BytesIO()
                        pil_image.save(buf, format="PNG")
                        img_bytes = buf.getvalue()
                        
                        final_x = x0 * SCALE
                        final_y = (top * SCALE) + current_y_offset

                        if is_likely_signature(w_px, h_px):
                            elements.append(make_signature_element(
                                x=final_x, y=final_y, width=w_px, height=h_px,
                                image_bytes=img_bytes
                            ))
                        else:
                            elements.append(make_image_element(
                                x=final_x, y=final_y, width=w_px, height=h_px,
                                image_bytes=img_bytes
                            ))
                    except Exception as e:
                        print(f"Skipping image due to error: {e}")

                # --- 3. ЛИНИИ (РАЗДЕЛИТЕЛИ) ---
                for line in page.lines:
                    # Горизонтальные линии
                    if abs(line['top'] - line['bottom']) < 2 and (line['x1'] - line['x0']) > 50:
                        elements.append(make_divider_element(
                            x=line['x0'] * SCALE,
                            y=(line['top'] * SCALE) + current_y_offset,
                            width=(line['x1'] - line['x0']) * SCALE,
                            thickness=max(1, line.get('linewidth', 1)),
                            color="#000000" # PDF цвета линий сложно достать напрямую в hex
                        ))

                # --- 4. ТЕКСТ ---
                words = page.extract_words(extra_attrs=['fontname', 'size', 'non_stroking_color'])
                
                # Группируем слова в строки
                lines_dict = {}
                for w in words:
                    # Проверяем, не внутри ли таблицы
                    cx, cy = w['x0'], w['top']
                    in_table = False
                    for tr in table_rects:
                        if tr[0] <= cx <= tr[2] and tr[1] <= cy <= tr[3]:
                            in_table = True
                            break
                    if in_table: continue

                    # Группируем по Y с допуском 3 пункта
                    y_key = int(w['top'] // 3) * 3
                    lines_dict.setdefault(y_key, []).append(w)

                sorted_y_keys = sorted(lines_dict.keys())
                
                for y_key in sorted_y_keys:
                    line_words = sorted(lines_dict[y_key], key=lambda x: x['x0'])
                    if not line_words: continue

                    first = line_words[0]
                    text_content = " ".join([wd['text'] for wd in line_words])
                    plain_text_parts.append(text_content)

                    # Стили
                    font_size = float(first.get('size', 12)) * SCALE
                    is_bold = "Bold" in str(first.get('fontname', ''))
                    is_italic = "Italic" in str(first.get('fontname', ''))
                    
                    # Цвет
                    color = "#000000"
                    sc = first.get('non_stroking_color')
                    if sc and isinstance(sc, (list, tuple)) and len(sc) >= 3:
                        r, g, b = [int(c * 255) for c in sc[:3]]
                        color = "#{:02x}{:02x}{:02x}".format(r, g, b)

                    elements.append(make_text_element(
                        x=first['x0'] * SCALE,
                        y=(first['top'] * SCALE) + current_y_offset,
                        width=(line_words[-1]['x1'] - first['x0']) * SCALE + 10,
                        height=max(14, font_size * 1.5),
                        content=text_content,
                        size=max(8, int(font_size)),
                        bold=is_bold,
                        italic=is_italic,
                        color=color
                    ))

                # Отступ для следующей страницы
                current_y_offset += (page_height * SCALE) + 40

        return {"elements": elements, "text": "\n".join(plain_text_parts)}

    except Exception as e:
        print(f"PDF Parse Error: {e}")
        return {"elements": [], "text": ""}
