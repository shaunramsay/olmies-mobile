// Student and lecturer sign-in (security findings SC-03, SC-05, SC-07).
//
// The server decides which sign-in this host offers (GET /api/v1/auth/methods):
//   * entra      - "Sign in with UTech" (Microsoft Entra ID, authorization code + PKCE). The API
//                  validates the ID token and takes the role from UTech's app-role assignment.
//   * synthetic  - username/password for synthetic sim-/test_ accounts. The server offers this
//                  only in Development and TEST; production builds never see a password form
//                  unless the server says so, and a production server refuses it.
// The app never sends a role, and no demo credentials are compiled into the app.

const SIGN_IN_UNAVAILABLE_CODE = 'institutional_sign_in_unavailable';

// Student sign-in needs a current enrolment confirmed by ISAS. When ISAS cannot be asked the server
// answers 503 academic_record_unavailable; public services keep working without signing in.
const ACADEMIC_RECORD_UNAVAILABLE_CODE = 'academic_record_unavailable';
const ACADEMIC_RECORD_UNAVAILABLE_MESSAGE =
  "Your student status could not be checked with the university's records right now, so student sign-in is unavailable. " +
  'You can still use the campus map, announcements and the public Help Desk without signing in. Please try again later.';
const REAUTHENTICATION_REQUIRED_CODE = 'institutional_reauthentication_required';

const SIGN_IN_UNAVAILABLE_MESSAGE =
  'Student and lecturer sign-in is temporarily unavailable while UTech institutional sign-in is being set up. ' +
  'You can still use the campus map, deals, announcements and the public Help Desk.';

const METHODS_ENDPOINT = '/api/v1/auth/methods';
const PASSWORD_ENDPOINT = '/api/v1/auth/login';
const ENTRA_ENDPOINT = '/api/v1/auth/entra';

const GUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Normalises the server's /auth/methods answer; anything unexpected offers nothing. */
const signInOptions = (methods) => {
  const entra = methods && methods.entra && GUID.test(methods.entra.tenantId || '') && GUID.test(methods.entra.clientId || '')
    ? { tenantId: methods.entra.tenantId, clientId: methods.entra.clientId }
    : null;
  return {
    entra,
    password: methods != null && methods.synthetic === true,
  };
};

const entraIssuer = (tenantId) => `https://login.microsoftonline.com/${tenantId}/v2.0`;

const passwordSignInBody = (username, password, deviceId) => ({
  username: (username || '').trim(),
  password,
  deviceId,
});

const entraSignInBody = (idToken, deviceId) => ({ idToken, deviceId });

const isSignInUnavailable = (status, body) =>
  status === 503 && body != null && body.error === SIGN_IN_UNAVAILABLE_CODE;

const isAcademicRecordUnavailable = (status, body) =>
  status === 503 && body != null && body.error === ACADEMIC_RECORD_UNAVAILABLE_CODE;

const failureMessage = (status, body) => {
  if (isSignInUnavailable(status, body)) return SIGN_IN_UNAVAILABLE_MESSAGE;
  if (isAcademicRecordUnavailable(status, body)) return ACADEMIC_RECORD_UNAVAILABLE_MESSAGE;
  if (status === 403) return (body && body.error) || 'This account has no current OLMIES access.';
  if (status === 429) return 'Too many failed attempts. Please wait 15 minutes and try again.';
  return 'Sign-in failed. Please check your details and try again.';
};

module.exports = {
  ACADEMIC_RECORD_UNAVAILABLE_CODE,
  ACADEMIC_RECORD_UNAVAILABLE_MESSAGE,
  REAUTHENTICATION_REQUIRED_CODE,
  isAcademicRecordUnavailable,
  ENTRA_ENDPOINT,
  METHODS_ENDPOINT,
  PASSWORD_ENDPOINT,
  SIGN_IN_UNAVAILABLE_CODE,
  SIGN_IN_UNAVAILABLE_MESSAGE,
  entraIssuer,
  entraSignInBody,
  failureMessage,
  isSignInUnavailable,
  passwordSignInBody,
  signInOptions,
};
