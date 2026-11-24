import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../src/worker.js';

const env = {
  OTTHONTAR_ACCESS_CLIENT_ID: 'test-client-id',
  OTTHONTAR_ACCESS_CLIENT_SECRET: 'test-client-secret',
  ASSETS: { fetch: async () => new Response('main site', { status: 200 }) },
};
const hash = '05dd3b1888cc3bf8fbb4ec6e31139991';

async function invoke(path, options = {}) {
  const requests = [];
  const original = globalThis.fetch;
  globalThis.fetch = async (req, init) => {
    requests.push({ url: String(req), ...init });
    return new Response('origin asset', { status: 200, headers: { 'content-type': 'text/plain' } });
  };
  try {
    const response = await worker.fetch(new Request(`https://boroscode.com${path}`, options), env);
    return { response, requests };
  } finally {
    globalThis.fetch = original;
  }
}

test('forwards only listed static assets and 32-digit hexadecimal fingerprint variants', async () => {
  for (const file of [
    'inventory.css', `inventory-${hash}.css`,
    'inventory.js', `inventory-${hash}.js`,
    'auth.js', `auth-${hash}.js`,
    'photo-input.js', `photo-input-${hash}.js`,
    'pwa.js', `pwa-${hash}.js`,
    'sw.js', `sw-${hash}.js`,
    'manifest.webmanifest', `manifest-${hash}.webmanifest`,
  ]) {
    const { response, requests } = await invoke(`/otthontar/${file}`);
    assert.equal(response.status, 200, file);
    assert.equal(requests.length, 1, file);
    assert.equal(requests[0].url, `https://otthontar-origin.boroscode.com/otthontar/${file}`);
    assert.equal(requests[0].headers.get('CF-Access-Client-Id'), 'test-client-id');
    assert.equal(requests[0].headers.get('CF-Access-Client-Secret'), 'test-client-secret');
  }
});

test('rejects unknown, malformed and unrelated assets before contacting origin', async () => {
  for (const path of [
    '/otthontar/evil.js',
    '/otthontar/secrets.env',
    '/otthontar/inventory-123.css',
    '/otthontar/inventory-gggggggggggggggggggggggggggggggg.css',
    '/otthontar/inventory-05dd3b1888cc3bf8fbb4ec6e31139991.css/extra',
    `/otthontar/auth-${hash}.css`,
    `/otthontar/manifest-${hash}.js`,
    `/otthontar/other-${hash}.js`,
    '/otthontar/actuator/health',
    '/otthontar/admin',
  ]) {
    const { response, requests } = await invoke(path);
    assert.equal(response.status, 404, path);
    assert.equal(requests.length, 0, path);
  }
});

test('preserves application pages, auth and API routes', async () => {
  for (const path of [
    '/otthontar/', '/otthontar/login', '/otthontar/logout',
    '/otthontar/offline.html', '/otthontar/leltar',
    '/otthontar/api/items', '/otthontar/auth/csrf',
    '/otthontar/icons/icon-192.png',
  ]) {
    const { response, requests } = await invoke(path);
    assert.equal(response.status, 200, path);
    assert.equal(requests.length, 1, path);
  }
});

test('preserves invalid-origin and missing-credentials checks', async () => {
  const badOrigin = await worker.fetch(new Request('https://unknown.example/otthontar/inventory.css'), env);
  assert.equal(badOrigin.status, 404);
  const noCredentials = await worker.fetch(
    new Request('https://boroscode.com/otthontar/inventory.css'), { ASSETS: env.ASSETS },
  );
  assert.equal(noCredentials.status, 503);
});

test('does not forward extra client cookies or client-supplied service credentials', async () => {
  const { requests } = await invoke(`/otthontar/inventory-${hash}.css`, {
    headers: {
      Cookie: 'other=secret; JSESSIONID=active_session; tracking=1',
      'CF-Access-Client-Secret': 'attacker-provided',
      'X-CSRF-Token': 'valid-csrf',
    },
  });
  assert.equal(requests[0].headers.get('Cookie'), 'JSESSIONID=active_session');
  assert.equal(requests[0].headers.get('CF-Access-Client-Secret'), 'test-client-secret');
  assert.equal(requests[0].headers.get('X-CSRF-Token'), 'valid-csrf');
});
