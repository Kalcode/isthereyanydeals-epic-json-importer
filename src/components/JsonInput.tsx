import { createSignal, onMount, Show } from "solid-js";
import { parseEpicOrders, type ParsedGame } from "../lib/epicParser";

const STORAGE_KEY = "epic-games-json";

const FETCH_SCRIPT = `(async () => {
	const orders = [], api = t => fetch(\`https://www.epicgames.com/account/v2/payment/ajaxGetOrderHistory?count=10&sortDir=DESC&sortBy=DATE&locale=en-US\${t ? \`&nextPageToken=\${t}\` : ''}\`).then(r => r.json());
	let token, page = 0;
	do {
		token && await new Promise(r => setTimeout(r, 500));
		const data = await api(token);
		orders.push(...data.orders);
		token = data.nextPageToken;
		console.log(\`Page \${++page}: \${data.orders.length} orders\`);
	} while (token);
	console.log(JSON.stringify(orders, null, 2));
})();`;

interface Props {
	onParsed: (games: ParsedGame[]) => void;
}

export function JsonInput(props: Props) {
	const [jsonText, setJsonText] = createSignal("");
	const [error, setError] = createSignal<string | null>(null);
	const [hasSaved, setHasSaved] = createSignal(false);
	const [copied, setCopied] = createSignal(false);

	onMount(() => {
		// Load saved JSON from localStorage
		const saved = localStorage.getItem(STORAGE_KEY);
		if (saved) {
			setJsonText(saved);
			setHasSaved(true);
		}
	});

	const handleParse = () => {
		setError(null);
		const text = jsonText().trim();

		if (!text) {
			setError("Please paste your Epic Games JSON");
			return;
		}

		try {
			const games = parseEpicOrders(text);
			if (games.length === 0) {
				setError(
					"No games found in the JSON. Make sure it contains order data with items.",
				);
				return;
			}
			// Save to localStorage on successful parse
			localStorage.setItem(STORAGE_KEY, text);
			setHasSaved(true);
			props.onParsed(games);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Invalid JSON format");
		}
	};

	const handleClear = () => {
		localStorage.removeItem(STORAGE_KEY);
		setJsonText("");
		setHasSaved(false);
		setError(null);
	};

	const handleCopyScript = async () => {
		try {
			await navigator.clipboard.writeText(FETCH_SCRIPT);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch {
			// Fallback for older browsers
			const textarea = document.createElement("textarea");
			textarea.value = FETCH_SCRIPT;
			document.body.appendChild(textarea);
			textarea.select();
			document.execCommand("copy");
			document.body.removeChild(textarea);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		}
	};

	return (
		<div class="json-input">
			<h2>Step 1: Get Your Epic Games Orders</h2>

			<div class="security-warning">
				<h3>⚠️ Security Warning</h3>
				<p>
					<strong>Never paste code into your browser console unless you understand what it does and trust the source.</strong>
				</p>
				<p>
					Code running in your console executes with your full account privileges — it can access your cookies, session tokens, and perform actions as you. Malicious scripts could steal your account credentials or make unwanted purchases.
				</p>
				<p>
					The script below only fetches your order history from Epic's API and outputs it as JSON. You can{" "}
					<a
						href="https://github.com/kalcode/isthereyanydeals-epic-json-importer/blob/main/src/components/JsonInput.tsx"
						target="_blank"
						rel="noopener"
					>
						review the source code
					</a>{" "}
					to verify this yourself. If you don't understand code or don't trust this tool, don't proceed.
				</p>
			</div>

			<div class="script-section">
				<h3>How to get your order history:</h3>
				<ol class="instructions">
					<li>
						Go to{" "}
						<a
							href="https://www.epicgames.com/account/transactions"
							target="_blank"
							rel="noopener"
						>
							Epic Games Transaction History
						</a>
					</li>
					<li>Open browser DevTools (F12) and go to the Console tab</li>
					<li>Paste the script below and press Enter</li>
					<li>
						Wait for it to finish, then click the output to copy it:
						<img
							src="/click-to-copy-in-terminal.png"
							alt="Click on the JSON output in the console to copy it"
							class="console-screenshot"
							width={350}
						/>
					</li>
					<li>Paste the JSON in the text area below</li>
				</ol>

				<div class="script-box">
					<pre>{FETCH_SCRIPT}</pre>
					<button
						type="button"
						class="btn btn-secondary btn-sm copy-btn"
						onClick={handleCopyScript}
					>
						{copied() ? "Copied!" : "Copy Script"}
					</button>
				</div>
			</div>

			<h3>Paste your order JSON:</h3>
			<textarea
				value={jsonText()}
				onInput={(e) => setJsonText(e.currentTarget.value)}
				placeholder="Paste your Epic Games order JSON here..."
				rows={10}
			/>

			{error() && <p class="error">{error()}</p>}

			<div class="input-actions">
				<button type="button" class="btn btn-primary" onClick={handleParse}>
					Parse Games
				</button>
				<Show when={hasSaved()}>
					<button type="button" class="btn btn-secondary" onClick={handleClear}>
						Clear Saved
					</button>
				</Show>
			</div>

			<Show when={hasSaved()}>
				<p class="help-text" style={{ "margin-top": "0.5rem" }}>
					Previously saved JSON loaded from browser storage.
				</p>
			</Show>
		</div>
	);
}
