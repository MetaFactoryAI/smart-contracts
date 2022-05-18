module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, execute } = deployments;
  const { deployer, mfwAdmin } = await getNamedAccounts();

  await deploy("MFW", {
    from: deployer,
    args: [],
    log: true,
  });

  await execute(
    'MFW',
    {from: deployer, log: true},
    'approveAdmin',
    mfwAdmin,
  );

  // Configure tokenURI for first wearable drop
  await execute(
    'MFW',
    {from: mfwAdmin, log: true},
    'setBaseTokenURI',
    "https://mf-services.vercel.app/api/nftMetadata/",
  );
};
module.exports.tags = ["MFW", "MWF_deploy"];
