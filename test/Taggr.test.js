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
    const { taggr, taggrSettings, nftDistributor, taggrFactoryLazy721 } = await contractDeploy({fromUnitTests: true});
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
      taggr, taggrSettings, nftDistributor, taggrFactoryLazy721,
      erc20token, erc721token, ethSender,
      deployer, protocolOwner, foundationTreasury, user1, user2, user3,
      signerD, signerPO, signerFT, signer1, signer2, signer3
    };
  }

  describe('Contract Management', async () => {
    it('should allow only the contract manager to register the Taggr Settings contract', async () => {
      const { taggr, taggrSettings, signerD, signer1 } = await loadFixture(deployCoreFixture);

      await expect(taggr.connect(signer1).setTaggrSettings(taggrSettings.address))
        .to.be.revertedWith(`AccessControl: account ${_.toLower(signer1.address)} is missing role ${ROLES.MANAGER_ROLE}`);

      expect(await taggr.connect(signerD).setTaggrSettings(taggrSettings.address))
        .to.emit(taggr, 'SettingsSet')
        .withArgs(taggrSettings.address);
    });

    it('should allow only the contract manager to register the NFT Distributor contract', async () => {
      const { taggr, nftDistributor, signerD, signer1 } = await loadFixture(deployCoreFixture);

      await expect(taggr.connect(signer1).setNftDistributor(nftDistributor.address))
        .to.be.revertedWith(`AccessControl: account ${_.toLower(signer1.address)} is missing role ${ROLES.MANAGER_ROLE}`);

      expect(await taggr.connect(signerD).setNftDistributor(nftDistributor.address))
        .to.emit(taggr, 'NftDistributorSet')
        .withArgs(nftDistributor.address);
    });

    it('should allow only the contract manager to register the Lazy721 Factory contract', async () => {
      const { taggr, taggrFactoryLazy721, signerD, signer1 } = await loadFixture(deployCoreFixture);

      await expect(taggr.connect(signer1).registerNftFactory(2, taggrFactoryLazy721.address))
        .to.be.revertedWith(`AccessControl: account ${_.toLower(signer1.address)} is missing role ${ROLES.MANAGER_ROLE}`);

      expect(await taggr.connect(signerD).registerNftFactory(2, taggrFactoryLazy721.address))
        .to.emit(taggr, 'NftFactoryRegistered')
        .withArgs(1, taggrFactoryLazy721.address);
    });

    // it('should allow only the default-admin-role to register Taggr as the Lazy721 Deployer', async () => {
    //   const { taggr, taggrFactoryLazy721, signerD, signer1 } = await loadFixture(deployCoreFixture);

    //   await expect(taggrFactoryLazy721.connect(signer1).setDeployer(taggr.address))
    //     .to.be.revertedWith(`AccessControl: account ${_.toLower(signer1.address)} is missing role ${ROLES.DEFAULT_ADMIN_ROLE}`);

    //   expect(await taggrFactoryLazy721.connect(signerD).setDeployer(taggr.address))
    //     .to.emit(taggrFactoryLazy721, 'DeployerSet')
    //     .withArgs(taggr.address);
    // });

    it('should allow the Pauser Role to pause and unpause the contract');
  });

  describe('Customers and Projects', async () => {
    it('should allow only the contract manager to Register New Customers without Fee', async () => {
      const { taggr, user1, signerD, signer1 } = await loadFixture(deployCoreFixture);

      // Attempt Creation by Non-Manager
      await expect(taggr.connect(signer1).managerUpdateCustomerAccount(user1, 1))
        .to.be.revertedWith(`AccessControl: account ${_.toLower(signer1.address)} is missing role ${ROLES.MANAGER_ROLE}`);

      // Creation
      await expect(taggr.connect(signerD).managerUpdateCustomerAccount(user1, 1))
        .to.emit(taggr, 'CustomerAccountCreated')
        .withArgs(user1);
    });

    it('should allow only the contract manager to Register New Projects without Fee', async () => {
      const { taggr, user1, signerD, signer1 } = await loadFixture(deployCoreFixture);

      // Create Customer Account
      await taggr.connect(signerD).managerUpdateCustomerAccount(user1, 1);

      // Attempt Creation by Non-Manager
      await expect(taggr.connect(signer1).managerLaunchNewProject(user1, TEST_PROJECT_ID, 'Name', 'Symbol', '', 1, 1000, 100))
        .to.be.revertedWith(`AccessControl: account ${_.toLower(signer1.address)} is missing role ${ROLES.MANAGER_ROLE}`);

      // Creation
      await expect(taggr.connect(signerD).managerLaunchNewProject(user1, TEST_PROJECT_ID, 'Name', 'Symbol', '', 1, 1000, 100))
        .to.emit(taggr, 'CustomerProjectLaunched');

        // Commneted out; Contract address keeps chaning based on the number of transactions by the user
        // .withArgs(user1, '0x25bEE23e489b9ec351A3f974c3050D1be60900FE', '0x6af5ab9ebf6a6e5ae3a165984d905028b4742481f656da786871304a3c8db0e8');
    });

    it('should allow only the contract manager to Toggle Customer Self-Serve');
  });

  describe('Blackhole Prevention', async () => {
    it('should not allow sending ETH into the contract', async () => {
      const { taggr, signer1 } = await loadFixture(deployCoreFixture);

      // No fallback or receive functions
      await expect(signer1.sendTransaction({to: taggr.address, value: toWei('10')}))
        .to.be.reverted;
    });

    it('should allow only the contract owner to release stuck ETH from the contract', async () => {
      const { taggr, ethSender, deployer, user1, signerD, signer1 } = await loadFixture(deployCoreFixture);
      const amount = toWei('10');

      // Force ETH into ChargedParticles Contract
      await signer1.sendTransaction({to: ethSender.address, value: amount});
      await ethSender.sendEther(taggr.address);

      // Attempt withdraw by Non-Owner
      await expect(taggr.connect(signer1).withdrawEther(user1, amount))
        .to.be.revertedWith(`AccessControl: account ${_.toLower(signer1.address)} is missing role ${ROLES.OWNER_ROLE}`);

      // Withdraw by Owner
      expect(await taggr.connect(signerD).withdrawEther(deployer, toWei('11')))
        .to.emit(taggr, 'WithdrawStuckEther2')
        .withArgs(deployer, amount);
    });

    it('should allow only the contract owner to release stuck ERC20s from the contract', async () => {
      const { taggr, erc20token, deployer, user1, signerD, signer1 } = await loadFixture(deployCoreFixture);
      const amount = toWei('10');

      await erc20token.balanceOf.whenCalledWith(taggr.address).returns(amount);
      await erc20token.transfer.whenCalledWith(deployer, amount).returns(true);

      // Attempt withdraw by Non-Owner
      await expect(taggr.connect(signer1).withdrawErc20(user1, erc20token.address, amount))
        .to.be.revertedWith(`AccessControl: account ${_.toLower(signer1.address)} is missing role ${ROLES.OWNER_ROLE}`);

      // Withdraw by Owner
      await expect(taggr.connect(signerD).withdrawErc20(deployer, erc20token.address, amount))
        .to.emit(taggr, 'WithdrawStuckERC20')
        .withArgs(deployer, erc20token.address, amount);
    });

    it('should allow only the contract owner to release stuck ERC721s from the contract', async () => {
      const { taggr, erc721token, deployer, user1, signerD, signer1 } = await loadFixture(deployCoreFixture);

      // Mint an NFT into the contract
      await erc721token.mint(taggr.address, TEST_TOKEN_ID);

      // Attempt withdraw by Non-Owner
      await expect(taggr.connect(signer1).withdrawERC721(user1, erc721token.address, TEST_TOKEN_ID))
        .to.be.revertedWith(`AccessControl: account ${_.toLower(signer1.address)} is missing role ${ROLES.OWNER_ROLE}`);

      // Withdraw by Owner
      await expect(taggr.connect(signerD).withdrawERC721(deployer, erc721token.address, TEST_TOKEN_ID))
        .to.emit(taggr, 'WithdrawStuckERC721')
        .withArgs(deployer, erc721token.address, TEST_TOKEN_ID);
    });
  });
});
