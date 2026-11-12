(function (root, factory) {
    const api = factory(root);
    if (typeof module === 'object' && module.exports) module.exports = api;
    else root.SilverVyApi = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
    'use strict';
    function resolveBase(location, override) {
        if (typeof override === 'string') return override;
        // Preserve the original split Render deployment, without routing Replit requests there.
        return location && location.hostname === 'silvervy-frontend.onrender.com'
            ? 'https://silvervy-backend.onrender.com' : '';
    }
    function createClient({ baseUrl = '', fetchImpl = root.fetch.bind(root) } = {}) {
        const base = baseUrl.replace(/\/+$/, '');
        if (base) {
            const parsed = new URL(base);
            if (!['https:', 'http:'].includes(parsed.protocol) || parsed.username || parsed.password || parsed.search || parsed.hash) {
                throw new Error('Некорректный публичный адрес API');
            }
        }
        function url(path) {
            if (typeof path !== 'string' || !path.startsWith('/') || path.startsWith('//')) {
                throw new Error('Ожидается путь API от корня сайта');
            }
            return base + path;
        }
        async function request(path, options) {
            const response = await fetchImpl(url(path), options);
            if (response.status === 401 && response.clone) {
                const data = await response.clone().json().catch(() => ({}));
                if (/^AUTH_/.test(data.code || '')) {
                    try {
                        const sent = new Headers(options?.headers).get('Authorization');
                        if (sent === `Bearer ${root.localStorage.getItem('token')}`) {
                            root.localStorage.removeItem('token');
                            root.localStorage.removeItem('user');
                            root.dispatchEvent(new CustomEvent('silvervy:session-expired', { detail: data }));
                        }
                    } catch { /* Storage can be disabled; preserve the original response. */ }
                }
            }
            return response;
        }
        return { url, request };
    }
    const client = createClient({ baseUrl: resolveBase(root.location, root.SILVERVY_API_BASE) });
    return { ...client, createClient, resolveBase };
});
