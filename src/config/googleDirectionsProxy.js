import API_BASE_URL from './api';

const GOOGLE_DIRECTIONS_URL = 'https://maps.googleapis.com/maps/api/directions/json';
const BACKEND_DIRECTIONS_PATH = '/api/v1/mobile/map/directions';

const getOriginalFetch = () => {
  if (!global.__olmiesOriginalFetch) {
    global.__olmiesOriginalFetch = global.fetch.bind(global);
  }

  return global.__olmiesOriginalFetch;
};

const getQueryParam = (url, paramName) => {
  const queryString = url.split('?')[1] || '';
  const pairs = queryString.split('&').filter(Boolean);

  for (const pair of pairs) {
    const [rawKey, rawValue = ''] = pair.split('=');
    const key = decodeURIComponent(rawKey.replace(/\+/g, ' '));
    if (key === paramName) {
      return decodeURIComponent(rawValue.replace(/\+/g, ' '));
    }
  }

  return null;
};

const parseLatLng = (value) => {
  if (!value) return null;

  const [latValue, lngValue] = value.split(',');
  const latitude = Number.parseFloat(latValue);
  const longitude = Number.parseFloat(lngValue);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  return { latitude, longitude };
};

const createJsonResponse = (payload) => {
  const body = JSON.stringify(payload);

  if (typeof Response !== 'undefined') {
    return new Response(body, {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return {
    ok: true,
    status: 200,
    json: async () => payload,
    text: async () => body,
    headers: { get: () => 'application/json' },
  };
};

const parseBackendErrorPayload = (status, body) => {
  try {
    const payload = JSON.parse(body);
    if (payload?.status) return payload;
  } catch (error) {
    // Fall through to a compact backend status payload.
  }

  return {
    status: 'BACKEND_ERROR',
    error_message: body || `Backend route request failed with HTTP ${status}.`,
    routes: [],
  };
};

export const installGoogleDirectionsProxy = (getToken = () => null) => {
  global.__olmiesDirectionsProxyGetToken = getToken;

  if (global.__olmiesDirectionsProxyInstalled) {
    return;
  }

  const originalFetch = getOriginalFetch();

  global.fetch = async (input, init) => {
    const requestUrl = typeof input === 'string' ? input : input?.url;

    if (typeof requestUrl === 'string' && requestUrl.startsWith(GOOGLE_DIRECTIONS_URL)) {
      const origin = parseLatLng(getQueryParam(requestUrl, 'origin'));
      const destination = parseLatLng(getQueryParam(requestUrl, 'destination'));
      const mode = getQueryParam(requestUrl, 'mode') || 'walking';

      if (!API_BASE_URL) {
        console.warn('[CampusMap] Directions proxy skipped: API base URL is not configured.');
        return createJsonResponse({
          status: 'CONFIGURATION_ERROR',
          error_message: 'Mobile API base URL is not configured.',
          routes: [],
        });
      }

      if (!origin || !destination) {
        console.warn('[CampusMap] Directions proxy rejected malformed coordinates.', { mode });
        return createJsonResponse({
          status: 'INVALID_REQUEST',
          error_message: 'Origin and destination coordinates are invalid.',
          routes: [],
        });
      }

      try {
        const token = global.__olmiesDirectionsProxyGetToken?.();
        const headers = { 'Content-Type': 'application/json' };
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }

        const backendResponse = await originalFetch(`${API_BASE_URL}${BACKEND_DIRECTIONS_PATH}`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ origin, destination, mode }),
        });

        if (!backendResponse.ok) {
          const body = await backendResponse.text().catch(() => '');
          const payload = parseBackendErrorPayload(backendResponse.status, body);
          console.warn('[CampusMap] Backend directions route failed.', {
            status: backendResponse.status,
            routeStatus: payload.status,
            errorMessage: payload.error_message,
          });
          return createJsonResponse(payload);
        }

        return backendResponse;
      } catch (error) {
        console.warn('[CampusMap] Backend directions route request failed.', error);
        return createJsonResponse({
          status: 'BACKEND_ERROR',
          error_message: error?.message || 'The mobile API route request failed.',
          routes: [],
        });
      }
    }

    return originalFetch(input, init);
  };

  global.__olmiesDirectionsProxyInstalled = true;
};
