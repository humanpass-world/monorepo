import { and, eq, walletVerifyRequest } from '@hp/database';
import { OpenAPIRoute } from 'chanfana';
import type { AppContext } from 'workers/types';
import { z } from 'zod';

export class MiniappVerifiedWalletDisconnect extends OpenAPIRoute {
	schema = {
		tags: ['Miniapp / Verified'],
		summary: 'Verified wallet disconnect',
		security: [{ cookie: [] }],
		request: {
			body: {
				content: {
					'application/json': {
						schema: z.object({
							requestId: z.string(),
						}),
					},
				},
			},
		},
		responses: {
			'200': {
				description: 'Verified wallet disconnect result',
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

		const { requestId } = data.body;

		await c
			.get('db')
			.delete(walletVerifyRequest)
			.where(and(eq(walletVerifyRequest.id, requestId), eq(walletVerifyRequest.worldAddress, userId)));

		// TODO queue 로 메세지 보내서 삭제 처리

		return {
			success: true,
		};
	}
}
