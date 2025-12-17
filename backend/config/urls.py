from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('api/', include('apps.templates_app.urls')),
    path('api/', include('apps.parser_app.urls')),
    path('api/doc-builder/', include('apps.doc_builder.urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
