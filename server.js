const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

const DATA_PATH = path.join(__dirname, "data.json");

function readData() {
  try { return JSON.parse(fs.readFileSync(DATA_PATH, "utf8")); }
  catch { return { posts: [] }; }
}
function writeData(data) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), "utf8");
}
function normalizeCode(code) {
  return String(code || "").trim().toUpperCase();
}
function makeShareCode(existing) {
  const A = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let code = "";
  do {
    let out = "";
    for (let i = 0; i < 6; i++) out += A[Math.floor(Math.random() * A.length)];
    code = `DS-${out}`;
  } while (existing.has(code));
  return code;
}

app.use(express.json({ limit: "12mb" }));
app.use(express.static(path.join(__dirname, "public")));

app.post("/api/posts/link", (req, res) => {
  const { title, url, tags, desc, author } = req.body || {};
  if (!title || !url) return res.status(400).json({ error: "Missing title or url" });

  const data = readData();
  const existing = new Set(data.posts.map(p => p.shareCode));
  const shareCode = makeShareCode(existing);

  const post = {
    id: String(Date.now()) + String(Math.floor(Math.random() * 1000)),
    type: "link",
    title: String(title).trim(),
    url: String(url).trim(),
    tags: Array.isArray(tags) ? tags.slice(0, 10) : [],
    desc: String(desc || "").trim(),
    author: String(author || "Anonymous").trim(),
    shareCode,
    createdAt: Date.now()
  };

  data.posts.unshift(post);
  writeData(data);
  res.json({ ok: true, post });
});

app.post("/api/posts/file", (req, res) => {
  const { title, fileName, mime, dataUrl, tags, desc, author } = req.body || {};
  if (!title || !dataUrl || !fileName) return res.status(400).json({ error: "Missing title/file" });

  const data = readData();
  const existing = new Set(data.posts.map(p => p.shareCode));
  const shareCode = makeShareCode(existing);

  const post = {
    id: String(Date.now()) + String(Math.floor(Math.random() * 1000)),
    type: "file",
    title: String(title).trim(),
    fileName: String(fileName).trim(),
    mime: String(mime || "application/octet-stream"),
    dataUrl: String(dataUrl),
    tags: Array.isArray(tags) ? tags.slice(0, 10) : [],
    desc: String(desc || "").trim(),
    author: String(author || "Anonymous").trim(),
    shareCode,
    createdAt: Date.now()
  };

  data.posts.unshift(post);
  writeData(data);
  res.json({ ok: true, post });
});

app.get("/api/posts/:code", (req, res) => {
  const code = normalizeCode(req.params.code);
  const data = readData();
  const post = data.posts.find(p => normalizeCode(p.shareCode) === code);
  if (!post) return res.status(404).json({ error: "Not found" });
  res.json({ ok: true, post });
});

app.get("/api/posts", (req, res) => {
  const data = readData();
  res.json({ ok: true, posts: data.posts.slice(0, 200) });
});

app.delete("/api/posts", (req, res) => {
  writeData({ posts: [] });
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`DropShare running on http://localhost:${PORT}`);
});
