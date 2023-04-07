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

  if (chainId === 1) {
    // Bolix Megaspace Giveaway Winners
    accounts = [
      // '0xBB7AFc63F936F9A6D814E02854f80e8860F7210b', // Tammy
      // '0x49c6a1fc0eb7c6717166c414d8c92a9480fd9694', // BP
      // '0x61B7cb1f0B633E85dB2561Aa3106dD91ecdB28a6', // WWC
      // '0xF5b20d83F6AD6831B0B5B74EA3545538fE54c6d7', // Clint
      // '0xe29433e08b9678D0c8a2c97cE3Dd48ADbe673664',
      // '0x3c433F9050187E2751cE0747340639C1186Be2Ed', // Brave Mobile - Rob for Taggr Auto
    ];
  }

  let tx;
  for (let i = 0; i < accounts.length; i++) {
    log(`    Granting 1 Free Mint Pass to ${accounts[i]}...`);
    tx = await customerSettings.connect(signerD).setProjectFreeMint('taggr-auto', accounts[i], 1);
    await tx.wait();
  }


  log(`\n  Free Mint Passes Complete!`);
  log('\n~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~\n');
};

module.exports.tags = ['freemintpass']
