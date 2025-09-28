import { eq, users, walletVerifyRequest } from '@hp/database';
import { OpenAPIRoute } from 'chanfana';
import { env } from 'cloudflare:workers';
import { keccak256 } from 'ox/Hash';
import type { AppContext } from 'workers/types';
import z from 'zod';

export class MiniappVerifyWalletRequest extends OpenAPIRoute {
	schema = {
		tags: ['Miniapp / Verify'],
		summary: 'Request Wallet Verification',
		request: {
			body: {
				content: {
					'application/json': {
						schema: z.object({
							address: z.string({ description: 'Wallet Address to be verified' }),
							worldUsername: z.string({ description: 'Can be empty if not provided' }).optional(),
							chainId: z.string({ description: "EIP-155 Chain ID or 'solana'" }),
						}),
					},
				},
			},
		},
		responses: {
			'200': {
				description: 'Verify Wallet Request Response',
				content: {
					'application/json': {
						schema: z.object({
							requestId: z.string({ description: 'Request ID' }),
							code: z.string({ description: 'Verification Code' }),
						}),
					},
				},
			},
			'400': {
				description: 'Invalid applicationId or chain',
				content: {
					'application/json': {
						schema: z.object({
							code: z.literal('INVALID_APPLICATION_ID_OR_CHAIN').or(z.literal('INVALID_WORLD_USERNAME')),
							error: z.string(),
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
		const { chainId, worldUsername, address } = data.body;

		let worldAddress: string | null = null;

		let sendNoti = false;

		if (worldUsername) {
			const response = await fetch(`https://usernames.worldcoin.org/api/v1/${worldUsername.replace('@', '')}`, {
				headers: {
					'User-Agent': 'Cloudflare-Worker',
				},
			});

			if (!response.ok) {
				console.log(await response.text());
				return c.json(
					{
						code: 'WORLD_USERNAME_NOT_FOUND',
						error: 'World username not found',
					},
					400
				);
			}

			const data = await response.json<{
				username: string;
				address: string;
				profile_picture_url: string;
				minimized_profile_picture_url: string;
			}>();

			worldAddress = data.address;

			// check if this address is our user
			const user = await c.get('db').query.users.findFirst({
				where: eq(users.address, data.address),
			});

			if (user) {
				sendNoti = true;
			} else {
				// not our user. redirect user to our miniapp
				return c.json(
					{
						code: 'USER_NOT_REGISTERED',
						error: 'User not registered',
					},
					400
				);
			}
		}

		const createdRequest = await c
			.get('db')
			.insert(walletVerifyRequest)
			.values({
				chain: chainId,
				worldUsername: worldUsername ? worldUsername.replace('@', '') : null,
				address,
				worldAddress,
				signal: keccak256(Buffer.from(`${worldAddress}${address}`), { as: 'Hex' }).toString(),
			})
			.returning({
				requestId: walletVerifyRequest.id,
				code: walletVerifyRequest.code,
			})
			.then((res) => res.at(0)!);

		if (sendNoti) {
			const response = await fetch('https://developer.worldcoin.org/api/v2/minikit/send-notification', {
				method: 'POST',
				headers: {
					'User-Agent': 'Cloudflare-Worker',
					Authorization: `Bearer api_a2V5X2UxZmY4YzYyNWNkYjBkNjAzNWQ3ZjExZDJjM2UyNTAwOnNrXzM1Nzg2YWI5NTIzMDYwYWM0OGI0OTcwNTIyMTQzNTE5NDBkZGZiY2NlYjNmYTQ5NQ`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					app_id: env.WORLD_APP_ID,
					wallet_addresses: [address],
					title: '🔐 HumanPass Verification',
					message: 'Hey ${username}, your HumanPass verification is ready!',
					mini_app_path: `worldapp://mini-app?app_id=${env.WORLD_APP_ID}&path=${encodeURIComponent(
						`/verify?requestId=${createdRequest.requestId}`
					)}`,
				}),
			});

			if (!response.ok) {
				console.log(await response.text());
			} else {
				console.log(await response.json());
			}
		}

		return c.json({
			requestId: createdRequest.requestId,
			code: createdRequest.code,
		});
	}
}
