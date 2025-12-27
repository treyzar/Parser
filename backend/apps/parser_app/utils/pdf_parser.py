# project/app/utils/pdf_parser.py
from __future__ import annotations

from typing import List, Dict, Any

import pdfplumber

from .elements import make_text_element


def parse_pdf(file_obj) -> Dict[str, Any]:
    """
    Парсит PDF в элементы редактора.
    Возвращает {'elements': List[Element], 'text': str}
    """
    elements: List[Dict[str, Any]] = []
    y_offset = 40
    page_w = 794
    plain_lines = []

    with pdfplumber.open(file_obj) as pdf:
        for page in pdf.pages:
            words = page.extract_words()
            if not words:
                continue
            # группируем по строкам
            lines = {}
            for w in words:
                key = int(float(w["top"]))
                lines.setdefault(key, []).append(w)

            for top in sorted(lines):
                line_words = sorted(lines[top], key=lambda x: float(x["x0"]))
                text = " ".join(w["text"] for w in line_words)
                plain_lines.append(text)
                h = 18
                elements.append(
                    make_text_element(
                        x=40,
                        y=y_offset,
                        width=page_w - 80,
                        height=h,
                        content=text,
                    )
                )
                y_offset += h + 4
            y_offset += 20  # отступ между страницами

    return {"elements": elements, "text": "\n".join(plain_lines)}