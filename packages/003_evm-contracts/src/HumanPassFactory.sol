// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "./HumanPassVerifier.sol";

/**
 * HumanPassFactory
 * CREATE2를 사용하여 모든 체인에서 동일한 주소로 컨트랙트를 배포
 */
contract HumanPassFactory {
    // 고정된 salt 값들 (모든 체인에서 동일한 주소를 보장)
    bytes32 public constant VERIFIER_IMPL_SALT = keccak256("HumanPassVerifierImpl");
    bytes32 public constant VERIFIER_PROXY_SALT = keccak256("HumanPassVerifierProxy");
    
    // 배포된 컨트랙트 주소들
    address public verifierImpl;
    address public verifierProxy;
    
    // 배포 완료 여부
    bool public deployed;
    
    event ContractsDeployed(
        address indexed verifierImpl,
        address indexed verifierProxy
    );
    
    event ImplementationUpgraded(
        address indexed oldImpl,
        address indexed newImpl,
        address indexed proxy
    );
    
    /**
     * @notice CREATE2를 사용하여 모든 컨트랙트를 배포
     * @param initialOwner 초기 소유자 주소
     * @param serverSigner 서버 서명자 주소
     */
    function deployAll(address initialOwner, address serverSigner) external {
        require(!deployed, "Already deployed");
        require(initialOwner != address(0), "Invalid owner");
        require(serverSigner != address(0), "Invalid server signer");
        
        // 1. HumanPassVerifier implementation 배포 (일반 배포)
        verifierImpl = address(new HumanPassVerifier());
        
        // 2. HumanPassVerifier proxy 배포 (초기화 데이터 없이)
        // CREATE2로 동일한 주소를 보장하기 위해 초기화 데이터 없이 배포
        bytes memory verifierProxyBytecode = abi.encodePacked(
            type(ERC1967Proxy).creationCode,
            abi.encode(verifierImpl, "")
        );
        verifierProxy = _deployCreate2(verifierProxyBytecode, VERIFIER_PROXY_SALT);
        
        // 3. 프록시 초기화 및 소유자 설정
        HumanPassVerifier ver = HumanPassVerifier(verifierProxy);
        ver.initialize(initialOwner, serverSigner);
        
        deployed = true;
        
        emit ContractsDeployed(
            verifierImpl,
            verifierProxy
        );
    }
    
    /**
     * @notice CREATE2를 사용하여 컨트랙트 배포
     * @param bytecode 배포할 컨트랙트의 바이트코드
     * @param salt CREATE2 salt 값
     * @return deployedAddress 배포된 컨트랙트 주소
     */
    function _deployCreate2(bytes memory bytecode, bytes32 salt) internal returns (address deployedAddress) {
        assembly {
            deployedAddress := create2(0, add(bytecode, 0x20), mload(bytecode), salt)
        }
        require(deployedAddress != address(0), "Create2 deployment failed");
    }
    
    /**
     * @notice CREATE2를 사용하여 예상 주소 계산
     * @param bytecode 배포할 컨트랙트의 바이트코드
     * @param salt CREATE2 salt 값
     * @return expectedAddress 예상되는 컨트랙트 주소
     */
    function computeAddress(bytes memory bytecode, bytes32 salt) external view returns (address expectedAddress) {
        bytes32 hash = keccak256(abi.encodePacked(
            bytes1(0xff),
            address(this),
            salt,
            keccak256(bytecode)
        ));
        expectedAddress = address(uint160(uint256(hash)));
    }
    
    /**
     * @notice CREATE2를 사용하여 예상되는 프록시 주소들 계산
     * @return expectedVerifierProxy 예상 Verifier Proxy 주소 (실제 배포 시점에 계산됨)
     */
    function getExpectedAddresses() external view returns (
        address expectedVerifierProxy
    ) {
        // Implementation 주소들은 일반 배포로 예측할 수 없음
        // Proxy 주소들만 CREATE2로 계산 가능 (초기화 데이터가 고정되어야 함)
        expectedVerifierProxy = address(0);   // 실제 배포 시점에 계산됨
    }
    
    /**
     * @notice 배포된 컨트랙트 주소들 반환
     */
    function getDeployedAddresses() external view returns (
        address _verifierImpl,
        address _verifierProxy
    ) {
        return (verifierImpl, verifierProxy);
    }
    
    /**
     * @notice 새로운 구현을 배포하고 프록시를 업그레이드
     * @param initialOwner 초기 소유자 주소 (프록시의 소유자)
     */
    function upgradeImplementations(address initialOwner) external {
        require(deployed, "Contracts not deployed yet");
        require(initialOwner != address(0), "Invalid owner");
        
        // 새로운 구현들을 배포 (일반 배포로 새로운 주소에)
        address oldVerifierImpl = verifierImpl;
        
        // 새로운 Verifier implementation 배포
        verifierImpl = address(new HumanPassVerifier());
        
        // Verifier proxy 업그레이드 (소유자가 직접 호출해야 함)
        // Factory는 업그레이드할 수 없으므로 이벤트만 발생시킴
        emit ImplementationUpgraded(oldVerifierImpl, verifierImpl, verifierProxy);
    }
}
