import {
    deployments,
    ethers,
    getNamedAccounts,
    getUnnamedAccounts,
  } from 'hardhat';
  import {BigNumber, constants} from 'ethers';
  import {expect} from '../../chai-setup';
  import MerkleTree from '../../lib/merkleTree';
  import {createClaimMerkleTree} from '../../data/getClaims';
  import helpers from '../../lib/merkleTreeHelper';
  import {default as testData0} from '../../data/mfw_giveaway_1/claims_0_hardhat.json';
  import {default as testData1} from '../../data/mfw_giveaway_1/claims_1_hardhat.json';
  import {expectReceiptEventWithArgs, waitFor, withSnapshot} from '../utils';
  
  const zeroAddress = constants.AddressZero;  
  const {createDataArrayMultiClaim} = helpers;
  
  const ipfsHashString =
    '0x78b9f42c22c3c8b260b781578da3151e8200c741c6b7437bafaff5a9df9b403e';
  
  type Options = {
    mint?: boolean; // supply assets and lands to MultiGiveaway
    multi?: boolean; // set up more than one giveaway (ie more than one claim hash)
    mintSingleAsset?: number; // mint a single asset and add to blank testData for mintSingleAsset number of users
    numberOfAssets?: number; // specify a given number of assets to mint and test
    badData?: boolean; // set the merkle tree up with bad contract addresses and input values for ERC1155, ERC721 and ERC20 assets
  };
  
  export const setupTestGiveaway = withSnapshot(
    ['MFWGiveaway', 'MFW'],
    async function (hre, options?: Options) {
      const {network, getChainId} = hre;
      const chainId = await getChainId();
      const {mint, multi, mintSingleAsset, numberOfAssets, badData} =
        options || {};
      const {
        deployer,
        mfwAdmin,
        mfwGiveawayAdmin
      } = await getNamedAccounts();
      const others = await getUnnamedAccounts();

      // Giveaway contract

      await deployments.deploy('TestMFWGiveaway', {
        from: deployer,
        contract: 'MFWGiveaway',
        args: [],
      });
  
      const giveawayContract = await ethers.getContract(
        'TestMFWGiveaway',
        deployer
      );

      await giveawayContract.approveAdmin(mfwGiveawayAdmin); // TODO: check if needed
  
      const giveawayContractAsAdmin = await ethers.getContract(
        'TestMFWGiveaway',
        mfwGiveawayAdmin
      );

      // Wearable contract
      const mfwContract = await ethers.getContract('MFW');

      const mfwContractAsAdmin = await mfwContract.connect(
        ethers.provider.getSigner(mfwAdmin)
      );

      // TODO: mintBaseExisting tests
      const mintBaseExistingErc1155 = async (toArray: string[], id: number, amountArray: BigNumber[], uriArray: string[]) =>
      mfwContractAsAdmin.mintBaseNew(toArray, id, amountArray, uriArray);

      const mintBaseNewErc1155 = async (toArray: string[], amountArray: BigNumber[], uriArray: string[]) =>
      mfwContractAsAdmin.mintBaseNew(toArray, amountArray, uriArray);
  
      // Supply MFW to contract for testing 
      async function mintTestWearables(startId: number, endId: number ) {
        
        const owner = giveawayContract.address;

        for (let i = startId; i < endId; i++) {
            await mintBaseNewErc1155(
              [owner], // To
              [BigNumber.from("5")], // Test supply will mint supply 5 for each id
              [""], // The "base"
            );
        }
      }

      // TODO: mintBaseExisting
      // TODO: update base
  
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      function assignReservedAddressToClaim(dataSet: any) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return dataSet.map(async (claim: any) => {
          claim.to = others[0];
          return claim;
        });
      }
  
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      function assignTestContractAddressesToClaim(dataSet: any) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return dataSet.map(async (claim: any) => {
          if (claim.erc1155) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            claim.erc1155.map(async (asset: any) => {
              asset.contractAddress = mfwContract.address;
              return asset;
            });
          }
          return claim;
        });
      }
  
      // // eslint-disable-next-line @typescript-eslint/no-explicit-any
      // function setAssets(dataSet: any, amount: number) {
      //   dataSet[0].erc1155[0].ids = [];
      //   dataSet[0].erc1155[0].values = [];
      //   for (let i = 0; i < amount; i++) {
      //     // a big id to avoid collision with other setups
      //     dataSet[0].erc1155[0].ids.push(i + 1000);
      //     dataSet[0].erc1155[0].values.push(5);
      //   }
      // }
  
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let dataSet_0: any = JSON.parse(JSON.stringify(testData0));
  
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let dataSet_1: any = JSON.parse(JSON.stringify(testData1));
  
      // To ensure the same address for others[0] for all tests
      assignReservedAddressToClaim(dataSet_0);
      assignReservedAddressToClaim(dataSet_1);
  
      // To ensure the claim data works for all developers
      assignTestContractAddressesToClaim(dataSet_0);
      assignTestContractAddressesToClaim(dataSet_1);
  
      // if (numberOfAssets) {
      //   setAssets(dataWithIds0, numberOfAssets);
      // }
  
      if (mint) {
        await mintTestWearables(1, 7); // ids 1 to 6
        if (multi) {
          await mintTestWearables(7, 21); // ids 7 to 20
        }
      }
  
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      // async function mintSingleAssetWithId(claim: any) {
      //   const newAsset = {
      //     ids: [],
      //     values: [],
      //     contractAddress: '',
      //   };
      //   return {
      //     ...claim,
      //     erc1155: await Promise.all(
      //       // eslint-disable-next-line @typescript-eslint/no-explicit-any
      //       claim.erc1155.map(async (asset: any, assetIndex: number) => {
      //         newAsset.ids = await Promise.all(
      //           asset.ids.map(
      //             async (assetPackId: number, index: number) =>
      //               await mintTestAssets(assetPackId, asset.values[index])
      //           )
      //         );
      //         (newAsset.values = claim.erc1155[assetIndex].values),
      //           (newAsset.contractAddress =
      //             claim.erc1155[assetIndex].contractAddress);
      //         return newAsset;
      //       })
      //     ),
      //   };
      // }
  
      if (mintSingleAsset) {
        // Create data for a single wearable
        // mint option must be false
        // multi option must be false
        // Set up blank testData for thousands of users and add to data
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const emptyData: any = [];
        for (let i = 0; i < 1; i++) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const claim: any = {
            to: others[0],
            erc1155: [
              {
                ids: ["1"], // id 1
                values: [1],
                contractAddress: mfwContract.address,
              },
            ],
            erc721: [
              
            ],
            erc20: {
              amounts: [],
              contractAddresses: [],
            },
          };
          emptyData.push(claim);
        }
        for (let i = 1; i < mintSingleAsset; i++) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const claim: any = {
            to: others[0],
            erc1155: [
              {
                ids: [i],
                values: [1],
                contractAddress: mfwContract.address,
              },
            ],
            erc721: [
              ,
            ],
            erc20: {
              amounts: [],
              contractAddresses: [],
            },
          };
          emptyData.push(claim);
        }
        dataSet_0 = emptyData;
        // mint the single wearable and set the owner as the giveaway contract
        await mintTestWearables(1, 2)
      }
  
      // Set up tree with test assets for each applicable giveaway
      const {
        claims: claims0,
        merkleRootHash: merkleRootHash0,
      } = createClaimMerkleTree(
        network.live,
        chainId,
        dataSet_0,
        'TestMFWGiveaway'
      );
  
      const allMerkleRoots = [];
      const allClaims = [claims0];
      const allTrees = [];
  
      // Single giveaway
      const hashArray = createDataArrayMultiClaim(claims0);
      await giveawayContractAsAdmin.addNewGiveaway(
        merkleRootHash0,
        '0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF'
      ); // no expiry
      allMerkleRoots.push(merkleRootHash0);
      allTrees.push(new MerkleTree(hashArray));
  
      // Multi giveaway
      if (multi) {
        const {
          claims: claims1,
          merkleRootHash: merkleRootHash1,
        } = createClaimMerkleTree(
          network.live,
          chainId,
          dataSet_1,
          'TestMFWGiveaway'
        );
        allClaims.push(claims1);
        allMerkleRoots.push(merkleRootHash1);
        const hashArray2 = createDataArrayMultiClaim(claims1);
        allTrees.push(new MerkleTree(hashArray2));
        await giveawayContractAsAdmin.addNewGiveaway(
          merkleRootHash1,
          '0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF'
        ); // no expiry
      }
  
      // Set up bad contract addresses and input amounts in merkle tree data and claim
      if (badData) {
        // dataWithIds0[0].erc1155[0].values = [5, 5, 5, 5, 5, 5, 5, 5];
        // dataWithIds0[1].erc20.amounts = [200, 300, 200];
        // dataWithIds0[3].erc1155[0].contractAddress = zeroAddress;
        // dataWithIds0[2].erc721[0].contractAddress = zeroAddress;
        // dataWithIds0[4].erc20.contractAddresses[0] = zeroAddress;
  
        // const {
        //   claims: badClaims0,
        //   merkleRootHash: badMerkleRootHash0,
        // } = createClaimMerkleTree(
        //   network.live,
        //   chainId,
        //   dataWithIds0,
        //   'Multi_Giveaway_1'
        // );
        // allClaims.push(badClaims0);
        // allMerkleRoots.push(badMerkleRootHash0);
        // const hashArray2 = createDataArrayMultiClaim(badClaims0);
        // allTrees.push(new MerkleTree(hashArray2));
        // await giveawayContractAsAdmin.addNewGiveaway(
        //   badMerkleRootHash0,
        //   '0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF'
        // ); // no expiry
      }
  
      return {
        giveawayContract,
        giveawayContractAsAdmin,
        mfwContract,
        others,
        allTrees,
        allClaims,
        allMerkleRoots,
        mfwGiveawayAdmin,
      };
    }
  );
  