import {ethers} from "hardhat";
import {expect} from "chai";

describe("MFWUniques contract", function () {
  it("Initial deploy", async function () {
    const [deployer] = await ethers.getSigners();

    const MFWU = await ethers.getContractFactory("MFWUniques");

    const mfwu = await MFWU.deploy("MetaFactory Uniques", "MFWU");

    // TODO:
    // Add some metadata tests relating to: image, animation_url, properties
  });
});