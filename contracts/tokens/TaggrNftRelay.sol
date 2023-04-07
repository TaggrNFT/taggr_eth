// SPDX-License-Identifier: MIT

pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "../interfaces/ITaggrNftRelay.sol";
import "../lib/BlackholePrevention.sol";

/**
 Testing Scenario:

  1. Deploy a Fake/Mock NFT Contract (Standard, with Random Token IDs)
  2. Deploy TaggrNftRelay Contract
  3. Mint X amount of Mock NFTs to an EOA (Personal Test Wallet)
  4. Approve the TaggrNftRelay Contract (setApprovalForAll) for the Mock NFTs
  5. Create Customer with Taggr.managerUpdateCustomerAccount()

  6. Call Taggr.managerLaunchNewProjectWithContract() with the TaggrNftRelay Contract address
  7. Call initialize() on TaggrNftRelay
  8. Call mapTokens() on TaggrNftRelay
  9. Call enable() on TaggrNftRelay (will only work if Approved to transfer Mock NFTs first)
 10. Test forceDistributeToken()
 11. Test ClaimNft from NftDistributor

*/

/**
 * @dev Allows an External NFT Contract to Relay Distribution of Tokens through Taggr's NftDistributor
 *  - Allows you to Map Non-Sequential or Custom Token IDs to a Sequential Set with Claim Codes
 *  - Allows Distribution of the External NFTs via Mint or Transfer by Taggr's NftDistributor (provides the required "distributeToken" function)
 */
contract TaggrNftRelay is Ownable, BlackholePrevention, ITaggrNftRelay, IERC721Receiver {
  event Initialized(address owner, address nftDistributor, address nftHolder);
  event ForcedDistribution(address owner, address to, uint256 tokenId);
  event TokensMapped(uint256 amount);
  event StateUpdated(bool isEnabled);

  bool internal _enabled;
  string internal _deployedProjectName;
  address internal _tokenDistributor;
  address internal _nftContractAddress;
  address internal _nftHolderAddress;

  // Internal Token ID => External Token ID
  mapping (uint256 => uint256) internal tokenIdToNftTokenId;

  // External Token ID => Internal Token ID
  mapping (uint256 => uint256) internal nftTokenIdToTokenId;

  // Internal Token ID => Is Distributed
  mapping (uint256 => bool) internal _nftTokenDistributed;


  /***********************************|
  |      Distributor Functions        |
  |__________________________________*/

  function getProjectName() external view returns (string memory projectName) {
    projectName = _deployedProjectName;
  }

  function getTokenById(uint256 tokenId) external view returns (uint256 nftTokenId, bool isDistributed) {
    nftTokenId = tokenIdToNftTokenId[tokenId];
    isDistributed = _nftTokenDistributed[tokenId];
  }

  function getTokenByNftId(uint256 nftTokenId) external view returns (uint256 tokenId, bool isDistributed) {
    tokenId = nftTokenIdToTokenId[nftTokenId];
    isDistributed = _nftTokenDistributed[tokenId];
  }

  function distributeToken(address to, uint256 tokenId) external override {
    require(_enabled, "not enabled");
    require(msg.sender == _tokenDistributor, "must be distributor");
    _distributeToken(to, tokenId);
  }

  function onERC721Received(address, address, uint256, bytes calldata) external pure override returns (bytes4) {
    return IERC721Receiver.onERC721Received.selector;
  }

  /***********************************|
  |            Only Owner             |
  |__________________________________*/

  function initialize(
    string memory _projectName,
    address _owner,
    address _nftDistributor,
    address _nftContract,
    address _nftHolder
  )
    external
    onlyOwner
  {
    _deployedProjectName = _projectName;
    _tokenDistributor = _nftDistributor;
    _nftContractAddress = _nftContract;
    _nftHolderAddress = _nftHolder;
    if (_nftHolderAddress == address(0)) {
      _nftHolderAddress = address(this);
    }

    _transferOwnership(_owner);

    emit Initialized(_owner, _nftDistributor, _nftHolder);
  }

  function mapTokens(uint256[] calldata _tokenIds, uint256[] calldata _nftTokenIds) external onlyOwner {
    require(_tokenIds.length == _nftTokenIds.length, "array length mismatch");
    uint256 len = _tokenIds.length;
    uint i = 0;
    for (; i < len; i++) {
      tokenIdToNftTokenId[_tokenIds[i]] = _nftTokenIds[i];
      nftTokenIdToTokenId[_nftTokenIds[i]] = _tokenIds[i];
    }
    emit TokensMapped(i);
  }

  function enable() external onlyOwner {
    if (_nftHolderAddress != address(this)) {
      require(IERC721(_nftContractAddress).isApprovedForAll(_nftHolderAddress, address(this)), "approval not set");
    } else {
      require(IERC721(_nftContractAddress).balanceOf(_nftHolderAddress) > 0, "no NFT balance");
    }
    _enabled = true;
    emit StateUpdated(_enabled);
  }

  function disable() external onlyOwner {
    _enabled = false;
    emit StateUpdated(_enabled);
  }

  function setProjectName(string memory name) external onlyOwner {
    _deployedProjectName = name;
  }

  function setTokenDistributor(address distributor) external onlyOwner {
    _tokenDistributor = distributor;
  }

  function setNftHolder(address nftHolder) external onlyOwner {
    _nftHolderAddress = nftHolder;
  }

  function forceDistributeToken(address to, uint256 tokenId) external onlyOwner {
    _distributeToken(to, tokenId);
    emit ForcedDistribution(owner(), to, tokenId);
  }

  /***********************************|
  |            Only Owner             |
  |      (blackhole prevention)       |
  |__________________________________*/

  function withdrawEther(address payable receiver, uint256 amount) external onlyOwner {
    _withdrawEther(receiver, amount);
  }

  function withdrawErc20(address payable receiver, address tokenAddress, uint256 amount) external onlyOwner {
    _withdrawERC20(receiver, tokenAddress, amount);
  }

  function withdrawERC721(address payable receiver, address tokenAddress, uint256 tokenId) external onlyOwner {
    _withdrawERC721(receiver, tokenAddress, tokenId);
  }

  /***********************************|
  |         Private/Internal          |
  |__________________________________*/

  function _distributeToken(address to, uint256 tokenId) internal {
    // Validate Internal Token ID
    require(tokenId > 0, "invalid token id");
    require(!_nftTokenDistributed[tokenId], "token already distributed");

    // Validate External Token ID
    uint256 nftTokenId = tokenIdToNftTokenId[tokenId];
    require(nftTokenId > 0, "invalid token map");

    // Distribute Mapped Token
    _nftTokenDistributed[tokenId] = true;
    IERC721(_nftContractAddress).safeTransferFrom(_nftHolderAddress, to, nftTokenId);
  }
}