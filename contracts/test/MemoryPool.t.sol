// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {MemoryPool} from "../src/MemoryPool.sol";
import {MemoryPoolFactory} from "../src/MemoryPoolFactory.sol";
import {MemorySnapshot} from "../src/MemorySnapshot.sol";
import {MockAgenticId} from "../src/mocks/MockAgenticId.sol";

contract MemoryPoolTest is Test {
    MemoryPoolFactory factory;
    MockAgenticId registry;
    MemorySnapshot snapReg;
    address owner = address(0xA11CE);
    address alice = address(0xB0B);
    address bob = address(0xCA1);

    function setUp() public {
        registry = new MockAgenticId();
        factory = new MemoryPoolFactory(address(registry));
        snapReg = new MemorySnapshot();
        vm.deal(alice, 10 ether);
        vm.deal(bob, 10 ether);
        registry.mint(alice, 1);
        registry.mint(bob, 2);
    }

    function _create(MemoryPool.AccessMode mode, bool requireId) internal returns (MemoryPool pool) {
        vm.prank(owner);
        address p = factory.createPool("Research Swarm", "research-swarm", mode, requireId, 0, address(0), 0);
        pool = MemoryPool(p);
    }

    function testCreateAndJoinPublic() public {
        MemoryPool pool = _create(MemoryPool.AccessMode.Public, false);
        vm.prank(alice);
        pool.join(0);
        assertEq(uint256(pool.roleOf(alice)), uint256(MemoryPool.Role.Writer));
        assertTrue(pool.canWrite(alice));
    }

    function testPrivateCannotSelfJoin() public {
        MemoryPool pool = _create(MemoryPool.AccessMode.Private, false);
        vm.prank(alice);
        vm.expectRevert(MemoryPool.NotAuthorized.selector);
        pool.join(0);
    }

    function testAdminGrantsWriter() public {
        MemoryPool pool = _create(MemoryPool.AccessMode.Private, false);
        vm.prank(owner);
        pool.setRole(alice, MemoryPool.Role.Writer);
        assertTrue(pool.canWrite(alice));
    }

    function testWriteRecordsProvenance() public {
        MemoryPool pool = _create(MemoryPool.AccessMode.Public, false);
        vm.prank(alice);
        pool.join(0);
        bytes32 content = keccak256("hello");
        bytes32 ctx = keccak256("ctx");
        bytes32 root = keccak256("root");
        vm.prank(alice);
        uint256 seq = pool.write(content, ctx, root, 0);
        MemoryPool.WriteRecord memory rec = pool.getWrite(seq);
        assertEq(rec.writer, alice);
        assertEq(rec.contentHash, content);
        assertEq(rec.storageRoot, root);
        assertEq(rec.contextHash, ctx);
        assertGt(rec.timestamp, 0);
    }

    function testWriteRequiresWriterRole() public {
        MemoryPool pool = _create(MemoryPool.AccessMode.Private, false);
        vm.prank(alice);
        vm.expectRevert(MemoryPool.NotAuthorized.selector);
        pool.write(keccak256("a"), keccak256("b"), keccak256("c"), 0);
    }

    function testAgenticIdGating() public {
        vm.prank(owner);
        address p = factory.createPool("gated", "gated-pool", MemoryPool.AccessMode.Public, true, 0, address(0), 0);
        MemoryPool pool = MemoryPool(p);
        vm.prank(alice);
        pool.join(1);
        vm.prank(alice);
        pool.write(keccak256("a"), keccak256("b"), keccak256("c"), 1);
        vm.prank(bob);
        vm.expectRevert(MemoryPool.AgenticIdNotOwned.selector);
        pool.join(1);
    }

    function testSlugTaken() public {
        _create(MemoryPool.AccessMode.Public, false);
        vm.prank(owner);
        vm.expectRevert(MemoryPoolFactory.SlugTaken.selector);
        factory.createPool("x", "research-swarm", MemoryPool.AccessMode.Public, false, 0, address(0), 0);
    }

    function testInvalidSlug() public {
        vm.prank(owner);
        vm.expectRevert(MemoryPoolFactory.InvalidSlug.selector);
        factory.createPool("x", "NO", MemoryPool.AccessMode.Public, false, 0, address(0), 0);
    }

    function testSnapshotAndInheritPointer() public {
        MemoryPool parent = _create(MemoryPool.AccessMode.Public, false);
        vm.prank(alice);
        parent.join(0);
        vm.prank(alice);
        parent.write(keccak256("a"), keccak256("b"), keccak256("c"), 0);
        vm.prank(owner);
        uint32 id = parent.snapshot(keccak256("merkle"), keccak256("store"), keccak256("da"));
        assertEq(id, 1);
        assertEq(parent.version(), 2);
        assertEq(parent.snapshotCount(), 1);

        vm.prank(owner);
        address child = factory.createPool(
            "Research Swarm v2", "research-swarm-v2", MemoryPool.AccessMode.Public, false, 0, address(parent), id
        );
        MemoryPool c = MemoryPool(child);
        (address pp, uint32 ps) = c.parentInfo();
        assertEq(pp, address(parent));
        assertEq(ps, id);
    }

    function testPaidJoin() public {
        vm.prank(owner);
        address p = factory.createPool("paid", "paid-pool", MemoryPool.AccessMode.Paid, false, 1 ether, address(0), 0);
        MemoryPool pool = MemoryPool(p);
        vm.prank(alice);
        vm.expectRevert(MemoryPool.PaidPoolUnpaid.selector);
        pool.join(0);
        uint256 before = owner.balance;
        vm.prank(alice);
        pool.join{value: 1 ether}(0);
        assertEq(owner.balance, before + 1 ether);
        assertTrue(pool.canRead(alice));
    }

    function testEmptyHashReverts() public {
        MemoryPool pool = _create(MemoryPool.AccessMode.Public, false);
        vm.prank(alice);
        pool.join(0);
        vm.prank(alice);
        vm.expectRevert(MemoryPool.EmptyHash.selector);
        pool.write(bytes32(0), keccak256("b"), keccak256("c"), 0);
    }

    function testSnapshotAnchor() public {
        bytes32 root = keccak256("m");
        snapReg.anchor(root, 1, keccak256("s"), keccak256("d"));
        (address pool,,,) = _anchor(root);
        assertEq(pool, address(this));
        vm.expectRevert(MemorySnapshot.AlreadyAnchored.selector);
        snapReg.anchor(root, 1, keccak256("s"), keccak256("d"));
    }

    function _anchor(bytes32 root) internal view returns (address, uint32, bytes32, bytes32) {
        (address p, uint32 id, bytes32 s, bytes32 d,) = snapReg.anchors(root);
        return (p, id, s, d);
    }
}
