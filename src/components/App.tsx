import { createSignal, Show, onMount } from 'solid-js';
import { AuthButton } from './AuthButton';
import { JsonInput } from './JsonInput';
import { GameMatcher, type MatchedGame } from './GameMatcher';
import { ImportConfirm } from './ImportConfirm';
import { ImportResult } from './ImportResult';
import type { ParsedGame } from '../lib/epicParser';

type Step = 'input' | 'match' | 'confirm' | 'result';

export function App() {
	const [authenticated, setAuthenticated] = createSignal<boolean | null>(null);
	const [step, setStep] = createSignal<Step>('input');
	const [parsedGames, setParsedGames] = createSignal<ParsedGame[]>([]);
	const [matchedGames, setMatchedGames] = createSignal<MatchedGame[]>([]);
	const [urlError, setUrlError] = createSignal<string | null>(null);

	onMount(async () => {
		// Check for error in URL (from OAuth callback)
		const params = new URLSearchParams(window.location.search);
		const error = params.get('error');
		if (error) {
			setUrlError(decodeURIComponent(error));
			// Clean up URL
			window.history.replaceState({}, '', window.location.pathname);
		}

		// Check auth status
		try {
			const res = await fetch('/api/auth/status');
			const data = await res.json();
			setAuthenticated(data.authenticated);
		} catch {
			setAuthenticated(false);
		}
	});

	const handleParsed = (games: ParsedGame[]) => {
		setParsedGames(games);
		setStep('match');
	};

	const handleMatched = (matches: MatchedGame[]) => {
		setMatchedGames(matches);
		setStep('confirm');
	};

	const handleImport = () => {
		setStep('result');
	};

	const handleReset = () => {
		setParsedGames([]);
		setMatchedGames([]);
		setStep('input');
	};

	return (
		<div class="app">
			<header>
				<h1>Epic Games → ITAD Importer</h1>
				<AuthButton />
			</header>

			<Show when={urlError()}>
				<div class="error-banner">
					<p>{urlError()}</p>
					<button type="button" onClick={() => setUrlError(null)}>
						Dismiss
					</button>
				</div>
			</Show>

			<main>
				<Show when={authenticated() === null}>
					<p class="loading">Loading...</p>
				</Show>

				<Show when={authenticated() === false}>
					<div class="not-authenticated">
						<p>Please login with IsThereAnyDeal to import your Epic Games library.</p>
						<a href="/api/auth/login" class="btn btn-primary">
							Login with IsThereAnyDeal
						</a>
					</div>
				</Show>

				<Show when={authenticated() === true}>
					<Show when={step() === 'input'}>
						<JsonInput onParsed={handleParsed} />
					</Show>

					<Show when={step() === 'match'}>
						<GameMatcher
							games={parsedGames()}
							onMatched={handleMatched}
							onBack={() => setStep('input')}
						/>
					</Show>

					<Show when={step() === 'confirm'}>
						<ImportConfirm
							games={matchedGames()}
							onImport={handleImport}
							onBack={() => setStep('match')}
						/>
					</Show>

					<Show when={step() === 'result'}>
						<ImportResult games={matchedGames()} onReset={handleReset} />
					</Show>
				</Show>
			</main>
		</div>
	);
}
