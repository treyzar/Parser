import io
import re
from typing import Any, Dict, Optional

from django.conf import settings
from django.http import HttpResponse
from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.response import Response

from docxtpl import DocxTemplate

from .models import Template, TemplateVersion, ShareLink
from .serializers import (
    TemplateSerializer, TemplateListSerializer,
    TemplateVersionSerializer, ShareLinkSerializer, RenderSerializer
)

CURRENT_USER_ID = getattr(settings, 'CURRENT_USER_ID', 1)


# -------- PDF via Playwright (Chromium) --------
def _html_to_pdf_bytes_playwright(html: str, base_url: str) -> bytes:
    """
    Генерация PDF из HTML через Chromium (Playwright).
    Важно: это заменяет WeasyPrint и не требует GTK/Pango на Windows.
    """
    try:
        from playwright.sync_api import sync_playwright  # type: ignore
    except Exception as e:
        # Если playwright не установлен — не валим весь сервер, а возвращаем понятную ошибку на уровне API
        raise RuntimeError(
            "Playwright is not installed. Install it with: pip install playwright "
            "and then run: python -m playwright install chromium"
        ) from e

    with sync_playwright() as p:
        browser = p.chromium.launch()
        try:
            # Отключаем JS — полезно как минимальная защита от вставок <script> в шаблон
            page = browser.new_page(java_script_enabled=False)

            # set_content + base_url позволяет подтягивать относительные ссылки (/static/..., картинки и т.п.)
            page.set_content(html, wait_until="networkidle", base_url=base_url)

            pdf_bytes = page.pdf(
                format="A4",
                print_background=True,
                prefer_css_page_size=True,
            )
            return pdf_bytes
        finally:
            browser.close()


def _get_base_url_from_request(request) -> str:
    # Можно задать settings.SITE_URL = "https://example.com/" чтобы не зависеть от request.
    site_url = getattr(settings, "SITE_URL", None)
    if site_url:
        return str(site_url)
    return request.build_absolute_uri("/")


def _safe_filename(name: str, default: str) -> str:
    """
    Простая защита от кавычек/переводов строк в имени файла.
    """
    name = (name or default).strip()
    name = name.replace('"', "'").replace("\r", " ").replace("\n", " ")
    return name or default


def _apply_placeholders_html(html_content: str, values: Dict[str, Any]) -> str:
    """
    Заменяет {{ key }} на значение.
    Важно: используем функцию-замену, чтобы спецсимволы в value не ломали re.sub.
    """
    result = html_content or ""
    for key, value in (values or {}).items():
        k = str(key)
        v = "" if value is None else str(value)
        pattern = r"\{\{\s*" + re.escape(k) + r"\s*\}\}"
        result = re.sub(pattern, lambda _m, vv=v: vv, result)
    return result


class TemplateViewSet(viewsets.ModelViewSet):
    queryset = Template.objects.all()
    serializer_class = TemplateSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_serializer_class(self):
        if self.action == "list":
            return TemplateListSerializer
        return TemplateSerializer

    def get_queryset(self):
        scope = self.request.query_params.get("scope", "all")

        if scope == "public":
            return Template.objects.filter(visibility="PUBLIC").order_by("-updated_at")

        if scope == "my":
            return Template.objects.filter(owner_id=CURRENT_USER_ID).order_by("-updated_at")

        if scope == "shared":
            all_templates = (
                Template.objects.filter(visibility="RESTRICTED")
                .exclude(owner_id=CURRENT_USER_ID)
                .order_by("-updated_at")
            )
            ids = [t.id for t in all_templates if CURRENT_USER_ID in (t.allowed_users or [])]
            return Template.objects.filter(id__in=ids).order_by("-updated_at")

        # scope == "all"
        all_templates = Template.objects.all()
        ids = [
            t.id for t in all_templates
            if t.visibility == "PUBLIC"
            or t.owner_id == CURRENT_USER_ID
            or CURRENT_USER_ID in (t.allowed_users or [])
        ]
        return Template.objects.filter(id__in=ids).order_by("-updated_at")

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        if not instance.is_accessible_by(CURRENT_USER_ID):
            return Response(
                {"error": "Access denied. You do not have permission to view this template."},
                status=status.HTTP_403_FORBIDDEN,
            )
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    def perform_create(self, serializer):
        serializer.save(owner_id=CURRENT_USER_ID)

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        if not instance.is_accessible_by(CURRENT_USER_ID):
            return Response(
                {"error": "Access denied. You do not have permission to edit this template."},
                status=status.HTTP_403_FORBIDDEN,
            )

        partial = kwargs.pop("partial", False)
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)

        old_html = instance.html_content
        old_docx = instance.docx_file.name if instance.docx_file else None

        self.perform_update(serializer)

        new_html = instance.html_content
        new_docx = instance.docx_file.name if instance.docx_file else None

        if old_html != new_html or old_docx != new_docx:
            version_count = instance.versions.count()
            TemplateVersion.objects.create(
                template=instance,
                version_number=version_count + 1,
                html_content=old_html,
                docx_file=old_docx,
            )

        return Response(serializer.data)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.owner_id != CURRENT_USER_ID:
            return Response(
                {"error": "Access denied. Only the owner can delete this template."},
                status=status.HTTP_403_FORBIDDEN,
            )
        return super().destroy(request, *args, **kwargs)

    @action(detail=True, methods=["get"])
    def versions(self, request, pk=None):
        template = self.get_object()
        if not template.is_accessible_by(CURRENT_USER_ID):
            return Response({"error": "Access denied."}, status=status.HTTP_403_FORBIDDEN)

        versions = template.versions.all()
        serializer = TemplateVersionSerializer(versions, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["post"], url_path=r"versions/restore/(?P<version_id>[^/.]+)")
    def restore_version(self, request, pk=None, version_id=None):
        template = self.get_object()
        if not template.is_accessible_by(CURRENT_USER_ID):
            return Response({"error": "Access denied."}, status=status.HTTP_403_FORBIDDEN)

        try:
            version = TemplateVersion.objects.get(id=version_id, template=template)
        except TemplateVersion.DoesNotExist:
            return Response({"error": "Version not found."}, status=status.HTTP_404_NOT_FOUND)

        version_count = template.versions.count()
        TemplateVersion.objects.create(
            template=template,
            version_number=version_count + 1,
            html_content=template.html_content,
            docx_file=template.docx_file.name if template.docx_file else None,
        )

        template.html_content = version.html_content
        if version.docx_file:
            template.docx_file = version.docx_file
        template.save()

        serializer = self.get_serializer(template)
        return Response(serializer.data)

    @action(detail=True, methods=["post"], url_path="share-links")
    def create_share_link(self, request, pk=None):
        template = self.get_object()
        if not template.is_accessible_by(CURRENT_USER_ID):
            return Response({"error": "Access denied."}, status=status.HTTP_403_FORBIDDEN)

        ttl_days = request.data.get("ttl_days", 7)
        max_uses = request.data.get("max_uses", 50)

        share_link = ShareLink.objects.create(
            template=template,
            ttl_days=ttl_days,
            max_uses=max_uses,
        )

        serializer = ShareLinkSerializer(share_link)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"])
    def render(self, request, pk=None):
        template = self.get_object()
        if not template.is_accessible_by(CURRENT_USER_ID):
            return Response({"error": "Access denied."}, status=status.HTTP_403_FORBIDDEN)

        serializer = RenderSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        values = serializer.validated_data["values"]

        return render_template(request, template, values)


def render_template(request, template: Template, values: Dict[str, Any]):
    if template.template_type == "HTML":
        html_content = _apply_placeholders_html(template.html_content or "", values)

        base_url = _get_base_url_from_request(request)

        try:
            pdf_bytes = _html_to_pdf_bytes_playwright(html_content, base_url=base_url)
        except RuntimeError as e:
            # Playwright не установлен/не готов
            return Response(
                {"error": "PDF engine is not available on this server.", "detail": str(e)},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        except Exception as e:
            # Любая другая ошибка рендера
            return Response(
                {"error": "Failed to render PDF.", "detail": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        filename = _safe_filename(template.title, "template") + ".pdf"
        response = HttpResponse(pdf_bytes, content_type="application/pdf")
        response["Content-Disposition"] = f'attachment; filename="{filename}"'
        return response

    if template.template_type == "DOCX":
        if not template.docx_file:
            return Response({"error": "No DOCX template file uploaded."}, status=status.HTTP_400_BAD_REQUEST)

        doc = DocxTemplate(template.docx_file.path)
        doc.render(values or {})

        docx_buffer = io.BytesIO()
        doc.save(docx_buffer)
        docx_buffer.seek(0)

        filename = _safe_filename(template.title, "template") + ".docx"
        response = HttpResponse(
            docx_buffer.read(),
            content_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        )
        response["Content-Disposition"] = f'attachment; filename="{filename}"'
        return response

    return Response({"error": "Invalid template type."}, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET"])
def share_info(request, token):
    try:
        share_link = ShareLink.objects.get(token=token)
    except ShareLink.DoesNotExist:
        return Response({"error": "Share link not found."}, status=status.HTTP_404_NOT_FOUND)

    if not share_link.is_valid():
        return Response(
            {"error": "Share link has expired or reached maximum uses."},
            status=status.HTTP_403_FORBIDDEN,
        )

    template = share_link.template
    return Response(
        {
            "id": template.id,
            "title": template.title,
            "description": template.description,
            "template_type": template.template_type,
            "placeholders": template.get_placeholders(),
            "share_link": ShareLinkSerializer(share_link).data,
        }
    )


@api_view(["POST"])
def share_render(request, token):
    try:
        share_link = ShareLink.objects.get(token=token)
    except ShareLink.DoesNotExist:
        return Response({"error": "Share link not found."}, status=status.HTTP_404_NOT_FOUND)

    if not share_link.is_valid():
        return Response(
            {"error": "Share link has expired or reached maximum uses."},
            status=status.HTTP_403_FORBIDDEN,
        )

    serializer = RenderSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    values = serializer.validated_data["values"]

    share_link.increment_use()

    return render_template(request, share_link.template, values)
