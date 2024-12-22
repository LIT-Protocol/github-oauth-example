import { SessionSigs } from "@lit-protocol/types"

export type MintedPkp = {
  tokenId: string;
  publicKey: string;
  ethAddress: string;
};

export type PkpSessionSigs = SessionSigs;

export interface GitHubUser {
  id: number;
  login: string;
  name: string | null;
  auth_date: number;
}

export interface GitHubAuthData {
  userData: GitHubUser;
  accessToken: string;
}
