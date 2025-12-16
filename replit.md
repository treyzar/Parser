# DocFlow Builder

## Overview
DocFlow Builder is a web application for document parsing (PDF/DOCX) and template-based document generation. It features a Django REST Framework backend and a React/TypeScript frontend.

## Project Architecture

### Backend (Django REST Framework)
- **Port**: 8000
- **Location**: `/backend`
- **Database**: SQLite (easily switchable to PostgreSQL)
- **Key Apps**:
  - `templates_app`: Template management, versioning, share links, rendering
  - `parser_app`: PDF/DOCX text extraction

### Frontend (React + Vite + TypeScript)
- **Port**: 5173
- **Location**: `/frontend`
- **Design System**: Custom CSS with design tokens in `/frontend/src/styles/design-system.css`

## Key Features
1. **Document Parser**: Upload PDF/DOCX files, extract text, copy/download results
2. **Template System**: HTML templates (export to PDF) and DOCX templates (with placeholders)
3. **Version Control**: Each template save creates a new version, with restore capability
4. **Share Links**: Generate public links with TTL and usage limits for template rendering
5. **Access Control**: PUBLIC/RESTRICTED visibility with allowed_users list

## Demo Mode
- No authentication required (designed for later integration)
- Fixed `current_user_id = 1` for all operations
- Default `owner_id = 1` for new templates

## API Endpoints
- `GET/POST /api/templates/` - List/create templates
- `GET/PATCH/DELETE /api/templates/{id}/` - Template CRUD
- `GET /api/templates/{id}/versions/` - Version history
- `POST /api/templates/{id}/versions/restore/{version_id}/` - Restore version
- `POST /api/templates/{id}/share-links/` - Create share link
- `POST /api/templates/{id}/render/` - Render document
- `GET /api/share/{token}/` - Get share info
- `POST /api/share/{token}/render/` - Render via share link
- `POST /api/parse/` - Parse document
- `GET /api/parse/{id}/` - Get parsed document

## Running the Application

### Backend
```bash
cd backend
python manage.py migrate
python manage.py seed_data  # Create demo templates
python manage.py runserver 0.0.0.0:8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev -- --host 0.0.0.0 --port 5173
```

## Design Tokens
- Accent color: `#E73F0C` (orange) - used only for CTA buttons, focus rings, small indicators
- Background: `#F7F8F8` (light) / `#2F3235` (dark mode)
- All styling follows `.hero-bs`, `.card-bs`, `.container-1600` patterns

## Recent Changes
- Initial project setup (December 2024)
- Implemented template CRUD with versioning
- Added share link functionality
- Created document parser with drag-and-drop
- Applied design system with dark mode support
