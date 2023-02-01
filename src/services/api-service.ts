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

async function loginVendor(accessParams) {
  const { appId, clientId, secretKey } =
    ConfigurationService.getKeys(accessParams);

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

async function createDocumentSourcesAndGroups(payload, accessParams) {
  const { token } = await loginVendor(accessParams);
  await api.post(
    '/document-sources/deploy',
    { items: payload },
    {
      headers: getAuthorizationHeader(token),
    },
  );
}

const ApiService = {
  api,
  loginVendor,
  createDocumentSourcesAndGroups,
};

export default ApiService;
