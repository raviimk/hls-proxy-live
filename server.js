const http = require('http');
const https = require('https');
const url = require('url');

const BASE = "https://plu001.myturn1.top:8088";
const PLAYLIST = "/live/webcrichindi/playlist.m3u8?vidictid=205474799473&id=119771&pk=b8522cf8e97336b762c8b9761a52c0d68f3d92020de5e3a97f648f3f12711144ab4e503d360532b216fc37acf43f56a5549ccfbb520e354c6eca6b94ad4516a9";

const PORT = process.env.PORT || 3000;

// 🔥 fetch helper
function fetchUrl(targetUrl, res, rewrite = false) {
  https.get(targetUrl, (proxyRes) => {

    let chunks = [];

    proxyRes.on("data", chunk => chunks.push(chunk));

    proxyRes.on("end", () => {
      const buffer = Buffer.concat(chunks);
      const contentType = proxyRes.headers["content-type"] || "";

      // 🎯 Playlist rewrite
      if (rewrite && contentType.includes("mpegurl")) {
        let body = buffer.toString();

        body = body.replace(/(.*\.ts.*)/g, (match) => {
          const fullUrl = match.startsWith("http") ? match : BASE + "/live/webcrichindi/" + match;
          return `/proxy?url=${encodeURIComponent(fullUrl)}`;
        });

        res.writeHead(200, {
          "Content-Type": "application/vnd.apple.mpegurl",
          "Access-Control-Allow-Origin": "*"
        });

        res.end(body);
      } else {
        // 🎯 video segments
        res.writeHead(200, {
          ...proxyRes.headers,
          "Access-Control-Allow-Origin": "*"
        });

        res.end(buffer);
      }
    });

  }).on("error", () => {
    res.writeHead(500);
    res.end("Error fetching");
  });
}

// 🚀 server
const server = http.createServer((req, res) => {
  const parsed = url.parse(req.url, true);

  // health
  if (parsed.pathname === "/" || parsed.pathname === "/health") {
    res.writeHead(200);
    res.end("Proxy running ✅");
    return;
  }

  // 🎯 main playlist
  if (parsed.pathname === "/stream.m3u8") {
    fetchUrl(BASE + PLAYLIST, res, true);
    return;
  }

  // 🎯 proxy segments
  if (parsed.pathname === "/proxy") {
    const target = parsed.query.url;
    if (!target) return res.end("No URL");

    fetchUrl(target, res, false);
    return;
  }

  res.writeHead(404);
  res.end("Not found");
});

server.listen(PORT, () => {
  console.log("🚀 Proxy running on port", PORT);
});
