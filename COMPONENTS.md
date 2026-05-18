# Component Specification Document

## Backend Components Detailed Specification

### 1. Authentication Service (auth_services.py)

**Purpose**: Handle user registration, login, and token generation

**Key Functions**:
```python
def register_user(db: Session, user: UserCreate)
    - Validate email uniqueness
    - Hash password using bcrypt
    - Create user record
    - Return user object or error

def login_user(db: Session, user: UserLogin)
    - Query user by email
    - Verify password hash
    - Generate JWT token with 1-hour expiration
    - Return token
```

**Dependencies**:
- `passlib`: Password hashing
- `python-jose`: JWT token creation
- `sqlalchemy`: Database ORM

**Error Handling**:
- Duplicate email → HTTPException 400
- Invalid credentials → HTTPException 401
- Invalid input → Pydantic validation error

---

### 2. Podcast Service (podcast_service.py)

**Purpose**: Handle podcast uploads, metadata extraction, and storage management

**Key Functions**:
```python
def handle_podcast_upload(db, form, files)
    - Validate all required files present
    - Extract audio duration using mutagen
    - Upload files to Azure Blob Storage
    - Store metadata in database
    - Return serialized podcast object

def validate_files(files)
    - Check file types (MIME)
    - Check file sizes
    - Check extension whitelist

def extract_metadata(audio_file)
    - Use mutagen to read audio tags
    - Extract duration, bitrate, codec
    - Return metadata dict
```

**File Organization** (Azure Blob):
```
/podcasts/
├── audio/{podcast_id}/{filename}.mp3
├── images/{podcast_id}/{filename}.jpg
└── subtitles/{podcast_id}/{language_code}.vtt
```

**Supported Formats**:
- Audio: MP3, WAV, M4A
- Image: JPG, PNG
- Subtitles: VTT (WebVTT format)

---

### 3. Admin Service (admin_services.py)

**Purpose**: User and admin management operations

**Key Functions**:
```python
def get_all_users(db: Session)
    - Query all users with pagination
    - Return user list without passwords

def update_user(db: Session, user_id: int, update_data)
    - Update user fields (email, is_active)
    - Handle duplicate email errors
    - Return updated user

def delete_user(db: Session, user_id: int)
    - Remove user record
    - Cascade delete user data
    - Return success status
```

---

### 4. Azure Blob Service (azure_blob_service.py)

**Purpose**: Cloud storage operations

**Key Functions**:
```python
def upload_to_blob(file: UploadFile, container: str, blob_name: str)
    - Initialize BlobServiceClient
    - Upload file to specified container
    - Return public URL

def delete_from_blob(blob_name: str, container: str)
    - Delete blob from container
    - Handle not-found errors

def generate_sas_url(blob_name: str, expiry_hours: int)
    - Generate SAS token
    - Create signed URL for temporary access
```

**Connection String Format**:
```
DefaultEndpointsProtocol=https;AccountName=xxx;AccountKey=yyy;EndpointSuffix=core.windows.net
```

---

### 5. Database Models

#### User Model
```python
class User(Base):
    __tablename__ = "users"
    
    id: int (PK)
    username: str (UNIQUE)
    email: str (UNIQUE, VARCHAR 255)
    hashed_password: str
    is_active: bool (DEFAULT True)
```

#### Podcast Model
```python
class Podcast(Base):
    __tablename__ = "podcasts"
    
    id: int (PK)
    episode_number: int
    title: str (VARCHAR 255)
    subtitle: str (VARCHAR 255)
    image: str (URL, VARCHAR 500)
    audio_src: str (URL, VARCHAR 500)
    duration: str (time format)
    date: str (ISO format)
    subtitles: JSON ({
        "en": "url",
        "es": "url",
        ...
    })
```

---

### 6. API Routers

#### auth.py Router
```
POST /auth/register
├─ Input: {username, email, password}
├─ Processing: Validate → Hash → Insert → Generate token
└─ Output: {id, username, email, access_token}

POST /auth/login
├─ Input: {email, password}
├─ Processing: Lookup → Verify → Generate token
└─ Output: {access_token, token_type, expires_in}
```

#### podcast.py Router
```
GET /podcast/
├─ Query: page, size
├─ Processing: Calculate offset → Query → Serialize
└─ Output: {podcasts, total, page, totalPages}

GET /podcast/latest
├─ Processing: Query 7 most recent
└─ Output: {podcasts, count}

POST /podcast/upload
├─ Input: FormData {audio, image, subtitles[], metadata}
├─ Processing: Validate → Upload → Extract metadata → Insert
└─ Output: Podcast object with Azure URLs
```

#### admin.py Router
```
GET /admin/users
├─ Output: List of all user objects

PUT /admin/user/{id}
├─ Input: {email, is_active, ...}
├─ Processing: Validate → Update
└─ Output: Updated user object

DELETE /admin/user/{id}
├─ Processing: Delete user record
└─ Output: {status: "deleted"}
```

---

## Frontend Components Specification

### 1. Podcast Player Frontend

**Structure**: `FrontEndPodCastPlayer/vanillajs/`

**Entry Points**:
- `index.html` - Main page
- `podcast.html` - Player page

**Key Modules**:
```javascript
main.js
├─ MSAL configuration
├─ Authentication flow
├─ User state management
└─ Page routing

podcast.js
├─ Fetch podcasts from API
├─ Render podcast list
├─ Handle pagination
└─ Initialize player

podcast_1.js
├─ Audio element control
├─ Subtitle loading & parsing
├─ Playback controls
├─ Time synchronization
```

**API Calls**:
```javascript
// Fetch podcasts
GET /podcast/?page=0&size=7

// Fetch latest
GET /podcast/latest

// Get podcast details
GET /podcast/{id}

// User login
POST /auth/login {email, password}
```

**State Management**:
```javascript
const appState = {
    user: null,
    currentPodcast: null,
    podcasts: [],
    currentPage: 0,
    subtitles: {},
    isPlaying: false
}
```

---

### 2. Admin Panel Frontend

**Structure**: `FrontEndInternalUserAdmin/`

**Entry Points**:
- `index.html` - Dashboard
- `upload.html` - Upload form

**Key Modules**:
```javascript
main.js
├─ Dashboard initialization
├─ User listing
├─ User management UI
└─ Navigation

upload.js
├─ Form validation
├─ File selection
├─ Progress tracking
├─ Submit to backend
└─ Success/error handling
```

**Upload Form Fields**:
```
- Episode Number (required, int)
- Title (required, string)
- Subtitle (required, string)
- Audio File (required, .mp3/.wav/.m4a)
- Image File (required, .jpg/.png)
- Subtitle EN (optional, .vtt)
- Subtitle ES (optional, .vtt)
- Subtitle FR (optional, .vtt)
- Subtitle DE (optional, .vtt)
```

**API Calls**:
```javascript
// Upload podcast
POST /podcast/upload (multipart/form-data)

// Get users
GET /admin/users

// Update user
PUT /admin/user/{id}

// Delete user
DELETE /admin/user/{id}
```

---

### 3. SSO Login Frontend

**Structure**: `SSOLogin/`

**Purpose**: Azure AD authentication demo

**Key Components**:
```javascript
main.js
├─ MSAL Client initialization
├─ Login trigger
├─ Token acquisition
└─ Redirect logic

msalConfig.js
├─ Client ID
├─ Authority URL
├─ Redirect URIs
└─ Scopes
```

**MSAL Configuration**:
```javascript
const msalConfig = {
    auth: {
        clientId: "YOUR_CLIENT_ID",
        authority: "https://login.microsoftonline.com/{TENANT_ID}",
        redirectUri: "http://localhost:3000/redirect",
    }
}
```

---

## Data Flow Patterns

### 1. Authentication Flow
```
User Input (Credentials)
    ↓
Frontend validates format
    ↓
POST /auth/login
    ↓
Backend lookup user
    ↓
Verify password hash
    ↓
Generate JWT token
    ↓
Return token to frontend
    ↓
Frontend stores in localStorage
    ↓
Include in subsequent requests (Authorization: Bearer token)
```

### 2. File Upload Flow
```
User selects files (Admin)
    ↓
Frontend validates:
    - File types
    - File sizes
    - Required fields
    ↓
Create FormData
    ↓
POST /podcast/upload
    ↓
Backend validates
    ↓
Extract metadata (duration)
    ↓
Upload to Azure Blob:
    - /podcasts/audio/{id}/filename
    - /podcasts/images/{id}/filename
    - /podcasts/subtitles/{id}/lang.vtt
    ↓
Get URLs from Azure
    ↓
Store in MySQL with URLs
    ↓
Return podcast object
    ↓
Frontend shows success
```

### 3. Playback Flow
```
Player loads
    ↓
Fetch latest podcasts
    ↓
GET /podcast/latest
    ↓
Database returns podcast list
    ↓
Frontend renders thumbnails
    ↓
User clicks podcast
    ↓
Load podcast details
    ↓
<audio> streams from Azure URL
    ↓
Load VTT subtitles
    ↓
Sync with playback
```

---

## Error Handling Strategy

### Backend Error Responses
```python
# Authentication Error
{
    "detail": "Invalid email or password",
    "status": 401
}

# Validation Error
{
    "detail": [
        {
            "loc": ["body", "email"],
            "msg": "invalid email format",
            "type": "value_error.email"
        }
    ]
}

# Server Error
{
    "detail": "Internal server error",
    "status": 500
}
```

### Frontend Error Handling
```javascript
fetch(url)
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .catch(error => {
        console.error('Error:', error);
        showErrorMessage(error.message);
    })
```

---

## Performance Optimization

### Backend
- Query pagination (default 7 items)
- Database indexes on frequently queried fields
- Connection pooling with SQLAlchemy
- Async request handling

### Frontend
- Lazy load subtitles
- Image optimization/compression
- Vite code splitting
- Local caching of user preferences

### Infrastructure
- Azure Blob CDN for media files
- Database read replicas
- Static Web Apps for frontend caching

---

## Testing Specifications

### Unit Tests
```python
# auth_services_test.py
test_register_user_success()
test_register_user_duplicate_email()
test_login_user_valid_credentials()
test_login_user_invalid_password()
test_jwt_token_generation()
```

### Integration Tests
```python
# test_api_endpoints.py
test_auth_register_endpoint()
test_auth_login_endpoint()
test_podcast_upload_endpoint()
test_podcast_get_endpoint()
test_admin_users_endpoint()
```

### Frontend Tests
```javascript
// main_test.js
test_msal_authentication()
test_fetch_podcasts()
test_render_podcast_list()
test_file_upload_validation()
test_audio_playback()
```

---

## Configuration & Environment Variables

### Backend (.env)
```
DATABASE_URL=mysql+pymysql://user:pass@localhost/podcast_db
SECRET_KEY=your-secret-key-min-32-chars
AZURE_STORAGE_CONNECTION_STRING=...
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=secure_password
```

### Frontend (.env.local)
```
VITE_API_BASE_URL=http://localhost:8000
VITE_MSAL_CLIENT_ID=your-app-id
VITE_MSAL_AUTHORITY=https://login.microsoftonline.com/common
```

---

## Deployment Checklist

- [ ] Database migrations applied
- [ ] Environment variables configured
- [ ] CORS origins updated
- [ ] Azure storage credentials set
- [ ] Frontend built (`npm run build`)
- [ ] Backend tests passing
- [ ] Frontend tests passing
- [ ] API documentation generated
- [ ] Security headers configured
- [ ] SSL/TLS enabled
- [ ] Logging configured
- [ ] Monitoring enabled

---

**Version**: 1.0
**Last Updated**: 2026-05-18
