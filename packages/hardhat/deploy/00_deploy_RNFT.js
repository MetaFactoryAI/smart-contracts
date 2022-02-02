// const ipfsAPI = require('ipfs-http-client');
// const { globSource } = require('ipfs-http-client')
// const ipfs = ipfsAPI({host: 'ipfs.infura.io', port: '5001', protocol: 'https' })

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  // TODO: metadata URI
  // First, we upload the metadata to IPFS and get the CID
  // const file = await ipfs.add(globSource("./erc1155metadata", { recursive: true }))
  // console.log(file.cid.toString());
  // const tokenUri = "https://ipfs.io/ipfs/"+file.cid.toString()+"/{id}.json"

  await deploy("RNFT", {
    // Learn more about args here: https://www.npmjs.com/package/hardhat-deploy#deploymentsdeploy
    from: deployer,
    args: [],
    log: true,
  });

  /*
    // Getting a previously deployed contract
    const YourContract = await ethers.getContract("YourContract", deployer);
    await YourContract.setPurpose("Hello");
    
    //const yourContract = await ethers.getContractAt('YourContract', "0xaAC799eC2d00C013f1F11c37E654e59B0429DF6A") //<-- if you want to instantiate a version of a contract at a specific address!

    // TODO: any admin functions for NFT contract, eg set URI, add collection admins
  */
};
module.exports.tags = ["RNFT"];

/*
Tenderly verification
let verification = await tenderly.verify({
  name: contractName,
  address: contractAddress,
  network: targetNetwork,
});
*/
