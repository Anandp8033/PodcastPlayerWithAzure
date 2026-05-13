# FullStackPodcastWebApp

A full-stack podcast web application with FastAPI backend and vanilla JavaScript frontends, designed for Azure hosting.

## Project Overview

This project is a podcast management and playback platform consisting of:

- **Backend**: FastAPI REST API with authentication, admin panel, podcast upload, and Azure Blob Storage support
- **Frontend Admin**: Internal admin interface for uploading and managing podcasts
- **Frontend Player**: Public podcast player with audio and subtitle playback support
- **SSOLogin**: Optional single sign-on login demo

## Repository Structure

FullStackPodcastWebApp/
├── fastapi-auth-app/ # FastAPI Backend
│ ├── requirements.txt # Python dependencies
│ ├── run.py
│ ├── uploads/ # Local upload storage (if used)
│ │ ├── audio/
│ │ ├── images/
│ │ └── subtitles/
│ └── app/
│ ├── main.py # FastAPI application setup
│ ├── api/ # API route handlers
│ │ ├── admin.py
│ │ ├── auth.py
│ │ └── podcast.py
│ ├── core/
│ │ └── security.py
│ ├── crud/
│ │ ├── admin.py
│ │ ├── podcast.py
│ │ └── user.py
│ ├── db/
│ │ └── database.py
│ ├── models/
│ │ ├── admin.py
│ │ ├── podcast.py
│ │ └── user.py
│ ├── schemas/
│ │ ├── admin.py
│ │ ├── podcast.py
│ │ └── user.py
│ └── services/
│ ├── admin_services.py
│ ├── auth_services.py
│ ├── azure_blob_service.py
│ └── podcast_service.py
├── FrontEndInternalUserAdmin/ # Internal Admin Frontend
│ ├── index.html
│ ├── upload.html
│ ├── package.json
│ ├── vite.config.js
│ ├── css/
│ │ └── style.css
│ └── src/
│ ├── main.js
│ └── upload.js
├── FrontEndPodCastPlayer/ # Public Podcast Player
│ ├── podcast.html
│ ├── index.html
│ ├── package.json
│ ├── vite.config.js
│ ├── css/
│ │ ├── style.css
│ │ └── autthPage.css
│ ├── public/
│ │ ├── episodes.json
│ │ ├── Audio/
│ │ ├── images/
│ │ └── subtitles/
│ └── src/
│ ├── main.js
│ ├── podcast.js
│ └── podcast_1.js
└── SSOLogin/ # Optional SSO demo
├── index.html
├── package.json
├── vite.config.js
├── src/
│ ├── main.js
│ ├── msalConfig.js
│ └── style.css

## Features

### Backend (FastAPI)
- JWT-based authentication
- Admin and user management
- Podcast upload support for audio, images, and subtitles
- Azure Blob Storage integration
- SQLAlchemy + MySQL database support

### Frontend Admin
- Podcast upload UI
- Media management dashboard
- Admin user management interface

### Frontend Player
- Podcast playback
- Multi-language subtitle support
- Responsive UI for listeners

## Technology Stack

| Layer | Technology |
|-------|------------|
| Backend | FastAPI, Python |
| Database | SQLAlchemy, MySQL |
| Auth | JWT, Passlib |
| Frontend | Vanilla JavaScript, Vite |
| Styling | CSS |
| Cloud | Azure App Service / Static Web Apps / Blob Storage |

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
```bash
cd fastapi-auth-app
```

2. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Run the application:
```bash
python run.py
```

The API will be available at `http://localhost:8000`

### Frontend Setup

#### Internal Admin
```bash
cd FrontEndInternalUserAdmin
npm install
npm run dev
```

#### Podcast Player
```bash
cd FrontEndPodCastPlayer
npm install
npm run dev
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh token

### Podcasts
- `GET /api/podcast/` - List all podcasts
- `GET /api/podcast/{id}` - Get podcast details
- `POST /api/podcast/` - Create podcast (admin)
- `PUT /api/podcast/{id}` - Update podcast (admin)
- `DELETE /api/podcast/{id}` - Delete podcast (admin)

### Admin
- `GET /api/admin/users` - List all users
- `PUT /api/admin/user/{id}` - Update user
- `DELETE /api/admin/user/{id}` - Delete user

## Subtitle Support

The application supports VTT subtitles in multiple languages:
- English (`_en.vtt`)
- Spanish (`_es.vtt`)
- French (`_fr.vtt`)
- German (`_de.vtt`)

## License

MIT
