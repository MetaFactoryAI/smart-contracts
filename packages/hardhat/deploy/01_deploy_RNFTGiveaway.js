module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

await deploy("RNFTGiveaway", {
    // Learn more about args here: https://www.npmjs.com/package/hardhat-deploy#deploymentsdeploy
    from: deployer,
    args: [], // TODO:
    log: true,
  });
};
module.exports.tags = ["RNFTGiveaway"];