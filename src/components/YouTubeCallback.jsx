import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { handleYouTubeCallback } from "../youtubeAuth";

function YouTubeCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      const code = new URLSearchParams(window.location.search).get("code");

      if (!code) {
        navigate("/");
        return;
      }

      try {
        const success = await handleYouTubeCallback(code);
        if (success) {
          console.log('YouTube login successful!');
          navigate(-1); 
        } else {
          console.error('YouTube login failed');
          navigate("/");
        }
      } catch (error) {
        console.error('YouTube callback error:', error);
        navigate("/");
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="center-page">
      <p>Connecting to YouTube...</p>
    </div>
  );
}

export default YouTubeCallback;