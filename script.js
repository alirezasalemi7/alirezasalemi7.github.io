// ===== DATA =====
// Data is loaded from JSON files in /data/. Edit those files to update content.

let NEWS = [];
let PUBLICATIONS = [];
let TALKS = [];
let SERVICES = {};
let EXPERIENCE = [];


const SHOW_INITIALLY = 5;

// ===== INIT =====
// Apply saved theme before paint to avoid flash
(function() {
  const t = localStorage.getItem('theme') || 'maroon';
  document.documentElement.setAttribute('data-theme', t);
})();

document.addEventListener('DOMContentLoaded', () => {
  Promise.all([
    fetch('data/news.json').then(r => r.json()),
    fetch('data/publications.json').then(r => r.json()),
    fetch('data/talks.json').then(r => r.json()),
    fetch('data/services.json').then(r => r.json()),
    fetch('data/experience.json').then(r => r.json()),
  ]).then(([news, publications, talks, services, experience]) => {
    NEWS = news;
    PUBLICATIONS = publications;
    TALKS = talks;
    SERVICES = services;
    EXPERIENCE = experience;
    renderExperience();
    renderNews();
    renderTalks();
    renderServices();
    renderPublications(PUBLICATIONS);
    initFilters();
    initSearch();
    initNewsToggle();
  }).catch(err => {
    console.error('Failed to load data files:', err);
  });
  initPageNav();
  initThemeSwitcher();
});

// ===== PAGE NAVIGATION =====
let activePage = null;
let pageStack = []; // history of pages visited in order

function initPageNav() {
  document.querySelectorAll('[data-page]').forEach(el => {
    el.addEventListener('click', e => {
      e.preventDefault();
      navigateTo(el.dataset.page);
    });
  });

  document.querySelectorAll('[data-page-close]').forEach(el => {
    el.addEventListener('click', () => closePage());
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closePage();
  });
}

function navigateTo(pageId) {
  if (activePage === pageId) { closePage(); return; }

  const stackIndex = pageStack.indexOf(pageId);
  const isBack = stackIndex !== -1;

  if (isBack) {
    // Going back to a previously visited page — slide current out to the right
    const current = document.getElementById('page-' + activePage);
    const target = document.getElementById('page-' + pageId);

    // Instantly restore target at correct position (no animation)
    target.style.transition = 'none';
    target.classList.add('active');
    target.offsetHeight; // force reflow
    target.style.transition = '';

    // Slide current page out
    current.classList.add('closing');
    current.classList.remove('active');
    setTimeout(() => current.classList.remove('closing'), 450);

    // Trim stack back to this page
    pageStack = pageStack.slice(0, stackIndex + 1);
  } else {
    // Forward navigation — slide new page in over old
    const prevPageId = activePage;
    if (prevPageId) pageStack.push(prevPageId);

    const page = document.getElementById('page-' + pageId);
    page.classList.add('incoming', 'active');
    page.scrollTop = 0;

    if (prevPageId) {
      const old = document.getElementById('page-' + prevPageId);
      setTimeout(() => {
        old.classList.remove('active');
        page.classList.remove('incoming');
      }, 540);
    } else {
      setTimeout(() => page.classList.remove('incoming'), 540);
    }

    revealPage(page);
  }

  activePage = pageId;
  updateNavActive(pageId);
  document.getElementById('page-header').classList.add('visible');
}

function closePage() {
  if (!activePage) return;
  const page = document.getElementById('page-' + activePage);
  page.classList.add('closing');
  page.classList.remove('active');
  setTimeout(() => page.classList.remove('closing'), 450);
  activePage = null;
  pageStack = [];
  updateNavActive(null);
  document.getElementById('page-header').classList.remove('visible');
}

function updateNavActive(pageId) {
  document.querySelectorAll('[data-page]').forEach(el => {
    el.classList.toggle('active', el.dataset.page === pageId);
  });
}

function revealPage(page) {
  page.querySelectorAll('[data-reveal]').forEach((el, i) => {
    if (el.classList.contains('revealed')) return;
    const delay = parseInt(el.dataset.delay || 0) + i * 60;
    setTimeout(() => el.classList.add('revealed'), delay + 80);
  });
}

// ===== NEWS =====
function renderExperience() {
  const container = document.getElementById('expList');
  EXPERIENCE.forEach(item => {
    const el = document.createElement('div');
    el.className = 'exp-item';
    el.setAttribute('data-reveal', '');
    el.innerHTML = `
      <div class="exp-meta">
        <span class="exp-org">${item.org}</span>
        <span class="exp-date">${item.date}</span>
      </div>
      <div class="exp-body">
        <h3>${item.role}</h3>
        ${item.supervisor ? `<p class="exp-super">Supervised by ${item.supervisor}</p>` : ''}
        <p>${item.desc}</p>
      </div>`;
    container.appendChild(el);
  });
}

function renderNews() {
  const container = document.getElementById('newsTimeline');
  NEWS.forEach((item, i) => {
    const el = document.createElement('div');
    el.className = 'news-item' + (i >= SHOW_INITIALLY ? ' hidden' : '');
    el.innerHTML = `<div class="news-date">${item.date}</div><div class="news-body"><p>${item.text}</p></div>`;
    container.appendChild(el);
  });
}

function initNewsToggle() {
  const btn = document.getElementById('newsToggle');
  btn.addEventListener('click', () => {
    const expanded = btn.dataset.expanded === 'true';
    document.querySelectorAll('.news-item').forEach((el, i) => {
      el.classList.toggle('hidden', expanded && i >= SHOW_INITIALLY);
    });
    btn.textContent = expanded ? 'Show all news' : 'Show less';
    btn.dataset.expanded = expanded ? 'false' : 'true';
  });
}

// ===== TALKS =====
function renderTalks() {
  const list = document.getElementById('talksList');
  TALKS.forEach((t, i) => {
    const el = document.createElement('div');
    el.className = 'talk-item';
    el.setAttribute('data-reveal', '');
    el.setAttribute('data-delay', i * 60);
    el.innerHTML = `
      <span class="talk-date">${t.date}</span>
      <span class="talk-title">${t.title}</span>
      <span class="talk-venue">${t.venue}</span>`;
    list.appendChild(el);
  });
}

// ===== SERVICES =====
function renderServices() {
  const container = document.getElementById('serviceContent');

  // Organizing
  const orgHtml = SERVICES.organizing.map(s => `
    <div class="service-org-item" data-reveal>
      <div class="service-org-meta">
        <span class="service-org-venue">${s.venue}</span>
        <span class="service-org-role">${s.role}</span>
      </div>
      <p class="service-org-desc">${s.desc}</p>
    </div>`).join('');

  // PC badges
  const pcHtml = SERVICES.pc.map(v => `<span class="service-badge">${v}</span>`).join('');

  // Reviewing badges
  const revHtml = SERVICES.reviewing.map(v => `<span class="service-badge">${v}</span>`).join('');

  // Mentoring
  const mentorHtml = SERVICES.mentoring.map(m => `
    <div class="service-mentor-item">
      <span class="service-mentor-program">${m.program}</span>
      <span class="service-mentor-year">${m.year}</span>
      <p class="service-mentor-desc">${m.desc}</p>
    </div>`).join('');

  container.innerHTML = `
    <div class="service-section" data-reveal>
      <h3 class="service-group-title">Organizing</h3>
      <div class="service-org-list">${orgHtml}</div>
    </div>
    <div class="service-row" data-reveal>
      <div class="service-col">
        <h3 class="service-group-title">Program Committee</h3>
        <div class="service-badges">${pcHtml}</div>
      </div>
      <div class="service-col">
        <h3 class="service-group-title">Reviewing</h3>
        <div class="service-badges">${revHtml}</div>
      </div>
    </div>
    <div class="service-section" data-reveal>
      <h3 class="service-group-title">Mentoring</h3>
      <div class="service-mentor-list">${mentorHtml}</div>
    </div>`;
}

// ===== PUBLICATIONS =====
const LINK_LABELS = { paper: 'Paper', code: 'Code', website: 'Website', benchmark: 'Benchmark', demo: 'Demo' };

const VENUE_CLASS = {
  acl: 'venue-acl', emnlp: 'venue-emnlp', sigir: 'venue-sigir', ictir: 'venue-ictir',
  iclr: 'venue-iclr', neurips: 'venue-neurips', www: 'venue-www',
  asplos: 'venue-asplos', workshop: 'venue-workshop', arxiv: 'venue-arxiv'
};

function formatAuthors(authors) {
  return authors.map(a =>
    a === 'Alireza Salemi' ? `<span class="me">${a}</span>` : a
  ).join(', ');
}

function buildPubCard(pub) {
  const chips = `<span class="venue-chip ${VENUE_CLASS[pub.venueType] || 'venue-arxiv'}">${pub.venue}</span>` +
    (pub.award ? `<span class="award-chip">🏆 ${pub.award}</span>` : '');

  const links = Object.entries(pub.links || {}).map(([k, url]) =>
    `<a href="${url}" class="pub-link" target="_blank" rel="noopener">${LINK_LABELS[k] || k}</a>`
  ).join('');

  const titleHtml = pub.links?.paper
    ? `<a href="${pub.links.paper}" target="_blank" rel="noopener">${pub.title}</a>`
    : pub.title;

  const topicTags = (pub.topics || []).map(t =>
    `<span class="topic-tag topic-${t}" data-topic="${t}">${t}</span>`
  ).join('');

  const contribTags = (pub.tags || []).map(t =>
    `<span class="contrib-tag contrib-${t.replace(/\s+/g, '-')}" data-tag="${t}">${t}</span>`
  ).join('');

  const el = document.createElement('div');
  el.className = 'pub-card' + (pub.award ? ' award-paper' : '');
  el.dataset.year = pub.year;
  el.dataset.topics = (pub.topics || []).join(',');
  el.innerHTML = `
    <div class="pub-main">
      <div class="pub-venue-row">${chips}</div>
      <div class="pub-title">${titleHtml}</div>
      <div class="pub-authors">${formatAuthors(pub.authors)}</div>
      ${pub.desc ? `<div class="pub-desc">${pub.desc}</div>` : ''}
      ${links ? `<div class="pub-links">${links}</div>` : ''}
      ${(topicTags || contribTags) ? `<div class="pub-topics">${topicTags}${contribTags ? `<span class="pub-topics-divider"></span>${contribTags}` : ''}</div>` : ''}
    </div>
    <div class="pub-year">${pub.year}</div>`;

  el.querySelectorAll('.topic-tag').forEach(tag => {
    tag.addEventListener('click', () => setTopicFilter(tag.dataset.topic));
  });

  el.querySelectorAll('.contrib-tag').forEach(tag => {
    tag.addEventListener('click', () => {
      const search = document.getElementById('pubSearch');
      search.value = tag.dataset.tag;
      activeSearch = tag.dataset.tag;
      applyFilters();
    });
  });

  return el;
}

function renderPublications(pubs) {
  const list = document.getElementById('pubList');
  const empty = document.getElementById('pubEmpty');
  list.innerHTML = '';

  if (!pubs.length) { empty.classList.remove('hidden'); return; }
  empty.classList.add('hidden');
  pubs.forEach(p => list.appendChild(buildPubCard(p)));
}

let activeYear = 'all';
let activeSearch = '';
let activeTopic = 'all';

function applyFilters() {
  let result = PUBLICATIONS;
  if (activeYear !== 'all') result = result.filter(p => p.year === +activeYear);
  if (activeTopic !== 'all') result = result.filter(p => (p.topics || []).includes(activeTopic));
  if (activeSearch) {
    const q = activeSearch.toLowerCase();
    result = result.filter(p =>
      p.title.toLowerCase().includes(q) ||
      p.venue.toLowerCase().includes(q) ||
      p.authors.some(a => a.toLowerCase().includes(q)) ||
      (p.topics || []).some(t => t.toLowerCase().includes(q)) ||
      (p.tags || []).some(t => t.toLowerCase().includes(q)) ||
      (p.desc || '').toLowerCase().includes(q)
    );
  }
  renderPublications(result);
}

function setTopicFilter(topic) {
  activeTopic = topic;
  document.querySelectorAll('#topicFilter .filter-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.topic === topic);
  });
  applyFilters();
}

function initFilters() {
  document.getElementById('topicFilter').addEventListener('click', e => {
    const btn = e.target.closest('.filter-btn');
    if (!btn) return;
    setTopicFilter(btn.dataset.topic);
  });

  document.getElementById('filterRow').addEventListener('click', e => {
    const btn = e.target.closest('.filter-btn');
    if (!btn) return;
    document.querySelectorAll('#filterRow .filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeYear = btn.dataset.year;
    applyFilters();
  });
}

function initSearch() {
  let timer;
  document.getElementById('pubSearch').addEventListener('input', e => {
    clearTimeout(timer);
    timer = setTimeout(() => { activeSearch = e.target.value.trim(); applyFilters(); }, 200);
  });
}

// ===== THEME SWITCHER =====
function initThemeSwitcher() {
  const panel = document.getElementById('themePanel');
  const toggle = document.getElementById('themeToggle');
  const current = localStorage.getItem('theme') || 'maroon';
  markActiveSwatch(current);

  toggle.addEventListener('click', e => {
    e.stopPropagation();
    panel.classList.toggle('open');
  });

  document.querySelectorAll('[data-theme-pick]').forEach(btn => {
    btn.addEventListener('click', () => {
      const theme = btn.dataset.themePick;
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('theme', theme);
      markActiveSwatch(theme);
      panel.classList.remove('open');
    });
  });

  document.addEventListener('click', e => {
    if (!e.target.closest('#themeSwitcher')) panel.classList.remove('open');
  });
}

function markActiveSwatch(theme) {
  document.querySelectorAll('[data-theme-pick]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.themePick === theme);
  });
}

