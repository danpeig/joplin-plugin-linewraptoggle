// This script runs in the viewer context to apply line wrap settings
(function() {
	'use strict';

	const CONTENT_SCRIPT_ID = 'lineWrapToggleViewer';
	const RETRY_DELAY_MS = 2000;

	function applyLineWrapSettings(settings) {
		if (!settings) {
			return;
		}

		try {
			const body = document.body || document.documentElement;

			// Skip if in main Joplin window
			if (body.classList.contains('main-window')) {
				return;
			}

			if (settings.disableInViewer) {
				body.setAttribute('data-linewrap-disabled', 'true');
			} else {
				body.removeAttribute('data-linewrap-disabled');
			}
		} catch (error) {
			// Silently ignore errors
		}
	}

	async function fetchSettings() {
		return webviewApi.postMessage(CONTENT_SCRIPT_ID, { type: 'getSettings' });
	}

	async function waitForSettingsChange(currentSettings) {
		return webviewApi.postMessage(CONTENT_SCRIPT_ID, {
			type: 'waitForSettings',
			currentSettings,
		});
	}

	function startSettingsListener(initialSettings) {
		let currentSettings = initialSettings;

		const listenForUpdates = async () => {
			try {
				const newSettings = await waitForSettingsChange(currentSettings);
				if (
					newSettings &&
					newSettings.disableInViewer !== currentSettings.disableInViewer
				) {
					applyLineWrapSettings(newSettings);
					currentSettings = newSettings;
				}
				listenForUpdates();
			} catch (error) {
				setTimeout(listenForUpdates, RETRY_DELAY_MS);
			}
		};

		listenForUpdates();
	}

	async function init() {
		const settings = await fetchSettings();
		applyLineWrapSettings(settings);
		startSettingsListener(settings);
	}

	// Apply settings when DOM is ready
	if (document.body) {
		init();
	} else {
		document.addEventListener('DOMContentLoaded', init);
	}
})();
