#!/bin/bash

# HumanPass Utility Functions
# 공통으로 사용되는 함수들을 모아놓은 유틸리티 스크립트

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to validate environment variables
validate_env() {
    if [ -z "$DEPLOYER_PRIVATE_KEY" ]; then
        print_error "DEPLOYER_PRIVATE_KEY environment variable is required"
        exit 1
    fi
}

# Function to get RPC URL for network
get_rpc_url() {
    local network=$1
    case $network in
        "ethereum")
            echo "https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}"
            ;;
        "arbitrum")
            echo "https://arb-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}"
            ;;
        "base")
            echo "https://base-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}"
            ;;
        "bnb")
            echo "https://bnb-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}"
            ;;
        "optimism")
            echo "https://opt-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}"
            ;;
        "polygon")
            echo "https://polygon-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}"
            ;;
        "avalanche")
            echo "https://avax-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}"
            ;;
        "gnosis")
            echo "https://gnosis-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}"
            ;;
        "fantom")
            echo "https://fantom-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}"
            ;;
        "zksync")
            echo "https://zksync-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}"
            ;;
        "worldchain")
            echo "https://worldchain-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}"
            ;;
        *)
            print_error "Unsupported network: $network"
            exit 1
            ;;
    esac
}

# Function to get chain ID for network
get_chain_id() {
    local network=$1
    case $network in
        "arbitrum")
            echo "42161"
            ;;
        "worldchain")
            echo "480"
            ;;
        "optimism")
            echo "10"
            ;;
        "base")
            echo "8453"
            ;;
        "bnb")
            echo "56"
            ;;
        "polygon")
            echo "137"
            ;;
        "avalanche")
            echo "43114"
            ;;
        "gnosis")
            echo "100"
            ;;
        "fantom")
            echo "250"
            ;;
        "zksync")
            echo "324"
            ;;
        "worldchain")
            echo "480"
            ;;
        *)
            print_error "Unsupported network: $network"
            exit 1
            ;;
    esac
}

# Function to extract contract addresses from deployment output
extract_contract_addresses() {
    local output="$1"
    
    # Extract addresses from the deployment output (CREATE2 version)
    # Support both patterns: "deployed at:" and ":"
    FACTORY_ADDR=$(echo "$output" | grep -E "(Factory Address:|HumanPassFactory deployed at:)" | head -1 | sed 's/.*: //')
    VERIFIER_IMPL_ADDR=$(echo "$output" | grep -E "(HumanPassVerifier \\(Impl\\):|HumanPassVerifier implementation:|HumanPassVerifier implementation deployed at:)" | head -1 | sed 's/.*: //')
    VERIFIER_PROXY_ADDR=$(echo "$output" | grep -E "(HumanPassVerifier \\(Proxy\\):|HumanPassVerifier proxy:|HumanPassVerifier proxy deployed at:)" | head -1 | sed 's/.*: //')
    
    # Export for use in verification
    export FACTORY_ADDR
    export VERIFIER_IMPL_ADDR
    export VERIFIER_PROXY_ADDR
}

# Function to automatically verify contracts
verify_contracts() {
    local network=$1
    local rpc_url=$2
    local chain_id=$3
    
    if [ "$VERIFY" = false ]; then
        print_status "Skipping verification (--verify not specified)"
        return 0
    fi
    
    print_status "Starting automatic contract verification..."
    
    # Check if ETHERSCAN_API_KEY is set
    if [ -z "$ETHERSCAN_API_KEY" ]; then
        print_warning "ETHERSCAN_API_KEY not set. Skipping verification."
        print_warning "To enable verification, set ETHERSCAN_API_KEY environment variable."
        return 0
    fi
    
    # Use extracted contract addresses
    if [ -z "$FACTORY_ADDR" ] || [ -z "$APP_IMPL_ADDR" ] || [ -z "$APP_PROXY_ADDR" ] || [ -z "$VERIFIER_IMPL_ADDR" ] || [ -z "$VERIFIER_PROXY_ADDR" ]; then
        print_error "Contract addresses not found. Cannot verify contracts."
        return 1
    fi
    
    # Get the deployer address for initialization data
    local deployer_addr=$(cast wallet address --private-key $DEPLOYER_PRIVATE_KEY)
    
    # Verify HumanPassFactory
    print_status "Verifying HumanPassFactory..."
    if forge verify-contract \
      --chain $chain_id \
      --etherscan-api-key $ETHERSCAN_API_KEY \
      "$FACTORY_ADDR" \
      src/HumanPassFactory.sol:HumanPassFactory ; then
        print_success "HumanPassFactory verified"
    else
        print_warning "HumanPassFactory verification failed"
        return 1
    fi
    
    
    # Verify HumanPassVerifier implementation
    print_status "Verifying HumanPassVerifier implementation..."
    if forge verify-contract \
      --chain $chain_id \
      --etherscan-api-key $ETHERSCAN_API_KEY \
      --constructor-args $(cast abi-encode "constructor()") \
      "$VERIFIER_IMPL_ADDR" \
      src/HumanPassVerifier.sol:HumanPassVerifier; then
        print_success "HumanPassVerifier implementation verified"
    else
        print_warning "HumanPassVerifier implementation verification failed"
        return 1
    fi
    
    
    # Verify HumanPassVerifier proxy
    print_status "Verifying HumanPassVerifier proxy..."
    local verifier_init_data=$(cast abi-encode "initialize(address,address)" $deployer_addr $deployer_addr)
    local verifier_proxy_args=$(cast abi-encode "constructor(address,bytes)" $VERIFIER_IMPL_ADDR $verifier_init_data)
    
    if forge verify-contract \
      --chain $chain_id \
      --etherscan-api-key $ETHERSCAN_API_KEY \
      --constructor-args $verifier_proxy_args \
      "$VERIFIER_PROXY_ADDR" \
      node_modules/@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol:ERC1967Proxy; then
        print_success "HumanPassVerifier proxy verified"
    else
        print_warning "HumanPassVerifier proxy verification failed"
        return 1
    fi
    
    print_success "Contract verification process completed!"
}

# Function to save Factory address for update.sh
save_factory_address() {
    local network=$1
    local factory_addr=$2
    
    # Create address directory if it doesn't exist
    mkdir -p dist/address
    
    # Save to fixed.json (same across all networks)
    local fixed_file="dist/address/fixed.json"
    if [ ! -f "$fixed_file" ]; then
        echo "{}" > "$fixed_file"
    fi
    
    if command -v jq >/dev/null 2>&1; then
        jq --arg addr "$factory_addr" '. + {"factory": $addr}' "$fixed_file" > "${fixed_file}.tmp" && mv "${fixed_file}.tmp" "$fixed_file"
    else
        if grep -q "factory" "$fixed_file"; then
            sed -i.bak "s/\"factory\":[^,}]*/\"factory\": \"$factory_addr\"/" "$fixed_file"
        else
            sed -i.bak "s/}$/,\n  \"factory\": \"$factory_addr\"\n}/" "$fixed_file"
        fi
        rm -f "${fixed_file}.bak"
    fi
    
    print_success "Factory address saved to fixed.json: $factory_addr (same across all networks)"
}

# Function to load Factory address from JSON file
load_factory_address() {
    local network=$1
    local fixed_file="dist/address/fixed.json"
    
    if [ ! -f "$fixed_file" ]; then
        print_error "Factory addresses file not found: $fixed_file"
        return 1
    fi
    
    # Extract factory address (same across all networks)
    if command -v jq >/dev/null 2>&1; then
        local factory_addr=$(jq -r '.factory // empty' "$fixed_file")
    else
        # Fallback to grep/sed if jq is not available
        local factory_addr=$(grep "factory" "$fixed_file" | sed 's/.*": *"\([^"]*\)".*/\1/')
    fi
    
    if [ -z "$factory_addr" ] || [ "$factory_addr" = "null" ]; then
        print_error "Factory address not found in $fixed_file"
        return 1
    fi
    
    echo "$factory_addr"
}

# Function to save proxy addresses (same across all networks due to CREATE2)
save_proxy_addresses() {
    local app_proxy_addr=$1
    local verifier_proxy_addr=$2
    
    # Create addresses directory if it doesn't exist
    mkdir -p dist/address
    
    # Create or update fixed.json with proxy addresses
    local fixed_file="dist/address/fixed.json"
    if [ ! -f "$fixed_file" ]; then
        echo "{}" > "$fixed_file"
    fi
    
    # Update fixed.json with proxy addresses
    if command -v jq >/dev/null 2>&1; then
        jq --arg app "$app_proxy_addr" --arg verifier "$verifier_proxy_addr" '. + {
            "application": $app,
            "verifier": $verifier
        }' "$fixed_file" > "${fixed_file}.tmp" && mv "${fixed_file}.tmp" "$fixed_file"
    else
        # Fallback to sed if jq is not available
        if grep -q "application" "$fixed_file"; then
            sed -i.bak "s/\"application\":[^,}]*/\"application\": \"$app_proxy_addr\"/" "$fixed_file"
        else
            sed -i.bak "s/}$/,\n  \"application\": \"$app_proxy_addr\"\n}/" "$fixed_file"
        fi
        
        if grep -q "verifier" "$fixed_file"; then
            sed -i.bak "s/\"verifier\":[^,}]*/\"verifier\": \"$verifier_proxy_addr\"/" "$fixed_file"
        else
            sed -i.bak "s/}$/,\n  \"verifier\": \"$verifier_proxy_addr\"\n}/" "$fixed_file"
        fi
        rm -f "${fixed_file}.bak"
    fi
    
    print_success "Proxy addresses saved to $fixed_file: app: $app_proxy_addr, verifier: $verifier_proxy_addr"
}

# Function to load proxy addresses from JSON file
load_proxy_addresses() {
    local fixed_file="dist/address/fixed.json"
    
    if [ ! -f "$fixed_file" ]; then
        print_error "Proxy addresses file not found: $fixed_file"
        return 1
    fi
    
    # Extract proxy addresses (same across all networks)
    if command -v jq >/dev/null 2>&1; then
        local verifier_addr=$(jq -r '.verifier // empty' "$fixed_file")
    else
        # Fallback to grep/sed if jq is not available
        local verifier_addr=$(grep "verifier" "$fixed_file" | sed 's/.*": *"\([^"]*\)".*/\1/')
    fi
    
    if [ -z "$verifier_addr" ] || [ "$verifier_addr" = "null" ]; then
        print_error "Proxy addresses not found in $fixed_file"
        return 1
    fi
    
    echo "$verifier_addr"
}

# Function to print CREATE2 addresses summary
print_create2_summary() {
    print_success "CREATE2 ADDRESSES (Same across all chains):"
    print_success "Verifier Proxy Salt: $(cast keccak256 'HumanPassVerifierProxy')"
    print_success "================================"
    print_success "Note: Implementation addresses are different per chain (normal deployment)"
    print_success "Only Proxy addresses are deterministic using CREATE2"
}
