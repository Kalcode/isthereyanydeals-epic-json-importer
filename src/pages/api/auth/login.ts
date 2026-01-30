import type { APIContext } from 'astro';
import { generateCodeVerifier, generateCodeChallenge, generateState } from '../../../lib/pkce';
import { buildAuthorizationUrl, getStateCookieOptions } from '../../../lib/oauth';

export async function GET(context: APIContext): Promise<Response> {
	const clientId = context.locals.runtime?.env?.ITAD_CLIENT_ID || import.meta.env.ITAD_CLIENT_ID;

	if (!clientId) {
		return new Response('ITAD_CLIENT_ID not configured', { status: 500 });
	}

	// Generate PKCE values
	const state = generateState();
	const codeVerifier = generateCodeVerifier();
	const codeChallenge = await generateCodeChallenge(codeVerifier);

	// Determine redirect URI based on request
	const url = new URL(context.request.url);
	const redirectUri = `${url.origin}/api/auth/callback`;

	// Build authorization URL
	const authUrl = buildAuthorizationUrl({
		clientId,
		redirectUri,
		state,
		codeChallenge,
	});

	// Store state and verifier in cookies
	const isProduction = import.meta.env.PROD;
	const cookieOptions = getStateCookieOptions(isProduction);

	context.cookies.set('oauth_state', state, cookieOptions);
	context.cookies.set('oauth_verifier', codeVerifier, cookieOptions);

	return context.redirect(authUrl);
}
