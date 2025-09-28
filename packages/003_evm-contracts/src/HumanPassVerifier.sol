// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/cryptography/EIP712Upgradeable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/**
 * HumanPassVerifier (ServerSig + AccountSig, AA/Relayer-friendly)
 *
 * - ServerPayload: 서버가 World Proof를 Cloud Verify로 검증한 결과를 EIP-712로 서명한 패키지
 * - AccountEnvelope: 계정(EOA)이 server_sig까지 감싸서 EIP-712로 1회 서명(AA/Relayer 실행 가능)
 * - 저장 키는 "dApp이 실제로 보게 될 계정(account)" 기준 (EOA 또는 AA)
 */
contract HumanPassVerifier is Initializable, OwnableUpgradeable, UUPSUpgradeable, EIP712Upgradeable {
    using ECDSA for bytes32;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() { _disableInitializers(); }

    function initialize(address initialOwner, address _serverSigner) public initializer {
        require(_serverSigner != address(0), "serverSigner required");
        __Ownable_init(initialOwner);
        __UUPSUpgradeable_init();
        __EIP712_init("HumanPassAttestation", "1"); // domain: name, version, verifyingContract

        serverSigner = _serverSigner;

        requiredLevelOf[AUTH_DEVICE] = 1;
        requiredLevelOf[AUTH_ORB]    = 2;
    }

    function _authorizeUpgrade(address newImpl) internal override onlyOwner {}

    // ===== Constants / Types =====
    bytes32 public constant AUTH_DEVICE = keccak256("device");
    bytes32 public constant AUTH_ORB    = keccak256("orb");

    address public serverSigner; // 서버 서명 검증용 고정 주소

    // 인증 타입 → 요구 레벨 (1=device, 2=orb)
    mapping(bytes32 => uint8) public requiredLevelOf;

    // appId → account(EOA or AA) → 상태
    struct AccountState {
        bytes32 nullifier_hash; // 고정
        uint8   level;          // 0=None / 1=device / 2=orb (상향만)
    }
    mapping(address => AccountState) public accountState;

    // 계정(EOA)별 nonce (AccountSig 재사용 방지)
    mapping(address => uint256) public nonces;

    // 서버 서명 재사용 방지 (서버 전역 nonce 1회성)
    mapping(uint256 => bool) public usedServerNonce;

    // EIP-712 typehash들
    // - 동적 타입(string/bytes)은 EIP-712 규약대로 keccak256(value)로 인코딩
    bytes32 private constant SERVER_ATTEST_TYPEHASH = keccak256(
        "ServerAttestation(address account,bytes32 nullifier_hash,bytes32 merkle_root,bytes32 proof_hash_keccak256,bytes32 proof_hash_sha256,uint8 verification_level,bytes32 action_hash,bytes32 signal_hash,uint256 server_deadline,uint256 server_nonce)"
    );
    bytes32 private constant ACCOUNT_CONSENT_TYPEHASH = keccak256(
        "AccountConsent(address account,bytes server_sig,uint256 account_deadline,uint256 account_nonce)"
    );

    // ===== Events =====
    event Attested(address indexed account, bytes32 nullifier_hash, uint8 level);
    event ServerSignerUpdated(address indexed prev, address indexed next);

    // ===== Admin =====
    function setRequiredLevel(bytes32 authType, uint8 level) external onlyOwner {
        require(level == 1 || level == 2, "level=1|2");
        requiredLevelOf[authType] = level;
    }


    function setServerSigner(address next) external onlyOwner {
        require(next != address(0), "zero");
        emit ServerSignerUpdated(serverSigner, next);
        serverSigner = next;
    }

    // ===== View: dApp 검증 API =====
    /// @notice dApp 컨트랙트 전용: 요구 레벨 통과 시 nullifier_hash(hex) 반환
    function verify(address account, bytes32 authType) external view returns (string memory nullifierHashHex) {
        AccountState memory s = accountState[account];
        require(s.nullifier_hash != bytes32(0), "not attested");

        uint8 need = requiredLevelOf[authType];
        require(need != 0, "unknown authType");
        require(s.level >= need, "insufficient level");

        nullifierHashHex = _toHex(s.nullifier_hash);
    }

    /// @notice 가스 절약 버전(bytes32 반환)
    function verifyBytes32(address account, bytes32 authType) external view returns (bytes32) {
        AccountState memory s = accountState[account];
        require(s.nullifier_hash != bytes32(0), "not attested");

        uint8 need = requiredLevelOf[authType];
        require(need != 0, "unknown authType");
        require(s.level >= need, "insufficient level");

        return s.nullifier_hash;
    }

    // ===== Structs (ABI 인자) =====
    struct ServerPayload {
        address account;
        bytes32 app_id;
        bytes32 nullifier_hash;
        bytes32 merkle_root;
        bytes32 proof_hash_keccak256;
        bytes32 proof_hash_sha256;
        uint8   verification_level; // 1=device, 2=orb
        bytes32 action_hash;
        bytes32 signal_hash;
        uint256 server_deadline;
        uint256 server_nonce; // 체인별 nonce 별도 관리
        bytes   server_sig; // EIP-712 서명 (65 bytes)
    }

    struct AccountEnvelope {
        address account;
        bytes32 app_id;
        bytes   server_sig;         // sp.server_sig 그대로
        uint256 account_deadline;
        uint256 account_nonce;
        bytes   account_sig;        // 계정(EOA)의 EIP-712 서명 (65 bytes)
    }

    // ===== attest (ServerSig + AccountSig) =====
    function attest(ServerPayload calldata sp, AccountEnvelope calldata ae) external {
        // --- 기본 일치성 ---
        require(sp.account == ae.account, "account mismatch");

        // Note: app_id validation removed - caller should validate app_id
        require(block.timestamp <= sp.server_deadline,  "serverSig expired");
        require(block.timestamp <= ae.account_deadline, "accountSig expired");

        // --- (1) AccountSig 검증 ---
        // account 서명은 server_sig(바이트)를 포함해 동의했음을 증명
        bytes32 accountStructHash = keccak256(
            abi.encode(
                ACCOUNT_CONSENT_TYPEHASH,
                ae.account,
                keccak256(ae.server_sig), // bytes → keccak256
                ae.account_deadline,
                ae.account_nonce
            )
        );
        bytes32 accountDigest = _hashTypedDataV4(accountStructHash);
        address signer = ECDSA.recover(accountDigest, ae.account_sig);
        require(signer != address(0), "bad accountSig");

        // 유저 nonce: 1회성 보장
        require(ae.account_nonce == nonces[signer], "bad account nonce");
        nonces[signer] = ae.account_nonce + 1;

        // --- (2) ServerSig 검증 ---
        // server_sig 일치 및 서버 서명자 확인
        require(keccak256(sp.server_sig) == keccak256(ae.server_sig), "server_sig mismatch");

        bytes32 serverStructHash = keccak256(
            abi.encode(
                SERVER_ATTEST_TYPEHASH,
                sp.account,
                sp.nullifier_hash,
                sp.merkle_root,
                sp.proof_hash_keccak256,
                sp.proof_hash_sha256,
                sp.verification_level,
                sp.action_hash,
                sp.signal_hash,
                sp.server_deadline,
                sp.server_nonce
            )
        );
        bytes32 serverDigest = _hashTypedDataV4(serverStructHash);
        address sSigner = ECDSA.recover(serverDigest, sp.server_sig);
        require(sSigner == serverSigner, "bad serverSig");

        // 서버 nonce 재사용 방지
        require(!usedServerNonce[sp.server_nonce], "server nonce used");
        usedServerNonce[sp.server_nonce] = true;

        // --- (3) 상태 갱신: nullifier 고정, level 상향만 ---
        require(sp.verification_level == 1 || sp.verification_level == 2, "bad level");
        AccountState storage s0 = accountState[sp.account];
        if (s0.nullifier_hash == bytes32(0)) {
            s0.nullifier_hash = sp.nullifier_hash;
            s0.level = sp.verification_level;
        } else {
            require(s0.nullifier_hash == sp.nullifier_hash, "nullifier mismatch");
            if (sp.verification_level > s0.level) s0.level = sp.verification_level;
        }

        emit Attested(sp.account, s0.nullifier_hash, s0.level);
    }

    // ===== Helpers =====

    // bytes32 → hex 문자열 (소문자, 64자)
    function _toHex(bytes32 data) internal pure returns (string memory) {
        bytes16 HEX = 0x30313233343536373839616263646566; // "0123456789abcdef"
        bytes memory out = new bytes(64);
        for (uint i = 0; i < 32; i++) {
            out[2*i]   = bytes1(HEX[uint8(data[i] >> 4)]);
            out[2*i+1] = bytes1(HEX[uint8(data[i] & 0x0f)]);
        }
        return string(out);
    }

    // UUPS storage gap
    uint256[50] private __gap;
}