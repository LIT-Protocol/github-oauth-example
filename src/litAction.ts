// @ts-nocheck

const _litActionCode = async () => {
  const LIT_PKP_PERMISSIONS_CONTRACT_ADDRESS =
    "0x60C1ddC8b9e38F730F0e7B70A2F84C1A98A69167";
  const GITHUB_AUTH_METHOD_TYPE = ethers.utils.keccak256(
    ethers.utils.toUtf8Bytes("Lit Developer Guide GitHub Auth Example")
  );

  try {
    const { accessToken, userData: _githubUserData } =
      JSON.parse(githubUserData);

    // Verify the access token with GitHub
    const verifyResponse = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (!verifyResponse.ok) {
      return Lit.Actions.setResponse({
        response: "false",
        reason: "Invalid GitHub access token",
      });
    }

    const verifiedUser = await verifyResponse.json();

    // Verify that the user data matches the verified user
    if (verifiedUser.id !== _githubUserData.id) {
      return Lit.Actions.setResponse({
        response: "false",
        reason: "GitHub user ID mismatch",
      });
    }

    // Validate that the GitHub user data is recent
    const isRecent = Date.now() / 1000 - _githubUserData.auth_date < 600;
    if (!isRecent) {
      return Lit.Actions.setResponse({
        response: "false",
        reason: "Authenticated GitHub user data is older than 10 minutes",
      });
    }

    // Checking if usersAuthMethodId is a permitted Auth Method for pkpTokenId
    const usersAuthMethodId = ethers.utils.keccak256(
      ethers.utils.toUtf8Bytes(`github:${_githubUserData.id}`)
    );

    const isPermitted = await Lit.Actions.isPermittedAuthMethod({
      tokenId: pkpTokenId,
      authMethodType: GITHUB_AUTH_METHOD_TYPE,
      userId: ethers.utils.arrayify(usersAuthMethodId),
    });

    if (!isPermitted) {
      return Lit.Actions.setResponse({
        response: "false",
        reason: "GitHub user is not authorized to use this PKP",
      });
    }

    return Lit.Actions.setResponse({ response: "true" });
  } catch (error) {
    return Lit.Actions.setResponse({
      response: "false",
      reason: `Error: ${error.message}`,
    });
  }
};

export const litActionCode = `(${_litActionCode.toString()})();`;
