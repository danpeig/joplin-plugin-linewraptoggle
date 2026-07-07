// This script runs in the viewer context to apply line wrap settings
(function() {
	'use strict';

	const CONTENT_SCRIPT_ID = 'lineWrapToggleViewer';
	const RETRY_DELAY_MS = 2000;

	/** Sets or clears the `data-linewrap-disabled` attribute on <body>, which viewerStyles.css keys off of. */
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

	/** Fetches the current plugin settings from the main plugin process. */
	async function fetchSettings() {
		return webviewApi.postMessage(CONTENT_SCRIPT_ID, { type: 'getSettings' });
	}

	/** Resolves once the main plugin process reports settings different from `currentSettings`. */
	async function waitForSettingsChange(currentSettings) {
		return webviewApi.postMessage(CONTENT_SCRIPT_ID, {
			type: 'waitForSettings',
			currentSettings,
		});
	}

	/** Long-polls for viewer setting changes and re-applies them as they arrive. */
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

	/** Applies the initial line-wrap setting and starts listening for changes. */
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
