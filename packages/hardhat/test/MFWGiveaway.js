const { ethers } = require("hardhat");
const { expect } = require("chai");

describe("MFWGiveaway", function () {
  it("Initial deploy", async function () {
    const [deployer] = await ethers.getSigners();

    const MFWGiveaway = await ethers.getContractFactory("MFWGiveaway");

    const mfw = await MFWGiveaway.deploy();

    // TODO:
    // Can claim MFT
  });
});
