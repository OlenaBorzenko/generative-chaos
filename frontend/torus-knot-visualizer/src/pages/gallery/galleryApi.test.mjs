import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import ts from 'typescript';

const source = readFileSync(new URL('./galleryApi.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const module = { exports: {} };
new Function('module', 'exports', compiled)(module, module.exports);
const { fetchGallery, deleteGalleryDesign } = module.exports;

test('delete encodes IDs and reports missing designs and errors', async () => {
  const requests = [];
  globalThis.fetch = async (url, options) => {
    requests.push({ url, options });
    return new Response(null, { status: 204 });
  };
  await deleteGalleryDesign('a/b');
  assert.match(requests[0].url, /designs\/a%2Fb$/);
  assert.equal(requests[0].options.method, 'DELETE');
  globalThis.fetch = async () => new Response(null, { status: 404 });
  await assert.rejects(deleteGalleryDesign('gone'), /no longer exists/);
  globalThis.fetch = async () => new Response(null, { status: 500 });
  await assert.rejects(deleteGalleryDesign('error'), /Could not delete/);
});

test('reloading the visible prefix after deletion fills the last page', async () => {
  const designs = Array.from({ length: 11 }, (_, i) => ({ id: String(i) }));
  globalThis.fetch = async (url) => {
    const limit = Number(new URL(url).searchParams.get('pageSize'));
    return Response.json(designs.slice(0, limit));
  };
  assert.equal((await fetchGallery(20)).length, 11);
  designs.splice(0, 1);
  assert.deepEqual((await fetchGallery(20)).map((design) => design.id), designs.map((design) => design.id));
});
