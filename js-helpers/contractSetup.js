const { ethers, getNamedAccounts, network } = require('hardhat');

const {
  getDeployData,
} = require('../js-helpers/deploy');

const {
  executeTx,
  skipToTxId,
  getAccumulatedGasCost,
} = require('../js-helpers/executeTx');

const {
  log,
  toWei,
  chainTypeById,
  chainNameById,
  chainIdByName,
} = require('../js-helpers/utils');

const _ = require('lodash');


const contractSetup = async (args = {fromUnitTests: false}) => {
  const { deployer, protocolOwner } = await getNamedAccounts();
  const networkName = (await network).name;
  const chainId = chainIdByName(networkName);
  const {isProd, isHardhat} = chainTypeById(chainId);

  const ddTaggr = getDeployData('Taggr', chainId);
  const ddTaggrSettings = getDeployData('TaggrSettings', chainId);
  const ddCustomerSettings = getDeployData('CustomerSettings', chainId);
  const ddNftDistributor = getDeployData('NftDistributor', chainId);
  const ddTokenEscrow = getDeployData('TokenEscrow', chainId);
  const ddTaggrFactoryLazy721 = getDeployData('TaggrFactoryLazy721', chainId);

  if (!args.fromUnitTests) {
    log('\n~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
    log('Taggr - Contract Configurations');
    log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~\n');

    log(`  Using Network: ${chainNameById(chainId)} (${chainId})`);
    log('  Using Accounts:');
    log('  - Deployer:          ', deployer);
    log('  - Owner:             ', protocolOwner);
    log(' ');
  }

  !args.fromUnitTests && log('  Loading Taggr from:               ', ddTaggr.address);
  const Taggr = await ethers.getContractFactory('Taggr');
  const taggr = await Taggr.attach(ddTaggr.address);

  !args.fromUnitTests && log('  Loading TaggrSettings from:       ', ddTaggrSettings.address);
  const TaggrSettings = await ethers.getContractFactory('TaggrSettings');
  const taggrSettings = await TaggrSettings.attach(ddTaggrSettings.address);

  !args.fromUnitTests && log('  Loading CustomerSettings from:    ', ddCustomerSettings.address);
  const CustomerSettings = await ethers.getContractFactory('CustomerSettings');
  const customerSettings = await CustomerSettings.attach(ddCustomerSettings.address);

  !args.fromUnitTests && log('  Loading NftDistributor from:      ', ddNftDistributor.address);
  const NftDistributor = await ethers.getContractFactory('NftDistributor');
  const nftDistributor = await NftDistributor.attach(ddNftDistributor.address);

  !args.fromUnitTests && log('  Loading TokenEscrow from:         ', ddTokenEscrow.address);
  const TokenEscrow = await ethers.getContractFactory('TokenEscrow');
  const tokenEscrow = await TokenEscrow.attach(ddTokenEscrow.address);

  !args.fromUnitTests && log('  Loading TaggrFactoryLazy721 from: ', ddTaggrFactoryLazy721.address);
  const TaggrFactoryLazy721 = await ethers.getContractFactory('TaggrFactoryLazy721');
  const taggrFactoryLazy721 = await TaggrFactoryLazy721.attach(ddTaggrFactoryLazy721.address);


  // skipToTxId('2-c');

  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  // Setup Taggr
  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

  await executeTx('1-a', 'Taggr: Registering Settings', !args.fromUnitTests, async () =>
    await taggr.setTaggrSettings(ddTaggrSettings.address)
  );

  await executeTx('1-b', 'Taggr: Registering NFT Distributor', !args.fromUnitTests, async () =>
    await taggr.setNftDistributor(ddNftDistributor.address)
  );

  await executeTx('1-c', 'Taggr: Registering Lazy721 Factory', !args.fromUnitTests, async () =>
    await taggr.registerNftFactory(1, ddTaggrFactoryLazy721.address)
  );


  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  // Setup TaggrSettings
  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

  await executeTx('2-a', 'TaggrSettings: Membership Fee', !args.fromUnitTests, async () =>
    await taggrSettings.setMembershipFee(toWei('1.0'))
  );

  await executeTx('2-b', 'TaggrSettings: Project Launch Fee', !args.fromUnitTests, async () =>
    await taggrSettings.setProjectLaunchFee(toWei('1.0'))
  );

  await executeTx('2-c', 'TaggrSettings: Membership Fee Token', !args.fromUnitTests, async () =>
    await taggrSettings.setMembershipFeeToken('0x07865c6e87b9f70255377e024ace6630c1eaa37f') // USDC on Goerli
  );

  await executeTx('2-d', 'TaggrSettings: Project Launch Fee Token', !args.fromUnitTests, async () =>
    await taggrSettings.setProjectLaunchFeeToken('0x07865c6e87b9f70255377e024ace6630c1eaa37f') // USDC on Goerli
  );

  await executeTx('2-e', 'TaggrSettings: Set Minting Fee by Plan Type (1=Free)', !args.fromUnitTests, async () =>
    await taggrSettings.setMintingFeeByPlanType(1, 500) // Plan Type 1 = Free  (5%)
  );
  await executeTx('2-f', 'TaggrSettings: Set Minting Fee by Plan Type (2=Standard)', !args.fromUnitTests, async () =>
    await taggrSettings.setMintingFeeByPlanType(2, 400) // Plan Type 2 = Standard  (4%)
  );
  await executeTx('2-g', 'TaggrSettings: Set Minting Fee by Plan Type (3=Professional)', !args.fromUnitTests, async () =>
    await taggrSettings.setMintingFeeByPlanType(3, 300) // Plan Type 3 = Professional  (3%)
  );
  await executeTx('2-h', 'TaggrSettings: Set Minting Fee by Plan Type (4=Business)', !args.fromUnitTests, async () =>
    await taggrSettings.setMintingFeeByPlanType(4, 200) // Plan Type 4 = Business  (2%)
  );


  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  // Setup CustomerSettings
  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

  await executeTx('3-a', 'CustomerSettings: Register Taggr', !args.fromUnitTests, async () =>
    await customerSettings.setTaggr(ddTaggr.address)
  );

  await executeTx('3-b', 'CustomerSettings: Register NFT Distributor', !args.fromUnitTests, async () =>
    await customerSettings.setNftDistributor(ddNftDistributor.address)
  );


  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  // Setup NftDistributor
  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

  await executeTx('4-a', 'NftDistributor: Register Taggr', !args.fromUnitTests, async () =>
    await nftDistributor.setTaggr(ddTaggr.address)
  );

  await executeTx('4-b', 'NftDistributor: Register TaggrSettings', !args.fromUnitTests, async () =>
    await nftDistributor.setTaggrSettings(ddTaggrSettings.address)
  );

  await executeTx('4-c', 'NftDistributor: Register CustomerSettings', !args.fromUnitTests, async () =>
    await nftDistributor.setCustomerSettings(ddCustomerSettings.address)
  );

  await executeTx('4-d', 'NftDistributor: Register TokenEscrow', !args.fromUnitTests, async () =>
    await nftDistributor.setTokenEscrow(ddTokenEscrow.address)
  );


  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  // Setup TokenEscrow
  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

  await executeTx('5-a', 'TokenEscrow: Register NFT Distributor', !args.fromUnitTests, async () =>
    await tokenEscrow.setNftDistributor(ddNftDistributor.address)
  );


  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  // Setup Lazy721 Factory
  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

  await executeTx('6-a', 'TaggrFactoryLazy721: Register Taggr as Deployer', !args.fromUnitTests, async () =>
    await taggrFactoryLazy721.setDeployer(ddTaggr.address)
  );


  if (!args.fromUnitTests) {
  log(`\n  Contract Initialization Complete!`);
    const gasCosts = getAccumulatedGasCost();
    log('     - Total Gas Cost');
    log('       @ 10 gwei:  ', gasCosts[1]);
    log('       @ 100 gwei: ', gasCosts[2]);
    log('       @ 150 gwei: ', gasCosts[3]);
    log('\n~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~\n');
  }

};

module.exports = {
  contractSetup
};
