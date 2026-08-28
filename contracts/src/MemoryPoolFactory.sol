// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {MemoryPool} from "./MemoryPool.sol";

/// @title MemoryPoolFactory
/// @notice Creates Memory Pools and keeps a slug → address registry.
contract MemoryPoolFactory {
    error SlugTaken();
    error InvalidSlug();
    error ZeroOwner();

    event PoolCreated(
        address indexed pool,
        address indexed owner,
        string slug,
        MemoryPool.AccessMode access,
        address parentPool,
        uint32 parentSnapshotId
    );

    address public immutable agenticId;
    mapping(string => address) public pools;
    address[] public allPools;

    constructor(address agenticId_) {
        agenticId = agenticId_;
    }

    function createPool(
        string calldata name_,
        string calldata slug_,
        MemoryPool.AccessMode access_,
        bool agenticIdRequired_,
        uint256 joinFeeWei_,
        address parentPool_,
        uint32 parentSnapshotId_
    ) external returns (address pool) {
        if (msg.sender == address(0)) revert ZeroOwner();
        if (!_validSlug(slug_)) revert InvalidSlug();
        if (pools[slug_] != address(0)) revert SlugTaken();

        MemoryPool deployed = new MemoryPool(
            name_,
            slug_,
            msg.sender,
            access_,
            agenticIdRequired_,
            joinFeeWei_,
            agenticId,
            parentPool_,
            parentSnapshotId_
        );
        pool = address(deployed);
        pools[slug_] = pool;
        allPools.push(pool);
        emit PoolCreated(pool, msg.sender, slug_, access_, parentPool_, parentSnapshotId_);
    }

    function poolCount() external view returns (uint256) {
        return allPools.length;
    }

    function _validSlug(string calldata slug_) internal pure returns (bool) {
        bytes memory b = bytes(slug_);
        if (b.length < 3 || b.length > 48) return false;
        for (uint256 i; i < b.length; i++) {
            bytes1 c = b[i];
            bool ok = (c >= 0x61 && c <= 0x7a) || (c >= 0x30 && c <= 0x39) || c == 0x2d;
            if (!ok) return false;
        }
        return true;
    }
}
