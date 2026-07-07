import { Compartment } from '@codemirror/state';
import { EditorView } from '@codemirror/view';

interface ContentScriptContext {
	contentScriptId: string;
	postMessage: (message: any) => Promise<any>;
}

interface PluginSettings {
	disableInMarkdownEditor: boolean;
}

// Compartment used to swap the no-wrap theme in/out via dispatch. Using a CM6
// extension (rather than injecting a <style> tag into `document`) means the
// styles are mounted relative to the EditorView's own root, so this also
// works when the note is opened in a secondary window (where the editor's
// DOM lives in a different Document than the plugin's module-level
// `document` global).
const lineWrapCompartment = new Compartment();

// Styles for elements inside the CM6 root (.cm-editor and its descendants).
const noWrapTheme = EditorView.theme({
	'&': {
		overflow: 'hidden !important',
		maxWidth: '100% !important',
	},

	'.cm-scroller': {
		overflowX: 'auto !important',
		overflowY: 'auto !important',
		scrollbarGutter: 'stable !important',
	},

	'.cm-content, .cm-content.cm-lineWrapping': {
		whiteSpace: 'pre !important',
		wordWrap: 'normal !important',
		overflowWrap: 'normal !important',
		wordBreak: 'normal !important',
		width: 'max-content !important',
	},

	'.cm-line': {
		whiteSpace: 'pre !important',
		wordWrap: 'normal !important',
		overflowWrap: 'normal !important',
		wordBreak: 'normal !important',
		boxSizing: 'border-box !important',
		marginInlineEnd: '40px !important',
	},

	// Table cell
	'.cm-tw-text': {
		whiteSpace: 'pre !important',
		wordWrap: 'normal !important',
		overflowWrap: 'normal !important',
		wordBreak: 'normal !important',
		boxSizing: 'border-box !important',
	},
});

/** CodeMirror 6 content script entry point: wires the no-wrap theme up to the editor. */
export default (context: ContentScriptContext) => {
	return {
		/** Applies the initial no-wrap state to a newly created editor and starts listening for setting changes. */
		plugin: async (codeMirrorWrapper: any) => {
			// Only work with CodeMirror 6
			if (!codeMirrorWrapper.cm6) {
				return;
			}

			// Get settings from main plugin
			const settings: PluginSettings = await context.postMessage({ type: 'getSettings' });

			// Get the EditorView instance
			const editorView = codeMirrorWrapper.cm6;

			// Add the compartment, initialized to the setting's current state
			codeMirrorWrapper.addExtension(
				lineWrapCompartment.of(settings.disableInMarkdownEditor ? noWrapTheme : [])
			);
			applyContainerStyles(editorView, settings.disableInMarkdownEditor);

			startSettingsListener(context, editorView, settings);
		},

		assets: () => {
			return [];
		},
	};
};

/** Long-polls the main plugin process for editor setting changes and re-applies them as they arrive. */
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

/** Reconfigures the theme compartment and container styles to match the given settings. */
function applyWrapSettings(settings: PluginSettings, editorView: any): void {
	const disableWrap = settings.disableInMarkdownEditor;

	editorView.dispatch({
		effects: lineWrapCompartment.reconfigure(disableWrap ? noWrapTheme : []),
	});
	applyContainerStyles(editorView, disableWrap);

	if (!disableWrap && editorView.contentDOM) {
		cleanupInlineStyles(editorView.contentDOM);
	}
}

// `.editor` and its wrapping <div> are ancestors of `.cm-editor`, so they sit
// outside the CM6 root and can't be reached via EditorView.theme(). Style
// them directly, walking up from the editor's own DOM node (never the global
// `document`) so this is correct regardless of which window/document the
// editor actually lives in.
function findWrapContainers(editorDom: HTMLElement): HTMLElement[] {
	const containers: HTMLElement[] = [];
	let node: HTMLElement | null = editorDom.parentElement;

	while (node && node !== node.ownerDocument.body) {
		containers.push(node);
		if (node.classList.contains('editor')) {
			break;
		}
		node = node.parentElement;
	}

	return containers;
}

/** Applies or clears the no-wrap overflow/max-width styles on the editor's ancestor containers. */
function applyContainerStyles(editorView: any, disableWrap: boolean): void {
	if (!editorView || !editorView.dom) {
		return;
	}

	const containers = findWrapContainers(editorView.dom);
	for (const container of containers) {
		if (disableWrap) {
			container.style.setProperty('overflow', 'hidden', 'important');
			container.style.setProperty('max-width', '100%', 'important');
		} else {
			container.style.removeProperty('overflow');
			container.style.removeProperty('max-width');
		}
	}
}

/** Removes leftover width/min-width inline styles set on the content and its lines when re-enabling wrap. */
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
