import type { APIContext } from 'astro';
import { ITAD_API_BASE } from '../../../lib/oauth';

// Epic Games Store shop ID in ITAD
const EPIC_SHOP_ID = 16;

export async function POST(context: APIContext): Promise<Response> {
	const apiKey = context.locals.runtime?.env?.ITAD_API_KEY || import.meta.env.ITAD_API_KEY;

	if (!apiKey) {
		return new Response(JSON.stringify({ error: 'API key not configured' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' },
		});
	}

	try {
		const body = await context.request.json();
		const offerIds: string[] = body.offerIds;

		if (!Array.isArray(offerIds) || offerIds.length === 0) {
			return new Response(JSON.stringify({ error: 'offerIds array is required' }), {
				status: 400,
				headers: { 'Content-Type': 'application/json' },
			});
		}

		// ITAD shop ID lookup endpoint - uses Epic offer IDs directly
		const url = new URL(`${ITAD_API_BASE}/lookup/id/shop/${EPIC_SHOP_ID}/v1`);
		url.searchParams.set('key', apiKey);

		const response = await fetch(url.toString(), {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(offerIds),
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
