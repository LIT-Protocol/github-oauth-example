import { ethers } from "ethers";
import { LitNodeClient } from "@lit-protocol/lit-node-client";
import { LIT_NETWORK } from "@lit-protocol/constants";
import { SessionSigs } from "@lit-protocol/types"

import { getLitNodeClient } from "./utils";

const LitNetwork =
LIT_NETWORK[import.meta.env.VITE_LIT_NETWORK as keyof typeof LIT_NETWORK];

export const pkpSign = async (
  litSessionSigs: SessionSigs,
  pkpPublicKey: string,
  dataToSign: string
) => {
  let litNodeClient: LitNodeClient;
  try {
    console.log("🔄 Signing data with PKP...");
    litNodeClient = await getLitNodeClient(LitNetwork);

    const res = await litNodeClient.pkpSign({
      pubKey: pkpPublicKey,
      sessionSigs: litSessionSigs,
      toSign: ethers.utils.arrayify(
        ethers.utils.keccak256(ethers.utils.toUtf8Bytes(dataToSign))
      ),
    });
    console.log("✅ Signed data with PKP:", res);
    return res;
  } catch (error) {
    console.error(error);
  }
};
