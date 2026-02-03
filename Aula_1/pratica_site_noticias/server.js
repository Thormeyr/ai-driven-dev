const http = require("http");
const { createReadStream, existsSync } = require("fs");
const path = require("path");

const PORT = process.env.PORT || 8000;
const API_KEY = process.env.GNEWS_API_KEY;
const API_BASE = "https://gnews.io/api/v4/top-headlines";
const COUNTRY = "br";
const LANGUAGE = "pt";

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
};

const sendJson = (res, status, data) => {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(data));
};

const handleApi = async (req, res) => {
  if (!API_KEY) {
    sendJson(res, 500, { message: "Configure a variável GNEWS_API_KEY no servidor." });
    return;
  }

  const reqUrl = new URL(req.url, `http://${req.headers.host}`);
  const category = reqUrl.searchParams.get("category") || "general";
  const query = reqUrl.searchParams.get("q") || "";

  const apiUrl = new URL(API_BASE);
  apiUrl.searchParams.set("lang", LANGUAGE);
  apiUrl.searchParams.set("country", COUNTRY);
  apiUrl.searchParams.set("category", category);
  if (query) apiUrl.searchParams.set("q", query);
  apiUrl.searchParams.set("apikey", API_KEY);

  try {
    const response = await fetch(apiUrl);
    const data = await response.json();
    sendJson(res, response.status, data);
  } catch (error) {
    sendJson(res, 502, { message: "Falha ao conectar na API GNews." });
  }
};

const serveStatic = async (req, res) => {
  const reqUrl = new URL(req.url, `http://${req.headers.host}`);
  const pathname = reqUrl.pathname === "/" ? "/index.html" : reqUrl.pathname;
  const filePath = path.join(__dirname, pathname);

  if (!existsSync(filePath)) {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Arquivo não encontrado");
    return;
  }

  const ext = path.extname(filePath);
  const contentType = contentTypes[ext] || "application/octet-stream";
  res.writeHead(200, { "Content-Type": contentType });
  createReadStream(filePath).pipe(res);
};

const server = http.createServer((req, res) => {
  if (req.url?.startsWith("/api/news")) {
    handleApi(req, res);
    return;
  }

  serveStatic(req, res);
});

server.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
