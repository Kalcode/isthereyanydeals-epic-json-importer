import { createSignal, Show, onMount } from 'solid-js';
import { AuthButton } from './AuthButton';
import { JsonInput } from './JsonInput';
import { GameMatcher, type MatchedGame } from './GameMatcher';
import { ProfileSetup } from './ProfileSetup';
import { SyncResult } from './SyncResult';
import type { ParsedGame } from '../lib/epicParser';

type Step = 'input' | 'match' | 'setup' | 'result';

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
		setStep('setup');
	};

	const handleSync = () => {
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
					<div class="intro-section">
						<h2>What is this?</h2>
						<p>
							This tool helps you import your Epic Games library into your{" "}
							<a href="https://isthereanydeal.com" target="_blank" rel="noopener">IsThereAnyDeal</a>{" "}
							collection. ITAD doesn't have direct Epic Games integration, so this tool bridges that gap.
						</p>

						<h3>How it works</h3>
						<ol class="process-steps">
							<li>
								<strong>Retrieve your Epic orders</strong> — You'll need to get your order history from Epic Games.
								We provide a script you can run in your browser's console while logged into Epic, or you can
								retrieve the JSON manually via their API.
							</li>
							<li>
								<strong>Paste the JSON here</strong> — The tool parses your orders and extracts game titles.
							</li>
							<li>
								<strong>Match games to ITAD</strong> — We search ITAD's database to find matching entries
								for your games.
							</li>
							<li>
								<strong>Import to your collection</strong> — Select which ITAD collection to add them to
								(requires logging in with your ITAD account).
							</li>
						</ol>

						<div class="disclosure-box">
							<h4>⚠️ Important disclosure</h4>
							<p>
								This tool requires you to run a script in your browser console to fetch your Epic orders.
								<strong>Never run scripts you don't understand or trust.</strong> The script only reads your
								order history — it cannot make purchases or modify your account. You can{" "}
								<a
									href="https://github.com/kalcode/isthereyanydeals-epic-json-importer"
									target="_blank"
									rel="noopener"
								>
									review the full source code
								</a>{" "}
								on GitHub.
							</p>
						</div>

						<div class="login-prompt">
							<p>Ready to get started? Login with your IsThereAnyDeal account:</p>
							<a href="/api/auth/login" class="btn btn-primary">
								Login with IsThereAnyDeal
							</a>
						</div>
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

					<Show when={step() === 'setup'}>
						<ProfileSetup
							games={matchedGames()}
							onSync={handleSync}
							onBack={() => setStep('match')}
						/>
					</Show>

					<Show when={step() === 'result'}>
						<SyncResult games={matchedGames()} onReset={handleReset} />
					</Show>
				</Show>
			</main>
		</div>
	);
}
