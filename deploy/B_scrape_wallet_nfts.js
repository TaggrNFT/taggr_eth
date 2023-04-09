const { ethers, network: networkObj, getNamedAccounts, getChainId } = require('hardhat');
const axios = require('axios');

const {
  log,
  chainTypeById,
} = require('../js-helpers/utils');

module.exports = async () => {
  const [ signer ] = await ethers.getSigners();
  const chainId = await getChainId();
  const network = await networkObj;
  const networkName = network.name === 'homestead' ? 'mainnet' : network.name;
  const {isHardhat} = chainTypeById(chainId);
  if (isHardhat) { return; }

  const accountToScrape = '0x44D7954eB0AA72C0eD545223a5dF32B8e9D5EC46';
  const nftContractToScrape = '0x92939Fc66f67017832be6b279410a59cA6A42a20';

  log('\n~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
  log('Taggr: NFT Scraper');
  log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~\n');

  log(`  Using Network: ${networkName} (${chainId})`);
  log('  Scraping Account: ', accountToScrape);
  log('  Scraping NFTs of: ', nftContractToScrape);
  log(' ');

  const nftContract = new ethers.Contract(nftContractToScrape, [
    'function balanceOf(address) public view returns (uint256)',
    'function tokenOfOwnerByIndex(address,uint256) public view returns (uint256)',
    'function tokenURI(uint256) public view returns (string)',
  ], signer)

  const balance = await nftContract.balanceOf(accountToScrape);
  log(` Balance: ${balance}`);

  for (let i = 0; i < balance; i++) {
    const tokenId = await nftContract.tokenOfOwnerByIndex(accountToScrape, i);
    const tokenUri = await nftContract.tokenURI(tokenId);
    const meta = await axios.get(tokenUri);
    log(`  [${i}] = ${tokenId} = ${meta.data.name}`);
  }

  log('\n  NFT Scraper Complete.');
  log('\n~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~\n');
};

module.exports.tags = ['scrape']
