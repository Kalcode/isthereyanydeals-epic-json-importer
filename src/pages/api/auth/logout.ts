import type { APIContext } from 'astro';

export async function GET(context: APIContext): Promise<Response> {
	// Clear the access token cookie
	context.cookies.delete('itad_token', { path: '/' });

	// Redirect to home page
	return context.redirect('/');
}
