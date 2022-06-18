import {ethers} from 'hardhat';
import {setupTestGiveaway} from './fixtures';
import {
  waitFor,
  expectEventWithArgs,
} from '../utils';
import {expect} from '../../chai-setup';

import helpers from '../../lib/merkleTreeHelper';

const {calculateMultiClaimHash} = helpers;

describe('MFW_Giveaway_Stresstesting', function () {

  // User can claim from 1 or more giveaways (ie 1 or more merkle root hashes) - one merkle root in test setup
  // Note that a given user should only ever have 1 claim address per merkle root, corresponding to one input file
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
    });
});
