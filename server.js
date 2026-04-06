const http = require('http');
const https = require('https');
const url = require('url');

// Configuration
const ORIGINAL_HOST = "plu001.myturn1.top:8088";
const TARGET_BASE = `https://${ORIGINAL_HOST}/live/webcrichindi/`;
const PLAYLIST_URL = TARGET_BASE + "playlist.m3u8?vidictid=205474799473&id=119771&pk=b8522cf8e97336b762c8b9761a52c0d68f3d92020de5e3a97f648f3f12711144ab4e503d360532b216fc37acf43f56a5549ccfbb520e354c6eca6b94ad4516a9";
const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Range, Content-Type, Accept');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const isPlaylist = parsedUrl.pathname === '/proxy.m3u8' || parsedUrl.pathname === '/';
  // If not playlist, it's a segment request (e.g., /chunk_123.ts)
  const targetUrl = isPlaylist ? PLAYLIST_URL : TARGET_BASE + parsedUrl.pathname.replace(/^\//, '');

  console.log(`[PROXY] Request: ${parsedUrl.pathname} -> Targeting: ${targetUrl}`);

  const options = {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Referer': 'https://www.google.com/',
      'Origin': 'https://www.google.com/'
    }
  };

  https.get(targetUrl, options, (remoteRes) => {
    if (isPlaylist) {
      let body = '';
      remoteRes.on('data', chunk => body += chunk);
      remoteRes.on('end', () => {
        // REWRITE LOGIC: Convert absolute links to original server into relative proxy links
        // This forces the player to fetch segments (.ts) through YOUR Render server
        const rewritten = body.replace(new RegExp(`https://${ORIGINAL_HOST}/live/webcrichindi/`, 'g'), '/');
        res.writeHead(200, { 'Content-Type': 'application/vnd.apple.mpegurl' });
        res.end(rewritten);
      });
    } else {
      // Relaying Segment (.ts) or Key files
      res.writeHead(remoteRes.statusCode, remoteRes.headers);
      remoteRes.pipe(res);
    }
  }).on('error', (err) => {
    console.error('[ERROR]', err.message);
    res.writeHead(502);
    res.end("Proxy Gateway Error");
  });
});

server.listen(PORT, () => console.log(`✅ HLS Proxy running on ${PORT}`));
