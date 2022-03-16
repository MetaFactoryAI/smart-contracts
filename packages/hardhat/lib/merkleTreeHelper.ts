import {utils} from 'ethers';
const {solidityKeccak256, defaultAbiCoder, keccak256} = utils;
import crypto from 'crypto';

export type MultiClaim = {
  to: string;
  erc1155: Array<ERC1155Claim>;
  erc721: Array<ERC721Claim>;
  erc20: {
    amounts: Array<number>;
    contractAddresses: Array<string>;
  };
  salt?: string;
};

export type ERC1155Claim = {
  ids: Array<string>;
  values: Array<number>;
  contractAddress: string;
};

export type ERC721Claim = {
  ids: Array<number>;
  contractAddress: string;
};

function calculateMultiClaimHash(claim: MultiClaim, salt?: string): string {
  const types = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const values: any = [];
  if (!claim.salt) claim.salt = salt; // Ensure that a salt is included in the claim object to be hashed
  types.push(
    'tuple(address to, tuple(uint256[] ids, uint256[] values, address contractAddress)[] erc1155, tuple(uint256[] ids, address contractAddress)[] erc721, tuple(uint256[] amounts, address[] contractAddresses) erc20, bytes32 salt)'
  );
  values.push(claim);
  return keccak256(defaultAbiCoder.encode(types, values));
}

function saltMultiClaim(
  claims: MultiClaim[],
  secret?: string | Buffer
): Array<MultiClaim> {
  return claims.map((claim) => {
    const salt = claim.salt;
    if (!salt) {
      if (!secret) {
        throw new Error('Claim need to have a salt or be generated via secret');
      }
      const newClaim: MultiClaim = {
        ...claim,
        salt:
          '0x' +
          crypto
            .createHmac('sha256', secret)
            .update(
              calculateMultiClaimHash(
                claim,
                '0x0000000000000000000000000000000000000000000000000000000000000000'
              )
            )
            .digest('hex'),
      };
      return newClaim;
    } else return claim;
  });
}

function createDataArrayMultiClaim(
  claims: MultiClaim[],
  secret?: string
): string[] {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: string[] = [];

  claims.forEach((claim: MultiClaim) => {
    let salt = claim.salt;
    if (!salt) {
      if (!secret) {
        throw new Error('Claim need to have a salt or be generated via secret');
      }
      salt =
        '0x' +
        crypto
          .createHmac('sha256', secret)
          .update(
            calculateMultiClaimHash(
              claim,
              '0x0000000000000000000000000000000000000000000000000000000000000000'
            )
          )
          .digest('hex');
    }
    data.push(calculateMultiClaimHash(claim, salt));
  });

  return data;
}

const helpers = {
  calculateMultiClaimHash,
  saltMultiClaim,
  createDataArrayMultiClaim,
};

export default helpers;
