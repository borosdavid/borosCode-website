import assert from 'node:assert/strict';
import { test } from 'node:test';
import worker from '../src/worker.js';

const host = 'https://boroscode.com';
const env = {
    OTTHONTAR_ACCESS_CLIENT_ID: 'test-client',
    OTTHONTAR_ACCESS_CLIENT_SECRET: 'test-secret',
    ASSETS: { fetch: async () => new Response('BorosCode') },
};

test('the homepage stays static and only the canonical host serves Otthontár', async () => {
    assert.equal(await (await worker.fetch(new Request(host), env)).text(), 'BorosCode');
    const bare = await worker.fetch(new Request(host + '/otthontar?a=1'), env);
    assert.equal(bare.status, 308);
    assert.equal(bare.headers.get('Location'), host + '/otthontar/?a=1');
    assert.equal((await worker.fetch(new Request('https://preview.workers.dev/otthontar/'), env)).status, 404);
    assert.equal((await worker.fetch(new Request(host + '/otthontar/actuator/health'), env)).status, 404);
    assert.equal((await worker.fetch(new Request(host + '/otthontar/login'), {})).status, 503);
});

test('proxy keeps app paths, request body and session while keeping Access credentials server-side', async t => {
    t.mock.method(globalThis, 'fetch', async (url, options) => {
        assert.equal(url.href, 'https://otthontar-origin.boroscode.com/otthontar/login?a=1');
        assert.equal(options.redirect, 'manual');
        assert.equal(options.cache, 'no-store');
        assert.equal(options.method, 'POST');
        assert.equal(options.headers.get('Cookie'), 'JSESSIONID=old');
        assert.equal(options.headers.get('Origin'), host);
        assert.equal(options.headers.get('X-CSRF-TOKEN'), 'test-csrf');
        assert.equal(options.headers.get('CF-Access-Client-Id'), 'test-client');
        assert.equal(options.headers.get('CF-Access-Client-Secret'), 'test-secret');
        assert.equal(options.headers.get('X-Forwarded-Host'), null);
        assert.equal(await new Response(options.body).text(), 'username=user');
        const headers = new Headers({ Location: host + '/otthontar/leltar' });
        headers.append('Set-Cookie', 'CF_Authorization=origin-token; Secure');
        headers.append('Set-Cookie', 'JSESSIONID=new; Path=/otthontar; Secure; HttpOnly');
        return new Response(null, { status: 302, headers });
    });
    const response = await worker.fetch(new Request(host + '/otthontar/login?a=1', {
        method: 'POST',
        body: 'username=user',
        headers: {
            Cookie: 'CF_Authorization=browser-token; JSESSIONID=old',
            Origin: host,
            'X-CSRF-TOKEN': 'test-csrf',
            'CF-Access-Client-Id': 'supplied-by-browser',
            'X-Forwarded-Host': 'example.invalid',
        },
    }), env);
    assert.equal(response.status, 302);
    assert.equal(response.headers.get('Location'), '/otthontar/leltar');
    assert.equal(response.headers.get('Cache-Control'), 'no-store');
    assert.deepEqual(response.headers.getSetCookie(), ['JSESSIONID=new; Path=/otthontar; Secure; HttpOnly']);
});

test('the proxy does not follow an upstream redirect outside the application', async t => {
    const fetch = t.mock.method(globalThis, 'fetch', async () => Response.redirect('https://team.cloudflareaccess.com/', 302));
    const response = await worker.fetch(new Request(host + '/otthontar/login'), env);
    assert.equal(response.status, 503);
    assert.equal(response.headers.get('Location'), null);
    assert.equal(fetch.mock.callCount(), 1);
});
