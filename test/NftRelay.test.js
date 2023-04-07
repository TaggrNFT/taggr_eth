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
    const erc721factory = await smock.mock('ERC721Mintable');
    const erc721token = await erc721factory.deploy();

    // Deploy Mocked Contracts
    const erc20factory = await smock.mock('ERC20Mintable');
    const erc20token = await erc20factory.deploy();

    return {
      taggr, taggrSettings, nftDistributor, taggrFactoryLazy721, nftRelay,
      erc721token, erc20token,
      deployer, protocolOwner, foundationTreasury, user1, user2, user3,
      signerD, signerPO, signerFT, signer1, signer2, signer3
    };
  }

  describe('Customers and Projects', async () => {
    it.only('Deploy and initiate TaggrNftRelay', async () => {
      const {
        user1,
        taggr,
        signer1,
        signerD,
        nftRelay,
        erc721token,
        erc20token,
        taggrSettings, 
      } = await loadFixture(deployCoreFixture);

      // Mint ERC721 Token
      for (let i = 0; i < 100; i++) {
        await erc721token.mint(user1, i);
      }

      const user1Balance = await erc721token.balanceOf(user1);
      expect(user1Balance).to.equal(100);

      // Approve NftRelay to transfer ERC721 Token
      await erc721token.connect(signer1).setApprovalForAll(nftRelay.address, true).then((tx) => tx.wait());
      expect(await erc721token.isApprovedForAll(user1, nftRelay.address)).to.equal(true);
      
      // create customer account 
      // Fund User to Buy NFTV
      const purchasePrice = toWei('10000');
      await erc20token.mint(user1, toWei('500'));
      // Approve Contract to move our Funds
      await erc20token.connect(signer1).approve(taggr.address, purchasePrice);

      // Setup
      await taggrSettings.connect(signerD).setMembershipFeeToken(erc20token.address).then(tx => tx.wait());
      await taggr.connect(signer1).createCustomerAccount(1).then((tx) => tx.wait());

      const isUserCustomer = await taggr.connect(signer1).isCustomer(user1);
      expect(isUserCustomer).to.be.eq(true);


      // Create Project
      await taggr.connect(signerD).managerLaunchNewProjectWithContract(
        user1,
        TEST_PROJECT_ID,
        erc721token.address
      ).then((tx) => tx.wait());

      expect(await taggr.connect(signer1).isProjectContract(TEST_PROJECT_ID, erc721token.address)).to.be.eq(true);

      // 7. Call initialize() on TaggrNftRelay
      await nftRelay.initialize(
        TEST_PROJECT_ID,
        user1,
        user1,
        erc721token.address,
        user1
      ).then((tx) => tx.wait());

      expect(await nftRelay.getProjectName()).to.be.eq(TEST_PROJECT_ID);
    });
  });

});
