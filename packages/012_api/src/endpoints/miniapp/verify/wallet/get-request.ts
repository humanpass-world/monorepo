import { and, eq, walletVerifyRequest } from '@hp/database';
import { OpenAPIRoute } from 'chanfana';
import type { AppContext } from 'workers/types';
import z from 'zod';

export class MiniappVerifyWalletGetRequest extends OpenAPIRoute {
	schema = {
		tags: ['Miniapp / Verify'],
		summary: 'Get Wallet Verification Request',
		request: {
			query: z.object({
				requestId: z.string({ description: 'Request ID' }).nullable().optional(),
				code: z.string({ description: 'Verification Code' }).nullable().optional(),
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
							signal: z.string({ description: 'Signal' }),
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
		const { code, requestId } = data.query;

		if (!code && !requestId) {
			return c.json(
				{
					code: 'INVALID_REQUEST',
					error: 'Invalid request',
				},
				400
			);
		}

		if (code) {
			// check if request is valid
			const request = await c.get('db').query.walletVerifyRequest.findFirst({
				where: and(
					eq(walletVerifyRequest.code, code),
					// lte(walletVerifyRequest.expiredAt, new Date()),
					eq(walletVerifyRequest.isVerified, false)
				),
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
				signal: request.signal,
			});
		}

		if (requestId) {
			// check if request is valid
			const request = await c.get('db').query.walletVerifyRequest.findFirst({
				where: and(
					eq(walletVerifyRequest.id, requestId),
					// lte(walletVerifyRequest.expiredAt, new Date()),
					eq(walletVerifyRequest.isVerified, false)
				),
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
				signal: request.signal,
			});
		}
	}
}
