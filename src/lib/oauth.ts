/**
 * ITAD OAuth configuration and helpers
 */

export const ITAD_AUTH_URL = 'https://isthereanydeal.com/oauth/authorize/';
export const ITAD_TOKEN_URL = 'https://isthereanydeal.com/oauth/token/';
export const ITAD_API_BASE = 'https://api.isthereanydeal.com';

export const OAUTH_SCOPES = ['coll_read', 'coll_write'];

export interface TokenResponse {
	access_token: string;
	token_type: string;
	expires_in: number;
	refresh_token?: string;
	scope: string;
}

/**
 * Cookie configuration for OAuth state
 */
export function getStateCookieOptions(isProduction: boolean) {
	return {
		httpOnly: true,
		secure: isProduction,
		sameSite: 'lax' as const,
		path: '/',
		maxAge: 60 * 10, // 10 minutes
	};
}

/**
 * Cookie configuration for access token
 */
export function getTokenCookieOptions(isProduction: boolean, maxAge: number) {
	return {
		httpOnly: true,
		secure: isProduction,
		sameSite: 'lax' as const,
		path: '/',
		maxAge,
	};
}

/**
 * Build authorization URL with PKCE
 */
export function buildAuthorizationUrl(params: {
	clientId: string;
	redirectUri: string;
	state: string;
	codeChallenge: string;
}): string {
	const url = new URL(ITAD_AUTH_URL);
	url.searchParams.set('client_id', params.clientId);
	url.searchParams.set('redirect_uri', params.redirectUri);
	url.searchParams.set('response_type', 'code');
	url.searchParams.set('scope', OAUTH_SCOPES.join(' '));
	url.searchParams.set('state', params.state);
	url.searchParams.set('code_challenge', params.codeChallenge);
	url.searchParams.set('code_challenge_method', 'S256');
	return url.toString();
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForTokens(params: {
	code: string;
	codeVerifier: string;
	clientId: string;
	clientSecret: string;
	redirectUri: string;
}): Promise<TokenResponse> {
	const body = new URLSearchParams({
		grant_type: 'authorization_code',
		code: params.code,
		redirect_uri: params.redirectUri,
		client_id: params.clientId,
		client_secret: params.clientSecret,
		code_verifier: params.codeVerifier,
	});

	const response = await fetch(ITAD_TOKEN_URL, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
		},
		body: body.toString(),
	});

	if (!response.ok) {
		const error = await response.text();
		throw new Error(`Token exchange failed: ${response.status} - ${error}`);
	}

	return response.json();
}
