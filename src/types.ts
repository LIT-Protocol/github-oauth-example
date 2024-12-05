export type MintedPkp = {
  tokenId: string;
  publicKey: string;
  ethAddress: string;
};

export type PkpSessionSigs = any;

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
