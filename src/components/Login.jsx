import React from "react";
import {
  CLIENT_ID,
  REDIRECT_URI,
  AUTH_ENDPOINT,
  RESPONSE_TYPE,
  SCOPES,
} from "../spotifyConfig";

const scopes = SCOPES.join("%20");

const Login = () => {
  const authUrl = `${AUTH_ENDPOINT}?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=${RESPONSE_TYPE}&scope=${scopes}`;

  return (
    <div>
      <a href={authUrl}>
        <button>Login with Spotify</button>
      </a>
    </div>
  );
};

export default Login;
