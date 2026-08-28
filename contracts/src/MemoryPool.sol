// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IAgenticId} from "./interfaces/IAgenticId.sol";

/// @title MemoryPool
/// @notice Named, versioned, permissioned collective memory on 0G Chain.
/// Content lives on 0G Storage; this contract is the registry, ACL, and
/// provenance log. Inheritance points at a parent snapshot rather than
/// copying blobs.
contract MemoryPool {
    enum AccessMode {
        Public,
        Private,
        Group,
        Reputation,
        Paid
    }

    enum Role {
        None,
        Reader,
        Writer,
        Admin
    }

    struct WriteRecord {
        address writer;
        uint256 agenticId;
        bytes32 contentHash;
        bytes32 contextHash;
        bytes32 storageRoot;
        uint64 timestamp;
        uint32 version;
    }

    struct Snapshot {
        uint32 id;
        bytes32 merkleRoot;
        bytes32 storageRoot;
        bytes32 daCommitment;
        uint64 timestamp;
        address creator;
        uint32 writeCount;
    }

    struct PoolMeta {
        string name;
        string slug;
        address owner;
        AccessMode access;
        bool agenticIdRequired;
        uint256 joinFeeWei;
        uint32 version;
        uint64 createdAt;
        address parentPool;
        uint32 parentSnapshotId;
    }

    error NotOwner();
    error NotAuthorized();
    error AlreadyMember();
    error UnknownMember();
    error AgenticIdRequired();
    error AgenticIdNotOwned();
    error InvalidRole();
    error InvalidFee();
    error EmptyHash();
    error Closed();
    error NoSuchSnapshot();
    error PaidPoolUnpaid();

    event MemberJoined(address indexed account, uint256 agenticId, Role role);
    event MemberLeft(address indexed account);
    event RoleChanged(address indexed account, Role role);
    event MemoryWritten(
        uint256 indexed seq,
        address indexed writer,
        uint256 agenticId,
        bytes32 contentHash,
        bytes32 contextHash,
        bytes32 storageRoot,
        uint32 version
    );
    event SnapshotTaken(uint32 indexed id, bytes32 merkleRoot, bytes32 storageRoot, bytes32 daCommitment);
    event Inherited(address indexed parent, uint32 snapshotId, uint32 newVersion);
    event ClosedSet(bool closed);

    PoolMeta public meta;
    IAgenticId public agenticId;
    address public factory;
    bool public closed;

    mapping(address => Role) public roleOf;
    mapping(address => uint256) public memberAgenticId;
    address[] private _members;

    WriteRecord[] private _writes;
    Snapshot[] private _snapshots;

    modifier onlyAdmin() {
        if (roleOf[msg.sender] != Role.Admin && msg.sender != meta.owner) revert NotAuthorized();
        _;
    }

    modifier onlyWriter() {
        if (!_canWrite(msg.sender)) revert NotAuthorized();
        _;
    }

    constructor(
        string memory name_,
        string memory slug_,
        address owner_,
        AccessMode access_,
        bool agenticIdRequired_,
        uint256 joinFeeWei_,
        address agenticId_,
        address parentPool_,
        uint32 parentSnapshotId_
    ) {
        factory = msg.sender;
        meta = PoolMeta({
            name: name_,
            slug: slug_,
            owner: owner_,
            access: access_,
            agenticIdRequired: agenticIdRequired_,
            joinFeeWei: joinFeeWei_,
            version: 1,
            createdAt: uint64(block.timestamp),
            parentPool: parentPool_,
            parentSnapshotId: parentSnapshotId_
        });
        if (agenticId_ != address(0)) agenticId = IAgenticId(agenticId_);
        roleOf[owner_] = Role.Admin;
        _members.push(owner_);
        emit MemberJoined(owner_, 0, Role.Admin);
        if (parentPool_ != address(0)) {
            emit Inherited(parentPool_, parentSnapshotId_, 1);
        }
    }

    // ── membership ────────────────────────────────────────────────────────

    function join(uint256 tokenId) external payable {
        if (closed) revert Closed();
        if (roleOf[msg.sender] != Role.None) revert AlreadyMember();
        if (meta.access == AccessMode.Private) revert NotAuthorized();
        if (meta.access == AccessMode.Paid && msg.value < meta.joinFeeWei) revert PaidPoolUnpaid();
        if (msg.value > 0 && msg.value != meta.joinFeeWei && meta.access != AccessMode.Paid) revert InvalidFee();

        _assertAgentic(msg.sender, tokenId);

        Role granted = meta.access == AccessMode.Public ? Role.Writer : Role.Reader;
        roleOf[msg.sender] = granted;
        memberAgenticId[msg.sender] = tokenId;
        _members.push(msg.sender);
        if (msg.value > 0) {
            (bool ok,) = meta.owner.call{value: msg.value}("");
            require(ok, "fee");
        }
        emit MemberJoined(msg.sender, tokenId, granted);
    }

    function leave() external {
        if (msg.sender == meta.owner) revert NotOwner();
        if (roleOf[msg.sender] == Role.None) revert UnknownMember();
        roleOf[msg.sender] = Role.None;
        emit MemberLeft(msg.sender);
    }

    function setRole(address account, Role role) external onlyAdmin {
        if (account == meta.owner) revert NotOwner();
        if (role == Role.None) revert InvalidRole();
        if (roleOf[account] == Role.None) {
            _members.push(account);
        }
        roleOf[account] = role;
        emit RoleChanged(account, role);
    }

    // ── writes ────────────────────────────────────────────────────────────

    /// @dev Off-chain content is already on 0G Storage (or a local log).
    /// This records the provenance tuple that makes the write verifiable.
    function write(
        bytes32 contentHash,
        bytes32 contextHash,
        bytes32 storageRoot,
        uint256 tokenId
    ) external onlyWriter returns (uint256 seq) {
        if (closed) revert Closed();
        if (contentHash == bytes32(0) || storageRoot == bytes32(0)) revert EmptyHash();
        _assertAgentic(msg.sender, tokenId);

        seq = _writes.length;
        _writes.push(
            WriteRecord({
                writer: msg.sender,
                agenticId: tokenId,
                contentHash: contentHash,
                contextHash: contextHash,
                storageRoot: storageRoot,
                timestamp: uint64(block.timestamp),
                version: meta.version
            })
        );
        emit MemoryWritten(seq, msg.sender, tokenId, contentHash, contextHash, storageRoot, meta.version);
    }

    // ── snapshots / inheritance pointer ───────────────────────────────────

    function snapshot(bytes32 merkleRoot, bytes32 storageRoot, bytes32 daCommitment)
        external
        onlyAdmin
        returns (uint32 id)
    {
        if (merkleRoot == bytes32(0)) revert EmptyHash();
        id = uint32(_snapshots.length + 1);
        _snapshots.push(
            Snapshot({
                id: id,
                merkleRoot: merkleRoot,
                storageRoot: storageRoot,
                daCommitment: daCommitment,
                timestamp: uint64(block.timestamp),
                creator: msg.sender,
                writeCount: uint32(_writes.length)
            })
        );
        unchecked {
            meta.version += 1;
        }
        emit SnapshotTaken(id, merkleRoot, storageRoot, daCommitment);
    }

    function setClosed(bool v) external onlyAdmin {
        closed = v;
        emit ClosedSet(v);
    }

    // ── views ─────────────────────────────────────────────────────────────

    function writeCount() external view returns (uint256) {
        return _writes.length;
    }

    function snapshotCount() external view returns (uint256) {
        return _snapshots.length;
    }

    function memberCount() external view returns (uint256) {
        return _members.length;
    }

    function getWrite(uint256 seq) external view returns (WriteRecord memory) {
        return _writes[seq];
    }

    function getSnapshot(uint32 id) external view returns (Snapshot memory) {
        if (id == 0 || id > _snapshots.length) revert NoSuchSnapshot();
        return _snapshots[id - 1];
    }

    function members() external view returns (address[] memory) {
        return _members;
    }

    function canRead(address account) external view returns (bool) {
        return _canRead(account);
    }

    function canWrite(address account) external view returns (bool) {
        return _canWrite(account);
    }

    function version() external view returns (uint32) {
        return meta.version;
    }

    function parentInfo() external view returns (address parentPool, uint32 parentSnapshotId) {
        return (meta.parentPool, meta.parentSnapshotId);
    }

    function slug() external view returns (string memory) {
        return meta.slug;
    }

    function _canRead(address account) internal view returns (bool) {
        Role r = roleOf[account];
        if (r == Role.Reader || r == Role.Writer || r == Role.Admin) return true;
        if (meta.access == AccessMode.Public) return true;
        return false;
    }

    function _canWrite(address account) internal view returns (bool) {
        Role r = roleOf[account];
        return r == Role.Writer || r == Role.Admin;
    }

    function _assertAgentic(address account, uint256 tokenId) internal view {
        if (!meta.agenticIdRequired) return;
        if (address(agenticId) == address(0)) revert AgenticIdRequired();
        if (tokenId == 0) revert AgenticIdRequired();
        if (agenticId.ownerOf(tokenId) != account) revert AgenticIdNotOwned();
    }
}
