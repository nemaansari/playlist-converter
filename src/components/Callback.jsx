import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { CLIENT_ID, REDIRECT_URI, TOKEN_ENDPOINT } from "../spotifyConfig";

function Callback() {
  const navigate = useNavigate();
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const handleCallback = async () => {
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

          // Trigger a custom event to notify other components of token change
          window.dispatchEvent(new CustomEvent("tokenUpdate"));

          // Navigate back to main page
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
  }, [navigate]);

  return (
    <div className="center-page">
      <p>Logging you in...</p>
    </div>
  );
}

export default Callback;
