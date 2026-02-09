/**
 * DropShare demo:
 * - Local profile + posts in localStorage
 * - ChimeShare: encodes a share code into tones and decodes via microphone (simple demo)
 *
 * Important:
 * - Sound decoding is not perfect; depends on environment and device.
 * - For real product: use QR codes, BLE, WebRTC, or a server-based invite.
 */

const KEY_PROFILE = "dropshare_profile_v2";
const KEY_POSTS = "dropshare_posts_v2";

// Profile elements
const nameInput = document.getElementById("nameInput");
const radiusInput = document.getElementById("radiusInput");
const saveProfileBtn = document.getElementById("saveProfileBtn");
const resetProfileBtn = document.getElementById("resetProfileBtn");
const profileStatus = document.getElementById("profileStatus");

// Tabs
const tabs = document.querySelectorAll(".tab");
const fileTab = document.getElementById("fileTab");
const linkTab = document.getElementById("linkTab");

// File post
const fileInput = document.getElementById("fileInput");
const fileTitle = document.getElementById("fileTitle");
const fileTags = document.getElementById("fileTags");
const fileDesc = document.getElementById("fileDesc");
const postFileBtn = document.getElementById("postFileBtn");
const clearFileBtn = document.getElementById("clearFileBtn");

// Link post
const linkUrl = document.getElementById("linkUrl");
const linkTitle = document.getElementById("linkTitle");
const linkTags = document.getElementById("linkTags");
const linkDesc = document.getElementById("linkDesc");
const postLinkBtn = document.getElementById("postLinkBtn");
const clearLinkBtn = document.getElementById("clearLinkBtn");

// Status
const postStatus = document.getElementById("postStatus");

// Feed
const typeFilter = document.getElementById("typeFilter");
const sortFilter = document.getElementById("sortFilter");
const searchInput = document.getElementById("searchInput");
const feedGrid = document.getElementById("feedGrid");
const radiusPill = document.getElementById("radiusPill");
const namePill = document.getElementById("namePill");
const clearAllBtn = document.getElementById("clearAllBtn");

// ChimeShare
const chimeCodeInput = document.getElementById("chimeCodeInput");
const playChimeBtn = document.getElementById("playChimeBtn");
const stopChimeBtn = document.getElementById("stopChimeBtn");
const chimeSendStatus = document.getElementById("chimeSendStatus");

const listenBtn = document.getElementById("listenBtn");
const stopListenBtn = document.getElementById("stopListenBtn");
const decodedOutput = document.getElementById("decodedOutput");
const applyDecodedBtn = document.getElementById("applyDecodedBtn");
const clearDecodedBtn = document.getElementById("clearDecodedBtn");
const chimeRecvStatus = document.getElementById("chimeRecvStatus");

// ---------- Utilities ----------
function escapeHtml(str){
  return String(str).replace(/[&<>"']/g, s => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[s]));
}
function nowId(){
  return String(Date.now()) + String(Math.floor(Math.random()*1000));
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
function parseTags(str){
  return str.split(",").map(s => s.trim()).filter(Boolean).slice(0, 10);
}
function randomMilesWithin(radius){
  const r = Number(radius) || 5;
  // keep within radius (demo)
  return Math.max(0.1, (Math.random() * r)).toFixed(1);
}

function loadProfile(){
  try{ return JSON.parse(localStorage.getItem(KEY_PROFILE) || "null"); }catch{ return null; }
}
function saveProfile(profile){
  localStorage.setItem(KEY_PROFILE, JSON.stringify(profile));
}
function loadPosts(){
  try{ return JSON.parse(localStorage.getItem(KEY_POSTS) || "[]"); }catch{ return []; }
}
function savePosts(posts){
  localStorage.setItem(KEY_POSTS, JSON.stringify(posts));
}

function setPostingEnabled(enabled){
  postFileBtn.disabled = !enabled;
  postLinkBtn.disabled = !enabled;
  postStatus.innerHTML = enabled
    ? "<strong>Status:</strong> Ready. Create a file or link post."
    : "<strong>Status:</strong> Create a profile first to post.";
}

function refreshProfileUI(){
  const p = loadProfile();
  if(!p){
    profileStatus.innerHTML = "<strong>Status:</strong> Create a profile to start posting.";
    radiusPill.textContent = "Radius: —";
    namePill.textContent = "User: —";
    setPostingEnabled(false);
    return;
  }
  nameInput.value = p.name || "";
  radiusInput.value = String(p.radius || "5");
  profileStatus.innerHTML = `<strong>Status:</strong> Signed in as <strong>${escapeHtml(p.name)}</strong> • Radius ${p.radius} mi (demo)`;
  radiusPill.textContent = `Radius: ${p.radius} mi`;
  namePill.textContent = `User: ${p.name}`;
  setPostingEnabled(true);
}

// ---------- Tabs ----------
tabs.forEach(t => {
  t.addEventListener("click", () => {
    tabs.forEach(x => x.classList.remove("active"));
    t.classList.add("active");
    const tab = t.dataset.tab;
    if(tab === "file"){
      fileTab.classList.remove("hidden");
      linkTab.classList.add("hidden");
    }else{
      linkTab.classList.remove("hidden");
      fileTab.classList.add("hidden");
    }
  });
});

// ---------- Profile ----------
saveProfileBtn.addEventListener("click", () => {
  const name = nameInput.value.trim();
  const radius = Number(radiusInput.value);
  if(!name){
    profileStatus.innerHTML = "<strong>Status:</strong> Please enter a display name.";
    return;
  }
  saveProfile({ name, radius });
  refreshProfileUI();
  renderFeed();
});

resetProfileBtn.addEventListener("click", () => {
  localStorage.removeItem(KEY_PROFILE);
  nameInput.value = "";
  radiusInput.value = "5";
  refreshProfileUI();
  renderFeed();
});

// ---------- Posting ----------
clearFileBtn.addEventListener("click", () => {
  fileInput.value = "";
  fileTitle.value = "";
  fileTags.value = "";
  fileDesc.value = "";
});
clearLinkBtn.addEventListener("click", () => {
  linkUrl.value = "";
  linkTitle.value = "";
  linkTags.value = "";
  linkDesc.value = "";
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
  const p = loadProfile();
  if(!p) return;

  const f = fileInput.files && fileInput.files[0];
  const title = fileTitle.value.trim();
  const tags = parseTags(fileTags.value);
  const desc = fileDesc.value.trim();

  if(!f || !title){
    postStatus.innerHTML = "<strong>Status:</strong> Choose a file and add a title.";
    return;
  }

  const dataUrl = await readFileAsDataURL(f);

  const id = nowId();
  const shareCode = makeShareCode(id);

  const post = {
    id,
    shareCode,
    type: "file",
    title,
    tags,
    desc,
    author: p.name,
    radius: p.radius,
    milesAway: randomMilesWithin(p.radius),
    createdAt: Date.now(),
    fileName: f.name,
    mime: f.type || "application/octet-stream",
    dataUrl
  };

  const posts = loadPosts();
  posts.unshift(post);
  savePosts(posts);

  postStatus.innerHTML = `<strong>Status:</strong> File posted. Share code: <strong>${shareCode}</strong>`;
  clearFileBtn.click();
  renderFeed();
});

postLinkBtn.addEventListener("click", () => {
  const p = loadProfile();
  if(!p) return;

  const url = linkUrl.value.trim();
  const title = linkTitle.value.trim();
  const tags = parseTags(linkTags.value);
  const desc = linkDesc.value.trim();

  if(!url || !title){
    postStatus.innerHTML = "<strong>Status:</strong> Add a URL and title.";
    return;
  }

  const id = nowId();
  const shareCode = makeShareCode(id);

  const post = {
    id,
    shareCode,
    type: "link",
    title,
    tags,
    desc,
    author: p.name,
    radius: p.radius,
    milesAway: randomMilesWithin(p.radius),
    createdAt: Date.now(),
    url
  };

  const posts = loadPosts();
  posts.unshift(post);
  savePosts(posts);

  postStatus.innerHTML = `<strong>Status:</strong> Link posted. Share code: <strong>${shareCode}</strong>`;
  clearLinkBtn.click();
  renderFeed();
});

// ---------- Feed ----------
function matchesSearch(post, q){
  if(!q) return true;
  const hay = `${post.title} ${post.desc || ""} ${(post.tags||[]).join(" ")} ${post.author} ${post.shareCode}`.toLowerCase();
  return hay.includes(q);
}

function renderFeed(){
  const p = loadProfile();
  const posts = loadPosts();

  const type = typeFilter.value;
  const sort = sortFilter.value;
  const q = searchInput.value.trim().toLowerCase();

  let list = [...posts];

  if(type !== "all"){
    list = list.filter(x => x.type === type);
  }
  list = list.filter(x => matchesSearch(x, q));

  // demo local filter: show items within radius (if profile exists)
  if(p){
    const r = Number(p.radius) || 5;
    list = list.filter(x => Number(x.milesAway) <= r);
  }

  if(sort === "newest") list.sort((a,b) => b.createdAt - a.createdAt);
  if(sort === "oldest") list.sort((a,b) => a.createdAt - b.createdAt);
  if(sort === "title") list.sort((a,b) => (a.title||"").localeCompare(b.title||""));

  feedGrid.innerHTML = "";

  if(list.length === 0){
    feedGrid.innerHTML = `<div class="callout"><strong>No posts found.</strong> Create a post or adjust filters.</div>`;
    return;
  }

  list.forEach(post => {
    const tags = (post.tags||[]).map(t => `<span class="badge">${escapeHtml(t)}</span>`).join("");

    const card = document.createElement("div");
    card.className = "card";

    const typeLabel = post.type === "file" ? "File" : "Link";

    card.innerHTML = `
      <div style="font-weight:900; display:flex; justify-content:space-between; gap:10px;">
        <span>${escapeHtml(post.title)}</span>
        <span class="badge">${typeLabel}</span>
      </div>

      <div class="meta">
        Posted by <strong>${escapeHtml(post.author)}</strong> • ${escapeHtml(post.milesAway)} mi away • ${formatTimeAgo(post.createdAt)}
      </div>

      <div class="badges">${tags}</div>

      <div class="meta" style="margin-top:10px;">${escapeHtml(post.desc || "")}</div>

      <div class="meta" style="margin-top:10px;">
        Share code: <span style="font-weight:900;">${escapeHtml(post.shareCode)}</span>
      </div>

      <div class="card-actions">
        <button class="small-btn" data-action="copy" data-code="${escapeHtml(post.shareCode)}">Copy code</button>
        <button class="small-btn" data-action="chime" data-code="${escapeHtml(post.shareCode)}">Play chime</button>
        ${post.type === "link"
          ? `<a class="small-btn" href="${escapeHtml(post.url)}" target="_blank" rel="noopener">Open link</a>`
          : `<button class="small-btn" data-action="download" data-id="${escapeHtml(post.id)}">Download</button>`
        }
      </div>
    `;

    card.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-action]");
      if(!btn) return;

      const action = btn.dataset.action;

      if(action === "copy"){
        navigator.clipboard.writeText(btn.dataset.code || "");
        btn.textContent = "Copied!";
        setTimeout(() => btn.textContent = "Copy code", 900);
      }

      if(action === "download"){
        downloadPostFile(btn.dataset.id);
      }

      if(action === "chime"){
        const code = btn.dataset.code || "";
        chimeCodeInput.value = code;
        chimeSendStatus.innerHTML = `<strong>Status:</strong> Loaded code <strong>${escapeHtml(code)}</strong>. Click “Play chime”.`;
        window.location.hash = "#chime";
      }
    });

    feedGrid.appendChild(card);
  });
}

function downloadPostFile(id){
  const posts = loadPosts();
  const post = posts.find(x => x.id === id);
  if(!post || post.type !== "file") return;

  const a = document.createElement("a");
  a.href = post.dataUrl;
  a.download = post.fileName || "dropshare-file";
  document.body.appendChild(a);
  a.click();
  a.remove();
}

[typeFilter, sortFilter].forEach(el => el.addEventListener("change", renderFeed));
searchInput.addEventListener("input", renderFeed);

clearAllBtn.addEventListener("click", () => {
  localStorage.removeItem(KEY_POSTS);
  renderFeed();
});

// ---------- Share code format ----------
function makeShareCode(id){
  // DS- + last 6 of base36
  const base = Number(String(id).slice(-10)).toString(36).toUpperCase().padStart(6, "0");
  return `DS-${base.slice(-6)}`;
}
function normalizeCode(code){
  return String(code || "").trim().toUpperCase();
}
function findPostByShareCode(code){
  const posts = loadPosts();
  const target = normalizeCode(code);
  return posts.find(p => normalizeCode(p.shareCode) === target) || null;
}

// ---------- ChimeShare (tone encode/decode demo) ----------
// We encode characters in base36: 0-9, A-Z (36 symbols).
const SYMBOLS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const START_FREQ = 900;   // start tone
const END_FREQ   = 1800;  // end tone
const BASE_FREQ  = 1000;  // symbol 0
const STEP       = 20;    // 20 Hz per symbol => 1000..1700 Hz
const TONE_MS    = 180;
const GAP_MS     = 70;
const TOLERANCE  = 35;    // Hz

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

  // soft fade in/out to reduce clicks
  const now = ctx.currentTime;
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.linearRampToValueAtTime(0.12, now + 0.02);
  gain.gain.linearRampToValueAtTime(0.10, now + Math.max(0.03, ms/1000 - 0.03));
  gain.gain.linearRampToValueAtTime(0.0001, now + ms/1000);

  await sleep(ms);
  osc.stop();
}

function codeToPayload(code){
  // expects DS-XXXXXX (only uses the 6 chars)
  const c = normalizeCode(code);
  const match = c.match(/^DS-([0-9A-Z]{6})$/);
  return match ? match[1] : null;
}

async function playChimeForCode(code){
  chimeStopFlag = false;
  stopChimeBtn.disabled = false;
  playChimeBtn.disabled = true;

  const payload = codeToPayload(code);
  if(!payload){
    chimeSendStatus.innerHTML = "<strong>Status:</strong> Please use a valid code like <strong>DS-AB12CD</strong>.";
    stopChimeBtn.disabled = true;
    playChimeBtn.disabled = false;
    return;
  }

  chimeSendStatus.innerHTML = `<strong>Status:</strong> Playing chime for <strong>DS-${escapeHtml(payload)}</strong>...`;

  // Start marker
  if(chimeStopFlag) return;
  await playTone(START_FREQ, 220);
  await sleep(GAP_MS);

  // Symbols
  for(const ch of payload){
    if(chimeStopFlag) break;
    const idx = SYMBOLS.indexOf(ch);
    const freq = BASE_FREQ + idx * STEP;
    await playTone(freq, TONE_MS);
    await sleep(GAP_MS);
  }

  // End marker
  if(!chimeStopFlag){
    await playTone(END_FREQ, 220);
  }

  chimeSendStatus.innerHTML = `<strong>Status:</strong> Done. Receiver can decode: <strong>DS-${escapeHtml(payload)}</strong>`;
  stopChimeBtn.disabled = true;
  playChimeBtn.disabled = false;
}

playChimeBtn.addEventListener("click", () => {
  const code = chimeCodeInput.value.trim();
  playChimeForCode(code);
});
stopChimeBtn.addEventListener("click", () => {
  chimeStopFlag = true;
  stopChimeBtn.disabled = true;
  playChimeBtn.disabled = false;
  chimeSendStatus.innerHTML = "<strong>Status:</strong> Stopped.";
});

// ---------- Listening / decoding ----------
let mediaStream = null;
let analyser = null;
let rafId = null;
let listening = false;
let decodedChars = [];
let lastSymbol = null;
let lastHitAt = 0;
let sawStart = false;

function nearestSymbolFromFreq(freq){
  // map to nearest symbol freq
  const idx = Math.round((freq - BASE_FREQ) / STEP);
  if(idx < 0 || idx >= SYMBOLS.length) return null;
  const target = BASE_FREQ + idx * STEP;
  if(Math.abs(freq - target) > TOLERANCE) return null;
  return SYMBOLS[idx];
}

function peakFrequencyHz(analyserNode, ctx){
  const buffer = new Uint8Array(analyserNode.frequencyBinCount);
  analyserNode.getByteFrequencyData(buffer);

  let max = -1;
  let maxIndex = 0;
  for(let i=0;i<buffer.length;i++){
    if(buffer[i] > max){
      max = buffer[i];
      maxIndex = i;
    }
  }
  const nyquist = ctx.sampleRate / 2;
  const freq = (maxIndex / buffer.length) * nyquist;
  return { freq, strength: max };
}

function isNear(freq, target){
  return Math.abs(freq - target) <= TOLERANCE;
}

async function startListening(){
  decodedChars = [];
  lastSymbol = null;
  lastHitAt = 0;
  sawStart = false;
  decodedOutput.value = "";
  applyDecodedBtn.disabled = true;

  listenBtn.disabled = true;
  stopListenBtn.disabled = false;

  const ctx = getAudioCtx();

  try{
    mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  }catch(e){
    chimeRecvStatus.innerHTML = "<strong>Status:</strong> Microphone denied. Please allow microphone access.";
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
  chimeRecvStatus.innerHTML = "<strong>Status:</strong> Listening... hold the phone near the speaker.";

  const tick = () => {
    if(!listening) return;

    const { freq, strength } = peakFrequencyHz(analyser, ctx);
    const now = Date.now();

    // ignore very low strength (noise gate)
    if(strength > 110){
      if(!sawStart && isNear(freq, START_FREQ)){
        sawStart = true;
        decodedChars = [];
        chimeRecvStatus.innerHTML = "<strong>Status:</strong> Start detected. Decoding...";
        lastHitAt = now;
      }

      if(sawStart){
        if(isNear(freq, END_FREQ)){
          // end detected
          listening = false;
          stopListening();

          const payload = decodedChars.join("").slice(0, 6);
          const fullCode = payload.length === 6 ? `DS-${payload}` : "";
          decodedOutput.value = fullCode;

          if(payload.length === 6){
            applyDecodedBtn.disabled = false;
            chimeRecvStatus.innerHTML = `<strong>Status:</strong> Decoded <strong>${escapeHtml(fullCode)}</strong>. Click “Find post”.`;
          }else{
            chimeRecvStatus.innerHTML = "<strong>Status:</strong> End detected but code incomplete. Try again closer/quieter.";
          }
          return;
        }

        // sample a symbol roughly every ~ (TONE_MS + GAP_MS) window
        if(now - lastHitAt > (TONE_MS + GAP_MS - 30)){
          const sym = nearestSymbolFromFreq(freq);
          if(sym && sym !== lastSymbol && decodedChars.length < 6){
            decodedChars.push(sym);
            lastSymbol = sym;
            decodedOutput.value = `DS-${decodedChars.join("")}`;
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
  chimeRecvStatus.innerHTML = "<strong>Status:</strong> Stopped listening.";
});

clearDecodedBtn.addEventListener("click", () => {
  decodedOutput.value = "";
  applyDecodedBtn.disabled = true;
  chimeRecvStatus.innerHTML = "<strong>Status:</strong> Cleared.";
});

applyDecodedBtn.addEventListener("click", () => {
  const code = decodedOutput.value.trim();
  const post = findPostByShareCode(code);
  if(!post){
    chimeRecvStatus.innerHTML = `<strong>Status:</strong> Code not found in this browser’s feed. (This demo is local-only.)`;
    return;
  }

  chimeRecvStatus.innerHTML = `<strong>Status:</strong> Found: <strong>${escapeHtml(post.title)}</strong>.`;
  // In demo: open link or download file
  if(post.type === "link"){
    window.open(post.url, "_blank", "noopener");
  }else if(post.type === "file"){
    downloadPostFile(post.id);
  }
});

// ---------- Init ----------
refreshProfileUI();
renderFeed();
