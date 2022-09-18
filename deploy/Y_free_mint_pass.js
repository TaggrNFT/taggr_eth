const { ethers, getNamedAccounts, network: networkObj } = require('hardhat');

const {
  getDeployData,
} = require('../js-helpers/deploy');

const {
  log,
  chainTypeById,
  chainNameById,
  chainIdByName,
} = require('../js-helpers/utils');

const _ = require('lodash');


module.exports = async () => {
  const { deployer, protocolOwner, user1, user2, user3, user4, user5, user6, user7 } = await getNamedAccounts();
  const [ signerD, signerPO ] = await ethers.getSigners();
  const network = await networkObj;
  const chainId = chainIdByName(network.name);
  const { isProd } = chainTypeById(chainId);

  if (isProd) { return; }

  log('\n~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
  log('Taggr - Free Mint Passes');
  log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~\n');

  log(`  Using Network: ${chainNameById(chainId)} (${chainId})`);
  log('  Using Accounts:');
  log('  - Deployer:          ', deployer);
  log('  - Owner:             ', protocolOwner);
  log(' ');

  const ddCustomerSettings = getDeployData('CustomerSettings', chainId);
  log('  Loading CustomerSettings from: ', ddCustomerSettings.address);
  const CustomerSettings = await ethers.getContractFactory('CustomerSettings');
  const customerSettings = await CustomerSettings.attach(ddCustomerSettings.address);


  // Disburse
  let accounts = [deployer, protocolOwner, user1, user2, user3, user4, user5, user6, user7];
  if (chainId === 5) {
    accounts = [
      '0x27607dF15Aa481D31dCEEdc2572ae083809f6995',
      '0x9E89edFFC3Bcdd502663503c93aaF6d37f4188dA',
      '0x6feDb09BABb57Bf252588Ae17c0A0400E5fBC9D3',
      '0xbeb87B2e4D8B89cd2Af8A3c7103DB7fB2f5af022',
      '0x653398a5B2c85476514693b67d8d5B92C1F737D2',
      '0x9FdD726dAf27DFd27332d7b5523288CaEaD2d3eD',
    ];
  }
  let tx;
  for (let i = 0; i < accounts.length; i++) {
    log(`    Granting 3 Free Mint Passes to ${accounts[i]}...`);
    tx = await customerSettings.connect(signerPO).setProjectFreeMint('DIRTY-NERD', accounts[i], 3);
    await tx.wait();
  }


  log(`\n  Free Mint Passes Complete!`);
  log('\n~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~\n');
};

module.exports.tags = ['freemintpass']
