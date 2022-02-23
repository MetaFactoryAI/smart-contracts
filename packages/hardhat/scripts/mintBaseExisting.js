const { ethers, getNamedAccounts } = require("hardhat");

const { BigNumber } = ethers;

const delayMS = 1000;

const main = async () => {
  const { deployer } = await getNamedAccounts();
  const toAddress = "0x34447Da006A91d855c702A6759e2FCEA35b31Da2";

  console.log("\n\n 🎫 Minting to base existing" + toAddress + "...\n");
  const rnft = await ethers.getContract("RNFT", deployer);

  // ERC1155
  const mintBaseExistingErc1155 = async (toArray, tokenIdArray, amountArray) =>
    rnft.mintBaseExisting(toArray, tokenIdArray, amountArray);

  // generate dummy NFTs for an existing ID and base and give to toAddress
  await mintBaseExistingErc1155(
    [toAddress], // To
    [BigNumber.from("1")], // ID: in order to work this ID must already have been minted!
    [BigNumber.from("5")], // Desired supply
    [""], // The "base"
    {
      gasLimit: 400000,
    }
  );
  const balance = await rnft.balanceOf(toAddress, BigNumber.from("1"));
  console.log("balance", balance.toNumber());

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
