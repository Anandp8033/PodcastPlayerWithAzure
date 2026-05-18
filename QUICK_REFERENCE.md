# Quick Reference & Visual Guide

## Quick Start Commands

### Development
```bash
# Backend
cd fastapi-auth-app && python run.py
# → http://localhost:8000

# Frontend Player
cd FrontEndPodCastPlayer/vanillajs && npm run dev
# → http://localhost:5173

# Admin Panel
cd FrontEndInternalUserAdmin && npm run dev
# → http://localhost:5174

# SSO Demo
cd SSOLogin && npm run dev
# → http://localhost:5175
```

### Testing API
```bash
# Health check
curl http://localhost:8000/docs

# Register user
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@example.com","password":"password123"}'

# Login
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Get podcasts
curl http://localhost:8000/podcast/?page=0&size=7

# Get latest podcasts
curl http://localhost:8000/podcast/latest
```

---

## Architecture Decision Record (ADR)

### ADR-001: Why Vanilla JavaScript for Frontend?

**Decision**: Use vanilla JavaScript instead of React/Vue

**Rationale**:
- Simpler learning curve for students
- No build complexity beyond Vite
- Direct control over DOM
- Smaller bundle size
- Faster initial load

**Consequences**:
- No component reusability
- Manual state management
- More code for complex UIs

**Alternative Considered**: React, Vue, Svelte

---

### ADR-002: Azure Stack Selection

**Decision**: Use Azure App Service + Blob Storage + Static Web Apps

**Rationale**:
- Integrated Microsoft stack
- Easy MSAL integration for SSO
- Scalable infrastructure
- Managed services (less ops)

**Consequences**:
- Vendor lock-in to Azure
- Higher costs at scale
- Learning curve for Azure-specific features

**Alternative Considered**: AWS, GCP, DigitalOcean

---

### ADR-003: SQLAlchemy ORM over Raw SQL

**Decision**: Use SQLAlchemy ORM with Pydantic validation

**Rationale**:
- Type safety with Pydantic
- Migration management
- Protection against SQL injection
- Cleaner code

**Consequences**:
- Slight performance overhead
- Learning curve for ORM concepts
- Debugging can be complex

---

## Sequence Diagrams

### User Authentication Sequence
```
User                Frontend            Backend            Database
 │                     │                   │                  │
 ├─ Enter credentials  │                   │                  │
 │                     │                   │                  │
 │  Submit login form  │                   │                  │
 ├────────────────────>│                   │                  │
 │                     │ POST /auth/login  │                  │
 │                     ├──────────────────>│                  │
 │                     │                   │ Query user       │
 │                     │                   ├─────────────────>│
 │                     │                   │ Return user      │
 │                     │                   │<─────────────────┤
 │                     │                   │ Verify password  │
 │                     │                   │ Generate JWT     │
 │                     │ {token}           │                  │
 │                     │<──────────────────┤                  │
 │ Return token        │                   │                  │
 │<────────────────────┤                   │                  │
 │ Store in localStorage │                 │                  │
 ├─────────────┬────────┤                   │                  │
 │             │        │                   │                  │
 │ (Authenticated Session)                 │                  │
```

### Podcast Upload Sequence
```
Admin               Frontend           Backend            Azure Storage    Database
 │                     │                 │                     │             │
 │ Select files        │                 │                     │             │
 ├────────────────────>│                 │                     │             │
 │                     │ Validate files  │                     │             │
 │                     │ Create FormData │                     │             │
 │                     │                 │                     │             │
 │                     │ POST /upload    │                     │             │
 │                     ├────────────────>│                     │             │
 │                     │                 │ Validate           │             │
 │                     │                 │ Extract metadata   │             │
 │                     │                 │                     │             │
 │                     │                 │ Upload audio       │             │
 │                     │                 ├────────────────────>│             │
 │                     │                 │ Upload image       │             │
 │                     │                 ├────────────────────>│             │
 │                     │                 │ Upload subtitles   │             │
 │                     │                 ├────────────────────>│             │
 │                     │                 │                     │             │
 │                     │                 │ Get URLs            │             │
 │                     │                 │<────────────────────┤             │
 │                     │                 │                     │             │
 │                     │                 │ Insert podcast      │             │
 │                     │                 ├────────────────────────────────> │
 │                     │                 │                     │  Return ID  │
 │                     │                 │                     │  <─────────┤
 │                     │ Podcast object  │                     │             │
 │                     │<────────────────┤                     │             │
 │ Success message     │                 │                     │             │
 │<────────────────────┤                 │                     │             │
```

### Podcast Playback Sequence
```
Listener            Frontend           Backend            Azure Storage    MySQL
 │                     │                 │                     │             │
 │ Load app            │                 │                     │             │
 ├────────────────────>│                 │                     │             │
 │                     │ GET /podcast/latest                  │             │
 │                     ├────────────────>│                     │             │
 │                     │                 │ Query database      │             │
 │                     │                 ├────────────────────────────────> │
 │                     │                 │                     │   Return    │
 │                     │                 │                     │   podcasts <┤
 │                     │                 │                     │             │
 │                     │ Podcast list    │                     │             │
 │                     │<────────────────┤                     │             │
 │ Render thumbnails   │                 │                     │             │
 │<────────────────────┤                 │                     │             │
 │                     │                 │                     │             │
 │ Click podcast       │                 │                     │             │
 ├────────────────────>│                 │                     │             │
 │                     │ Load details    │                     │             │
 │                     │ Fetch VTT       │                     │             │
 │                     │<────────────────────────────────────────────────  │
 │                     │ Stream audio    │                     │             │
 │                     │<────────────────────────────────────>             │
 │ Play audio          │                 │                     │             │
 │<────────────────────┤                 │                     │             │
 │ Display subtitles   │                 │                     │             │
 ├─────────────────────┤ Sync playback  │                     │             │
```

---

## Directory Tree

```
FullStackApp/
│
├── 📄 README.MD                          # Project overview
├── 📄 ARCHITECTURE.md                    # System architecture
├── 📄 COMPONENTS.md                      # Component specifications
├── 📄 DEPLOYMENT.md                      # Deployment guide
├── 📄 QUICK_REFERENCE.md                 # This file
│
├── 📁 fastapi-auth-app/                  # Backend (Python/FastAPI)
│   ├── 📄 run.py                         # Entry point
│   ├── 📄 requirements.txt                # Python dependencies
│   ├── 📁 app/
│   │   ├── 📄 main.py                    # FastAPI app config
│   │   ├── 📁 api/                       # Route handlers
│   │   │   ├── auth.py
│   │   │   ├── podcast.py
│   │   │   └── admin.py
│   │   ├── 📁 models/                    # SQLAlchemy models
│   │   │   ├── user.py
│   │   │   ├── podcast.py
│   │   │   └── admin.py
│   │   ├── 📁 schemas/                   # Pydantic schemas
│   │   │   ├── user.py
│   │   │   ├── podcast.py
│   │   │   └── admin.py
│   │   ├── 📁 crud/                      # Database operations
│   │   │   ├── user.py
│   │   │   ├── podcast.py
│   │   │   └── admin.py
│   │   ├── 📁 services/                  # Business logic
│   │   │   ├── auth_services.py
│   │   │   ├── podcast_service.py
│   │   │   ├── admin_services.py
│   │   │   └── azure_blob_service.py
│   │   ├── 📁 core/
│   │   │   └── security.py               # JWT & password utilities
│   │   └── 📁 db/
│   │       └── database.py               # Database config
│   └── 📁 uploads/                       # Local storage (optional)
│
├── 📁 FrontEndPodCastPlayer/             # Podcast Player (Vanilla JS)
│   ├── vanillajs/
│   │   ├── 📄 index.html                 # Main page
│   │   ├── 📄 podcast.html               # Player page
│   │   ├── 📄 package.json               # npm config
│   │   ├── 📄 vite.config.js
│   │   ├── 📁 src/
│   │   │   ├── main.js                   # Auth & init
│   │   │   ├── podcast.js                # List & pagination
│   │   │   └── podcast_1.js              # Playback & subtitles
│   │   ├── 📁 css/
│   │   │   ├── style.css
│   │   │   └── authPage.css
│   │   └── 📁 public/
│   │       ├── episodes.json
│   │       ├── Audio/
│   │       ├── images/
│   │       └── subtitles/
│   └── dist/                             # Built files
│
├── 📁 FrontEndInternalUserAdmin/         # Admin Panel (Vanilla JS)
│   ├── 📄 index.html                     # Dashboard
│   ├── 📄 upload.html                    # Upload form
│   ├── 📄 package.json
│   ├── 📄 vite.config.js
│   ├── 📁 src/
│   │   ├── main.js                       # Dashboard
│   │   └── upload.js                     # Upload logic
│   ├── 📁 css/
│   │   └── style.css
│   └── dist/                             # Built files
│
├── 📁 SSOLogin/                          # SSO Demo (MSAL)
│   ├── 📄 index.html
│   ├── 📄 package.json
│   ├── 📄 vite.config.js
│   ├── 📁 src/
│   │   ├── main.js
│   │   ├── msalConfig.js
│   │   └── style.css
│   └── dist/                             # Built files
│
├── 📁 Swark/                             # [To be documented]
│
├── 📁 .github/
│   └── workflows/                        # GitHub Actions CI/CD
│       ├── deploy-backend.yml
│       └── deploy-frontend.yml
│
└── 📁 .vscode/
    └── settings.json                     # VS Code config
```

---

## API Response Examples

### Authentication Response
```json
{
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "bearer",
    "expires_in": 3600
}
```

### Podcast List Response
```json
{
    "podcasts": [
        {
            "id": 1,
            "episodeNumber": 1,
            "title": "Introduction to Podcasting",
            "subtitle": "Getting Started",
            "image": "https://podcaststorage.blob.core.windows.net/...",
            "audioSrc": "https://podcaststorage.blob.core.windows.net/...",
            "duration": "45:30",
            "date": "2024-01-15",
            "subtitles": {
                "en": "https://...",
                "es": "https://...",
                "fr": "https://...",
                "de": "https://..."
            }
        }
    ],
    "total": 25,
    "page": 0,
    "size": 7,
    "totalPages": 4
}
```

### Error Response
```json
{
    "detail": "Invalid email or password",
    "status": 401,
    "timestamp": "2024-01-15T10:30:45Z"
}
```

---

## Common Tasks

### Add a New API Endpoint

1. **Create Schema** (`app/schemas/new.py`)
```python
from pydantic import BaseModel

class NewItemCreate(BaseModel):
    name: str
    description: str
```

2. **Create Model** (`app/models/new.py`)
```python
from sqlalchemy import Column, String, Integer
from app.db.database import Base

class NewItem(Base):
    __tablename__ = "new_items"
    id = Column(Integer, primary_key=True)
    name = Column(String(255))
    description = Column(String(500))
```

3. **Create CRUD** (`app/crud/new.py`)
```python
from sqlalchemy.orm import Session
from app.models.new import NewItem

def create_item(db: Session, item_data: dict):
    db_item = NewItem(**item_data)
    db.add(db_item)
    db.commit()
    return db_item
```

4. **Create Router** (`app/api/new.py`)
```python
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.schemas.new import NewItemCreate

router = APIRouter()

@router.post("/")
def create(item: NewItemCreate, db: Session = Depends(get_db)):
    return crud.create_item(db, item.dict())
```

5. **Register Router** (`app/main.py`)
```python
from app.api import new
app.include_router(new.router, prefix="/new", tags=["new"])
```

### Deploy to Azure

```bash
# 1. Build frontend
npm run build

# 2. Deploy backend
az webapp up --resource-group podcast-rg --name podcast-backend

# 3. Deploy frontend
az staticwebapp deploy --resource-group podcast-rg --name podcast-player
```

### Debug Issues

```bash
# Check backend logs
az webapp log tail --resource-group podcast-rg --name podcast-backend

# Test API endpoint
curl -v http://localhost:8000/podcast/

# Check database
mysql -u root -p podcast_db
SHOW TABLES;
SELECT * FROM podcasts;

# Check Azure storage
az storage blob list --account-name podcaststorage --container-name podcasts
```

---

## Key Metrics & Monitoring

### Performance KPIs
| Metric | Target | Current |
|--------|--------|---------|
| API Response Time | < 200ms | - |
| Page Load Time | < 2s | - |
| Audio Stream Quality | 320kbps | - |
| Database Query Time | < 100ms | - |
| CDN Hit Rate | > 90% | - |

### Infrastructure Metrics
```
CPU Usage: < 50%
Memory Usage: < 70%
Storage Usage: Growing
Database Connections: < 20
API Requests/min: Varies
```

---

## Important Files Checklist

- [ ] `ARCHITECTURE.md` - System design
- [ ] `COMPONENTS.md` - Component details
- [ ] `DEPLOYMENT.md` - Deployment guide
- [ ] `requirements.txt` - Python dependencies
- [ ] `package.json` - Frontend dependencies
- [ ] `.env` - Environment variables
- [ ] `.github/workflows/` - CI/CD pipelines
- [ ] `app/main.py` - FastAPI app setup
- [ ] `app/db/database.py` - Database config

---

**Quick Reference Version**: 1.0
**Last Updated**: 2026-05-18
**Maintained By**: Development Team
