interface ContentScriptContext {
	contentScriptId: string;
	postMessage: (message: any) => Promise<any>;
}

/** Markdown-It content script entry point: registers the viewer's CSS/JS assets. */
export default (context: ContentScriptContext) => {
	return {
		/** No-op: this plugin only needs to inject assets, not alter parsing. */
		plugin: (markdownIt: any, _options: any) => {
			// We don't modify the markdown-it parser itself
			return markdownIt;
		},

		/** Lists the CSS/JS assets to inject into the note viewer. */
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
