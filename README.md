# DocFlow Builder

A web application for document parsing and template-based document generation.

## Features

- **Document Parser**: Upload PDF or DOCX files to extract text content
- **Template Management**: Create and manage HTML or DOCX templates
- **Document Rendering**: Generate PDF/DOCX documents from templates with dynamic placeholders
- **Version Control**: Track template changes with restore capability
- **Share Links**: Create public links for template rendering with expiration and usage limits

## Tech Stack

- **Backend**: Django 4.2 + Django REST Framework
- **Frontend**: React + Vite + TypeScript
- **PDF Generation**: WeasyPrint
- **DOCX Rendering**: docxtpl
- **Database**: SQLite (PostgreSQL-ready)

## Quick Start

### Backend Setup

```bash
cd backend
pip install -r requirements.txt  # or use uv
python manage.py migrate
python manage.py seed_data  # Optional: create demo templates
python manage.py runserver 0.0.0.0:8000
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev -- --host 0.0.0.0 --port 5173
```

## Project Structure

```
/backend
  /config          # Django settings
  /apps
    /templates_app # Template CRUD, versioning, share links, rendering
    /parser_app    # PDF/DOCX parsing
  /media           # Uploaded files

/frontend
  /src
    /api           # API client and types
    /components    # Shared components
    /pages         # Route pages
    /styles        # Design system CSS
```

## Demo Mode

The application runs without authentication for demo purposes:
- Fixed user ID: 1
- All new templates have owner_id = 1
- Access control logic is implemented but doesn't require login

## Integration Guide

To integrate with an external authentication system:

1. Backend: Replace `CURRENT_USER_ID` in settings with actual user from request
2. Add authentication middleware to extract user from token/session
3. Update `is_accessible_by()` method calls to use authenticated user

## Environment Variables

- `SECRET_KEY`: Django secret key (auto-generated for development)
- `DEBUG`: Enable debug mode (default: True)
- `DATABASE_URL`: PostgreSQL connection string (optional)

## License

MIT
