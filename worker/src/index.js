const UPSTREAM = 'https://hq.mega.dev/challenges/show-me-when/api';

function corsHeaders(origin, boardOrigin) {
  return {
    'Access-Control-Allow-Origin': origin === boardOrigin ? boardOrigin : 'null',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Cache-Control': 'no-store',
    Vary: 'Origin',
  };
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const headers = corsHeaders(origin, env.BOARD_ORIGIN);
    if (origin && origin !== env.BOARD_ORIGIN) {
      return new Response('forbidden origin', { status: 403, headers });
    }
    if (request.method === 'OPTIONS') return new Response(null, { headers });
    if (request.method !== 'GET') return new Response('method not allowed', { status: 405, headers });

    const incoming = new URL(request.url);
    if (!['/incidents', '/ack'].includes(incoming.pathname)) {
      return new Response('not found', { status: 404, headers });
    }

    const upstream = new URL(`${UPSTREAM}${incoming.pathname}`);
    upstream.searchParams.set('t', env.CHALLENGE_SESSION);
    for (const key of ['since', 'id', 'cursor']) {
      const value = incoming.searchParams.get(key);
      if (value) upstream.searchParams.set(key, value);
    }

    const response = await fetch(upstream, { method: 'GET' });
    return new Response(response.body, {
      status: response.status,
      headers: {
        ...headers,
        'Content-Type': response.headers.get('Content-Type') || 'application/json',
      },
    });
  },
};
