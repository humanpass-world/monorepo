#!/bin/bash

# HumanPass Contract Deployment Script
# This script deploys HumanPass contracts to multiple EVM chains

set -e

# if there is env variable ENV=production, then use .env.production, otherwise use .env
if [ "$ENV" = "production" ]; then
    source .env.production
else
    source .env
fi

# Load utility functions
source "$(dirname "$0")/util.sh"

# Default values
NETWORKS=("arbitrum" "worldchain" "optimism" "base", "bnb", "polygon", "avalanche", "gnosis", "fantom", "zksync", "ethereum")
VERIFY=false
BROADCAST=false


# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Description:"
    echo "  Deploy HumanPass Factory to each network, then deploy implementations to all networks"
    echo ""
    echo "Options:"
    echo "  -n, --network NETWORK    Network(s) to deploy Factory to (arbitrum, worldchain, optimism, base)"
    echo "                           Can specify multiple networks: --network arbitrum worldchain"
    echo "  -v, --verify             Verify contract on block explorer"
    echo "  -b, --broadcast          Broadcast transaction"
    echo "  -h, --help               Show this help message"
    echo ""
    echo "Environment Variables:"
    echo "  DEPLOYER_PRIVATE_KEY     Deployer private key"
    echo "  INITIAL_OWNER            Initial owner (defaults to deployer address)"
    echo ""
    echo "Process:"
    echo "  1. Deploy Factory to each specified network"
    echo "  2. Deploy implementations to ALL networks using their respective Factories"
    echo ""
    echo "Examples:"
    echo "  $0 --network arbitrum --verify --broadcast"
    echo "  $0 --network arbitrum worldchain --verify --broadcast"
    echo "  $0 --verify --broadcast  # Deploy to all networks (arbitrum, worldchain, optimism, base)"
}


# Function to deploy Factory to a network
deploy_factory() {
    local network=$1
    local rpc_url=$2
    local chain_id=$3
    
    # deploy.sh always deploys a new Factory (no duplicate check)
    
    # Print status to stderr to avoid interfering with return value
    print_status "Deploying Factory to $network (Chain ID: $chain_id)" >&2
    
    # Build the forge command (using CREATE2 deployment)
    local cmd="forge script script/DeployFactoryCreate2.s.sol:DeployFactoryCreate2"
    cmd="$cmd --rpc-url $rpc_url"
    cmd="$cmd --chain $chain_id"
    cmd="$cmd --private-key $DEPLOYER_PRIVATE_KEY"
    
    if [ "$BROADCAST" = true ]; then
        cmd="$cmd --broadcast"
    fi
    
    # Set environment variables
    export NETWORK=$network
    export CHAIN_ID=$chain_id
    
    print_status "Running: $cmd" >&2
    
    # Execute the command and capture output
    local deployment_output
    deployment_output=$(eval $cmd 2>&1)
    local exit_code=$?
    
    if [ $exit_code -eq 0 ]; then
        # Extract Factory address from deployment output (only the address, no logs)
        local factory_addr=$(echo "$deployment_output" | grep "HumanPassFactory deployed at:" | sed 's/.*: //' | tr -d '\n\r')
        
        # Validate that we got a proper address
        if [[ "$factory_addr" =~ ^0x[a-fA-F0-9]{40}$ ]]; then
            # Print success message to stderr (so it doesn't interfere with return value)
            print_success "Factory deployment completed successfully for $network" >&2
            
            # Update create2.json with the deployed Factory address
            save_factory_address "$network" "$factory_addr" >&2
            
            # Return only the factory address
            echo "$factory_addr"
        else
            print_error "Failed to extract valid Factory address from deployment output" >&2
            echo "$deployment_output" >&2
            return 1
        fi
    else
        print_error "Factory deployment failed for $network" >&2
        echo "$deployment_output" >&2
        return 1
    fi
}

# Function to deploy implementations using existing Factory
deploy_implementations() {
    local network=$1
    local factory_addr=$2
    local rpc_url=$3
    local chain_id=$4
    
    print_status "Deploying implementations to $network using Factory $factory_addr"
    
    # Build the forge command
    local cmd="forge script script/DeployHumanPass.s.sol:DeployHumanPass"
    cmd="$cmd --rpc-url $rpc_url"
    cmd="$cmd --chain $chain_id"
    cmd="$cmd --private-key $DEPLOYER_PRIVATE_KEY"
    
    if [ "$BROADCAST" = true ]; then
        cmd="$cmd --broadcast"
    fi
    
    # Set environment variables
    export NETWORK=$network
    export CHAIN_ID=$chain_id
    export FACTORY_ADDRESS=$factory_addr
    
    print_status "Running: $cmd"
    
    # Execute the command and capture output
    local deployment_output
    deployment_output=$(eval $cmd 2>&1)
    local exit_code=$?
    
    if [ $exit_code -eq 0 ]; then
        print_success "Implementation deployment completed successfully for $network"
        
        # Extract contract addresses from deployment output
        extract_contract_addresses "$deployment_output"
        
        # Save proxy addresses (same across all networks due to CREATE2)
        if [ -n "$APP_PROXY_ADDR" ] && [ -n "$VERIFIER_PROXY_ADDR" ]; then
            save_proxy_addresses "$APP_PROXY_ADDR" "$VERIFIER_PROXY_ADDR"
        fi
        
        verify_contracts $network $rpc_url $chain_id
    else
        print_error "Implementation deployment failed for $network"
        echo "$deployment_output"
        return 1
    fi
}

# Function to deploy to multiple networks
deploy_to_networks() {
    local failed_networks=()
    local factory_addresses=()
    
    print_status "=== PHASE 1: Deploy Factories ==="
    
    # Phase 1: Deploy Factories to specified networks
    for network in "${NETWORKS[@]}"; do
        print_status "=== Deploying Factory to $network ==="
        
        # Get RPC URL and Chain ID for this network
        local network_rpc_url=$(get_rpc_url "$network")
        local network_chain_id=$(get_chain_id "$network")
        
        # Deploy Factory to this network
        local factory_addr
        if factory_addr=$(deploy_factory "$network" "$network_rpc_url" "$network_chain_id"); then
            print_success "Factory deployed to $network at: $factory_addr"
            factory_addresses+=("$factory_addr")
            save_factory_address "$network" "$factory_addr"
        else
            print_error "Failed to deploy Factory to $network"
            failed_networks+=("$network")
            continue
        fi
        
        echo ""
    done
    
    if [ ${#failed_networks[@]} -gt 0 ]; then
        print_error "Factory deployment failed for: ${failed_networks[*]}"
        exit 1
    fi
    
    print_status "=== PHASE 2: Deploy Implementations ==="
    
    # Phase 2: Deploy implementations to ALL networks using their Factories
    # For now, only deploy to networks that had factories deployed in Phase 1
    local factory_index=0
    
    for network in "${NETWORKS[@]}"; do
        print_status "=== Deploying implementations to $network ==="
        
        # Get RPC URL and Chain ID for this network
        local network_rpc_url=$(get_rpc_url "$network")
        local network_chain_id=$(get_chain_id "$network")
        
        # Use the Factory address for this network
        local factory_addr="${factory_addresses[$factory_index]}"
        
        if [ -z "$factory_addr" ]; then
            print_error "No Factory address found for $network. Skipping."
            failed_networks+=("$network")
            continue
        fi
        
        # Deploy implementations to this network
        if deploy_implementations "$network" "$factory_addr" "$network_rpc_url" "$network_chain_id"; then
            print_success "Implementations deployed to $network"
        else
            print_error "Failed to deploy implementations to $network"
            failed_networks+=("$network")
        fi
        
        factory_index=$((factory_index + 1))
        echo ""
    done
    
    # Report results
    if [ ${#failed_networks[@]} -eq 0 ]; then
        print_success "All deployments completed successfully!"
    else
        print_error "Deployment failed for: ${failed_networks[*]}"
        exit 1
    fi
}


# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -n|--network)
            shift
            NETWORKS=()
            # Collect all network arguments until we hit another option or end
            while [[ $# -gt 0 ]] && [[ ! "$1" =~ ^- ]]; do
                NETWORKS+=("$1")
                shift
            done
            ;;
        -v|--verify)
            VERIFY=true
            shift
            ;;
        -b|--broadcast)
            BROADCAST=true
            shift
            ;;
        -h|--help)
            show_usage
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Validate environment variables
validate_env

# Print deployment information
print_status "=== DEPLOYMENT CONFIGURATION ==="
print_status "Script: $SCRIPT_NAME"
print_status "Networks: ${NETWORKS[*]}"
print_status "Verify: $VERIFY"
print_status "Broadcast: $BROADCAST"
print_status "Deployer: $(cast wallet address --private-key $DEPLOYER_PRIVATE_KEY)"
print_status "================================"

# Deploy to all specified networks
deploy_to_networks

print_success "HumanPass deployment process completed!"
print_create2_summary
