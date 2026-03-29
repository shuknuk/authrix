import { Auth0Client } from "@auth0/nextjs-auth0/server";

const auth0Env = {
  domain: process.env.AUTH0_DOMAIN,
  clientId: process.env.AUTH0_CLIENT_ID,
  clientSecret: process.env.AUTH0_CLIENT_SECRET,
  secret: process.env.AUTH0_SECRET,
  appBaseUrl: process.env.APP_BASE_URL,
} as const;

export const isAuthConfigured = Boolean(
  auth0Env.domain &&
    auth0Env.clientId &&
    auth0Env.clientSecret &&
    auth0Env.secret
);

export const auth0 = isAuthConfigured
  ? new Auth0Client({
      domain: auth0Env.domain,
      clientId: auth0Env.clientId,
      clientSecret: auth0Env.clientSecret,
      secret: auth0Env.secret,
      appBaseUrl: auth0Env.appBaseUrl,
      signInReturnToPath: "/dashboard",
      enableConnectAccountEndpoint: true,
      enableAccessTokenEndpoint: false,
      authorizationParameters: {
        scope: "openid profile email offline_access",
      },
    })
  : null;
