import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { handleYouTubeCallback } from "../youtubeAuth";

function YouTubeCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState("Connecting to YouTube...");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (isProcessing) return;

    const handleCallback = async () => {
      setIsProcessing(true);
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get("code");

        if (!code) {
          setStatus("Error: No authorization code received");
          setTimeout(() => navigate("/"), 3000);
          return;
        }

        setStatus("Authorizing with YouTube...");
        const success = await handleYouTubeCallback(code);

        if (success) {
          setStatus("Successfully connected to YouTube!");
          setTimeout(() => navigate("/"), 1500);
        } else {
          setStatus("Failed to connect to YouTube. Please try again.");
          setTimeout(() => navigate("/"), 3000);
        }
      } catch (error) {
        console.error("YouTube callback error:", error);
        setStatus("An error occurred. Please try again.");
        setTimeout(() => navigate("/"), 3000);
      }
    };

    handleCallback();
  }, [navigate, isProcessing]);

  return (
    <div className="center-page">
      <p>{status}</p>
    </div>
  );
}

export default YouTubeCallback;
