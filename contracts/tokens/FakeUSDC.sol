// SPDX-License-Identifier: MIT

pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/draft-ERC20Permit.sol";

/**
 * @dev Extension of {ERC20} with "Permit" functionality (EIP-2612)
 */
contract FakeUSDC is ERC20, ERC20Permit {

  constructor () ERC20("FakeUSDC", "fUSDC") ERC20Permit("FakeUSDC") {}

  function decimals() public view virtual override returns (uint8) {
    return 6; // Mimic USDC
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

  receive() external payable {}
  fallback() external payable {}
}