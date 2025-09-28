import { OpenAPIRoute } from 'chanfana';
import type { AppContext } from 'workers/types';
import { z } from 'zod';

export class PublicSocialCheckTelegram extends OpenAPIRoute {
	schema = {
		tags: ['Public / Social'],
		summary: 'Check Telegram account',
		description: 'Check if Telegram account is verified as human by username',
		security: [{ cookie: [] }],
		request: {
			query: z.object({
				username: z.string({ description: 'Telegram username (@username or username)' }),
			}),
		},
		responses: {
			'200': {
				description: 'Check Telegram account result',
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
