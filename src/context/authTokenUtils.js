let jwtDecodePackage = null;
try {
  jwtDecodePackage = require('jwt-decode');
} catch {
  jwtDecodePackage = null;
}

const jwtDecode = jwtDecodePackage?.jwtDecode || jwtDecodePackage;

const decodeBase64Url = (value) => {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=');

  if (typeof Buffer !== 'undefined') {
    return Buffer.from(padded, 'base64').toString('utf8');
  }

  if (typeof atob !== 'undefined') {
    return decodeURIComponent(
      Array.prototype.map.call(atob(padded), (character) => {
        return `%${character.charCodeAt(0).toString(16).padStart(2, '0')}`;
      }).join('')
    );
  }

  throw new Error('No base64 decoder is available.');
};

const decodeJwtPayload = (jwt) => {
  if (!jwt || typeof jwt !== 'string') return null;

  if (jwtDecode) {
    try {
      return jwtDecode(jwt);
    } catch {
      return null;
    }
  }

  const parts = jwt.split('.');
  if (parts.length < 2) return null;

  try {
    return JSON.parse(decodeBase64Url(parts[1]));
  } catch {
    return null;
  }
};

const getCurrentEpochSeconds = () => Math.floor(Date.now() / 1000);

const isTokenExpiredOrInvalid = (jwt, nowSeconds = getCurrentEpochSeconds()) => {
  const payload = decodeJwtPayload(jwt);
  if (!payload?.exp) return true;
  return payload.exp <= nowSeconds;
};

const isTokenExpiringSoon = (jwt, leadSeconds = 5 * 60, nowSeconds = getCurrentEpochSeconds()) => {
  const payload = decodeJwtPayload(jwt);
  if (!payload?.exp) return true;
  return payload.exp <= nowSeconds + leadSeconds;
};

module.exports = {
  decodeJwtPayload,
  isTokenExpiredOrInvalid,
  isTokenExpiringSoon,
};
