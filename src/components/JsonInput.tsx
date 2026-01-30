import { createSignal } from 'solid-js';
import { parseEpicOrders, type ParsedGame } from '../lib/epicParser';

interface Props {
	onParsed: (games: ParsedGame[]) => void;
}

export function JsonInput(props: Props) {
	const [jsonText, setJsonText] = createSignal('');
	const [error, setError] = createSignal<string | null>(null);

	const handleParse = () => {
		setError(null);
		const text = jsonText().trim();

		if (!text) {
			setError('Please paste your Epic Games JSON');
			return;
		}

		try {
			const games = parseEpicOrders(text);
			if (games.length === 0) {
				setError('No games found in the JSON. Make sure it contains order data with items.');
				return;
			}
			props.onParsed(games);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Invalid JSON format');
		}
	};

	return (
		<div class="json-input">
			<h2>Step 1: Paste Your Epic Games Orders</h2>
			<p class="help-text">
				Go to your Epic Games account → Transaction History → Open browser DevTools (F12) → Network
				tab → Copy the transaction response JSON
			</p>

			<textarea
				value={jsonText()}
				onInput={(e) => setJsonText(e.currentTarget.value)}
				placeholder='Paste your Epic Games order JSON here (single order or array of orders)...'
				rows={10}
			/>

			{error() && <p class="error">{error()}</p>}

			<button type="button" class="btn btn-primary" onClick={handleParse}>
				Parse Games
			</button>
		</div>
	);
}
