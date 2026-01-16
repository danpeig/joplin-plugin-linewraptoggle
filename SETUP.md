# Setup Instructions

The plugin structure has been created, but you need to add the Joplin Plugin API type definitions before you can build.

## Option 1: Copy from Joplin Generator (Recommended)

1. Install the Joplin plugin generator globally:
   ```bash
   npm install -g generator-joplin
   ```

2. Create a temporary plugin to get the API files:
   ```bash
   mkdir temp-plugin
   cd temp-plugin
   yo joplin
   ```

3. Copy the `api` directory from the temp plugin to this project:
   ```bash
   cp -r temp-plugin/api /path/to/linewraptoggle/
   ```

4. Delete the temporary plugin directory

## Option 2: Clone from Joplin Repository

Clone the API directory directly from the Joplin plugin templates repository:

```bash
git clone --depth 1 --filter=blob:none --sparse https://github.com/laurent22/joplin.git temp-joplin
cd temp-joplin
git sparse-checkout set packages/generator-joplin/generators/app/templates/api
cp -r packages/generator-joplin/generators/app/templates/api /path/to/linewraptoggle/
cd ..
rm -rf temp-joplin
```

## Option 3: Use Alternative TypeScript Definitions

Install the joplin-plugin package which provides TypeScript definitions:

```bash
npm install --save-dev joplin-plugin
```

Then update `tsconfig.json` to remove the api path alias and rely on node_modules resolution.

## After Adding API Directory

Once you have the `api` directory in place, you can build the plugin:

```bash
npm install
npm run dist
```

The plugin file will be created at `publish/danielbp.linewraptoggle.jpl`

## Verifying Your Setup

Your project structure should look like this:

```
linewraptoggle/
├── api/                    # ← You need to add this
│   ├── types.ts
│   ├── JoplinSettings.d.ts
│   ├── JoplinPlugins.d.ts
│   └── ... (other API files)
├── src/
│   ├── index.ts
│   ├── manifest.json
│   ├── settings.ts
│   └── contentScripts/
│       ├── codeMirrorPlugin.ts
│       └── viewerStyles.css
├── package.json
├── tsconfig.json
├── webpack.config.js
└── plugin.config.json
```
