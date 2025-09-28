import { eq, walletVerifyRequest } from '@hp/database';
import { OpenAPIRoute } from 'chanfana';
import type { AppContext } from 'workers/types';
import { createServerSig } from 'workers/utils/verify';
import z from 'zod';

export class MiniappVerifyWalletProof extends OpenAPIRoute {
	schema = {
		tags: ['Miniapp / Verify'],
		summary: 'Verify Wallet Proof',
		security: [{ cookie: [] }],
		request: {
			body: {
				content: {
					'application/json': {
						schema: z.object({
							id: z.string(),
							merkle_root: z.string(),
							nullifier_hash: z.string(),
							proof: z.string(),
							verification_level: z.string(),
						}),
					},
				},
			},
		},
		responses: {
			'200': {
				description: 'Verify Wallet Proof Result',
				content: {
					'application/json': {
						schema: z.object({
							success: z.literal(true),
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
		const userId = c.get('userId');
		const { id, merkle_root, nullifier_hash, proof, verification_level } = data.body;

		if (!id || !merkle_root || !nullifier_hash || !proof || !verification_level) {
			return c.text('Invalid id or merkle_root or nullifier_hash or proof or verification_level', 400);
		}

		const request = await c.get('db').query.walletVerifyRequest.findFirst({
			where: eq(walletVerifyRequest.id, id),
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

		const account = request.address;

		// TODO cloud verify
		// const response = await verifyProof({
		// 	nullifier_hash: nullifier_hash,
		// 	merkle_root: merkle_root,
		// 	proof: proof,
		// 	verification_level: verification_level,
		// 	action: 'verify-ownership',
		// 	signal_hash: hashToField(request.signal).hash.toString(),
		// });

		// if (!response.success) {
		// 	return c.json(
		// 		{
		// 			success: false,
		// 			message: response.detail,
		// 		},
		// 		400
		// 	);
		// }

		const serverNonce = BigInt(Math.floor(Date.now() / 1000));

		const { signature, serverParams } = await createServerSig({
			nullifier_hash: nullifier_hash,
			merkle_root: merkle_root,
			proof: proof,
			verification_level: verification_level,
			action: 'verify-ownership',
			signal_hash: request.signal,
			chainId: request.chain,
			account: request.address as `0x${string}`,
			nonce: serverNonce,
		});

		await c
			.get('db')
			.update(walletVerifyRequest)
			.set({
				worldAddress: userId,
				merkle_root: merkle_root,
				nullifier_hash: nullifier_hash,
				proof: proof,
				verification_level: verification_level,
				serverNonce: serverNonce.toString(),
				serverDeadline: serverParams.server_deadline.toString(),
				serverSig: signature,
			})
			.where(eq(walletVerifyRequest.id, id));

		return c.json({
			success: true,
		});
	}
}
