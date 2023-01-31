import axios from 'axios';
import ConfigurationService from './configuration-service';
import normalizeString from '../helpers/normalize-string';

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

async function createDocumentSource(payload, token) {
  const { data } = await api.post('/document-sources', payload, {
    headers: getAuthorizationHeader(token),
  });

  return data.data;
}

async function createDocumentSourceGroup(payload, token) {
  const { data } = await api.post<{ data: { slug: string } }>(
    '/document-source-groups',
    payload,
    { headers: getAuthorizationHeader(token) },
  );

  return data.data;
}

async function fetchDocumentSourceGroups(applicationId, clientId) {
  const { data } = await api.get<{ data: { items: { slug: string }[] } }>(
    '/document-source-groups',
    {
      headers: {
        'x-thon-application-id': applicationId,
        'x-thon-client-id': clientId,
      },
    },
  );

  return data.data;
}

async function fetchDocumentSources(applicationId, clientId) {
  const { data } = await api.get<{ data: { items: { slug: string }[] } }>(
    '/document-sources',
    {
      headers: {
        'x-thon-application-id': applicationId,
        'x-thon-client-id': clientId,
      },
    },
  );

  return data.data;
}

async function createDocumentSourcesAndGroups(payload, accessParams) {
  const { token } = await loginVendor(accessParams);
  const { items: existentDocGroups } = await fetchDocumentSourceGroups(
    accessParams.appId,
    accessParams.clientId,
  );
  const existentDocGroupsSlugs = existentDocGroups.map(({ slug }) => slug);

  const { items: existentDocs } = await fetchDocumentSources(
    accessParams.appId,
    accessParams.clientId,
  );
  const existentDocsSlugs = existentDocGroups.map(({ slug }) => slug);

  for (let i = 0; i < payload.length; i++) {
    const { title: value, files } = payload[i];

    if (!existentDocGroupsSlugs.includes(normalizeString(value))) {
      const { slug } = await createDocumentSourceGroup(
        {
          value,
        },
        token,
      );
    }

    for (let j = 0; j < files.length; j++) {
      const { title } = files[j];

      await createDocumentSource(
        {
          title,
          documentSourceGroupSlug: slug,
        },
        token,
      );
    }
  }
}

const ApiService = {
  api,
  loginVendor,
  createDocumentSourcesAndGroups,
};

export default ApiService;
