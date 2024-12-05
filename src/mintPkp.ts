import {
  AuthMethodScope,
  AuthMethodType,
  LitNetwork,
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

const LIT_NETWORK =
  LitNetwork[import.meta.env.VITE_LIT_NETWORK as keyof typeof LitNetwork];

export const mintPkp = async (githubUser: GitHubUser) => {
  try {
    const ethersSigner = await getEthersSigner();
    const litContracts = await getLitContractsClient(ethersSigner, LIT_NETWORK);
    const pkpMintCost = await getPkpMintCost(litContracts);
    const {
      authMethodType: githubAuthMethodType,
      authMethodId: githubAuthMethodId,
    } = getGithubAuthMethodInfo(githubUser);

    console.log("🔄 Minting new PKP...");
    const tx =
      await litContracts.pkpHelperContract.write.mintNextAndAddAuthMethods(
        AuthMethodType.LitAction, // keyType
        [AuthMethodType.LitAction, githubAuthMethodType], // permittedAuthMethodTypes
        [
          `0x${Buffer.from(
            bs58.decode(await getLitActionCodeIpfsCid())
          ).toString("hex")}`,
          githubAuthMethodId,
        ], // permittedAuthMethodIds
        ["0x", "0x"], // permittedAuthMethodPubkeys
        [[AuthMethodScope.SignAnything], [AuthMethodScope.NoPermissions]], // permittedAuthMethodScopes
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
