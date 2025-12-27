# project/app/utils/parser.py
from __future__ import annotations

from typing import Dict, Any

from .docx_parser import parse_docx
from .pdf_parser import parse_pdf


def parse_file(file_obj, ext: str) -> Dict[str, Any]:
    """Унифицированный вход для обеих библиотек."""
    if ext == "docx":
        return parse_docx(file_obj)
    if ext == "pdf":
        return parse_pdf(file_obj)
    raise ValueError("Unsupported extension")