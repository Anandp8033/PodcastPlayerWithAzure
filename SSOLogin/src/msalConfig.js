export const msalConfig = {
  auth: {
    clientId: '46078cc6-8cd5-4ea7-875f-a518fd774121',
    authority: 'https://login.microsoftonline.com/01ac7e3b-ed0e-4541-be5b-03e3799d0f03',

    // ✅ BACK TO MAIN APP
    redirectUri: "http://localhost:4173"
  },
  cache: {
    cacheLocation: "localStorage"
  }
};

export const loginRequest = {
  scopes: ['openid', 'profile', 'User.Read']
};
``