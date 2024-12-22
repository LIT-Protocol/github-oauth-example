import { LitNodeClient } from "@lit-protocol/lit-node-client";
import { LIT_NETWORK, LIT_ABILITY } from "@lit-protocol/constants";
import { LitPKPResource } from "@lit-protocol/auth-helpers";

import type { GitHubAuthData, MintedPkp } from "./types";
import { litActionCode } from "./litAction";
import { getCapacityCredit, getEthersSigner, getLitNodeClient } from "./utils";

const LitNetwork =
LIT_NETWORK[import.meta.env.VITE_LIT_NETWORK as keyof typeof LIT_NETWORK];

export const getPkpSessionSigs = async (
  githubAuthData: GitHubAuthData,
  mintedPkp: MintedPkp
) => {
  let litNodeClient: LitNodeClient;

  try {
    const ethersSigner = await getEthersSigner();
    litNodeClient = await getLitNodeClient(LitNetwork);
    const capacityTokenId = await getCapacityCredit(ethersSigner, LitNetwork);

    console.log("🔄 Creating capacityDelegationAuthSig...");
    const { capacityDelegationAuthSig } =
      await litNodeClient.createCapacityDelegationAuthSig({
        dAppOwnerWallet: ethersSigner,
        capacityTokenId,
        delegateeAddresses: [mintedPkp.ethAddress],
        uses: "1",
      });
    console.log(`✅ Created the capacityDelegationAuthSig`);

    console.log(
      `🔄 Getting the Session Sigs for the PKP using Lit Action code string...`
    );
    const sessionSignatures = await litNodeClient.getPkpSessionSigs({
      pkpPublicKey: mintedPkp.publicKey,
      capabilityAuthSigs: [capacityDelegationAuthSig],
      litActionCode: Buffer.from(litActionCode).toString("base64"),
      jsParams: {
        githubUserData: JSON.stringify({
          accessToken: githubAuthData.accessToken,
          userData: githubAuthData.userData,
        }),
        pkpTokenId: mintedPkp.tokenId,
      },
      resourceAbilityRequests: [
        {
          resource: new LitPKPResource("*"),
          ability: LIT_ABILITY.PKPSigning,
        },
      ],
      expiration: new Date(Date.now() + 1000 * 60 * 10).toISOString(), // 10 minutes
    });
    console.log(
      `✅ Got PKP Session Sigs: ${JSON.stringify(sessionSignatures, null, 2)}`
    );
    return sessionSignatures;
  } catch (error) {
    console.error(error);
  }
};
