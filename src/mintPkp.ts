import {
  AUTH_METHOD_SCOPE,
  AUTH_METHOD_TYPE,
  LIT_NETWORK,
} from "@lit-protocol/constants";
import bs58 from "bs58";

import { type GitHubUser } from "./types";
import {
  getEthersSigner,
  getGithubAuthMethodInfo,
  getLitActionCodeIpfsCid,
  getLitContractsClient,
  getPkpInfoFromMintReceipt,
  getPkpMintCost,
} from "./utils";

const LitNetwork =
LIT_NETWORK[import.meta.env.VITE_LIT_NETWORK as keyof typeof LIT_NETWORK];

export const mintPkp = async (githubUser: GitHubUser) => {
  try {
    const ethersSigner = await getEthersSigner();
    const litContracts = await getLitContractsClient(ethersSigner, LitNetwork);
    const pkpMintCost = await getPkpMintCost(litContracts);
    const {
      authMethodType: githubAuthMethodType,
      authMethodId: githubAuthMethodId,
    } = getGithubAuthMethodInfo(githubUser);

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

    return getPkpInfoFromMintReceipt(receipt, litContracts);
  } catch (error) {
    console.error(error);
  }
};
