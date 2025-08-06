import {
  YOUTUBE_CLIENT_ID,
  YOUTUBE_REDIRECT_URI,
  YOUTUBE_AUTH_ENDPOINT,
  YOUTUBE_TOKEN_ENDPOINT,
  YOUTUBE_SCOPES,
} from "./youtubeConfig.js";

export const isYouTubeLoggedIn = () => {
  return !!localStorage.getItem("youtube_access_token");
};

export const loginToYouTube = async () => {
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);

  sessionStorage.setItem("youtube_code_verifier", codeVerifier);

  const authUrl =
    `${YOUTUBE_AUTH_ENDPOINT}?` +
    `client_id=${YOUTUBE_CLIENT_ID}&` +
    `redirect_uri=${encodeURIComponent(YOUTUBE_REDIRECT_URI)}&` +
    `response_type=code&` +
    `scope=${encodeURIComponent(YOUTUBE_SCOPES.join(" "))}&` +
    `code_challenge=${codeChallenge}&` +
    `code_challenge_method=S256`;

  window.location.href = authUrl;
};

export const handleYouTubeCallback = async (code) => {
  const codeVerifier = sessionStorage.getItem("youtube_code_verifier");

  const response = await fetch(YOUTUBE_TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: YOUTUBE_REDIRECT_URI,
      client_id: YOUTUBE_CLIENT_ID,
      code_verifier: codeVerifier,
    }),
  });

  const data = await response.json();

  if (data.access_token) {
    localStorage.setItem("youtube_access_token", data.access_token);
    sessionStorage.removeItem("youtube_code_verifier");
    return true;
  }
  return false;
};

function generateCodeVerifier() {
  return btoa(
    String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))),
  )
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

async function generateCodeChallenge(verifier) {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}
