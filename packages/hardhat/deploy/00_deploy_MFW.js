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

  // Configure prefix
  await execute(
    'MFW',
    {from: mfwAdmin, log: true},
    'setTokenURIPrefix',
    "https://mf-services.vercel.app/api/",
  );

  // Configure tokenURI for first wearable drop
  await execute(
    'MFW',
    {from: mfwAdmin, log: true},
    'setTokenURI',
    "nftMetadata/",
  );
};
module.exports.tags = ["MFW", "MWF_deploy"];
