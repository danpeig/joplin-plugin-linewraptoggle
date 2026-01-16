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
- Rich text editor is not currently supported

## Compatibility

- **Joplin Version**: 2.13.0 or later
- **CodeMirror**: Version 6 (default since Joplin 3.1.x)
- **Platforms**: Desktop (Windows, macOS, Linux), Android, iOS

## Version History

- **0.1** - Initial release

## How It Works

The plugin integrates with Joplin's CodeMirror 6 editor and uses message-based notifications to stay in sync with your settings. Each content script requests the initial configuration, then waits for changes.

When line wrap is disabled, horizontal scrollbars are automatically enabled to allow viewing long lines.

When line wrap is enabled, Joplin will behave exactly as if the plugin was never installed. It does nothing to the default line wrap mechanism.

This plugin does not modify color schemes, fonts or any other visual styles.

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
- Homepage: https://github.com/danpeig/joplin-plugin-linewraptoggle
- Issues: https://github.com/danpeig/joplin-plugin-linewraptoggle/issues