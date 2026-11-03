// Security finding SC-07: demo logins exist only in development builds.
//
// Previously the demo buttons (and the synthetic /api/v1/auth/testing/login route) were enabled in
// any build whose API URL contained "olmies-ai-test", or when EXPO_PUBLIC_ENABLE_DEMO_LOGIN was
// set at build time, so distributed preview APKs advertised shared test credentials. Now only a
// __DEV__ build (Metro / Expo Go on a developer machine) shows them, and the server only honours
// them in its Development environment.

const SIGN_IN_UNAVAILABLE_CODE = 'institutional_sign_in_unavailable';

const SIGN_IN_UNAVAILABLE_MESSAGE =
  'Student and lecturer sign-in is temporarily unavailable while UTech institutional sign-in is being set up. ' +
  'You can still use the campus map, deals, announcements and the public Help Desk.';

const shouldShowDemoAccounts = (isDevBuild) => isDevBuild === true;

const isDemoAccount = (username, isDevBuild) =>
  shouldShowDemoAccounts(isDevBuild) && (username === 'test_student' || username === 'test_lecturer');

const loginEndpointFor = (username, isDevBuild) =>
  isDemoAccount(username, isDevBuild) ? '/api/v1/auth/testing/login' : '/api/v1/auth/login';

const isSignInUnavailable = (status, body) =>
  status === 503 && body != null && body.error === SIGN_IN_UNAVAILABLE_CODE;

module.exports = {
  SIGN_IN_UNAVAILABLE_CODE,
  SIGN_IN_UNAVAILABLE_MESSAGE,
  isDemoAccount,
  isSignInUnavailable,
  loginEndpointFor,
  shouldShowDemoAccounts,
};
