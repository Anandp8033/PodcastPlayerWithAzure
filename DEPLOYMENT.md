# Deployment & Operations Guide

## Local Development Setup

### Prerequisites
- Python 3.10+
- Node.js 16+
- MySQL Server (local or Docker)
- Git

### Backend Setup

```bash
# 1. Navigate to backend
cd fastapi-auth-app

# 2. Create virtual environment
python -m venv venv

# 3. Activate virtual environment
# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

# 4. Install dependencies
pip install -r requirements.txt

# 5. Create .env file
cat > .env << EOF
DATABASE_URL=mysql+pymysql://root:password@localhost:3306/podcast_db
SECRET_KEY=$(python -c "import secrets; print(secrets.token_urlsafe(32))")
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174,http://localhost:5175
AZURE_STORAGE_CONNECTION_STRING=your_connection_string
EOF

# 6. Start backend
python run.py
# Server runs on http://localhost:8000
```

### Frontend Setup

#### Podcast Player
```bash
cd FrontEndPodCastPlayer/vanillajs
npm install
npm run dev
# Server runs on http://localhost:5173
```

#### Admin Panel
```bash
cd FrontEndInternalUserAdmin
npm install
npm run dev
# Server runs on http://localhost:5174
```

#### SSO Login
```bash
cd SSOLogin
npm install
npm run dev
# Server runs on http://localhost:5175
```

### Database Setup

```bash
# Option 1: Docker
docker run --name podcast_mysql \
  -e MYSQL_ROOT_PASSWORD=password \
  -e MYSQL_DATABASE=podcast_db \
  -p 3306:3306 \
  -d mysql:8.0

# Option 2: Manual MySQL
mysql -u root -p << EOF
CREATE DATABASE podcast_db;
USE podcast_db;
-- Tables created automatically by SQLAlchemy
EOF
```

---

## Production Deployment (Azure)

### Architecture Overview
```
┌─────────────────────────────────────────┐
│     Azure Resource Group                │
├─────────────────────────────────────────┤
│                                         │
│  Backend:                               │
│  ├─ App Service (Linux, Python 3.10)   │
│  │  └─ Deployment Slot: staging        │
│  │                                     │
│  Frontend Admin & Player:               │
│  ├─ Static Web App                     │
│  └─ CDN                                │
│                                        │
│  Database:                             │
│  ├─ Azure Database for MySQL           │
│  │  └─ Flexible Server                │
│  │                                    │
│  Storage:                             │
│  ├─ Blob Storage Account              │
│  │  ├─ podcasts container             │
│  │  └─ CDN endpoint                   │
│                                       │
│  Authentication:                      │
│  └─ Azure Entra ID / App Registration│
│                                       │
└─────────────────────────────────────────┘
```

### Step 1: Create Azure Resources

```bash
# Login to Azure
az login

# Create resource group
az group create \
  --name podcast-rg \
  --location eastus

# Create MySQL Database
az mysql flexible-server create \
  --resource-group podcast-rg \
  --name podcast-db-server \
  --admin-user adminuser \
  --admin-password P@ssw0rd123! \
  --sku-name Standard_B1s \
  --tier Burstable \
  --storage-size 32 \
  --version 8.0

# Create Storage Account
az storage account create \
  --resource-group podcast-rg \
  --name podcaststorage \
  --location eastus \
  --kind BlobStorage \
  --access-tier Hot

# Create Blob Container
az storage container create \
  --account-name podcaststorage \
  --name podcasts

# Create App Service Plan
az appservice plan create \
  --resource-group podcast-rg \
  --name podcast-plan \
  --sku B1 \
  --is-linux

# Create App Service
az webapp create \
  --resource-group podcast-rg \
  --plan podcast-plan \
  --name podcast-backend \
  --runtime "PYTHON|3.10"

# Create Static Web App
az staticwebapp create \
  --resource-group podcast-rg \
  --name podcast-player \
  --source https://github.com/YOUR_USERNAME/FullStackApp \
  --location eastus \
  --branch main
```

### Step 2: Configure Environment Variables

```bash
# Backend App Service Configuration
az webapp config appsettings set \
  --resource-group podcast-rg \
  --name podcast-backend \
  --settings \
    DATABASE_URL="mysql+pymysql://adminuser:P@ssw0rd123!@podcast-db-server.mysql.database.azure.com:3306/podcast_db" \
    SECRET_KEY=$(python -c "import secrets; print(secrets.token_urlsafe(32))") \
    AZURE_STORAGE_CONNECTION_STRING="DefaultEndpointsProtocol=https;AccountName=podcaststorage;AccountKey=YOUR_KEY;EndpointSuffix=core.windows.net" \
    ALLOWED_ORIGINS="https://podcast-player.azurestaticapps.net,https://podcast-admin.azurestaticapps.net"
```

### Step 3: Deploy Backend

```bash
# Method 1: Using Git (Recommended)
# Azure will auto-deploy on git push

# Configure deployment source
az webapp deployment source config-zip \
  --resource-group podcast-rg \
  --name podcast-backend \
  --src-path backend.zip

# Method 2: Direct Deployment
cd fastapi-auth-app
az webapp up \
  --resource-group podcast-rg \
  --name podcast-backend \
  --runtime "PYTHON|3.10"
```

### Step 4: Deploy Frontend

```bash
# Build frontend
cd FrontEndPodCastPlayer/vanillajs
npm run build

cd ../../FrontEndInternalUserAdmin
npm run build

# Deploy to Static Web App
az staticwebapp deploy \
  --resource-group podcast-rg \
  --name podcast-player \
  --source-path FrontEndPodCastPlayer/vanillajs/dist

az staticwebapp deploy \
  --resource-group podcast-rg \
  --name podcast-admin \
  --source-path FrontEndInternalUserAdmin/dist
```

### Step 5: Configure CORS

```bash
# Backend CORS settings
az webapp cors add \
  --resource-group podcast-rg \
  --name podcast-backend \
  --allowed-origins "https://podcast-player.azurestaticapps.net" \
  --allowed-origins "https://podcast-admin.azurestaticapps.net"
```

---

## CI/CD Pipeline (GitHub Actions)

### Backend Deployment Workflow

Create `.github/workflows/deploy-backend.yml`:

```yaml
name: Deploy Backend

on:
  push:
    branches: [main]
    paths:
      - 'fastapi-auth-app/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Python
      uses: actions/setup-python@v2
      with:
        python-version: '3.10'
    
    - name: Install dependencies
      run: |
        cd fastapi-auth-app
        pip install -r requirements.txt
        pip install pytest
    
    - name: Run tests
      run: |
        cd fastapi-auth-app
        pytest tests/
    
    - name: Deploy to Azure App Service
      uses: azure/webapps-deploy@v2
      with:
        app-name: podcast-backend
        publish-profile: ${{ secrets.AZURE_PUBLISH_PROFILE }}
        package: ./fastapi-auth-app
```

### Frontend Deployment Workflow

Create `.github/workflows/deploy-frontend.yml`:

```yaml
name: Deploy Frontend

on:
  push:
    branches: [main]
    paths:
      - 'FrontEnd*/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node
      uses: actions/setup-node@v2
      with:
        node-version: '16'
    
    - name: Build Player
      run: |
        cd FrontEndPodCastPlayer/vanillajs
        npm install
        npm run build
    
    - name: Build Admin
      run: |
        cd FrontEndInternalUserAdmin
        npm install
        npm run build
    
    - name: Deploy to Static Web Apps
      uses: Azure/static-web-apps-deploy@v1
      with:
        azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_TOKEN }}
        repo_token: ${{ secrets.GITHUB_TOKEN }}
        action: "upload"
        app_location: "FrontEndPodCastPlayer/vanillajs/dist"
        api_location: ""
        output_location: "dist"
```

---

## Monitoring & Logging

### Application Insights

```python
# Add to fastapi-auth-app/app/main.py
from azure.monitor.opentelemetry import configure_azure_monitor

configure_azure_monitor(connection_string="InstrumentationKey=YOUR_KEY;")

app = FastAPI()
```

### Log Configuration

```python
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)

@app.get("/health")
def health_check():
    logger.info("Health check requested")
    return {"status": "healthy"}
```

### Frontend Error Tracking

```javascript
// Sentry integration example
Sentry.init({
    dsn: "https://key@domain.ingest.sentry.io/id",
    environment: process.env.NODE_ENV,
    tracesSampleRate: 1.0
});
```

---

## Scaling Strategies

### Vertical Scaling
```bash
# Increase App Service SKU
az appservice plan update \
  --resource-group podcast-rg \
  --name podcast-plan \
  --sku P1
```

### Horizontal Scaling
```bash
# Add deployment slots for blue-green deployment
az webapp deployment slot create \
  --resource-group podcast-rg \
  --name podcast-backend \
  --slot staging

# Swap slots
az webapp deployment slot swap \
  --resource-group podcast-rg \
  --name podcast-backend \
  --slot staging
```

### Database Scaling
```bash
# Increase compute tier
az mysql flexible-server update \
  --resource-group podcast-rg \
  --name podcast-db-server \
  --tier GeneralPurpose \
  --sku-name Standard_B2s
```

---

## Backup & Disaster Recovery

### Database Backup
```bash
# Enable automated backups (default: 7 days)
az mysql flexible-server update \
  --resource-group podcast-rg \
  --name podcast-db-server \
  --backup-retention 35

# Manual backup
az mysql flexible-server backup create \
  --resource-group podcast-rg \
  --name podcast-db-server \
  --backup-name manual-backup-$(date +%Y%m%d)

# List backups
az mysql flexible-server backup list \
  --resource-group podcast-rg \
  --name podcast-db-server
```

### Storage Backup
```bash
# Enable blob storage versioning
az storage blob service-properties update \
  --account-name podcaststorage \
  --enable-change-feed true \
  --enable-versioning true

# Geo-redundant storage
az storage account update \
  --resource-group podcast-rg \
  --name podcaststorage \
  --access-tier Hot \
  --kind StorageV2 \
  --sku Standard_RAGRS
```

---

## Security Best Practices

### API Security
```python
# Add API rate limiting
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter

@app.post("/auth/login")
@limiter.limit("5/minute")
def login(request: Request, user: UserLogin):
    # Rate limited to 5 attempts per minute
    pass
```

### SSL/TLS
```bash
# Enable HTTPS
az webapp update \
  --resource-group podcast-rg \
  --name podcast-backend \
  --set httpsOnly=true

# Add SSL certificate
az appservice plan create \
  --resource-group podcast-rg \
  --name podcast-plan \
  --sku B1 \
  --is-linux \
  --query "id" \
  --output tsv | \
  xargs -I {} az webapp ssl bind \
    --resource-group podcast-rg \
    --name podcast-backend \
    --certificate-thumbprint THUMBPRINT
```

### Secrets Management
```bash
# Store secrets in Azure Key Vault
az keyvault create \
  --resource-group podcast-rg \
  --name podcast-kv

# Add secret
az keyvault secret set \
  --vault-name podcast-kv \
  --name DatabaseConnectionString \
  --value "mysql+pymysql://..."

# Reference in App Service
az webapp config appsettings set \
  --resource-group podcast-rg \
  --name podcast-backend \
  --settings \
    DATABASE_URL=@Microsoft.KeyVault(SecretUri=https://podcast-kv.vault.azure.net/secrets/DatabaseConnectionString/)
```

---

## Troubleshooting

### Backend Issues

```bash
# Check logs
az webapp log tail \
  --resource-group podcast-rg \
  --name podcast-backend

# SSH into container
az webapp create-remote-connection \
  --resource-group podcast-rg \
  --name podcast-backend

# Restart service
az webapp restart \
  --resource-group podcast-rg \
  --name podcast-backend
```

### Database Issues

```bash
# Connect to MySQL
mysql -h podcast-db-server.mysql.database.azure.com \
  -u adminuser@podcast-db-server \
  -p

# Check connection
SHOW PROCESSLIST;
SHOW STATUS;

# View slow queries
SET GLOBAL slow_query_log = 'ON';
```

### Frontend Issues

```bash
# Check Static Web App logs
az staticwebapp logs list \
  --resource-group podcast-rg \
  --name podcast-player

# View deployment history
az staticwebapp show \
  --resource-group podcast-rg \
  --name podcast-player
```

---

## Cost Optimization

### Recommendations
1. Use **B1 SKU** for low-traffic scenarios
2. Enable **auto-scaling** for traffic spikes
3. Use **Blob Storage** for media (cheaper than App Service)
4. Set **database backup retention** to minimum needed
5. Use **CDN** for static assets to reduce origin requests
6. Monitor **Data Transfer Out** costs

### Cost Monitoring
```bash
# Set up budget alerts
az billing budget create \
  --resource-group podcast-rg \
  --name podcast-budget \
  --amount 50 \
  --threshold 100
```

---

**Version**: 1.0
**Last Updated**: 2026-05-18
**Next Review**: 2026-06-18
