import type { APIContext } from 'astro';
import { ITAD_API_BASE } from '../../../lib/oauth';

// Epic Games Store shop ID
const EPIC_SHOP_ID = 16;

interface SyncGame {
	shop: number;
	id: string;
	title: string;
}

export async function PUT(context: APIContext): Promise<Response> {
	const token = context.cookies.get('itad_token')?.value;
	const syncToken = context.cookies.get('itad_sync_token')?.value;

	if (!token) {
		return new Response(JSON.stringify({ error: 'Not authenticated' }), {
			status: 401,
			headers: { 'Content-Type': 'application/json' },
		});
	}

	if (!syncToken) {
		return new Response(JSON.stringify({ error: 'Sync not linked. Please link first.' }), {
			status: 401,
			headers: { 'Content-Type': 'application/json' },
		});
	}

	try {
		const body = await context.request.json();
		const games: Array<{ epicOfferId: string; title: string }> = body.games;

		if (!Array.isArray(games) || games.length === 0) {
			return new Response(JSON.stringify({ error: 'games array is required' }), {
				status: 400,
				headers: { 'Content-Type': 'application/json' },
			});
		}

		// Format games for ITAD sync endpoint
		const syncGames: SyncGame[] = games.map((game) => ({
			shop: EPIC_SHOP_ID,
			id: game.epicOfferId,
			title: game.title,
		}));

		const response = await fetch(`${ITAD_API_BASE}/profiles/sync/collection/v1`, {
			method: 'PUT',
			headers: {
				Authorization: `Bearer ${token}`,
				'ITAD-Profile': syncToken,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(syncGames),
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
