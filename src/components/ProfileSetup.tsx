import { createSignal, Show } from 'solid-js';
import type { MatchedGame } from './GameMatcher';

interface Props {
	games: MatchedGame[];
	onSync: () => void;
	onBack: () => void;
}

export function ProfileSetup(props: Props) {
	const [linking, setLinking] = createSignal(false);
	const [linked, setLinked] = createSignal(false);
	const [error, setError] = createSignal<string | null>(null);

	const handleLink = async () => {
		setLinking(true);
		setError(null);

		try {
			const res = await fetch('/api/sync/link', {
				method: 'PUT',
			});

			if (!res.ok) {
				const data = await res.json();
				throw new Error(data.error || 'Failed to link profile');
			}

			setLinked(true);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to link profile');
		} finally {
			setLinking(false);
		}
	};

	return (
		<div class="profile-setup">
			<h2>Step 3: Configure Sync Profile</h2>

			<Show when={error()}>
				<p class="error">{error()}</p>
			</Show>

			<Show when={!linked()}>
				<div class="setup-step">
					<h3>1. Link Sync Profile</h3>
					<p class="help-text">
						First, we need to create a sync profile to import your games. This links your ITAD
						account with this importer.
					</p>
					<button
						type="button"
						class="btn btn-primary"
						onClick={handleLink}
						disabled={linking()}
					>
						{linking() ? 'Linking...' : 'Link Profile'}
					</button>
				</div>
			</Show>

			<Show when={linked()}>
				<div class="setup-step completed">
					<h3>1. Link Sync Profile ✓</h3>
					<p class="success-text">Profile linked successfully!</p>
				</div>

				<div class="setup-step">
					<h3>2. Configure Collection Category</h3>
					<p class="help-text">
						Now, open your ITAD profile settings to configure which collection category the
						imported games should go to:
					</p>
					<a
						href="https://isthereanydeal.com/settings/profiles/"
						target="_blank"
						rel="noopener"
						class="btn btn-secondary"
					>
						Open ITAD Profile Settings ↗
					</a>
					<p class="help-text" style={{ 'margin-top': '0.5rem' }}>
						Look for "Epic Games JSON Importer" and select your preferred category.
					</p>
				</div>

				<div class="setup-step">
					<h3>3. Ready to Sync</h3>
					<p class="help-text">
						When you've configured your category (or want to use the default), click below to sync{' '}
						<strong>{props.games.length}</strong> games to your collection.
					</p>
				</div>

				<div class="actions">
					<button type="button" class="btn btn-secondary" onClick={props.onBack}>
						Back
					</button>
					<button type="button" class="btn btn-primary" onClick={props.onSync}>
						Sync {props.games.length} Games
					</button>
				</div>
			</Show>
		</div>
	);
}
