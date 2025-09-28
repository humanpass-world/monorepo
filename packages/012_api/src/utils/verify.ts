import { getContractAddress } from '@hp/evm-contracts';
import { env } from 'cloudflare:workers';
import { Bytes, Hash, Hex } from 'ox';
import { keccak256, sha256 } from 'ox/Hash';
import { privateKeyToAccount } from 'viem/accounts';

export interface HashFunctionOutput {
	hash: bigint;
	digest: `0x${string}`;
}

function hashEncodedBytes(input: Hex.Hex | Bytes.Bytes): HashFunctionOutput {
	const hash = BigInt(Hash.keccak256(input, { as: 'Hex' })) >> 8n;
	const rawDigest = hash.toString(16);

	return { hash, digest: `0x${rawDigest.padStart(64, '0')}` };
}

function hashString(input: string): HashFunctionOutput {
	const bytesInput = Buffer.from(input);

	return hashEncodedBytes(bytesInput);
}

export function hashToField(input: Bytes.Bytes | string): HashFunctionOutput {
	if (Bytes.validate(input) || Hex.validate(input)) return hashEncodedBytes(input);

	return hashString(input);
}

export interface VerifyProofParams {
	nullifier_hash: string;
	merkle_root: string;
	proof: string;
	verification_level: string;
	action: string;
	signal_hash: string;
}

// Success response
export interface VerifyProofSuccessResponse {
	success: true;
	action: string;
	nullifier_hash: string;
	created_at: string;
}

// Error response types
export interface VerifyProofErrorResponse {
	success: false;
	code: string;
	detail: string;
	attribute: string | null;
}

// Specific error codes
export type VerifyProofErrorCode =
	| 'invalid_proof'
	| 'invalid_merkle_root'
	| 'invalid_credential_type'
	| 'exceeded_max_verifications'
	| 'already_verified';

// Union type for all possible responses
export type VerifyProofResponse = VerifyProofSuccessResponse | VerifyProofErrorResponse;

export async function verifyProof(params: VerifyProofParams): Promise<VerifyProofResponse> {
	const response = await fetch(`https://developer.worldcoin.org/api/v2/verify/${env.WORLD_APP_ID}`, {
		method: 'POST',
		headers: {
			'User-Agent': 'Cloudflare-Worker',
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(params),
	});

	const data = (await response.json()) as VerifyProofResponse;
	return data;
}

export type ServerSignatureParams = {
	chainId: string;
	account: `0x${string}`; // attest 대상 외부 체인 지갑
	nullifier_hash: `0x${string}`;
	merkle_root: `0x${string}`;
	proof_hash_keccak256: `0x${string}`;
	proof_hash_sha256: `0x${string}`;
	verification_level: 1 | 2; // 1=device, 2=orb
	action_hash: `0x${string}`;
	signal_hash: `0x${string}`;
	server_deadline: bigint; // 서버 보증 만료
	server_nonce: bigint; // 서버 서명 재사용 방지용
};

export async function createEIP712ServerSignature(params: ServerSignatureParams): Promise<string> {
	const domain = {
		name: 'HumanPassAttestation',
		version: '1',
		chainId: BigInt(params.chainId), // uint256
		verifyingContract: getContractAddress('verifier'),
	} as const;

	const types = {
		Attest: [
			{ name: 'account', type: 'address' },
			{ name: 'nullifier_hash', type: 'bytes32' },
			{ name: 'merkle_root', type: 'bytes32' },
			{ name: 'proof_hash_keccak256', type: 'bytes32' },
			{ name: 'proof_hash_sha256', type: 'bytes32' },
			{ name: 'verification_level', type: 'uint8' }, // 1=device, 2=orb
			{ name: 'action_hash', type: 'bytes32' },
			{ name: 'signal_hash', type: 'bytes32' },
			{ name: 'server_deadline', type: 'uint256' },
			{ name: 'server_nonce', type: 'uint256' },
		],
	} as const;

	const message = {
		account: params.account,
		nullifier_hash: params.nullifier_hash,
		merkle_root: params.merkle_root,
		proof_hash_keccak256: params.proof_hash_keccak256,
		proof_hash_sha256: params.proof_hash_sha256,
		verification_level: params.verification_level,
		action_hash: params.action_hash,
		signal_hash: params.signal_hash,
		server_deadline: params.server_deadline,
		server_nonce: params.server_nonce,
	} as const;

	const privateKey = env.SERVER_SIGNER_PRIVATE_KEY as `0x${string}`;
	const account = privateKeyToAccount(privateKey);

	const signature = await account.signTypedData({
		domain,
		types,
		primaryType: 'Attest',
		message,
	});

	return signature;
}

export function parseVerificationLevel(verification_level: string): 1 | 2 {
	switch (verification_level) {
		case 'device':
			return 1;
		case 'orb':
			return 2;
		default:
			throw new Error(`Invalid verification level: ${verification_level}`);
	}
}

export async function createServerSig(params: VerifyProofParams & { account: `0x${string}`; nonce: bigint; chainId: string }) {
	const serverParams: Omit<ServerSignatureParams, 'chainId'> = {
		account: params.account,
		nullifier_hash: params.nullifier_hash as `0x${string}`,
		merkle_root: params.merkle_root as `0x${string}`,
		proof_hash_keccak256: keccak256(Buffer.from(params.proof), { as: 'Hex' }) as `0x${string}`,
		proof_hash_sha256: sha256(Buffer.from(params.proof), { as: 'Hex' }) as `0x${string}`,
		verification_level: parseVerificationLevel(params.verification_level),
		action_hash: keccak256(Buffer.from(params.action), { as: 'Hex' }) as `0x${string}`,
		signal_hash: params.signal_hash as `0x${string}`,
		server_deadline: BigInt(Math.floor(Date.now() / 1000) + 3600 * 3), // 3 hour from now
		server_nonce: params.nonce,
	};

	console.log('serverParams', serverParams);

	return {
		signature: await createEIP712ServerSignature({ ...serverParams, chainId: params.chainId }),
		serverParams,
	};
}
