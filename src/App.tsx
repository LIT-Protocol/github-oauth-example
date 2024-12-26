import { useState } from "react";
import GitHubCallback from "./GitHubCallback";
import { mintPkp } from "./generateWK";
import { GitHubUser } from "./types";
import type { GitHubAuthData, MintedPkp } from "./types";
import { signMessageWithWrappedKey } from "./WKSign";
import "./App.css";
import { GeneratePrivateKeyResult } from "@lit-protocol/wrapped-keys";
import GitHubLoginButton from "./GitHubLoginButton";

function App() {
  const [githubAuthData, setGithubAuthData] = useState<GitHubAuthData | null>(
    null
  );
  const [mintedPkp, setMintedPkp] = useState<MintedPkp | null>(null);
  const [wrappedKey, setWrappedKey] = useState<GeneratePrivateKeyResult | null>(
    null
  );
  const [validationError, setValidationError] = useState<string | null>(null);
  const [signedData, setSignedData] = useState<string | null>(null);
  const [messageToSign, setMessageToSign] = useState<string>("");

  const isCallback = window.location.pathname === "/callback";

  const handleGitHubSuccess = (authData: {
    userData: GitHubUser;
    accessToken: string;
  }) => {
    console.log("GitHub auth response received:", authData.userData);
    setGithubAuthData({
      userData: authData.userData,
      accessToken: authData.accessToken,
    });
    setValidationError(null);
    window.history.pushState({}, "", "/");
  };

  const handleGitHubError = (error: string) => {
    console.error("GitHub auth error:", error);
    setValidationError(error);
    window.history.pushState({}, "", "/");
  };

  const handleGenerateWK = async () => {
    if (githubAuthData) {
      try {
        const result = await mintPkp(githubAuthData);
        setMintedPkp(result!.pkp);
        setWrappedKey(result!.wk);
      } catch (error) {
        console.error("Failed to mint PKP:", error);
        setValidationError("Failed to mint PKP. Please try again.");
      }
    }
  };

  const handleSignData = async () => {
    if (wrappedKey) {
      try {
        const signature = await signMessageWithWrappedKey(
          githubAuthData!,
          wrappedKey,
          mintedPkp!,
          messageToSign
        );
        setSignedData(signature!);
      } catch (error) {
        console.error("Failed to sign data:", error);
        setValidationError("Failed to sign data. Please try again.");
      }
    }
  };

  if (isCallback) {
    return (
      <GitHubCallback
        onSuccess={handleGitHubSuccess}
        onError={handleGitHubError}
      />
    );
  }

  return (
    <div>
      <div className="card">
        <h3>Mint a PKP Using a GitHub Account</h3>
        <hr />
      </div>

      <div className="card">
        <h4>Step 1: Authenticate with GitHub</h4>
        {!githubAuthData ? (
          <GitHubLoginButton
            dataOnauth={(user) =>
              handleGitHubSuccess({
                userData: user,
                accessToken: "",
              })
            }
            buttonSize="large"
          />
        ) : (
          <div>
            <p>Authenticated as:</p>
            <div className="code-wrap">
              {JSON.stringify(githubAuthData.userData, null, 2)}
            </div>
          </div>
        )}
        {validationError && (
          <div className="error-message">
            <p>{validationError}</p>
          </div>
        )}
        <hr />
      </div>

      {githubAuthData && (
        <div className="card">
          <h4>Step 2: Create Solana Wrapped Key</h4>
          <button onClick={handleGenerateWK} disabled={!!wrappedKey}>
            {wrappedKey ? "Wrapped Key Generated" : "Generate Wrapped Key"}
          </button>
          {wrappedKey && (
            <div>
              <p>Successfully generated wrapped key!</p>
              <div>
                <div>
                  <strong>Generated Public Key:</strong>
                  <div className="code-wrap">
                    {wrappedKey.generatedPublicKey}
                  </div>
                </div>
                <div>
                  <strong>Wrapped Key ID:</strong>
                  <div className="code-wrap">{wrappedKey.id}</div>
                </div>
                <div>
                  <strong>ETH Address:</strong>
                  <div className="code-wrap">{wrappedKey.pkpAddress}</div>
                </div>
              </div>
            </div>
          )}
          <hr />
        </div>
      )}

      {wrappedKey && (
        <div className="card">
          <h4>Step 3: Sign Data with WK</h4>
          <div className="input-button-container">
            <input
              type="text"
              value={messageToSign}
              onChange={(e) => setMessageToSign(e.target.value)}
              placeholder="Enter a message to sign"
            />
            <button
              onClick={handleSignData}
              disabled={!!signedData || !messageToSign}
            >
              {signedData ? "Data Signed" : "Sign Data with WK"}
            </button>
          </div>
          {signedData && (
            <div>
              <p>Successfully signed data with WK!</p>
              <div className="code-wrap">
                {JSON.stringify(signedData, null, 2)}
              </div>
            </div>
          )}
          <hr />
        </div>
      )}
    </div>
  );
}

export default App;
