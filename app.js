// DropShare Meeting Mode: server-backed links + QR Share + ChimeShare (sound sends code)

const KEY_NAME = "dropshare_name_v1";

const nameInput = document.getElementById("nameInput");
const saveNameBtn = document.getElementById("saveNameBtn");
const nameStatus = document.getElementById("nameStatus");

const linkUrl = document.getElementById("linkUrl");
const linkTitle = document.getElementById("linkTitle");
const linkTags = document.getElementById("linkTags");
const linkDesc = document.getElementById("linkDesc");
const postLinkBtn = document.getElementById("postLinkBtn");
const clearLinkBtn = document.getElementById("clearLinkBtn");
const postStatus = document.getElementById("postStatus");

const codeInput = document.getElementById("codeInput");
const showQrBtn = document.getElementById("showQrBtn");
const hideQrBtn = document.getElementById("hideQrBtn");
const qrWrap = document.getElementById("qrWrap");
const qrCanvas = document.getElementById("qrCanvas");
const broadcastStatus = document.getElementById("broadcastStatus");

const playChimeBtn = document.getElementById("playChimeBtn");
const stopChimeBtn = document.getElementById("stopChimeBtn");

const listenBtn = document.getElementById("listenBtn");
const stopListenBtn = document.getElementById("stopListenBtn");
const decodedCode = document.getElementById("decodedCode");
const openFromCodeBtn = document.getElementById("openFromCodeBtn");
const receiveStatus = document.getElementById("receiveStatus");

const searchInput = document.getElementById("searchInput");
const refreshBtn = document.getElementById("refreshBtn");
const clearAllBtn = document.getElementById("clearAllBtn");
const feedGrid = document.getElementById("feedGrid");

function escapeHtml(str){
  return String(str).replace(/[&<>"']/g, s => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[s]));
}
function parseTags(str){
  return str.split(",").map(s => s.trim()).filter(Boolean).slice(0,10);
}
function normalizeCode(code){
  return String(code || "").trim().toUpperCase();
}
function formatTimeAgo(ts){
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if(mins < 60) return `${Math.max(1, mins)}m ago`;
  const hrs = Math.floor(mins / 60);
  if(hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function loadName(){
  return localStorage.getItem(KEY_NAME) || "";
}
function saveName(name){
  localStorage.setItem(KEY_NAME, name);
}

function refreshNameUI(){
  const n = loadName();
  nameInput.value = n;
  postLinkBtn.disabled = !n;
  nameStatus.innerHTML = n
    ? `<strong>Status:</strong> Ready as <strong>${escapeHtml(n)}</strong>.`
    : `<strong>Status:</strong> Set your name to post links.`;
}
saveNameBtn.addEventListener("click", () => {
  const n = nameInput.value.trim();
  if(!n){
    nameStatus.innerHTML = `<strong>Status:</strong> Please enter a name.`;
    return;
  }
  saveName(n);
  refreshNameUI();
});

clearLinkBtn.addEventListener("click", () => {
  linkUrl.value = "";
  linkTitle.value = "";
  linkTags.value = "";
  linkDesc.value = "";
});

async function api(path, opts){
  const res = await fetch(path, opts);
  const data = await res.json().catch(() => ({}));
  if(!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

postLinkBtn.addEventListener("click", async () => {
  const author = loadName();
  if(!author) return;

  const url = linkUrl.value.trim();
  const title = linkTitle.value.trim();
  if(!url || !title){
    postStatus.innerHTML = "<strong>Status:</strong> Add a URL and a title.";
    return;
  }

  try{
    const data = await api("/api/posts/link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url,
        title,
        tags: parseTags(linkTags.value),
        desc: linkDesc.value.trim(),
        author
      })
    });

    const code = data.post.shareCode;
    postStatus.innerHTML = `<strong>Status:</strong> Posted. Share code: <strong>${escapeHtml(code)}</strong>`;
    codeInput.value = code;
    decodedCode.value = code;
    await renderFeed();
    window.location.hash = "#broadcast";
  }catch(e){
    postStatus.innerHTML = `<strong>Status:</strong> ${escapeHtml(e.message)}`;
  }
});

// ---------- QR Share ----------
function buildReceiveUrl(code){
  // when scanned, opens same site and auto-loads code + opens link
  const u = new URL(window.location.href);
  u.hash = "";
  u.searchParams.set("code", normalizeCode(code));
  return u.toString();
}

showQrBtn.addEventListener("click", async () => {
  const code = normalizeCode(codeInput.value);
  if(!/^DS-[0-9A-Z]{6}$/.test(code)){
    broadcastStatus.innerHTML = "<strong>Status:</strong> Enter a valid code like <strong>DS-3F9KQ2</strong>.";
    return;
  }

  const receiveUrl = buildReceiveUrl(code);
  qrWrap.classList.remove("hidden");
  hideQrBtn.disabled = false;

  // Generate QR into canvas (using qrcode library)
  await QRCode.toCanvas(qrCanvas, receiveUrl, { width: 240, margin: 1 });

  broadcastStatus.innerHTML =
    `<strong>Status:</strong> QR ready for <strong>${escapeHtml(code)}</strong>. People scan to open instantly.`;
});

hideQrBtn.addEventListener("click", () => {
  qrWrap.classList.add("hidden");
  hideQrBtn.disabled = true;
  broadcastStatus.innerHTML = "<strong>Status:</strong> QR hidden.";
});

// ---------- Open by code (receiver) ----------
async function openByCode(code){
  const c = normalizeCode(code);
  if(!/^DS-[0-9A-Z]{6}$/.test(c)){
    receiveStatus.innerHTML = "<strong>Status:</strong> Enter a valid code like DS-3F9KQ2.";
    return;
  }

  receiveStatus.innerHTML = "<strong>Status:</strong> Looking up link...";
  try{
    const data = await api(`/api/posts/${encodeURIComponent(c)}`);
    const post = data.post;
    receiveStatus.innerHTML = `<strong>Status:</strong> Opening <strong>${escapeHtml(post.title)}</strong>...`;
    window.open(post.url, "_blank", "noopener");
  }catch(e){
    receiveStatus.innerHTML = `<strong>Status:</strong> ${escapeHtml(e.message)} (code not found)`;
  }
}

openFromCodeBtn.addEventListener("click", () => openByCode(decodedCode.value));

// Auto-open when QR includes ?code=...
(function autoFromQuery(){
  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");
  if(code){
    decodedCode.value = normalizeCode(code);
    codeInput.value = normalizeCode(code);
    // optional: auto-open
    openByCode(code);
  }
})();

// ---------- Feed ----------
async function renderFeed(){
  const q = (searchInput.value || "").trim().toLowerCase();
  feedGrid.innerHTML = "";

  try{
    const data = await api("/api/posts");
    let posts = data.posts || [];

    if(q){
      posts = posts.filter(p => {
        const hay = `${p.title} ${p.desc||""} ${(p.tags||[]).join(" ")} ${p.shareCode}`.toLowerCase();
        return hay.includes(q);
      });
    }

    if(!posts.length){
      feedGrid.innerHTML = `<div class="callout"><strong>No posts.</strong> Post a link above.</div>`;
      return;
    }

    for(const post of posts){
      const tags = (post.tags||[]).map(t => `<span class="badge">${escapeHtml(t)}</span>`).join("");
      const card = document.createElement("div");
      card.className = "card";
      card.innerHTML = `
        <div style="font-weight:900; display:flex; justify-content:space-between; gap:10px;">
          <span>${escapeHtml(post.title)}</span>
          <span class="badge">Link</span>
        </div>
        <div class="meta">
          By <strong>${escapeHtml(post.author)}</strong> • ${formatTimeAgo(post.createdAt)} • Code: <strong>${escapeHtml(post.shareCode)}</strong>
        </div>
        <div class="badges">${tags}</div>
        <div class="meta" style="margin-top:10px;">${escapeHtml(post.desc || "")}</div>
        <div class="card-actions">
          <button class="small-btn" data-action="use" data-code="${escapeHtml(post.shareCode)}">Use code</button>
          <button class="small-btn" data-action="qr" data-code="${escapeHtml(post.shareCode)}">Show QR</button>
          <button class="small-btn" data-action="chime" data-code="${escapeHtml(post.shareCode)}">Play chime</button>
          <a class="small-btn" href="${escapeHtml(post.url)}" target="_blank" rel="noopener">Open link</a>
        </div>
      `;
      card.addEventListener("click", (e) => {
        const btn = e.target.closest("[data-action]");
        if(!btn) return;
        const code = btn.dataset.code;
        const action = btn.dataset.action;

        codeInput.value = code;
        decodedCode.value = code;

        if(action === "use"){
          window.location.hash = "#broadcast";
          broadcastStatus.innerHTML = `<strong>Status:</strong> Loaded <strong>${escapeHtml(code)}</strong>.`;
        }
        if(action === "qr"){
          window.location.hash = "#broadcast";
          showQrBtn.click();
        }
        if(action === "chime"){
          window.location.hash = "#broadcast";
          playChimeForCode(code);
        }
      });

      feedGrid.appendChild(card);
    }
  }catch(e){
    feedGrid.innerHTML = `<div class="callout"><strong>Error:</strong> ${escapeHtml(e.message)}</div>`;
  }
}

refreshBtn.addEventListener("click", renderFeed);
searchInput.addEventListener("input", renderFeed);

clearAllBtn.addEventListener("click", async () => {
  try{
    await api("/api/posts", { method: "DELETE" });
    await renderFeed();
  }catch(e){
    alert(e.message);
  }
});

// ---------- ChimeShare (sound sends code only) ----------
const SYMBOLS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const START_FREQ = 900;
const END_FREQ = 1800;
const BASE_FREQ = 1000;
const STEP = 20;
const TONE_MS = 180;
const GAP_MS = 70;
const TOLERANCE = 35;

let audioCtx = null;
let chimeStopFlag = false;

function getAudioCtx(){
  if(!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}
function sleep(ms){ return new Promise(r => setTimeout(r, ms)); }

async function playTone(freq, ms){
  const ctx = getAudioCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  gain.gain.value = 0.0001;
  osc.type = "sine";
  osc.frequency.value = freq;
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  const now = ctx.currentTime;
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.linearRampToValueAtTime(0.12, now + 0.02);
  gain.gain.linearRampToValueAtTime(0.0001, now + ms/1000);
  await sleep(ms);
  osc.stop();
}

function payloadFromCode(code){
  const c = normalizeCode(code);
  const m = c.match(/^DS-([0-9A-Z]{6})$/);
  return m ? m[1] : null;
}

async function playChimeForCode(code){
  chimeStopFlag = false;
  stopChimeBtn.disabled = false;
  playChimeBtn.disabled = true;

  const payload = payloadFromCode(code);
  if(!payload){
    broadcastStatus.innerHTML = "<strong>Status:</strong> Enter valid code DS-XXXXXX.";
    stopChimeBtn.disabled = true;
    playChimeBtn.disabled = false;
    return;
  }

  broadcastStatus.innerHTML = `<strong>Status:</strong> Playing chime for <strong>DS-${escapeHtml(payload)}</strong>...`;

  await playTone(START_FREQ, 220);
  await sleep(GAP_MS);

  for(const ch of payload){
    if(chimeStopFlag) break;
    const idx = SYMBOLS.indexOf(ch);
    const freq = BASE_FREQ + idx * STEP;
    await playTone(freq, TONE_MS);
    await sleep(GAP_MS);
  }

  if(!chimeStopFlag) await playTone(END_FREQ, 220);

  stopChimeBtn.disabled = true;
  playChimeBtn.disabled = false;
  broadcastStatus.innerHTML = `<strong>Status:</strong> Done: <strong>DS-${escapeHtml(payload)}</strong>`;
}

playChimeBtn.addEventListener("click", () => playChimeForCode(codeInput.value));
stopChimeBtn.addEventListener("click", () => {
  chimeStopFlag = true;
  stopChimeBtn.disabled = true;
  playChimeBtn.disabled = false;
  broadcastStatus.innerHTML = "<strong>Status:</strong> Stopped.";
});

// ---------- Listen & decode (basic demo) ----------
let mediaStream = null;
let analyser = null;
let rafId = null;
let listening = false;
let decodedChars = [];
let lastHitAt = 0;
let sawStart = false;

function nearestSymbolFromFreq(freq){
  const idx = Math.round((freq - BASE_FREQ) / STEP);
  if(idx < 0 || idx >= SYMBOLS.length) return null;
  const target = BASE_FREQ + idx * STEP;
  if(Math.abs(freq - target) > TOLERANCE) return null;
  return SYMBOLS[idx];
}
function peakFrequencyHz(analyserNode, ctx){
  const buffer = new Uint8Array(analyserNode.frequencyBinCount);
  analyserNode.getByteFrequencyData(buffer);
  let max = -1, maxIndex = 0;
  for(let i=0;i<buffer.length;i++){
    if(buffer[i] > max){ max = buffer[i]; maxIndex = i; }
  }
  const nyquist = ctx.sampleRate / 2;
  const freq = (maxIndex / buffer.length) * nyquist;
  return { freq, strength: max };
}
function isNear(freq, target){ return Math.abs(freq - target) <= TOLERANCE; }

async function startListening(){
  decodedChars = [];
  lastHitAt = 0;
  sawStart = false;

  listenBtn.disabled = true;
  stopListenBtn.disabled = false;

  const ctx = getAudioCtx();
  try{
    mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  }catch{
    receiveStatus.innerHTML = "<strong>Status:</strong> Microphone denied.";
    listenBtn.disabled = false;
    stopListenBtn.disabled = true;
    return;
  }

  const source = ctx.createMediaStreamSource(mediaStream);
  analyser = ctx.createAnalyser();
  analyser.fftSize = 4096;
  analyser.smoothingTimeConstant = 0.2;
  source.connect(analyser);

  listening = true;
  receiveStatus.innerHTML = "<strong>Status:</strong> Listening...";

  const tick = () => {
    if(!listening) return;

    const { freq, strength } = peakFrequencyHz(analyser, ctx);
    const now = Date.now();

    if(strength > 110){
      if(!sawStart && isNear(freq, START_FREQ)){
        sawStart = true;
        decodedChars = [];
        lastHitAt = now;
        receiveStatus.innerHTML = "<strong>Status:</strong> Start detected. Decoding...";
      }

      if(sawStart){
        if(isNear(freq, END_FREQ)){
          stopListening();
          const payload = decodedChars.join("").slice(0,6);
          if(payload.length === 6){
            decodedCode.value = `DS-${payload}`;
            codeInput.value = `DS-${payload}`;
            receiveStatus.innerHTML = `<strong>Status:</strong> Decoded <strong>DS-${escapeHtml(payload)}</strong>.`;
          }else{
            receiveStatus.innerHTML = "<strong>Status:</strong> Decoded incomplete. Try again closer/quieter.";
          }
          return;
        }

        if(now - lastHitAt > (TONE_MS + GAP_MS - 30) && decodedChars.length < 6){
          const sym = nearestSymbolFromFreq(freq);
          if(sym){
            decodedChars.push(sym);
            decodedCode.value = `DS-${decodedChars.join("")}`;
            lastHitAt = now;
          }
        }
      }
    }

    rafId = requestAnimationFrame(tick);
  };

  rafId = requestAnimationFrame(tick);
}

function stopListening(){
  listening = false;
  if(rafId) cancelAnimationFrame(rafId);
  rafId = null;

  if(mediaStream){
    mediaStream.getTracks().forEach(t => t.stop());
    mediaStream = null;
  }

  listenBtn.disabled = false;
  stopListenBtn.disabled = true;
}

listenBtn.addEventListener("click", startListening);
stopListenBtn.addEventListener("click", () => {
  stopListening();
  receiveStatus.innerHTML = "<strong>Status:</strong> Stopped listening.";
});

// Init
refreshNameUI();
renderFeed();
