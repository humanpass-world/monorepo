import { and, eq, isNotNull, verifiedSocialAccounts } from '@hp/database';
import { OpenAPIRoute } from 'chanfana';
import type { AppContext } from 'workers/types';
import { z } from 'zod';

export class PublicSocialCheckX extends OpenAPIRoute {
	schema = {
		tags: ['Public / Social'],
		summary: 'Check X account',
		description: 'Check if X account is verified as human by username',
		security: [{ cookie: [] }],
		request: {
			query: z.object({
				username: z.string({ description: 'X username (@username or username)' }),
			}),
		},
		responses: {
			'200': {
				description: 'Check X account result',
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
		const { username } = data.query;

		const verifiedSocial = await c.get('db').query.verifiedSocialAccounts.findFirst({
			where: and(eq(verifiedSocialAccounts.username, username.replace(/^@/g, '')), isNotNull(verifiedSocialAccounts.nullifier_hash)),
		});

		if (!verifiedSocial) {
			return {
				verified: false,
			};
		}

		return {
			verified: true,
			verifiedAt: verifiedSocial.created_at,
		};
	}
}
