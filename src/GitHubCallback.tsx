import { useEffect, useRef } from "react";
import { Octokit } from "@octokit/rest";

interface GitHubCallbackProps {
  onSuccess: (authData: { userData: GitHubUser; accessToken: string }) => void;
  onError: (error: string) => void;
}

interface GitHubUser {
  id: number;
  login: string;
  name: string | null;
  auth_date: number;
}

const VITE_GITHUB_OAUTH_SERVER_URL = import.meta.env
  .VITE_GITHUB_OAUTH_SERVER_URL;

const GitHubCallback = ({ onSuccess, onError }: GitHubCallbackProps) => {
  const hasProcessedCode = useRef<boolean>(false);

  useEffect(() => {
    const handleCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get("code");

      if (!code) {
        onError("No code received from GitHub");
        return;
      }

      if (hasProcessedCode.current) return;

      try {
        const tokenResponse = await fetch(
          `${VITE_GITHUB_OAUTH_SERVER_URL}/api/github/token`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code }),
          }
        );

        const tokenData = await tokenResponse.json();

        if (tokenData.error) {
          if (!hasProcessedCode.current) {
            throw new Error(
              tokenData.error_description ||
                tokenData.error ||
                "Failed to get access token"
            );
          }
          return;
        }

        if (!tokenData.access_token) {
          throw new Error("No access token received from GitHub");
        }

        const octokit = new Octokit({ auth: tokenData.access_token });
        const { data: userData } = await octokit.users.getAuthenticated();

        const githubUser: GitHubUser = {
          id: userData.id,
          login: userData.login,
          name: userData.name || userData.login,
          auth_date: Math.floor(Date.now() / 1000),
        };

        hasProcessedCode.current = true;
        onSuccess({
          userData: githubUser,
          accessToken: tokenData.access_token,
        });
      } catch (error) {
        if (!hasProcessedCode.current) {
          console.error("GitHub auth error:", error);
          onError(
            error instanceof Error
              ? error.message
              : "Failed to authenticate with GitHub"
          );
        }
      }
    };

    handleCallback();
  }, [onSuccess, onError]);

  return (
    <div>
      <p>Processing GitHub authentication...</p>
    </div>
  );
};

export default GitHubCallback;
