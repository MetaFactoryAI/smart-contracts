const fs = require("fs");
const rawDataFile = JSON.parse(fs.readFileSync('./data/MFWGiveaway/MFWGiveaway1_mainnet.json')); // TODO: update input file

const main = async () => {

  // Count IDs and amounts from input file -----------------------------------------------------------

  const mint = {}

  for (let i=0; i<rawDataFile.length; i++){
    const erc1155 = rawDataFile[i].erc1155[0]
    for (let j=0; j<erc1155.ids.length; j++){
      const id = erc1155.ids[j]
      const supply = erc1155.values[j]
      if (mint[id]) {
        mint[id] += parseInt(supply);
      } else {
        mint[id] = parseInt(supply);
      }
    }
  }

  const idsToMint = Object.keys(mint);
  const amountsToMint = []
  for (let k=0; k<idsToMint.length; k++) {
    amountsToMint.push(mint[idsToMint[k]])
  }

  fs.writeFileSync(
    `./mfw_counted.json`,
    JSON.stringify(idsToMint, null, '  ') + JSON.stringify(amountsToMint, null, '  ')
  );

};

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
