import { createSignal, Show, onMount } from 'solid-js';
import type { MatchedGame } from './GameMatcher';

interface SyncResponse {
	total: number;
	added: number;
	removed: number;
}

interface Props {
	games: MatchedGame[];
	onReset: () => void;
}

export function SyncResult(props: Props) {
	const [loading, setLoading] = createSignal(true);
	const [result, setResult] = createSignal<SyncResponse | null>(null);
	const [error, setError] = createSignal<string | null>(null);

	onMount(async () => {
		await syncGames();
	});

	const syncGames = async () => {
		setLoading(true);
		setError(null);

		try {
			// Format games for sync API
			const games = props.games.map((g) => ({
				epicOfferId: g.epicOfferId,
				title: g.epicTitle,
			}));

			const res = await fetch('/api/sync/games', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ games }),
			});

			if (!res.ok) {
				const data = await res.json();
				throw new Error(data.error || 'Sync failed');
			}

			const data: SyncResponse = await res.json();
			setResult(data);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to sync games');
		} finally {
			setLoading(false);
		}
	};

	return (
		<div class="sync-result">
			<Show when={loading()}>
				<div class="loading-state">
					<h2>Syncing Games...</h2>
					<p>Adding {props.games.length} games to your ITAD collection...</p>
				</div>
			</Show>

			<Show when={!loading() && result()}>
				<div class="success-state">
					<h2>Sync Complete!</h2>
					<div class="sync-stats">
						<div class="stat">
							<span class="stat-value">{result()!.added}</span>
							<span class="stat-label">Added</span>
						</div>
						<div class="stat">
							<span class="stat-value">{result()!.total}</span>
							<span class="stat-label">Total</span>
						</div>
					</div>
					<p class="help-text">
						You can view and organize your collection at{' '}
						<a href="https://isthereanydeal.com/collection/" target="_blank" rel="noopener">
							isthereanydeal.com/collection
						</a>
					</p>
					<button type="button" class="btn btn-primary" onClick={props.onReset}>
						Import More Games
					</button>
				</div>
			</Show>

			<Show when={!loading() && error()}>
				<div class="error-state">
					<h2>Sync Failed</h2>
					<p class="error">{error()}</p>
					<div class="actions">
						<button type="button" class="btn btn-secondary" onClick={props.onReset}>
							Start Over
						</button>
						<button type="button" class="btn btn-primary" onClick={syncGames}>
							Retry Sync
						</button>
					</div>
				</div>
			</Show>
		</div>
	);
}
