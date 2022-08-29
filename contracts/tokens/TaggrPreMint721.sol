// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.4;

// import "@charged-particles/erc721i/contracts/ERC721i.sol";
// import "../lib/TaggrBase721.sol";

// contract TaggrPreMint721 is
//   ERC721i
// {
//   /***********************************|
//   |          Initialization           |
//   |__________________________________*/

//   constructor() TaggrBase721("TaggrPreMint721", "TPM721") {}

//   function initialize(address owner, string memory name, string memory symbol, uint256 maxSupply, uint96 royaltiesPct) external virtual override {
//     super.initialize(owner, name, symbol, maxSupply, royaltiesPct);

//     // Pre-Mint
//     _preMintReceiver = owner;
//     _preMintMaxSupply = maxSupply;
//     _balances[owner] = maxSupply;
//     emit ConsecutiveTransfer(1, maxSupply, address(0), owner);
//   }


//   /***********************************|
//   |         Public Functions          |
//   |__________________________________*/

//   function ownerOf(uint256 tokenId) public view virtual override returns (address) {
//     address owner = _owners[tokenId];
//     if (owner == address(0)) {
//       owner = owner();
//     }
//     return owner;
//   }

//   function supportsInterface(bytes4 interfaceId)
//     public
//     view
//     virtual
//     override(TaggrBase721, ERC721EnumerablePreMint)
//     returns (bool)
//   {
//     return super.supportsInterface(interfaceId);
//   }


//   /***********************************|
//   |          Contract Hooks           |
//   |__________________________________*/

//   function _beforeTokenTransfer(
//     address from,
//     address to,
//     uint256 tokenId
//   )
//     internal
//     virtual
//     override(TaggrBase721, ERC721EnumerablePreMint)
//   {
//     super._beforeTokenTransfer(from, to, tokenId);
//   }


//   /***********************************|
//   |         Private/Internal          |
//   |__________________________________*/

//   function _exists(uint256 tokenId) internal view virtual override returns (bool) {
//     return (tokenId > 0 && tokenId <= _maxSupply);
//   }
// }
