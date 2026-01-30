import type { APIContext } from 'astro';
import { ITAD_API_BASE } from '../../../lib/oauth';

// Consistent account ID for this app - idempotent linking
const SYNC_ACCOUNT_ID = 'epicgameimporterjson2026';
const SYNC_ACCOUNT_NAME = 'Epic Games JSON Importer';

export async function PUT(context: APIContext): Promise<Response> {
	const token = context.cookies.get('itad_token')?.value;

	if (!token) {
		return new Response(JSON.stringify({ error: 'Not authenticated' }), {
			status: 401,
			headers: { 'Content-Type': 'application/json' },
		});
	}

	try {
		// Link profile for sync - idempotent, can be called multiple times
		const response = await fetch(`${ITAD_API_BASE}/profiles/link/v1`, {
			method: 'PUT',
			headers: {
				Authorization: `Bearer ${token}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				accountId: SYNC_ACCOUNT_ID,
				accountName: SYNC_ACCOUNT_NAME,
			}),
		});

		if (!response.ok) {
			const error = await response.text();
			return new Response(JSON.stringify({ error: `ITAD API error: ${error}` }), {
				status: response.status,
				headers: { 'Content-Type': 'application/json' },
			});
		}

		const data = await response.json();

		// Store the sync token in a cookie for later use
		const isProduction = import.meta.env.PROD;
		context.cookies.set('itad_sync_token', data.token, {
			httpOnly: true,
			secure: isProduction,
			sameSite: 'lax',
			path: '/',
			maxAge: 60 * 60 * 24, // 24 hours
		});

		return new Response(JSON.stringify({ success: true }), {
			headers: { 'Content-Type': 'application/json' },
		});
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Unknown error';
		return new Response(JSON.stringify({ error: message }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' },
		});
	}
}
