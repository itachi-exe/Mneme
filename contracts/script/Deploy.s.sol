// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {MemoryPoolFactory} from "../src/MemoryPoolFactory.sol";
import {MemorySnapshot} from "../src/MemorySnapshot.sol";

contract Deploy is Script {
    function run() external {
        address agentic = vm.envOr("AGENTIC_ID_REGISTRY", address(0));
        vm.startBroadcast();
        MemoryPoolFactory factory = new MemoryPoolFactory(agentic);
        MemorySnapshot snap = new MemorySnapshot();
        vm.stopBroadcast();
        console2.log("factory", address(factory));
        console2.log("snapshot", address(snap));
        console2.log("agenticId", agentic);
    }
}
