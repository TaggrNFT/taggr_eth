// SPDX-License-Identifier: MIT

pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";

/**
 * @dev Extension of {ERC20} that adds a set of accounts with the {MinterRole},
 * which have permission to mint (create) new tokens as they see fit.
 *
 * At construction, the deployer of the contract is the only minter.
 */
contract PaymentToken is ERC20Upgradeable {

  function initialize(string memory _name, string memory _symbol) public initializer {
    __ERC20_init(_name, _symbol);
  }

  /**
    * @dev See {ERC20-_mint}.
    *
    * Requirements:
    *
    * - the caller must have the {MinterRole}.
    */
  function mint(address account, uint256 amount) public returns (bool) {
    _mint(account, amount);
    return true;
  }

  function burn(address account, uint256 amount) public returns (bool) {
    _burn(account, amount);
    return true;
  }
}