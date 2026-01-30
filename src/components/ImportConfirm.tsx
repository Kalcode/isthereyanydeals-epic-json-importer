import type { MatchedGame } from './GameMatcher';

interface Props {
	games: MatchedGame[];
	onImport: () => void;
	onBack: () => void;
}

export function ImportConfirm(props: Props) {
	return (
		<div class="import-confirm">
			<h2>Step 3: Confirm Import</h2>

			<div class="import-summary">
				<p>
					Ready to import <strong>{props.games.length}</strong> games to your IsThereAnyDeal
					collection.
				</p>
				<p class="help-text">
					Games will be added to your collection. You can organize them into categories on the{' '}
					<a href="https://isthereanydeal.com/collection/" target="_blank" rel="noopener">
						ITAD website
					</a>{' '}
					after import.
				</p>
			</div>

			<div class="actions">
				<button type="button" class="btn btn-secondary" onClick={props.onBack}>
					Back
				</button>
				<button type="button" class="btn btn-primary" onClick={props.onImport}>
					Import {props.games.length} Games
				</button>
			</div>
		</div>
	);
}
