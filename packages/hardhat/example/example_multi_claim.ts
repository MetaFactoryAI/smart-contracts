import {MultiClaim} from '../lib/merkleTreeHelper';

const exampleClaim: MultiClaim = {
  to: "reservedAddress",
  erc1155: [
    {
      ids: ['1', '2', '3'], // ERC1155 ids e.g. asset IDs
      values: [10, 10, 10], // ERC1155 values e.g. asset values
      contractAddress: "ERC1155Address" // ERC1155 contract address --> MFW
    },
    {
      ids: ['1', '2', '3' ], // ERC1155 ids
      values: [5, 5, 5], // ERC1155 values
      contractAddress: "anotherERC1155Address" // ERC1155 contract address
    },
  ],
  erc721: [
    {
      ids: [1, 2], // ERC721 ids e.g. land IDs
      contractAddress: "ERC721address" // ERC721 contract address e.g. unique MFW
    },
    {
      ids: [1, 2], // ERC721 ids
      contractAddress: "anotherERC721Address" // ERC721 contract address
    }
  ],
  erc20: {
    amounts: [200, 4, 1, 10], // ERC20 amounts
    contractAddresses: ["ERC20address1", "ERC20address2", "ERC20address3", "anotherERC20Address"] // ERC20 contract addresses e.g. ROBOT
  }
}

const userClaim: MultiClaim[] = []


