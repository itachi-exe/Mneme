// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title MemorySnapshot
/// @notice Optional DA / storage-root registry for inherited snapshots.
/// The pool already stores merkle + storage roots; this contract is the
/// place a future 0G DA blob commitment is recorded so a third party can
/// verify a snapshot without knowing which pool it came from.
contract MemorySnapshot {
    error NotPool();
    error AlreadyAnchored();
    error EmptyRoot();

    event Anchored(
        bytes32 indexed merkleRoot,
        address indexed pool,
        uint32 snapshotId,
        bytes32 storageRoot,
        bytes32 daCommitment
    );

    struct Anchor {
        address pool;
        uint32 snapshotId;
        bytes32 storageRoot;
        bytes32 daCommitment;
        uint64 timestamp;
    }

    mapping(bytes32 => Anchor) public anchors;

    function anchor(
        bytes32 merkleRoot,
        uint32 snapshotId,
        bytes32 storageRoot,
        bytes32 daCommitment
    ) external {
        if (merkleRoot == bytes32(0)) revert EmptyRoot();
        if (anchors[merkleRoot].timestamp != 0) revert AlreadyAnchored();
        anchors[merkleRoot] = Anchor({
            pool: msg.sender,
            snapshotId: snapshotId,
            storageRoot: storageRoot,
            daCommitment: daCommitment,
            timestamp: uint64(block.timestamp)
        });
        emit Anchored(merkleRoot, msg.sender, snapshotId, storageRoot, daCommitment);
    }
}
