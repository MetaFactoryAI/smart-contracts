const { ethers } = require("hardhat");
const { expect } = require("chai");

describe("RNFT contract", function () {
  it("Initial deploy", async function () {
    const [deployer] = await ethers.getSigners();

    const RNFT = await ethers.getContractFactory("RNFT");

    const rNFT = await RNFT.deploy();

    // TODO:
    // Add some metadata tests relating to: image, animation_url, properties
  });
});
