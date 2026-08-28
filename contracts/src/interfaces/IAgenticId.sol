// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice Minimal ERC-721 / ERC-7857 view Mneme needs for join/write auth.
/// Full ERC-7857 (encrypted metadata transfer) is out of scope for the pool;
/// we only check ownership of an Agentic ID token.
interface IAgenticId {
    function ownerOf(uint256 tokenId) external view returns (address);
    function balanceOf(address owner) external view returns (uint256);
}
