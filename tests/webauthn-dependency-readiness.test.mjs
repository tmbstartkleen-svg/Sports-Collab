import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,join} from 'node:path';
const root=join(dirname(fileURLToPath(import.meta.url)),'..');
test('WebAuthn dependency is declared and any committed lockfile matches',()=>{
 const pkg=JSON.parse(readFileSync(join(root,'package.json'),'utf8'));
 const spec=pkg.dependencies?.['@simplewebauthn/server'];
 assert.ok(spec,'Vetted WebAuthn dependency must be declared');
 const lockPath=join(root,'package-lock.json');
 if(!existsSync(lockPath))return; // Not installation-ready; separate deployment gate required.
 const lock=JSON.parse(readFileSync(lockPath,'utf8'));
 assert.equal(lock.packages?.['']?.dependencies?.['@simplewebauthn/server'],spec);
 assert.ok(lock.packages?.['node_modules/@simplewebauthn/server']?.integrity,
  'Lockfile must include registry integrity metadata');
});
