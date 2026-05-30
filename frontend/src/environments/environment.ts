// API URL is derived from the page's hostname so the same dev build works
// when accessed via localhost or via the host's LAN IP from another device.
const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';

export const environment = {
  production: false,
  apiUrl: `http://${host}:3000/api`,
};
