# project/app/serializers.py
from rest_framework import serializers
from .models import ParsedDocument


class ParsedDocumentSerializer(serializers.ModelSerializer):
    editor_elements = serializers.SerializerMethodField()

    class Meta:
        model = ParsedDocument
        fields = [
            'id', 'original_filename', 'file_type', 'file_size',
            'page_count', 'extracted_text', 'editor_elements',
            'original_file', 'created_at'
        ]
        read_only_fields = fields

    def get_editor_elements(self, obj: ParsedDocument):
        # если frontend запросил ?format=editor вернём структуру
        request = self.context.get('request')
        if request and request.query_params.get('format') == 'editor':
            return obj.editor_json.get('elements', [])
        return None  # иначе не засоряем ответ


class ParseUploadSerializer(serializers.Serializer):
    file = serializers.FileField()

    def validate_file(self, value):
        max_size = 20 * 1024 * 1024
        if value.size > max_size:
            raise serializers.ValidationError('File size exceeds 20MB limit.')

        ext = value.name.lower().split('.')[-1]
        if ext not in ['pdf', 'docx']:
            raise serializers.ValidationError('Only PDF and DOCX files are allowed.')

        return value