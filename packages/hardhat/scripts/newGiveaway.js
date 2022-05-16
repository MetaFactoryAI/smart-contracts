/**
 * How to use:
 *  - yarn execute <NETWORK> ./setup/add_new_multi_giveaway.ts <GIVEAWAY_CONTRACT> <GIVEAWAY_NAME>
 *
 * GIVEAWAY_CONTRACT: from data/mfw_giveaway_1/robot.json then the giveaway contract is: MFW_Giveaway_1 
 * GIVEAWAY_NAME: from data/mfw_giveaway_1/robot.json then the giveaway name is: robot
 */

// TODO: test and update below

 import fs from 'fs-extra';
 import hre from 'hardhat';
 
 import {createClaimMerkleTree} from '../data/giveaways/multi_giveaway_1/getClaims';
 import helpers from '../lib/merkleTreeHelper';
 const {calculateMultiClaimHash} = helpers;
 
 const args = process.argv.slice(2);
 const claimContract = args[0];
 const claimFile = args[1];
 
 const func = async function () {
   const {deployments, network, getChainId} = hre;
   const {execute, read, catchUnknownSigner} = deployments;
   const chainId = await getChainId();
 
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
 
   // TODO: update to new admin
   const currentAdmin = await read(claimContract, 'getAdmin');
 
   await catchUnknownSigner(
     execute(
       claimContract,
       {from: currentAdmin, log: true},
       'addNewGiveaway',
       merkleRootHash,
       '0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF' // do not expire, TODO: check
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
   const basePath = `./secret/multi-giveaway/${network.name}`;
   const proofPath = `${basePath}/.multi_claims_proofs_${claimFile}_${chainId}.json`;
   const rootHashPath = `${basePath}/.multi_claims_root_hash_${claimFile}_${chainId}.json`;
   fs.outputJSONSync(proofPath, claimsWithProofs);
   fs.outputFileSync(rootHashPath, merkleRootHash);
   console.log(`Proofs at: ${proofPath}`);
   console.log(`Hash at: ${rootHashPath}`);
 };
 export default func;
 
 if (require.main === module) {
   func(hre);
 }
 