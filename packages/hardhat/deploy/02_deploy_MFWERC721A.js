const {HARDHAT_NETWORK_NAME} = require('hardhat/plugins');

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, read, execute } = deployments;
  const { deployer, mfwAdmin } = await getNamedAccounts();

  await deploy("MFWERC721A", {
    from: deployer,
    args: ["MetaFactory Wearables - ERC721A", "MFW"], // TODO: confirm args
    log: true,
    skipIfAlreadyDeployed: true
  });
};
module.exports.tags = ["MFWERC721A", "MFWERC721A_deploy"];
module.exports.skip = (hre) => {
  return hre.network.name !== HARDHAT_NETWORK_NAME
};