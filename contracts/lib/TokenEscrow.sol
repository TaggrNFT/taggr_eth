// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v4.7.0) (utils/escrow/Escrow.sol)

pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "../interfaces/ITokenEscrow.sol";
import "./BlackholePrevention.sol";

/**
 * @title Escrow
 * @dev Base escrow contract, holds funds designated for a payee until they
 * withdraw them.
 *
 * Intended usage: This contract (and derived escrow contracts) should be a
 * standalone contract, that only interacts with the contract that instantiated
 * it. That way, it is guaranteed that all Ether will be handled according to
 * the `Escrow` rules, and there is no need to check for payable functions or
 * transfers in the inheritance tree. The contract that uses the escrow as its
 * payment method should be its owner, and provide public methods redirecting
 * to the escrow's deposit and withdraw.
 */
contract TokenEscrow is ITokenEscrow, Initializable, OwnableUpgradeable, BlackholePrevention {
  using AddressUpgradeable for address payable;
  using SafeERC20Upgradeable for IERC20Upgradeable;

  // Controller
  address private _nftDistributor;

  // Account => List of Tokens Deposited
  mapping(address => address[]) internal _depositTokens;
  // Account => Token Address => Index in "_depositTokens" Array
  mapping(address => mapping(address => uint256)) internal _depositTokensIndex;
  // Account => Token Address => Amount
  mapping(address => mapping(address => uint256)) internal _tokenDeposits;
  // Account => ETH Amount
  mapping(address => uint256) internal _deposits;


  /***********************************|
  |          Initialization           |
  |__________________________________*/

  function initialize(address initiator) public initializer {
    __Ownable_init();
    emit ContractReady(initiator);
  }


  /***********************************|
  |         Public Functions          |
  |__________________________________*/

  function depositsOf(address payee) public view override returns (uint256) {
    return _deposits[payee];
  }

  function depositedTokensCountOf(address payee) public view override returns (uint256) {
    return _depositTokens[payee].length;
  }

  function depositedTokenAddressByIndexOf(address payee, uint256 index) public view override returns (address) {
    return _depositTokens[payee][index];
  }

  function tokenDepositsOf(address payee, address tokenAddress) public view override returns (uint256) {
    return _tokenDeposits[payee][tokenAddress];
  }

  /**
    * @dev Withdraw accumulated balance for a payee, forwarding all gas to the
    * recipient.
    *
    * WARNING: Forwarding all gas opens the door to reentrancy vulnerabilities.
    * Make sure you trust the recipient, or are either following the
    * checks-effects-interactions pattern or using {ReentrancyGuard}.
    *
    * @param payee The address whose funds will be withdrawn and transferred to.
    *
    * Emits a {Withdrawn} event.
    */
  function withdraw(address payable payee) public virtual override {
    uint256 payment = _deposits[payee];
    _deposits[payee] = 0;

    // Transfer ETH
    payee.sendValue(payment);
    emit Withdrawn(payee, payment);
  }

  /**
    * @dev Withdraw accumulated balance for a payee.
    * @param payee The address whose funds will be withdrawn and transferred to.
    * @param tokenAddress The address of the token to be transferred.
    *
    * Emits a {TokensWithdrawn} event.
    */
  function withdrawTokens(address payable payee, address tokenAddress) public virtual override {
    uint256 payment = _tokenDeposits[payee][tokenAddress];
    _tokenDeposits[payee][tokenAddress] = 0;
    _removeTokenFromDeposits(payee, tokenAddress);

    // Transfer ERC20 Tokens
    IERC20Upgradeable(tokenAddress).safeTransfer(payee, payment);
    emit TokensWithdrawn(payee, tokenAddress, payment);
  }


  /***********************************|
  |       Permissioned Controls       |
  |__________________________________*/

  /**
    * @dev Stores the sent amount as credit to be withdrawn.
    * @param payee The destination address of the funds.
    *
    * Emits a {Deposited} event.
    */
  function deposit(address payee) public payable virtual override onlyDistributor {
    uint256 amount = msg.value;
    _deposits[payee] += amount;
    emit Deposited(payee, amount);
  }

  /**
    * @dev Stores the sent amount as credit to be withdrawn.
    * @param payee The destination address of the funds.
    * @param tokenAddress The address of the token to be transferred.
    * @param amount The amount of the token to be transferred.
    *
    * Emits a {TokensDeposited} event.
    */
  function depositTokens(address payee, address tokenAddress, uint256 amount) public payable virtual override onlyDistributor {
    _addTokenToDeposits(payee, tokenAddress);
    _tokenDeposits[payee][tokenAddress] += amount;
    emit TokensDeposited(payee, tokenAddress, amount);
  }

  function setNftDistributor(address nftDistributor) external override onlyOwner {
    require(nftDistributor != address(0), "TE:E-103");
    _nftDistributor = nftDistributor;
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

  function withdrawERC1155(address payable receiver, address tokenAddress, uint256 tokenId, uint256 amount) external onlyOwner {
    _withdrawERC1155(receiver, tokenAddress, tokenId, amount);
  }


  /***********************************|
  |         Private/Internal          |
  |__________________________________*/

  function _addTokenToDeposits(address payee, address tokenAddress) internal {
    if (_tokenDeposits[payee][tokenAddress] == 0) {
      _depositTokensIndex[payee][tokenAddress] = _depositTokens[payee].length;
      _depositTokens[payee].push(tokenAddress);
    }
  }

  function _removeTokenFromDeposits(address payee, address tokenAddress) internal {
    uint256 tokenIndex = _depositTokensIndex[payee][tokenAddress];
    uint256 lastTokenIndex = _depositTokens[payee].length - 1;

    // When the token to delete is the last token, the swap operation is unnecessary
    if (tokenIndex != lastTokenIndex) {
      address lastTokenAddress = _depositTokens[payee][lastTokenIndex];

      _depositTokens[payee][tokenIndex] = lastTokenAddress; // Move the last token to the slot of the to-delete token
      _depositTokensIndex[payee][lastTokenAddress] = tokenIndex; // Update the moved token's index
    }

    // This also deletes the contents at the last position of the array
    delete _depositTokensIndex[payee][tokenAddress];
    delete _depositTokens[payee][lastTokenIndex];
  }


  modifier onlyDistributor() {
    require(_msgSender() == _nftDistributor, "TE:E-102");
    _;
  }
}
