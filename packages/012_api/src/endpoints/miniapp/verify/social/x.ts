import { OpenAPIRoute } from 'chanfana';
import { env } from 'cloudflare:workers';
import type { AppContext } from 'workers/types';

export class MiniappVerifySocialX extends OpenAPIRoute {
	schema = {
		tags: ['Miniapp / Verify'],
		summary: 'Verify Social X Account',
		security: [{ cookie: [] }],
		responses: {
			'302': {
				description: 'Redirect to X OAuth',
			},
		},
	};

	async handle(c: AppContext) {
		const address = c.get('userId');

		const url = new URL('https://x.com/i/oauth2/authorize');
		url.searchParams.set('response_type', 'code');
		url.searchParams.set('client_id', env.X_CLIENT_ID);
		url.searchParams.set('redirect_uri', `${env.X_REDIRECT_URI}?address=${address}`);
		url.searchParams.set('scope', 'tweet.read users.read offline.access');
		url.searchParams.set('state', 'state');
		url.searchParams.set('code_challenge', 'challenge');
		url.searchParams.set('code_challenge_method', 'plain');

		return c.redirect(url.toString(), 302);
	}
}
