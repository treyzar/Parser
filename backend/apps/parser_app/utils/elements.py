# project/app/utils/elements.py
"""
Фабрики элементов редактора.
"""
from typing import Dict, Any
import base64


def make_text_element(
    x: int, y: int, width: int, height: int, content: str, **kw
) -> Dict[str, Any]:
    """Создаёт текстовый элемент."""
    return {
        "id": f"auto_txt_{abs(hash(content))}",
        "type": "text",
        "x": x,
        "y": y,
        "width": width,
        "height": height,
        "zIndex": 0,
        "properties": {
            "content": content,
            "fontFamily": kw.get("font", "Inter"),
            "fontSize": kw.get("size", 14),
            "color": kw.get("color", "#1a1a1a"),
            "bold": kw.get("bold", False),
            "italic": kw.get("italic", False),
            "underline": kw.get("underline", False),
            "align": kw.get("align", "left"),
        },
    }


def make_table_element(x: int, y: int, width: int, height: int, table) -> Dict[str, Any]:
    """table: python-docx Table."""
    rows, cols = len(table.rows), len(table.columns)
    data = [[cell.text.strip() for cell in row.cells] for row in table.rows]
    return {
        "id": f"auto_tbl_{abs(id(table))}",
        "type": "table",
        "x": x,
        "y": y,
        "width": width,
        "height": height,
        "zIndex": 0,
        "properties": {
            "rows": rows,
            "cols": cols,
            "borderWidth": 1,
            "borderColor": "#1a1a1a",
            "cellBg": "transparent",
            "data": data,
        },
    }


def make_image_element(x: int, y: int, width: int, height: int, image_bytes: bytes, ext: str) -> Dict[str, Any]:
    b64 = base64.b64encode(image_bytes).decode()
    src = f"data:image/{ext};base64,{b64}"
    return {
        "id": f"auto_img_{abs(hash(b64))}",
        "type": "image",
        "x": x,
        "y": y,
        "width": width,
        "height": height,
        "zIndex": 0,
        "properties": {"src": src, "alt": "imported"},
    }