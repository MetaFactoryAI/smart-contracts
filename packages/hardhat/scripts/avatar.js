const fs = require("fs");
const ipfsAPI = require("ipfs-http-client");
const { globSource } = require("ipfs-http-client");
const ipfs = ipfsAPI({
  host: "ipfs.infura.io",
  port: "5001",
  protocol: "https",
});

const main = async () => {
  // Upload avatar files to IPFS for dummy metadata
  const avatarFile = await ipfs.add(
    globSource("./avatar", { recursive: true })
  );

  console.log(avatarFile.cid.toString());
  // Script to upload avatar information in the format "https://ipfs.io/ipfs/" + avatarFile.cid.toString() + avatarName + fileName
  // eg https://ipfs.io/ipfs/QmU8LwAwk9K71qZnS9Z4rs1YYbwRndehRxckgewLZCo14F/yfi_hoodie/yfi_hoodie.png
};

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
