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


describe("TokenEscrow", function () {
  async function deployCoreFixture() {
    const chainId = await getChainId();
    const {deployer, protocolOwner, foundationTreasury, user1, user2, user3} = await getNamedAccounts();
    const [signerD, signerPO, signerFT, signer1, signer2, signer3] = await ethers.getSigners();

    // Deploy Core Contracts
    const { taggr, taggrSettings, nftDistributor, tokenEscrow } = await contractDeploy({fromUnitTests: true});
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
      taggr, taggrSettings, nftDistributor, tokenEscrow,
      erc20token, erc721token, ethSender,
      deployer, protocolOwner, foundationTreasury, user1, user2, user3,
      signerD, signerPO, signerFT, signer1, signer2, signer3
    };
  }

  describe('Public API', async () => {
    it('should allow anyone to read the ETH Deposits for an account');
    it('should allow anyone to read the Token Deposits for an account');
    it('should allow anyone to read the Various Tokens deposited for an account');
    it('should allow anyone to withdraw ETH on behalf of a specific account');
    it('should allow anyone to withdraw Tokens on behalf of a specific account');
  });

  describe('Contract Management', async () => {
    it('should allow only the owner to set the reference to the NftDistributor contract');
  });

  describe('Distribution', async () => {
    it('should only allow the NftDistributor contract to make ETH Deposits');
    it('should only allow the NftDistributor contract to make Token Deposits');
  });

  describe('Blackhole Prevention', async () => {
    it('should not allow sending ETH into the contract', async () => {
      const { tokenEscrow, signer1 } = await loadFixture(deployCoreFixture);

      // No fallback or receive functions
      await expect(signer1.sendTransaction({to: tokenEscrow.address, value: toWei('10')}))
        .to.be.reverted;
    });

    it('should allow only the contract owner to release stuck ETH from the contract', async () => {
      const { tokenEscrow, ethSender, deployer, user1, signerD, signer1 } = await loadFixture(deployCoreFixture);
      const amount = toWei('10');

      // Force ETH into ChargedParticles Contract
      await signer1.sendTransaction({to: ethSender.address, value: amount});
      await ethSender.sendEther(tokenEscrow.address);

      // Attempt withdraw by Non-Owner
      await expect(tokenEscrow.connect(signer1).withdrawEther(user1, amount))
        .to.be.revertedWith('Ownable: caller is not the owner');

      // Withdraw by Owner
      expect(await tokenEscrow.connect(signerD).withdrawEther(deployer, toWei('11')))
        .to.emit(tokenEscrow, 'WithdrawStuckEther2')
        .withArgs(deployer, amount);
    });

    it('should allow only the contract owner to release stuck ERC20s from the contract', async () => {
      const { tokenEscrow, erc20token, deployer, user1, signerD, signer1 } = await loadFixture(deployCoreFixture);
      const amount = toWei('10');

      await erc20token.balanceOf.whenCalledWith(tokenEscrow.address).returns(amount);
      await erc20token.transfer.whenCalledWith(deployer, amount).returns(true);

      // Attempt withdraw by Non-Owner
      await expect(tokenEscrow.connect(signer1).withdrawErc20(user1, erc20token.address, amount))
        .to.be.revertedWith('Ownable: caller is not the owner');

      // Withdraw by Owner
      await expect(tokenEscrow.connect(signerD).withdrawErc20(deployer, erc20token.address, amount))
        .to.emit(tokenEscrow, 'WithdrawStuckERC20')
        .withArgs(deployer, erc20token.address, amount);
    });

    it('should allow only the contract owner to release stuck ERC721s from the contract', async () => {
      const { tokenEscrow, erc721token, deployer, user1, signerD, signer1 } = await loadFixture(deployCoreFixture);

      // Mint an NFT into the contract
      await erc721token.mint(tokenEscrow.address, TEST_TOKEN_ID);

      // Attempt withdraw by Non-Owner
      await expect(tokenEscrow.connect(signer1).withdrawERC721(user1, erc721token.address, TEST_TOKEN_ID))
        .to.be.revertedWith('Ownable: caller is not the owner');

      // Withdraw by Owner
      await expect(tokenEscrow.connect(signerD).withdrawERC721(deployer, erc721token.address, TEST_TOKEN_ID))
        .to.emit(tokenEscrow, 'WithdrawStuckERC721')
        .withArgs(deployer, erc721token.address, TEST_TOKEN_ID);
    });
  });
});
