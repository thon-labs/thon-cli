import axios from 'axios';
import ConfigurationService from './configuration-service';

const api = axios.create({
  baseURL:
    process.env.THON_ENVIRONMENT === 'development'
      ? 'http://localhost:3000/dev'
      : 'https://api.thonlabs.io',
});

function getAuthorizationHeader(token: string) {
  return {
    Authorization: `Bearer ${token}`,
  };
}

async function loginVendor() {
  const { appId, clientId, secretKey } = ConfigurationService.getKeys();

  const { data } = await api.post<{ data: { token: string } }>(
    '/authentications/vendor/login',
    {
      appId,
      clientId,
      secretKey,
    },
  );

  return data.data;
}

async function createRelease() {
  const { token } = await loginVendor();

  const { data } = await api.post<{ data: { id: string; number: number } }>(
    '/document-releases',
    null,
    { headers: getAuthorizationHeader(token) },
  );

  return data.data;
}

const ApiService = {
  api,
  loginVendor,
  createRelease,
};

export default ApiService;
