// DropShare demo: local profile + local posts saved in localStorage.
// Note: Real local discovery requires a backend + auth + location privacy + file storage.

const nameInput = document.getElementById("nameInput");
const radiusInput = document.getElementById("radiusInput");
const saveProfileBtn = document.getElementById("saveProfileBtn");
const resetProfileBtn = document.getElementById("resetProfileBtn");
const profileStatus = document.getElementById("profileStatus");

const tabs = document.querySelectorAll(".tab");
const fileTab = document.getElementById("fileTab");
const linkTab = document.getElementById("linkTab");

const fileInput = document.getElementById("fileInput");
const fileTitle = document.getElementById("fileTitle");
const fileTags = document.getElementById("fileTags");
const fileDesc = document.getElementById("fileDesc");
const postFileBtn = document.getElementById("postFileBtn");
const clearFileBtn = document.getElementById("clearFileBtn");

const linkUrl = document.getElementById("linkUrl");
const linkTitle = document.getElementById("linkTitle");
const linkTags = document.getElementById("linkTags");
const linkDesc = document.getElementById("linkDesc");
const postLinkBtn = document.getElementById("postLinkBtn");
const clearLinkBtn = document.getElementById("clearLinkBtn");

const postStatus = document.getElementById("postStatus");

const typeFilter = document.getElementById("typeFilter");
const sortFilter = document.getElementById("sortFilter");
const searchInput = document.getElementById("searchInput");
const feedGrid = document.getElementById("feedGrid");

const radiusPill = document.getElementById("radiusPill");
const namePill = document.getElementById("namePill");
const clearAllBtn = document.getElementById("clearAllBtn");

const KEY_PROFILE = "dropshare_profile_v1";
const KEY_POSTS = "dropshare_posts_v1";

function escapeHtml(str){
  return String(str).replace(/[&<>"']/g, s => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;"
  }[s]));
}

function randomMilesWithin(radius){
  // demo: pretend distance
  const r = Number(radius) || 5;
  return Math.max(0.1, (Math.random() * r * 1.6)).toFixed(1); // slightly beyond radius sometimes
}

function nowId(){
  return String(Date.now()) + String(Math.floor(Math.random()*1000));
}

function loadProfile(){
  try{
    const raw = localStorage.getItem(KEY_PROFILE);
    return raw ? JSON.parse(raw) : null;
  }catch{ return null; }
}

function saveProfile(profile){
  localStorage.setItem(KEY_PROFILE, JSON.stringify(profile));
}

function loadPosts(){
  try{
    const raw = localStorage.getItem(KEY_POSTS);
    return raw ? JSON.parse(raw) : [];
  }catch{ return []; }
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

function parseTags(str){
  return str.split(",").map(s => s.trim()).filter(Boolean).slice(0, 10);
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

  // demo stores file as dataURL (can be large). Production: upload to storage + scan.
  const dataUrl = await readFileAsDataURL(f);

  const post = {
    id: nowId(),
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

  postStatus.innerHTML = "<strong>Status:</strong> File posted to your local feed (demo).";
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

  const post = {
    id: nowId(),
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

  postStatus.innerHTML = "<strong>Status:</strong> Link posted to your local feed (demo).";
  clearLinkBtn.click();
  renderFeed();
});

function readFileAsDataURL(file){
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
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

function matchesSearch(post, q){
  if(!q) return true;
  const hay = `${post.title} ${post.desc || ""} ${(post.tags||[]).join(" ")} ${post.author}`.toLowerCase();
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

  // demo "local" filtering: show items within radius if profile exists
  if(p){
    const r = Number(p.radius) || 5;
    list = list.filter(x => Number(x.milesAway) <= r);
  }

  if(sort === "newest") list.sort((a,b) => b.createdAt - a.createdAt);
  if(sort === "oldest") list.sort((a,b) => a.createdAt - b.createdAt);
  if(sort === "title") list.sort((a,b) => (a.title||"").localeCompare(b.title||""));

  feedGrid.innerHTML = "";

  if(list.length === 0){
    feedGrid.innerHTML = `<div class="callout"><strong>No posts found.</strong> Create a profile, post a file or link, or adjust filters.</div>`;
    return;
  }

  list.forEach(post => {
    const tags = (post.tags||[]).map(t => `<span class="badge">${escapeHtml(t)}</span>`).join("");

    const shareCode = `DS-${post.id.slice(-6).toUpperCase()}`;

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

      <div class="card-actions">
        <button class="small-btn" data-action="copy" data-code="${shareCode}">Copy share code</button>
        ${post.type === "link"
          ? `<a class="small-btn" href="${escapeHtml(post.url)}" target="_blank" rel="noopener">Open link</a>`
          : `<button class="small-btn" data-action="download" data-id="${post.id}">Download</button>`
        }
      </div>

      <div class="meta" style="margin-top:10px;">Share code: <span style="font-weight:900;">${shareCode}</span></div>
    `;

    card.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-action]");
      if(!btn) return;
      const action = btn.dataset.action;

      if(action === "copy"){
        navigator.clipboard.writeText(btn.dataset.code || "");
        btn.textContent = "Copied!";
        setTimeout(() => btn.textContent = "Copy share code", 900);
      }

      if(action === "download"){
        const id = btn.dataset.id;
        downloadPostFile(id);
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

refreshProfileUI();
renderFeed();
