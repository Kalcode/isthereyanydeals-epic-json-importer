import type { APIContext } from 'astro';
import { exchangeCodeForTokens, getTokenCookieOptions } from '../../../lib/oauth';

export async function GET(context: APIContext): Promise<Response> {
	const url = new URL(context.request.url);
	const code = url.searchParams.get('code');
	const state = url.searchParams.get('state');
	const error = url.searchParams.get('error');

	// Handle OAuth errors
	if (error) {
		const errorDescription = url.searchParams.get('error_description') || 'Unknown error';
		return context.redirect(`/?error=${encodeURIComponent(errorDescription)}`);
	}

	// Validate required parameters
	if (!code || !state) {
		return context.redirect('/?error=Missing%20authorization%20code%20or%20state');
	}

	// Validate state matches cookie
	const storedState = context.cookies.get('oauth_state')?.value;
	if (!storedState || storedState !== state) {
		return context.redirect('/?error=Invalid%20state%20parameter');
	}

	// Get code verifier from cookie
	const codeVerifier = context.cookies.get('oauth_verifier')?.value;
	if (!codeVerifier) {
		return context.redirect('/?error=Missing%20code%20verifier');
	}

	// Get OAuth credentials
	const clientId = context.locals.runtime?.env?.ITAD_CLIENT_ID || import.meta.env.ITAD_CLIENT_ID;
	const clientSecret =
		context.locals.runtime?.env?.ITAD_CLIENT_SECRET || import.meta.env.ITAD_CLIENT_SECRET;

	if (!clientId || !clientSecret) {
		return context.redirect('/?error=OAuth%20not%20configured');
	}

	// Build redirect URI
	const redirectUri = `${url.origin}/api/auth/callback`;

	try {
		// Exchange code for tokens
		const tokens = await exchangeCodeForTokens({
			code,
			codeVerifier,
			clientId,
			clientSecret,
			redirectUri,
		});

		// Clear OAuth state cookies
		context.cookies.delete('oauth_state', { path: '/' });
		context.cookies.delete('oauth_verifier', { path: '/' });

		// Store access token in secure cookie
		const isProduction = import.meta.env.PROD;
		const tokenCookieOptions = getTokenCookieOptions(isProduction, tokens.expires_in);

		context.cookies.set('itad_token', tokens.access_token, tokenCookieOptions);

		// Redirect to home page
		return context.redirect('/');
	} catch (err) {
		console.error('Token exchange error:', err);
		const message = err instanceof Error ? err.message : 'Token exchange failed';
		return context.redirect(`/?error=${encodeURIComponent(message)}`);
	}
}
