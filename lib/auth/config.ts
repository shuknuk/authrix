const auth0Required = [
  "AUTH0_DOMAIN",
  "AUTH0_CLIENT_ID",
  "AUTH0_CLIENT_SECRET",
  "AUTH0_SECRET",
] as const;

const githubRequired = ["GITHUB_CLIENT_ID", "GITHUB_CLIENT_SECRET"] as const;

export function isAuth0Configured() {
  return auth0Required.every((key) => Boolean(process.env[key]));
}

export function isGitHubConfigured() {
  return githubRequired.every((key) => Boolean(process.env[key]));
}

export function getAppBaseUrl(requestUrl?: string) {
  if (process.env.APP_BASE_URL) {
    return process.env.APP_BASE_URL;
  }

  if (requestUrl) {
    return new URL(requestUrl).origin;
  }

  return "http://localhost:3000";
}

export function getGitHubCallbackUrl(requestUrl?: string) {
  return (
    process.env.GITHUB_CALLBACK_URL ??
    `${getAppBaseUrl(requestUrl)}/api/github/callback`
  );
}

export function getMissingAuth0Env() {
  return auth0Required.filter((key) => !process.env[key]);
}

export function getMissingGitHubEnv() {
  return githubRequired.filter((key) => !process.env[key]);
}
