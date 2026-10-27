export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const host = url.hostname.toLowerCase();

    // 1. Pass through API and Media directly to origin servers
    if (host === 'api.istora.online' || host === 'media.istora.online') {
      return fetch(request);
    }

    // 2. Route all store subdomains (*.istora.online) to the Cloudflare Pages deployment
    const targetUrl = new URL(request.url);
    targetUrl.hostname = 'istora-store.pages.dev';
    targetUrl.protocol = 'https:';

    const headers = new Headers(request.headers);
    headers.set('X-Forwarded-Host', host);

    const pagesRequest = new Request(targetUrl.toString(), {
      method: request.method,
      headers: headers,
      body: request.body,
      redirect: 'follow'
    });

    try {
      const response = await fetch(pagesRequest);
      // Return response with original status and headers
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers
      });
    } catch (err) {
      return new Response(`Store Gateway Error: ${err.message}`, { status: 502 });
    }
  }
};
