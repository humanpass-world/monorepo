import { env } from 'cloudflare:workers';

export const getPublicUrl = (path?: string | null) => {
	return path ? `${env.UPLOAD_BUCKET_URL}/${path}` : null;
};
