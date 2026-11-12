const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const lock = require('../package-lock.json');
const manifest = require('../package.json');

test('committed dependency lock has no Replit-only download URLs', () => {
    assert.ok(!JSON.stringify(lock).includes('package-firewall.replit.internal'));
    assert.match(fs.readFileSync('.npmrc', 'utf8'), /omit-lockfile-registry-resolved=true/);
    for (const [name, entry] of Object.entries(lock.packages)) {
        if (!name) continue;
        assert.ok(entry.version, `Missing locked version: ${name}`);
        assert.match(entry.integrity, /^sha(?:1|256|384|512)-/, `Missing integrity: ${name}`);
    }
});

test('locked direct dependency specifications match the installation manifest', () => {
    assert.deepEqual(lock.packages[''].dependencies, manifest.dependencies);
    assert.deepEqual(lock.packages[''].devDependencies, manifest.devDependencies);
});
