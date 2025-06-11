import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CLIENT_ID, REDIRECT_URI, TOKEN_ENDPOINT } from "../spotifyConfig";

function Callback() {
  const navigate = useNavigate();

  useEffect(() => {
    let ignore = false;

    const handleCallback = async () => {
      if (ignore) return;
      const code = new URLSearchParams(window.location.search).get("code");
      const codeVerifier = sessionStorage.getItem("spotify_code_verifier");

      if (!code || !codeVerifier) {
        navigate("/");
        return;
      }

      try {
        const response = await fetch(TOKEN_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            grant_type: "authorization_code",
            code,
            redirect_uri: REDIRECT_URI,
            client_id: CLIENT_ID,
            code_verifier: codeVerifier,
          }),
        });

        const data = await response.json();

        if (data.access_token) {
          localStorage.setItem("spotify_access_token", data.access_token);
          sessionStorage.removeItem("spotify_code_verifier");
          navigate("/");
        } else {
          console.error("No access token received:", data);
          navigate("/");
        }
      } catch (error) {
        console.error("Token exchange failed:", error);
        navigate("/");
      }
    };

    handleCallback();

    return () => {
      ignore = true;
    };
  }, [navigate]);

  return <p>Logging you in...</p>;
}

export default Callback;
