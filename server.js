const http = require('http');
const https = require('https');
const url = require('url');

const PORT = process.env.PORT || 10000;
const ORIGINAL_HOST = "plu001.myturn1.top:8088";
const TARGET_BASE = `https://${ORIGINAL_HOST}/live/webcrichindi/`;
const PLAYLIST_URL = TARGET_BASE + "playlist.m3u8?vidictid=205474799473&id=119771&pk=b8522cf8e97336b762c8b9761a52c0d68f3d92020de5e3a97f648f3f12711144ab4e503d360532b216fc37acf43f56a5549ccfbb520e354c6eca6b94ad4516a9";

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);

  // Health check
  if (parsedUrl.pathname === '/' || parsedUrl.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end('<h1>HLS Proxy Active</h1><p>Use <b>/proxy.m3u8</b></p>');
    return;
  }

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Range, Content-Type, Accept');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const isPlaylist = parsedUrl.pathname === '/proxy.m3u8';

  const targetUrl = isPlaylist
    ? PLAYLIST_URL
    : TARGET_BASE + parsedUrl.pathname.replace(/^\//, '');

  const options = {
    headers: {
      'User-Agent': 'Mozilla/5.0',
      'Referer': 'https://plu001.myturn1.top/',
      'Origin': 'https://plu001.myturn1.top'
    },
    timeout: 15000
  };

  https.get(targetUrl, options, (remoteRes) => {

    if (isPlaylist) {
      let body = '';

      remoteRes.on('data', chunk => body += chunk);

      remoteRes.on('end', () => {

        // 🔥 FULL REWRITE FIX
        let rewritten = body
          // remove full URL
          .replace(/https?:\/\/[^\/]+\/live\/webcrichindi\//g, '/')
          // fix relative .ts paths
          .replace(/^([^#].*\.ts)$/gm, '/$1');

        res.writeHead(200, {
          'Content-Type': 'application/vnd.apple.mpegurl',
          'Access-Control-Allow-Origin': '*'
        });

        res.end(rewritten);
      });

    } else {
      // 🔥 FIX: FORCE CORS on segments
      res.writeHead(remoteRes.statusCode, {
        ...remoteRes.headers,
        'Access-Control-Allow-Origin': '*'
      });

      remoteRes.pipe(res);
    }

  }).on('error', (err) => {
    console.error('Proxy Error:', err.message);
    res.writeHead(502);
    res.end("Proxy Error");
  });

});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ HLS Proxy running on port ${PORT}`);
});
