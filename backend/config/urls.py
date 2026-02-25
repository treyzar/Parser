from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('api/', include([
        path('', include('apps.templates_app.urls')),
        path('', include('apps.parser_app.urls')),
        path('doc-builder/', include('apps.doc_builder.urls')),
    ])),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)