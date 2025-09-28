// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "../src/HumanPassFactory.sol";

/**
 * DeployFactoryCreate2
 * CREATE2를 사용하여 HumanPassFactory를 모든 체인에서 동일한 주소로 배포
 */
contract DeployFactoryCreate2 is Script {
    address private deployer;
    
    // CREATE2 salt for Factory (고정값)
    bytes32 public constant FACTORY_SALT = keccak256("HumanPassFactory_20250928_2");
    
    function setUp() public {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        deployer = vm.addr(deployerPrivateKey);
        
        console.log("Deployer:", deployer);
        console.log("Factory Salt:", vm.toString(FACTORY_SALT));
    }
    
    function run() public {
        vm.startBroadcast(deployer);
        
        console.log("=== Deploying HumanPassFactory with CREATE2 ===");
        console.log("Chain ID:", block.chainid);
        console.log("Deployer:", deployer);
        
        // CREATE2를 사용하여 Factory 배포
        bytes memory factoryBytecode = abi.encodePacked(
            type(HumanPassFactory).creationCode
        );
        
        address factory = _deployCreate2(factoryBytecode, FACTORY_SALT);
        
        console.log("HumanPassFactory deployed at:", factory);
        
        vm.stopBroadcast();
        
        // Verify deployment
        _verifyDeployment(factory);
        
        // Print summary
        _printSummary(factory);
    }
    
    function _deployCreate2(bytes memory bytecode, bytes32 salt) internal returns (address deployedAddress) {
        assembly {
            deployedAddress := create2(0, add(bytecode, 0x20), mload(bytecode), salt)
        }
        require(deployedAddress != address(0), "Create2 deployment failed");
    }
    
    function _verifyDeployment(address factory) internal view {
        console.log("\n=== Verifying Deployment ===");
        
        // Check Factory contract
        require(factory != address(0), "Factory not deployed");
        
        // Check if Factory is properly initialized
        HumanPassFactory factoryContract = HumanPassFactory(factory);
        require(!factoryContract.deployed(), "Factory should not be deployed yet");
        
        console.log("Factory deployed and verified");
    }
    
    function _printSummary(address factory) internal {
        console.log("\n=== FACTORY DEPLOYMENT SUMMARY ===");
        console.log("Network:", vm.envOr("NETWORK", string("unknown")));
        console.log("Chain ID:", block.chainid);
        console.log("Deployer:", deployer);
        console.log("");
        console.log("Factory Address:", factory);
        console.log("Factory Salt:", vm.toString(FACTORY_SALT));
        console.log("");
        console.log("=== CREATE2 ADDRESS (Same across all chains) ===");
        console.log("Factory Salt:", vm.toString(FACTORY_SALT));
        console.log("");
        console.log("Note: This Factory address will be the same across all chains");
    }
}
