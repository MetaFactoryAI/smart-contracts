const { ethers, getNamedAccounts } = require("hardhat");

const { BigNumber } = ethers;

const delayMS = 1000;

const main = async () => {
  const { deployer } = await getNamedAccounts();
  const toAddress = "0x34447Da006A91d855c702A6759e2FCEA35b31Da2";

  console.log("\n\n 🎫 Minting to base new" + toAddress + "...\n");
  const mfw = await ethers.getContract("MFW", deployer);

  // ERC1155
  const mintBaseNewErc1155 = async (toArray, amountArray, uriArray) =>
    mfw.mintBaseNew(toArray, amountArray, uriArray);

  // generate dummy NFTs for a new base and give to toAddress
  await mintBaseNewErc1155(
    [toAddress], // To
    [BigNumber.from("5")], // Desired supply
    [""], // The "base"
    {
      gasLimit: 400000,
    }
  );
  const balance = await mfw.balanceOf(toAddress, BigNumber.from("1"));
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
