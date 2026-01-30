import type { APIContext } from 'astro';

export async function GET(context: APIContext): Promise<Response> {
	const token = context.cookies.get('itad_token')?.value;

	return new Response(
		JSON.stringify({
			authenticated: !!token,
		}),
		{
			headers: {
				'Content-Type': 'application/json',
			},
		}
	);
}
