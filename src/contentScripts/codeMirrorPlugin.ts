import { Compartment } from '@codemirror/state';

interface ContentScriptContext {
	contentScriptId: string;
	postMessage: (message: any) => Promise<any>;
}

interface PluginSettings {
	disableInMarkdownEditor: boolean;
}

// Create a compartment for dynamic line wrap configuration
const lineWrapCompartment = new Compartment();

// Style element ID for CSS injection
const STYLE_ID = 'linewrap-toggle-editor-styles';

// Inject CSS to disable wrap for all content
function injectNoWrapStyles(): void {
	removeStyles();

	const style = document.createElement('style');
	style.id = STYLE_ID;
	style.textContent = `
		/* Line wrap toggle - Editor No-Wrap Styles */

		/* Constrain outer containers */
		.editor {
			overflow: hidden !important;
			max-width: 100% !important;
		}
		.editor > div {
			overflow: hidden !important;
			max-width: 100% !important;
		}
		.cm-editor {
			overflow: hidden !important;
			max-width: 100% !important;
		}

		/* Scroller handles horizontal overflow */
		.cm-scroller {
			overflow-x: auto !important;
			overflow-y: auto !important;
			scrollbar-gutter: stable !important;
		}

		/* Content expands to fit longest line */
		.cm-content,
		.cm-content.cm-lineWrapping {
			white-space: pre !important;
			word-wrap: normal !important;
			overflow-wrap: normal !important;
			word-break: normal !important;
			width: max-content !important;
		}

		/* Lines - no wrap */
		.cm-line {
			white-space: pre !important;
			word-wrap: normal !important;
			overflow-wrap: normal !important;
			word-break: normal !important;
			box-sizing: border-box !important;
			margin-inline-end: 20px !important;
		}
	`;

	document.head.appendChild(style);
}

function removeStyles(): void {
	const style = document.getElementById(STYLE_ID);
	if (style) {
		style.remove();
	}
}

export default (context: ContentScriptContext) => {
	return {
		plugin: async (codeMirrorWrapper: any) => {
			// Only work with CodeMirror 6
			if (!codeMirrorWrapper.cm6) {
				return;
			}

			// Get settings from main plugin
			const settings: PluginSettings = await context.postMessage({ type: 'getSettings' });

			// Get the EditorView instance
			const editorView = codeMirrorWrapper.cm6;

			// Apply initial style based on settings
			applyWrapSettings(settings, editorView);

			// Add empty extension in compartment for future reconfiguration
			codeMirrorWrapper.addExtension(lineWrapCompartment.of([]));

			startSettingsListener(context, editorView, settings);
		},

		assets: () => {
			return [];
		},
	};
};

function startSettingsListener(
	context: ContentScriptContext,
	editorView: any,
	initialSettings: PluginSettings
): void {
	let currentSettings = initialSettings;

	const waitForSettingsChange = async (): Promise<void> => {
		try {
			const newSettings: PluginSettings = await context.postMessage({
				type: 'waitForSettings',
				currentSettings,
			});

			if (
				newSettings &&
				newSettings.disableInMarkdownEditor !== currentSettings.disableInMarkdownEditor
			) {
				applyWrapSettings(newSettings, editorView);
				currentSettings = newSettings;
			}

			waitForSettingsChange();
		} catch (error) {
			setTimeout(waitForSettingsChange, 2000);
		}
	};

	waitForSettingsChange();
}

function applyWrapSettings(settings: PluginSettings, editorView?: any): void {
	if (settings.disableInMarkdownEditor) {
		injectNoWrapStyles();
	} else {
		removeStyles();
		if (editorView && editorView.contentDOM) {
			cleanupInlineStyles(editorView.contentDOM);
		}
	}
}

function cleanupInlineStyles(contentDOM: HTMLElement): void {
	contentDOM.style.removeProperty('width');
	contentDOM.style.removeProperty('min-width');

	const allElements = contentDOM.querySelectorAll('.cm-line');
	allElements.forEach((el: Element) => {
		const htmlEl = el as HTMLElement;
		htmlEl.style.removeProperty('width');
		htmlEl.style.removeProperty('min-width');
	});
}
