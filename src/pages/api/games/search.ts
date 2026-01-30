import type { APIContext } from 'astro';
import { ITAD_API_BASE } from '../../../lib/oauth';

export async function GET(context: APIContext): Promise<Response> {
	const apiKey = context.locals.runtime?.env?.ITAD_API_KEY || import.meta.env.ITAD_API_KEY;

	if (!apiKey) {
		return new Response(JSON.stringify({ error: 'API key not configured' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' },
		});
	}

	const url = new URL(context.request.url);
	const title = url.searchParams.get('title');
	const results = url.searchParams.get('results') || '10';

	if (!title) {
		return new Response(JSON.stringify({ error: 'title parameter is required' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json' },
		});
	}

	try {
		// ITAD search endpoint
		const itadUrl = new URL(`${ITAD_API_BASE}/games/search/v1`);
		itadUrl.searchParams.set('key', apiKey);
		itadUrl.searchParams.set('title', title);
		itadUrl.searchParams.set('results', results);

		const response = await fetch(itadUrl.toString());

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
