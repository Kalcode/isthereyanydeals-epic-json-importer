import { createSignal, For, Show, onMount } from 'solid-js';
import type { ParsedGame } from '../lib/epicParser';

export interface MatchedGame {
	epicTitle: string;
	epicOfferId: string;
	itadId: string | null;
	itadTitle: string | null;
	selected: boolean;
}

interface Props {
	games: ParsedGame[];
	onMatched: (matches: MatchedGame[]) => void;
	onBack: () => void;
}

export function GameMatcher(props: Props) {
	const [matches, setMatches] = createSignal<MatchedGame[]>([]);
	const [loading, setLoading] = createSignal(true);
	const [error, setError] = createSignal<string | null>(null);

	onMount(async () => {
		await lookupGames();
	});

	const lookupGames = async () => {
		setLoading(true);
		setError(null);

		try {
			// Use Epic offer IDs for exact matching via ITAD shop lookup
			const offerIds = props.games.map((g) => g.epicOfferId);
			const res = await fetch('/api/games/lookup', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ offerIds }),
			});

			if (!res.ok) {
				const data = await res.json();
				throw new Error(data.error || 'Lookup failed');
			}

			// Response is keyed by Epic offer ID
			const lookupResult: Record<string, string | null> = await res.json();

			const matchedGames: MatchedGame[] = props.games.map((game) => {
				const itadId = lookupResult[game.epicOfferId];
				return {
					epicTitle: game.title,
					epicOfferId: game.epicOfferId,
					itadId: itadId || null,
					itadTitle: itadId ? game.title : null, // Use Epic title since we have exact match
					selected: itadId !== null,
				};
			});

			setMatches(matchedGames);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to lookup games');
		} finally {
			setLoading(false);
		}
	};

	const toggleGame = (index: number) => {
		setMatches((prev) =>
			prev.map((m, i) => (i === index ? { ...m, selected: !m.selected } : m))
		);
	};

	const selectAll = () => {
		setMatches((prev) => prev.map((m) => ({ ...m, selected: m.itadId !== null })));
	};

	const deselectAll = () => {
		setMatches((prev) => prev.map((m) => ({ ...m, selected: false })));
	};

	const handleContinue = () => {
		const selected = matches().filter((m) => m.selected && m.itadId);
		if (selected.length === 0) {
			setError('Please select at least one game to import');
			return;
		}
		props.onMatched(selected);
	};

	const matchedCount = () => matches().filter((m) => m.itadId !== null).length;
	const unmatchedCount = () => matches().filter((m) => m.itadId === null).length;
	const selectedCount = () => matches().filter((m) => m.selected).length;

	// Separate matched and unmatched games
	const unmatchedGames = () => matches().filter((m) => m.itadId === null);
	const matchedGames = () => matches().filter((m) => m.itadId !== null);

	// Get original index for toggle function
	const getOriginalIndex = (game: MatchedGame) => {
		return matches().findIndex(
			(m) => m.epicOfferId === game.epicOfferId
		);
	};

	return (
		<div class="game-matcher">
			<h2>Step 2: Review Matched Games</h2>

			<Show when={loading()}>
				<p class="loading">Looking up games in ITAD database...</p>
			</Show>

			<Show when={error()}>
				<p class="error">{error()}</p>
			</Show>

			<Show when={!loading() && matches().length > 0}>
				<div class="match-summary">
					<p>
						Found {matchedCount()} of {matches().length} games in ITAD database.
						{' '}Selected: {selectedCount()}
					</p>
					<div class="match-actions">
						<button type="button" class="btn btn-secondary btn-sm" onClick={selectAll}>
							Select All Matched
						</button>
						<button type="button" class="btn btn-secondary btn-sm" onClick={deselectAll}>
							Deselect All
						</button>
					</div>
				</div>

				{/* Unmatched games section */}
				<Show when={unmatchedCount() > 0}>
					<div class="game-section">
						<h3 class="section-header section-unmatched">
							Not Found ({unmatchedCount()})
						</h3>
						<p class="section-hint">
							These games weren't found in ITAD. You can go back to edit your JSON if needed.
						</p>
						<div class="game-list game-list-unmatched">
							<For each={unmatchedGames()}>
								{(match) => (
									<div class="game-item unmatched">
										<div class="game-info">
											<span class="epic-title">{match.epicTitle}</span>
										</div>
									</div>
								)}
							</For>
						</div>
					</div>
				</Show>

				{/* Matched games section */}
				<Show when={matchedCount() > 0}>
					<div class="game-section">
						<h3 class="section-header section-matched">
							Found ({matchedCount()})
						</h3>
						<div class="game-list">
							<For each={matchedGames()}>
								{(match) => (
									<div
										class={`game-item matched ${match.selected ? 'selected' : ''}`}
									>
										<label>
											<input
												type="checkbox"
												checked={match.selected}
												onChange={() => toggleGame(getOriginalIndex(match))}
											/>
											<div class="game-info">
												<span class="epic-title">{match.epicTitle}</span>
												<span class="itad-title">→ {match.itadTitle}</span>
											</div>
										</label>
									</div>
								)}
							</For>
						</div>
					</div>
				</Show>

				<div class="actions">
					<button type="button" class="btn btn-secondary" onClick={props.onBack}>
						Back
					</button>
					<button type="button" class="btn btn-primary" onClick={handleContinue}>
						Continue with {selectedCount()} games
					</button>
				</div>
			</Show>
		</div>
	);
}
