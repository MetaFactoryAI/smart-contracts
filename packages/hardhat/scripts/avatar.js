const fs = require("fs");
const ipfsAPI = require("ipfs-http-client");
const { globSource } = require("ipfs-http-client");
const ipfs = ipfsAPI({
  host: "ipfs.infura.io",
  port: "5001",
  protocol: "https",
});

const main = async () => {
  // Script to upload avatar files to IPFS for dummy metadata
  const avatarFile = await ipfs.add(
    globSource("./avatar", { recursive: true })
  );

  console.log(avatarFile.cid.toString());
  // Will upload avatar files in the format "https://ipfs.io/ipfs/" + avatarFile.cid.toString() + avatarName + fileName
  // eg https://ipfs.io/ipfs/QmU8LwAwk9K71qZnS9Z4rs1YYbwRndehRxckgewLZCo14F/yfi_hoodie/yfi_hoodie.png
  // You will need to manually grab CID from console and update metadata json files until this process has been automated
};

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
