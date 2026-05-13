# SSOLogin

A minimal Vite + vanilla JavaScript sample app that authenticates using Microsoft Entra ID and displays the signed-in user's details.

## Setup

1. Register an application in Microsoft Entra ID (Azure Active Directory).
2. Configure the app registration:
   - Redirect URI: `http://localhost:4173`
   - API permissions: `User.Read`
   - Grant admin consent for your tenant.
3. Copy the `Application (client) ID` and `Directory (tenant) ID`.
4. Open `src/msalConfig.js` and replace:
   - `clientId` with your application client ID
   - `authority` with your tenant-specific authority if needed

## Run locally

```bash
cd SSOLogin
npm install
npm run dev
```

Then open `http://localhost:4173` in your browser.

## Notes

- This sample uses `@azure/msal-browser`.
- The app signs in with a popup and loads user profile data from Microsoft Graph.
