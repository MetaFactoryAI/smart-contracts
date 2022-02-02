/* eslint no-use-before-define: "warn" */
const { ethers, getNamedAccounts } = require("hardhat");

const { BigNumber } = ethers;

const delayMS = 1000;

const main = async () => {
  const { deployer } = await getNamedAccounts();
  const toAddress = deployer;

  console.log("\n\n 🎫 Minting to " + deployer + "...\n");
  const rnft = await ethers.getContract("RNFT", deployer);

  // ERC1155
  const mintBaseNewErc1155 = async (toArray, amountArray, uriArray) =>
    rnft.mintBaseNew(toArray, amountArray, uriArray);

  const mintBaseExistingErc1155 = async (toArray, tokenIdArray, amountArray) =>
    rnft.mintBaseNew(toArray, tokenIdArray, amountArray);

  // generate NFTs and give to toAddress

  await mintBaseNewErc1155([toAddress], [BigNumber.from("5")], [""], {
    gasLimit: 400000,
  });

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  await sleep(delayMS);
};

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
