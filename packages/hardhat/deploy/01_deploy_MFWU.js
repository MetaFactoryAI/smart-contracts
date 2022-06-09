module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, execute } = deployments;
  const { deployer, mfwAdmin } = await getNamedAccounts();

  await deploy("MFWUniques", {
    from: deployer,
    args: ["MetaFactory Wearables - Unique", "MFWU"], // TODO: confirm args
    log: true,
  });

  await execute(
    'MFWUniques',
    {from: deployer, log: true},
    'approveAdmin',
    mfwAdmin,
  );

  // Configure tokenURI for first wearable drop
  await execute(
    'MFWUniques',
    {from: mfwAdmin, log: true},
    'setBaseTokenURI',
    "https://mf-services.vercel.app/api/nftMetadata/", // TODO: update baseURI for ERC721s
  );
};
module.exports.tags = ["MFW", "MWF_deploy"];