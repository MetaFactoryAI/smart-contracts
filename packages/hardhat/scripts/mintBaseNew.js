const { ethers, getNamedAccounts } = require("hardhat");
const axios = require('axios').default;
const fs = require("fs");
const {expect} = require('../chai-setup');

const {
  waitFor,
  expectReceiptEventWithArgs,
  expectEventWithArgs,
  increaseTime,
} = require('../test/utils');

const { BigNumber } = ethers;

const delayMS = 1000;

// ***FOR NEW IDS ONLY THAT HAVE NEVER BEEN MINTED BEFORE***
// ***FOR MINTED IDS SEE .json FILES***
// Note: if script isn't working on testnet it could be that the IDs have already been minted
const main = async () => {
  const { deployer, mfwAdmin } = await getNamedAccounts();
  const chainId = await getChainId();

  // TODO: confirm destination for minting
  const toAddress = mfwAdmin;

  // Gather IDs to mint
  const response = await axios.get("https://mf-services.vercel.app/api/nftMetadata/");
  const wearableData = response.data;
  const idsUnfiltered = [];
  const supply = [];
  for (let i = 0; i < wearableData.length; i++) {
    idsUnfiltered.push(wearableData[i]);
    // TODO: supplies
  }
  
  const uniqueIds = [ ... new Set(idsUnfiltered.map(id => id.nft_token_id))];
  uniqueIds.sort();

  // console.log("\n\n 🤖 New IDs to be minted " +uniqueIds + "...\n");
  console.log("\n\n 🧮 ID count " +uniqueIds.length + "...\n");
  console.log("\n\n 🎫 Minting to base new " + toAddress + "...\n");
  const mfw = await ethers.getContract("MFW", mfwAdmin);

  // ERC1155
  const mintBaseNewErc1155 = async (toArray, amountArray, uriArray) =>
    mfw.mintBaseNew(toArray, amountArray, uriArray);

  const idsMinted = [];
  for (i = 0; i < uniqueIds.length; i++) {
    const tx = await mintBaseNewErc1155(
      [toAddress], // To
      [BigNumber.from("5")], // supply
      [""], // uri
      {
        gasLimit: 400000,
      }
    );
  
    function sleep(ms) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    }

    const receipt = await tx.wait();
    // emit TransferSingle(operator, address(0), account, id, amount);

    const eventsMatching = receipt.events.filter(v => v.event === 'TransferSingle');
    // expect(eventsMatching.length).to.equal(1);
    const transferEvent = eventsMatching[0];
    const idMinted = transferEvent.args[3];

    await sleep(delayMS);
    idsMinted.push(idMinted);
    console.log(idMinted + ' ID just minted!')
  }

  // Store IDs minted
  // If custom IDs:
  // if (network.name !== 'hardhat') {
  //   fs.writeFileSync(
  //     `./mfw_minted_${chainId}.json`,
  //     JSON.stringify(uniqueIds, null, '  ')
  //   );
  // }

  // If start at ID == 1:
  if (network.name !== 'hardhat') {
    fs.writeFileSync(
      `./mfw_minted_${chainId}.json`,
      JSON.stringify(idsMinted, null, '  ')
    );
  }
};

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
