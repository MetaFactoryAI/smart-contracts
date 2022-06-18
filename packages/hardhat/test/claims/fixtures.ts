import {
    deployments,
    ethers,
    getNamedAccounts,
    getUnnamedAccounts,
  } from 'hardhat';
  import {BigNumber, constants} from 'ethers';
  import MerkleTree from '../../lib/merkleTree';
  import {createClaimMerkleTree} from '../../data/getClaims';
  import helpers from '../../lib/merkleTreeHelper';
  import {default as testData0} from '../../data/MFWGiveaway/claims_0_hardhat.json';
  import {default as testData1} from '../../data/MFWGiveaway/claims_1_hardhat.json';
  import {default as testData2} from '../../data/MFWGiveaway/claims_2_hardhat.json';
  import {default as testData3} from '../../data/MFWGiveaway/claims_3_hardhat.json';
  import {default as testData4} from '../../data/MFWGiveaway/claims_4_hardhat.json';
  import {default as testData5} from '../../data/MFWGiveaway/claims_5_hardhat.json';

  import {withSnapshot} from '../utils';
  
  const zeroAddress = constants.AddressZero;  
  const {createDataArrayMultiClaim} = helpers;
  
  type Options = {
    mint?: boolean; // supply tokens to claims contract
    multi?: boolean; // set up more than one giveaway (ie more than one claim hash)

    // Options below to stress test
    numberOfWearables?: number; // set up a single claim containing a large number of items (ie many IDs)
    stress?: number; // stress test number of claims in a dataset and mint everything
    badData?: boolean; // set the merkle tree up with bad contract addresses and input values for ERC1155, ERC721 and ERC20 assets
  };
  
  export const setupTestGiveaway = withSnapshot(
    ['MFWGiveaway', 'MFW', 'MFWUniques'],
    async function (hre, options?: Options) {
      const {network, getChainId} = hre;
      const chainId = await getChainId();
      const {mint, multi, numberOfWearables, stress, badData} =
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

      // Wearable contract ERC1155
      const mfwContract = await ethers.getContract('MFW', deployer);
      await mfwContract.approveAdmin(mfwAdmin);
      const mfwContractAsAdmin = await mfwContract.connect(
        ethers.provider.getSigner(mfwAdmin)
      );

      // Wearable contract ERC721
      const mfwuContract = await ethers.getContract('MFWUniques', deployer);
      await mfwuContract.approveAdmin(mfwAdmin);
      const mfwuContractAsAdmin = await mfwContract.connect(
        ethers.provider.getSigner(mfwAdmin)
      );

      await mfwContractAsAdmin.setBaseTokenURI("testWearableBaseTokenUriERC721")

      // ** Special Mint functions from Manifold contracts ** ----------------------------------

      const mintBaseNewErc1155 = async (toArray: string[], amountArray: BigNumber[], uriArray: string[]) =>
      mfwContractAsAdmin.mintBaseNew(toArray, amountArray, uriArray);

      // ---------------------------------------------------------------------------------------
  
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

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let dataSet_3: any = JSON.parse(JSON.stringify(testData3));

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let dataSet_4: any = JSON.parse(JSON.stringify(testData4));

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let dataSet_5: any = JSON.parse(JSON.stringify(testData5));
  
      // To ensure the same address for others[0] for all tests
      assignReservedAddressToClaim(dataSet_0);
      assignReservedAddressToClaim(dataSet_1);
      assignReservedAddressToClaim(dataSet_2);
      assignReservedAddressToClaim(dataSet_3);
      assignReservedAddressToClaim(dataSet_4);
      assignReservedAddressToClaim(dataSet_5);
  
      // To ensure the claim data works for all developers
      assignTestContractAddressesToClaim(dataSet_0);
      assignTestContractAddressesToClaim(dataSet_1);
      assignTestContractAddressesToClaim(dataSet_2);
      assignTestContractAddressesToClaim(dataSet_3);
      assignTestContractAddressesToClaim(dataSet_4);
      assignTestContractAddressesToClaim(dataSet_5);

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
          await mintTestWearables(7, 84, 40); // ids 7 to 20 dataSet_1
        }
        if (numberOfWearables) {
          await mintTestWearables(21, 21 + numberOfWearables - 1, stress ? 5*stress : 5); // ids 21 to [x] dataSet_2
        }
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
      const hashArray0 = createDataArrayMultiClaim(claims0);
      await giveawayContractAsAdmin.addNewGiveaway(
        merkleRootHash0,
        '0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF'
      ); // no expiry
      allMerkleRoots.push(merkleRootHash0);
      allTrees.push(new MerkleTree(hashArray0));
      
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
        const hashArray1 = createDataArrayMultiClaim(claims1);
        allTrees.push(new MerkleTree(hashArray1));
        await giveawayContractAsAdmin.addNewGiveaway(
          merkleRootHash1,
          '0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF'
        ); // no expiry

        // Add datasets to create more merkleroots below --------------------------
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

        const {
          claims: claims3,
          merkleRootHash: merkleRootHash3,
        } = createClaimMerkleTree(
          network.live,
          chainId,
          dataSet_3,
          'TestMFWGiveaway'
        );
        allClaims.push(claims3);
        allMerkleRoots.push(merkleRootHash3);
        const hashArray3 = createDataArrayMultiClaim(claims3);
        allTrees.push(new MerkleTree(hashArray3));
        await giveawayContractAsAdmin.addNewGiveaway(
          merkleRootHash3,
          '0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF'
        ); // no expiry

        const {
          claims: claims4,
          merkleRootHash: merkleRootHash4,
        } = createClaimMerkleTree(
          network.live,
          chainId,
          dataSet_4,
          'TestMFWGiveaway'
        );
        allClaims.push(claims4);
        allMerkleRoots.push(merkleRootHash4);
        const hashArray4 = createDataArrayMultiClaim(claims4);
        allTrees.push(new MerkleTree(hashArray4));
        await giveawayContractAsAdmin.addNewGiveaway(
          merkleRootHash4,
          '0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF'
        ); // no expiry

        const {
          claims: claims5,
          merkleRootHash: merkleRootHash5,
        } = createClaimMerkleTree(
          network.live,
          chainId,
          dataSet_5,
          'TestMFWGiveaway'
        );
        allClaims.push(claims5);
        allMerkleRoots.push(merkleRootHash5);
        const hashArray5 = createDataArrayMultiClaim(claims5);
        allTrees.push(new MerkleTree(hashArray5));
        await giveawayContractAsAdmin.addNewGiveaway(
          merkleRootHash5,
          '0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF'
        ); // no expiry
        // ---------------------------------------------------------------------------
      }

      // For large number of wearables per claim
      if (numberOfWearables) {
        const {
          claims: claims6,
          merkleRootHash: merkleRootHash6,
        } = createClaimMerkleTree(
          network.live,
          chainId,
          dataSet_2,
          'TestMFWGiveaway'
        );
        allClaims.push(claims6);
        allMerkleRoots.push(merkleRootHash6);
        const hashArray2 = createDataArrayMultiClaim(claims6);
        allTrees.push(new MerkleTree(hashArray2));
        await giveawayContractAsAdmin.addNewGiveaway(
          merkleRootHash6,
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
        mfwuContract,
        others,
        allTrees,
        allClaims,
        allMerkleRoots,
        mfwGiveawayAdmin,
        hre
      };
    }
  );
  