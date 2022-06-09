/**
 * How to use:
 *  - yarn run hardhat --network localhost run ./scripts/newGiveaway.js
 */

const fs = require('fs-extra');
const hre = require('hardhat');
 
 const {createClaimMerkleTree} = require('../data/getClaims.ts');
 const helpers = require('../lib/merkleTreeHelper.ts');
 const { calculateMultiClaimHash } = helpers.default;

const claimContract = "MFWGiveaway"; // the name of the directory in data/ as well as the name of the contract
const claimFile = "DemoGiveawayRinkeby2"; // TODO: the name of the claim file in data/

 const func = async function () {
   const {deployments, network, getChainId, getNamedAccounts} = hre;
   const {execute, read, catchUnknownSigner} = deployments;
   const chainId = await getChainId();

  const {mfwGiveawayAdmin} = await getNamedAccounts();
 
   let claimData;
   try {
     claimData = fs.readJSONSync(
       `data/${claimContract.toLowerCase()}/${claimFile}.json`
     );
   } catch (e) {
     console.log('Error', e);
     return;
   }
 
   const {merkleRootHash, saltedClaims, tree} = createClaimMerkleTree(
     network.live,
     chainId,
     claimData,
     claimContract
   );
 
   const contractAddresses = [];
   const addAddress = (address) => {
     address = address.toLowerCase();
     if (!contractAddresses.includes(address)) contractAddresses.push(address);
   };
   claimData.forEach((claim) => {
     claim.erc1155.forEach((erc1155) => addAddress(erc1155.contractAddress));
     claim.erc721.forEach((erc721) => addAddress(erc721.contractAddress));
     claim.erc20.contractAddresses.forEach((erc20) => addAddress(erc20));
   });
   const allDeployments = Object.values(await deployments.all());
   for (const contractAddress of contractAddresses) {
     const deployment = allDeployments.find(
       (d) => d.address.toLowerCase() === contractAddress
     );
     if (!deployment) {
       console.warn(`Contract ${contractAddress} not found`);
     }
   }
 
   const giveawayContract = await deployments.getOrNull(claimContract);
   if (!giveawayContract) {
     console.log(`No ${claimContract} deployment`);
     return;
   }
 
   await catchUnknownSigner(
     execute(
       claimContract,
       {from: mfwGiveawayAdmin, log: true},
       'addNewGiveaway',
       merkleRootHash,
       '0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF' // do not expire, TODO: check when we want the giveaway to expire
     )
   );
 
   console.log(`New giveaway added with merkleRootHash: ${merkleRootHash}`);
 
   const claimsWithProofs = [];
   for (const claim of saltedClaims) {
     claimsWithProofs.push({
       ...claim,
       proof: tree.getProof(calculateMultiClaimHash(claim)),
     });
   }
   const basePath = `../secret/mfw-giveaway/${network.name}`;
   const proofPath = `${basePath}/.mfw_claims_proofs_${claimFile}_${chainId}.json`;
   const rootHashPath = `${basePath}/.mfw_claims_root_hash_${claimFile}_${chainId}.json`;
   fs.outputJSONSync(proofPath, claimsWithProofs);
   fs.outputFileSync(rootHashPath, merkleRootHash);
   console.log(`Proofs at: ${proofPath}`);
   console.log(`Hash at: ${rootHashPath}`);
 };
 
 module.exports = func;
 
 if (require.main === module) {
   func(hre);
 }

// Etherscan example:
// ["0x0853D03e42d3E14D29E9c1f30fdd8aC17DC4E335",[[["1","2","5"],["4","1","2"],"0xf9a28b227bDaC129eB85Ca3F27F55d1dD9ecFD94"]],[],[[],[]],"0xd56aaf4b796013dac305532b7c5961504a34447f7d69a9e16ecc04ffc8d99bc3"]