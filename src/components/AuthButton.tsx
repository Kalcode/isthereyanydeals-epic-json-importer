import { createSignal, onMount, Show } from 'solid-js';

export function AuthButton() {
	const [authenticated, setAuthenticated] = createSignal<boolean | null>(null);

	onMount(async () => {
		try {
			const res = await fetch('/api/auth/status');
			const data = await res.json();
			setAuthenticated(data.authenticated);
		} catch {
			setAuthenticated(false);
		}
	});

	return (
		<div class="auth-button">
			<Show when={authenticated() === null}>
				<span class="loading">Checking auth...</span>
			</Show>
			<Show when={authenticated() === true}>
				<a href="/api/auth/logout" class="btn btn-secondary">
					Logout
				</a>
			</Show>
			<Show when={authenticated() === false}>
				<a href="/api/auth/login" class="btn btn-primary">
					Login with IsThereAnyDeal
				</a>
			</Show>
		</div>
	);
}
