import {
    ethers,
    getNamedAccounts,
    getUnnamedAccounts,
  } from 'hardhat';
  import {BigNumber, constants} from 'ethers';

  import {withSnapshot} from '../utils';
  
  export const setupNFTs = withSnapshot(
    ['MFW', 'MFWUniques'],
    async function (hre) {
      const {
        deployer,
        mfwAdmin
      } = await getNamedAccounts();
      const others = await getUnnamedAccounts();

      // Wearable contract ERC1155
      const mfwContract = await ethers.getContract('MFW', deployer);
      await mfwContract.approveAdmin(mfwAdmin);
      const mfwContractAsAdmin = await mfwContract.connect(
        ethers.provider.getSigner(mfwAdmin)
      );
      const mfwContractAsUser = await mfwContract.connect(
        ethers.provider.getSigner(others[0])
      );

      await mfwContractAsAdmin.setBaseTokenURI("testWearableBaseTokenUriERC1155/")

      // Wearable contract ERC721
      const mfwuContract = await ethers.getContract('MFWUniques', deployer);
      await mfwuContract.approveAdmin(mfwAdmin);
      const mfwuContractAsAdmin = await mfwuContract.connect(
        ethers.provider.getSigner(mfwAdmin)
      );
      const mfwuContractAsUser = await mfwContract.connect(
        ethers.provider.getSigner(others[0])
      );

      await mfwuContractAsAdmin.setBaseTokenURI("testWearableBaseTokenUriERC721/")

      // ** Special Mint functions from Manifold contracts ** ----------------------------------

      const mintBaseExistingErc1155 = async (toArray: string[], ids: number[], amountArray: BigNumber[]) =>
      mfwContractAsAdmin.mintBaseExisting(toArray, ids, amountArray);

      const mintBaseNewErc1155 = async (toArray: string[], amountArray: BigNumber[], uriArray: string[]) =>
      mfwContractAsAdmin.mintBaseNew(toArray, amountArray, uriArray);

      // ---------------------------------------------------------------------------------------
  
      // Mint MFW - Base New
      let counter = 0;
      async function mintNewTestMFW(startId: number, endId: number, amount: number, to: string, uris: string[] ) {
        for (let i = startId; i <= endId; i++) {
            await mintBaseNewErc1155(
              [to], 
              [BigNumber.from(amount)], 
              uris
            );
            counter +=1;
        }
      }

      // Mint MFW - Base Existing
      async function mintExistingTestMFW(to: string, id: number, amount: number) {
        await mintBaseExistingErc1155(
            [to], 
            [id],
            [BigNumber.from(amount)]
        );
      }
  
      return {
        mfwContract,
        mfwContractAsAdmin,
        mfwContractAsUser,
        mfwuContract,
        mfwuContractAsAdmin,
        mfwuContractAsUser,
        others,
        hre,
        mintNewTestMFW,
        mintExistingTestMFW,
        mfwAdmin,
        deployer
      };
    }
  );
  