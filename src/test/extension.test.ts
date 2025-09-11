import * as assert from 'assert';
import * as vscode from 'vscode';
import { EOL } from 'os';

// Helper function to create a document, run the command, and check the result
async function testCommand(initialContent: string, expectedContent: string): Promise<void> {
	const document = await vscode.workspace.openTextDocument({
		content: initialContent,
		language: 'typescript',
	});

	await vscode.window.showTextDocument(document);

	// Ensure the extension is activated by waiting a bit for startup activation
	await new Promise(resolve => setTimeout(resolve, 1000));

	// Execute the command
	await vscode.commands.executeCommand('RemoveUnusedImports.cleanCurrentFile');

	// It may take a moment for the edits to apply and save
	await new Promise(resolve => setTimeout(resolve, 500));

	const finalContent = document.getText();

	// Normalize line endings for consistent comparison
	assert.strictEqual(finalContent.replace(/\r\n/g, '\n'), expectedContent.replace(/\r\n/g, '\n'));

	// Close the editor
	await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
}

suite('Remove Unused Imports Extension Test Suite', function () {
	// Increase timeout to allow for extension activation.
	this.timeout(5000);
	vscode.window.showInformationMessage('Start all tests.');

	test('Should remove a simple unused named import', async () => {
		const initial = `import { a, b } from './module';${EOL}console.log(b);`;
		const expected = `import { b } from './module';${EOL}console.log(b);`;
		await testCommand(initial, expected);
	});

	test('Should remove the entire line if all imports are unused', async () => {
		const initial = `import { a, b } from './module';${EOL}console.log('hello');`;
		const expected = `console.log('hello');`;
		await testCommand(initial, expected);
	});

	test('Should not remove a used import', async () => {
		const initial = `import { a } from './module';${EOL}console.log(a);`;
		const expected = `import { a } from './module';${EOL}console.log(a);`;
		await testCommand(initial, expected);
	});

	test('Should remove an unused default import', async () => {
		const initial = `import MyDefault from './module';${EOL}console.log('hello');`;
		const expected = `console.log('hello');`;
		await testCommand(initial, expected);
	});

	test('Should remove an unused namespace import', async () => {
		const initial = `import * as MyNamespace from './module';${EOL}console.log('hello');`;
		const expected = `console.log('hello');`;
		await testCommand(initial, expected);
	});

	test('Should handle mixed default and named imports correctly', async () => {
		const initial = `import MyDefault, { a, b } from './module';${EOL}console.log(a);`;
		const expected = `import { a } from './module';${EOL}console.log(a);`;
		await testCommand(initial, expected);
	});

	test('Should NOT remove an import used only as a TypeScript type', async () => {
		const initial = `import { MyType } from './types';${EOL}let x: MyType;`;
		const expected = `import { MyType } from './types';${EOL}let x: MyType;`;
		await testCommand(initial, expected);
	});

	test('Should handle a file with no imports', async () => {
		const initial = `console.log('hello');`;
		const expected = `console.log('hello');`;
		await testCommand(initial, expected);
	});

	test('Should handle multi-line imports', async () => {
		const initial = `import {${EOL}
  a,${EOL}
  b,${EOL}
  c${EOL}} from './module';${EOL}console.log(c);`;
		const expected = `import { c } from './module';${EOL}console.log(c);`;
		await testCommand(initial, expected);
	});

	test('Should not remove a side-effect import', async () => {
		const initial = `import './styles.css';${EOL}console.log('hello');`;
		const expected = `import './styles.css';${EOL}console.log('hello');`;
		await testCommand(initial, expected);
	});

	test('Should not touch re-export statements', async () => {
		const initial = `export { a } from './module';${EOL}console.log('hello');`;
		const expected = `export { a } from './module';${EOL}console.log('hello');`;
		await testCommand(initial, expected);
	});

	test('Should handle complex mixed imports with aliases', async () => {
		const initial = `import Def, { a as a_alias, b, c } from './module';${EOL}console.log(a_alias, c);`;
		const expected = `import { a as a_alias, c } from './module';${EOL}console.log(a_alias, c);`;
		await testCommand(initial, expected);
	});

	test('Should remove entire multi-line import if all specifiers are unused', async () => {
		const initial = `import {
				MessageSquarePlus,
				MessageSquare,
				MessageSquareX,
			} from 'lucide-react';${EOL}console.log('hello');`;
		const expected = `console.log('hello');`;
		await testCommand(initial, expected);
	});

	test('Should remove import if used only as an object property name', async () => {
		const initial = `import { Name } from './module';${EOL}const obj = { Name: 'value' };`;
		const expected = `const obj = { Name: 'value' };`;
		await testCommand(initial, expected);
	});

	test('Should NOT remove import if used as a shorthand property', async () => {
		const initial = `import { Name } from './module';${EOL}const obj = { Name };`;
		const expected = `import { Name } from './module';${EOL}const obj = { Name };`;
		await testCommand(initial, expected);
	});

	test('Should keep Angular imports used in decorators', async () => {
		const initial = `
          import { Component, Injectable } from '@angular/core';
          
          @Component({
            selector: 'app-root',
            template: '<div></div>'
          })
          @Injectable()
          export class AppComponent {}
        `;
		const expected = initial; // Expect no changes
		await testCommand(initial, expected);
	});

	test('Should keep Vue imports used in components object', async () => {
		const initial = `
          import { ref, computed } from 'vue';
          import MyComponent from './MyComponent.vue';
    
          export default {
            components: {
              MyComponent
            },
            setup() {
              const count = ref(0);
              const double = computed(() => count.value * 2);
              return { count, double };
            }
          }
        `;
		const expected = initial; // Expect no changes
		await testCommand(initial, expected);
	});

	test('Should keep Svelte imports used in stores and transitions', async () => {
		const initial = `
          import { writable } from 'svelte/store';
          import { fade } from 'svelte/transition';
    
          const count = writable(0);
          
          <div transition:fade>
            {$count}
          </div>
        `;
		const expected = initial; // Expect no changes
		await testCommand(initial, expected);
	});

	test('Should keep Next.js imports used in data fetching functions', async () => {
		const initial = `
          import { GetStaticProps, GetStaticPaths } from 'next';
          
          export const getStaticProps: GetStaticProps = async () => {
            return { props: {} }
          }
          
          export const getStaticPaths: GetStaticPaths = async () => {
            return { paths: [], fallback: false }
          }
        `;
		const expected = initial; // Expect no changes
		await testCommand(initial, expected);
	});

	test('Should keep GraphQL imports used in tagged template literals', async () => {
		const initial = `
			import { gql } from 'graphql-tag';
			
			const QUERY = gql\`
				query GetUser {	
					user {
						id
					}
				}
		\`;
`;
		const expected = initial; // Expect no changes
		await testCommand(initial, expected);
	});
});