const msal = require('@azure/msal-node');

const config = {
  auth: {
    clientId: '****',
    authority: `https://login.microsoftonline.com/472ac88b-bd43-4c0a-9432-c04963bfc704`,
    clientSecret: '****',
  },
};

const cca = new msal.ConfidentialClientApplication(config);

const tokenRequest = {
  scopes: ['https://graph.microsoft.com/.default'],
};

cca.acquireTokenByClientCredential(tokenRequest)
  .then(response => {
    console.log('Access token:', response.accessToken);
  })
  .catch(err => {
    console.error('Error acquiring token:', err);
  });