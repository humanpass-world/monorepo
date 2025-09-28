import { verifiedSocialAccounts } from '@hp/database';
import { OpenAPIRoute } from 'chanfana';
import { env } from 'cloudflare:workers';
import { keccak256 } from 'ox/Hash';
import type { AppContext } from 'workers/types';
import z from 'zod';

export class MiniappVerifySocialXCallback extends OpenAPIRoute {
	schema = {
		tags: ['Miniapp / Verify'],
		summary: 'Verify Social X Account Callback',
		security: [{ cookie: [] }],
		request: {
			query: z.object({
				address: z.string(),
				code: z.string(),
				state: z.string(),
			}),
		},
		responses: {
			'302': {
				description: 'Redirect to MiniApp Verify Social screen',
			},
		},
	};

	async handle(c: AppContext) {
		const data = await this.getValidatedData<typeof this.schema>();
		const { address, code, state } = data.query;

		if (!code || !state || !address) {
			return c.text('Invalid code or state or address', 400);
		}

		const tokenRes = await fetch('https://api.x.com/2/oauth2/token', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				Authorization: `Basic ${Buffer.from(`${env.X_CLIENT_ID}:${env.X_CLIENT_SECRET}`).toString('base64')}`,
			},
			body: new URLSearchParams({
				code: code,
				grant_type: 'authorization_code',
				redirect_uri: `${env.X_REDIRECT_URI}?address=${address}`,
				code_verifier: 'challenge',
			}),
		});

		if (!tokenRes.ok) {
			const msg = await tokenRes.text();
			return c.text(`X /2/oauth2/token failed: ${msg}`, 500);
		}

		const tokens = (await tokenRes.json()) as {
			token_type: 'bearer';
			expires_in: number;
			access_token: string;
			refresh_token: string;
			scope: string;
		};

		const meRes = await fetch('https://api.x.com/2/users/me', {
			headers: {
				Authorization: `Bearer ${tokens.access_token}`,
			},
		});

		if (!meRes.ok) {
			const msg = await meRes.text();
			return c.text(`X /2/users/me failed: ${msg}`, 500);
		}

		const me = (await meRes.json()) as {
			data: {
				id: string;
				name: string;
				username: string;
			};
		};

		const verifiedSocialAccount = await c
			.get('db')
			.insert(verifiedSocialAccounts)
			.values({
				address: address,
				social: 'x',
				username: me.data.username,
				name: me.data.name,
				sub: me.data.id,
			})
			.onConflictDoUpdate({
				target: [verifiedSocialAccounts.address, verifiedSocialAccounts.social, verifiedSocialAccounts.sub],
				set: {
					username: me.data.username,
					name: me.data.name,
				},
			})
			.returning({
				id: verifiedSocialAccounts.id,
			})
			.then((res) => res.at(0)!);

		const { username, id } = me.data;

		const signal = keccak256(Buffer.from(`${address}/x/${id}`), { as: 'Hex' }).toString();

		return c.redirect(
			`${env.MINIAPP_URL}/verify-social-oauth-result?username=${username}&id=${verifiedSocialAccount.id}&signal=${signal}`,
			302
		);
	}
}
