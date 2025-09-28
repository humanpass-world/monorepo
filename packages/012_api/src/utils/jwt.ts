import jwt from 'jsonwebtoken';
import { OAuthUserInfo } from './oauth';

export interface JWTPayload {
	sub: string;
	email: string;
	name: string;
	iat?: number;
	exp?: number;
}

export type PreauthorizedDataPayload = {
	iat?: number;
	exp?: number;
} & OAuthUserInfo;

export function generatePreauthorizedData(payload: Omit<PreauthorizedDataPayload, 'iat' | 'exp'>): string {
	return jwt.sign(payload, 'VERY_SECRET_KEY', {
		expiresIn: '1d', // 1일
	});
}

export function generateAccessToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
	return jwt.sign(payload, 'VERY_SECRET_KEY', {
		expiresIn: '1y', // 1년
	});
}

export function verifyAccessToken(token: string): JWTPayload {
	return jwt.verify(token, 'VERY_SECRET_KEY') as JWTPayload;
}

export function verifyPreauthorizedData(token: string): PreauthorizedDataPayload {
	return jwt.verify(token, 'VERY_SECRET_KEY') as PreauthorizedDataPayload;
}
