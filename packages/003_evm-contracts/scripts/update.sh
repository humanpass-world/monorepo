#!/bin/bash

# HumanPass Update Script
# This script updates implementations on all networks using existing Factories

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
    echo "  Update HumanPass implementations on all networks using existing Factories"
    echo ""
    echo "Options:"
    echo "  -n, --network NETWORK    Network(s) to update (arbitrum, worldchain, optimism, base)"
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
    echo "  1. Read Factory addresses from dist/address/factory.json file"
    echo "  2. Deploy new implementations using existing Factories"
    echo "  3. Update proxy implementations (if needed)"
    echo ""
    echo "Examples:"
    echo "  $0 --network arbitrum --verify --broadcast"
    echo "  $0 --network arbitrum worldchain --verify --broadcast"
    echo "  $0 --verify --broadcast  # Update all networks"
}


# Function to get Factory address from saved file
get_factory_address() {
    local network=$1
    
    # Use the new load_factory_address function from util.sh
    if factory_addr=$(load_factory_address "$network"); then
        echo "$factory_addr"
        return 0
    else
        print_error "Factory address not found for $network. Please run deploy.sh first."
        return 1
    fi
}

# Function to deploy implementations using existing Factory
deploy_implementations() {
    local network=$1
    local factory_addr=$2
    local rpc_url=$3
    local chain_id=$4
    
    print_status "Updating implementations on $network using Factory $factory_addr"
    
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
        print_success "Implementation update completed successfully for $network"
        
        # Extract contract addresses from deployment output
        extract_contract_addresses "$deployment_output"
        
        verify_contracts $network $rpc_url $chain_id
    else
        print_error "Implementation update failed for $network"
        echo "$deployment_output"
        return 1
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
print_status "=== UPDATE CONFIGURATION ==="
print_status "Networks: ${NETWORKS[*]}"
print_status "Verify: $VERIFY"
print_status "Broadcast: $BROADCAST"
print_status "Deployer: $(cast wallet address --private-key $DEPLOYER_PRIVATE_KEY)"
print_status "================================"

# Update implementations on all specified networks
failed_networks=()

for network in "${NETWORKS[@]}"; do
    print_status "=== Updating $network ==="
    
    # Get Factory address
    if ! factory_addr=$(get_factory_address "$network"); then
        failed_networks+=("$network")
        continue
    fi
    
    # Get RPC URL and Chain ID for this network
    network_rpc_url=$(get_rpc_url "$network")
    network_chain_id=$(get_chain_id "$network")
    
    # Deploy implementations to this network
    if deploy_implementations "$network" "$factory_addr" "$network_rpc_url" "$network_chain_id"; then
        print_success "Successfully updated $network"
    else
        print_error "Failed to update $network"
        failed_networks+=("$network")
    fi
    
    echo ""
done

# Report results
if [ ${#failed_networks[@]} -eq 0 ]; then
    print_success "All updates completed successfully!"
else
    print_error "Update failed for: ${failed_networks[*]}"
    exit 1
fi

print_success "HumanPass update process completed!"
print_success "================================"
print_success "CREATE2 ADDRESSES (Same across all chains):"
print_success "Verifier Impl Salt: $(cast keccak256 'HumanPassVerifierImpl')"
print_success "Verifier Proxy Salt: $(cast keccak256 'HumanPassVerifierProxy')"
print_success "================================"
