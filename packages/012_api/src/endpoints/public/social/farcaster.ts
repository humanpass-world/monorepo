import { OpenAPIRoute } from 'chanfana';
import type { AppContext } from 'workers/types';
import { z } from 'zod';

export class PublicSocialCheckFarcaster extends OpenAPIRoute {
	schema = {
		tags: ['Public / Social'],
		summary: 'Check Farcaster account',
		description: 'Check if Farcaster account is verified as human by username',
		security: [{ cookie: [] }],
		request: {
			query: z.object({
				username: z.string({ description: 'Farcaster username (@username or username)' }),
			}),
		},
		responses: {
			'200': {
				description: 'Check Farcaster account result',
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

		return {
			verified: false,
		};
	}
}
