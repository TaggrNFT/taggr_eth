// SPDX-License-Identifier: MIT

pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155Upgradeable.sol";

/**
 * @dev Extension of {ERC1155} for Minting/Burning
 */
contract ERC1155Mintable is ERC1155Upgradeable {

  function initialize(string memory _uri) public initializer {
    __ERC1155_init(_uri);
  }

  /**
    * @dev See {ERC1155-_mint}.
    */
  function mint(address to, uint256 tokenId, uint256 amount) public {
    _mint(to, tokenId, amount, "");
  }

  /**
    * @dev See {ERC1155-_burn}.
    */
  function burn(address from, uint256 tokenId, uint256 amount) public {
    _burn(from, tokenId, amount);
  }
}
