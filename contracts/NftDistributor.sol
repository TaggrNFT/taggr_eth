// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.4;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlEnumerableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";

import "./interfaces/ITaggr.sol";
import "./interfaces/ITokenEscrow.sol";
import "./interfaces/ITaggrSettings.sol";
import "./interfaces/ICustomerSettings.sol";
import "./interfaces/INftDistributor.sol";
import "./interfaces/ITaggrNft.sol";
import "./lib/MerkleClaim.sol";
import "./lib/BlackholePrevention.sol";


contract NftDistributor is
  Initializable,
  INftDistributor,
  AccessControlEnumerableUpgradeable,
  PausableUpgradeable,
  ReentrancyGuardUpgradeable,
  MerkleClaim,
  BlackholePrevention
{
  using AddressUpgradeable for address payable;
  using SafeERC20Upgradeable for IERC20Upgradeable;

  address internal constant ETH_ADDRESS = address(0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE);
  bytes32 internal constant OWNER_ROLE = keccak256("OWNER_ROLE");
  bytes32 internal constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
  uint256 internal constant PERCENTAGE_SCALE = 1e4;       // 10000  (100%)

  ITaggr internal _taggr;
  ITokenEscrow internal _escrow;
  ITaggrSettings internal _taggrSettings;
  ICustomerSettings internal _customerSettings;

  // Taggr Payment Receiver
  address internal _taggrPaymentReceiver;

  //  NFT Contract =>          TokenID => Claimed-State
  mapping (address => mapping (uint256 => bool)) internal _isTokenFullyClaimed;
  mapping (address => mapping (uint256 => uint256)) internal _tokenPhysicalDeliveryTimestamp;


  /***********************************|
  |          Initialization           |
  |__________________________________*/

  function initialize(address initiator) public initializer {
    __AccessControlEnumerable_init();
    __Pausable_init();
    __ReentrancyGuard_init();

    _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
    _setupRole(OWNER_ROLE, _msgSender());
    _setupRole(PAUSER_ROLE, _msgSender());

    emit ContractReady(initiator);
  }


  /***********************************|
  |         Public Functions          |
  |__________________________________*/

  function getTokenPhysicalDeliveryTimestamp(address contractAddress, uint256 tokenId) external view override returns (uint256) {
    return _tokenPhysicalDeliveryTimestamp[contractAddress][tokenId];
  }

  function isFullyClaimed(address contractAddress, uint256 tokenId) public view override returns (bool isClaimed) {
    isClaimed = _isTokenFullyClaimed[contractAddress][tokenId];
  }

  function hasValidClaim(
    address contractAddress,
    bytes32 merkleNode,
    bytes32[] calldata merkleProof
  )
    external
    view
    override
    returns (bool)
  {
    return _hasValidClaim(contractAddress, merkleNode, merkleProof);
  }

  function claimNft(
    address contractAddress,
    uint256 tokenId,
    bytes32 merkleNode,
    bytes32[] calldata merkleProof
  )
    external
    virtual
    override
    nonReentrant
  {
    address to = _msgSender();
    bool isClaimed = _isTokenFullyClaimed[contractAddress][tokenId];
    bool validClaim = _hasValidClaim(contractAddress, merkleNode, merkleProof);
    require(!isClaimed && validClaim, "TL721:E-");

    // Mark NFT as Fully-Claimed
    _setNodeClaimed(contractAddress, merkleNode);
    _isTokenFullyClaimed[contractAddress][tokenId] = true;

    // Mint Token
    ITaggrNft(contractAddress).distributeToken(to, tokenId);
    emit NftClaimed(to, contractAddress, tokenId);
  }

  function purchaseNft(
    string calldata projectId,
    address contractAddress,
    uint256 tokenId
  )
    external
    payable
    virtual
    override
    nonReentrant
  {
    bool isClaimed = _isTokenFullyClaimed[contractAddress][tokenId];
    require(!isClaimed, "TL721:E-");

    // Collect Payment for Customer
    address purchaser = _msgSender();
    _collectPayment(projectId, purchaser);

    // Mark NFT as Fully-Claimed
    _isTokenFullyClaimed[contractAddress][tokenId] = true;

    // Mint Token
    ITaggrNft(contractAddress).distributeToken(purchaser, tokenId);

    emit NftPurchased(purchaser, contractAddress, tokenId);
  }


  function setMerkleRoot(string memory projectId, bytes32 merkleRoot) public virtual {
    require(_taggr.isProjectManager(projectId, _msgSender()), "Not project manager");

    address contractAddress = _taggr.getProjectContract(projectId);
    _setMerkleRoot(contractAddress, merkleRoot);
  }

  function setPhysicalDeliveryTimestamp(string memory projectId, uint256 tokenId) public virtual {
    require(_taggr.isProjectManager(projectId, _msgSender()), "Not project manager");

    address contractAddress = _taggr.getProjectContract(projectId);
    _tokenPhysicalDeliveryTimestamp[contractAddress][tokenId] = block.timestamp;
  }


  /***********************************|
  |       Permissioned Controls       |
  |__________________________________*/

  function pause() external onlyRole(PAUSER_ROLE) {
    _pause();
  }

  function unpause() external onlyRole(PAUSER_ROLE) {
    _unpause();
  }

  function setTaggr(address taggr) external onlyRole(OWNER_ROLE) {
    require(taggr != address(0), "Invalid address");
    _taggr = ITaggr(taggr);
    emit TaggrSet(taggr);
  }

  function setTaggrSettings(address taggrSettings) external onlyRole(OWNER_ROLE) {
    require(taggrSettings != address(0), "Invalid address");
    _taggrSettings = ITaggrSettings(taggrSettings);
    emit TaggrSettingsSet(taggrSettings);
  }

  function setCustomerSettings(address customerSettings) external onlyRole(OWNER_ROLE) {
    require(customerSettings != address(0), "Invalid address");
    _customerSettings = ICustomerSettings(customerSettings);
    emit CustomerSettingsSet(customerSettings);
  }

  function setTokenEscrow(address tokenEscrow) external onlyRole(OWNER_ROLE) {
    require(tokenEscrow != address(0), "Invalid address");
    _escrow = ITokenEscrow(tokenEscrow);
    emit TokenEscrowSet(tokenEscrow);
  }

  function setMerkleRootForProject(string memory projectId, bytes32 merkleRoot) external onlyRole(OWNER_ROLE) {
    address contractAddress = _taggr.getProjectContract(projectId);
    _setMerkleRoot(contractAddress, merkleRoot);
  }


  /***********************************|
  |            Only Owner             |
  |      (blackhole prevention)       |
  |__________________________________*/

  function withdrawEther(address payable receiver, uint256 amount) external onlyRole(OWNER_ROLE) {
    _withdrawEther(receiver, amount);
  }

  function withdrawErc20(address payable receiver, address tokenAddress, uint256 amount) external onlyRole(OWNER_ROLE) {
    _withdrawERC20(receiver, tokenAddress, amount);
  }

  function withdrawERC721(address payable receiver, address tokenAddress, uint256 tokenId) external onlyRole(OWNER_ROLE) {
    _withdrawERC721(receiver, tokenAddress, tokenId);
  }

  function withdrawERC1155(address payable receiver, address tokenAddress, uint256 tokenId, uint256 amount) external onlyRole(OWNER_ROLE) {
    _withdrawERC1155(receiver, tokenAddress, tokenId, amount);
  }


  /***********************************|
  |         Private/Internal          |
  |__________________________________*/

  function _collectPayment(string memory projectId, address purchaser) internal {
    // Check CustomerSettings.sol for Required Purchase Fees:
    uint256 purchaseFee = _customerSettings.getProjectPurchaseFee(projectId);

    // If account is in Allowlist for Free Minting then fee = 0
    uint256 freeMintAmount = _customerSettings.getProjectFreeMintAmount(projectId, purchaser);
    if (freeMintAmount > 0) {
      _customerSettings.decrementProjectFreeMint(projectId, purchaser, 1);
      purchaseFee = 0;
    }

    // Transfer Purchase Fees to Escrow on behalf of Customer
    if (purchaseFee > 0) {
      address payable customerAccount = payable(_taggr.getProjectOwner(projectId));
      address purchaseToken = _customerSettings.getProjectPurchaseFeeToken(projectId);
      uint256 customerFee = purchaseFee;

      // Calculate Taggr Fees Percentage
      uint256 customerPlanType = _taggr.getCustomerPlanType(customerAccount);
      uint256 customerPlanFee = _taggrSettings.getMintingFeeByPlanType(customerPlanType);
      if (customerPlanFee > 0) {
        uint256 taggrFee = (purchaseFee * customerPlanFee) / PERCENTAGE_SCALE;
        customerFee -= taggrFee;

        if (purchaseToken == ETH_ADDRESS) {
          require(msg.value >= purchaseFee, "Insufficient payment");
          _escrow.deposit{value: customerFee}(customerAccount);
          _escrow.deposit{value: taggrFee}(_taggrPaymentReceiver);
        } else {
          IERC20Upgradeable(purchaseToken).safeTransferFrom(purchaser, address(_escrow), purchaseFee);
          _escrow.depositTokens(customerAccount, purchaseToken, customerFee);
          _escrow.depositTokens(_taggrPaymentReceiver, purchaseToken, taggrFee);
        }
      }

      // Refund overspend
      if (purchaseFee > 0 && purchaseToken == ETH_ADDRESS && msg.value > purchaseFee) {
        payable(purchaser).sendValue(msg.value - purchaseFee);
      }
    }
  }
}
