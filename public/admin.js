const app = document.getElementById('adminApp');
let state = null;
let editing = { team: null, blogs: null, guides: null, jobs: null, users: null };

const esc = v => String(v ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));

async function api(url, options = {}) {
  const res = await fetch(url, { ...options, headers: { ...(options.body instanceof FormData ? {} : {'Content-Type':'application/json'}), ...(options.headers || {}) } });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

async function boot() {
  const me = await fetch('/api/admin/me').then(r => r.json());
  if (!me.authenticated) return renderLogin();
  state = await api('/api/admin/content');
  renderAdmin();
}

function renderLogin(error = '') {
  app.innerHTML = `<div class="admin-login"><div class="brand"><span class="brand-leaf">G</span><span>Guava<span>MC</span></span></div><h1 style="margin-top:18px">Admin Panel</h1><p>This page is intentionally not linked from the public website. Sign in to manage GuavaMC content.</p>${error ? `<p style="color:#e17b7b">${esc(error)}</p>` : ''}<form id="loginForm" class="admin-form"><label>USERNAME</label><input name="username" autocomplete="username" required autofocus><label>ADMIN PASSWORD</label><input name="password" type="password" autocomplete="current-password" required><button class="admin-btn">SIGN IN</button></form></div>`;
  document.getElementById('loginForm').onsubmit = async e => { e.preventDefault(); try { await api('/api/admin/login',{method:'POST',body:JSON.stringify({username:e.target.username.value,password:e.target.password.value})}); boot(); } catch(err){ renderLogin(err.message); } };
}

function renderAdmin() {
  app.innerHTML = `<div class="admin-shell">
    <div class="admin-top"><div><div class="brand"><span class="brand-leaf">G</span><span>Guava<span>MC</span></span></div><h1 style="margin-top:15px">Website Admin</h1><p>Manage everything shown on the public website.</p></div><div class="admin-actions"><a class="admin-btn secondary" href="/" target="_blank">VIEW SITE</a><button class="admin-btn secondary" id="logout">LOG OUT</button></div></div>
    <div class="admin-nav">${['site','team','blogs','guides','jobs','images','admins'].map((x,i)=>`<button class="admin-tab ${i===0?'active':''}" data-tab="${x}">${x.toUpperCase()}</button>`).join('')}</div>
    <section class="admin-panel active" data-panel="site"></section><section class="admin-panel" data-panel="team"></section><section class="admin-panel" data-panel="blogs"></section><section class="admin-panel" data-panel="guides"></section><section class="admin-panel" data-panel="jobs"></section><section class="admin-panel" data-panel="images"></section><section class="admin-panel" data-panel="admins"></section>
  </div>`;
  document.getElementById('logout').onclick = async () => { await api('/api/admin/logout',{method:'POST'}); boot(); };
  document.querySelectorAll('.admin-tab').forEach(tab => tab.onclick = () => { document.querySelectorAll('.admin-tab').forEach(x=>x.classList.remove('active')); document.querySelectorAll('.admin-panel').forEach(x=>x.classList.remove('active')); tab.classList.add('active'); document.querySelector(`[data-panel="${tab.dataset.tab}"]`).classList.add('active'); });
  renderSite(); renderTeam(); renderBlogs(); renderGuides(); renderJobs(); renderImages(); renderAdmins();
}

async function uploadFile(input) {
  const fd = new FormData(); fd.append('image', input.files[0]);
  return api('/api/admin/upload',{method:'POST',body:fd});
}

function renderSite() {
  const p = document.querySelector('[data-panel="site"]'); const s = state.site;
  p.innerHTML = `<div class="admin-grid"><form class="admin-form" id="siteForm"><h2>Site settings</h2><label>SERVER IP</label><input name="serverIp" value="${esc(s.serverIp)}"><label>SERVER COUNT TEXT</label><input name="serverCount" value="${esc(s.serverCount)}"><label>DISCORD URL</label><input name="discordUrl" value="${esc(s.discordUrl)}"><label>HERO MEDIA URL</label><input name="heroImage" value="${esc(s.heroImage)}"><label>HERO MEDIA TYPE</label><select name="heroMediaType"><option value="auto" ${s.heroMediaType==='auto'?'selected':''}>AUTO (PNG OR MP4)</option><option value="image" ${s.heroMediaType==='image'?'selected':''}>PNG / IMAGE</option><option value="video" ${s.heroMediaType==='video'?'selected':''}>MP4 VIDEO</option></select><label>COMMUNITY IMAGE URL</label><input name="communityImage" value="${esc(s.communityImage)}"><label>ECONOMY IMAGE URL</label><input name="economyImage" value="${esc(s.economyImage)}"><label>BOXPVP IMAGE URL</label><input name="boxpvpImage" value="${esc(s.boxpvpImage)}"><label>PRACTICE IMAGE URL</label><input name="practiceImage" value="${esc(s.practiceImage)}"><button class="admin-btn">SAVE SITE SETTINGS</button><p class="admin-note">Upload a PNG or MP4 in the Images tab, copy its URL, then paste it here. AUTO detects the media type from the file extension. MP4 heroes autoplay muted and loop.</p></form><div><h2>Image editing</h2><p class="admin-note">The Images tab lets you upload new artwork and delete old uploads. Team members, blog posts and guides also accept image URLs from this library.</p><div class="image-placeholder" style="height:250px;margin-top:15px"><strong>IMAGE SLOTS</strong><small>Hero · Community · Economy · BoxPvP · PracticePvP</small></div></div></div>`;
  p.querySelector('#siteForm').onsubmit = async e => { e.preventDefault(); const body = Object.fromEntries(new FormData(e.target)); state.site = await api('/api/admin/site',{method:'PUT',body:JSON.stringify(body)}); alert('Site settings saved.'); };
}

function renderTeam() {
  const p=document.querySelector('[data-panel="team"]'); const editingMember=editing.team ? state.team.find(x=>x.id===editing.team) : null;
  p.innerHTML=`<div class="admin-grid"><form class="admin-form" id="teamForm"><h2>${editingMember?'Edit':'Add'} team member</h2><label>NAME</label><input name="name" required value="${esc(editingMember?.name)}"><label>ROLE</label><input name="role" required value="${esc(editingMember?.role)}"><label>ROLE TYPE</label><input name="roleType" value="${esc(editingMember?.roleType || 'STAFF')}"><label>DESCRIPTION</label><textarea name="description">${esc(editingMember?.description)}</textarea><label>PICTURE URL</label><input name="image" value="${esc(editingMember?.image)}"><button class="admin-btn">${editingMember?'SAVE CHANGES':'ADD TEAM MEMBER'}</button>${editingMember?'<button type="button" class="admin-btn secondary" id="cancelTeam">CANCEL</button>':''}<p class="admin-note">Use the Images tab to upload a picture, then paste its URL here.</p></form><div><h2>Current team</h2><div class="admin-list">${state.team.map(x=>`<div class="admin-item"><div><strong>${esc(x.name)}</strong><small>${esc(x.role)} · ${esc(x.roleType)}</small></div><div class="admin-actions"><button class="admin-btn secondary" data-edit-team="${x.id}">EDIT</button><button class="admin-btn danger" data-del-team="${x.id}">REMOVE</button></div></div>`).join('')}</div></div></div>`;
  p.querySelector('#teamForm').onsubmit=async e=>{e.preventDefault();const body=Object.fromEntries(new FormData(e.target));if(editingMember) await api('/api/admin/team/'+editingMember.id,{method:'PUT',body:JSON.stringify(body)});else await api('/api/admin/team',{method:'POST',body:JSON.stringify(body)});state=await api('/api/admin/content');editing.team=null;renderTeam();};
  p.querySelector('#cancelTeam')?.addEventListener('click',()=>{editing.team=null;renderTeam()}); p.querySelectorAll('[data-edit-team]').forEach(b=>b.onclick=()=>{editing.team=b.dataset.editTeam;renderTeam()}); p.querySelectorAll('[data-del-team]').forEach(b=>b.onclick=async()=>{if(confirm('Remove this team member?')){await api('/api/admin/team/'+b.dataset.delTeam,{method:'DELETE'});state=await api('/api/admin/content');renderTeam();}});
}

function renderBlogs() {
  const p=document.querySelector('[data-panel="blogs"]'); const x=editing.blogs?state.blogs.find(v=>v.id===editing.blogs):null;
  p.innerHTML=`<div class="admin-grid"><form class="admin-form" id="blogForm"><h2>${x?'Edit':'New'} blog post</h2><label>TITLE</label><input name="title" required value="${esc(x?.title)}"><label>DATE / LABEL</label><input name="date" value="${esc(x?.date)}"><label>AUTHOR</label><input name="author" value="${esc(x?.author||'GuavaMC')}"><label>EXCERPT</label><textarea name="excerpt">${esc(x?.excerpt)}</textarea><label>FULL CONTENT</label><textarea name="content" style="min-height:180px">${esc(x?.content)}</textarea><label>IMAGE URL</label><input name="image" value="${esc(x?.image)}"><button class="admin-btn">${x?'SAVE BLOG':'PUBLISH BLOG'}</button>${x?'<button type="button" class="admin-btn secondary" id="cancelBlog">CANCEL</button>':''}</form><div><h2>Posts</h2><div class="admin-list">${state.blogs.map(v=>`<div class="admin-item"><div><strong>${esc(v.title)}</strong><small>${esc(v.date)}</small></div><div class="admin-actions"><button class="admin-btn secondary" data-edit-blog="${v.id}">EDIT</button><button class="admin-btn danger" data-del-blog="${v.id}">REMOVE</button></div></div>`).join('')}</div></div></div>`;
  p.querySelector('#blogForm').onsubmit=async e=>{e.preventDefault();const body=Object.fromEntries(new FormData(e.target));if(x) await api('/api/admin/blogs/'+x.id,{method:'PUT',body:JSON.stringify(body)});else await api('/api/admin/blogs',{method:'POST',body:JSON.stringify(body)});state=await api('/api/admin/content');editing.blogs=null;renderBlogs();};
  p.querySelector('#cancelBlog')?.addEventListener('click',()=>{editing.blogs=null;renderBlogs()});p.querySelectorAll('[data-edit-blog]').forEach(b=>b.onclick=()=>{editing.blogs=b.dataset.editBlog;renderBlogs()});p.querySelectorAll('[data-del-blog]').forEach(b=>b.onclick=async()=>{if(confirm('Remove this post?')){await api('/api/admin/blogs/'+b.dataset.delBlog,{method:'DELETE'});state=await api('/api/admin/content');renderBlogs();}});
}

function renderGuides(){
  const p=document.querySelector('[data-panel="guides"]');const x=editing.guides?state.guides.find(v=>v.id===editing.guides):null;
  p.innerHTML=`<div class="admin-grid"><form class="admin-form" id="guideForm"><h2>${x?'Edit':'New'} guide</h2><label>TITLE</label><input name="title" required value="${esc(x?.title)}"><label>CATEGORY</label><input name="category" value="${esc(x?.category)}"><label>DESCRIPTION</label><textarea name="description">${esc(x?.description)}</textarea><label>CONTENT</label><textarea name="content" style="min-height:180px">${esc(x?.content)}</textarea><label>IMAGE URL</label><input name="image" value="${esc(x?.image)}"><button class="admin-btn">${x?'SAVE GUIDE':'PUBLISH GUIDE'}</button>${x?'<button type="button" class="admin-btn secondary" id="cancelGuide">CANCEL</button>':''}</form><div><h2>Guides</h2><div class="admin-list">${state.guides.map(v=>`<div class="admin-item"><div><strong>${esc(v.title)}</strong><small>${esc(v.category)}</small></div><div class="admin-actions"><button class="admin-btn secondary" data-edit-guide="${v.id}">EDIT</button><button class="admin-btn danger" data-del-guide="${v.id}">REMOVE</button></div></div>`).join('')}</div></div></div>`;
  p.querySelector('#guideForm').onsubmit=async e=>{e.preventDefault();const body=Object.fromEntries(new FormData(e.target));if(x)await api('/api/admin/guides/'+x.id,{method:'PUT',body:JSON.stringify(body)});else await api('/api/admin/guides',{method:'POST',body:JSON.stringify(body)});state=await api('/api/admin/content');editing.guides=null;renderGuides();};
  p.querySelector('#cancelGuide')?.addEventListener('click',()=>{editing.guides=null;renderGuides()});p.querySelectorAll('[data-edit-guide]').forEach(b=>b.onclick=()=>{editing.guides=b.dataset.editGuide;renderGuides()});p.querySelectorAll('[data-del-guide]').forEach(b=>b.onclick=async()=>{if(confirm('Remove this guide?')){await api('/api/admin/guides/'+b.dataset.delGuide,{method:'DELETE'});state=await api('/api/admin/content');renderGuides();}});
}

function renderJobs(){
  const p=document.querySelector('[data-panel="jobs"]');const x=editing.jobs?state.jobs.find(v=>v.id===editing.jobs):null;
  p.innerHTML=`<div class="admin-grid"><form class="admin-form" id="jobForm"><h2>${x?'Edit':'Add'} job</h2><label>JOB NAME</label><input name="title" required value="${esc(x?.title)}"><label>ROLE TYPE</label><input name="type" value="${esc(x?.type)}"><label>LOCATION</label><input name="location" value="${esc(x?.location)}"><label>DESCRIPTION</label><textarea name="description">${esc(x?.description)}</textarea><label>BUTTON TEXT</label><input name="buttonText" value="${esc(x?.buttonText||'APPLY NOW')}"><label>YOUR APPLICATION LINK</label><input name="applyUrl" type="url" placeholder="https://..." value="${esc(x?.applyUrl)}"><button class="admin-btn">${x?'SAVE JOB':'ADD JOB'}</button>${x?'<button type="button" class="admin-btn secondary" id="cancelJob">CANCEL</button>':''}<p class="admin-note">There is deliberately no separate page for a job. Clicking the button takes applicants directly to the URL you provide.</p></form><div><h2>Open positions</h2><div class="admin-list">${state.jobs.map(v=>`<div class="admin-item"><div><strong>${esc(v.title)}</strong><small>${esc(v.type)}${v.location?' · '+esc(v.location):''}</small></div><div class="admin-actions"><button class="admin-btn secondary" data-edit-job="${v.id}">EDIT</button><button class="admin-btn danger" data-del-job="${v.id}">REMOVE</button></div></div>`).join('')}</div></div></div>`;
  p.querySelector('#jobForm').onsubmit=async e=>{e.preventDefault();const body=Object.fromEntries(new FormData(e.target));if(x)await api('/api/admin/jobs/'+x.id,{method:'PUT',body:JSON.stringify(body)});else await api('/api/admin/jobs',{method:'POST',body:JSON.stringify(body)});state=await api('/api/admin/content');editing.jobs=null;renderJobs();};
  p.querySelector('#cancelJob')?.addEventListener('click',()=>{editing.jobs=null;renderJobs()});p.querySelectorAll('[data-edit-job]').forEach(b=>b.onclick=()=>{editing.jobs=b.dataset.editJob;renderJobs()});p.querySelectorAll('[data-del-job]').forEach(b=>b.onclick=async()=>{if(confirm('Remove this job?')){await api('/api/admin/jobs/'+b.dataset.delJob,{method:'DELETE'});state=await api('/api/admin/content');renderJobs();}});
}

async function renderImages(){
  const p=document.querySelector('[data-panel="images"]');
  let files=[]; try{files=await api('/api/admin/images')}catch{}
  p.innerHTML=`<form class="admin-form" id="uploadForm"><h2>Upload image / video</h2><input type="file" name="image" accept="image/png,image/jpeg,image/webp,image/gif,video/mp4" required><button class="admin-btn">UPLOAD MEDIA</button><p class="admin-note">PNG, JPG, WEBP, GIF or MP4 · maximum 50 MB. MP4 is supported for the hero media slot.</p></form><div class="image-library">${files.map(f=>`<figure>${/\.mp4$/i.test(f.filename) ? `<video src="${esc(f.url)}" muted loop playsinline controls></video>` : `<img src="${esc(f.url)}" alt="">`}<figcaption>${esc(f.filename)}</figcaption><div class="admin-actions"><button class="admin-btn secondary" data-copy-image="${esc(f.url)}">COPY URL</button><button class="admin-btn danger" data-del-image="${esc(f.filename)}">DELETE</button></div></figure>`).join('')}</div>`;
  p.querySelector('#uploadForm').onsubmit=async e=>{e.preventDefault();await uploadFile(e.target.image);renderImages();};
  p.querySelectorAll('[data-copy-image]').forEach(b=>b.onclick=async()=>{await navigator.clipboard.writeText(location.origin+b.dataset.copyImage);b.textContent='COPIED';setTimeout(()=>b.textContent='COPY URL',1000)});
  p.querySelectorAll('[data-del-image]').forEach(b=>b.onclick=async()=>{if(confirm('Delete this uploaded image?')){await api('/api/admin/images/'+encodeURIComponent(b.dataset.delImage),{method:'DELETE'});renderImages();}});
}


async function renderAdmins() {
  const p = document.querySelector('[data-panel="admins"]');
  if (!p) return;
  let users = [];
  try { users = await api('/api/admin/users'); } catch (err) { p.innerHTML = `<p class="admin-note">${esc(err.message)}</p>`; return; }
  const editingUser = editing.users ? users.find(x => x.id === editing.users) : null;
  p.innerHTML = `<div class="admin-grid"><form class="admin-form" id="adminUserForm"><h2>${editingUser ? 'Edit' : 'Add'} admin</h2><label>USERNAME</label><input name="username" required minlength="3" maxlength="32" pattern="[A-Za-z0-9_.-]+" value="${esc(editingUser?.username)}" autocomplete="off"><label>${editingUser ? 'NEW PASSWORD (leave blank to keep current)' : 'PASSWORD'}</label><input name="password" type="password" ${editingUser ? '' : 'required'} minlength="8" autocomplete="new-password"><button class="admin-btn">${editingUser ? 'SAVE ADMIN' : 'ADD ADMIN'}</button>${editingUser ? '<button type="button" class="admin-btn secondary" id="cancelAdmin">CANCEL</button>' : ''}<p class="admin-note">Passwords are stored as salted scrypt hashes. They are never saved as readable text.</p></form><div><h2>Admin accounts</h2><div class="admin-list">${users.map(u => `<div class="admin-item"><div><strong>${esc(u.username)}</strong><small>Administrator</small></div><div class="admin-actions"><button class="admin-btn secondary" data-edit-admin="${esc(u.id)}">EDIT</button><button class="admin-btn danger" data-del-admin="${esc(u.id)}">REMOVE</button></div></div>`).join('')}</div></div></div>`;
  p.querySelector('#adminUserForm').onsubmit = async e => {
    e.preventDefault();
    const body = Object.fromEntries(new FormData(e.target));
    if (editingUser) await api('/api/admin/users/' + editingUser.id, {method:'PUT', body:JSON.stringify(body)});
    else await api('/api/admin/users', {method:'POST', body:JSON.stringify(body)});
    editing.users = null;
    renderAdmins();
  };
  p.querySelector('#cancelAdmin')?.addEventListener('click', () => { editing.users = null; renderAdmins(); });
  p.querySelectorAll('[data-edit-admin]').forEach(b => b.onclick = () => { editing.users = b.dataset.editAdmin; renderAdmins(); });
  p.querySelectorAll('[data-del-admin]').forEach(b => b.onclick = async () => { if (confirm('Remove this admin account?')) { await api('/api/admin/users/' + b.dataset.delAdmin, {method:'DELETE'}); renderAdmins(); } });
}

boot().catch(err => renderLogin(err.message));
