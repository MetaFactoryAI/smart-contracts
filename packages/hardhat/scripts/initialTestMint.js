const { ethers, getNamedAccounts } = require("hardhat");
const fs = require("fs");
const { BigNumber } = ethers;

const delayMS = 1000;

// ***FOR NEW IDS ONLY THAT HAVE NEVER BEEN MINTED BEFORE***
// ***FOR MINTED IDS SEE .json FILES***
// Note: if script isn't working on testnet it could be that the IDs have already been minted
const main = async () => {
  const { deployer, mfwAdmin } = await getNamedAccounts();
  const chainId = await getChainId();

  // TODO: confirm destination for minting
  const toAddress = "0xd8401646686430711D5d48407D8C0bb79616baef"; // Goerli giveaway contract

  // Gather IDs to mint from input file -----------------------------------------------------------

  const mint = {}

  for (let i=1; i=100; i++){
    const id = i
    const supply = 100
    if (mint[id]) {
      mint[id] += parseInt(supply);
    } else {
      mint[id] = parseInt(supply);
    }
  }

  const idsToMint = Object.keys(mint);
  const amountsToMint = []
  for (let k=0; k<idsToMint.length; k++) {
    amountsToMint.push(mint[idsToMint[k]])
  }

  // Mint NFTs ------------------------------------------------------------------------------------
  
  const mfw = await ethers.getContract("MFW", mfwAdmin);

  // ERC1155 mintBaseNew will start at whatever ID the contract counter is on!
  const mintBaseNewErc1155 = async (toArray, amountArray, uriArray) =>
    mfw.mintBaseNew(toArray, amountArray, uriArray);

  const idsMinted = [];
  for (i = 0; i < idsToMint.length ; i++) {
    const tx = await mintBaseNewErc1155(
      [toAddress], // To
      [BigNumber.from(amountsToMint[i])], // supply
      [""], // uri
      {
        gasLimit: 400000,
      }
    );
  
    function sleep(ms) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    }

    const receipt = await tx.wait();
    // Event is: TransferSingle(operator, address(0), account, id, amount);
    const eventsMatching = receipt.events.filter(v => v.event === 'TransferSingle');
    const transferEvent = eventsMatching[0];
    const idMinted = transferEvent.args[3];

    await sleep(delayMS);
    idsMinted.push(idMinted.toNumber());
    console.log(idMinted.toNumber() + ' ID just minted!')
  }

  if (network.name !== 'hardhat') {
    fs.writeFileSync(
      `./mfw_minted_${chainId}.json`,
      JSON.stringify(idsMinted, null, '  ') + JSON.stringify(amountsToMint, null, '  ')
    );
  }
};

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
