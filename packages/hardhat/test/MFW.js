const { ethers } = require("hardhat");
const { expect } = require("chai");

describe("MFW contract", function () {
  it("Initial deploy", async function () {
    const [deployer] = await ethers.getSigners();

    const MFW = await ethers.getContractFactory("MFW");

    const mfw = await MFW.deploy();

    // TODO:
    // Add some metadata tests relating to: image, animation_url, properties
  });
});
