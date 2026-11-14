import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,join} from 'node:path';
const root=join(dirname(fileURLToPath(import.meta.url)),'..');
test('vetted WebAuthn package declared but activation remains blocked',()=>{
 const pkg=JSON.parse(readFileSync(join(root,'package.json'),'utf8'));
 assert.ok(pkg.dependencies?.['@simplewebauthn/server']);
 assert.equal(existsSync(join(root,'package-lock.json')),false,
  'When dependency installation is prepared, update this test to validate the committed lockfile');
});
