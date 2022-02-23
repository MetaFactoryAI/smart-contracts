const { ethers } = require("hardhat");
const { expect } = require("chai");

describe("RNFTGiveaway", function () {
  it("Initial deploy", async function () {
    const [deployer] = await ethers.getSigners();

    const RNFTGiveaway = await ethers.getContractFactory("RNFTGiveaway");

    const rNFT = await RNFTGiveaway.deploy();

    // TODO:
    // Can claim MFT
  });
});
