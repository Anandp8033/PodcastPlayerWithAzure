import { PublicClientApplication, InteractionRequiredAuthError } from '@azure/msal-browser';
import { msalConfig, loginRequest } from './msalConfig.js';

const msalInstance = new PublicClientApplication(msalConfig);

const loginButton = document.getElementById('loginButton');
const logoutButton = document.getElementById('logoutButton');
const statusEl = document.getElementById('status');
const profileEl = document.getElementById('profile');
const userNameEl = document.getElementById('userName');
const userEmailEl = document.getElementById('userEmail');
const userTenantEl = document.getElementById('userTenant');
const userObjectIdEl = document.getElementById('userObjectId');

loginButton.addEventListener('click', signIn);
logoutButton.addEventListener('click', signOut);

// ✅ INIT
initializeApp();

// =======================================================
// ✅ INIT APP
// =======================================================
async function initializeApp() {
  await msalInstance.initialize();

  try {
    const response = await msalInstance.handleRedirectPromise();

    if (response) {
      console.log("✅ Redirect success:", response);

      msalInstance.setActiveAccount(response.account);
      await handleAccount(response.account);
      return;
    }

  } catch (error) {
    console.error("Redirect error:", error);
  }

  // ✅ existing session check
  const accounts = msalInstance.getAllAccounts();
  if (accounts.length > 0) {
    msalInstance.setActiveAccount(accounts[0]);
    await handleAccount(accounts[0]);
  } else {
    setSignedOutUI();
  }
}

// =======================================================
// ✅ LOGIN (REDIRECT FLOW ONLY)
// =======================================================
async function signIn() {
  try {
    statusEl.textContent = 'Signing in...';

    // ✅ ONLY this (no popup)
    await msalInstance.loginRedirect(loginRequest);

  } catch (error) {
    statusEl.textContent = `Login failed: ${error.message}`;
    console.error(error);
  }
}

// =======================================================
// ✅ HANDLE USER
// =======================================================
async function handleAccount(account) {
  if (!account) {
    statusEl.textContent = 'No user account found.';
    return;
  }

  statusEl.textContent = 'Signed in. Loading profile...';

  try {
    const tokenResponse = await msalInstance.acquireTokenSilent({
      ...loginRequest,
      account,
    });

    const graphProfile = await fetchGraphProfile(tokenResponse.accessToken);
    showProfile(graphProfile, account);

    statusEl.textContent = '✅ Signed in successfully';
  } catch (error) {

    if (error instanceof InteractionRequiredAuthError) {
      const tokenResponse = await msalInstance.acquireTokenRedirect({
        ...loginRequest,
        account,
      });
      return;
    }

    statusEl.textContent = `Token error: ${error.message}`;
    console.error(error);
  }
}

// =======================================================
// ✅ GRAPH
// =======================================================
async function fetchGraphProfile(accessToken) {
  const response = await fetch('https://graph.microsoft.com/v1.0/me', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error(`Graph error: ${response.statusText}`);
  }

  return response.json();
}

// =======================================================
// ✅ UI
// =======================================================
function showProfile(graphProfile, account) {
  loginButton.classList.add('hidden');
  logoutButton.classList.remove('hidden');
  profileEl.classList.remove('hidden');

  userNameEl.textContent = graphProfile.displayName || account.name;
  userEmailEl.textContent = graphProfile.mail || graphProfile.userPrincipalName;
  userTenantEl.textContent = account.tenantId;
  userObjectIdEl.textContent = account.homeAccountId;
}

async function signOut() {
  const account = msalInstance.getActiveAccount();
  setSignedOutUI();

  if (account) {
    await msalInstance.logoutRedirect({
      account,
      postLogoutRedirectUri: window.location.origin,
    });
  }
}

function setSignedOutUI() {
  loginButton.classList.remove('hidden');
  logoutButton.classList.add('hidden');
  profileEl.classList.add('hidden');

  statusEl.textContent = 'Not signed in.';
}
