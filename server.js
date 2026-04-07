const http = require('http');
const https = require('https');

const TARGET_URL = "https://plu001.myturn1.top:8088/live/webcrichindi/playlist.m3u8?vidictid=205474799473&id=119771&pk=b8522cf8e97336b762c8b9761a52c0d68f3d92020de5e3a97f648f3f12711144ab4e503d360532b216fc37acf43f56a5549ccfbb520e354c6eca6b94ad4516a9";

const server = http.createServer((req, res) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} | IP: ${req.socket.remoteAddress}`);

  // Health Check
  if (req.url === '/' || req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('✅ Advanced HLS Proxy is Running\n\nUse: https://hlsproxy-hs21.onrender.com/live.m3u8');
    return;
  }

  const options = {
    method: 'GET',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Mobile Safari/537.36',
      'Referer': 'https://go.webcric.com/watch-ipl-2026-in-hindi-live-cricket-streaming.htm',
      'Origin': 'https://go.webcric.com',
      'Accept': '*/*',
      'Accept-Language': 'en-US,en;q=0.9,hi;q=0.8',
      'Connection': 'keep-alive'
    }
  };

  https.get(TARGET_URL, options, (proxyRes) => {
    console.log(`→ Original Server Response: ${proxyRes.statusCode}`);

    // CORS headers for mobile browser
    res.writeHead(proxyRes.statusCode || 200, {
      ...proxyRes.headers,
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': '*',
      'Cache-Control': 'no-cache'
    });

    proxyRes.pipe(res);
  }).on('error', (err) => {
    console.error('Proxy Error:', err.message);
    res.writeHead(502);
    res.end('Proxy Error: Cannot reach original stream');
  });
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
  console.log(`🚀 Advanced HLS Proxy started on port ${PORT}`);
  console.log(`Target: ${TARGET_URL.substring(0, 100)}...`);
});
