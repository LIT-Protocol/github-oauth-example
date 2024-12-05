import { useState, useEffect } from "react";
import type { SigResponse } from "@lit-protocol/types";

import GitHubLoginButton from "./GitHubLoginButton";
import GitHubCallback from "./GitHubCallback";
import { mintPkp } from "./mintPkp";
import { GitHubUser } from "./types";
import { getPkpSessionSigs } from "./getPkpSessionSigs";
import type { GitHubAuthData, MintedPkp, PkpSessionSigs } from "./types";
import { pkpSign } from "./pkpSign";

function App() {
  const [githubAuthData, setGithubAuthData] = useState<GitHubAuthData | null>(
    null
  );
  const [mintedPkp, setMintedPkp] = useState<MintedPkp | null>(null);
  const [pkpSessionSigs, setPkpSessionSigs] = useState<PkpSessionSigs | null>(
    null
  );
  const [validationError, setValidationError] = useState<string | null>(null);
  const [signedData, setSignedData] = useState<SigResponse | null>(null);
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

  const handleMintPkp = async () => {
    if (githubAuthData) {
      try {
        const minted = await mintPkp(githubAuthData.userData);
        setMintedPkp(minted!);
      } catch (error) {
        console.error("Failed to mint PKP:", error);
        setValidationError("Failed to mint PKP. Please try again.");
      }
    }
  };

  const handleGetPkpSessionSigs = async () => {
    if (githubAuthData && mintedPkp) {
      try {
        console.log(
          "🔄 Getting PKP session signatures with PKP Token ID:",
          mintedPkp.tokenId
        );
        const sessionSigs = await getPkpSessionSigs(githubAuthData, mintedPkp);
        setPkpSessionSigs(sessionSigs);
      } catch (error) {
        console.error("Failed to get PKP session signatures:", error);
        setValidationError(
          "Failed to get PKP session signatures. Please try again."
        );
      }
    }
  };

  const handleSignData = async () => {
    if (pkpSessionSigs && mintedPkp) {
      try {
        const signature = await pkpSign(
          pkpSessionSigs,
          mintedPkp.publicKey,
          messageToSign || "Please enter a message"
        );
        setSignedData(signature!);
      } catch (error) {
        console.error("Failed to sign data with PKP:", error);
        setValidationError("Failed to sign data with PKP. Please try again.");
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
            <pre>{JSON.stringify(githubAuthData.userData, null, 2)}</pre>
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
          <h4>Step 2: Mint PKP</h4>
          <button onClick={handleMintPkp} disabled={!!mintedPkp}>
            {mintedPkp ? "PKP Minted" : "Mint PKP"}
          </button>
          {mintedPkp && (
            <div>
              <p>Successfully minted PKP!</p>
              <p>Check the JavaScript console for PKP info</p>
            </div>
          )}
          <hr />
        </div>
      )}

      {mintedPkp && (
        <div className="card">
          <h4>Step 3: Get PKP Session Signatures</h4>
          <button onClick={handleGetPkpSessionSigs} disabled={!!pkpSessionSigs}>
            {pkpSessionSigs ? "Session Sigs Retrieved" : "Get PKP Session Sigs"}
          </button>
          {pkpSessionSigs && (
            <div>
              <p>Successfully generated Session Signatures!</p>
              <p>Check the JavaScript console for Session Sigs info</p>
            </div>
          )}
          <hr />
        </div>
      )}

      {pkpSessionSigs && (
        <div className="card">
          <h4>Step 4: Sign Data with PKP</h4>
          <div style={{ marginBottom: "1rem" }}>
            <input
              type="text"
              value={messageToSign}
              onChange={(e) => setMessageToSign(e.target.value)}
              placeholder="Enter a message to sign"
              style={{
                padding: "0.5rem",
                marginRight: "1rem",
                width: "300px",
              }}
            />
            <button
              onClick={handleSignData}
              disabled={!!signedData || !messageToSign}
            >
              {signedData ? "Data Signed" : "Sign Data with PKP"}
            </button>
          </div>
          {signedData && (
            <div>
              <p>Successfully signed data with PKP!</p>
              <pre>{JSON.stringify(signedData, null, 2)}</pre>
            </div>
          )}
          <hr />
        </div>
      )}
    </div>
  );
}

export default App;
