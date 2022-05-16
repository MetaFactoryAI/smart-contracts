/**
 * How to use:
 *  - yarn execute <NETWORK> ./scrips/sendWearablesToGiveawayContract.js <MULTI_GIVEAWAY_NAME> <GIVEAWAY_NAME> [WEARABLE_HOLDER_ADDRESS]
 *
 * MULTI_GIVEAWAY_NAME: should be the same as the contract deployment name
 * GIVEAWAY_NAME: from data/mfw_giveaway_1/claims_0_hardhat.json then the giveaway name is: claims_0_hardhat
 */

// TODO: update below
// Use script if wearables are NOT minted directly to relevant Giveaway contract

 import fs from 'fs-extra';
 import hre from 'hardhat';
 import {BigNumber} from '@ethersproject/bignumber';
 const {deployments, getNamedAccounts} = hre;
 const {execute, catchUnknownSigner, read} = deployments;
 
 const args = process.argv.slice(2);
 const multiGiveawayName = args[0];
 const claimFile = args[1];
 const assetHolder = args[2];
 
 function getAssets(json) {
   const assetIdsCount = {};
   json.forEach((claim) => {
     claim.erc1155.forEach(({ids, values}) => {
       ids.forEach((id, index) => {
         if (!assetIdsCount[id]) assetIdsCount[id] = 0;
         assetIdsCount[id] += values[index];
       });
     });
   });
   return assetIdsCount;
 }
 
 function getERC20(json) {
   const erc20Hash = {};
   json.forEach((claim) => {
     claim.erc20.contractAddresses.forEach((address, index) => {
       if (!erc20Hash[address]) {
         erc20Hash[address] = BigNumber.from(0);
       }
       erc20Hash[address] = erc20Hash[address].add(
         BigNumber.from(claim.erc20.amounts[index])
       );
     });
   });
   return erc20Hash;
 }
 
 const func = async function () {
   const path = `./data/giveaways/${multiGiveawayName.toLowerCase()}/${claimFile}.json`;
   const json = fs.readJSONSync(path);
   const assetIdsCount = getAssets(json);
   const MFWGiveaway = await deployments.get(multiGiveawayName);
   const {sandboxAccount, sandSaleBeneficiary} = await getNamedAccounts();
   const owner = assetHolder || sandboxAccount;
   // Send ERC1155
   const ids = [];
   const values = [];
   for (const assetId in assetIdsCount) {
     const balance = await read(
       'MFW',
       'balanceOf(address,uint256)',
       MFWGiveaway.address,
       assetId
     );
     const assetCount = BigNumber.from(assetIdsCount[assetId]);
     if (balance.lt(assetCount)) {
       ids.push(assetId);
       values.push(assetCount.sub(balance).toNumber());
     }
   }
   if (ids.length > 0) {
     console.log(claimFile, JSON.stringify(assetIdsCount, null, '  '));
     await catchUnknownSigner(
       execute(
         'MFW',
         {from: owner, log: true},
         'safeBatchTransferFrom', // TODO: review transfer function
         owner,
         MFWGiveaway.address,
         ids,
         values,
         '0x'
       )
     );
   }
  
 };
 export default func;
 
 if (require.main === module) {
   func(hre);
 }
 