import { LitNodeClient } from "@lit-protocol/lit-node-client";
import { LIT_NETWORK } from "@lit-protocol/constants";
import { GeneratePrivateKeyResult } from "@lit-protocol/wrapped-keys";

import { getLitNodeClient } from "./utils";

import { api } from "@lit-protocol/wrapped-keys";
import { getPkpSessionSigs } from "./getPkpSessionSigs";
import { GitHubAuthData, MintedPkp } from "./types";

const { signMessageWithEncryptedKey } = api;

const LitNetwork =
  LIT_NETWORK[import.meta.env.VITE_LIT_NETWORK as keyof typeof LIT_NETWORK];

export const signMessageWithWrappedKey = async (
  githubAuthData: GitHubAuthData,
  mintedWK: GeneratePrivateKeyResult,
  mintedPkp: MintedPkp,
  messageToSign: string | Uint8Array
) => {
  let litNodeClient: LitNodeClient;
  try {
    console.log("🔄 Signing data with Wrapped Key...");
    litNodeClient = await getLitNodeClient(LitNetwork);

    const pkpSessionSigs = await getPkpSessionSigs(githubAuthData, mintedPkp);

    const res = await signMessageWithEncryptedKey({
      pkpSessionSigs: pkpSessionSigs!,
      network: "solana",
      id: mintedWK.id,
      messageToSign: messageToSign,
      litNodeClient: litNodeClient,
    });
    console.log("✅ Signed data with Wrapped Key:", res);
    return res;
  } catch (error) {
    console.error(error);
  }
};
