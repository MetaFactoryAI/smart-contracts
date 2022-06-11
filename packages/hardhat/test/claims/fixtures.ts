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
  import {default as testData0} from '../../data/MFWGiveaway/claims_0_hardhat.json';
  import {default as testData1} from '../../data/MFWGiveaway/claims_1_hardhat.json';
  import {default as testData2} from '../../data/MFWGiveaway/claims_2_hardhat.json';

  import {expectReceiptEventWithArgs, waitFor, withSnapshot} from '../utils';
import { SocketAddress } from 'net';
  
  const zeroAddress = constants.AddressZero;  
  const {createDataArrayMultiClaim} = helpers;
  
  type Options = {
    mint?: boolean; // supply assets and lands to MultiGiveaway
    multi?: boolean; // set up more than one giveaway (ie more than one claim hash)

    // Options below to stress test
    mintSingleAsset?: number; // mint a single asset and add to blank testData for mintSingleAsset number of users
    numberOfWearables?: number; // set up a single claim containing a large number of items (ie many IDs)
    stress?: number; // stress test number of claims in a dataset, similar to mintSingleAsset but mints everything
    badData?: boolean; // set the merkle tree up with bad contract addresses and input values for ERC1155, ERC721 and ERC20 assets
  };
  
  export const setupTestGiveaway = withSnapshot(
    ['MFWGiveaway', 'MFW'],
    async function (hre, options?: Options) {
      const {network, getChainId} = hre;
      const chainId = await getChainId();
      const {mint, multi, mintSingleAsset, numberOfWearables, stress, badData} =
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
        args: [mfwGiveawayAdmin],
      });
      const giveawayContract = await ethers.getContract(
        'TestMFWGiveaway',
        deployer
      );
     
      const giveawayContractAsAdmin = await ethers.getContract(
        'TestMFWGiveaway',
        mfwGiveawayAdmin
      );

      // Wearable contract
      const mfwContract = await ethers.getContract('MFW', deployer);
      await mfwContract.approveAdmin(mfwAdmin);
      const mfwContractAsAdmin = await mfwContract.connect(
        ethers.provider.getSigner(mfwAdmin)
      );

      await mfwContractAsAdmin.setBaseTokenURI("testWearableBaseTokenUri") 
      // TODO: uri tests

      // TODO: mintBaseExisting tests
      const mintBaseExistingErc1155 = async (toArray: string[], id: number, amountArray: BigNumber[], uriArray: string[]) =>
      mfwContractAsAdmin.mintBaseNew(toArray, id, amountArray, uriArray);

      const mintBaseNewErc1155 = async (toArray: string[], amountArray: BigNumber[], uriArray: string[]) =>
      mfwContractAsAdmin.mintBaseNew(toArray, amountArray, uriArray);
  
      // Supply MFW to contract for testing 
      let counter = 0;
      async function mintTestWearables(startId: number, endId: number, amount: number ) {
        const owner = giveawayContract.address;

        for (let i = startId; i <= endId; i++) {
            await mintBaseNewErc1155(
              [owner], // To
              [BigNumber.from(amount)], 
              [""], // The "base"
            );
            counter +=1;
        }
      }
  
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
            claim.erc1155.map(async (item: any) => {
              item.contractAddress = mfwContract.address;
              return item;
            });
          }
          return claim;
        });
      }
  
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let dataSet_0: any = JSON.parse(JSON.stringify(testData0));
  
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let dataSet_1: any = JSON.parse(JSON.stringify(testData1));

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let dataSet_2: any = JSON.parse(JSON.stringify(testData2));
  
      // To ensure the same address for others[0] for all tests
      assignReservedAddressToClaim(dataSet_0);
      assignReservedAddressToClaim(dataSet_1);
      assignReservedAddressToClaim(dataSet_2);
  
      // To ensure the claim data works for all developers
      assignTestContractAddressesToClaim(dataSet_0);
      assignTestContractAddressesToClaim(dataSet_1);
      assignTestContractAddressesToClaim(dataSet_2);

      // Extend the number of claims in the dataSet
      if (numberOfWearables) {
        if (stress) {
          const claimToReplicate = dataSet_2[0];
          // stress is the total number of claims in the file hence we subtract 1
          for (let i=0; i<stress -1; i++){
            dataSet_2.push(claimToReplicate);
          }
        }
      }
  
      if (mint) {
        await mintTestWearables(1, 6, 5); // ids 1 to 6 dataSet_0
        if (multi) {
          await mintTestWearables(7, 20, 5); // ids 7 to 20 dataSet_1
        }
        if (numberOfWearables) {
          await mintTestWearables(21, 21 + numberOfWearables - 1, stress ? 5*stress : 5); // ids 21 to [x] dataSet_2
        }
      }
  
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
        await mintTestWearables(1, 2, 5)
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

      // For large number of wearables per claim
      if (numberOfWearables) {
        const {
          claims: claims2,
          merkleRootHash: merkleRootHash2,
        } = createClaimMerkleTree(
          network.live,
          chainId,
          dataSet_2,
          'TestMFWGiveaway'
        );
        allClaims.push(claims2);
        allMerkleRoots.push(merkleRootHash2);
        const hashArray2 = createDataArrayMultiClaim(claims2);
        allTrees.push(new MerkleTree(hashArray2));
        await giveawayContractAsAdmin.addNewGiveaway(
          merkleRootHash2,
          '0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF'
        ); // no expiry
      }
  
      // Set up bad contract addresses and input amounts in merkle tree data and claim
      if (badData) {
        dataSet_0[0].erc1155[0].values = [5, 5, 5, 5, 5, 5, 5, 5];
        dataSet_0[3].erc1155[0].contractAddress = zeroAddress;
       
        const {
          claims: badClaims0,
          merkleRootHash: badMerkleRootHash0,
        } = createClaimMerkleTree(
          network.live,
          chainId,
          dataSet_0,
          'Multi_Giveaway_1'
        );
        allClaims.push(badClaims0);
        allMerkleRoots.push(badMerkleRootHash0);
        const hashArray2 = createDataArrayMultiClaim(badClaims0);
        allTrees.push(new MerkleTree(hashArray2));
        await giveawayContractAsAdmin.addNewGiveaway(
          badMerkleRootHash0,
          '0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF'
        ); // no expiry
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
        hre
      };
    }
  );
  