from django.db import models


class ParsedDocument(models.Model):
    original_filename = models.CharField(max_length=255)
    file_type = models.CharField(max_length=10)
    file_size = models.IntegerField()
    page_count = models.IntegerField(null=True, blank=True)
    extracted_text = models.TextField()
    original_file = models.FileField(upload_to='parsed_documents/')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.original_filename
