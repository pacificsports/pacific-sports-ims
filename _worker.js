export default {
  async fetch(request, env) {
    const response = await env.ASSETS.fetch(request);
    
    const contentType = response.headers.get('content-type') || '';
    const url = new URL(request.url);
    
    if (
      contentType.includes('text/html') || 
      url.pathname === '/' || 
      url.pathname.endsWith('/index.html') ||
      url.pathname.endsWith('.html')
    ) {
      const newResp = new Response(response.body, response);
      newResp.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
      newResp.headers.set('Pragma', 'no-cache');
      newResp.headers.set('Expires', '0');
      newResp.headers.set('Surrogate-Control', 'no-store');
      newResp.headers.set('CDN-Cache-Control', 'no-store');
      newResp.headers.set('Cloudflare-CDN-Cache-Control', 'no-store');
      return newResp;
    }
    
    return response;
  }
};
