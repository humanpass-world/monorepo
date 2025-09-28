import { and, eq, walletVerifyRequest } from '@hp/database';
import { OpenAPIRoute } from 'chanfana';
import type { AppContext } from 'workers/types';
import { createServerSig } from 'workers/utils/verify';
import z from 'zod';

export class MiniappVerifyWalletPolling extends OpenAPIRoute {
	schema = {
		tags: ['Miniapp / Verify'],
		summary: 'Poll Wallet Verification Status',
		request: {
			query: z.object({
				requestId: z.string({ description: 'Request ID' }),
			}),
		},
		responses: {
			'200': {
				description: 'Verify Wallet Request Polling Response',
				content: {
					'application/json': {
						schema: z.object({
							done: z.boolean({ description: 'Done verification' }),
							serverPayload: z.object({
								account: z.string({ description: 'Account' }),
								nullifier_hash: z.string({ description: 'Nullifier Hash' }),
								merkle_root: z.string({ description: 'Merkle Root' }),
								proof_hash_keccak256: z.string({ description: 'Proof Hash Keccak256' }),
								proof_hash_sha256: z.string({ description: 'Proof Hash Sha256' }),
								verification_level: z.number({ description: 'Verification Level' }),
								action_hash: z.string({ description: 'Action Hash' }),
								signal_hash: z.string({ description: 'Signal Hash' }),
								server_deadline: z.string({ description: 'Server Deadline' }),
								server_nonce: z.string({ description: 'Server Nonce' }),
								server_sig: z.string({ description: 'Server Signature' }),
							}),
							chainId: z.string({ description: 'Chain ID' }),
						}),
					},
				},
			},
			'401': {
				description: 'Unauthorized - Authentication required',
				content: {
					'application/json': {
						schema: z.object({
							code: z.literal('UNAUTHORIZED'),
							error: z.string(),
						}),
					},
				},
			},
		},
	};

	async handle(c: AppContext) {
		const data = await this.getValidatedData<typeof this.schema>();
		const { requestId } = data.query;

		// check if application id is valid
		const request = await c.get('db').query.walletVerifyRequest.findFirst({
			where: and(eq(walletVerifyRequest.id, requestId)),
		});

		if (!request) {
			return c.json(
				{
					code: 'INVALID_REQUEST_ID',
					error: 'Invalid requestId',
				},
				400
			);
		}

		if (!request.proof) {
			return c.json(
				{
					done: false,
				},
				200
			);
		}

		const { serverParams } = await createServerSig({
			nullifier_hash: request.nullifier_hash!,
			merkle_root: request.merkle_root!,
			proof: request.proof,
			verification_level: request.verification_level!,
			action: 'verify-ownership',
			signal_hash: request.signal,
			chainId: request.chain,
			account: request.address as `0x${string}`,
			nonce: BigInt(request.serverNonce!),
		});

		return c.json({
			done: true,
			serverPayload: {
				...serverParams,
				server_deadline: request.serverDeadline,
				server_nonce: request.serverNonce,
				server_sig: request.serverSig,
			},
			chainId: request.chain,
		});
	}
}
