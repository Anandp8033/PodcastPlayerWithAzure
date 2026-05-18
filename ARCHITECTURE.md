# FullStack Podcast Web Application - Software Architecture

## Executive Summary

This is a full-stack podcast management and playback platform designed for Azure cloud hosting. The application follows a three-tier architecture with:
- **Backend**: FastAPI REST API with JWT authentication
- **Frontend**: Multiple vanilla JavaScript applications (Admin, Player, SSO)
- **Storage**: Azure Blob Storage + MySQL database
- **Infrastructure**: Docker-ready for containerization

---

## 1. System Architecture Overview

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT TIER                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐  │
│  │  Podcast Player  │  │  Admin Panel     │  │  SSO Login   │  │
│  │  (Vanilla JS)    │  │  (Vanilla JS)    │  │  (MSAL)      │  │
│  │  Vite + MSAL     │  │  Vite + MSAL     │  │  Vite        │  │
│  └────────┬─────────┘  └────────┬─────────┘  └──────┬───────┘  │
│           │                     │                   │          │
└───────────┼─────────────────────┼───────────────────┼──────────┘
            │ HTTP/REST           │                   │ SSO
            │ CORS Enabled        │                   │
┌───────────┼─────────────────────┼───────────────────┼──────────┐
│           │                     │                   │          │
│  ┌────────▼────────────────────▼───────────────────▼────────┐  │
│  │         APPLICATION TIER - FastAPI                       │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │                                                          │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │  │
│  │  │ Auth Router  │  │ Podcast      │  │ Admin Router │  │  │
│  │  │ /auth        │  │ Router       │  │ /admin       │  │  │
│  │  │              │  │ /podcast     │  │              │  │  │
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │  │
│  │         │                 │                 │          │  │
│  │  ┌──────▼─────────────────▼─────────────────▼────────┐  │  │
│  │  │        SERVICE LAYER (Business Logic)            │  │  │
│  │  │  ├── auth_services.py                            │  │  │
│  │  │  ├── podcast_service.py                          │  │  │
│  │  │  ├── admin_services.py                           │  │  │
│  │  │  └── azure_blob_service.py                       │  │  │
│  │  └──────┬──────────────────────────────────────────┘  │  │
│  │         │                                             │  │
│  │  ┌──────▼──────────────────────────────────────────┐  │  │
│  │  │  DATA ACCESS LAYER (CRUD + Models)             │  │  │
│  │  │  ├── models/ (SQLAlchemy ORM)                   │  │  │
│  │  │  ├── crud/ (Database operations)                │  │  │
│  │  │  └── schemas/ (Pydantic validation)             │  │  │
│  │  └──────┬───────────────────────────────────────┘  │  │
│  │         │                                           │  │
│  └─────────┼───────────────────────────────────────────┘  │
│            │                                               │
│ MIDDLEWARE: CORS, JWT Authentication, Error Handling       │
└────────────┼───────────────────────────────────────────────┘
             │
┌────────────┼───────────────────────────────────────────────┐
│            │      PERSISTENCE TIER                         │
│            │                                               │
│  ┌─────────▼──────────────┐        ┌──────────────────┐  │
│  │   MySQL Database       │        │ Azure Blob       │  │
│  │   (SQLAlchemy ORM)     │        │ Storage          │  │
│  │                        │        │ (Audio, Images,  │  │
│  │   ├── users            │        │  Subtitles)      │  │
│  │   ├── admins           │        │                  │  │
│  │   └── podcasts         │        │                  │  │
│  └────────────────────────┘        └──────────────────┘  │
│                                                           │
└───────────────────────────────────────────────────────────┘
```

---

## 2. Component Architecture

### 2.1 Backend Components (FastAPI)

#### **Core Structure**
```
fastapi-auth-app/
├── app/
│   ├── main.py                 # FastAPI app initialization, CORS config
│   ├── api/                    # Route handlers
│   │   ├── auth.py            # Authentication endpoints
│   │   ├── admin.py           # Admin management endpoints
│   │   └── podcast.py         # Podcast management endpoints
│   ├── core/
│   │   └── security.py        # JWT, password hashing utilities
│   ├── models/                # SQLAlchemy ORM models
│   │   ├── user.py           # User model
│   │   ├── admin.py          # Admin model
│   │   └── podcast.py        # Podcast model
│   ├── schemas/              # Pydantic validation schemas
│   │   ├── user.py          # User schemas
│   │   ├── admin.py         # Admin schemas
│   │   └── podcast.py       # Podcast schemas
│   ├── crud/                 # Database operations
│   │   ├── user.py          # User CRUD
│   │   ├── admin.py         # Admin CRUD
│   │   └── podcast.py       # Podcast CRUD
│   ├── services/            # Business logic
│   │   ├── auth_services.py      # Auth logic
│   │   ├── admin_services.py     # Admin operations
│   │   ├── podcast_service.py    # Podcast management
│   │   └── azure_blob_service.py # Cloud storage
│   └── db/
│       └── database.py      # SQLAlchemy session, engine config
└── run.py                   # Uvicorn entry point
```

#### **Key Components**

| Component | Purpose | Key Functions |
|-----------|---------|---|
| **auth.py** | Authentication API routes | `POST /auth/register`, `POST /auth/login` |
| **podcast.py** | Podcast management | `GET /podcast/`, `POST /podcast/upload`, `GET /podcast/latest` |
| **admin.py** | User/admin management | User listing, deletion, updates |
| **security.py** | Security utilities | JWT token creation/validation, password hashing |
| **podcast_service.py** | Upload handling | File validation, Azure Blob upload, metadata extraction |
| **azure_blob_service.py** | Cloud storage | Upload to Azure, file organization, URL generation |

### 2.2 Frontend Applications

#### **FrontEndPodCastPlayer** (Public Player)
- **Purpose**: Public-facing podcast player application
- **Tech Stack**: Vanilla JavaScript, Vite, MSAL Browser
- **Entry Point**: `index.html` / `podcast.html`
- **Key Files**: 
  - `src/main.js` - Authentication & initialization
  - `src/podcast.js` - Playback logic
  - `src/podcast_1.js` - Additional player features
- **Features**: Audio playback, subtitle support (EN, ES, FR, DE), responsive UI

#### **FrontEndInternalUserAdmin** (Admin Panel)
- **Purpose**: Internal admin interface for podcast management
- **Tech Stack**: Vanilla JavaScript, Vite, MSAL Browser
- **Entry Points**: `index.html` (main), `upload.html` (upload)
- **Key Files**:
  - `src/main.js` - Dashboard & user management
  - `src/upload.js` - Podcast upload form
- **Features**: Podcast upload, media management

#### **SSOLogin** (Authentication Demo)
- **Purpose**: Single Sign-On demonstration using Azure Entra ID
- **Tech Stack**: Vanilla JavaScript, Vite, MSAL Browser 5.9.0
- **Features**: MSAL-based authentication, Azure AD integration

---

## 3. Data Flow Architecture

### 3.1 Authentication Flow
```
Frontend (Login)
    │
    ├─→ POST /auth/login
    │   └─→ auth_services.login_user()
    │       ├─→ Hash & verify password
    │       ├─→ Generate JWT token
    │       └─→ Return token
    │
    └─→ Store token (localStorage/SessionStorage)
        └─→ Include in subsequent requests (Authorization header)
```

### 3.2 Podcast Upload Flow
```
Admin Frontend (upload.html)
    │
    ├─→ Validate files (audio, image, subtitles)
    │
    ├─→ POST /podcast/upload (multipart/form-data)
    │   └─→ handle_podcast_upload()
    │       ├─→ Validate file types & sizes
    │       ├─→ Upload to Azure Blob Storage
    │       │   ├─→ audio/{filename}
    │       │   ├─→ images/{filename}
    │       │   └─→ subtitles/{filename}
    │       ├─→ Extract metadata (duration, etc.)
    │       ├─→ Store metadata in MySQL
    │       └─→ Return podcast object
    │
    └─→ Admin receives confirmation & URL references
```

### 3.3 Podcast Retrieval & Playback
```
Public Frontend (podcast.html)
    │
    ├─→ GET /podcast/?page=0&size=7 (paginated list)
    │   └─→ Database query with pagination
    │       └─→ Return podcast list + pagination metadata
    │
    ├─→ GET /podcast/latest (recent podcasts)
    │   └─→ Database query (ORDER BY id DESC LIMIT 7)
    │
    └─→ Stream audio from Azure Blob URL
        └─→ <audio> tag plays audio stream
        └─→ Load and parse VTT subtitles
```

---

## 4. Database Schema

### **ER Diagram**
```
┌─────────────────┐         ┌──────────────────┐
│     users       │         │     admins       │
├─────────────────┤         ├──────────────────┤
│ id (PK)         │         │ id (PK)          │
│ username (UQ)   │         │ username (UQ)    │
│ email (UQ)      │         │ email (UQ)       │
│ hashed_password │         │ hashed_password  │
│ is_active       │         │ is_active        │
└─────────────────┘         └──────────────────┘
                           
        ┌──────────────────────────────┐
        │       podcasts               │
        ├──────────────────────────────┤
        │ id (PK)                      │
        │ episode_number               │
        │ title                        │
        │ subtitle                     │
        │ image (URL)                  │
        │ audio_src (URL)              │
        │ duration                     │
        │ date                         │
        │ subtitles (JSON)             │
        │ {                            │
        │   "en": "url_to_en.vtt",    │
        │   "es": "url_to_es.vtt",    │
        │   "fr": "url_to_fr.vtt",    │
        │   "de": "url_to_de.vtt"     │
        │ }                            │
        └──────────────────────────────┘
```

### **Table Definitions**

#### **users**
```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);
```

#### **admins**
```sql
CREATE TABLE admins (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);
```

#### **podcasts**
```sql
CREATE TABLE podcasts (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    episode_number INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    subtitle VARCHAR(255),
    image VARCHAR(500) NOT NULL,
    audio_src VARCHAR(500) NOT NULL,
    duration VARCHAR(50),
    date VARCHAR(50),
    subtitles JSON
);
```

---

## 5. API Architecture

### 5.1 REST API Endpoints

#### **Authentication** (`/auth`)
| Method | Endpoint | Purpose | Request | Response |
|--------|----------|---------|---------|----------|
| POST | `/auth/register` | Register new user | `{username, email, password}` | `{id, username, email}` |
| POST | `/auth/login` | Authenticate user | `{email, password}` | `{access_token, token_type}` |

#### **Podcasts** (`/podcast`)
| Method | Endpoint | Purpose | Query Params | Response |
|--------|----------|---------|--------------|----------|
| GET | `/podcast/` | List podcasts (paginated) | `page=0&size=7` | `{podcasts[], total, page, size, totalPages}` |
| GET | `/podcast/latest` | Get latest 7 podcasts | - | `{podcasts[], count}` |
| POST | `/podcast/upload` | Upload new podcast | - | `{id, title, episode_number, ...}` |

#### **Admin** (`/admin`)
| Method | Endpoint | Purpose | Response |
|--------|----------|---------|----------|
| GET | `/admin/users` | List all users | `{users[]}` |
| PUT | `/admin/user/{id}` | Update user | `{id, username, email, is_active}` |
| DELETE | `/admin/user/{id}` | Delete user | `{status: "deleted"}` |

### 5.2 CORS Configuration
```python
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "*").split(",")

CORSMiddleware(
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)
```

### 5.3 Request/Response Flow
```
Client Request
    ├─→ Add Auth Header (JWT Token)
    ├─→ Send to API
    │
    └─→ Server
        ├─→ Check CORS
        ├─→ Validate JWT (if required)
        ├─→ Route to handler
        ├─→ Execute business logic
        ├─→ Query database
        ├─→ Return response
        │
        └─→ Client receives JSON response
```

---

## 6. Security Architecture

### 6.1 Authentication & Authorization
- **Method**: JWT (JSON Web Tokens)
- **Algorithm**: HS256
- **Token Duration**: 1 hour
- **Storage**: LocalStorage (Frontend)

### 6.2 Password Security
- **Hashing**: Bcrypt (passlib)
- **Verification**: Bcrypt comparison

### 6.3 Azure AD Integration (SSO)
- **Library**: MSAL Browser (Microsoft Authentication Library)
- **Provider**: Azure Entra ID
- **Flow**: OAuth 2.0 / OIDC

### 6.4 CORS Protection
- Whitelist allowed origins
- Control HTTP methods
- Restrict headers

---

## 7. Technology Stack

### Backend
| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Framework | FastAPI | Latest | REST API framework |
| Server | Uvicorn | 0.46.0 | ASGI server |
| Database | MySQL | - | Data persistence |
| ORM | SQLAlchemy | - | Object-relational mapping |
| Auth | PyJWT | - | JWT tokens |
| Password | Passlib + Bcrypt | <4.1 | Password hashing |
| Validation | Pydantic | - | Data validation |
| Storage | Azure Blob | 12.28.0 | Cloud file storage |
| Env | python-dotenv | - | Environment config |

### Frontend
| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Framework | Vanilla JS | - | Core language |
| Bundler | Vite | ^5.0.0 | Build tool |
| Auth | MSAL Browser | 3.26.1 / 5.9.0 | SSO authentication |
| Audio | HTML5 Audio API | - | Playback |

### Infrastructure
| Component | Technology | Purpose |
|-----------|-----------|---------|
| Hosting | Azure App Service | Backend hosting |
| Storage | Azure Blob Storage | Media files |
| Database | Azure Database for MySQL | Data persistence |
| CDN | Azure CDN | Static content delivery |
| Auth | Azure Entra ID | Enterprise SSO |

---

## 8. Deployment Architecture

### 8.1 Development Environment
```
Local Development
├── Backend: http://localhost:8000
│   ├── FastAPI on Uvicorn
│   ├── MySQL (local/docker)
│   └── Azure Storage Emulator (optional)
│
├── Frontend Admin: http://localhost:5173
│   └── Vite dev server
│
├── Frontend Player: http://localhost:5174
│   └── Vite dev server
│
└── SSOLogin: http://localhost:5175
    └── Vite dev server
```

### 8.2 Production Deployment (Azure)
```
Azure Production
├── Backend
│   ├── Azure App Service (Linux, Python 3.x)
│   ├── Environment Variables (Secrets)
│   └── Continuous Deployment (GitHub Actions)
│
├── Frontend Admin
│   ├── Azure Static Web Apps
│   └── CI/CD Pipeline
│
├── Frontend Player
│   ├── Azure Static Web Apps
│   └── CI/CD Pipeline
│
├── Database
│   └── Azure Database for MySQL
│
└── Storage
    └── Azure Blob Storage
        ├── /podcasts/audio/{id}
        ├── /podcasts/images/{id}
        └── /podcasts/subtitles/{id}
```

### 8.3 CI/CD Pipeline
```
GitHub Repository
    ├─→ Trigger on push/PR
    │
    ├─→ Backend Jobs
    │   ├─ Run tests
    │   ├─ Build Docker image (optional)
    │   ├─ Push to Azure Container Registry
    │   └─ Deploy to App Service
    │
    └─→ Frontend Jobs
        ├─ Run tests
        ├─ Build (npm run build)
        ├─ Deploy to Static Web Apps
        └─ Cache invalidation
```

---

## 9. Performance Considerations

### 9.1 Backend Optimization
- **Database Indexing**: Primary keys, unique constraints
- **Pagination**: Default 7 items per page
- **Caching**: Consider Redis for frequent queries
- **Async Support**: FastAPI's async capabilities

### 9.2 Frontend Optimization
- **Code Splitting**: Vite handles bundling
- **Lazy Loading**: Load subtitles on demand
- **Asset Optimization**: Image compression, audio streaming
- **Network**: CDN for static assets

### 9.3 Scalability
- **Horizontal Scaling**: API servers behind load balancer
- **Database Scaling**: Read replicas for reads
- **Storage**: Azure Blob Storage (auto-scaling)
- **CDN**: For static content distribution

---

## 10. Development Workflow

### 10.1 Local Setup
```bash
# Backend
cd fastapi-auth-app
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python run.py

# Frontend Admin
cd FrontEndInternalUserAdmin
npm install
npm run dev

# Frontend Player
cd FrontEndPodCastPlayer/vanillajs
npm install
npm run dev

# SSOLogin
cd SSOLogin
npm install
npm run dev
```

### 10.2 Environment Configuration
```
Backend (.env):
- DATABASE_URL
- SECRET_KEY
- AZURE_STORAGE_CONNECTION_STRING
- ALLOWED_ORIGINS
- ADMIN_EMAIL / ADMIN_PASSWORD

Frontend (.env):
- VITE_API_BASE_URL
- VITE_MSAL_CLIENT_ID
- VITE_MSAL_AUTHORITY
```

### 10.3 Testing Strategy
- **Unit Tests**: Service layer logic
- **Integration Tests**: API endpoints
- **E2E Tests**: User workflows
- **Frontend Tests**: Component interactions

---

## 11. Key Design Patterns

### 11.1 Service Layer Pattern
```python
# Layer separation
API (routes) → Services (business logic) → CRUD → Database
```

### 11.2 Dependency Injection
```python
# FastAPI's Depends for database sessions
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/register")
def register(user: UserCreate, db: Session = Depends(get_db)):
    return register_user(db, user)
```

### 11.3 Schema Validation
```python
# Pydantic for input/output validation
class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
```

---

## 12. Future Enhancements

1. **API Versioning**: /api/v1/, /api/v2/
2. **WebSocket Support**: Real-time notifications
3. **Database Replication**: High availability
4. **Advanced Caching**: Redis integration
5. **Analytics**: User behavior tracking
6. **Search**: Full-text podcast search
7. **Comments/Ratings**: User engagement
8. **Recommendations**: ML-based suggestions
9. **Mobile App**: React Native/Flutter
10. **Monitoring**: Application Insights, Logging

---

## 13. Troubleshooting & Support

### Common Issues
- **CORS Errors**: Check `ALLOWED_ORIGINS` env var
- **Database Connection**: Verify MySQL credentials & connection string
- **Azure Storage**: Check connection string & container permissions
- **JWT Token Expired**: Implement token refresh mechanism
- **File Upload Fails**: Check file size limits & MIME types

### Monitoring
- Backend logs: Uvicorn stdout/stderr
- Frontend errors: Browser console
- Database logs: MySQL query logs
- Azure Monitor: Application insights

---

## 14. Repository Structure Map

```
FullStackApp/
├── ARCHITECTURE.md          ← You are here
├── README.MD
├── .github/                 ← GitHub Actions CI/CD
├── fastapi-auth-app/        ← Backend (Python/FastAPI)
├── FrontEndPodCastPlayer/   ← Podcast Player (VanillaJS)
├── FrontEndInternalUserAdmin/ ← Admin Panel (VanillaJS)
├── SSOLogin/                ← SSO Demo (VanillaJS + MSAL)
└── Swark/                   ← [To be documented]
```

---

**Last Updated**: 2026-05-18
**Version**: 1.0
**Maintainer**: Development Team
