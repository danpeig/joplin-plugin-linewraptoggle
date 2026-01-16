interface ContentScriptContext {
	contentScriptId: string;
	postMessage: (message: any) => Promise<any>;
}

interface PluginSettings {
	lineWrapEnabled: boolean;
	disableInViewer: boolean;
	codeBlocksOnly: boolean;
}

export default (context: ContentScriptContext) => {
	return {
		plugin: (markdownIt: any, _options: any) => {
			// We don't modify the markdown-it parser itself
			return markdownIt;
		},

		assets: () => {
			// Return CSS and JS to be injected into the viewer
			return [
				{
					name: 'viewerStyles.css',
				},
				{
					name: 'viewerScript.js',
				},
			];
		},
	};
};
