// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.0;

interface ITaggrNftRelay {
  function distributeToken(address to, uint256 tokenId) external;
}