import fs from 'fs';
import {BigNumber} from 'ethers';
import MerkleTree from '../lib/merkleTree';
import helpers, {MultiClaim} from '../lib/merkleTreeHelper';

const {
  createDataArrayMultiClaim,
  saltMultiClaim,
} = helpers;

export function createClaimMerkleTree(
  isDeploymentChainId: boolean,
  chainId: string,
  claimData: Array<MultiClaim>,
  claimContract: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any {
  let secretPath = `../secret/mfw-giveaway/.${claimContract.toLowerCase()}_secret`;
  if (BigNumber.from(chainId).toString() === '1') {
    console.log('MAINNET secret');
    secretPath = `../secret/mfw-giveaway/.${claimContract.toLowerCase()}_secret.mainnet`;
  }

  let expose = false;
  let secret;
  const TEST_SECRET = "test";
  try {
    secret = fs.readFileSync(secretPath);
  } catch (e) {
    if (isDeploymentChainId) {
      throw e;
    }
    // Make sure you have a secret file for deployments to live networks (mainnet, live test networks)
    // Secrets are located at packages/.secret/mfw-giveaway
    // isDeploymentChainId is true for live networks (see hardhat deploy network.live)
  }

  if (!isDeploymentChainId) {
    expose = true;
    secret = TEST_SECRET;
  }

  const saltedClaims = saltMultiClaim(claimData, secret);
  const tree = new MerkleTree(
    createDataArrayMultiClaim(saltedClaims)
  );
  const merkleRootHash = tree.getRoot().hash;

  return {
    claims: expose ? saltedClaims : claimData,
    merkleRootHash,
    saltedClaims,
    tree,
  };
}
