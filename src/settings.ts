import joplin from 'api';
import { SettingItemType } from 'api/types';

export const SETTING_SECTION = 'linewraptoggle';

export enum SettingKey {
	DisableInMarkdownEditor = 'disableInMarkdownEditor',
	DisableInViewer = 'disableInViewer',
	ShowToolbarButton = 'showToolbarButton',
}

export interface PluginSettings {
	[SettingKey.DisableInMarkdownEditor]: boolean;
	[SettingKey.DisableInViewer]: boolean;
	[SettingKey.ShowToolbarButton]: boolean;
}

export async function registerSettings(): Promise<void> {
	await joplin.settings.registerSection(SETTING_SECTION, {
		label: 'Line wrap toggle',
		description: 'Control line wrapping behavior in editors and viewer',
		iconName: 'fas fa-level-down-alt',
	});

	await joplin.settings.registerSettings({
		[SettingKey.DisableInMarkdownEditor]: {
			section: SETTING_SECTION,
			public: true,
			type: SettingItemType.Bool,
			value: false,
			label: 'Disable line wrap in markdown editor',
			description: 'When checked, line wrap is disabled in the markdown editor',
		},
		[SettingKey.DisableInViewer]: {
			section: SETTING_SECTION,
			public: true,
			type: SettingItemType.Bool,
			value: false,
			label: 'Disable line wrap in viewer',
			description: 'When checked, line wrap is disabled in the note viewer',
		},
		[SettingKey.ShowToolbarButton]: {
			section: SETTING_SECTION,
			public: true,
			type: SettingItemType.Bool,
			value: true,
			label: 'Show toolbar button',
			description: 'Display a toolbar button to toggle line wrap',
		},
	});
}

export async function getSettings(): Promise<PluginSettings> {
	return {
		[SettingKey.DisableInMarkdownEditor]: await joplin.settings.value(SettingKey.DisableInMarkdownEditor),
		[SettingKey.DisableInViewer]: await joplin.settings.value(SettingKey.DisableInViewer),
		[SettingKey.ShowToolbarButton]: await joplin.settings.value(SettingKey.ShowToolbarButton),
	};
}
