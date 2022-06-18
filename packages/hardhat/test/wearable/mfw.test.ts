import {setupNFTs} from './fixtures';
import {expect} from '../../chai-setup';
import { BigNumber } from 'ethers';

describe('MFW', function () {
  describe('Roles', function () {
    it('Admin has been set', async function () {
      const setUp = await setupNFTs();
      const {mfwAdmin, mfwContract} = setUp;
      expect(await mfwContract.isAdmin(mfwAdmin)).to.be.true;
    });
  });
  describe('Ownership', function () {
    it('Owner can transferOwnership to a new owner', async function () {
      const setUp = await setupNFTs();
      const {mfwContract, deployer, others} = setUp;
      let owner = await mfwContract.owner();
      expect(owner).to.be.equal(deployer);
      await mfwContract.transferOwnership(others[0]);
      owner = await mfwContract.owner();
      expect(owner).to.be.equal(others[0]);
    });
    it('Cannot transferOwnership if not owner', async function () {
      const setUp = await setupNFTs();
      const {mfwContractAsUser, deployer, others} = setUp;
      await expect(mfwContractAsUser.transferOwnership(others[0])).to.be.revertedWith(`Ownable: caller is not the owner`);
    });
  });
  describe('Mint_Base_New', function () {
    it('Admin can mint', async function () {
      const setUp = await setupNFTs();
      const {mfwContract, mintNewTestMFW, others} = setUp;
      await mintNewTestMFW(1, 5, 5, others[0], [""]);
      expect(await mfwContract.balanceOf(others[0], 1)).to.be.equal(5);
      expect(await mfwContract.balanceOf(others[0], 2)).to.be.equal(5);
      expect(await mfwContract.balanceOf(others[0], 3)).to.be.equal(5);
      expect(await mfwContract.balanceOf(others[0], 4)).to.be.equal(5);
      expect(await mfwContract.balanceOf(others[0], 5)).to.be.equal(5);
    });
    it('Cannot mint if not approved admin', async function () {
      const setUp = await setupNFTs();
      const {mfwContractAsUser, others} = setUp;
      await expect(mfwContractAsUser.mintBaseNew([others[0]], [BigNumber.from(5)], [""])).to.be.revertedWith(`AdminControl: Must be owner or admin`);
    });
    it('Owner can approve another admin who can mint', async function () {
      const setUp = await setupNFTs();
      const {mfwContractAsUser, others, mfwContract, mfwAdmin} = setUp;
      expect(await mfwContract.isAdmin(others[0])).to.be.false;
      await expect(mfwContractAsUser.mintBaseNew([others[0]], [BigNumber.from(5)], [""])).to.be.revertedWith(`AdminControl: Must be owner or admin`);
      await mfwContract.approveAdmin(others[0]); // approvals can only be made by owner (in this case deployer), not by other admins
      expect(await mfwContract.isAdmin(others[0])).to.be.true;
      expect(await mfwContract.isAdmin(mfwAdmin)).to.be.true;
      await mfwContractAsUser.mintBaseNew([others[0]], [BigNumber.from(5)], [""]);
      expect(await mfwContract.balanceOf(others[0], 1)).to.be.equal(5);
    });
    it('New admins cannot add other admins', async function () {
      const setUp = await setupNFTs();
      const {others, mfwContractAsAdmin} = setUp;
      await expect(mfwContractAsAdmin.approveAdmin(others[0])).to.be.revertedWith(`Ownable: caller is not the owner`);
    });
  });
  describe('Mint_Base_Existing', function () {
    it('Admin can mint', async function () {
      const setUp = await setupNFTs();
      const {mfwContract, mintNewTestMFW, mintExistingTestMFW, others} = setUp;
      await mintNewTestMFW(1, 5, 5, others[0], [""]);
      await mintExistingTestMFW(others[0], 1, 7);
      expect(await mfwContract.balanceOf(others[0], 1)).to.be.equal(12);
      expect(await mfwContract.balanceOf(others[0], 2)).to.be.equal(5);
      expect(await mfwContract.balanceOf(others[0], 3)).to.be.equal(5);
      expect(await mfwContract.balanceOf(others[0], 4)).to.be.equal(5);
      expect(await mfwContract.balanceOf(others[0], 5)).to.be.equal(5);
    });
    it('Cannot mint if not admin', async function () {
      const setUp = await setupNFTs();
      const {mfwContractAsUser, mintNewTestMFW, others} = setUp;
      await mintNewTestMFW(1, 5, 5, others[0], [""]);
      await expect(mfwContractAsUser.mintBaseExisting([others[0]], [1], [BigNumber.from(5)])).to.be.revertedWith(`AdminControl: Must be owner or admin`);
    });
    it('Admin can approve another admin who can mint', async function () {
      const setUp = await setupNFTs();
      const {mfwContract, mintNewTestMFW, others, mfwAdmin, mfwContractAsUser} = setUp;
      expect(await mfwContract.isAdmin(others[0])).to.be.false;
      await mintNewTestMFW(1, 5, 5, others[0], [""]);
      await expect(mfwContractAsUser.mintBaseExisting([others[0]], [1], [BigNumber.from(5)])).to.be.revertedWith(`AdminControl: Must be owner or admin`);
      await mfwContract.approveAdmin(others[0]); // approvals can only be made by owner (in this case deployer), not by other admins
      expect(await mfwContract.isAdmin(others[0])).to.be.true;
      expect(await mfwContract.isAdmin(mfwAdmin)).to.be.true;
      await mfwContractAsUser.mintBaseExisting([others[0]], [1], [BigNumber.from(5)]);
      expect(await mfwContract.balanceOf(others[0], 1)).to.be.equal(10);
    });
  });
  describe('Token_URI', function () {
    it('Token URI can be retrieved', async function () {
      const setUp = await setupNFTs();
      const {mfwContract, mintNewTestMFW, others} = setUp;
      await mintNewTestMFW(1, 5, 5, others[0], [""]);
      expect(await mfwContract.uri(1)).to.be.equal("testWearableBaseTokenUriERC1155/1");
      expect(await mfwContract.uri(2)).to.be.equal("testWearableBaseTokenUriERC1155/2");
      expect(await mfwContract.uri(3)).to.be.equal("testWearableBaseTokenUriERC1155/3");
      expect(await mfwContract.uri(4)).to.be.equal("testWearableBaseTokenUriERC1155/4");
      expect(await mfwContract.uri(5)).to.be.equal("testWearableBaseTokenUriERC1155/5");
    });
    it('Can set specific token URIs with mintBaseNew', async function () {
      const setUp = await setupNFTs();
      const {mfwContract, mintNewTestMFW, others} = setUp;
      await mintNewTestMFW(1, 5, 5, others[0], [""]);
      await mintNewTestMFW(6, 7, 5, others[0], ["newUri"]);
      expect(await mfwContract.uri(1)).to.be.equal("testWearableBaseTokenUriERC1155/1");
      expect(await mfwContract.uri(2)).to.be.equal("testWearableBaseTokenUriERC1155/2");
      expect(await mfwContract.uri(3)).to.be.equal("testWearableBaseTokenUriERC1155/3");
      expect(await mfwContract.uri(4)).to.be.equal("testWearableBaseTokenUriERC1155/4");
      expect(await mfwContract.uri(5)).to.be.equal("testWearableBaseTokenUriERC1155/5");
      expect(await mfwContract.uri(6)).to.be.equal("newUri");
      expect(await mfwContract.uri(7)).to.be.equal("newUri");
    });
    it('Can alter a specific tokenUri', async function () {
      const setUp = await setupNFTs();
      const {mfwContract, mintNewTestMFW, others, mfwContractAsAdmin} = setUp;
      await mintNewTestMFW(1, 5, 5, others[0], [""]);
      await mintNewTestMFW(6, 7, 5, others[0], ["newUri"]);
      expect(await mfwContract.uri(1)).to.be.equal("testWearableBaseTokenUriERC1155/1");
      expect(await mfwContract.uri(2)).to.be.equal("testWearableBaseTokenUriERC1155/2");
      expect(await mfwContract.uri(3)).to.be.equal("testWearableBaseTokenUriERC1155/3");
      expect(await mfwContract.uri(4)).to.be.equal("testWearableBaseTokenUriERC1155/4");
      expect(await mfwContract.uri(5)).to.be.equal("testWearableBaseTokenUriERC1155/5");
      expect(await mfwContract.uri(6)).to.be.equal("newUri");
      expect(await mfwContract.uri(7)).to.be.equal("newUri");
      await mfwContractAsAdmin['setTokenURI(uint256,string)'](6, "changedAgain");
      expect(await mfwContract.uri(6)).to.be.equal("changedAgain");
    });
    it('Can alter multiple specific tokenUris', async function () {
      const setUp = await setupNFTs();
      const {mfwContract, mintNewTestMFW, others, mfwContractAsAdmin} = setUp;
      await mintNewTestMFW(1, 5, 5, others[0], [""]);
      await mintNewTestMFW(6, 7, 5, others[0], ["newUri"]);
      expect(await mfwContract.uri(1)).to.be.equal("testWearableBaseTokenUriERC1155/1");
      expect(await mfwContract.uri(2)).to.be.equal("testWearableBaseTokenUriERC1155/2");
      expect(await mfwContract.uri(3)).to.be.equal("testWearableBaseTokenUriERC1155/3");
      expect(await mfwContract.uri(4)).to.be.equal("testWearableBaseTokenUriERC1155/4");
      expect(await mfwContract.uri(5)).to.be.equal("testWearableBaseTokenUriERC1155/5");
      expect(await mfwContract.uri(6)).to.be.equal("newUri");
      expect(await mfwContract.uri(7)).to.be.equal("newUri");
      await mfwContractAsAdmin['setTokenURI(uint256[],string[])']([6, 7], ["changedAgain", "anotherNewOne"]);
      expect(await mfwContract.uri(6)).to.be.equal("changedAgain");
      expect(await mfwContract.uri(7)).to.be.equal("anotherNewOne");
    });
    it('Cannot change tokenUri if not admin', async function () {
      const setUp = await setupNFTs();
      const {mintNewTestMFW, others, mfwContractAsUser} = setUp;
      await mintNewTestMFW(1, 5, 5, others[0], [""]);
      await expect(mfwContractAsUser['setTokenURI(uint256,string)'](6, "changedAgain")).to.be.revertedWith(`AdminControl: Must be owner or admin`);
    });
    it('Cannot change tokenUris if not admin', async function () {
      const setUp = await setupNFTs();
      const {mintNewTestMFW, others, mfwContractAsUser} = setUp;
      await mintNewTestMFW(1, 5, 5, others[0], [""]);
      await expect(mfwContractAsUser['setTokenURI(uint256[],string[])']([6, 7], ["changedAgain", "anotherNewOne"])).to.be.revertedWith(`AdminControl: Must be owner or admin`);
    });
  });
});