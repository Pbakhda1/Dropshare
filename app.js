// DropShare: server-backed links+files + QR share + ChimeShare + Voice commands (Round Table)

const KEY_NAME = "dropshare_name_v2";

const nameInput = document.getElementById("nameInput");
const saveNameBtn = document.getElementById("saveNameBtn");
const nameStatus = document.getElementById("nameStatus");

const postStatus = document.getElementById("postStatus");

// Tabs
const tabs = document.querySelectorAll(".tab");
const linkTab = document.getElementById("linkTab");
const fileTab = document.getElementById("fileTab");

// Link fields
const linkUrl = document.getElementById("linkUrl");
const linkTitle = document.getElementById("linkTitle");
const linkTags = document.getElementById("linkTags");
const linkDesc = document.getElementById("linkDesc");
const postLinkBtn = document.getElementById("postLinkBtn");
const clearLinkBtn = document.getElementById("clearLinkBtn");

// File fields
const fileInput = document.getElementById("fileInput");
const fileTitle = document.getElementById("fileTitle");
const fileTags = document.getElementById("fileTags");
const fileDesc = document.getElementById("fileDesc");
const postFileBtn = document.getElementById("postFileBtn");
const clearFileBtn = document.getElementById("clearFileBtn");

// Broadcast / receive
const activeCode = document.getElementById("activeCode");
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

// Voice
const voiceStartBtn = document.getElementById("voiceStartBtn");
const voiceStopBtn = document.getElementById("voiceStopBtn");
const voiceStatus = document.getElementById("voiceStatus");

// Feed
const searchInput = document.getElementById("searchInput");
const refreshBtn = document.getElementById("refreshBtn");
const clearAllBtn = document.getElementById("clearAllBtn");
const feedGrid = document.getElementById("feedGrid");

// ---------- Helpers ----------
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

function loadName(){ return localStorage.getItem(KEY_NAME) || ""; }
function saveName(name){ localStorage.setItem(KEY_NAME, name); }

function refreshNameUI(){
  const n = loadName();
  nameInput.value = n;
  const enabled = !!n;
  postLinkBtn.disabled = !enabled;
  postFileBtn.disabled = !enabled;
  nameStatus.innerHTML = enabled
    ? `<strong>Status:</strong> Ready as <strong>${escapeHtml(n)}</strong>.`
    : `<strong>Status:</strong> Set your name to share.`;
}

async function api(path, opts){
  const res = await fetch(path, opts);
  const data = await res.json().catch(()=>({}));
  if(!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

// ---------- Tabs ----------
tabs.forEach(t => {
  t.addEventListener("click", () => {
    tabs.forEach(x => x.classList.remove("active"));
    t.classList.add("active");
    const tab = t.dataset.tab;
    if(tab === "link"){
      linkTab.classList.remove("hidden");
      fileTab.classList.add("hidden");
    }else{
      fileTab.classList.remove("hidden");
      linkTab.classList.add("hidden");
    }
  });
});

// ---------- Name ----------
saveNameBtn.addEventListener("click", () => {
  const n = nameInput.value.trim();
  if(!n){
    nameStatus.innerHTML = "<strong>Status:</strong> Please enter a name.";
    return;
  }
  saveName(n);
  refreshNameUI();
});

// ---------- Link post ----------
clearLinkBtn.addEventListener("click", () => {
  linkUrl.value = ""; linkTitle.value = ""; linkTags.value = ""; linkDesc.value = "";
});

postLinkBtn.addEventListener("click", async () => {
  const author = loadName();
  if(!author) return;

  const url = linkUrl.value.trim();
  const title = linkTitle.value.trim();
  if(!url || !title){
    postStatus.innerHTML = "<strong>Status:</strong> Add URL + Title.";
    return;
  }

  try{
    const data = await api("/api/posts/link", {
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({
        url, title,
        tags: parseTags(linkTags.value),
        desc: linkDesc.value.trim(),
        author
      })
    });

    const code = data.post.shareCode;
    activeCode.value = code;
    decodedCode.value = code;
    postStatus.innerHTML = `<strong>Status:</strong> Posted. Code: <strong>${escapeHtml(code)}</strong>`;
    await renderFeed();
    window.location.hash = "#broadcast";
  }catch(e){
    postStatus.innerHTML = `<strong>Status:</strong> ${escapeHtml(e.message)}`;
  }
});

// ---------- File post ----------
clearFileBtn.addEventListener("click", () => {
  fileInput.value = ""; fileTitle.value = ""; fileTags.value = ""; fileDesc.value = "";
});

function readFileAsDataURL(file){
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

postFileBtn.addEventListener("click", async () => {
  const author = loadName();
  if(!author) return;

  const f = fileInput.files && fileInput.files[0];
  const title = fileTitle.value.trim();
  if(!f || !title){
    postStatus.innerHTML = "<strong>Status:</strong> Choose a file + Title.";
    return;
  }

  // keep small for demo
  if(f.size > 2 * 1024 * 1024){
    postStatus.innerHTML = "<strong>Status:</strong> Keep demo files under 2MB.";
    return;
  }

  try{
    const dataUrl = await readFileAsDataURL(f);
    const data = await api("/api/posts/file", {
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({
        title,
        fileName: f.name,
        mime: f.type || "application/octet-stream",
        dataUrl,
        tags: parseTags(fileTags.value),
        desc: fileDesc.value.trim(),
        author
      })
    });

    const code = data.post.shareCode;
    activeCode.value = code;
    decodedCode.value = code;
    postStatus.innerHTML = `<strong>Status:</strong> File posted. Code: <strong>${escapeHtml(code)}</strong>`;
    await renderFeed();
    window.location.hash = "#broadcast";
  }catch(e){
    postStatus.innerHTML = `<strong>Status:</strong> ${escapeHtml(e.message)}`;
  }
});

// ---------- QR Share ----------
function buildReceiveUrl(code){
  const u = new URL(window.location.href);
  u.hash = "#broadcast";
  u.searchParams.set("code", normalizeCode(code));
  return u.toString();
}

showQrBtn.addEventListener("click", async () => {
  const code = normalizeCode(activeCode.value || decodedCode.value);
  if(!/^DS-[0-9A-Z]{6}$/.test(code)){
    broadcastStatus.innerHTML = "<strong>Status:</strong> Load a valid code DS-XXXXXX first.";
    return;
  }

  const receiveUrl = buildReceiveUrl(code);
  qrWrap.classList.remove("hidden");
  hideQrBtn.disabled = false;

  await QRCode.toCanvas(qrCanvas, receiveUrl, { width: 240, margin: 1 });

  broadcastStatus.innerHTML =
    `<strong>Status:</strong> QR ready for <strong>${escapeHtml(code)}</strong>. People scan to receive.`;
});

hideQrBtn.addEventListener("click", () => {
  qrWrap.classList.add("hidden");
  hideQrBtn.disabled = true;
  broadcastStatus.innerHTML = "<strong>Status:</strong> QR hidden.";
});

// ---------- Receive by code ----------
function downloadDataUrl(filename, dataUrl){
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename || "dropshare-file";
  document.body.appendChild(a);
  a.click();
  a.remove();
}

async function openOrDownloadByCode(code){
  const c = normalizeCode(code);
  if(!/^DS-[0-9A-Z]{6}$/.test(c)){
    receiveStatus.innerHTML = "<strong>Status:</strong> Invalid code.";
    return;
  }
  receiveStatus.innerHTML = "<strong>Status:</strong> Looking up...";
  try{
    const data = await api(`/api/posts/${encodeURIComponent(c)}`);
    const post = data.post;

    if(post.type === "link"){
      receiveStatus.innerHTML = `<strong>Status:</strong> Opening <strong>${escapeHtml(post.title)}</strong>...`;
      window.open(post.url, "_blank", "noopener");
    }else{
      receiveStatus.innerHTML = `<strong>Status:</strong> Downloading <strong>${escapeHtml(post.title)}</strong>...`;
      downloadDataUrl(post.fileName, post.dataUrl);
    }
  }catch(e){
    receiveStatus.innerHTML = `<strong>Status:</strong> ${escapeHtml(e.message)}`;
  }
}

openFromCodeBtn.addEventListener("click", () => openOrDownloadByCode(decodedCode.value));

// Auto receive if opened via QR (?code=)
(function autoFromQuery(){
  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");
  if(code){
    const c = normalizeCode(code);
    activeCode.value = c;
    decodedCode.value = c;
    openOrDownloadByCode(c);
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
        const hay = `${p.title} ${p.desc||""} ${(p.tags||[]).join(" ")} ${p.shareCode} ${p.type}`.toLowerCase();
        return hay.includes(q);
      });
    }

    if(!posts.length){
      feedGrid.innerHTML = `<div class="callout"><strong>No posts.</strong> Post a link/file above.</div>`;
      return;
    }

    for(const post of posts){
      const tags = (post.tags||[]).map(t => `<span class="badge">${escapeHtml(t)}</span>`).join("");
      const card = document.createElement("div");
      card.className = "card";
      card.innerHTML = `
        <div style="font-weight:900; display:flex; justify-content:space-between; gap:10px;">
          <span>${escapeHtml(post.title)}</span>
          <span class="badge">${post.type === "file" ? "File" : "Link"}</span>
        </div>
        <div class="meta">
          By <strong>${escapeHtml(post.author)}</strong> • ${formatTimeAgo(post.createdAt)} • Code: <strong>${escapeHtml(post.shareCode)}</strong>
        </div>
        <div class="badges">${tags}</div>
        <div class="meta" style="margin-top:10px;">${escapeHtml(post.desc || "")}</div>

        <div class="card-actions">
          <button class="small-btn" data-action="load" data-code="${escapeHtml(post.shareCode)}">Load code</button>
          <button class="small-btn" data-action="qr" data-code="${escapeHtml(post.shareCode)}">Show QR</button>
          <button class="small-btn" data-action="chime" data-code="${escapeHtml(post.shareCode)}">Play chime</button>
          <button class="small-btn" data-action="open" data-code="${escapeHtml(post.shareCode)}">Open/Download</button>
        </div>
      `;

      card.addEventListener("click", (e) => {
        const btn = e.target.closest("[data-action]");
        if(!btn) return;
        const code = btn.dataset.code;
        const action = btn.dataset.action;

        activeCode.value = code;
        decodedCode.value = code;

        if(action === "load"){
          broadcastStatus.innerHTML = `<strong>Status:</strong> Loaded <strong>${escapeHtml(code)}</strong>.`;
          window.location.hash = "#broadcast";
        }
        if(action === "qr"){
          window.location.hash = "#broadcast";
          showQrBtn.click();
        }
        if(action === "chime"){
          window.location.hash = "#broadcast";
          playChimeForCode(code);
        }
        if(action === "open"){
          window.location.hash = "#broadcast";
          openOrDownloadByCode(code);
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
  await api("/api/posts", { method:"DELETE" });
  await renderFeed();
});

// ---------- ChimeShare ----------
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
    broadcastStatus.innerHTML = "<strong>Status:</strong> Load valid code DS-XXXXXX.";
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

playChimeBtn.addEventListener("click", () => playChimeForCode(activeCode.value || decodedCode.value));
stopChimeBtn.addEventListener("click", () => {
  chimeStopFlag = true;
  stopChimeBtn.disabled = true;
  playChimeBtn.disabled = false;
  broadcastStatus.innerHTML = "<strong>Status:</strong> Stopped.";
});

// ---------- Listen & decode (basic) ----------
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
            const c = `DS-${payload}`;
            decodedCode.value = c;
            activeCode.value = c;
            receiveStatus.innerHTML = `<strong>Status:</strong> Decoded <strong>${escapeHtml(c)}</strong>.`;
          }else{
            receiveStatus.innerHTML = "<strong>Status:</strong> Incomplete decode. Try again.";
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

// ---------- Voice (Round Table) ----------
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let rec = null;

function startVoice(){
  if(!SpeechRecognition){
    voiceStatus.innerHTML = "<strong>Status:</strong> Voice commands not supported in this browser.";
    return;
  }
  if(rec) return;

  rec = new SpeechRecognition();
  rec.continuous = true;
  rec.interimResults = false;
  rec.lang = "en-US";

  rec.onresult = (event) => {
    const last = event.results[event.results.length - 1][0].transcript.trim().toLowerCase();
    voiceStatus.innerHTML = `<strong>Heard:</strong> ${escapeHtml(last)}`;

    // Basic commands
    if(last.includes("show") && last.includes("qr")) showQrBtn.click();
    if(last.includes("hide") && last.includes("qr")) hideQrBtn.click();
    if(last.includes("play") && last.includes("chime")) playChimeBtn.click();
    if(last.includes("stop") && last.includes("chime")) stopChimeBtn.click();

    // "open code DS 1A2B3C"
    const m = last.match(/ds[\s-]*([0-9a-z]{6})/i);
    if(last.includes("open") && m){
      const code = `DS-${m[1].toUpperCase()}`;
      activeCode.value = code;
      decodedCode.value = code;
      openOrDownloadByCode(code);
    }
  };

  rec.onerror = () => {
    voiceStatus.innerHTML = "<strong>Status:</strong> Voice error. Try again.";
  };

  rec.onend = () => {
    // If user didn't stop manually, allow restarting by button.
    voiceStartBtn.disabled = false;
    voiceStopBtn.disabled = true;
    rec = null;
  };

  rec.start();
  voiceStartBtn.disabled = true;
  voiceStopBtn.disabled = false;
  voiceStatus.innerHTML = "<strong>Status:</strong> Listening for commands...";
}

function stopVoice(){
  if(rec){
    rec.stop();
    rec = null;
  }
  voiceStartBtn.disabled = false;
  voiceStopBtn.disabled = true;
  voiceStatus.innerHTML = "<strong>Status:</strong> Stopped.";
}

voiceStartBtn.addEventListener("click", startVoice);
voiceStopBtn.addEventListener("click", stopVoice);

// ---------- Init ----------
refreshNameUI();
renderFeed();
