module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, execute } = deployments;
  const { deployer, mfwGiveawayAdmin } = await getNamedAccounts();

  await deploy('MFWGiveaway', {
    // Learn more about args here: https://www.npmjs.com/package/hardhat-deploy#deploymentsdeploy
    from: deployer,
    args: [], 
    log: true,
  });

  await execute(
    'MFWGiveaway',
    {from: deployer, log: true},
    'approveAdmin',
    mfwGiveawayAdmin,
  );
};
module.exports.tags = ["MFWGiveaway"];
