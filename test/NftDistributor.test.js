const { smock } = require('@defi-wonderland/smock');
const { ethers, getNamedAccounts, getChainId } = require('hardhat');
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const _ = require('lodash');

const { contractDeploy } = require('../js-helpers/contractDeploy.js');
const { contractSetup } = require('../js-helpers/contractSetup.js');
const { getPermitSignature } = require('../js-helpers/erc20permit.js');
const { log, toWei } = require('../js-helpers/utils');
const EthSender = require('../build/contracts/contracts/test/EthSender.sol/EthSender.json');

const { MerkleTree } = require('merkletreejs');
const keccak256 = require('keccak256');

const TEST_PROJECT_ID = 'PID';
const TEST_TOKEN_ID = '1337';
const ROLES = {
  DEFAULT_ADMIN_ROLE  : '0x0000000000000000000000000000000000000000000000000000000000000000',
  OWNER_ROLE          : '0xb19546dff01e856fb3f010c267a7b1c60363cf8a4664e21cc89c26224620214e',
  MANAGER_ROLE        : '0x241ecf16d79d0f8dbfb92cbc07fe17840425976cf0667f022fe9877caa831b08',
  PAUSER_ROLE         : '',
  DEPLOYER_ROLE       : '0xfc425f2263d0df187444b70e47283d622c70181c5baebb1306a01edba1ce184c',
};


describe("NftDistributor", function () {
  async function deployCoreFixture() {
    const {deployer, protocolOwner, foundationTreasury, user1, user2, user3} = await getNamedAccounts();
    const [signerD, signerPO, signerFT, signer1, signer2, signer3] = await ethers.getSigners();

    // Deploy Core Contracts
    const { taggr, taggrSettings, customerSettings, nftDistributor, tokenEscrow } = await contractDeploy({fromUnitTests: true});
    await contractSetup({fromUnitTests: true});

    // Deploy Mocked Contracts
    const erc20factory = await smock.mock('ERC20Mintable');
    const erc20token = await erc20factory.deploy();
    await erc20token.deployed();

    const erc721factory = await smock.mock('ERC721Mintable');
    const erc721token = await erc721factory.deploy();
    await erc721token.deployed();

    const EthSenderFactory = new ethers.ContractFactory(EthSender.abi, EthSender.bytecode, signerD);
    const ethSender = await EthSenderFactory.deploy();
    await ethSender.deployed();

    await taggr.connect(signerD).managerUpdateCustomerAccount(user1, 1);
    const tx = await taggr.connect(signerD).managerLaunchNewProject(user1, TEST_PROJECT_ID, 'Name', 'Symbol', '', 1, 1000, 100);
    const txData = await tx.wait();
    const projectContractAddress = _.get(_.find(txData.events, {event: 'CustomerProjectLaunched'}), 'args.contractAddress', '');

    return {
      taggr, taggrSettings, customerSettings, nftDistributor, tokenEscrow, projectContractAddress,
      erc20token, erc721token, ethSender,
      deployer, protocolOwner, foundationTreasury, user1, user2, user3,
      signerD, signerPO, signerFT, signer1, signer2, signer3
    };
  }

  describe('Merkle Claims', async () => {
    it('should Verify a Merkle Prrof for a Valid Claim Code', async () => {
      const { nftDistributor, projectContractAddress, signer1 } = await loadFixture(deployCoreFixture);

      const tokenId = 1;
      const tagId = 123;
      const claimCode = 'fjruf74jf';

      const leavesSrc = [
        `${projectContractAddress}${tokenId+0}${tagId+0}${claimCode}1`,
        `${projectContractAddress}${tokenId+1}${tagId+1}${claimCode}2`,
        `${projectContractAddress}${tokenId+2}${tagId+2}${claimCode}3`,
        `${projectContractAddress}${tokenId+3}${tagId+3}${claimCode}4`,
      ];

      const leaves = leavesSrc.map(v => keccak256(v));
      const tree = new MerkleTree(leaves, keccak256, { sort: true });
      const root = tree.getHexRoot();
      const leaf = keccak256(leavesSrc[0]);
      const proof = tree.getHexProof(leaf);

      await nftDistributor.connect(signer1).setMerkleRoot(TEST_PROJECT_ID, root);

      expect(await nftDistributor.hasValidClaim(projectContractAddress, leaf, proof)).to.equal(true);

      const badLeavesSrc = [...leavesSrc];
      badLeavesSrc[2] = 'bad';
      const badLeaves = badLeavesSrc.map(v => keccak256(v));
      const badTree = new MerkleTree(badLeaves, keccak256, { sort: true })
      const badProof = badTree.getHexProof(leaf)

      expect(await nftDistributor.hasValidClaim(projectContractAddress, leaf, badProof)).to.equal(false);
    });

    it('should allow Claiming NFTs with a Valid Claim Code', async () => {
      const { nftDistributor, projectContractAddress, signer1, signer2, user2 } = await loadFixture(deployCoreFixture);

      const tokenId = 1;
      const tagId = 123;
      const claimCode = 'fjruf74jf';

      const leavesSrc = [
        `${projectContractAddress}${tokenId+0}${tagId+0}${claimCode}1`,
        `${projectContractAddress}${tokenId+1}${tagId+1}${claimCode}2`,
        `${projectContractAddress}${tokenId+2}${tagId+2}${claimCode}3`,
        `${projectContractAddress}${tokenId+3}${tagId+3}${claimCode}4`,
      ];

      const leaves = leavesSrc.map(v => keccak256(v));
      const tree = new MerkleTree(leaves, keccak256, { sort: true });
      const root = tree.getHexRoot();
      const leaf = keccak256(leavesSrc[2]);
      const proof = tree.getHexProof(leaf);

      await nftDistributor.connect(signer1).setMerkleRoot(TEST_PROJECT_ID, root);

      await expect(nftDistributor.connect(signer2).claimNft(projectContractAddress, 3, leaf, proof))
        .to.emit(nftDistributor, 'NftClaimed')
        .withArgs(user2, projectContractAddress, 3);

      // Token Claimed, should not be able to Claim again
      expect(await nftDistributor.hasValidClaim(projectContractAddress, leaf, proof)).to.equal(false);
    });

    it('should confirm when an NFT is Fully Claimed');
    it('should not be able to claim a purchased NFT');
    it('should allow project managers to update the Merkle Root');
    it('should allow the contract owner to update the Merkle Root for a specific project');
    it('should allow project managers to signal the Physical Delivery Timestamp event');
  });

  describe('NFT Purchases', async () => {
    it('should collect payment for customers and store in escrow', async () => {
      const {
        customerSettings,
        nftDistributor,
        erc20token,
        projectContractAddress,
        tokenEscrow,
        signer1,
        signer2,
        user2
      } = await loadFixture(deployCoreFixture);

      const tokenId = 1;
      const purchasePrice = toWei('100');

      // Setup
      await customerSettings.connect(signer1).setProjectPurchaseFee(TEST_PROJECT_ID, erc20token.address, purchasePrice);

      // Fund User to Buy NFT
      await erc20token.mint(user2, toWei('500'));
      // Approve Contract to move our Funds
      await erc20token.connect(signer2).approve(nftDistributor.address, purchasePrice);

      // Purchase NFT
      await expect(nftDistributor.connect(signer2).purchaseNft(TEST_PROJECT_ID, projectContractAddress, tokenId))
        .to.emit(nftDistributor, 'NftPurchased')
        .withArgs(user2, projectContractAddress, tokenId, false);

        // Confirm Token Balances
        expect(await erc20token.balanceOf(tokenEscrow.address)).to.equal(purchasePrice);
        expect(await erc20token.balanceOf(user2)).to.equal(toWei('400'));
    });
    it('should allow purchasing NFTs using tokens with permit feature', async () => {
      const {
        customerSettings,
        nftDistributor,
        erc20token,
        projectContractAddress,
        tokenEscrow,
        signer1,
        signer2,
        user2
      } = await loadFixture(deployCoreFixture);

      const tokenId = 1;
      const purchasePrice = toWei('100');
      const deadline = ethers.constants.MaxUint256;

      // Setup
      await customerSettings.connect(signer1).setProjectPurchaseFee(TEST_PROJECT_ID, erc20token.address, purchasePrice);

      // Fund User to Buy NFT
      await erc20token.mint(user2, toWei('500'));

      // User signs Permit Signature
      const { v, r, s } = await getPermitSignature(signer2, erc20token, nftDistributor.address, purchasePrice, deadline);

      // Purchase NFT with Permit
      await expect(nftDistributor.connect(signer2).purchaseNftWithPermit(TEST_PROJECT_ID, projectContractAddress, tokenId, deadline, v, r, s))
        .to.emit(nftDistributor, 'NftPurchased')
        .withArgs(user2, projectContractAddress, tokenId, false);

      // Confirm Token Balances
      expect(await erc20token.balanceOf(tokenEscrow.address)).to.equal(purchasePrice);
      expect(await erc20token.balanceOf(user2)).to.equal(toWei('400'));
    });
    it('should only allow customers to withdraw their own payments');
    it('should collect minting fees for Taggr based on Plan Type');
    it('should not be able to purchase a claimed NFT');

    it('should allow users to start a project and pruchase NFTs', async () => {
      const {
        taggr,
        nftDistributor,
        erc20token,
        projectContractAddress,
        tokenEscrow,
        signer1,
        signer2,
        user2,
        signerD
      } = await loadFixture(deployCoreFixture);

      const tokenId = 1;
      const purchasePrice = toWei('100');

      await taggr.connect(signerD).toggleCustomerSelfServe(user2, true).then((tx) => tx.wait());

      // Fund User to Buy NFT
      await erc20token.mint(user2, toWei('500'));
      // Approve Contract to move our Funds
      await erc20token.connect(signer2).approve(nftDistributor.address, purchasePrice);

      // Setup
      await taggr.connect(signer2).launchNewProject(
        TEST_PROJECT_ID,
        'testProject',
        'projectSymbol',
        'https://test.com',
        0,
        10,
        10000
      ).then((tx) => tx.wait());

      // Purchase NFT
      // await expect(nftDistributor.connect(signer2).purchaseNft(TEST_PROJECT_ID, projectContractAddress, tokenId))
      //   .to.emit(nftDistributor, 'NftPurchased')
      //   .withArgs(user2, projectContractAddress, tokenId, false);

      // // Confirm Token Balances
      // expect(await erc20token.balanceOf(tokenEscrow.address)).to.equal(purchasePrice);
      // expect(await erc20token.balanceOf(user2)).to.equal(toWei('400'));
    });
  });

  describe('Contract Management', async () => {
    // it('should allow only the contract owner to register Taggr with the NFT Distributor contract', async () => {
    //   const { taggr, nftDistributor, signerD, signer1 } = await loadFixture(deployCoreFixture);

    //   await expect(nftDistributor.connect(signer1).setTaggr(taggr.address))
    //     .to.be.revertedWith(`AccessControl: account ${_.toLower(signer1.address)} is missing role ${ROLES.OWNER_ROLE}`);

    //   expect(await nftDistributor.connect(signerD).setTaggr(taggr.address))
    //     .to.emit(nftDistributor, 'TaggrSet')
    //     .withArgs(taggr.address);
    // });

    it('should allow the Pauser Role to pause and unpause the contract');
    it('should allow the contract owner to update the reference to the Taggr contract');
    it('should allow the contract owner to update the reference to the TaggrSettings contract');
    it('should allow the contract owner to update the reference to the TokenEscrow contract');
  });

  describe('Blackhole Prevention', async () => {
    it('should not allow sending ETH into the contract', async () => {
      const { nftDistributor, signer1 } = await loadFixture(deployCoreFixture);

      // No fallback or receive functions
      await expect(signer1.sendTransaction({to: nftDistributor.address, value: toWei('10')}))
        .to.be.reverted;
    });

    it('should allow only the contract owner to release stuck ETH from the contract', async () => {
      const { nftDistributor, ethSender, deployer, user1, signerD, signer1 } = await loadFixture(deployCoreFixture);
      const amount = toWei('10');

      // Force ETH into ChargedParticles Contract
      await signer1.sendTransaction({to: ethSender.address, value: amount});
      await ethSender.sendEther(nftDistributor.address);

      // Attempt withdraw by Non-Owner
      await expect(nftDistributor.connect(signer1).withdrawEther(user1, amount))
        .to.be.revertedWith(`AccessControl: account ${_.toLower(signer1.address)} is missing role ${ROLES.OWNER_ROLE}`);

      // Withdraw by Owner
      expect(await nftDistributor.connect(signerD).withdrawEther(deployer, toWei('11')))
        .to.emit(nftDistributor, 'WithdrawStuckEther2')
        .withArgs(deployer, amount);
    });

    it('should allow only the contract owner to release stuck ERC20s from the contract', async () => {
      const { nftDistributor, erc20token, deployer, user1, signerD, signer1 } = await loadFixture(deployCoreFixture);
      const amount = toWei('10');

      await erc20token.balanceOf.whenCalledWith(nftDistributor.address).returns(amount);
      await erc20token.transfer.whenCalledWith(deployer, amount).returns(true);

      // Attempt withdraw by Non-Owner
      await expect(nftDistributor.connect(signer1).withdrawErc20(user1, erc20token.address, amount))
        .to.be.revertedWith(`AccessControl: account ${_.toLower(signer1.address)} is missing role ${ROLES.OWNER_ROLE}`);

      // Withdraw by Owner
      await expect(nftDistributor.connect(signerD).withdrawErc20(deployer, erc20token.address, amount))
        .to.emit(nftDistributor, 'WithdrawStuckERC20')
        .withArgs(deployer, erc20token.address, amount);
    });

    it('should allow only the contract owner to release stuck ERC721s from the contract', async () => {
      const { nftDistributor, erc721token, deployer, user1, signerD, signer1 } = await loadFixture(deployCoreFixture);

      // Mint an NFT into the contract
      await erc721token.mint(nftDistributor.address, TEST_TOKEN_ID);

      // Attempt withdraw by Non-Owner
      await expect(nftDistributor.connect(signer1).withdrawERC721(user1, erc721token.address, TEST_TOKEN_ID))
        .to.be.revertedWith(`AccessControl: account ${_.toLower(signer1.address)} is missing role ${ROLES.OWNER_ROLE}`);

      // Withdraw by Owner
      await expect(nftDistributor.connect(signerD).withdrawERC721(deployer, erc721token.address, TEST_TOKEN_ID))
        .to.emit(nftDistributor, 'WithdrawStuckERC721')
        .withArgs(deployer, erc721token.address, TEST_TOKEN_ID);
    });
  });
});
