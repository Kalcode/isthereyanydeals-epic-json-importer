import { createSignal, Show, onMount } from 'solid-js';
import type { MatchedGame } from './GameMatcher';

interface Props {
	games: MatchedGame[];
	onReset: () => void;
}

export function ImportResult(props: Props) {
	const [loading, setLoading] = createSignal(true);
	const [success, setSuccess] = createSignal(false);
	const [error, setError] = createSignal<string | null>(null);

	onMount(async () => {
		await importGames();
	});

	const importGames = async () => {
		setLoading(true);
		setError(null);

		try {
			const gameIds = props.games.map((g) => g.itadId).filter((id): id is string => id !== null);

			const res = await fetch('/api/collection/games', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ games: gameIds }),
			});

			if (!res.ok) {
				const data = await res.json();
				throw new Error(data.error || 'Import failed');
			}

			setSuccess(true);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to import games');
		} finally {
			setLoading(false);
		}
	};

	return (
		<div class="import-result">
			<Show when={loading()}>
				<div class="loading-state">
					<h2>Importing Games...</h2>
					<p>Adding {props.games.length} games to your ITAD collection...</p>
				</div>
			</Show>

			<Show when={!loading() && success()}>
				<div class="success-state">
					<h2>Import Complete!</h2>
					<p>
						Successfully added <strong>{props.games.length}</strong> games to your IsThereAnyDeal
						collection.
					</p>
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
					<h2>Import Failed</h2>
					<p class="error">{error()}</p>
					<div class="actions">
						<button type="button" class="btn btn-secondary" onClick={props.onReset}>
							Start Over
						</button>
						<button type="button" class="btn btn-primary" onClick={importGames}>
							Retry Import
						</button>
					</div>
				</div>
			</Show>
		</div>
	);
}
