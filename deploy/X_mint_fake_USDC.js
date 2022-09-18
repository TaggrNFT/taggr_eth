const { ethers, getNamedAccounts, network: networkObj, run } = require('hardhat');

const {
  getDeployData,
  getContractAbi,
  saveDeploymentData,
} = require('../js-helpers/deploy');

const {
  executeTx,
} = require('../js-helpers/executeTx');

const {
  log,
  toWei,
  chainTypeById,
  chainNameById,
  chainIdByName,
} = require('../js-helpers/utils');

const _ = require('lodash');


module.exports = async () => {
  const { deployer, protocolOwner, user1, user2, user3, user4, user5, user6, user7 } = await getNamedAccounts();
  const network = await networkObj;
  const chainId = chainIdByName(network.name);
  const { isProd } = chainTypeById(chainId);
  let project;

  if (isProd) { return; }

  log('\n~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
  log('Taggr - Fake USDC Disbursement');
  log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~\n');

  log(`  Using Network: ${chainNameById(chainId)} (${chainId})`);
  log('  Using Accounts:');
  log('  - Deployer:          ', deployer);
  log('  - Owner:             ', protocolOwner);
  log(' ');

  const ddFakeUSDC = getDeployData('FakeUSDC', chainId);
  log('  Loading FakeUSDC from: ', ddFakeUSDC.address);
  const FakeUSDC = await ethers.getContractFactory('FakeUSDC');
  const fakeUSDC = await FakeUSDC.attach(ddFakeUSDC.address);

  const toUSDC = v => ethers.utils.parseUnits(v, 6);

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
    log(`    Minting 1 Billion Fake USDC to ${accounts[i]}...`);
    tx = await fakeUSDC.mint(accounts[i], toUSDC('1000000000'));
    await tx.wait();
  }


  log(`\n  Fake USDC Disburement Complete!`);
  log('\n~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~\n');
};

module.exports.tags = ['mintusdc']
