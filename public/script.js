const revealElements = document.querySelectorAll(".reveal");

const observer = new IntersectionObserver((entries, observerInstance) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;

    entry.target.classList.add("visible");
    observerInstance.unobserve(entry.target);
  });
}, {
  threshold: 0.12,
  rootMargin: "0px 0px -60px 0px"
});

revealElements.forEach((element) => observer.observe(element));

const copyButton = document.getElementById("copyIp");
const toast = document.getElementById("toast");

copyButton.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText("play.guavamc.net");
    toast.textContent = "IP copied!";
  } catch {
    toast.textContent = "play.guavamc.net";
  }

  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 1800);
});


// Load CMS content into the existing home page without changing its layout.
(async () => {
  if (location.pathname !== '/') return;
  try {
    const data = await fetch('/api/content').then(r => r.json());
    const site = data.site || {};
    const hero = document.querySelector('.hero');
    if (hero && site.heroImage) {
      const type = (site.heroMediaType || 'auto').toLowerCase();
      const isVideo = type === 'video' || (type === 'auto' && /\.mp4(?:$|[?#])/i.test(site.heroImage));
      const existingVideo = hero.querySelector('.hero-media-video');
      if (isVideo) {
        hero.style.backgroundImage = 'none';
        if (!existingVideo) {
          const video = document.createElement('video');
          video.className = 'hero-media-video';
          video.src = site.heroImage;
          video.autoplay = true;
          video.muted = true;
          video.loop = true;
          video.playsInline = true;
          video.setAttribute('aria-hidden', 'true');
          hero.prepend(video);
        }
      } else {
        existingVideo?.remove();
        hero.style.backgroundImage = `url("${site.heroImage}")`;
      }
    }

    const serverButton = document.querySelector('.server-button');
    if (serverButton) serverButton.innerHTML = `${site.serverIp || 'play.guavamc.net'} <b>${site.serverCount || ''}</b>`;

    const newsTrack = document.querySelector('.blog-slider .slider-track');
    if (newsTrack && Array.isArray(data.blogs)) {
      newsTrack.innerHTML = data.blogs.slice(0, 6).map((blog, i) => `
        <article class="slide ${i === 0 ? 'active' : ''}">
          <div class="image-field news-image ${blog.image ? '' : 'empty-image'}">${blog.image ? `<img src="${escapeHtml(blog.image)}" alt="">` : ''}</div>
          <div class="news-copy"><h3>${escapeHtml(blog.title)}</h3><div class="meta">${escapeHtml(blog.date)} · ${escapeHtml(blog.author)}</div><p>${escapeHtml(blog.excerpt)}</p><a class="text-link" href="/blogs">READ MORE →</a></div>
        </article>`).join('');
      setupSlider(document.querySelector('.blog-slider'));
    }

    const teamTrack = document.querySelector('.team-slider .slider-track');
    const teamThumbs = document.querySelector('[data-team-thumbnails]');
    if (teamTrack && Array.isArray(data.team)) {
      teamTrack.innerHTML = data.team.map((member, i) => `
        <article class="slide team-card ${i === 0 ? 'active' : ''}">
          <div class="team-copy">
            <span class="section-tag">GUAVAMC TEAM</span>
            <h2>Meet The Team</h2>
            <p class="subtitle">Meet the people who make GuavaMC amazing!</p>
            <div class="member-heading"><strong>${escapeHtml(member.name)}</strong><span>${escapeHtml(member.roleType)}</span></div>
            <p class="member-description">${escapeHtml(member.description)}</p>
          </div>
          <div class="image-field team-image ${member.image ? '' : 'empty-image'}">${member.image ? `<img src="${escapeHtml(member.image)}" alt="${escapeHtml(member.name)}">` : ''}</div>
        </article>`).join('');

      if (teamThumbs) {
        teamThumbs.innerHTML = data.team.map((member, i) => `
          <button class="team-thumb ${i === 0 ? 'active' : ''}" type="button" data-team-slide="${i}" aria-label="Show ${escapeHtml(member.name)}">
            ${member.image ? `<img src="${escapeHtml(member.image)}" alt="">` : ''}
          </button>`).join('');
      }

      setupTeamSlider(document.querySelector('.team-slider'));
    }

    const community = document.querySelector('.social-image');
    if (community && site.communityImage) community.innerHTML = `<img src="${escapeHtml(site.communityImage)}" alt="GuavaMC community">`;
    const modeMap = [['.mode-card:nth-child(1) .mode-image', site.economyImage], ['.mode-card:nth-child(2) .mode-image', site.boxpvpImage], ['.mode-card:nth-child(3) .mode-image', site.practiceImage]];
    modeMap.forEach(([selector, src]) => { const el = document.querySelector(selector); if (el && src) el.innerHTML = `<img src="${escapeHtml(src)}" alt="">`; });

    const discord = document.querySelector('.discord-btn');
    if (discord && site.discordUrl) discord.href = site.discordUrl;
  } catch (e) {
    console.warn('CMS content could not be loaded:', e);
  }
})();

function escapeHtml(value = '') {
  return String(value).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
}

function setupTeamSlider(slider) {
  if (!slider) return;
  const slides = [...slider.querySelectorAll('.slide')];
  const prev = slider.querySelector('[data-prev]');
  const next = slider.querySelector('[data-next]');
  const thumbs = [...document.querySelectorAll('[data-team-slide]')];
  const progress = slider.parentElement?.querySelector('.team-progress span') || document.querySelector('.team-progress span');
  if (!slides.length) return;

  // Prevent duplicate handlers if CMS content is refreshed.
  if (slider.dataset.teamReady === 'true') return;
  slider.dataset.teamReady = 'true';

  const duration = 7000;
  let current = 0;
  let timer = null;
  let animationFrame = null;
  let startedAt = 0;

  const resetProgress = () => {
    if (!progress) return;
    progress.style.width = '0%';
    startedAt = performance.now();
    cancelAnimationFrame(animationFrame);
    const tick = (now) => {
      const elapsed = now - startedAt;
      const pct = Math.min(100, (elapsed / duration) * 100);
      progress.style.width = `${pct}%`;
      if (pct < 100) animationFrame = requestAnimationFrame(tick);
    };
    animationFrame = requestAnimationFrame(tick);
  };

  const restart = () => {
    clearTimeout(timer);
    resetProgress();
    timer = setTimeout(() => show(current + 1), duration);
  };

  const show = (index, reset = true) => {
    current = (index + slides.length) % slides.length;
    slides.forEach((slide, i) => slide.classList.toggle('active', i === current));
    thumbs.forEach((thumb, i) => thumb.classList.toggle('active', i === current));
    if (reset) restart();
  };

  prev?.addEventListener('click', (event) => { event.preventDefault(); show(current - 1); });
  next?.addEventListener('click', (event) => { event.preventDefault(); show(current + 1); });
  thumbs.forEach((thumb) => thumb.addEventListener('click', (event) => { event.preventDefault(); show(Number(thumb.dataset.teamSlide)); }));
  show(0);
}

function setupSlider(slider) {
  if (!slider) return;
  const slides = [...slider.querySelectorAll('.slide')];
  const dots = slider.parentElement.querySelector('[data-dots]');
  const prev = slider.querySelector('[data-prev]');
  const next = slider.querySelector('[data-next]');
  const progress = slider.parentElement.querySelector('.slider-progress span');
  if (!slides.length) return;

  const duration = 6500;
  let current = 0;
  let timer = null;
  let animationFrame = null;
  let startedAt = 0;

  const resetProgress = () => {
    if (!progress) return;
    progress.style.width = '0%';
    startedAt = performance.now();
    cancelAnimationFrame(animationFrame);
    const tick = (now) => {
      const elapsed = now - startedAt;
      const pct = Math.min(100, (elapsed / duration) * 100);
      progress.style.width = `${pct}%`;
      if (pct < 100) animationFrame = requestAnimationFrame(tick);
    };
    animationFrame = requestAnimationFrame(tick);
  };

  const restart = () => {
    clearTimeout(timer);
    resetProgress();
    timer = setTimeout(() => show(current + 1), duration);
  };

  const renderDots = () => {
    if (!dots) return;
    dots.innerHTML = slides.map((_, i) => `<button aria-label="Go to slide ${i + 1}" class="${i === current ? 'active' : ''}" data-slide="${i}"></button>`).join('');
    dots.querySelectorAll('button').forEach(b => b.addEventListener('click', () => show(Number(b.dataset.slide))));
  };

  const show = (index, reset = true) => {
    current = (index + slides.length) % slides.length;
    slides.forEach((s, i) => s.classList.toggle('active', i === current));
    dots?.querySelectorAll('button').forEach((b, i) => b.classList.toggle('active', i === current));
    if (reset) restart();
  };

  prev?.addEventListener('click', () => show(current - 1));
  next?.addEventListener('click', () => show(current + 1));
  renderDots();
  show(0);
}
