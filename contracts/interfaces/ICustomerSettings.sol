// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.4;

interface ICustomerSettings {
  event ContractReady(address indexed intializer);
  event ProjectPurchaseFeeSet(string projectId, uint256 fee);
  event ProjectPurchaseFeeTokenSet(string projectId, address feeToken);
  event ProjectFreeMinterSet(string projectId, address freeMinter, uint256 freeMintAmount);

  function getProjectPurchaseFee(string memory projectId) external view returns (uint256);
  function getProjectPurchaseFeeToken(string memory projectId) external view returns (address);
  function getProjectFreeMintAmount(string memory projectId, address freeMinter) external view returns (uint256);
  function decrementProjectFreeMint(string memory projectId, address freeMinter, uint256 amount) external;
}
