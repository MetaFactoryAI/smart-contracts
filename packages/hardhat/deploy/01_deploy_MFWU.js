module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, read, execute } = deployments;
  const { deployer, mfwAdmin } = await getNamedAccounts();

  await deploy("MFWUniques", {
    from: deployer,
    args: ["MetaFactory Wearables - Unique", "MFWU"], // TODO: confirm args
    log: true,
    skipIfAlreadyDeployed: true
  });

  let isAdmin = false;
  try {
    isAdmin = await read('MFWUniques', 'isAdmin', mfwAdmin);
  } catch (e) {
    // no admin
  }

  if (!isAdmin) {
    await execute(
      'MFWUniques',
      {from: deployer, log: true},
      'approveAdmin',
      mfwAdmin,
    );
  }

  // Configure tokenURI for first wearable drop
  await execute(
    'MFWUniques',
    {from: mfwAdmin, log: true},
    'setBaseTokenURI',
    "https://mf-services.vercel.app/api/nftMetadata/", // TODO: update baseURI for ERC721s
  );
};
module.exports.tags = ["MFWUniques", "MWFUniques_deploy"];