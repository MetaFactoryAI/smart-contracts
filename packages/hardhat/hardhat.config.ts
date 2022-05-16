import { utils } from "ethers";
import {accounts, node_url} from './network';

import "@nomiclabs/hardhat-waffle";
import "@tenderly/hardhat-tenderly";
import "hardhat-deploy";
import "@eth-optimism/hardhat-ovm";
import "@nomiclabs/hardhat-ethers";

// const defaultNetwork = "rinkeby"; // TODO: fix deploy

export default {
  // defaultNetwork,

  networks: {
    localhost: {
      url: "http://localhost:8545",
    },
    rinkeby: {
      url: node_url('rinkeby'),
      accounts: accounts('rinkeby'),
      tags: ['testnet'],
    },
    mainnet: {
      url: node_url('mainnet'),
      accounts: accounts('mainnet'),
      tags: ['mainnet'],
    },
    goerli: {
      url: node_url('goerli'),
      accounts: accounts('goerli'),
      tags: ['testnet'],
    },
  },
  solidity: {
    compilers: [
      {
        version: "0.8.4",
        settings: {
          optimizer: {
            enabled: true,
            runs: 100,
          },
        },
      },
      {
        version: "0.6.7",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    ],
  },
  ovm: {
    solcVersion: "0.7.6",
  },
  namedAccounts: {
    deployer: {
      default: 0, // here this will by default take the first account as deployer
      rinkeby: 0
    },
    mfwAdmin: {
      default: 1, // here this will by default take the second account as mfwAdmin
      rinkeby: 1
    },
    mfwGiveawayAdmin: {
      default: 2, // here this will by default take the second account as mfwGiveawayAdmin
      rinkeby: 2
    },
  },
};
