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

  let merkleRoot, tx;

  // merkleRoot = '0x55fcb0707a95d7aed30a50e2f005d917c09e836ce4a4a78c9f26516c66d66b88';
  // log(`  Setting Merkle Root for Project: "${'FUTURIST-CONF'}" with Root: ${merkleRoot}`);
  // tx = await nftDistributor.setMerkleRootForProject('FUTURIST-CONF', merkleRoot);
  // await tx.wait();

  // merkleRoot = '0x360d7166ebd2be5d02fe7b72ac03ca7e80aa896d163a79c69e398b48aa968a7b';
  // log(`  Setting Merkle Root for Project: "${'ROYAL-ROSE-ART-GALLERY'}" with Root: ${merkleRoot}`);
  // tx = await nftDistributor.setMerkleRootForProject('ROYAL-ROSE-ART-GALLERY', merkleRoot);
  // await tx.wait();

  merkleRoot = '0xc78c88004bcdb97b8fd575a18f14564dd7a24d42412f2976323f0b4105839d7d';
  log(`  Setting Merkle Root for Project: "${'cortex-glass'}" with Root: ${merkleRoot}`);
  tx = await nftDistributor.setMerkleRootForProject('cortex-glass', merkleRoot);
  await tx.wait();

  log(`\n  Merkle Root Set!`);
  log('\n~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~\n');
};

module.exports.tags = ['merkle']
