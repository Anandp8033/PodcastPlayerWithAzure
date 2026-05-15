import { PublicClientApplication } from "@azure/msal-browser";

// ==========================================
// Admin Upload Script
// ==========================================

const API_BASE_URL = 'http://localhost:8000';

const msalConfig = {
    auth: {
        clientId: import.meta.env.VITE_MSAL_CLIENT_ID,
        authority: import.meta.env.VITE_MSAL_AUTHORITY,
        redirectUri: "https://proud-dune-0e720f900.7.azurestaticapps.net",
    },
    cache: {
        cacheLocation: 'sessionStorage',
    }
};

let msalInstance = null;

async function initMsal() {
    try {
        msalInstance = new PublicClientApplication(msalConfig);
        await msalInstance.initialize();
    } catch (error) {
        console.error('MSAL initialization error:', error);
    }
}

// Store uploaded file data
let uploadFile = null;
let audioDuration = null;

// ==========================================
// Check Authentication
// ==========================================
document.addEventListener('DOMContentLoaded', async function() {
    console.log('✅ Upload page loaded: Token already validated in HTML head');

    await initMsal();
    
    // Show body (was hidden to prevent flicker)
    document.body.style.display = 'block';

    // Initialize file drop zone
    initializeDropZone();
    
    // Handle form submission
    const uploadForm = document.getElementById('upload-form');
    if (uploadForm) {
        uploadForm.addEventListener('submit', handleUpload);
    }
});

// ==========================================
// File Drop Zone
// ==========================================
function initializeDropZone() {
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('audio-file');

    if (!dropZone || !fileInput) return;

    // Click to browse
    dropZone.addEventListener('click', () => fileInput.click());

    // File input change
    fileInput.addEventListener('change', handleFileSelect);

    // Drag and drop events
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('drag-over');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('drag-over');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            processFile(files[0]);
        }
    });
}

function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        processFile(file);
    }
}

function processFile(file) {
    // Validate file type
    if (!file.type.startsWith('audio/')) {
        showUploadMessage('Please select a valid audio file!', 'error');
        return;
    }

    // Show file preview
    const preview = document.getElementById('audio-preview');
    const fileName = document.getElementById('file-name');
    const fileSize = document.getElementById('file-size');
    const durationEl = document.getElementById('audio-duration');

    preview.classList.remove('d-none');
    fileName.textContent = file.name;
    fileSize.textContent = formatFileSize(file.size);

    // Calculate audio duration
    const audio = new Audio();
    audio.src = URL.createObjectURL(file);
    
    audio.addEventListener('loadedmetadata', () => {
        const duration = formatDuration(audio.duration);
        durationEl.textContent = duration;
        audioDuration = duration;
        URL.revokeObjectURL(audio.src);
    });

    audio.addEventListener('error', () => {
        durationEl.textContent = 'Unknown';
        audioDuration = 'Unknown';
        URL.revokeObjectURL(audio.src);
    });

    // Store file for upload
    uploadFile = file;
}

function formatDuration(seconds) {
    if (!seconds || isNaN(seconds)) return 'Unknown';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}m ${secs}s`;
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// ==========================================
// Upload Handler
// ==========================================
async function handleUpload(e) {
    e.preventDefault();
    hideUploadMessage();
    console.log('🚀 Starting upload process...');
    const token = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
    const file = uploadFile;

    if (!file) {
        showUploadMessage('Please select an audio file!', 'error');
        return;
    }

    // Get image file from input
    const imageInput = document.getElementById('episode-image');
    const imageFile = imageInput?.files?.[0];

    // Prepare form data - match backend API field names
    const formData = new FormData();
    formData.append('audio', file);  // Must be 'audio' not 'audio_file'
    formData.append('title', document.getElementById('episode-title').value);
    formData.append('subtitle', document.getElementById('episode-subtitle').value);
    formData.append('episode_number', parseInt(document.getElementById('episode-number').value));
    console.log('📄 Form data prepared:', formData);
    // Add image file if provided
    if (imageFile) {
        formData.append('image', imageFile);
    } else {
        // Use a default image or show error
        showUploadMessage('Please select a cover image!', 'error');
        return;
    }
    
    // Duration will be calculated by backend
    // formData.append('duration', audioDuration);

    // Append subtitle files - match backend field names
    const subtitleInputs = document.querySelectorAll('input[type="file"][data-lang]');
    subtitleInputs.forEach(input => {
        if (input.files[0]) {
            const lang = input.dataset.lang;
            // Backend expects: subtitle_en, subtitle_de, subtitle_es, subtitle_fr
            formData.append(`subtitle_${lang}`, input.files[0]);
        }
    });

    try {
        // API endpoint is /podcast/upload
        const response = await fetch(`${API_BASE_URL}/podcast/upload`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
            body: formData,
        });

        const data = await response.json();

        if (response.ok) {
            showUploadMessage(`Episode uploaded successfully! Duration: ${data.duration || 'calculated by backend'}`, 'success');
            resetForm();
        } else {
            showUploadMessage(data.detail || 'Upload failed. Please try again.', 'error');
        }
    } catch (error) {
        console.error('Upload error:', error);
        showUploadMessage('Unable to connect to server. Please check if backend is running.', 'error');
    }
}

// ==========================================
// Utility Functions
// ==========================================
function showUploadMessage(message, type) {
    const messageEl = document.getElementById('upload-message');
    if (messageEl) {
        messageEl.textContent = message;
        messageEl.className = `alert alert-${type === 'success' ? 'success' : 'error'}`;
        messageEl.classList.remove('d-none');
    }
}

function hideUploadMessage() {
    const messageEl = document.getElementById('upload-message');
    if (messageEl) {
        messageEl.classList.add('d-none');
    }
}

function resetForm() {
    document.getElementById('upload-form').reset();
    document.getElementById('audio-preview').classList.add('d-none');
    uploadFile = null;
    audioDuration = null;
}

async function logout() {
    localStorage.removeItem('adminToken');
    sessionStorage.removeItem('adminToken');
    sessionStorage.removeItem('ssoToken');
    sessionStorage.removeItem('ssoUser');

    if (msalInstance) {
        const accounts = msalInstance.getAllAccounts();
        if (accounts.length > 0) {
            try {
                await msalInstance.logoutRedirect({
                    account: accounts[0],
                    postLogoutRedirectUri: window.location.origin + '/index.html',
                });
                return;
            } catch (error) {
                console.warn('MSAL logout redirect failed, falling back to local logout', error);
            }
        }
    }

    window.location.replace('./index.html');
}

// Export for global access
window.logout = logout;
window.resetForm = resetForm;
