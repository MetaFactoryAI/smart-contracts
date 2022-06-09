module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy } = deployments;
  const { deployer, mfwGiveawayAdmin } = await getNamedAccounts();

  await deploy('MFWGiveaway', {
    from: deployer,
    args: [mfwGiveawayAdmin], 
    log: true,
  });
};
module.exports.tags = ["MFWGiveaway"];
module.exports.dependencies = ["MFW_deploy"];
