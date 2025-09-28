import { eq, verifiedSocialAccounts } from '@hp/database';
import { OpenAPIRoute } from 'chanfana';
import type { AppContext } from 'workers/types';
import z from 'zod';

export class MiniappVerifySocialXProof extends OpenAPIRoute {
	schema = {
		tags: ['Miniapp / Verify'],
		summary: 'Verify Social X Account Proof',
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
				description: 'Verify Social X Account Proof Result',
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

		// // cloud verify
		// const response = await verifyProof({
		// 	nullifier_hash: nullifier_hash,
		// 	merkle_root: merkle_root,
		// 	proof: proof,
		// 	verification_level: verification_level,
		// 	action: 'verify-ownership',
		// 	signal_hash: hashToField(`${userId}/x/${id}`).digest,
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

		await c
			.get('db')
			.update(verifiedSocialAccounts)
			.set({
				merkle_root: merkle_root,
				nullifier_hash: nullifier_hash,
				proof: proof,
				verification_level: verification_level,
				// serverSig:
			})
			.where(eq(verifiedSocialAccounts.id, id));

		return c.json({
			success: true,
		});
	}
}
