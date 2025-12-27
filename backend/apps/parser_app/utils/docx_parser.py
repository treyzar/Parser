# project/app/utils/docx_parser.py
from __future__ import annotations

import base64
import io
from typing import List, Dict, Any

from docx import Document
from docx.text.paragraph import Paragraph
from docx.table import Table
from PIL import Image as PILImage

from .elements import make_text_element, make_table_element, make_image_element


def parse_docx(file_obj) -> Dict[str, Any]:
    """
    Разбирает DOCX-файл в структуру элементов редактора.
    Возвращает {'elements': List[Element], 'text': str}
    """
    doc = Document(file_obj)
    elements: List[Dict[str, Any]] = []
    y_offset = 40
    page_w = 794  # A4 px
    plain_chunks = []

    for block in _iter_block_items(doc):
        if isinstance(block, Paragraph):
            if not block.text.strip():
                y_offset += 12
                continue
            bold, italic, size, font, color = _extract_parfmt(block)
            h = max(20, int(size * 1.4))
            elements.append(
                make_text_element(
                    x=40,
                    y=y_offset,
                    width=page_w - 80,
                    height=h,
                    content=block.text,
                    font=font,
                    size=size,
                    bold=bold,
                    italic=italic,
                    color=color,
                )
            )
            plain_chunks.append(block.text)
            y_offset += h + 6

        elif isinstance(block, Table):
            h = len(block.rows) * 28
            elements.append(
                make_table_element(x=40, y=y_offset, width=page_w - 80, height=h, table=block)
            )
            plain_chunks.append(_table_to_plaintext(block))
            y_offset += h + 12

    # картинки
    for rel in doc.part.rels.values():
        if "image" not in rel.target_ref:
            continue
        try:
            img_bytes = rel.target_part.blob
            img = PILImage.open(io.BytesIO(img_bytes))
            ext = img.format.lower()
            w, h = img.size
            scale = min(250, w) / w
            elements.append(
                make_image_element(
                    x=40,
                    y=y_offset,
                    width=int(w * scale),
                    height=int(h * scale),
                    image_bytes=img_bytes,
                    ext=ext,
                )
            )
            y_offset += int(h * scale) + 12
        except Exception:
            continue

    return {"elements": elements, "text": "\n".join(plain_chunks)}


# ---------- вспомогательные функции ----------
def _iter_block_items(parent):
    """Генератор параграфов / таблиц в порядке документа."""
    from docx.document import Document as Doc

    parent = parent.element.body if isinstance(parent, Doc) else parent
    for child in parent.iterchildren():
        if child.tag.endswith("p"):
            yield Paragraph(child, parent)
        elif child.tag.endswith("tbl"):
            yield Table(child, parent)


def _extract_parfmt(par: Paragraph):
    """Извлекает базовые стили первого run."""
    bold = italic = False
    size, font, color = 14, "Inter", "#1a1a1a"
    if par.runs:
        r = par.runs[0]
        bold, italic = r.bold, r.italic
        if r.font.size:
            size = int(r.font.size.pt)
        if r.font.name:
            font = r.font.name
        if r.font.color.rgb:
            color = f"#{r.font.color.rgb}"
    return bold, italic, size, font, color


def _table_to_plaintext(table: Table) -> str:
    """Для plain-text представления таблицы."""
    return "\n".join(
        "\t".join(cell.text.strip() for cell in row.cells) for row in table.rows
    )