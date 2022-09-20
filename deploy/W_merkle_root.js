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

const { verifyContract } = require('../js-helpers/verification');

const _ = require('lodash');


module.exports = async () => {
  const { deployer, protocolOwner } = await getNamedAccounts();
  const network = await networkObj;
  const chainId = chainIdByName(network.name);
  log('\n~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
  log('Taggr - Set Merkle Root');
  log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~\n');

  log(`  Using Network: ${chainNameById(chainId)} (${chainId})`);
  log('  Using Accounts:');
  log('  - Deployer:          ', deployer);
  log('  - Owner:             ', protocolOwner);
  log(' ');

  const ddNftDistributor = getDeployData('NftDistributor', chainId);
  log('  Loading NftDistributor from: ', ddNftDistributor.address);
  const NftDistributor = await ethers.getContractFactory('NftDistributor');
  const nftDistributor = await NftDistributor.attach(ddNftDistributor.address);

  log(`  Setting Merkle Root for Project: "${'FUTURIST-CONF'}"`);
  const tx = await nftDistributor.setMerkleRootForProject('FUTURIST-CONF', '0x3a018b6078df44154eaf1d4ad606677c011fad09614d77a03c1f020c310b9c87');
  await tx.wait();

  log(`\n  Merkle Root Set!`);
  log('\n~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~\n');
};

module.exports.tags = ['merkle']
