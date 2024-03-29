const { network: networkObj, getNamedAccounts, getChainId } = require('hardhat');

const {
  log,
  chainTypeById,
} = require('../js-helpers/utils');

const { verifyContract, verifyProxyContract } = require('../js-helpers/verification');


module.exports = async () => {
  const chainId = await getChainId();
  const { deployer, protocolOwner } = await getNamedAccounts();
  const network = await networkObj;
  const {isHardhat} = chainTypeById(chainId);
  if (isHardhat) { return; }

  const networkName = network.name === 'homestead' ? 'mainnet' : network.name;
  log(`Verifying contracts on network "${networkName} (${chainId})"...`);

  log('\n~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
  log('Charged Particles: Contract Verification');
  log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~\n');

  log(`  Using Network: ${networkName} (${chainId})`);
  log('  Using Accounts:');
  log('  - Deployer:    ', deployer);
  log('  - Owner:       ', protocolOwner);
  log(' ');

  // Protocol
  // await verifyProxyContract({name: 'Taggr', networkName});
  // await verifyProxyContract({name: 'TaggrSettings', networkName});
  // await verifyProxyContract({name: 'CustomerSettings', networkName});
  // await verifyProxyContract({name: 'NftDistributor', networkName});
  // await verifyProxyContract({name: 'TaggrFactoryLazy721', networkName});
  // await verifyContract({name: 'TaggrLazy721', networkName});

  // Customer-specific NFT Relays
  await verifyContract({name: 'cortex-flight-crew', networkName, contractRef: 'tokens/TaggrNftRelay.sol:TaggrNftRelay', addressOverride: '0x09d471ec779027cAF6284D32262B2Bae8d4980A8' });


  log('\n  Contract Verification Complete.');
  log('\n~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~\n');
};

module.exports.tags = ['verify']
