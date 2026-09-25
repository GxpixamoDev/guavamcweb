async function getContent() {
  const res = await fetch('/api/content');
  if (!res.ok) throw new Error('Could not load content');
  return res.json();
}

function esc(value = '') {
  return String(value).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
}

function imageOrPlaceholder(url, label, size) {
  if (url) return `<img src="${esc(url)}" alt="${esc(label)}">`;
  return `<div class="image-placeholder empty-image"></div>`;
}

function pageShell(title, body) {
  document.title = `${title} — GuavaMC`;
  document.body.innerHTML = `
    <header class="topbar"><div class="nav-wrap">
      <a class="brand" href="/"><img class="brand-logo-img" src="/assets/guava-logo.png" alt="GuavaMC logo"><span>Guava<span>MC</span></span></a>
      <nav><a href="/">HOME</a><a href="/blogs">BLOG</a><a href="/guides">GUIDES</a><a href="/jobs">JOBS</a><a href="/#store">STORE</a></nav>
      <div class="nav-actions"><a class="discord-mini" href="#">◉</a><a class="server-button" href="/">PLAY.GUAVAMC.NET</a></div>
    </div></header>
    <main class="subpage"><div class="page-heading"><span class="section-tag">GUAVAMC</span><h1>${esc(title)}</h1><p>Everything you need, all in one place.</p></div>${body}</main>
    <footer><div class="footer-inner"><div class="footer-brand"><img class="footer-logo-img" src="/assets/guava-logo.png" alt="GuavaMC logo"><span>Guava<span>MC</span></span></div><div class="footer-links"><a href="/">Home</a><a href="/blogs">Blog</a><a href="/guides">Guides</a><a href="/jobs">Jobs</a><a href="/#store">Store</a></div><div class="footer-socials"><a href="#">◉</a><a href="#">▶</a><a href="#">♥</a></div><p class="copyright">© 2026 GuavaMC. All Rights Reserved.</p></div></footer>`;
}

async function renderBlogs() {
  const data = await getContent();
  const cards = data.blogs.map(blog => `<article class="content-card reveal-card">
    ${imageOrPlaceholder(blog.image, 'BLOG IMAGE', 'Recommended: 700 × 400px')}
    <div class="content-card-body"><div class="meta">${esc(blog.date)} · ${esc(blog.author)}</div><h2>${esc(blog.title)}</h2><p>${esc(blog.excerpt)}</p><a class="primary-btn" href="/blog/${encodeURIComponent(blog.id)}">READ BLOG <span>→</span></a></div>
  </article>`).join('');
  pageShell('Blog', `<div class="page-grid">${cards || '<p class="empty">No blog posts yet.</p>'}</div>`);
  revealPage();
}

async function renderGuides() {
  const data = await getContent();
  const cards = data.guides.map(guide => `<article class="content-card reveal-card">
    ${imageOrPlaceholder(guide.image, 'GUIDE IMAGE', 'Recommended: 700 × 400px')}
    <div class="content-card-body"><span class="pill">${esc(guide.category)}</span><h2>${esc(guide.title)}</h2><p>${esc(guide.description)}</p><a class="primary-btn" href="/guide/${encodeURIComponent(guide.id)}">OPEN GUIDE <span>→</span></a></div>
  </article>`).join('');
  pageShell('Guides', `<div class="page-grid">${cards || '<p class="empty">No guides yet.</p>'}</div>`);
  revealPage();
}

async function renderBlogDetail(id) {
  const data = await getContent();
  const blog = data.blogs.find(x => x.id === id);
  if (!blog) {
    pageShell('Blog Not Found', '<p class="empty">That blog post does not exist.</p>');
    return;
  }
  const body = `<article class="detail-card reveal-card">
    ${imageOrPlaceholder(blog.image, 'BLOG IMAGE', 'Recommended: 1200 × 650px')}
    <div class="detail-body">
      <div class="meta">${esc(blog.date)} · ${esc(blog.author)}</div>
      <h1>${esc(blog.title)}</h1>
      <p class="detail-excerpt">${esc(blog.excerpt)}</p>
      <div class="article-body">${esc(blog.content).replace(/\n/g,'<br>')}</div>
      <a class="secondary-btn" href="/blogs">← ALL BLOG POSTS</a>
    </div>
  </article>`;
  pageShell(blog.title, body);
  revealPage();
}

async function renderGuideDetail(id) {
  const data = await getContent();
  const guide = data.guides.find(x => x.id === id);
  if (!guide) {
    pageShell('Guide Not Found', '<p class="empty">That guide does not exist.</p>');
    return;
  }
  const body = `<article class="detail-card reveal-card">
    ${imageOrPlaceholder(guide.image, 'GUIDE IMAGE', 'Recommended: 1200 × 650px')}
    <div class="detail-body">
      <span class="pill">${esc(guide.category)}</span>
      <h1>${esc(guide.title)}</h1>
      <p class="detail-excerpt">${esc(guide.description)}</p>
      <div class="article-body">${esc(guide.content).replace(/\n/g,'<br>')}</div>
      <a class="secondary-btn" href="/guides">← ALL GUIDES</a>
    </div>
  </article>`;
  pageShell(guide.title, body);
  revealPage();
}

async function renderJobs() {
  const data = await getContent();
  const cards = data.jobs.map(job => `<article class="job-card reveal-card">
    <div><span class="section-tag">OPEN POSITION</span><h2>${esc(job.title)}</h2><div class="job-meta">${esc(job.type)}${job.location ? ` · ${esc(job.location)}` : ''}</div><p>${esc(job.description)}</p></div>
    <a class="primary-btn" target="_blank" rel="noopener" href="${esc(job.applyUrl || '#')}">${esc(job.buttonText || 'APPLY NOW')} <span>↗</span></a>
  </article>`).join('');
  pageShell('Jobs', `<div class="jobs-list">${cards || '<p class="empty">There are no open positions right now.</p>'}</div>`);
  revealPage();
}

function revealPage() {
  const els = document.querySelectorAll('.reveal-card');
  const io = new IntersectionObserver(entries => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); } }), {threshold:.12});
  els.forEach(e => io.observe(e));
}

const path = location.pathname;
if (path === '/blogs') renderBlogs().catch(console.error);
if (path === '/guides') renderGuides().catch(console.error);
if (path === '/jobs') renderJobs().catch(console.error);
if (path.startsWith('/blog/')) renderBlogDetail(decodeURIComponent(path.split('/')[2] || '')).catch(console.error);
if (path.startsWith('/guide/')) renderGuideDetail(decodeURIComponent(path.split('/')[2] || '')).catch(console.error);
