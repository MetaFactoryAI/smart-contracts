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

describe('MFW_Giveaway', function () {
  describe('MFW_Giveaway_common_functionality', function () {
    it('Admin has the correct role', async function () {
      const options = {};
      const setUp = await setupTestGiveaway(options);
      const {giveawayContract, mfwGiveawayAdmin} = setUp;
      const defaultRole = emptyBytes32;
      expect(await giveawayContract.hasRole(defaultRole, mfwGiveawayAdmin)).to
        .be.true;
    });
    it('Admin can add a new giveaway', async function () {
      const options = {};
      const setUp = await setupTestGiveaway(options);
      const {giveawayContractAsAdmin} = setUp;

      const receipt = await waitFor(
        giveawayContractAsAdmin.addNewGiveaway(
          emptyBytes32,
          '0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF' // does not expire
        )
      );

      const event = await expectReceiptEventWithArgs(receipt, 'NewGiveaway');
      expect(event.args[0]).to.equal(emptyBytes32);
      expect(event.args[1]).to.equal(
        '0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF'
      );
    });

    it('Cannot add a new giveaway if not admin', async function () {
      const options = {};
      const setUp = await setupTestGiveaway(options);
      const {giveawayContract, others} = setUp;

      const giveawayContractAsUser = await giveawayContract.connect(
        ethers.provider.getSigner(others[0])
      );

      await expect(
        giveawayContractAsUser.addNewGiveaway(
          emptyBytes32,
          '0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF'
        )
      ).to.be.reverted;
    });

    it('User can get their claimed status', async function () {
      const options = {multi: true};
      const setUp = await setupTestGiveaway(options);
      const {giveawayContract, others, allMerkleRoots} = setUp;

      const giveawayContractAsUser = await giveawayContract.connect(
        ethers.provider.getSigner(others[0])
      );

      const statuses = await giveawayContractAsUser.getClaimedStatus(
        others[0],
        allMerkleRoots
      );

      expect(statuses[0]).to.equal(false);
      expect(statuses[1]).to.equal(false);
    });

    it('Claimed status is correctly updated after allocated tokens are claimed - 2 claims of 2 claimed', async function () {
      const options = {
        mint: true,
        sand: true,
        multi: true,
      };
      const setUp = await setupTestGiveaway(options);
      const {
        giveawayContract,
        others,
        allTrees,
        allClaims,
        allMerkleRoots,
      } = setUp;

      // make arrays of claims and proofs relevant to specific user
      const userProofs = [];
      const userClaims = [];
      const claim = allClaims[0][0];
      const secondClaim = allClaims[1][0];
      userClaims.push(claim);
      userClaims.push(secondClaim);

      for (let i = 0; i < userClaims.length; i++) {
        userProofs.push(
          allTrees[i].getProof(calculateMultiClaimHash(userClaims[i]))
        );
      }
      const userMerkleRoots = [];
      userMerkleRoots.push(allMerkleRoots[0]);
      userMerkleRoots.push(allMerkleRoots[1]);

      const giveawayContractAsUser = await giveawayContract.connect(
        ethers.provider.getSigner(others[0])
      );

      const statuses = await giveawayContractAsUser.getClaimedStatus(
        others[0],
        allMerkleRoots
      );

      expect(statuses[0]).to.equal(false);
      expect(statuses[1]).to.equal(false);

      await giveawayContractAsUser.claimMultipleTokensFromMultipleMerkleTree(
        userMerkleRoots,
        userClaims,
        userProofs
      );

      const statusesAfterClaim = await giveawayContractAsUser.getClaimedStatus(
        others[0],
        allMerkleRoots
      );

      expect(statusesAfterClaim[0]).to.equal(true);
      expect(statusesAfterClaim[1]).to.equal(true);
    });

    it('Claimed status is correctly updated after allocated tokens are claimed - 1 claim of 2 claimed', async function () {
      const options = {
        mint: true,
        sand: true,
        multi: true,
      };
      const setUp = await setupTestGiveaway(options);
      const {
        giveawayContract,
        others,
        allTrees,
        allClaims,
        allMerkleRoots,
      } = setUp;

      // make arrays of claims and proofs relevant to specific user
      const userProofs = [];
      const userClaims = [];
      const secondClaim = allClaims[1][0];
      userClaims.push(secondClaim);
      userProofs.push(
        allTrees[1].getProof(calculateMultiClaimHash(userClaims[0]))
      );
      const userMerkleRoots = [];
      userMerkleRoots.push(allMerkleRoots[1]);

      const giveawayContractAsUser = await giveawayContract.connect(
        ethers.provider.getSigner(others[0])
      );

      const statuses = await giveawayContractAsUser.getClaimedStatus(
        others[0],
        allMerkleRoots
      );

      expect(statuses[0]).to.equal(false);
      expect(statuses[1]).to.equal(false);

      await giveawayContractAsUser.claimMultipleTokensFromMultipleMerkleTree(
        userMerkleRoots,
        userClaims,
        userProofs
      );

      const statusesAfterClaim = await giveawayContractAsUser.getClaimedStatus(
        others[0],
        allMerkleRoots
      );

      expect(statusesAfterClaim[0]).to.equal(false);
      expect(statusesAfterClaim[1]).to.equal(true);
    });
    // it('MFWGiveaway contract returns ERC721 received', async function () {
    //   const options = {};
    //   const setUp = await setupTestGiveaway(options);
    //   const {giveawayContract, mfwGiveawayAdmin, landContract} = setUp;
    //   const result = await giveawayContract.onERC721Received(
    //     mfwGiveawayAdmin,
    //     landContract.address,
    //     0,
    //     '0x'
    //   );
    //   const expectedResult = '0x150b7a02';
    //   expect(result).to.equal(expectedResult);
    // });
    // it('MFWGiveaway contract returns ERC721 Batch received', async function () {
    //   const options = {};
    //   const setUp = await setupTestGiveaway(options);
    //   const {giveawayContract, mfwGiveawayAdmin, landContract} = setUp;
    //   const result = await giveawayContract.onERC721BatchReceived(
    //     mfwGiveawayAdmin,
    //     landContract.address,
    //     [0, 1],
    //     '0x'
    //   );
    //   const expectedResult = '0x4b808c46';
    //   expect(result).to.equal(expectedResult);
    // });
    it('MFWGiveaway contract returns ERC1155 received for supply 1', async function () {
      const options = {};
      const setUp = await setupTestGiveaway(options);
      const {giveawayContract, mfwGiveawayAdmin, mfwContract} = setUp;
      const result = await giveawayContract.onERC1155Received(
        mfwGiveawayAdmin,
        mfwContract.address,
        0,
        1,
        '0x'
      );
      const expectedResult = '0xf23a6e61';
      expect(result).to.equal(expectedResult);
    });
    it('MFWGiveaway contract returns ERC1155 received', async function () {
      const options = {};
      const setUp = await setupTestGiveaway(options);
      const {giveawayContract, mfwGiveawayAdmin, mfwContract} = setUp;
      const result = await giveawayContract.onERC1155Received(
        mfwGiveawayAdmin,
        mfwContract.address,
        0,
        5,
        '0x'
      );
      const expectedResult = '0xf23a6e61';
      expect(result).to.equal(expectedResult);
    });
    it('MFWGiveaway contract returns ERC1155 Batch received', async function () {
      const options = {};
      const setUp = await setupTestGiveaway(options);
      const {giveawayContract, mfwGiveawayAdmin, mfwContract} = setUp;
      const result = await giveawayContract.onERC1155BatchReceived(
        mfwGiveawayAdmin,
        mfwContract.address,
        [0, 1],
        [5, 5],
        '0x'
      );
      const expectedResult = '0xbc197c81';
      expect(result).to.equal(expectedResult);
    });
  });
  describe('MFW_Giveaway_single_giveaway', function () {
    it('User cannot claim when test contract holds no tokens', async function () {
      const options = {};
      const setUp = await setupTestGiveaway(options);
      const {
        giveawayContract,
        others,
        allTrees,
        allClaims, // all claims from all giveaways
        allMerkleRoots,
      } = setUp;

      // make arrays of claims and proofs relevant to specific user
      const userProofs = [];
      const userTrees = [];
      userTrees.push(allTrees[0]);
      const userClaims = [];
      userClaims.push(allClaims[0][0]);
      for (let i = 0; i < userClaims.length; i++) {
        userProofs.push(
          userTrees[i].getProof(calculateMultiClaimHash(userClaims[i]))
        );
      }
      const userMerkleRoots = [];
      userMerkleRoots.push(allMerkleRoots[0]);

      const giveawayContractAsUser = await giveawayContract.connect(
        ethers.provider.getSigner(others[0])
      );

      await expect(
        giveawayContractAsUser.claimMultipleTokensFromMultipleMerkleTree(
          userMerkleRoots,
          userClaims,
          userProofs
        )
      ).to.be.revertedWith(`can't substract more than there is`);
    });

    // it('User cannot claim sand when contract does not hold any', async function () {
    //   const options = {
    //     mint: true,
    //   };
    //   const setUp = await setupTestGiveaway(options);
    //   const {
    //     giveawayContract,
    //     others,
    //     allTrees,
    //     allClaims,
    //     allMerkleRoots,
    //   } = setUp;

    //   // make arrays of claims and proofs relevant to specific user
    //   const userProofs = [];
    //   const userTrees = [];
    //   userTrees.push(allTrees[0]);
    //   const userClaims = [];
    //   userClaims.push(allClaims[0][0]);
    //   for (let i = 0; i < userClaims.length; i++) {
    //     userProofs.push(
    //       userTrees[i].getProof(calculateMultiClaimHash(userClaims[i]))
    //     );
    //   }
    //   const userMerkleRoots = [];
    //   userMerkleRoots.push(allMerkleRoots[0]);

    //   const giveawayContractAsUser = await giveawayContract.connect(
    //     ethers.provider.getSigner(others[0])
    //   );

    //   await expect(
    //     giveawayContractAsUser.claimMultipleTokensFromMultipleMerkleTree(
    //       userMerkleRoots,
    //       userClaims,
    //       userProofs
    //     )
    //   ).to.be.revertedWith(`not enough fund`);
    // });

    // it('User can claim allocated multiple tokens from Giveaway contract', async function () {
    //   const options = {
    //     mint: true,
    //     sand: true,
    //   };
    //   const setUp = await setupTestGiveaway(options);
    //   const {
    //     giveawayContract,
    //     others,
    //     allTrees,
    //     allClaims,
    //     mfwContract,
    //     landContract,
    //     sandContract,
    //     allMerkleRoots,
    //   } = setUp;

    //   // make arrays of claims and proofs relevant to specific user
    //   const userProofs = [];
    //   const userTrees = [];
    //   userTrees.push(allTrees[0]);
    //   const userClaims = [];
    //   const claim = allClaims[0][0];
    //   userClaims.push(claim);
    //   for (let i = 0; i < userClaims.length; i++) {
    //     userProofs.push(
    //       userTrees[i].getProof(calculateMultiClaimHash(userClaims[i]))
    //     );
    //   }
    //   const userMerkleRoots = [];
    //   userMerkleRoots.push(allMerkleRoots[0]);

    //   const user = others[0];

    //   const giveawayContractAsUser = await giveawayContract.connect(
    //     ethers.provider.getSigner(user)
    //   );

    //   await testInitialERC1155Balances(
    //     claim,
    //     mfwContract,
    //     landContract,
    //     giveawayContract
    //   );

    //   await testInitialERC20Balance(user, sandContract);

    //   await waitFor(
    //     giveawayContractAsUser.claimMultipleTokensFromMultipleMerkleTree(
    //       userMerkleRoots,
    //       userClaims,
    //       userProofs
    //     )
    //   );

    //   await testFinalERC1155Balances(
    //     claim,
    //     user,
    //     mfwContract,
    //     landContract
    //   );

    //   await testUpdatedERC20Balance(claim, user, sandContract, 0);
    // });

    it('User can claim allocated 64 tokens from Giveaway contract', async function () {
      const numberOfAssets = 64;
      const options = {
        mint: true,
        sand: true,
        numberOfAssets,
      };
      const setUp = await setupTestGiveaway(options);
      const {
        giveawayContract,
        others,
        allTrees,
        allClaims,
        mfwContract,
        allMerkleRoots,
      } = setUp;

      // make arrays of claims and proofs relevant to specific user
      const userProofs = [];
      const userTrees = [];
      userTrees.push(allTrees[0]);
      const userClaims = [];
      const claim = allClaims[0][0];
      userClaims.push(claim);
      for (let i = 0; i < userClaims.length; i++) {
        userProofs.push(
          userTrees[i].getProof(calculateMultiClaimHash(userClaims[i]))
        );
      }
      const userMerkleRoots = [];
      userMerkleRoots.push(allMerkleRoots[0]);

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
        numberOfAssets,
        '; Gas used:',
        receipt.gasUsed.toString()
      );
      const event = await expectEventWithArgs(
        mfwContract,
        receipt,
        'TransferBatch'
      );
      expect(event.args.ids.length).to.eq(numberOfAssets);
    });

    it('Claimed Event is emitted for successful claim', async function () {
      const options = {
        mint: true,
        sand: true,
      };
      const setUp = await setupTestGiveaway(options);
      const {
        giveawayContract,
        others,
        allClaims,
        allTrees,
        allMerkleRoots,
      } = setUp;

      const userProofs = [];
      const userTrees = [];
      userTrees.push(allTrees[0]);
      const userClaims = [];
      const claim = allClaims[0][0];
      userClaims.push(claim);
      for (let i = 0; i < userClaims.length; i++) {
        userProofs.push(
          userTrees[i].getProof(calculateMultiClaimHash(userClaims[i]))
        );
      }
      const userMerkleRoots = [];
      userMerkleRoots.push(allMerkleRoots[0]);

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

      const claimedEvent = await expectReceiptEventWithArgs(
        receipt,
        'ClaimedMultipleTokens'
      );
      expect(claimedEvent.args[0]).to.equal(others[0]); // to

      expect(claimedEvent.args[1][0][0][0]).to.equal(claim.erc1155[0].ids[0]);
      expect(claimedEvent.args[1][0][0][1]).to.equal(claim.erc1155[0].ids[1]);
      expect(claimedEvent.args[1][0][0][2]).to.equal(claim.erc1155[0].ids[2]);

      expect(claimedEvent.args[1][0][1][0]).to.equal(
        claim.erc1155[0].values[0]
      );
      expect(claimedEvent.args[1][0][1][1]).to.equal(
        claim.erc1155[0].values[1]
      );
      expect(claimedEvent.args[1][0][1][2]).to.equal(
        claim.erc1155[0].values[2]
      );

      expect(claimedEvent.args[1][0][2]).to.equal(
        claim.erc1155[0].contractAddress
      );

      expect(claimedEvent.args[2][0][0][0]).to.equal(claim.erc721[0].ids[0]);
      expect(claimedEvent.args[2][0][0][1]).to.equal(claim.erc721[0].ids[1]);
      expect(claimedEvent.args[2][0][0][2]).to.equal(claim.erc721[0].ids[2]);
      expect(claimedEvent.args[2][0][0][3]).to.equal(claim.erc721[0].ids[3]);
      expect(claimedEvent.args[2][0][0][4]).to.equal(claim.erc721[0].ids[4]);
      expect(claimedEvent.args[2][0][0][5]).to.equal(claim.erc721[0].ids[5]);
      expect(claimedEvent.args[2][0][1]).to.equal(
        claim.erc721[0].contractAddress
      );
      expect(claimedEvent.args[3][0][0]).to.equal(claim.erc20.amounts[0]);
      expect(claimedEvent.args[3][1][0]).to.equal(
        claim.erc20.contractAddresses[0]
      );
    });

    // it('User can claim allocated ERC20 from Giveaway contract when there are no assets or lands allocated', async function () {
    //   const options = {
    //     mint: true,
    //     sand: true,
    //   };
    //   const setUp = await setupTestGiveaway(options);
    //   const {
    //     giveawayContract,
    //     others,
    //     allTrees,
    //     allClaims,
    //     allMerkleRoots,
    //     sandContract,
    //   } = setUp;
    //   const userProofs = [];
    //   const userTrees = [];
    //   userTrees.push(allTrees[0]);
    //   const userClaims = [];
    //   const claim = allClaims[0][4];
    //   userClaims.push(claim);
    //   for (let i = 0; i < userClaims.length; i++) {
    //     userProofs.push(
    //       userTrees[i].getProof(calculateMultiClaimHash(userClaims[i]))
    //     );
    //   }
    //   const userMerkleRoots = [];
    //   userMerkleRoots.push(allMerkleRoots[0]);
    //   const user = others[0];
    //   const giveawayContractAsUser = await giveawayContract.connect(
    //     ethers.provider.getSigner(user)
    //   );

    //   await testInitialERC20Balance(user, sandContract);

    //   await waitFor(
    //     giveawayContractAsUser.claimMultipleTokensFromMultipleMerkleTree(
    //       userMerkleRoots,
    //       userClaims,
    //       userProofs
    //     )
    //   );

    //   await testUpdatedERC20Balance(claim, user, sandContract, 0);
    // });

    // it('User cannot claim if they claim the wrong amount of ERC20', async function () {
    //   const options = {
    //     mint: true,
    //     sand: true,
    //   };
    //   const setUp = await setupTestGiveaway(options);
    //   const {
    //     giveawayContract,
    //     others,
    //     allTrees,
    //     allClaims,
    //     allMerkleRoots,
    //   } = setUp;

    //   const badClaim = JSON.parse(JSON.stringify(allClaims[0][0])); // deep clone
    //   badClaim.erc20.amounts[0] = 250; // bad param

    //   const userProofs = [];
    //   const userTrees = [];
    //   userTrees.push(allTrees[0]);
    //   const userClaims = [];
    //   userClaims.push(badClaim);
    //   userProofs.push(
    //     userTrees[0].getProof(calculateMultiClaimHash(allClaims[0][0]))
    //   );
    //   const userMerkleRoots = [];
    //   userMerkleRoots.push(allMerkleRoots[0]);

    //   const giveawayContractAsUser = await giveawayContract.connect(
    //     ethers.provider.getSigner(others[0])
    //   );

    //   await expect(
    //     giveawayContractAsUser.claimMultipleTokensFromMultipleMerkleTree(
    //       userMerkleRoots,
    //       userClaims,
    //       userProofs
    //     )
    //   ).to.be.revertedWith('CLAIM_INVALID');
    // });

    it('User cannot claim more than once', async function () {
      const options = {
        mint: true,
        sand: true,
      };
      const setUp = await setupTestGiveaway(options);
      const {
        giveawayContract,
        others,
        allTrees,
        allClaims,
        allMerkleRoots,
      } = setUp;

      const userProofs = [];
      const userTrees = [];
      userTrees.push(allTrees[0]);
      const userClaims = [];
      const claim = allClaims[0][0];
      userClaims.push(claim);
      for (let i = 0; i < userClaims.length; i++) {
        userProofs.push(
          userTrees[i].getProof(calculateMultiClaimHash(userClaims[i]))
        );
      }
      const userMerkleRoots = [];
      userMerkleRoots.push(allMerkleRoots[0]);
      const giveawayContractAsUser = await giveawayContract.connect(
        ethers.provider.getSigner(others[0])
      );

      await waitFor(
        giveawayContractAsUser.claimMultipleTokensFromMultipleMerkleTree(
          userMerkleRoots,
          userClaims,
          userProofs
        )
      );
      await expect(
        giveawayContractAsUser.claimMultipleTokensFromMultipleMerkleTree(
          userMerkleRoots,
          userClaims,
          userProofs
        )
      ).to.be.revertedWith('MULTIGIVEAWAY_DESTINATION_ALREADY_CLAIMED');
    });

    it('User cannot claim from Giveaway contract if destination is not the reserved address', async function () {
      const options = {
        mint: true,
        sand: true,
      };
      const setUp = await setupTestGiveaway(options);
      const {
        giveawayContract,
        others,
        allClaims,
        allTrees,
        allMerkleRoots,
      } = setUp;

      const badClaim = JSON.parse(JSON.stringify(allClaims[0][0])); // deep clone
      badClaim.to = others[2]; // bad param
      const userProofs = [];
      const userTrees = [];
      userTrees.push(allTrees[0]);
      const userClaims = [];
      userClaims.push(badClaim);
      userProofs.push(
        userTrees[0].getProof(calculateMultiClaimHash(allClaims[0][0]))
      );
      const userMerkleRoots = [];
      userMerkleRoots.push(allMerkleRoots[0]);
      const giveawayContractAsUser = await giveawayContract.connect(
        ethers.provider.getSigner(others[0])
      );

      await expect(
        giveawayContractAsUser.claimMultipleTokensFromMultipleMerkleTree(
          userMerkleRoots,
          userClaims,
          userProofs
        )
      ).to.be.revertedWith('CLAIM_INVALID');
    });

    it('User cannot claim from Giveaway contract to destination zeroAddress', async function () {
      const options = {
        mint: true,
        sand: true,
      };
      const setUp = await setupTestGiveaway(options);
      const {
        giveawayContract,
        others,
        allClaims,
        allTrees,
        allMerkleRoots,
      } = setUp;

      const badClaim = JSON.parse(JSON.stringify(allClaims[0][0])); // deep clone
      badClaim.to = zeroAddress; // bad param
      const userProofs = [];
      const userTrees = [];
      userTrees.push(allTrees[0]);
      const userClaims = [];
      userClaims.push(badClaim);
      userProofs.push(
        userTrees[0].getProof(calculateMultiClaimHash(allClaims[0][0]))
      );
      const userMerkleRoots = [];
      userMerkleRoots.push(allMerkleRoots[0]);
      const giveawayContractAsUser = await giveawayContract.connect(
        ethers.provider.getSigner(others[0])
      );

      await expect(
        giveawayContractAsUser.claimMultipleTokensFromMultipleMerkleTree(
          userMerkleRoots,
          userClaims,
          userProofs
        )
      ).to.be.revertedWith('MULTIGIVEAWAY_INVALID_TO_ZERO_ADDRESS');
    });

    it('User cannot claim from Giveaway contract to destination MFWGiveaway contract address', async function () {
      const options = {
        mint: true,
        sand: true,
      };
      const setUp = await setupTestGiveaway(options);
      const {
        giveawayContract,
        others,
        allClaims,
        allTrees,
        allMerkleRoots,
      } = setUp;

      const badClaim = JSON.parse(JSON.stringify(allClaims[0][0])); // deep clone
      badClaim.to = giveawayContract.address; // bad param
      const userProofs = [];
      const userTrees = [];
      userTrees.push(allTrees[0]);
      const userClaims = [];
      userClaims.push(badClaim);
      userProofs.push(
        userTrees[0].getProof(calculateMultiClaimHash(allClaims[0][0]))
      );
      const userMerkleRoots = [];
      userMerkleRoots.push(allMerkleRoots[0]);
      const giveawayContractAsUser = await giveawayContract.connect(
        ethers.provider.getSigner(others[0])
      );

      await expect(
        giveawayContractAsUser.claimMultipleTokensFromMultipleMerkleTree(
          userMerkleRoots,
          userClaims,
          userProofs
        )
      ).to.be.revertedWith('MULTIGIVEAWAY_DESTINATION_MULTIGIVEAWAY_CONTRACT');
    });

    it('User cannot claim from Giveaway if ERC1155 contract address is zeroAddress', async function () {
      const options = {
        mint: true,
        sand: true,
        badData: true,
      };
      const setUp = await setupTestGiveaway(options);
      const {
        giveawayContract,
        others,
        allClaims,
        allTrees,
        allMerkleRoots,
      } = setUp;

      // make arrays of claims and proofs relevant to specific user
      const userProofs = [];
      const userTrees = [];
      userTrees.push(allTrees[1]);
      const userClaims = [];
      const claim = allClaims[1][3];
      userClaims.push(claim);
      for (let i = 0; i < userClaims.length; i++) {
        userProofs.push(
          userTrees[i].getProof(calculateMultiClaimHash(userClaims[i]))
        );
      }
      const userMerkleRoots = [];
      userMerkleRoots.push(allMerkleRoots[1]);

      const user = others[0];
      const giveawayContractAsUser = await giveawayContract.connect(
        ethers.provider.getSigner(user)
      );

      await expect(
        giveawayContractAsUser.claimMultipleTokensFromMultipleMerkleTree(
          userMerkleRoots,
          userClaims,
          userProofs
        )
      ).to.be.revertedWith('CLAIM_INVALID_CONTRACT_ZERO_ADDRESS');
    });

    // it('User cannot claim from Giveaway if ERC721 contract address is zeroAddress', async function () {
    //   const options = {
    //     mint: true,
    //     sand: true,
    //     badData: true,
    //   };
    //   const setUp = await setupTestGiveaway(options);
    //   const {
    //     giveawayContract,
    //     others,
    //     allClaims,
    //     allTrees,
    //     allMerkleRoots,
    //   } = setUp;

    //   // make arrays of claims and proofs relevant to specific user
    //   const userProofs = [];
    //   const userTrees = [];
    //   userTrees.push(allTrees[1]);
    //   const userClaims = [];
    //   const claim = allClaims[1][2];
    //   userClaims.push(claim);
    //   for (let i = 0; i < userClaims.length; i++) {
    //     userProofs.push(
    //       userTrees[i].getProof(calculateMultiClaimHash(userClaims[i]))
    //     );
    //   }
    //   const userMerkleRoots = [];
    //   userMerkleRoots.push(allMerkleRoots[1]);

    //   const user = others[0];
    //   const giveawayContractAsUser = await giveawayContract.connect(
    //     ethers.provider.getSigner(user)
    //   );

    //   await expect(
    //     giveawayContractAsUser.claimMultipleTokensFromMultipleMerkleTree(
    //       userMerkleRoots,
    //       userClaims,
    //       userProofs
    //     )
    //   ).to.be.revertedWith('CLAIM_INVALID_CONTRACT_ZERO_ADDRESS');
    // });

    // it('User cannot claim from Giveaway if ERC20 contract address is zeroAddress', async function () {
    //   const options = {
    //     mint: true,
    //     sand: true,
    //     badData: true,
    //   };
    //   const setUp = await setupTestGiveaway(options);
    //   const {
    //     giveawayContract,
    //     others,
    //     allClaims,
    //     allTrees,
    //     allMerkleRoots,
    //   } = setUp;

    //   // make arrays of claims and proofs relevant to specific user
    //   const userProofs = [];
    //   const userTrees = [];
    //   userTrees.push(allTrees[1]);
    //   const userClaims = [];
    //   const claim = allClaims[1][4];
    //   userClaims.push(claim);
    //   for (let i = 0; i < userClaims.length; i++) {
    //     userProofs.push(
    //       userTrees[i].getProof(calculateMultiClaimHash(userClaims[i]))
    //     );
    //   }
    //   const userMerkleRoots = [];
    //   userMerkleRoots.push(allMerkleRoots[1]);

    //   const user = others[0];
    //   const giveawayContractAsUser = await giveawayContract.connect(
    //     ethers.provider.getSigner(user)
    //   );

    //   await expect(
    //     giveawayContractAsUser.claimMultipleTokensFromMultipleMerkleTree(
    //       userMerkleRoots,
    //       userClaims,
    //       userProofs
    //     )
    //   ).to.be.revertedWith('CLAIM_INVALID_CONTRACT_ZERO_ADDRESS');
    // });

    // it('User cannot claim from Giveaway if ERC20 contract address array length does not match amounts array length', async function () {
    //   const options = {
    //     mint: true,
    //     sand: true,
    //     badData: true,
    //   };
    //   const setUp = await setupTestGiveaway(options);
    //   const {
    //     giveawayContract,
    //     others,
    //     allClaims,
    //     allTrees,
    //     allMerkleRoots,
    //   } = setUp;

    //   // make arrays of claims and proofs relevant to specific user
    //   const userProofs = [];
    //   const userTrees = [];
    //   userTrees.push(allTrees[1]);
    //   const userClaims = [];
    //   const claim = allClaims[1][1];
    //   userClaims.push(claim);
    //   for (let i = 0; i < userClaims.length; i++) {
    //     userProofs.push(
    //       userTrees[i].getProof(calculateMultiClaimHash(userClaims[i]))
    //     );
    //   }
    //   const userMerkleRoots = [];
    //   userMerkleRoots.push(allMerkleRoots[1]);

    //   const user = others[0];
    //   const giveawayContractAsUser = await giveawayContract.connect(
    //     ethers.provider.getSigner(user)
    //   );

    //   await expect(
    //     giveawayContractAsUser.claimMultipleTokensFromMultipleMerkleTree(
    //       userMerkleRoots,
    //       userClaims,
    //       userProofs
    //     )
    //   ).to.be.revertedWith('CLAIM_INVALID_INPUT');
    // });

    it('User cannot claim from Giveaway if ERC1155 values array length does not match ids array length', async function () {
      const options = {
        mint: true,
        sand: true,
        badData: true,
      };
      const setUp = await setupTestGiveaway(options);
      const {
        giveawayContract,
        others,
        allClaims,
        allTrees,
        allMerkleRoots,
      } = setUp;

      // make arrays of claims and proofs relevant to specific user
      const userProofs = [];
      const userTrees = [];
      userTrees.push(allTrees[1]);
      const userClaims = [];
      const claim = allClaims[1][0];
      userClaims.push(claim);
      for (let i = 0; i < userClaims.length; i++) {
        userProofs.push(
          userTrees[i].getProof(calculateMultiClaimHash(userClaims[i]))
        );
      }
      const userMerkleRoots = [];
      userMerkleRoots.push(allMerkleRoots[1]);

      const user = others[0];
      const giveawayContractAsUser = await giveawayContract.connect(
        ethers.provider.getSigner(user)
      );

      await expect(
        giveawayContractAsUser.claimMultipleTokensFromMultipleMerkleTree(
          userMerkleRoots,
          userClaims,
          userProofs
        )
      ).to.be.revertedWith('CLAIM_INVALID_INPUT');
    });

    it('User cannot claim after the expiryTime', async function () {
      const options = {
        mint: true,
        sand: true,
      };
      const setUp = await setupTestGiveaway(options);
      const {
        giveawayContract,
        giveawayContractAsAdmin,
        others,
        allTrees,
        allClaims,
        allMerkleRoots,
      } = setUp;

      const duration = 30 * 24 * 60 * 60;
      const latestBlock = await ethers.provider.getBlock('latest');
      const periodFinish = latestBlock.timestamp + duration;

      const userProofs = [];
      const userTrees = [];
      userTrees.push(allTrees[0]);
      const userClaims = [];
      const claim = allClaims[0][0];
      userClaims.push(claim);
      for (let i = 0; i < userClaims.length; i++) {
        userProofs.push(
          userTrees[i].getProof(calculateMultiClaimHash(userClaims[i]))
        );
      }
      const userMerkleRoots = [];
      userMerkleRoots.push(allMerkleRoots[0]);

      await waitFor(
        giveawayContractAsAdmin.addNewGiveaway(allMerkleRoots[0], periodFinish)
      );
      await increaseTime(duration);

      const giveawayContractAsUser = await giveawayContract.connect(
        ethers.provider.getSigner(others[0])
      );
      await expect(
        giveawayContractAsUser.claimMultipleTokensFromMultipleMerkleTree(
          userMerkleRoots,
          userClaims,
          userProofs
        )
      ).to.be.revertedWith('MULTIGIVEAWAY_CLAIM_PERIOD_IS_OVER');
    });

    it('User cannot claim if expiryTime is 0', async function () {
      const options = {
        mint: true,
        sand: true,
      };
      const setUp = await setupTestGiveaway(options);
      const {
        giveawayContract,
        giveawayContractAsAdmin,
        others,
        allTrees,
        allClaims,
        allMerkleRoots,
      } = setUp;

      const periodFinish = BigNumber.from(0); // expiryTime 0
      const userProofs = [];
      const userTrees = [];
      userTrees.push(allTrees[0]);
      const userClaims = [];
      const claim = allClaims[0][0];
      userClaims.push(claim);
      for (let i = 0; i < userClaims.length; i++) {
        userProofs.push(
          userTrees[i].getProof(calculateMultiClaimHash(userClaims[i]))
        );
      }
      const userMerkleRoots = [];
      userMerkleRoots.push(allMerkleRoots[0]);

      await waitFor(
        giveawayContractAsAdmin.addNewGiveaway(allMerkleRoots[0], periodFinish)
      );

      const giveawayContractAsUser = await giveawayContract.connect(
        ethers.provider.getSigner(others[0])
      );
      await expect(
        giveawayContractAsUser.claimMultipleTokensFromMultipleMerkleTree(
          userMerkleRoots,
          userClaims,
          userProofs
        )
      ).to.be.revertedWith('MULTIGIVEAWAY_DOES_NOT_EXIST');
    });
  });

  describe('MFW_Giveaway_two_giveaways', function () {
    it('User cannot claim when test contract holds no tokens - multiple giveaways, 1 claim', async function () {
      const options = {multi: true};
      const setUp = await setupTestGiveaway(options);
      const {
        giveawayContract,
        others,
        allTrees,
        allClaims,
        allMerkleRoots,
      } = setUp;

      // make arrays of claims and proofs relevant to specific user
      const userProofs = [];
      const userTrees = [];
      userTrees.push(allTrees[0]);
      const userClaims = [];
      userClaims.push(allClaims[0][0]);
      for (let i = 0; i < userClaims.length; i++) {
        userProofs.push(
          userTrees[i].getProof(calculateMultiClaimHash(userClaims[i]))
        );
      }
      const userMerkleRoots = [];
      userMerkleRoots.push(allMerkleRoots[0]);

      const giveawayContractAsUser = await giveawayContract.connect(
        ethers.provider.getSigner(others[0])
      );

      await expect(
        giveawayContractAsUser.claimMultipleTokensFromMultipleMerkleTree(
          userMerkleRoots,
          userClaims,
          userProofs
        )
      ).to.be.revertedWith(`can't substract more than there is`);
    });

    it('User cannot claim sand when contract does not hold any - multiple giveaways, 1 claim', async function () {
      const options = {
        mint: true,
        multi: true,
      };
      const setUp = await setupTestGiveaway(options);
      const {
        giveawayContract,
        others,
        allTrees,
        allClaims,
        allMerkleRoots,
      } = setUp;

      // make arrays of claims and proofs relevant to specific user
      const userProofs = [];
      const userTrees = [];
      userTrees.push(allTrees[0]);
      const userClaims = [];
      userClaims.push(allClaims[0][0]);
      for (let i = 0; i < userClaims.length; i++) {
        userProofs.push(
          userTrees[i].getProof(calculateMultiClaimHash(userClaims[i]))
        );
      }
      const userMerkleRoots = [];
      userMerkleRoots.push(allMerkleRoots[0]);

      const giveawayContractAsUser = await giveawayContract.connect(
        ethers.provider.getSigner(others[0])
      );

      await expect(
        giveawayContractAsUser.claimMultipleTokensFromMultipleMerkleTree(
          userMerkleRoots,
          userClaims,
          userProofs
        )
      ).to.be.revertedWith(`not enough fund`);
    });

    it('User can claim allocated multiple tokens from Giveaway contract - multiple giveaways, 1 claim', async function () {
      const options = {
        mint: true,
        sand: true,
        multi: true,
      };
      const setUp = await setupTestGiveaway(options);
      const {
        giveawayContract,
        others,
        allTrees,
        allClaims,
        mfwContract,
        allMerkleRoots,
      } = setUp;

      // make arrays of claims and proofs relevant to specific user
      const userProofs = [];
      const userTrees = [];
      userTrees.push(allTrees[0]);
      const userClaims = [];
      const claim = allClaims[0][0];
      userClaims.push(claim);
      for (let i = 0; i < userClaims.length; i++) {
        userProofs.push(
          userTrees[i].getProof(calculateMultiClaimHash(userClaims[i]))
        );
      }
      const userMerkleRoots = [];
      userMerkleRoots.push(allMerkleRoots[0]);
      const user = others[0];
      const giveawayContractAsUser = await giveawayContract.connect(
        ethers.provider.getSigner(user)
      );

      await testInitialERC1155Balances(
        claim,
        mfwContract,
        giveawayContract
      );

      await waitFor(
        giveawayContractAsUser.claimMultipleTokensFromMultipleMerkleTree(
          userMerkleRoots,
          userClaims,
          userProofs
        )
      );

      await testFinalERC1155Balances(
        claim,
        user,
        mfwContract,
      );
    });

    it('User can claim allocated multiple tokens from Giveaway contract - multiple giveaways, 2 claims', async function () {
      const options = {
        mint: true,
        sand: true,
        multi: true,
      };
      const setUp = await setupTestGiveaway(options);
      const {
        giveawayContract,
        others,
        allTrees,
        allClaims,
        mfwContract,
        allMerkleRoots,
      } = setUp;

      // make arrays of claims and proofs relevant to specific user
      const userProofs = [];
      const userClaims = [];
      const claim = allClaims[0][0];
      const secondClaim = allClaims[1][0];
      userClaims.push(claim);
      userClaims.push(secondClaim);

      for (let i = 0; i < userClaims.length; i++) {
        userProofs.push(
          allTrees[i].getProof(calculateMultiClaimHash(userClaims[i]))
        );
      }
      const userMerkleRoots = [];
      userMerkleRoots.push(allMerkleRoots[0]);
      userMerkleRoots.push(allMerkleRoots[1]);
      const user = others[0];
      const giveawayContractAsUser = await giveawayContract.connect(
        ethers.provider.getSigner(user)
      );

      // Claim 1

      await testInitialERC1155Balances(
        claim,
        mfwContract,
        giveawayContract
      );

      // Claim 2

      await testInitialERC1155Balances(
        secondClaim,
        mfwContract,
        giveawayContract
      );

      await waitFor(
        giveawayContractAsUser.claimMultipleTokensFromMultipleMerkleTree(
          userMerkleRoots,
          userClaims,
          userProofs
        )
      );

      // Claim 1

      await testFinalERC1155Balances(
        claim,
        user,
        mfwContract,
      );

      // Claim 2

      await testFinalERC1155Balances(
        secondClaim,
        user,
        mfwContract,
      );
    });

    it('User cannot claim from Giveaway contract if the claims array length does not match merkle root array length', async function () {
      const options = {
        mint: true,
        sand: true,
        multi: true,
      };
      const setUp = await setupTestGiveaway(options);
      const {
        giveawayContract,
        others,
        allTrees,
        allClaims,
        allMerkleRoots,
      } = setUp;

      // make arrays of claims and proofs relevant to specific user
      const userProofs = [];
      const userTrees = [];
      userTrees.push(allTrees[0]);
      const userClaims = [];
      const claim = allClaims[0][0];
      userClaims.push(claim);
      for (let i = 0; i < userClaims.length; i++) {
        userProofs.push(
          userTrees[i].getProof(calculateMultiClaimHash(userClaims[i]))
        );
      }
      const userMerkleRoots = [];
      userMerkleRoots.push(allMerkleRoots[0]);
      userMerkleRoots.push(allMerkleRoots[0]); // extra merkle root
      const user = others[0];
      const giveawayContractAsUser = await giveawayContract.connect(
        ethers.provider.getSigner(user)
      );

      await expect(
        giveawayContractAsUser.claimMultipleTokensFromMultipleMerkleTree(
          userMerkleRoots,
          userClaims,
          userProofs
        )
      ).to.be.revertedWith('MULTIGIVEAWAY_INVALID_INPUT');
    });

    it('User cannot claim from Giveaway contract if the claims array length does not match proofs array length', async function () {
      const options = {
        mint: true,
        sand: true,
        multi: true,
      };
      const setUp = await setupTestGiveaway(options);
      const {
        giveawayContract,
        others,
        allTrees,
        allClaims,
        allMerkleRoots,
      } = setUp;

      // make arrays of claims and proofs relevant to specific user
      const userProofs = [];
      const userTrees = [];
      userTrees.push(allTrees[0]);
      const userClaims = [];
      const claim = allClaims[0][0];
      userClaims.push(claim);
      for (let i = 0; i < userClaims.length; i++) {
        userProofs.push(
          userTrees[i].getProof(calculateMultiClaimHash(userClaims[i]))
        );
      }
      userProofs.push(userProofs[0]); // extra proof
      const userMerkleRoots = [];
      userMerkleRoots.push(allMerkleRoots[0]);
      const user = others[0];
      const giveawayContractAsUser = await giveawayContract.connect(
        ethers.provider.getSigner(user)
      );

      await expect(
        giveawayContractAsUser.claimMultipleTokensFromMultipleMerkleTree(
          userMerkleRoots,
          userClaims,
          userProofs
        )
      ).to.be.revertedWith('MULTIGIVEAWAY_INVALID_INPUT');
    });

    it('User cannot claim allocated tokens from Giveaway contract more than once - multiple giveaways, 2 claims', async function () {
      const options = {
        mint: true,
        sand: true,
        multi: true,
      };
      const setUp = await setupTestGiveaway(options);
      const {
        giveawayContract,
        others,
        allTrees,
        allClaims,
        allMerkleRoots,
      } = setUp;

      // make arrays of claims and proofs relevant to specific user
      const userProofs = [];
      const userClaims = [];
      const claim = allClaims[0][0];
      const secondClaim = allClaims[1][0];
      userClaims.push(claim);
      userClaims.push(secondClaim);

      for (let i = 0; i < userClaims.length; i++) {
        userProofs.push(
          allTrees[i].getProof(calculateMultiClaimHash(userClaims[i]))
        );
      }
      const userMerkleRoots = [];
      userMerkleRoots.push(allMerkleRoots[0]);
      userMerkleRoots.push(allMerkleRoots[1]);

      const giveawayContractAsUser = await giveawayContract.connect(
        ethers.provider.getSigner(others[0])
      );

      await waitFor(
        giveawayContractAsUser.claimMultipleTokensFromMultipleMerkleTree(
          userMerkleRoots,
          userClaims,
          userProofs
        )
      );

      await expect(
        giveawayContractAsUser.claimMultipleTokensFromMultipleMerkleTree(
          userMerkleRoots,
          userClaims,
          userProofs
        )
      ).to.be.revertedWith(`MULTIGIVEAWAY_DESTINATION_ALREADY_CLAIMED`);
    });
  });

  describe('MFW_Giveaway_single_claim', function () {
    it('User cannot claim when test contract holds no tokens', async function () {
      const options = {};
      const setUp = await setupTestGiveaway(options);
      const {
        giveawayContract,
        others,
        allTrees,
        allClaims, // all claims from all giveaways
        allMerkleRoots,
      } = setUp;

      const tree = allTrees[0];
      const claim = allClaims[0][0];
      const proof = tree.getProof(calculateMultiClaimHash(claim));
      const merkleRoot = allMerkleRoots[0];

      const giveawayContractAsUser = await giveawayContract.connect(
        ethers.provider.getSigner(others[0])
      );

      await expect(
        giveawayContractAsUser.claimMultipleTokens(merkleRoot, claim, proof)
      ).to.be.revertedWith(`can't substract more than there is`);
    });

    it('User cannot claim sand when contract does not hold any', async function () {
      const options = {
        mint: true,
      };
      const setUp = await setupTestGiveaway(options);
      const {
        giveawayContract,
        others,
        allTrees,
        allClaims,
        allMerkleRoots,
      } = setUp;

      const tree = allTrees[0];
      const claim = allClaims[0][0];
      const proof = tree.getProof(calculateMultiClaimHash(claim));
      const merkleRoot = allMerkleRoots[0];

      const giveawayContractAsUser = await giveawayContract.connect(
        ethers.provider.getSigner(others[0])
      );

      await expect(
        giveawayContractAsUser.claimMultipleTokens(merkleRoot, claim, proof)
      ).to.be.revertedWith(`not enough fund`);
    });

    it('User can claim allocated multiple tokens from Giveaway contract', async function () {
      const options = {
        mint: true,
        sand: true,
      };
      const setUp = await setupTestGiveaway(options);
      const {
        giveawayContract,
        others,
        allTrees,
        allClaims,
        mfwContract,
        allMerkleRoots,
      } = setUp;

      const tree = allTrees[0];
      const claim = allClaims[0][0];
      const proof = tree.getProof(calculateMultiClaimHash(claim));
      const merkleRoot = allMerkleRoots[0];
      const user = others[0];
      const giveawayContractAsUser = await giveawayContract.connect(
        ethers.provider.getSigner(user)
      );

      await testInitialERC1155Balances(
        claim,
        mfwContract,
        giveawayContract
      );

      await waitFor(
        giveawayContractAsUser.claimMultipleTokens(merkleRoot, claim, proof)
      );

      await testFinalERC1155Balances(
        claim,
        user,
        mfwContract,
      );
    });

    it('Claimed Event is emitted for successful claim', async function () {
      const options = {
        mint: true,
        sand: true,
      };
      const setUp = await setupTestGiveaway(options);
      const {
        giveawayContract,
        others,
        allClaims,
        allTrees,
        allMerkleRoots,
      } = setUp;

      const tree = allTrees[0];
      const claim = allClaims[0][0];
      const proof = tree.getProof(calculateMultiClaimHash(claim));
      const merkleRoot = allMerkleRoots[0];
      const giveawayContractAsUser = await giveawayContract.connect(
        ethers.provider.getSigner(others[0])
      );

      const receipt = await waitFor(
        giveawayContractAsUser.claimMultipleTokens(merkleRoot, claim, proof)
      );

      const claimedEvent = await expectReceiptEventWithArgs(
        receipt,
        'ClaimedMultipleTokens'
      );
      expect(claimedEvent.args[0]).to.equal(others[0]); // to

      expect(claimedEvent.args[1][0][0][0]).to.equal(claim.erc1155[0].ids[0]);
      expect(claimedEvent.args[1][0][0][1]).to.equal(claim.erc1155[0].ids[1]);
      expect(claimedEvent.args[1][0][0][2]).to.equal(claim.erc1155[0].ids[2]);

      expect(claimedEvent.args[1][0][1][0]).to.equal(
        claim.erc1155[0].values[0]
      );
      expect(claimedEvent.args[1][0][1][1]).to.equal(
        claim.erc1155[0].values[1]
      );
      expect(claimedEvent.args[1][0][1][2]).to.equal(
        claim.erc1155[0].values[2]
      );

      expect(claimedEvent.args[1][0][2]).to.equal(
        claim.erc1155[0].contractAddress
      );

      expect(claimedEvent.args[2][0][0][0]).to.equal(claim.erc721[0].ids[0]);
      expect(claimedEvent.args[2][0][0][1]).to.equal(claim.erc721[0].ids[1]);
      expect(claimedEvent.args[2][0][0][2]).to.equal(claim.erc721[0].ids[2]);
      expect(claimedEvent.args[2][0][0][3]).to.equal(claim.erc721[0].ids[3]);
      expect(claimedEvent.args[2][0][0][4]).to.equal(claim.erc721[0].ids[4]);
      expect(claimedEvent.args[2][0][0][5]).to.equal(claim.erc721[0].ids[5]);
      expect(claimedEvent.args[2][0][1]).to.equal(
        claim.erc721[0].contractAddress
      );
      expect(claimedEvent.args[3][0][0]).to.equal(claim.erc20.amounts[0]);
      expect(claimedEvent.args[3][1][0]).to.equal(
        claim.erc20.contractAddresses[0]
      );

      expect(claimedEvent.args[4]).to.equal(merkleRoot);
    });
    it('User cannot claim more than once', async function () {
      const options = {
        mint: true,
        sand: true,
      };
      const setUp = await setupTestGiveaway(options);
      const {
        giveawayContract,
        others,
        allTrees,
        allClaims,
        allMerkleRoots,
      } = setUp;

      const tree = allTrees[0];
      const claim = allClaims[0][0];
      const proof = tree.getProof(calculateMultiClaimHash(claim));
      const merkleRoot = allMerkleRoots[0];

      const giveawayContractAsUser = await giveawayContract.connect(
        ethers.provider.getSigner(others[0])
      );

      await waitFor(
        giveawayContractAsUser.claimMultipleTokens(merkleRoot, claim, proof)
      );
      await expect(
        giveawayContractAsUser.claimMultipleTokens(merkleRoot, claim, proof)
      ).to.be.revertedWith('MULTIGIVEAWAY_DESTINATION_ALREADY_CLAIMED');
    });
  });
});

