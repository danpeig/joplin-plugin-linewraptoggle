# Line wrap toggle plugin for Joplin

A Joplin plugin that provides simple control over line wrapping behavior in markdown editors and the note viewer. You will probably want it if you use Joplin for code snippets, markdown tables, ASCII diagrams, long lines, or just prefer horizontal scrolling.

## Features

- Toggle line wrap on/off with a single click
- Toolbar button for quick access (optional): <img src="res/turn-down-solid-full.svg" alt="button icon" width="24px"/>
- Tools menu integration
- The plugin does not modify note content - all styling is applied externally
- Separate control for markdown editor and viewer
- State persists across Joplin sessions
- Compatible with CodeMirror 6
- Cross-platform support (Desktop and Mobile)

## Limitations

- Toolbar button visibility changes require a Joplin restart to take effect
- Rich text editor is not currently supported, let me know if you need the plugin to work with it.
- iOS is supported but Joplin team must manually approve it to be available in the platform.

## Compatibility

- **Joplin Version**: 3.2 or later
- **CodeMirror**: Version 6 (default since Joplin 3.2)
- **Platforms**: Desktop (Windows, macOS, Linux), Android, iOS

## Version history

- **1.0 (to be confirmed)**
    - Will be released one month after latest 0.x release, if no bugs or issues are found.

- **0.2 (23/01/2025)**
    - Added padding at the end of the text for the editor
    - Added padding at the end of the text for the viewer
    - Tested on Joplin Desktop 3.5.12, 3.6.2 and Android 3.5.9

- **0.1 (16/01/2025)**
    - Initial release

## How It Works

When line wrap is disabled, horizontal scrollbars are automatically enabled to allow viewing long lines.

When line wrap is enabled, Joplin will behave exactly as if the plugin was never installed. It does nothing to the default line wrap mechanism.

This plugin does not modify color schemes, fonts or any other visual styles or contents of the notes. It acts only on the viewer and editor panels.

## Installation

### From Joplin Plugin Repository

1. Open Joplin
2. Go to `Tools > Options > Plugins`
3. Search for "Line wrap toggle"
4. Click Install

### Manual Installation

1. Download the latest `.jpl` file from the releases page
2. Open Joplin
3. Go to `Tools > Options > Plugins`
4. Click on the gear icon and select "Install from file"
5. Select the downloaded `.jpl` file

## Usage

### Toggle line wrap

**Via Toolbar:**
- Click the line wrap toggle button in the editor toolbar (if enabled in settings)

**Via Menu (Desktop):**
- Go to `Tools > Toggle line wrap`

**Via Toolbar (Mobile):**
- Two toggle buttons appear in the note toolbar (three dots menu area), one for the editor and another for the viewer

### Configuration

Go to `Tools > Options > Line wrap toggle` to configure:

- **Disable line wrap in markdown editor**: When checked, line wrap is disabled in the markdown editor
- **Disable line wrap in viewer**: When checked, line wrap is disabled in the note viewer
- **Show toolbar button**: Display a toolbar button to toggle line wrap

## License

AGPL-3.0-only - See [LICENSE](LICENSE) file for details.

This plugin is licensed under the same license as Joplin to ensure compatibility.

## AI disclaimer

This plugin was cpartially coded with the help of Claude Opus 4.5 and GPT 5.1 Codex. For the execution it does not use neither require any AI model or cloud services.

## Author

Daniel BP

## Development

### Prerequisites

- Node.js 18 or later
- npm

### Setup

```bash
npm install
```

### Build

```bash
npm run dist
```

### Testing

1. Build the plugin
2. Open Joplin
3. Go to `Tools > Options > Plugins`
4. Enable "Show Advanced Settings"
5. In "Development plugins" field, enter the path to your plugin directory
6. Restart Joplin
7. The plugin should now be loaded

## Links

- Repository: https://github.com/danpeig/joplin-plugin-linewraptoggle
- NPM: https://www.npmjs.com/package/joplin-plugin-linewraptoggle
- Homepage: https://github.com/danpeig/joplin-plugin-linewraptoggle
- Issues: https://github.com/danpeig/joplin-plugin-linewraptoggle/issues