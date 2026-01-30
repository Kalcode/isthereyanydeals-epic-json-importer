import type { APIContext } from 'astro';
import { ITAD_API_BASE } from '../../../lib/oauth';

export async function GET(context: APIContext): Promise<Response> {
	const token = context.cookies.get('itad_token')?.value;

	if (!token) {
		return new Response(JSON.stringify({ error: 'Not authenticated' }), {
			status: 401,
			headers: { 'Content-Type': 'application/json' },
		});
	}

	try {
		const response = await fetch(`${ITAD_API_BASE}/collection/games/v1`, {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		});

		if (!response.ok) {
			const error = await response.text();
			return new Response(JSON.stringify({ error: `ITAD API error: ${error}` }), {
				status: response.status,
				headers: { 'Content-Type': 'application/json' },
			});
		}

		const data = await response.json();
		return new Response(JSON.stringify(data), {
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

export async function PUT(context: APIContext): Promise<Response> {
	const token = context.cookies.get('itad_token')?.value;

	if (!token) {
		return new Response(JSON.stringify({ error: 'Not authenticated' }), {
			status: 401,
			headers: { 'Content-Type': 'application/json' },
		});
	}

	try {
		const body = await context.request.json();
		const gameIds: string[] = body.games;

		if (!Array.isArray(gameIds) || gameIds.length === 0) {
			return new Response(JSON.stringify({ error: 'games array is required' }), {
				status: 400,
				headers: { 'Content-Type': 'application/json' },
			});
		}

		// ITAD API only accepts array of game ID strings
		const response = await fetch(`${ITAD_API_BASE}/collection/games/v1`, {
			method: 'PUT',
			headers: {
				Authorization: `Bearer ${token}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(gameIds),
		});

		if (!response.ok) {
			const error = await response.text();
			return new Response(JSON.stringify({ error: `ITAD API error: ${error}` }), {
				status: response.status,
				headers: { 'Content-Type': 'application/json' },
			});
		}

		// PUT returns 204 No Content on success
		if (response.status === 204) {
			return new Response(JSON.stringify({ success: true }), {
				headers: { 'Content-Type': 'application/json' },
			});
		}

		const data = await response.json();
		return new Response(JSON.stringify(data), {
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
