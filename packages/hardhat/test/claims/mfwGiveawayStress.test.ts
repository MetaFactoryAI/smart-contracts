import {ethers} from 'hardhat';
import {setupTestGiveaway} from './fixtures';
import {constants, BigNumber} from 'ethers';
import {
  waitFor,
  expectReceiptEventWithArgs,
  expectEventWithArgs,
  increaseTime,
} from '../utils';
import {expect} from '../../chai-setup';

import helpers from '../../lib/merkleTreeHelper';

const {calculateMultiClaimHash} = helpers;

import {
  testInitialERC1155Balances,
  testFinalERC1155Balances,
  testInitialERC20Balance,
  testUpdatedERC20Balance,
} from './balanceHelpers';

const zeroAddress = constants.AddressZero;
const emptyBytes32 =
  '0x0000000000000000000000000000000000000000000000000000000000000000';

describe.only('MFW_Giveaway_Stresstesting', function () {

  // User can claim from 1 or more giveaways (ie 1 or more merkle root hashes) - one merkle root in test setup
    describe('claimMultipleTokensFromMultipleMerkleTree - 1 giveaway / 1 merkle root', function () {
        it('User can claim allocated 64 tokens from Giveaway contract when there is only 1 claim in the dataset', async function () {
            const numberOfWearables = 64;
            const options = {
            mint: true,
            multi: true,
            numberOfWearables,
            };
            const setUp = await setupTestGiveaway(options);
            const {
            giveawayContract,
            others,
            allTrees,
            allClaims,
            mfwContract,
            allMerkleRoots,
            hre
            } = setUp;

            // Get gas limit
            const gas = hre.network.config.gas;
    
            // make arrays of claims and proofs relevant to specific user
            const userProofs = [];
            const userTrees = [];
            userTrees.push(allTrees[2]);
            const userClaims = [];
            const claim = allClaims[2][0];
            userClaims.push(claim);
            for (let i = 0; i < userClaims.length; i++) {
            userProofs.push(
                userTrees[0].getProof(calculateMultiClaimHash(userClaims[i]))
            );
            }
            const userMerkleRoots = [];
            userMerkleRoots.push(allMerkleRoots[2]);
    
            const giveawayContractAsUser = await giveawayContract.connect(
            ethers.provider.getSigner(others[0])
            );
    
            const receipt = await waitFor(
            giveawayContractAsUser.claimMultipleTokensFromMultipleMerkleTree(
                userMerkleRoots,
                userClaims,
                userProofs
            )
            );
            console.log(
            'Number of assets:',
            numberOfWearables,
            '; Gas used:',
            receipt.gasUsed.toString()
            );
            const event = await expectEventWithArgs(
            mfwContract,
            receipt,
            'TransferBatch'
            );
            expect(event.args.ids.length).to.eq(numberOfWearables);
        });
        it('User can claim allocated 64 tokens from Giveaway contract when there are 100 claims listed in the dataset', async function () {
        const numberOfWearables = 64;
        const stress = 100;
        const options = {
            mint: true,
            multi: true,
            numberOfWearables,
            stress
        };
        const setUp = await setupTestGiveaway(options);
        const {
            giveawayContract,
            others,
            allTrees,
            allClaims,
            allMerkleRoots,
            mfwContract,
            hre
        } = setUp;

        // Get gas limit
        const gas = hre.network.config.gas;

        // make arrays of claims and proofs relevant to specific user
        const userProofs = [];
        const userTrees = [];
        userTrees.push(allTrees[2]);
        const userClaims = [];
        const claim = allClaims[2][0];
        userClaims.push(claim);
        for (let i = 0; i < userClaims.length; i++) {
            userProofs.push(
            userTrees[0].getProof(calculateMultiClaimHash(userClaims[i]))
            );
        }
        const userMerkleRoots = [];
        userMerkleRoots.push(allMerkleRoots[2]);

        const giveawayContractAsUser = await giveawayContract.connect(
            ethers.provider.getSigner(others[0])
            );
    
            const receipt = await waitFor(
            giveawayContractAsUser.claimMultipleTokensFromMultipleMerkleTree(
                userMerkleRoots,
                userClaims,
                userProofs
            )
            );
            console.log(
            'Number of assets:',
            numberOfWearables,
            '; Gas used:',
            receipt.gasUsed.toString()
            );
            const event = await expectEventWithArgs(
            mfwContract,
            receipt,
            'TransferBatch'
            );
            expect(event.args.ids.length).to.eq(numberOfWearables);

        // const expectedGas = await
        //     giveawayContractAsUser.estimateGas.claimMultipleTokensFromMultipleMerkleTree(
        //     userMerkleRoots,
        //     userClaims,
        //     userProofs
        // )
        // expect(expectedGas).to.be.below(gas);
        });
        it('User gas to claim 64 tokens from Giveaway contract when there are 100 claims listed in the dataset is below limit', async function () {
            const numberOfWearables = 64;
            const stress = 100;
            const options = {
                mint: true,
                multi: true,
                numberOfWearables,
                stress
            };
            const setUp = await setupTestGiveaway(options);
            const {
                giveawayContract,
                others,
                allTrees,
                allClaims,
                allMerkleRoots,
                mfwContract,
                hre
            } = setUp;
    
            // Get gas limit
            const gas = hre.network.config.gas;
    
            // make arrays of claims and proofs relevant to specific user
            const userProofs = [];
            const userTrees = [];
            userTrees.push(allTrees[2]);
            const userClaims = [];
            const claim = allClaims[2][0];
            userClaims.push(claim);
            for (let i = 0; i < userClaims.length; i++) {
                userProofs.push(
                userTrees[0].getProof(calculateMultiClaimHash(userClaims[i]))
                );
            }
            const userMerkleRoots = [];
            userMerkleRoots.push(allMerkleRoots[2]);
    
            const giveawayContractAsUser = await giveawayContract.connect(
                ethers.provider.getSigner(others[0])
                );
            const expectedGas = await
                giveawayContractAsUser.estimateGas.claimMultipleTokensFromMultipleMerkleTree(
                userMerkleRoots,
                userClaims,
                userProofs
            )
            console.log(expectedGas.toString(), gas)
            expect(expectedGas).to.be.below(gas);
        });
        it('User gas to claim 64 tokens from Giveaway contract when there are 3000 claims listed in the dataset is below limit', async function () {
            const numberOfWearables = 64;
            const stress = 3000;
            const options = {
                mint: true,
                multi: true,
                numberOfWearables,
                stress
            };
            const setUp = await setupTestGiveaway(options);
            const {
                giveawayContract,
                others,
                allTrees,
                allClaims,
                allMerkleRoots,
                mfwContract,
                hre
            } = setUp;
    
            // Get gas limit
            const gas = hre.network.config.gas;
    
            // make arrays of claims and proofs relevant to specific user
            const userProofs = [];
            const userTrees = [];
            userTrees.push(allTrees[2]);
            const userClaims = [];
            const claim = allClaims[2][0];
            userClaims.push(claim);
            for (let i = 0; i < userClaims.length; i++) {
                userProofs.push(
                userTrees[0].getProof(calculateMultiClaimHash(userClaims[i]))
                );
            }
            const userMerkleRoots = [];
            userMerkleRoots.push(allMerkleRoots[2]);
    
            const giveawayContractAsUser = await giveawayContract.connect(
                ethers.provider.getSigner(others[0])
                );
            const expectedGas = await
                giveawayContractAsUser.estimateGas.claimMultipleTokensFromMultipleMerkleTree(
                userMerkleRoots,
                userClaims,
                userProofs
            )
            console.log(expectedGas.toString(), gas)
            expect(expectedGas).to.be.below(gas);
        });
        it('User can claim allocated 64 tokens from Giveaway contract when there are 1000 claims listed in the dataset', async function () {
            const numberOfWearables = 64;
            const stress = 1000;
            const options = {
                mint: true,
                multi: true,
                numberOfWearables,
                stress
            };
            const setUp = await setupTestGiveaway(options);
            const {
                giveawayContract,
                others,
                allTrees,
                allClaims,
                allMerkleRoots,
                mfwContract,
                hre
            } = setUp;
    
            // Get gas limit
            const gas = hre.network.config.gas;
    
            // make arrays of claims and proofs relevant to specific user
            const userProofs = [];
            const userTrees = [];
            userTrees.push(allTrees[2]);
            const userClaims = [];
            const claim = allClaims[2][0];
            userClaims.push(claim);
            for (let i = 0; i < userClaims.length; i++) {
                userProofs.push(
                userTrees[0].getProof(calculateMultiClaimHash(userClaims[i]))
                );
            }
            const userMerkleRoots = [];
            userMerkleRoots.push(allMerkleRoots[2]);
    
            const giveawayContractAsUser = await giveawayContract.connect(
                ethers.provider.getSigner(others[0])
                );
        
                const receipt = await waitFor(
                giveawayContractAsUser.claimMultipleTokensFromMultipleMerkleTree(
                    userMerkleRoots,
                    userClaims,
                    userProofs
                )
                );
                console.log(
                'Number of assets:',
                numberOfWearables,
                '; Gas used:',
                receipt.gasUsed.toString()
                );
                const event = await expectEventWithArgs(
                mfwContract,
                receipt,
                'TransferBatch'
                );
                expect(event.args.ids.length).to.eq(numberOfWearables);
    
            // const expectedGas = await
            //     giveawayContractAsUser.estimateGas.claimMultipleTokensFromMultipleMerkleTree(
            //     userMerkleRoots,
            //     userClaims,
            //     userProofs
            // )
            // expect(expectedGas).to.be.below(gas);
        });
        it('User can claim allocated 64 tokens from Giveaway contract when there are 2000 claims listed in the dataset', async function () {
            const numberOfWearables = 64;
            const stress = 2000;
            const options = {
                mint: true,
                multi: true,
                numberOfWearables,
                stress
            };
            const setUp = await setupTestGiveaway(options);
            const {
                giveawayContract,
                others,
                allTrees,
                allClaims,
                allMerkleRoots,
                mfwContract,
                hre
            } = setUp;
    
            // Get gas limit
            const gas = hre.network.config.gas;
    
            // make arrays of claims and proofs relevant to specific user
            const userProofs = [];
            const userTrees = [];
            userTrees.push(allTrees[2]);
            const userClaims = [];
            const claim = allClaims[2][0];
            userClaims.push(claim);
            for (let i = 0; i < userClaims.length; i++) {
                userProofs.push(
                userTrees[0].getProof(calculateMultiClaimHash(userClaims[i]))
                );
            }
            const userMerkleRoots = [];
            userMerkleRoots.push(allMerkleRoots[2]);
    
            const giveawayContractAsUser = await giveawayContract.connect(
                ethers.provider.getSigner(others[0])
                );
        
                const receipt = await waitFor(
                giveawayContractAsUser.claimMultipleTokensFromMultipleMerkleTree(
                    userMerkleRoots,
                    userClaims,
                    userProofs
                )
                );
                console.log(
                'Number of assets:',
                numberOfWearables,
                '; Gas used:',
                receipt.gasUsed.toString()
                );
                const event = await expectEventWithArgs(
                mfwContract,
                receipt,
                'TransferBatch'
                );
                expect(event.args.ids.length).to.eq(numberOfWearables);
    
            // const expectedGas = await
            //     giveawayContractAsUser.estimateGas.claimMultipleTokensFromMultipleMerkleTree(
            //     userMerkleRoots,
            //     userClaims,
            //     userProofs
            // )
            // expect(expectedGas).to.be.below(gas);
        });
        // TODO: below test times out (also 4000 does too)
        // it('User can claim allocated 64 tokens from Giveaway contract when there are 5000 claims listed in the dataset', async function () {
        //     const numberOfWearables = 64;
        //     const stress = 5000;
        //     const options = {
        //         mint: true,
        //         multi: true,
        //         numberOfWearables,
        //         stress
        //     };
        //     const setUp = await setupTestGiveaway(options);
        //     const {
        //         giveawayContract,
        //         others,
        //         allTrees,
        //         allClaims,
        //         allMerkleRoots,
        //         mfwContract,
        //         hre
        //     } = setUp;
    
        //     // Get gas limit
        //     const gas = hre.network.config.gas;
    
        //     // make arrays of claims and proofs relevant to specific user
        //     const userProofs = [];
        //     const userTrees = [];
        //     userTrees.push(allTrees[2]);
        //     const userClaims = [];
        //     const claim = allClaims[2][0];
        //     userClaims.push(claim);
        //     for (let i = 0; i < userClaims.length; i++) {
        //         userProofs.push(
        //         userTrees[0].getProof(calculateMultiClaimHash(userClaims[i]))
        //         );
        //     }
        //     const userMerkleRoots = [];
        //     userMerkleRoots.push(allMerkleRoots[2]);
    
        //     const giveawayContractAsUser = await giveawayContract.connect(
        //         ethers.provider.getSigner(others[0])
        //         );
        
        //         const receipt = await waitFor(
        //         giveawayContractAsUser.claimMultipleTokensFromMultipleMerkleTree(
        //             userMerkleRoots,
        //             userClaims,
        //             userProofs
        //         )
        //         );
        //         console.log(
        //         'Number of assets:',
        //         numberOfWearables,
        //         '; Gas used:',
        //         receipt.gasUsed.toString()
        //         );
        //         const event = await expectEventWithArgs(
        //         mfwContract,
        //         receipt,
        //         'TransferBatch'
        //         );
        //         expect(event.args.ids.length).to.eq(numberOfWearables);
    
        //     // const expectedGas = await
        //     //     giveawayContractAsUser.estimateGas.claimMultipleTokensFromMultipleMerkleTree(
        //     //     userMerkleRoots,
        //     //     userClaims,
        //     //     userProofs
        //     // )
        //     // expect(expectedGas).to.be.below(gas);
        // });
    });

    // TODO: use or remove mintSingleAsset
    // describe('MFW_Giveaway_Stresstesting - GAS', function () {
    //     // eslint-disable-next-line @typescript-eslint/no-explicit-any
    //     const gasReport: any = {};
    //     // eslint-disable-next-line @typescript-eslint/no-explicit-any
    //     function record(name: any, gasUsed: any) {
    //       gasReport[name] = gasUsed.toNumber();
    //     }
    //     after(function () {
    //       console.log(JSON.stringify(gasReport, null, '  '));
    //     });
      
    //     it('1 claim', async function () {
    //       const options = {
    //         assetsHolder: true,
    //         mintSingleAsset: 1,
    //       };
    //       const setUp = await setupTestGiveaway(options);
    //       const {giveawayContract, others, tree, assets} = setUp;
    //       const asset = assets[0];
    //       const proof = tree.getProof(calculateClaimableAssetHash(asset));
    //       const giveawayContractAsUser = await giveawayContract.connect(
    //         ethers.provider.getSigner(others[1])
    //       );
    //       const receipt = await waitFor(
    //         giveawayContractAsUser.claimAssets(
    //           others[1],
    //           asset.assetIds,
    //           asset.assetValues,
    //           proof,
    //           asset.salt
    //         )
    //       );
    //       record('Gas per claim - 1 claim total', receipt.gasUsed);
    //     });
      
    //     it('10 claims', async function () {
    //       const options = {
    //         assetsHolder: true,
    //         mintSingleAsset: 10,
    //       };
    //       const setUp = await setupTestGiveaway(options);
    //       const {giveawayContract, others, tree, assets} = setUp;
    //       const asset = assets[0];
    //       const proof = tree.getProof(calculateClaimableAssetHash(asset));
    //       const giveawayContractAsUser = await giveawayContract.connect(
    //         ethers.provider.getSigner(others[1])
    //       );
    //       const receipt = await waitFor(
    //         giveawayContractAsUser.claimAssets(
    //           others[1],
    //           asset.assetIds,
    //           asset.assetValues,
    //           proof,
    //           asset.salt
    //         )
    //       );
    //       record('Gas per claim - 10 claims total', receipt.gasUsed);
    //     });
      
    //     it('4000 claims', async function () {
    //       const options = {
    //         assetsHolder: true,
    //         mintSingleAsset: 4000,
    //       };
    //       const setUp = await setupTestGiveaway(options);
    //       const {giveawayContract, others, tree, assets} = setUp;
    //       const asset = assets[0];
    //       const proof = tree.getProof(calculateClaimableAssetHash(asset));
    //       const giveawayContractAsUser = await giveawayContract.connect(
    //         ethers.provider.getSigner(others[1])
    //       );
    //       const receipt = await waitFor(
    //         giveawayContractAsUser.claimAssets(
    //           others[1],
    //           asset.assetIds,
    //           asset.assetValues,
    //           proof,
    //           asset.salt
    //         )
    //       );
    //       record('Gas per claim - 4000 claims total', receipt.gasUsed);
    //     });
      
    //     it('10000 claims', async function () {
    //       const options = {
    //         assetsHolder: true,
    //         mintSingleAsset: 10000,
    //       };
    //       const setUp = await setupTestGiveaway(options);
    //       const {giveawayContract, others, tree, assets} = setUp;
    //       const asset = assets[0];
    //       const proof = tree.getProof(calculateClaimableAssetHash(asset));
    //       const giveawayContractAsUser = await giveawayContract.connect(
    //         ethers.provider.getSigner(others[1])
    //       );
    //       const receipt = await waitFor(
    //         giveawayContractAsUser.claimAssets(
    //           others[1],
    //           asset.assetIds,
    //           asset.assetValues,
    //           proof,
    //           asset.salt
    //         )
    //       );
    //       record('Gas per claim - 10000 claims total', receipt.gasUsed);
    //     });
    //   });
     
    // TODO: user can claim in batches

});
