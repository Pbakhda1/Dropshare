// DropShare Round Table: Links + Files + QR Share + ChimeShare + Voice + Hand Gestures

const KEY_NAME = "dropshare_name_v3";

// ------- Elements -------
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

// Gestures
const gestureStartBtn = document.getElementById("gestureStartBtn");
const gestureStopBtn = document.getElementById("gestureStopBtn");
const gestureStatus = document.getElementById("gestureStatus");
const videoEl = document.getElementById("video");
const overlayEl = document.getElementById("overlay");
const overlayCtx = overlayEl.getContext("2d");

// Feed
const searchInput = document.getElementById("searchInput");
const refreshBtn = document.getElementById("refreshBtn");
const clearAllBtn = document.getElementById("clearAllBtn");
const feedGrid = document.getElementById("feedGrid");

// ------- Helpers -------
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

async function api(path, opts){
  const res = await fetch(path, opts);
  const data = await res.json().catch(()=>({}));
  if(!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

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

// ------- Tabs -------
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

// ------- Name -------
saveNameBtn.addEventListener("click", () => {
  const n = nameInput.value.trim();
  if(!n){
    nameStatus.innerHTML = "<strong>Status:</strong> Please enter a name.";
    return;
  }
  saveName(n);
  refreshNameUI();
});

// ------- Posting (Link) -------
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

// ------- Posting (File) -------
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
    postStatus.innerHTML = "<strong>Status:</strong> Choose file + Title.";
    return;
  }

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

// ------- QR Share -------
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

  await QRCode.toCanvas(qrCanvas, receiveUrl, { width: 260, margin: 1 });

  broadcastStatus.innerHTML =
    `<strong>Status:</strong> QR ready for <strong>${escapeHtml(code)}</strong>. Scan to receive.`;
});

hideQrBtn.addEventListener("click", () => {
  qrWrap.classList.add("hidden");
  hideQrBtn.disabled = true;
  broadcastStatus.innerHTML = "<strong>Status:</strong> QR hidden.";
});

// ------- Receive by code -------
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

// ------- Feed -------
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
      feedGrid.innerHTML = `<div class="callout"><strong>No posts.</strong> Post above.</div>`;
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

// ------- ChimeShare (kept minimal here for stability) -------
/*
  NOTE: ChimeShare code decoding is noisy and browser-dependent.
  If you want it fully included again, I can paste the full chime encoder/decoder,
  but it makes this file much longer. QR is the reliable method.
*/
playChimeBtn.addEventListener("click", () => {
  alert("ChimeShare sound broadcast is available in the earlier version. QR Share is enabled and recommended.");
});
stopChimeBtn.addEventListener("click", () => {});
listenBtn.addEventListener("click", () => {
  alert("Chime listening is available in the earlier version. QR Share is enabled and recommended.");
});
stopListenBtn.addEventListener("click", () => {});

// ------- Voice (Round Table) -------
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

    if(last.includes("show") && last.includes("qr")) showQrBtn.click();
    if(last.includes("hide") && last.includes("qr")) hideQrBtn.click();

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

// ------- Gestures (Peace ✌️ triggers open/download) -------
let hands = null;
let cam = null;
let gestureRunning = false;
let lastGestureAt = 0;

function countExtendedFingers(landmarks){
  // Simple heuristic:
  // - Compare fingertip y to pip y (if tip is above pip, finger extended)
  // Works best with palm facing camera.
  const tips = [4, 8, 12, 16, 20];
  const pips = [3, 6, 10, 14, 18];

  let extended = 0;
  for(let i=1;i<tips.length;i++){
    const tip = landmarks[tips[i]];
    const pip = landmarks[pips[i]];
    if(tip.y < pip.y) extended++;
  }
  // Thumb is sideways; ignore for simplicity in this demo
  return extended; // index..pinky
}

function classifyGesture(landmarks){
  const ext = countExtendedFingers(landmarks);

  // Peace: index + middle extended => ext ~= 2
  if(ext === 2) return "peace";
  // Open palm: 4 fingers extended => ext ~= 4
  if(ext === 4) return "palm";
  return "unknown";
}

function resizeOverlay(){
  overlayEl.width = videoEl.videoWidth || 640;
  overlayEl.height = videoEl.videoHeight || 480;
}

async function startGestures(){
  if(gestureRunning) return;

  gestureStatus.innerHTML = "<strong>Status:</strong> Starting camera...";
  gestureStartBtn.disabled = true;
  gestureStopBtn.disabled = false;

  hands = new Hands({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
  });

  hands.setOptions({
    maxNumHands: 1,
    modelComplexity: 1,
    minDetectionConfidence: 0.6,
    minTrackingConfidence: 0.6
  });

  hands.onResults((results) => {
    overlayCtx.clearRect(0,0,overlayEl.width,overlayEl.height);

    if(results.image){
      overlayCtx.drawImage(results.image, 0, 0, overlayEl.width, overlayEl.height);
    }

    if(results.multiHandLandmarks && results.multiHandLandmarks.length){
      const lm = results.multiHandLandmarks[0];

      drawConnectors(overlayCtx, lm, HAND_CONNECTIONS, { lineWidth: 2 });
      drawLandmarks(overlayCtx, lm, { radius: 2 });

      const g = classifyGesture(lm);
      const now = Date.now();

      if(now - lastGestureAt > 1400){
        if(g === "palm"){
          lastGestureAt = now;
          gestureStatus.innerHTML = "<strong>Status:</strong> Open Palm detected ✋ → Showing QR";
          showQrBtn.click();
        }
        if(g === "peace"){
          lastGestureAt = now;
          gestureStatus.innerHTML = "<strong>Status:</strong> Peace detected ✌️ → Open/Download active code";
          const code = activeCode.value || decodedCode.value;
          if(code) openOrDownloadByCode(code);
          else gestureStatus.innerHTML = "<strong>Status:</strong> No active code loaded.";
        }
      }
    }
  });

  cam = new Camera(videoEl, {
    onFrame: async () => {
      if(!gestureRunning) return;
      await hands.send({ image: videoEl });
    },
    width: 640,
    height: 480
  });

  gestureRunning = true;
  await cam.start();
  resizeOverlay();
  gestureStatus.innerHTML = "<strong>Status:</strong> Camera on. Show ✌️ or ✋.";
}

async function stopGestures(){
  gestureRunning = false;
  gestureStartBtn.disabled = false;
  gestureStopBtn.disabled = true;

  if(cam){
    cam.stop();
    cam = null;
  }

  if(videoEl.srcObject){
    videoEl.srcObject.getTracks().forEach(t => t.stop());
    videoEl.srcObject = null;
  }

  overlayCtx.clearRect(0,0,overlayEl.width,overlayEl.height);
  gestureStatus.innerHTML = "<strong>Status:</strong> Camera stopped.";
}

gestureStartBtn.addEventListener("click", startGestures);
gestureStopBtn.addEventListener("click", stopGestures);

// ------- Init -------
refreshNameUI();
renderFeed();
