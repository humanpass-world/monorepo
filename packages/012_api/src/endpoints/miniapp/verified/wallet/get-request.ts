import { and, eq, walletVerifyRequest } from '@hp/database';
import { OpenAPIRoute } from 'chanfana';
import type { AppContext } from 'workers/types';
import z from 'zod';

export class MiniappVerifiedWalletGetRequest extends OpenAPIRoute {
	schema = {
		tags: ['Miniapp / Verified'],
		summary: 'Get Verified Wallet Request',
		request: {
			params: z.object({
				requestId: z.string({ description: 'Request ID' }),
			}),
		},
		responses: {
			'200': {
				description: 'Get Wallet Verification Request Response',
				content: {
					'application/json': {
						schema: z.object({
							requestId: z.string({ description: 'Request ID' }),
							chainId: z.string({ description: 'Chain ID' }),
							address: z.string({ description: 'Wallet Address' }),
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
		const { requestId } = data.params;

		// check if request is valid
		const request = await c.get('db').query.walletVerifyRequest.findFirst({
			where: and(eq(walletVerifyRequest.id, requestId)),
		});

		if (!request) {
			return c.json(
				{
					code: 'INVALID_REQUEST',
					error: 'Invalid request',
				},
				400
			);
		}

		return c.json({
			requestId: request.id,
			chainId: request.chain,
			address: request.address,
		});
	}
}
