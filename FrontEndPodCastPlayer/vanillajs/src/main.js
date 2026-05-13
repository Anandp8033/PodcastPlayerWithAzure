import { PublicClientApplication } from "@azure/msal-browser";
// ==========================================
// podcast Authentication Script
// ==========================================

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

// ==========================================
// MSAL Configuration for SSO
// ==========================================
const msalConfig = {
    auth: {
        clientId: import.meta.env.VITE_MSAL_CLIENT_ID,
        authority: import.meta.env.VITE_MSAL_AUTHORITY,
        redirectUri: "http://localhost:3000",
    },
    cache: {
        cacheLocation: "sessionStorage",
    },
};

const loginRequest = {
    scopes: ["openid", "profile", "User.Read"],
};

let msalInstance = null;

/**
 * Initialize MSAL
 */
async function initMsal() {
    try {
        msalInstance = new PublicClientApplication(msalConfig);
        await msalInstance.initialize();
    } catch (error) {
        console.error("MSAL initialization error:", error);
    }
}

async function handleRedirect() {
    if (!msalInstance) {
        return;
    }

    setCheckingStatus("Checking SSO login...");

    try {
        const response = await msalInstance.handleRedirectPromise();

        if (response) {
            console.log("✅ SSO success:", response);
            msalInstance.setActiveAccount(response.account);
            sessionStorage.setItem("ssoToken", response.accessToken);
            sessionStorage.setItem("ssoUser", JSON.stringify(response.account));
            window.location.replace("./podcast.html");
            return;
        }

        const accounts = msalInstance.getAllAccounts();
        if (accounts.length > 0) {
            console.log("✅ Existing SSO session found:", accounts[0]);
            sessionStorage.setItem("ssoUser", JSON.stringify(accounts[0]));
            window.location.replace("./podcast.html");
            return;
        }

        clearCheckingStatus();
    } catch (err) {
        console.error("SSO redirect error:", err);
        clearCheckingStatus();
    }
}

/**
 * Get stored token from localStorage or sessionStorage
 */
function getToken() {
    return (
        localStorage.getItem("podcastToken") ||
        sessionStorage.getItem("podcastToken")
    );
}

/**
 * Store token securely
 */
function storeToken(token, rememberMe = false) {
    if (rememberMe) {
        localStorage.setItem("podcastToken", token);
        sessionStorage.removeItem("podcastToken");
    } else {
        sessionStorage.setItem("podcastToken", token);
        localStorage.removeItem("podcastToken");
    }
}

/**
 * Clear all tokens and logout
 */
function logout() {
    localStorage.removeItem("podcastToken");
    sessionStorage.removeItem("podcastToken");
    sessionStorage.removeItem("ssoToken");
    sessionStorage.removeItem("ssoUser");
    window.location.replace("./index.html");
}

// ==========================================
// Tab Switching
// ==========================================
document.addEventListener("DOMContentLoaded", async function () {
    // Initialize MSAL for SSO
    await initMsal();

    // ✅ process SSO BEFORE anything else
    await handleRedirect();

    //document.getElementById('loader')?.remove();

    // const authContainer = document.querySelector('.auth-main');
    // if (authContainer) {
    //     authContainer.style.visibility = 'visible';
    // }

    // Industry Standard: If logged in, redirect from login page to dashboard
    const token = getToken();
    const ssoToken = sessionStorage.getItem("ssoToken");
    if (token || ssoToken) {
        console.log("✅ User already logged in, redirecting to podcast page");
        window.location.replace("./podcast.html");
        return;
    }

    const toggleButtons = document.querySelectorAll(".btn-toggle");
    const forms = document.querySelectorAll(".auth-form");

    toggleButtons.forEach((btn) => {
        btn.addEventListener("click", function () {
            const targetTab = this.dataset.tab;

            // Update button states
            toggleButtons.forEach((b) => b.classList.remove("active"));
            this.classList.add("active");

            // Show corresponding form
            forms.forEach((form) => {
                form.classList.remove("active");
                if (form.id === `${targetTab}-form`) {
                    form.classList.add("active");
                }
            });
            // Hide message
            hideMessage();
        });
    });

    // Login Form Submit
    const loginForm = document.getElementById("login-form");
    if (loginForm) {
        loginForm.addEventListener("submit", handleLogin);
    }

    // SSO Login Button
    const ssoLoginBtn = document.getElementById("sso-login-btn");
    if (ssoLoginBtn) {
        ssoLoginBtn.addEventListener("click", handleSSOLogin);
    }

    //COMMENTED: Register Form Submit (disabled for now)
    const registerForm = document.getElementById("register-form");
    if (registerForm) {
        registerForm.addEventListener("submit", handleRegister);
    }
});

// ==========================================
// Login Handler
// ==========================================
async function handleLogin(e) {
    e.preventDefault();
    hideMessage();

    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;
    const rememberMe = document.getElementById("remember-me")?.checked || false;

    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (response.ok) {
            // Store token using centralized function
            storeToken(data.access_token, rememberMe);

            showMessage("Login successful! Redirecting...", "success");

            // Redirect immediately with location.replace (no history)
            setTimeout(() => {
                window.location.replace("./podcast.html");
            }, 500);
            // Switch to login tab
            document.querySelector('[data-tab="login"]').click();
        } else {
            showMessage(
                data.detail || "Registration failed. Please try again.",
                "error",
            );
        }
    } catch (error) {
        console.error("Register error:", error);
        showMessage(
            "Unable to connect to server. Please check if backend is running.",
            "error",
        );
    }
}
// ==========================================
// Register Handler
// ==========================================
async function handleRegister(e) {
    e.preventDefault();
    hideMessage();

    const name = document.getElementById("register-name").value;
    const email = document.getElementById("register-email").value;
    const password = document.getElementById("register-password").value;
    const confirmPassword = document.getElementById(
        "register-confirm-password",
    ).value;

    if (password !== confirmPassword) {
        showMessage("Passwords do not match. Please try again.", "error");
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ full_name: name, email, password }),
        });

        const data = await response.json();

        if (response.ok) {
            showMessage("Registration successful! You can now log in.", "success");
            // Optionally switch to login tab
            setTimeout(() => {
                document.querySelector('[data-tab="login"]').click();
            }, 1000);
        } else {
            showMessage(
                data.detail || "Registration failed. Please try again.",
                "error",
            );
        }
    } catch (error) {
        console.error("Register error:", error);
        showMessage(
            "Unable to connect to server. Please check if backend is running.",
            "error",
        );
    }
}

// ==========================================
// SSO Login Handler
// ==========================================
async function handleSSOLogin(e) {
    e.preventDefault();
    hideMessage();

    try {
        showSSOMessage("Redirecting to Microsoft login...", "info");

        if (!msalInstance) {
            showSSOMessage("SSO not initialized. Please refresh the page.", "error");
            return;
        }

        // Initiate login redirect
        await msalInstance.loginRedirect(loginRequest);
    } catch (error) {
        console.error("SSO login error:", error);
        showSSOMessage("SSO login failed. Please try again.", "error");
    }
}

// ==========================================
// Utility Functions
// ==========================================
function showMessage(message, type) {
    const messageEl = document.getElementById("auth-message");
    if (messageEl) {
        messageEl.textContent = message;
        messageEl.className = `alert mt-3 alert-${type === "success" ? "success" : type === "error" ? "danger" : "info"}`;
        messageEl.classList.remove("d-none");
    }
}

function showSSOMessage(message, type) {
    const messageEl = document.getElementById("sso-status");
    if (messageEl) {
        messageEl.textContent = message;
        messageEl.className = `alert alert-${type === "success" ? "success" : type === "error" ? "danger" : "info"}`;
        messageEl.classList.remove("d-none");
    }
}

function hideMessage() {
    const messageEl = document.getElementById("auth-message");
    if (messageEl) {
        messageEl.classList.add("d-none");
    }
    const ssoMessageEl = document.getElementById("sso-status");
    if (ssoMessageEl) {
        ssoMessageEl.classList.add("d-none");
    }
}

function setCheckingStatus(message) {
    const statusEl = document.getElementById("auth-status");
    if (!statusEl) return;

    statusEl.textContent = message;
    statusEl.className = "alert alert-info mb-3";

    document.querySelectorAll(".auth-form").forEach((form) => {
        form.classList.remove("active");
        form.classList.add("d-none");
    });
}

function clearCheckingStatus() {
    const statusEl = document.getElementById("auth-status");
    if (!statusEl) return;

    statusEl.classList.add("d-none");
    document.querySelectorAll(".auth-form").forEach((form) => {
        if (form.id === "login-form") {
            form.classList.add("active");
            form.classList.remove("d-none");
        } else {
            form.classList.remove("active");
            form.classList.remove("d-none");
        }
    });
}

// Export logout for global access (called from onclick in HTML)
window.logout = logout;
