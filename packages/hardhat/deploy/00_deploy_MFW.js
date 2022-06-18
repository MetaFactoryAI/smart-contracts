module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, read, execute } = deployments;
  const { deployer, mfwAdmin } = await getNamedAccounts();

  await deploy("MFW", {
    from: deployer,
    args: [],
    log: true,
    skipIfAlreadyDeployed: true
  });

  let isAdmin = false;
  try {
    isAdmin = await read('MFW', 'isAdmin', mfwAdmin);
  } catch (e) {
    // no admin
  }

  if (!isAdmin) {
    await execute(
      'MFW',
      {from: deployer, log: true},
      'approveAdmin',
      mfwAdmin,
    );
  }
  
  // Configure tokenURI for first wearable drop
  const baseURI = "https://mf-services.vercel.app/api/nftMetadata/";
    await execute(
      'MFW',
      {from: mfwAdmin, log: true},
      'setBaseTokenURI',
      baseURI,
    );
};
module.exports.tags = ["MFW", "MWF_deploy"];
