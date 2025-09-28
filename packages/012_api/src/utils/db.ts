import * as schema from '@hp/database';
import { drizzle } from '@hp/database';
import { env } from 'cloudflare:workers';

export function useDB() {
	return drizzle(env.HYPERDRIVE.connectionString, { schema });
}
