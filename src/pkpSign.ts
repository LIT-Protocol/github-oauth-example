import { ethers } from "ethers";
import { LitNodeClient } from "@lit-protocol/lit-node-client";
import { LitNetwork } from "@lit-protocol/constants";

import { getLitNodeClient } from "./utils";

const LIT_NETWORK =
  LitNetwork[import.meta.env.VITE_LIT_NETWORK as keyof typeof LitNetwork];

export const pkpSign = async (
  litSessionSigs: any,
  pkpPublicKey: string,
  dataToSign: string
) => {
  let litNodeClient: LitNodeClient;
  try {
    console.log("🔄 Signing data with PKP...");
    litNodeClient = await getLitNodeClient(LIT_NETWORK);

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
