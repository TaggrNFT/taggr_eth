require("dotenv").config();

require("@nomiclabs/hardhat-etherscan");
require("@nomiclabs/hardhat-ethers");
require("@nomicfoundation/hardhat-chai-matchers");
require("@nomicfoundation/hardhat-network-helpers");
require("@openzeppelin/hardhat-upgrades");
require('hardhat-deploy');
require("hardhat-gas-reporter");
require("hardhat-abi-exporter");
require("solidity-coverage");

// Test Token Faucets:
// https://ropsten.oregonctf.org/eth
// https://faucet.polygon.technology/
// https://usdcfaucet.com/
// https://faucet.paradigm.xyz/
//

const mnemonic = {
  testnet: `${process.env.TESTNET_MNEMONIC}`.replace(/_/g, " "),
  mainnet: `${process.env.MAINNET_MNEMONIC}`.replace(/_/g, " "),
};

const optimizerDisabled = process.env.OPTIMIZER_DISABLED;

module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.8.4",
        settings: {
          optimizer: {
            enabled: !optimizerDisabled,
            runs: 200,
          },
          outputSelection: {
            "*": {
              "*": ["storageLayout"],
            },
          },
        },
        evmVersion: "istanbul",
      },
    ],
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./build/contracts",
    deploy: "./deploy",
    deployments: "./deployments",
  },
  networks: {
    hardhat: {
      blockGasLimit: 200000000,
      allowUnlimitedContractSize: true,
      gasPrice: 1e9,
      accounts: {
        mnemonic: mnemonic.testnet,
        initialIndex: 0,
        count: 10,
      },
    },
    goerli: {
      url: `https://goerli.infura.io/v3/${process.env.INFURA_APIKEY}`,
      // url: `https://eth-goerli.alchemyapi.io/v2/${process.env.ALCHEMY_APIKEY_GOERLI}`,
      gasPrice: 1e9,
      accounts: {
        mnemonic: mnemonic.testnet,
        initialIndex: 0,
        count: 10,
      },
      // verify: {
      //   etherscan: {
      //     apiUrl: 'http://mynetwork.xyz'
      //   }
      // },
    },
    mumbai: {
      url: `https://matic-mumbai.chainstacklabs.com/`,
      gasPrice: 10e9,
      accounts: {
        mnemonic: mnemonic.testnet,
        initialIndex: 0,
        count: 10,
      },
      chainId: 80001,
    },
    polygon: {
      url: `https://rpc-mainnet.maticvigil.com/v1/${process.env.MATIC_APIKEY}`,
      gasPrice: 15e9,
      accounts: {
        mnemonic: mnemonic.mainnet,
        initialIndex: 0,
        count: 10,
      },
    },
    mainnet: {
      url: `https://mainnet.infura.io/v3/${process.env.INFURA_APIKEY}`,
      // url: `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_APIKEY}`,
      gasPrice: 22e9,
      accounts: {
          mnemonic: mnemonic.mainnet,
          initialIndex: 0,
          count: 10,
      }
    },
  },
  etherscan: {
    apiKey: {
      mainnet: process.env.ETHERSCAN_APIKEY,
      ropsten: process.env.ETHERSCAN_APIKEY,
      goerli: process.env.ETHERSCAN_APIKEY,
      kovan: process.env.ETHERSCAN_APIKEY,
      polygon: process.env.POLYGONSCAN_APIKEY,
      polygonMumbai: process.env.POLYGONSCAN_APIKEY,
    }
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    gasPrice: 1,
    currency: "USD",
  },
  abiExporter: {
    path: "./abis",
    runOnCompile: true,
    clear: true,
    flat: true,
    only: ["Taggr", "CustomerSettings", "TaggrSettings", "NftDistributor", "Merkle", "TokenEscrow", "FakeUSDC"],
  },
  namedAccounts: {
    deployer: { default: 0 },
    protocolOwner: { default: 1 },
    foundationTreasury: { default: 2 },
    user1: { default: 3 },
    user2: { default: 4 },
    user3: { default: 5 },
    user4: { default: 6 },
    user5: { default: 7 },
    user6: { default: 8 },
    user7: { default: 9 },
  },
};
