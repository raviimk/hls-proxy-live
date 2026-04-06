const http = require('http');
const https = require('https');

const TARGET_URL = "https://plu001.myturn1.top:8088/live/webcrichindi/playlist.m3u8?vidictid=205474799473&id=119771&pk=b8522cf8e97336b762c8b9761a52c0d68f3d92020de5e3a97f648f3f12711144ab4e503d360532b216fc37acf43f56a5549ccfbb520e354c6eca6b94ad4516a9";

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {

  // ✅ Health check
  if (req.url === '/' || req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('HLS Proxy running ✅');
    return;
  }

  // ✅ Playlist route
  if (req.url === '/stream.m3u8') {
    https.get(TARGET_URL, (proxyRes) => {
      let data = [];

      proxyRes.on('data', chunk => data.push(chunk));

      proxyRes.on('end', () => {
        let body = Buffer.concat(data).toString();

        res.writeHead(200, {
          'Content-Type': 'application/vnd.apple.mpegurl',
          'Access-Control-Allow-Origin': '*'
        });

        res.end(body);
      });

    }).on('error', () => {
      res.writeHead(500);
      res.end('Error fetching playlist');
    });

    return;
  }

  // ❌ baaki sab block (abhi simple test ke liye)
  res.writeHead(404);
  res.end('Not found');

});

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
