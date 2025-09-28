// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "../src/HumanPassFactory.sol";
import "../src/HumanPassVerifier.sol";

/**
 * DeployHumanPass
 * 기존 Factory를 사용해서 HumanPass 컨트랙트들을 배포/업그레이드하는 스크립트
 */
contract DeployHumanPass is Script {
    address private deployer;
    address private initialOwner;
    address private serverSigner;
    address private factoryAddress;
    
    HumanPassFactory public factory;
    
    // Contract addresses
    address public verifierImpl;
    address public verifier;
    
    function setUp() public {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        deployer = vm.addr(deployerPrivateKey);
        initialOwner = vm.envOr("INITIAL_OWNER", deployer);
        serverSigner = vm.envAddress("SERVER_SIGNER_ADDRESS");
        factoryAddress = vm.envAddress("FACTORY_ADDRESS");
        
        console.log("Deployer:", deployer);
        console.log("Initial Owner:", initialOwner);
        console.log("Server Signer:", serverSigner);
        console.log("Factory Address:", factoryAddress);
        
        factory = HumanPassFactory(factoryAddress);
    }
    
    function run() public {
        vm.startBroadcast(deployer);
        
        console.log("=== Upgrading Implementations with Existing Factory ===");
        console.log("Chain ID:", block.chainid);
        console.log("Deployer:", deployer);
        console.log("Initial Owner:", initialOwner);
        console.log("Server Signer:", serverSigner);
        console.log("Factory Address:", factoryAddress);
        
        // Check if contracts are already deployed
        if (factory.deployed()) {
            console.log("Contracts already deployed. Upgrading implementations...");
            
            // Get current deployed addresses
            (
                address currentVerifierImpl,
                address currentVerifier
            ) = factory.getDeployedAddresses();
            
            verifier = currentVerifier;
            
            console.log("Current Verifier implementation:", currentVerifierImpl);
            console.log("Verifier proxy:", verifier);
            
            // Upgrade implementations using factory (deploy new implementations)
            factory.upgradeImplementations(initialOwner);
            
            // Get new deployed addresses
            (
                verifierImpl,
            ) = factory.getDeployedAddresses();
            
            console.log("New Verifier implementation:", verifierImpl);
            
            // Now upgrade the proxies as the owner
            console.log("Upgrading Verifier proxy to new implementation...");
            HumanPassVerifier ver = HumanPassVerifier(verifier);
            ver.upgradeToAndCall(verifierImpl, "");
            
            console.log("All proxies upgraded successfully");
            
        } else {
            console.log("Deploying all contracts with CREATE2...");
            factory.deployAll(initialOwner, serverSigner);
            
            // Get deployed addresses
            (
                verifierImpl,
                verifier
            ) = factory.getDeployedAddresses();
            
            console.log("HumanPassVerifier implementation deployed at:", verifierImpl);
            console.log("HumanPassVerifier proxy deployed at:", verifier);
        }
        
        vm.stopBroadcast();
        
        // Verify deployment
        _verifyDeployment();
        
        // Print summary
        _printSummary();
    }
    
    function _verifyDeployment() internal view {
        console.log("\n=== Verifying Deployment ===");
        
        // Check Verifier contract
        require(verifier != address(0), "Verifier not deployed");
        HumanPassVerifier ver = HumanPassVerifier(verifier);
        require(ver.owner() == initialOwner, "Verifier owner mismatch");
        
        // Check default auth levels
        require(ver.requiredLevelOf(ver.AUTH_DEVICE()) == 1, "Device level not set");
        require(ver.requiredLevelOf(ver.AUTH_ORB()) == 2, "Orb level not set");
        
        console.log("All contracts deployed and configured correctly");
    }
    
    function _printSummary() internal {
        console.log("\n=== DEPLOYMENT SUMMARY ===");
        console.log("Network:", vm.envOr("NETWORK", string("unknown")));
        console.log("Chain ID:", block.chainid);
        console.log("Deployer:", deployer);
        console.log("Owner:", initialOwner);
        console.log("");
        console.log("Factory Address:", factoryAddress);
        console.log("");
        console.log("Contract Addresses:");
        console.log("HumanPassVerifier (Proxy):", verifier);
        console.log("HumanPassVerifier (Impl):", verifierImpl);
        console.log("");
        console.log("=== CREATE2 ADDRESSES (Same across all chains) ===");
        console.log("Verifier Proxy Salt:", vm.toString(factory.VERIFIER_PROXY_SALT()));
        console.log("");
        console.log("Note: Implementation addresses are different per chain (normal deployment)");
        console.log("Only Proxy addresses are deterministic using CREATE2");
    }
}
