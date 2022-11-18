import {accounts, node_url} from './network';

import "@nomiclabs/hardhat-waffle";
import "@tenderly/hardhat-tenderly";
import "hardhat-deploy";
import "@eth-optimism/hardhat-ovm";
import "@nomiclabs/hardhat-ethers";
import '@nomiclabs/hardhat-etherscan';
import "hardhat-gas-reporter";

export default {

  networks: {
    localhost: {
      url: "http://localhost:8545",
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
      goerli: 0,
      mainnet: "0x7019523F9f04C4F4e084c39be1049718d48Ee833"
    },
    mfwAdmin: {
      default: 1, // here this will by default take the second account as mfwAdmin
      goerli: 1,
      mainnet: "0x7019523F9f04C4F4e084c39be1049718d48Ee833"
    },
    mfwGiveawayAdmin: {
      default: 2, // here this will by default take the second account as mfwGiveawayAdmin
      goerli: 2,
      mainnet: "0x7019523F9f04C4F4e084c39be1049718d48Ee833"
    },
  },
  etherscan: {
    apiKey: {
      mainnet: process.env.ETHERSCAN_API_KEY_MAINNET || '',
      goerli: process.env.ETHERSCAN_API_KEY_GOERLI || ''
    },
  },
  gasReporter: {
    currency: 'USD',
    enabled: true,
    coinmarketcap: (process.env.COINMARKETCAP_API_KEY) ? process.env.COINMARKETCAP_API_KEY : false,
  }
};
