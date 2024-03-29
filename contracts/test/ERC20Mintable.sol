// SPDX-License-Identifier: MIT

pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/draft-ERC20Permit.sol";

import "hardhat/console.sol";

/**
 * @dev Extension of {ERC20} that adds a set of accounts with the {MinterRole},
 * which have permission to mint (create) new tokens as they see fit.
 *
 * At construction, the deployer of the contract is the only minter.
 */
contract ERC20Mintable is ERC20, ERC20Permit {

  constructor () ERC20("MockERC20", "MERC20") ERC20Permit("MockERC20") {}

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

  receive() external payable {}
  fallback() external payable {}
}