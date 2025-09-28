import { and, eq, walletVerifyRequest } from '@hp/database';
import { getRedactedPublicAddress } from '@hp/server-common';
import { OpenAPIRoute } from 'chanfana';
import type { AppContext } from 'workers/types';
import { z } from 'zod';

export class MiniappVerifiedWalletList extends OpenAPIRoute {
	schema = {
		tags: ['Miniapp / Verified'],
		summary: 'Verified wallet list',
		security: [{ cookie: [] }],
		responses: {
			'200': {
				description: 'List of verified wallet',
				content: {
					'application/json': {
						schema: z.object({
							list: z
								.object({
									requestId: z.string({ description: 'Verified Wallet Request ID' }),
									address: z.string({ description: 'Verified Wallet Address' }),
									chains: z.array(z.string({ description: 'Chain' })),
								})
								.array(),
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
		const userId = c.get('userId');

		const verifiedWalletList = await c.get('db').query.walletVerifyRequest.findMany({
			where: and(eq(walletVerifyRequest.worldAddress, userId), eq(walletVerifyRequest.isVerified, false)),
		});

		const countedVerifiedWalletList = verifiedWalletList.reduce<
			{
				requestId: string;
				address: string;
				chains: string[];
			}[]
		>((acc, wallet) => {
			let index = acc.findIndex((item) => item.address === wallet.address);
			if (index === -1) {
				acc.push({
					requestId: wallet.id,
					address: wallet.address,
					chains: [wallet.chain],
				});
			} else {
				acc[index].chains.push(wallet.chain);
			}

			return acc;
		}, []);

		return {
			list: countedVerifiedWalletList.map((item) => ({
				requestId: item.requestId,
				address: getRedactedPublicAddress(item.address),
				chains: item.chains,
			})),
		};
	}
}
