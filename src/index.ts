import joplin from 'api';
import { ContentScriptType, MenuItemLocation, ToolbarButtonLocation } from 'api/types';
import { registerSettings, getSettings, SettingKey, PluginSettings } from './settings';

const CODEMIRROR_CONTENT_SCRIPT_ID = 'lineWrapToggleCodeMirror';
const VIEWER_CONTENT_SCRIPT_ID = 'lineWrapToggleViewer';
const TOGGLE_COMMAND = 'lineWrapToggle';
const TOGGLE_EDITOR_COMMAND = 'lineWrapToggleEditor';
const TOGGLE_VIEWER_COMMAND = 'lineWrapToggleViewer';

type EditorSettings = Pick<PluginSettings, SettingKey.DisableInMarkdownEditor>;
type ViewerSettings = Pick<PluginSettings, SettingKey.DisableInViewer>;

const editorSettingsWaiters = new Set<(settings: EditorSettings) => void>();
const viewerSettingsWaiters = new Set<(settings: ViewerSettings) => void>();
let lastEditorSettings: EditorSettings | undefined;
let lastViewerSettings: ViewerSettings | undefined;

/** Extracts the editor-relevant subset of the full settings object. */
function buildEditorSettings(settings: PluginSettings): EditorSettings {
	return {
		disableInMarkdownEditor: settings.disableInMarkdownEditor,
	};
}

/** Extracts the viewer-relevant subset of the full settings object. */
function buildViewerSettings(settings: PluginSettings): ViewerSettings {
	return {
		disableInViewer: settings.disableInViewer,
	};
}

/** Compares two editor settings snapshots for equality. */
function editorSettingsEqual(a?: EditorSettings, b?: EditorSettings): boolean {
	return !!a && !!b && a.disableInMarkdownEditor === b.disableInMarkdownEditor;
}

/** Compares two viewer settings snapshots for equality. */
function viewerSettingsEqual(a?: ViewerSettings, b?: ViewerSettings): boolean {
	return !!a && !!b && a.disableInViewer === b.disableInViewer;
}

/**
 * Returns a promise that resolves the next time settings change, by
 * registering the resolver in `waiters`. Used to implement long-polling for
 * content scripts that ask to be notified of setting changes.
 */
function waitForSettingsChange<T>(waiters: Set<(settings: T) => void>): Promise<T> {
	return new Promise(resolve => {
		waiters.add(resolve);
	});
}

/** Resolves every pending `waitForSettingsChange` promise with the new settings. */
function resolveWaiters<T>(waiters: Set<(settings: T) => void>, settings: T): void {
	for (const resolve of waiters) {
		resolve(settings);
	}
	waiters.clear();
}

/** Returns the last known editor settings, fetching them once if not yet cached. */
async function getEditorSettingsSnapshot(): Promise<EditorSettings> {
	if (lastEditorSettings) {
		return lastEditorSettings;
	}

	const settings = await getSettings();
	lastEditorSettings = buildEditorSettings(settings);
	return lastEditorSettings;
}

/** Returns the last known viewer settings, fetching them once if not yet cached. */
async function getViewerSettingsSnapshot(): Promise<ViewerSettings> {
	if (lastViewerSettings) {
		return lastViewerSettings;
	}

	const settings = await getSettings();
	lastViewerSettings = buildViewerSettings(settings);
	return lastViewerSettings;
}

joplin.plugins.register({
	onStart: async function () {

		// Register settings
		await registerSettings();
		const startupSettings = await getSettings();
		lastEditorSettings = buildEditorSettings(startupSettings);
		lastViewerSettings = buildViewerSettings(startupSettings);

		// Register CodeMirror content script for markdown editor
		await joplin.contentScripts.register(
			ContentScriptType.CodeMirrorPlugin,
			CODEMIRROR_CONTENT_SCRIPT_ID,
			'./contentScripts/codeMirrorPlugin.js'
		);

		// Register message handler for CodeMirror content script
		await joplin.contentScripts.onMessage(CODEMIRROR_CONTENT_SCRIPT_ID, async (message: any) => {
			if (message === 'getSettings' || message?.type === 'getSettings') {
				const settings = await getSettings();
				const editorSettings = buildEditorSettings(settings);
				lastEditorSettings = editorSettings;
				return editorSettings;
			}

			if (message?.type === 'waitForSettings') {
				const currentSettings = await getEditorSettingsSnapshot();
				if (!editorSettingsEqual(message.currentSettings, currentSettings)) {
					return currentSettings;
				}

				return waitForSettingsChange(editorSettingsWaiters);
			}

			return null;
		});

		// Register viewer content script
		await joplin.contentScripts.register(
			ContentScriptType.MarkdownItPlugin,
			VIEWER_CONTENT_SCRIPT_ID,
			'./contentScripts/viewerPlugin.js'
		);

		// Register message handler for viewer content script
		await joplin.contentScripts.onMessage(VIEWER_CONTENT_SCRIPT_ID, async (message: any) => {
			if (message === 'getSettings' || message?.type === 'getSettings') {
				const settings = await getSettings();
				const viewerSettings = buildViewerSettings(settings);
				lastViewerSettings = viewerSettings;
				return viewerSettings;
			}

			if (message?.type === 'waitForSettings') {
				const currentSettings = await getViewerSettingsSnapshot();
				if (!viewerSettingsEqual(message.currentSettings, currentSettings)) {
					return currentSettings;
				}

				return waitForSettingsChange(viewerSettingsWaiters);
			}

			return null;
		});

		// Register toggle command (context-aware, for desktop)
		await joplin.commands.register({
			name: TOGGLE_COMMAND,
			label: 'Toggle line wrap',
			iconName: 'fas fa-level-down-alt',
			execute: async () => {
				await toggleLineWrap();
			},
		});

		// Register editor-only toggle command
		await joplin.commands.register({
			name: TOGGLE_EDITOR_COMMAND,
			label: 'Toggle line wrap (Editor)',
			iconName: 'fas fa-level-down-alt',
			execute: async () => {
				await toggleEditorLineWrap();
			},
		});

		// Register viewer-only toggle command
		await joplin.commands.register({
			name: TOGGLE_VIEWER_COMMAND,
			label: 'Toggle line wrap (Viewer)',
			iconName: 'fas fa-level-down-alt',
			execute: async () => {
				await toggleViewerLineWrap();
			},
		});

		// Detect platform
		const versionInfo = await joplin.versionInfo();
		const isDesktop = versionInfo.platform === 'desktop';

		if (isDesktop) {
			// Desktop: Tools menu item
			await joplin.views.menuItems.create(
				'lineWrapToggleMenuTools',
				TOGGLE_COMMAND,
				MenuItemLocation.Tools
			);

			// Desktop: Optional editor toolbar button
			if (startupSettings.showToolbarButton) {
				try {
					await joplin.views.toolbarButtons.create(
						'lineWrapToggleButton',
						TOGGLE_COMMAND,
						ToolbarButtonLocation.EditorToolbar
					);
				} catch (error) {
					console.warn('Line wrap toggle: Failed to create toolbar button:', error);
				}
			}
		} else {
			// Mobile: Two separate menu options in three-dotted menu
			try {
				await joplin.views.toolbarButtons.create(
					'lineWrapToggleEditorMenu',
					TOGGLE_EDITOR_COMMAND,
					ToolbarButtonLocation.NoteToolbar
				);
			} catch (error) {
				console.warn('Line wrap toggle: Failed to create editor menu button:', error);
			}

			try {
				await joplin.views.toolbarButtons.create(
					'lineWrapToggleViewerMenu',
					TOGGLE_VIEWER_COMMAND,
					ToolbarButtonLocation.NoteToolbar
				);
			} catch (error) {
				console.warn('Line wrap toggle: Failed to create viewer menu button:', error);
			}

			// Mobile: Editor toolbar button (editor-only, respects showToolbarButton setting)
			if (startupSettings.showToolbarButton) {
				try {
					await joplin.views.toolbarButtons.create(
						'lineWrapToggleButtonMobileToolbar',
						TOGGLE_EDITOR_COMMAND,
						ToolbarButtonLocation.EditorToolbar
					);
				} catch (error) {
					console.warn('Line wrap toggle: Failed to create mobile toolbar button:', error);
				}
			}
		}

		// Listen for settings changes
		await joplin.settings.onChange(async (event: any) => {
			const editorSettingsChanged = event.keys.includes(SettingKey.DisableInMarkdownEditor);
			const viewerSettingsChanged = event.keys.includes(SettingKey.DisableInViewer);

			if (editorSettingsChanged || viewerSettingsChanged) {
				const settings = await getSettings();

				if (editorSettingsChanged) {
					const editorSettings = buildEditorSettings(settings);
					if (!editorSettingsEqual(editorSettings, lastEditorSettings)) {
						lastEditorSettings = editorSettings;
						resolveWaiters(editorSettingsWaiters, editorSettings);
					}
				}

				if (viewerSettingsChanged) {
					const viewerSettings = buildViewerSettings(settings);
					if (!viewerSettingsEqual(viewerSettings, lastViewerSettings)) {
						lastViewerSettings = viewerSettings;
						resolveWaiters(viewerSettingsWaiters, viewerSettings);
					}
				}
			}

		});

	},
});

/**
 * Desktop context-aware toggle used by the Tools menu: toggles whichever
 * pane(s) are currently visible (editor, viewer, or both in split view).
 */
async function toggleLineWrap(): Promise<void> {
	try {
		const settings = await getSettings();

		// Detect current context using Joplin's noteVisiblePanes setting
		const visiblePanes = await joplin.settings.globalValue('noteVisiblePanes') as string[];
		const editorVisible = visiblePanes && Array.isArray(visiblePanes) && visiblePanes.includes('editor');
		const viewerVisible = visiblePanes && Array.isArray(visiblePanes) && visiblePanes.includes('viewer');

		if (editorVisible && !viewerVisible) {
			// Only editor visible - toggle markdown editor setting
			const newState = !settings.disableInMarkdownEditor;
			await joplin.settings.setValue(SettingKey.DisableInMarkdownEditor, newState);
		} else if (viewerVisible && !editorVisible) {
			// Only viewer visible - toggle viewer setting
			const newState = !settings.disableInViewer;
			await joplin.settings.setValue(SettingKey.DisableInViewer, newState);
		} else {
			// Both visible (desktop split view) - toggle both
			const newState = !(settings.disableInMarkdownEditor || settings.disableInViewer);
			await joplin.settings.setValue(SettingKey.DisableInMarkdownEditor, newState);
			await joplin.settings.setValue(SettingKey.DisableInViewer, newState);
		}
	} catch (error) {
		console.error('Failed to toggle line wrap:', error);
	}
}

/** Toggles line wrap in the markdown editor only. */
async function toggleEditorLineWrap(): Promise<void> {
	try {
		const settings = await getSettings();
		const newState = !settings.disableInMarkdownEditor;
		await joplin.settings.setValue(SettingKey.DisableInMarkdownEditor, newState);
	} catch (error) {
		console.error('Failed to toggle editor line wrap:', error);
	}
}

/** Toggles line wrap in the note viewer only. */
async function toggleViewerLineWrap(): Promise<void> {
	try {
		const settings = await getSettings();
		const newState = !settings.disableInViewer;
		await joplin.settings.setValue(SettingKey.DisableInViewer, newState);
	} catch (error) {
		console.error('Failed to toggle viewer line wrap:', error);
	}
}
