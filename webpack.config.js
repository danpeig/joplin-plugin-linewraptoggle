const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const fs = require('fs-extra');
const glob = require('glob');
const chalk = require('chalk');
const tar = require('tar');
const crypto = require('crypto');

const rootDir = path.resolve(__dirname);
const srcDir = path.resolve(rootDir, 'src');
const distDir = path.resolve(rootDir, 'dist');
const publishDir = path.resolve(rootDir, 'publish');

const manifest = readManifest();
const pluginArchiveFilePath = path.resolve(publishDir, `${manifest.id}.jpl`);
const pluginInfoFilePath = path.resolve(publishDir, `${manifest.id}.json`);

function readManifest() {
	const manifestPath = `${srcDir}/manifest.json`;
	const content = fs.readFileSync(manifestPath, 'utf8');
	return JSON.parse(content);
}

function validatePackageJson() {
	const packageJson = require('./package.json');

	if (!packageJson.name.startsWith('joplin-plugin-')) {
		console.warn(chalk.yellow('Warning: Package name should start with "joplin-plugin-"'));
	}

	if (!packageJson.keywords || !packageJson.keywords.includes('joplin-plugin')) {
		console.warn(chalk.yellow('Warning: Package keywords should include "joplin-plugin"'));
	}
}

async function createPluginArchive() {
	console.log(chalk.cyan('Creating plugin archive...'));

	await fs.mkdirp(publishDir);

	// Collect all files to include in the archive
	const filesToArchive = [
		'manifest.json',
		'index.js',
	];

	// Add content scripts (avoid duplicating index.js)
	const contentScripts = glob.sync('contentScripts/**/*.js', { cwd: distDir });
	filesToArchive.push(...contentScripts);

	// Add other assets
	filesToArchive.push(...glob.sync('**/*.css', { cwd: distDir }));
	filesToArchive.push(...glob.sync('**/*.png', { cwd: distDir }));
	filesToArchive.push(...glob.sync('**/*.jpg', { cwd: distDir }));
	filesToArchive.push(...glob.sync('**/*.svg', { cwd: distDir }));

	await tar.create(
		{
			file: pluginArchiveFilePath,
			cwd: distDir,
			portable: true,
			strict: true,
		},
		filesToArchive
	);

	// Ensure the file is fully written to disk
	await new Promise(resolve => setTimeout(resolve, 100));

	// Verify the archive is valid
	try {
		await tar.list({
			file: pluginArchiveFilePath,
			onentry: () => {},
		});
		console.log(chalk.green('Archive verification: OK'));
	} catch (error) {
		console.error(chalk.red('Archive verification failed:'), error.message);
		throw error;
	}

	const archiveBuffer = await fs.readFile(pluginArchiveFilePath);
	const hash = crypto.createHash('sha256').update(archiveBuffer).digest('hex');

	console.log(chalk.green(`Plugin archive created: ${pluginArchiveFilePath}`));
	console.log(chalk.gray(`SHA256: ${hash}`));
	console.log(chalk.gray(`Size: ${(archiveBuffer.length / 1024).toFixed(2)} KB`));

	const pluginInfo = {
		id: manifest.id,
		version: manifest.version,
		_npm_package_name: require('./package.json').name,
		_archive_filename: path.basename(pluginArchiveFilePath),
		_sha256: hash,
	};

	await fs.writeFile(pluginInfoFilePath, JSON.stringify(pluginInfo, null, 2), 'utf8');
	console.log(chalk.green(`Plugin info created: ${pluginInfoFilePath}`));
}

function createBuildScriptConfig() {
	const pluginConfig = require('./plugin.config.json');
	const extraScripts = pluginConfig.extraScripts || [];

	const entries = {};
	for (const script of extraScripts) {
		entries[script] = `./src/${script}.ts`;
	}

	return {
		mode: 'production',
		entry: entries,
		target: 'node',
		module: {
			rules: [
				{
					test: /\.tsx?$/,
					use: 'ts-loader',
					exclude: /node_modules/,
				},
			],
		},
		resolve: {
			extensions: ['.tsx', '.ts', '.js'],
			alias: {
				api: path.resolve(__dirname, 'api'),
			},
		},
		output: {
			filename: '[name].js',
			path: distDir,
			libraryTarget: 'commonjs',
		},
		externals: {
			'@codemirror/state': 'commonjs @codemirror/state',
			'@codemirror/view': 'commonjs @codemirror/view',
		},
	};
}

const mainConfig = {
	mode: 'production',
	entry: './src/index.ts',
	target: 'node',
	module: {
		rules: [
			{
				test: /\.tsx?$/,
				use: 'ts-loader',
				exclude: /node_modules/,
			},
		],
	},
	resolve: {
		extensions: ['.tsx', '.ts', '.js'],
		alias: {
			api: path.resolve(__dirname, 'api'),
		},
	},
	output: {
		filename: 'index.js',
		path: distDir,
		libraryTarget: 'commonjs',
	},
	plugins: [
		new CopyPlugin({
			patterns: [
				{ from: './src/manifest.json', to: distDir },
				{ from: '**/*.css', to: distDir, context: './src', noErrorOnMissing: true },
				{ from: './src/contentScripts/viewerScript.js', to: path.join(distDir, 'contentScripts'), noErrorOnMissing: true },
			],
		}),
	],
};

validatePackageJson();

const extraScriptConfig = createBuildScriptConfig();

module.exports = [mainConfig, extraScriptConfig];

// After build, create archive
if (process.env.npm_lifecycle_event === 'dist' || process.env.npm_lifecycle_event === 'prepare') {
	// Add a hook to the main config instead of creating a new config
	mainConfig.plugins.push({
		apply: (compiler) => {
			compiler.hooks.afterEmit.tapPromise('CreateArchivePlugin', async () => {
				await createPluginArchive();
			});
		},
	});
}
