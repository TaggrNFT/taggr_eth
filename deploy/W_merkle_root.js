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

  // merkleRoot = '0x4b9c2cd989d474347054a427987ac73940e2c218a8653cf20e742f148a906d6e';
  // log(`  Setting Merkle Root for Project: "${'cortex-glass'}" with Root: ${merkleRoot}`);
  // tx = await nftDistributor.setMerkleRootForProject('cortex-glass', merkleRoot);
  // await tx.wait();

  // merkleRoot = '0x04a76b6c9363c1d7b9e647a713c7601ea8528a5789225a5236f67b13d644ded5';
  // log(`  Setting Merkle Root for Project: "${'toronto-web-3-2023'}" with Root: ${merkleRoot}`);
  // tx = await nftDistributor.setMerkleRootForProject('toronto-web-3-2023', merkleRoot);
  // await tx.wait();

  // merkleRoot = '0xc5b6eec301d747676a430bcb3843efa36ba917beffe39c8a689de7ad6f45542c';
  // log(`  Setting Merkle Root for Project: "${'manhattan-insanity'}" with Root: ${merkleRoot}`);
  // tx = await nftDistributor.setMerkleRootForProject('manhattan-insanity', merkleRoot);
  // await tx.wait();

  // merkleRoot = '0xcf13f2fea78167131d1efaa05a4a9e2549685cb6dd85c1f160779d5e2f8253b2';
  // log(`  Setting Merkle Root for Project: "${'taggr-nft-nyc-demos'}" with Root: ${merkleRoot}`);
  // tx = await nftDistributor.setMerkleRootForProject('taggr-nft-nyc-demos', merkleRoot);
  // await tx.wait();

  log(`\n  Merkle Root Set!`);
  log('\n~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~\n');
};

module.exports.tags = ['merkle']
