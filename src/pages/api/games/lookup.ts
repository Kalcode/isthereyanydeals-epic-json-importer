import type { APIContext } from 'astro';
import { ITAD_API_BASE } from '../../../lib/oauth';

// Epic Games Store shop ID in ITAD
const EPIC_SHOP_ID = 16;

interface LookupRequest {
	offerIds: string[];
	titles: string[]; // Parallel array - titles[i] corresponds to offerIds[i]
}

export async function POST(context: APIContext): Promise<Response> {
	const apiKey = context.locals.runtime?.env?.ITAD_API_KEY || import.meta.env.ITAD_API_KEY;

	if (!apiKey) {
		return new Response(JSON.stringify({ error: 'API key not configured' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' },
		});
	}

	try {
		const body: LookupRequest = await context.request.json();
		const { offerIds, titles } = body;

		if (!Array.isArray(offerIds) || offerIds.length === 0) {
			return new Response(JSON.stringify({ error: 'offerIds array is required' }), {
				status: 400,
				headers: { 'Content-Type': 'application/json' },
			});
		}

		if (!Array.isArray(titles) || titles.length !== offerIds.length) {
			return new Response(JSON.stringify({ error: 'titles array must match offerIds length' }), {
				status: 400,
				headers: { 'Content-Type': 'application/json' },
			});
		}

		// Step 1: ITAD shop ID lookup - uses Epic offer IDs directly
		const shopUrl = new URL(`${ITAD_API_BASE}/lookup/id/shop/${EPIC_SHOP_ID}/v1`);
		shopUrl.searchParams.set('key', apiKey);

		const shopResponse = await fetch(shopUrl.toString(), {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(offerIds),
		});

		if (!shopResponse.ok) {
			const error = await shopResponse.text();
			return new Response(JSON.stringify({ error: `ITAD API error: ${error}` }), {
				status: shopResponse.status,
				headers: { 'Content-Type': 'application/json' },
			});
		}

		const shopResults: Record<string, string | null> = await shopResponse.json();

		// Find unmatched games for title fallback
		const unmatchedTitles: string[] = [];
		const unmatchedOfferIds: string[] = [];

		for (let i = 0; i < offerIds.length; i++) {
			if (!shopResults[offerIds[i]]) {
				unmatchedTitles.push(titles[i]);
				unmatchedOfferIds.push(offerIds[i]);
			}
		}

		// Step 2: Title lookup fallback for unmatched games
		if (unmatchedTitles.length > 0) {
			const titleUrl = new URL(`${ITAD_API_BASE}/lookup/id/title/v1`);
			titleUrl.searchParams.set('key', apiKey);

			const titleResponse = await fetch(titleUrl.toString(), {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(unmatchedTitles),
			});

			if (titleResponse.ok) {
				const titleResults: Record<string, string | null> = await titleResponse.json();

				// Merge title results back into shop results (keyed by offerId)
				for (let i = 0; i < unmatchedTitles.length; i++) {
					const title = unmatchedTitles[i];
					const offerId = unmatchedOfferIds[i];
					if (titleResults[title]) {
						shopResults[offerId] = titleResults[title];
					}
				}
			}
			// If title lookup fails, we just continue with shop results only
		}

		return new Response(JSON.stringify(shopResults), {
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
