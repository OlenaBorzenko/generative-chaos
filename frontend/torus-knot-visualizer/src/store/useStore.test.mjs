import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const storage = new Map();
globalThis.localStorage = {
  getItem: (key) => storage.get(key) ?? null,
  setItem: (key, value) => storage.set(key, value),
  removeItem: (key) => storage.delete(key),
};
globalThis.window = { localStorage: globalThis.localStorage };
const source = readFileSync(new URL('./useStore.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const module = { exports: {} };
new Function('require', 'module', 'exports', compiled)(require, module, module.exports);
const store = module.exports.default;
const response = (data, status = 200) => new Response(JSON.stringify(data), { status });
const design = (id) => ({ id, torusConfig: store.getState().newDesign.torusConfig });

test('generation and similarity remain parallel, and selected results can be fused', async () => {
  const pending = [];
  globalThis.fetch = (url, options) => new Promise((resolve) => pending.push({ url, options, resolve }));
  const work = store.getState().fetchAndSetDesigns('ocean');
  assert.equal(pending.length, 2);
  pending[0].resolve(response([design('related')]));
  pending[1].resolve(response(design('generated')));
  await work;
  assert.equal(store.getState().similarDesigns[0].id, 'related');
  store.getState().toggleFusionSelection('related');
  const fusion = store.getState().fuseDesigns();
  assert.deepEqual(JSON.parse(pending[2].options.body).similarDesignIds, ['related']);
  pending[2].resolve(response(design('fused')));
  await fusion;
  assert.equal(store.getState().fusedDesign.id, 'fused');
});

test('API errors are visible and never replace designs or related lists with error objects', async () => {
  globalThis.fetch = async (url) => url.includes('/similar/')
    ? response({ error: 'Search unavailable' }, 400)
    : response({ error: 'Invalid model output' }, 400);
  await store.getState().fetchAndSetDesigns('storm');
  assert.deepEqual(store.getState().similarDesigns, []);
  assert.equal(store.getState().similarityError, 'Search unavailable');
  assert.equal(store.getState().generationError, 'Invalid model output');
  assert.equal(store.getState().newDesign.id, 'generated');
  assert.equal(store.getState().isSearchingSimilar, false);
});

test('clear prevents late search and generation results from restoring stale designs', async () => {
  const pending = [];
  globalThis.fetch = () => new Promise((resolve) => pending.push(resolve));
  const work = store.getState().fetchAndSetDesigns('old prompt');
  store.getState().clearState();
  pending[0](response([design('stale')]));
  pending[1](response(design('stale')));
  await work;
  assert.equal(store.getState().newDesign.id, '');
  assert.deepEqual(store.getState().similarDesigns, []);
});

test('deleting clears cached references and filters late similarity results', async () => {
  const pending = [];
  globalThis.fetch = () => new Promise((resolve) => pending.push(resolve));
  store.getState().setNewDesign(design('source'));
  store.getState().setSelectedDesign(design('deleted'));
  store.getState().setSimilarDesigns([design('deleted'), design('remaining')]);
  store.getState().toggleFusionSelection('deleted');
  const work = store.getState().fetchAndSetDesigns('prompt');
  store.getState().removeDeletedDesign('deleted');
  pending[0](response([design('deleted'), design('remaining')]));
  pending[1](response(design('new')));
  await work;
  assert.equal(store.getState().selectedDesign.id, undefined);
  assert.deepEqual(store.getState().similarDesigns.map((item) => item.id), ['remaining']);
  assert.deepEqual(store.getState().fusionSelection, []);
});
