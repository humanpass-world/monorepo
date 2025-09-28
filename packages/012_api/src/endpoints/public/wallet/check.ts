import { and, eq, walletVerifyRequest } from '@hp/database';
import { OpenAPIRoute } from 'chanfana';
import type { AppContext } from 'workers/types';
import { z } from 'zod';

export class PublicWalletCheck extends OpenAPIRoute {
	schema = {
		tags: ['Public / Wallet'],
		summary: 'Check wallet',
		description: 'Check if wallet is verified as human by address.<br/> Currently supporting Base, Arbitrum, Optimism, Worldchain',
		security: [{ cookie: [] }],
		request: {
			query: z.object({
				address: z.string({ description: 'Wallet address (0x...)' }),
			}),
		},
		responses: {
			'200': {
				description: 'Check wallet result',
				content: {
					'application/json': {
						schema: z.discriminatedUnion('verified', [
							z.object({
								verified: z.literal(true),
								verifiedAt: z.date({ description: 'Verified At' }),
							}),
							z.object({
								verified: z.literal(false),
							}),
						]),
					},
				},
			},
		},
	};

	async handle(c: AppContext) {
		const data = await this.getValidatedData<typeof this.schema>();
		const { address } = data.query;

		const verifiedWallet = await c.get('db').query.walletVerifyRequest.findFirst({
			where: and(eq(walletVerifyRequest.address, address)),
		});

		if (!verifiedWallet) {
			return {
				verified: false,
			};
		}

		return {
			verified: true,
			verifiedAt: verifiedWallet.createdAt,
		};
	}
}
