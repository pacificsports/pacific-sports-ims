export default {
  async fetch(request, env) {
    // 기본 자산 가져오기
    const response = await env.ASSETS.fetch(request);
    
    // HTML 파일이면 절대 캐시 안 함
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('text/html') || request.url.endsWith('/') || request.url.endsWith('/index.html')) {
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
