const http = require('http');
const https = require('https');
const url = require('url');

const TARGET_URL = "https://plu001.myturn1.top:8088/live/webcrichindi/playlist.m3u8?vidictid=205474799473&id=119771&pk=b8522cf8e97336b762c8b9761a52c0d68f3d92020de5e3a97f648f3f12711144ab4e503d360532b216fc37acf43f56a5549ccfbb520e354c6eca6b94ad4516a9";

const PORT = process.env.PORT || 3000;

const proxyRequest = (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  let target = TARGET_URL;

  // Agar koi path ho toh usko handle karo (mostly root pe hi chalega)
  if (parsedUrl.pathname && parsedUrl.pathname !== '/') {
    console.log("Request for:", parsedUrl.pathname);
  }

  console.log(`[${new Date().toISOString()}] Proxying request from ${req.headers['user-agent'] || 'unknown'}`);

  const options = {
    method: req.method,
    headers: {
      ...req.headers,
      host: new URL(TARGET_URL).host,
      'User-Agent': 'Mozilla/5.0 (compatible; HLS-Proxy)'
    }
  };

  const proxyReq = https.request(target, options, (proxyRes) => {
    // CORS headers add karo (mobile browser ke liye zaroori)
    res.writeHead(proxyRes.statusCode || 200, {
      ...proxyRes.headers,
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Range, Content-Type, Accept'
    });

    proxyRes.pipe(res);
  });

  proxyReq.on('error', (err) => {
    console.error('Proxy Error:', err.message);
    res.writeHead(502);
    res.end('Proxy Error');
  });

  req.pipe(proxyReq);
};

// Simple health check
const server = http.createServer((req, res) => {
  if (req.url === '/health' || req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('HLS Proxy is running ✅\nUse: https://your-domain.onrender.com/proxy.m3u8');
    return;
  }
  proxyRequest(req, res);
});

server.listen(PORT, () => {
  console.log(`✅ HLS Proxy running on port ${PORT}`);
  console.log(`Target: ${TARGET_URL}`);
});
