const { smock } = require('@defi-wonderland/smock');
const { ethers, getNamedAccounts, getChainId } = require('hardhat');
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const _ = require('lodash');

const { contractDeploy } = require('../js-helpers/contractDeploy.js');
const { contractSetup } = require('../js-helpers/contractSetup.js');
const { log, toWei } = require('../js-helpers/utils');
const EthSender = require('../build/contracts/contracts/test/EthSender.sol/EthSender.json');

const TEST_PROJECT_ID = 'PID';
const TEST_TOKEN_ID = '1337';
const ROLES = {
  DEFAULT_ADMIN_ROLE  : '0x0000000000000000000000000000000000000000000000000000000000000000',
  OWNER_ROLE          : '0xb19546dff01e856fb3f010c267a7b1c60363cf8a4664e21cc89c26224620214e',
  MANAGER_ROLE        : '0x241ecf16d79d0f8dbfb92cbc07fe17840425976cf0667f022fe9877caa831b08',
  PAUSER_ROLE         : '',
  DEPLOYER_ROLE       : '0xfc425f2263d0df187444b70e47283d622c70181c5baebb1306a01edba1ce184c',
};


describe("Taggr", function () {
  async function deployCoreFixture() {
    const chainId = await getChainId();
    const {deployer, protocolOwner, foundationTreasury, user1, user2, user3} = await getNamedAccounts();
    const [signerD, signerPO, signerFT, signer1, signer2, signer3] = await ethers.getSigners();

    // Deploy Core Contracts
    const { taggr, taggrSettings, nftDistributor, taggrFactoryLazy721, nftRelay } = await contractDeploy({fromUnitTests: true});
    await contractSetup({fromUnitTests: true});

    // Deploy Mocked Contracts
    const erc20factory = await smock.mock('ERC20Mintable');
    const erc20token = await erc20factory.deploy();

    const erc721factory = await smock.mock('ERC721Mintable');
    const erc721token = await erc721factory.deploy();

    const EthSenderFactory = new ethers.ContractFactory(EthSender.abi, EthSender.bytecode, signerD);
    const ethSender = await EthSenderFactory.deploy();
    await ethSender.deployTransaction.wait();

    return {
      taggr, taggrSettings, nftDistributor, taggrFactoryLazy721, nftRelay,
      erc20token, erc721token, ethSender,
      deployer, protocolOwner, foundationTreasury, user1, user2, user3,
      signerD, signerPO, signerFT, signer1, signer2, signer3
    };
  }

  describe('Customers and Projects', async () => {
    it.only('Deploy and initiate TaggrNftRelay', async () => {
      const { taggr, user1, signerD, nftRelay } = await loadFixture(deployCoreFixture);
      console.log(nftRelay);
    });
  });

});
