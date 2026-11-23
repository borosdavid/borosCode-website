const publicOrigin = 'https://boroscode.com';
const application = '/otthontar';
const tunnelOrigin = 'https://otthontar-origin.boroscode.com';
const applicationPath = /^\/(?:otthontar\/(?:$|(?:leltar|api|auth|icons)(?:\/|$)|(?:login|logout|offline\.html|inventory\.(?:js|css)|auth\.js|photo-input\.js|pwa\.js|sw\.js|manifest\.webmanifest)$))/;
const requestHeaders = [
    'accept', 'accept-language', 'content-type', 'origin', 'range', 'sec-fetch-site',
    'x-csrf-token', 'x-otthontar-request', 'x-otthontar-user', 'x-otthontar-save-id',
];

function unavailable(status = 503) {
    return new Response('Az Otthontár jelenleg nem érhető el. Próbáld meg később.', {
        status,
        headers: {
            'Cache-Control': 'no-store',
            'Content-Type': 'text/plain; charset=UTF-8',
        },
    });
}

export default {
    async fetch(request, env) {
        const url = new URL(request.url);
        if (url.pathname !== application && !url.pathname.startsWith(application + '/')) {
            return env.ASSETS.fetch(request);
        }
        if (url.origin !== publicOrigin) return unavailable(404);

        if (url.pathname === application) {
            url.pathname += '/';
            return Response.redirect(url, 308);
        }
        if (!applicationPath.test(url.pathname)) return unavailable(404);
        if (!env.OTTHONTAR_ACCESS_CLIENT_ID || !env.OTTHONTAR_ACCESS_CLIENT_SECRET) {
            return unavailable();
        }

        const upstreamUrl = new URL(tunnelOrigin);
        upstreamUrl.pathname = url.pathname;
        upstreamUrl.search = url.search;
        const headers = new Headers();
        for (const name of requestHeaders) {
            const value = request.headers.get(name);
            if (value !== null) headers.set(name, value);
        }
        const session = request.headers.get('Cookie')?.split(';')
            .map(cookie => cookie.trim()).filter(cookie => cookie.startsWith('JSESSIONID='));
        if (session?.length === 1) headers.set('Cookie', session[0]);
        headers.set('CF-Access-Client-Id', env.OTTHONTAR_ACCESS_CLIENT_ID);
        headers.set('CF-Access-Client-Secret', env.OTTHONTAR_ACCESS_CLIENT_SECRET);

        let upstream;
        try {
            upstream = await fetch(upstreamUrl, {
                method: request.method,
                headers,
                body: request.body,
                redirect: 'manual',
                cache: 'no-store',
            });
        } catch {
            return unavailable();
        }

        const responseHeaders = new Headers(upstream.headers);
        responseHeaders.set('Cache-Control', 'no-store');
        responseHeaders.delete('Set-Cookie');
        for (const cookie of upstream.headers.getAll?.('Set-Cookie') ?? upstream.headers.getSetCookie()) {
            if (cookie.startsWith('JSESSIONID=')) responseHeaders.append('Set-Cookie', cookie);
        }
        const location = responseHeaders.get('Location');
        if (location) {
            // Keep login and logout on the public path. Never follow an upstream redirect with credentials.
            let target;
            try {
                target = new URL(location, url);
            } catch {
                return unavailable();
            }
            if (![publicOrigin, tunnelOrigin].includes(target.origin) ||
                !target.pathname.startsWith(application + '/')) return unavailable();
            responseHeaders.set('Location', target.pathname + target.search + target.hash);
        }
        return new Response(upstream.body, {
            status: upstream.status,
            headers: responseHeaders,
        });
    },
};
