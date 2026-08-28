// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @dev Minimal ERC-721-shaped registry for tests.
contract MockAgenticId {
    mapping(uint256 => address) public ownerOf;
    mapping(address => uint256) public balanceOf;

    function mint(address to, uint256 tokenId) external {
        require(ownerOf[tokenId] == address(0), "exists");
        ownerOf[tokenId] = to;
        balanceOf[to] += 1;
    }
}
