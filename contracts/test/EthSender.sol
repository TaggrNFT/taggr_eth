// SPDX-License-Identifier: MIT

pragma solidity >=0.8.0 <0.9.0;

contract EthSender {
  receive () external payable {}

  function sendEther(address target) public {
    selfdestruct(payable(target));
  }
}
