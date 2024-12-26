import {
  AUTH_METHOD_SCOPE,
  AUTH_METHOD_TYPE,
  LIT_NETWORK,
} from "@lit-protocol/constants";
import bs58 from "bs58";

import { type GitHubAuthData } from "./types";
import {
  getEthersSigner,
  getGithubAuthMethodInfo,
  getLitActionCodeIpfsCid,
  getLitContractsClient,
  getLitNodeClient,
  getPkpInfoFromMintReceipt,
  getPkpMintCost,
} from "./utils";

import { LitNodeClient } from "@lit-protocol/lit-node-client";

import { getPkpSessionSigs } from "./getPkpSessionSigs";
import { api } from "@lit-protocol/wrapped-keys";
const { generatePrivateKey } = api;

const LitNetwork =
  LIT_NETWORK[import.meta.env.VITE_LIT_NETWORK as keyof typeof LIT_NETWORK];

export const mintPkp = async (githubAuthData: GitHubAuthData) => {
  try {
    const ethersSigner = await getEthersSigner();
    const litContracts = await getLitContractsClient(ethersSigner, LitNetwork);
    const pkpMintCost = await getPkpMintCost(litContracts);
    const {
      authMethodType: githubAuthMethodType,
      authMethodId: githubAuthMethodId,
    } = getGithubAuthMethodInfo(githubAuthData.userData);

    console.log("🔄 Minting new PKP...");
    const tx =
      await litContracts.pkpHelperContract.write.mintNextAndAddAuthMethods(
        AUTH_METHOD_TYPE.LitAction, // keyType
        [AUTH_METHOD_TYPE.LitAction, githubAuthMethodType], // permittedAuthMethodTypes
        [
          `0x${Buffer.from(
            bs58.decode(await getLitActionCodeIpfsCid())
          ).toString("hex")}`,
          githubAuthMethodId,
        ], // permittedAuthMethodIds
        ["0x", "0x"], // permittedAuthMethodPubkeys
        [[AUTH_METHOD_SCOPE.SignAnything], [AUTH_METHOD_SCOPE.NoPermissions]], // permittedAuthMethodScopes
        true, // addPkpEthAddressAsPermittedAddress
        true, // sendPkpToItself
        { value: pkpMintCost }
      );

    const receipt = await tx.wait();
    console.log(`✅ Minted new PKP`);
    const mintedPkp = await getPkpInfoFromMintReceipt(receipt, litContracts);

    const sessionSigs = await getPkpSessionSigs(githubAuthData, mintedPkp);

    let litNodeClient: LitNodeClient = await getLitNodeClient(LitNetwork);

    console.log("🔄 Generating Wrapped Key...");
    const createWrappedKey = await generatePrivateKey({
      pkpSessionSigs: sessionSigs!,
      network: "solana",
      memo: "This is a test memo",
      litNodeClient: litNodeClient,
    });
    console.log(`✅ Generated Wrapped Key`);

    const result = {
      pkp: mintedPkp,
      wk: createWrappedKey,
    };

    return result;
  } catch (error) {
    console.error(error);
  }
};
