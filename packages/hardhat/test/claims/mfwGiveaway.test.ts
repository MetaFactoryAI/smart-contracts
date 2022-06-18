import {ethers} from 'hardhat';
import {setupTestGiveaway} from './fixtures';
import {constants, BigNumber} from 'ethers';
import {
  waitFor,
  expectReceiptEventWithArgs,
  increaseTime,
} from '../utils';
import {expect} from '../../chai-setup';
import helpers from '../../lib/merkleTreeHelper';

const {calculateMultiClaimHash} = helpers;

import {
  testInitialERC1155Balances,
  testFinalERC1155Balances,
} from './balanceHelpers';

const zeroAddress = constants.AddressZero;
const emptyBytes32 =
  '0x0000000000000000000000000000000000000000000000000000000000000000';

describe('MFW_Giveaway_ERC1155', function () {
  describe('Roles', function () {
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
  });

  describe('Users claim status', function () {
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
        multi: true,
      };
      const setUp = await setupTestGiveaway(options);
      const {
        giveawayContract,
        others,
        allTrees,
        allClaims,
        allMerkleRoots,
        mfwContract
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
  });

  describe('Contract interfaces', function () {

    // ERC721

    it('MFWGiveaway contract returns ERC721 received', async function () {
      const options = {};
      const setUp = await setupTestGiveaway(options);
      const {giveawayContract, mfwGiveawayAdmin, mfwuContract} = setUp;
      const result = await giveawayContract.onERC721Received(
        mfwGiveawayAdmin,
        mfwuContract.address,
        0,
        '0x'
      );
      const expectedResult = '0x150b7a02';
      expect(result).to.equal(expectedResult);
    });

    it('MFWGiveaway contract returns ERC721 Batch received', async function () {
      const options = {};
      const setUp = await setupTestGiveaway(options);
      const {giveawayContract, mfwGiveawayAdmin, mfwuContract} = setUp;
      const result = await giveawayContract.onERC721BatchReceived(
        mfwGiveawayAdmin,
        mfwuContract.address,
        [0, 1],
        '0x'
      );
      const expectedResult = '0x4b808c46';
      expect(result).to.equal(expectedResult);
    });

    // ERC1155 

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

  // User can claim from 1 or more giveaways (ie 1 or more merkle root hashes) - one merkle root in test setup
  describe('claimMultipleTokensFromMultipleMerkleTree - 1 giveaway / 1 merkle root', function () {
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
          userTrees[0].getProof(calculateMultiClaimHash(userClaims[i]))
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
      ).to.be.revertedWith(`ERC1155: insufficient balance for transfer`);
    });

    it('User can claim allocated multiple tokens from Giveaway contract - ERC1155', async function () {
      const options = {
        mint: true,
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
          userTrees[0].getProof(calculateMultiClaimHash(userClaims[i]))
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
          userTrees[0].getProof(calculateMultiClaimHash(userClaims[i]))
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

      const userProofs = [];
      const userTrees = [];
      userTrees.push(allTrees[0]);
      const userClaims = [];
      const claim = allClaims[0][0];
      userClaims.push(claim);
      for (let i = 0; i < userClaims.length; i++) {
        userProofs.push(
          userTrees[0].getProof(calculateMultiClaimHash(userClaims[i]))
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
      ).to.be.revertedWith('DESTINATION_ALREADY_CLAIMED');
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
      ).to.be.revertedWith('INVALID_CLAIM');
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
      ).to.be.revertedWith('INVALID_TO_ZERO_ADDRESS');
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
      ).to.be.revertedWith('DESTINATION_MULTIGIVEAWAY_CONTRACT');
    });

    it('User cannot claim from Giveaway if ERC1155 contract address is zeroAddress', async function () {
      const options = {
        mint: true,
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
          userTrees[0].getProof(calculateMultiClaimHash(userClaims[i]))
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
      ).to.be.revertedWith('INVALID_CONTRACT_ZERO_ADDRESS');
    });


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
          userTrees[0].getProof(calculateMultiClaimHash(userClaims[i]))
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
      ).to.be.revertedWith('INVALID_INPUT');
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
          userTrees[0].getProof(calculateMultiClaimHash(userClaims[i]))
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
      ).to.be.revertedWith('CLAIM_PERIOD_IS_OVER');
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
          userTrees[0].getProof(calculateMultiClaimHash(userClaims[i]))
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
      ).to.be.revertedWith('GIVEAWAY_DOES_NOT_EXIST');
    });
  });

  // User can claim from 1 or more giveaways (ie 1 or more merkle root hashes) - two merkle roots in test setup
  describe('claimMultipleTokensFromMultipleMerkleTree - 2 giveaway / 2 merkle roots', function () {
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
      userTrees.push(allTrees[0]); // Note: 1 tree needed for test because only 1 claim
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
      ).to.be.revertedWith(`ERC1155: insufficient balance for transfer`);
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
      userTrees.push(allTrees[0]); // Note: 1 tree needed for test because only 1 claim
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
          allTrees[i].getProof(calculateMultiClaimHash(userClaims[i])) // Note: can increment i like this because 1 claim per tree
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
      const userClaims = [];
      const claim = allClaims[0][0];
      userClaims.push(claim);
      for (let i = 0; i < userClaims.length; i++) {
        userProofs.push(
          allTrees[i].getProof(calculateMultiClaimHash(userClaims[i])) // Note: can increment i like this because 1 claim per tree
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
      ).to.be.revertedWith('INVALID_INPUT');
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
      const userClaims = [];
      const claim = allClaims[0][0];
      userClaims.push(claim);
      for (let i = 0; i < userClaims.length; i++) {
        userProofs.push(
          allTrees[i].getProof(calculateMultiClaimHash(userClaims[i])) // Note: can increment i like this because 1 claim per tree
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
      ).to.be.revertedWith('INVALID_INPUT');
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
          allTrees[i].getProof(calculateMultiClaimHash(userClaims[i])) // Note: can increment i like this because 1 claim per tree
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
      ).to.be.revertedWith(`DESTINATION_ALREADY_CLAIMED`);
    });
  });

  // User can claim multiple token types for a given merkle root hash
  describe('claimMultipleTokens - claim multiple token types for a given merkle root hash', function () {
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
      ).to.be.revertedWith(`ERC1155: insufficient balance for transfer`);
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

      // event ClaimedMultipleTokens(
      //   address to,
      //   ERC1155Claim[] erc1155,
      //   ERC721Claim[] erc721,
      //   ERC20Claim erc20,
      //   bytes32 merkleRoot
      // );

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

      expect(claimedEvent.args[4]).to.equal(merkleRoot)
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
      ).to.be.revertedWith('DESTINATION_ALREADY_CLAIMED');
    });
  });
});

