import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from '@vscode/test-cli';

const __dirname = dirname(fileURLToPath(import.meta.url));
const extensionDevelopmentPath = resolve(__dirname);

export default defineConfig({
	files: 'out/test/**/*.test.js',
	extensionDevelopmentPath,
	launchArgs: [extensionDevelopmentPath]
});
