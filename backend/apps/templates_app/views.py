import io
import re
from django.conf import settings
from django.http import HttpResponse, FileResponse
from django.db.models import Q
from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from weasyprint import HTML
from docxtpl import DocxTemplate

from .models import Template, TemplateVersion, ShareLink
from .serializers import (
    TemplateSerializer, TemplateListSerializer,
    TemplateVersionSerializer, ShareLinkSerializer, RenderSerializer
)


CURRENT_USER_ID = getattr(settings, 'CURRENT_USER_ID', 1)


class TemplateViewSet(viewsets.ModelViewSet):
    queryset = Template.objects.all()
    serializer_class = TemplateSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_serializer_class(self):
        if self.action == 'list':
            return TemplateListSerializer
        return TemplateSerializer

    def get_queryset(self):
        scope = self.request.query_params.get('scope', 'all')

        if scope == 'public':
            return Template.objects.filter(visibility='PUBLIC').order_by('-updated_at')
        elif scope == 'my':
            return Template.objects.filter(owner_id=CURRENT_USER_ID).order_by('-updated_at')
        elif scope == 'shared':
            all_templates = Template.objects.filter(
                visibility='RESTRICTED'
            ).exclude(owner_id=CURRENT_USER_ID).order_by('-updated_at')
            ids = [t.id for t in all_templates if CURRENT_USER_ID in t.allowed_users]
            return Template.objects.filter(id__in=ids).order_by('-updated_at')
        else:
            all_templates = Template.objects.all()
            ids = [
                t.id for t in all_templates
                if t.visibility == 'PUBLIC'
                or t.owner_id == CURRENT_USER_ID
                or CURRENT_USER_ID in t.allowed_users
            ]
            return Template.objects.filter(id__in=ids).order_by('-updated_at')

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        if not instance.is_accessible_by(CURRENT_USER_ID):
            return Response(
                {'error': 'Access denied. You do not have permission to view this template.'},
                status=status.HTTP_403_FORBIDDEN
            )
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    def perform_create(self, serializer):
        serializer.save(owner_id=CURRENT_USER_ID)

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        if not instance.is_accessible_by(CURRENT_USER_ID):
            return Response(
                {'error': 'Access denied. You do not have permission to edit this template.'},
                status=status.HTTP_403_FORBIDDEN
            )

        partial = kwargs.pop('partial', False)
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
                docx_file=old_docx
            )

        return Response(serializer.data)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.owner_id != CURRENT_USER_ID:
            return Response(
                {'error': 'Access denied. Only the owner can delete this template.'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().destroy(request, *args, **kwargs)

    @action(detail=True, methods=['get'])
    def versions(self, request, pk=None):
        template = self.get_object()
        if not template.is_accessible_by(CURRENT_USER_ID):
            return Response(
                {'error': 'Access denied.'},
                status=status.HTTP_403_FORBIDDEN
            )
        versions = template.versions.all()
        serializer = TemplateVersionSerializer(versions, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='versions/restore/(?P<version_id>[^/.]+)')
    def restore_version(self, request, pk=None, version_id=None):
        template = self.get_object()
        if not template.is_accessible_by(CURRENT_USER_ID):
            return Response(
                {'error': 'Access denied.'},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            version = TemplateVersion.objects.get(id=version_id, template=template)
        except TemplateVersion.DoesNotExist:
            return Response(
                {'error': 'Version not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        version_count = template.versions.count()
        TemplateVersion.objects.create(
            template=template,
            version_number=version_count + 1,
            html_content=template.html_content,
            docx_file=template.docx_file.name if template.docx_file else None
        )

        template.html_content = version.html_content
        if version.docx_file:
            template.docx_file = version.docx_file
        template.save()

        serializer = self.get_serializer(template)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='share-links')
    def create_share_link(self, request, pk=None):
        template = self.get_object()
        if not template.is_accessible_by(CURRENT_USER_ID):
            return Response(
                {'error': 'Access denied.'},
                status=status.HTTP_403_FORBIDDEN
            )

        ttl_days = request.data.get('ttl_days', 7)
        max_uses = request.data.get('max_uses', 50)

        share_link = ShareLink.objects.create(
            template=template,
            ttl_days=ttl_days,
            max_uses=max_uses
        )

        serializer = ShareLinkSerializer(share_link)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def render(self, request, pk=None):
        template = self.get_object()
        if not template.is_accessible_by(CURRENT_USER_ID):
            return Response(
                {'error': 'Access denied.'},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = RenderSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        values = serializer.validated_data['values']

        return render_template(template, values)


def render_template(template, values):
    if template.template_type == 'HTML':
        html_content = template.html_content
        for key, value in values.items():
            pattern = r'\{\{\s*' + re.escape(key) + r'\s*\}\}'
            html_content = re.sub(pattern, value, html_content)

        html = HTML(string=html_content)
        pdf_buffer = io.BytesIO()
        html.write_pdf(pdf_buffer)
        pdf_buffer.seek(0)

        response = HttpResponse(pdf_buffer.read(), content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="{template.title}.pdf"'
        return response

    elif template.template_type == 'DOCX':
        if not template.docx_file:
            return Response(
                {'error': 'No DOCX template file uploaded.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        doc = DocxTemplate(template.docx_file.path)
        doc.render(values)

        docx_buffer = io.BytesIO()
        doc.save(docx_buffer)
        docx_buffer.seek(0)

        response = HttpResponse(
            docx_buffer.read(),
            content_type='application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        )
        response['Content-Disposition'] = f'attachment; filename="{template.title}.docx"'
        return response

    return Response({'error': 'Invalid template type.'}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
def share_info(request, token):
    try:
        share_link = ShareLink.objects.get(token=token)
    except ShareLink.DoesNotExist:
        return Response(
            {'error': 'Share link not found.'},
            status=status.HTTP_404_NOT_FOUND
        )

    if not share_link.is_valid():
        return Response(
            {'error': 'Share link has expired or reached maximum uses.'},
            status=status.HTTP_403_FORBIDDEN
        )

    template = share_link.template
    return Response({
        'id': template.id,
        'title': template.title,
        'description': template.description,
        'template_type': template.template_type,
        'placeholders': template.get_placeholders(),
        'share_link': ShareLinkSerializer(share_link).data
    })


@api_view(['POST'])
def share_render(request, token):
    try:
        share_link = ShareLink.objects.get(token=token)
    except ShareLink.DoesNotExist:
        return Response(
            {'error': 'Share link not found.'},
            status=status.HTTP_404_NOT_FOUND
        )

    if not share_link.is_valid():
        return Response(
            {'error': 'Share link has expired or reached maximum uses.'},
            status=status.HTTP_403_FORBIDDEN
        )

    serializer = RenderSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    values = serializer.validated_data['values']

    share_link.increment_use()

    return render_template(share_link.template, values)
