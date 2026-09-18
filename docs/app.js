/* MITRA course site
 *
 * Reads the syllabus from data/courses.json, renders a module/lesson browser with a
 * video player, and keeps per-lesson completion in localStorage. No backend, no build
 * step — GitHub Pages serves this directory as-is.
 */

const REPO = 'https://github.com/RishiR123/MITRA-Students';
const STORE_KEY = 'mitra.progress.v1';
const THEME_KEY = 'mitra.theme';
const LAST_KEY = 'mitra.last';

let course = null;
let flat = [];          // every lesson, in order, with its module attached
let notesCache = new Map();

/* ── storage ─────────────────────────────────────────────────────────────
   Every read and write is guarded: private windows and blocked site data make
   localStorage throw, and the site must still work when it does. */

function loadProgress() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch { return new Set(); }
}

function saveProgress(set) {
  try { localStorage.setItem(STORE_KEY, JSON.stringify([...set])); } catch {}
}

let done = loadProgress();

function isDone(id) { return done.has(id); }

function setDone(id, value) {
  if (value) done.add(id); else done.delete(id);
  saveProgress(done);
}

function remember(hash) { try { localStorage.setItem(LAST_KEY, hash); } catch {} }

/* ── helpers ─────────────────────────────────────────────────────────── */

const $ = (sel, root = document) => root.querySelector(sel);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
));

const ICON = {
  check: '<svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 6.5L4.8 8.8L9.5 3.5"/></svg>',
  chev: '<svg class="chev" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>',
  clock: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  play: '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>',
  link: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/></svg>',
  search: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>',
  pr: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="6" r="2.5"/><circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M6 8.5v7M8.5 6H14a3 3 0 0 1 3 3v6.5"/></svg>',
};

function toast(msg) {
  const el = $('#toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.classList.remove('show'), 2200);
}

/* ── markdown ────────────────────────────────────────────────────────────
   `marked` is loaded from a CDN in index.html. If it didn't load — offline, blocked
   CDN — fall back to showing the raw Markdown rather than an empty panel. */

function renderMarkdown(src) {
  if (window.marked?.parse) {
    return window.marked.parse(src, { mangle: false, headerIds: false });
  }
  return `<pre>${esc(src)}</pre>`;
}

/* ── video ───────────────────────────────────────────────────────────── */

function playerHTML(lesson) {
  const v = lesson.video || { provider: 'pending' };

  if (v.provider === 'youtube' && v.id) {
    return `<iframe src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(v.id)}?rel=0&modestbranding=1"
      title="${esc(lesson.title)}" loading="lazy" allowfullscreen
      allow="accelerometer; encrypted-media; picture-in-picture; fullscreen"
      referrerpolicy="strict-origin-when-cross-origin"></iframe>`;
  }

  if (v.provider === 'vimeo' && v.id) {
    return `<iframe src="https://player.vimeo.com/video/${encodeURIComponent(v.id)}"
      title="${esc(lesson.title)}" loading="lazy" allowfullscreen
      allow="autoplay; fullscreen; picture-in-picture"></iframe>`;
  }

  if (v.provider === 'mp4' && v.url) {
    return `<video controls preload="metadata" playsinline
      ${v.poster ? `poster="${esc(v.poster)}"` : ''}>
      <source src="${esc(v.url)}" type="video/mp4">
      Your browser can't play this video.
    </video>`;
  }

  return `
    <div class="player-pending">
      <div class="big">This lesson's video isn't published yet</div>
      <div class="small">
        The notes and resources below are ready — start with those.
        <br><br>
        <strong>Mentors:</strong> set <code>video</code> for lesson
        <code>${esc(lesson.id)}</code> in <code>courses/courses.json</code> and merge —
        the site redeploys automatically.
      </div>
    </div>`;
}

/* ── sidebar ─────────────────────────────────────────────────────────── */

function moduleStats(mod) {
  const total = mod.lessons.length;
  const complete = mod.lessons.filter((l) => isDone(l.id)).length;
  return { total, complete, pct: total ? Math.round((complete / total) * 100) : 0 };
}

function overallStats() {
  const total = flat.length;
  const complete = flat.filter((l) => isDone(l.id)).length;
  return { total, complete, pct: total ? Math.round((complete / total) * 100) : 0 };
}

function renderSidebar(activeId = null, filter = '') {
  const toc = $('#toc');
  const q = filter.trim().toLowerCase();

  const modules = course.modules
    .map((mod) => {
      const lessons = q
        ? mod.lessons.filter((l) =>
            l.title.toLowerCase().includes(q) ||
            l.id.toLowerCase().includes(q) ||
            mod.title.toLowerCase().includes(q))
        : mod.lessons;
      return { mod, lessons };
    })
    .filter((m) => m.lessons.length);

  if (!modules.length) {
    toc.innerHTML = `<div class="no-results">No lessons match &ldquo;${esc(filter)}&rdquo;</div>`;
    return;
  }

  toc.innerHTML = modules.map(({ mod, lessons }) => {
    const st = moduleStats(mod);
    const hasActive = lessons.some((l) => l.id === activeId);
    const open = q || hasActive || (!activeId && mod === course.modules[0]);

    return `
      <div class="mod ${open ? 'open' : ''} ${st.complete === st.total ? 'complete' : ''}" data-mod="${esc(mod.id)}">
        <button class="mod-head" aria-expanded="${open}">
          <span class="mod-num">${st.complete === st.total ? ICON.check : mod.number}</span>
          <span class="mod-meta">
            <span class="mod-title">${esc(mod.title)}</span>
            <span class="mod-count">${st.complete}/${st.total} lessons</span>
          </span>
          ${ICON.chev}
        </button>
        <div class="lessons">
          ${lessons.map((l) => `
            <button class="lesson ${isDone(l.id) ? 'done' : ''} ${l.id === activeId ? 'active' : ''}"
                    data-go="#/${esc(mod.id)}/${esc(l.id)}">
              <span class="tick">${ICON.check}</span>
              <span class="lesson-name">${esc(l.id)} &nbsp;${esc(l.title)}</span>
              <span class="lesson-dur ${l.video?.provider === 'pending' ? 'pending' : ''}">
                ${l.video?.provider === 'pending' ? 'soon' : esc(l.duration || '')}
              </span>
            </button>`).join('')}
        </div>
      </div>`;
  }).join('');

  const st = overallStats();
  $('#overall-pct').textContent = `${st.complete} / ${st.total}`;
  $('#overall-bar').style.width = `${st.pct}%`;
}

/* ── views ───────────────────────────────────────────────────────────── */

function renderHome() {
  const st = overallStats();
  const totalMin = flat.reduce((sum, l) => {
    const [m, s] = String(l.duration || '0:0').split(':').map(Number);
    return sum + (m || 0) + (s || 0) / 60;
  }, 0);

  $('#main').innerHTML = `
    <div class="wrap">
      <div class="hero">
        <h1>${esc(course.program)} — ${esc(course.cohort.replace('cohort-', 'Cohort '))}</h1>
        <p>${esc(course.tagline)} Watch the lessons, build the project for each module,
           and submit it as a pull request. A mentor reviews it and merges it.</p>
        <div class="actions">
          <button class="btn btn-primary" data-go="${resumeHash()}">
            ${ICON.play} ${st.complete ? 'Resume where you left off' : 'Start Module 1'}
          </button>
          <a class="btn btn-ghost" href="${REPO}/blob/main/CONTRIBUTING.md" target="_blank" rel="noopener">
            ${ICON.pr} How to submit work
          </a>
        </div>
      </div>

      <div class="stats">
        <div class="stat"><div class="n">${course.modules.length}</div><div class="l">Modules</div></div>
        <div class="stat"><div class="n">${st.total}</div><div class="l">Lessons</div></div>
        <div class="stat"><div class="n">${Math.round(totalMin / 60)}h</div><div class="l">Of video</div></div>
        <div class="stat"><div class="n">${st.pct}%</div><div class="l">You've completed</div></div>
      </div>

      <p class="section-label">The curriculum</p>
      <div class="mod-cards">
        ${course.modules.map((mod) => {
          const ms = moduleStats(mod);
          return `
            <a class="mod-card" data-go="#/${esc(mod.id)}/${esc(mod.lessons[0].id)}" href="#/${esc(mod.id)}/${esc(mod.lessons[0].id)}">
              <div class="mod-card-head">
                <span class="mod-num">${ms.complete === ms.total ? ICON.check : mod.number}</span>
                <h3>${esc(mod.title)}</h3>
                <span class="pct">${ms.complete}/${ms.total}</span>
              </div>
              <p>${esc(mod.summary)}</p>
              <div class="chips">
                <span class="chip">${esc(mod.duration)}</span>
                <span class="chip">${mod.lessons.length} lessons</span>
                ${mod.project ? `<span class="chip">Project required</span>` : ''}
              </div>
              <div class="bar"><i style="width:${ms.pct}%"></i></div>
            </a>`;
        }).join('')}
      </div>
    </div>`;

  renderSidebar(null, $('#search').value);
  document.title = `${course.program} — Course`;
}

async function renderLesson(modId, lessonId) {
  const idx = flat.findIndex((l) => l.id === lessonId && l.mod.id === modId);
  if (idx === -1) { location.hash = ''; return; }

  const { mod, ...lesson } = flat[idx];
  const prev = flat[idx - 1];
  const next = flat[idx + 1];
  const complete = isDone(lesson.id);

  $('#main').innerHTML = `
    <div class="wrap">
      <div class="crumb">
        <a href="#/">${esc(course.program)}</a> ›
        <b>Module ${mod.number} — ${esc(mod.title)}</b>
      </div>
      <h1>${esc(lesson.title)}</h1>
      <div class="lesson-meta">
        <span>Lesson ${esc(lesson.id)}</span>
        ${lesson.duration ? `<span>${ICON.clock} ${esc(lesson.duration)}</span>` : ''}
        ${complete ? `<span style="color:var(--done)">${ICON.check} Completed</span>` : ''}
      </div>

      <div class="player">${playerHTML(lesson)}</div>

      <div class="actions">
        <button class="btn ${complete ? 'btn-ghost' : 'btn-done'}" id="toggle-done">
          ${complete ? 'Mark as not done' : `${ICON.check} Mark complete${next ? ' &amp; continue' : ''}`}
        </button>
        <a class="btn btn-ghost" href="${REPO}/issues/new?template=doubt.yml" target="_blank" rel="noopener">
          Ask a doubt
        </a>
        ${mod.project ? `
          <a class="btn btn-ghost" href="${REPO}/blob/main/CONTRIBUTING.md" target="_blank" rel="noopener">
            ${ICON.pr} Submit Module ${mod.number}
          </a>` : ''}
      </div>

      <div class="notes" id="notes"><p style="color:var(--text-faint)">Loading notes…</p></div>

      ${lesson.resources?.length ? `
        <p class="section-label">Further reading</p>
        <ul class="resources">
          ${lesson.resources.map((r) => `
            <li><a href="${esc(r.url)}" target="_blank" rel="noopener">${ICON.link} ${esc(r.label)}</a></li>
          `).join('')}
        </ul>` : ''}

      <div class="pager">
        ${prev
          ? `<a href="#/${esc(prev.mod.id)}/${esc(prev.id)}"><span class="dir">← Previous</span><span class="what">${esc(prev.title)}</span></a>`
          : '<span class="spacer"></span>'}
        ${next
          ? `<a class="next" href="#/${esc(next.mod.id)}/${esc(next.id)}"><span class="dir">Next →</span><span class="what">${esc(next.title)}</span></a>`
          : `<a class="next" href="#/"><span class="dir">Finished →</span><span class="what">Back to the overview</span></a>`}
      </div>
    </div>`;

  document.title = `${lesson.id} ${lesson.title} — ${course.program}`;
  renderSidebar(lesson.id, $('#search').value);
  $('#main').scrollTop = 0;

  $('#toggle-done').addEventListener('click', () => {
    const nowDone = !isDone(lesson.id);
    setDone(lesson.id, nowDone);
    if (nowDone && next) {
      toast(`Lesson ${lesson.id} complete`);
      location.hash = `#/${next.mod.id}/${next.id}`;
    } else {
      toast(nowDone ? `Lesson ${lesson.id} complete — that's the module done` : 'Marked as not done');
      renderLesson(modId, lessonId);
    }
  });

  loadNotes(lesson.notes);
}

async function loadNotes(path) {
  const box = $('#notes');
  if (!box) return;

  if (!path) {
    box.innerHTML = '<p style="color:var(--text-faint)">No written notes for this lesson.</p>';
    return;
  }

  if (notesCache.has(path)) { box.innerHTML = notesCache.get(path); return; }

  try {
    const res = await fetch(path);
    if (!res.ok) throw new Error(String(res.status));
    const html = renderMarkdown(await res.text());
    notesCache.set(path, html);
    if ($('#notes')) $('#notes').innerHTML = html;
  } catch {
    box.innerHTML = `
      <p style="color:var(--text-faint)">
        Written notes for this lesson haven't been added yet.
        <a href="${REPO}/blob/main/${esc(path)}" target="_blank" rel="noopener">Write them →</a>
      </p>`;
  }
}

/* ── routing ─────────────────────────────────────────────────────────── */

function resumeHash() {
  const firstUndone = flat.find((l) => !isDone(l.id));
  if (firstUndone) return `#/${firstUndone.mod.id}/${firstUndone.id}`;
  try {
    const last = localStorage.getItem(LAST_KEY);
    if (last) return last;
  } catch {}
  const first = flat[0];
  return first ? `#/${first.mod.id}/${first.id}` : '#/';
}

function route() {
  const parts = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  document.body.classList.remove('nav-open');

  if (parts.length >= 2) {
    remember(location.hash);
    renderLesson(parts[0], parts.slice(1).join('/'));
  } else {
    renderHome();
  }
}

/* ── boot ────────────────────────────────────────────────────────────── */

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  try { localStorage.setItem(THEME_KEY, theme); } catch {}
  $('#theme-btn').setAttribute('aria-label', theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
}

async function fetchSyllabus() {
  // data/courses.json is assembled by the Pages workflow. The ../courses fallback is
  // for opening docs/index.html straight from a clone.
  for (const url of ['data/courses.json', '../courses/courses.json']) {
    try {
      const res = await fetch(url);
      if (res.ok) return await res.json();
    } catch {}
  }
  throw new Error('Could not load the syllabus');
}

async function init() {
  try { applyTheme(localStorage.getItem(THEME_KEY) || 'dark'); } catch { applyTheme('dark'); }

  try {
    course = await fetchSyllabus();
  } catch {
    $('#main').innerHTML = `
      <div class="wrap">
        <h1>Couldn't load the course</h1>
        <p style="color:var(--text-muted)">
          The syllabus file didn't load. If you're opening this file directly from your
          computer, your browser is blocking the fetch — run a local server instead:
        </p>
        <div class="notes"><pre><code>python3 -m http.server 8000
# then open http://localhost:8000/docs/</code></pre></div>
      </div>`;
    return;
  }

  flat = course.modules.flatMap((mod) => mod.lessons.map((l) => ({ ...l, mod })));

  // Drop progress for lessons that no longer exist, so counts stay honest.
  const live = new Set(flat.map((l) => l.id));
  let pruned = false;
  for (const id of [...done]) if (!live.has(id)) { done.delete(id); pruned = true; }
  if (pruned) saveProgress(done);

  route();
  window.addEventListener('hashchange', route);

  // Delegated navigation — every [data-go] element routes.
  document.addEventListener('click', (e) => {
    const target = e.target.closest('[data-go]');
    if (target) { e.preventDefault(); location.hash = target.dataset.go; return; }

    const head = e.target.closest('.mod-head');
    if (head) {
      const mod = head.closest('.mod');
      mod.classList.toggle('open');
      head.setAttribute('aria-expanded', mod.classList.contains('open'));
    }
  });

  $('#search').addEventListener('input', (e) => {
    const active = $('.lesson.active')?.querySelector('.lesson-name')?.textContent.trim().split(/\s/)[0];
    renderSidebar(active || null, e.target.value);
  });

  $('#theme-btn').addEventListener('click', () => {
    applyTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
  });

  $('#menu-btn').addEventListener('click', () => document.body.classList.toggle('nav-open'));
  $('#backdrop').addEventListener('click', () => document.body.classList.remove('nav-open'));

  document.addEventListener('keydown', (e) => {
    if (e.target.matches('input, textarea')) {
      if (e.key === 'Escape') { e.target.value = ''; e.target.blur(); renderSidebar(); }
      return;
    }
    if (e.key === '/') { e.preventDefault(); $('#search').focus(); }
    if (e.key === 'Escape') document.body.classList.remove('nav-open');

    const cur = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
    if (cur.length < 2) return;
    const idx = flat.findIndex((l) => l.mod.id === cur[0] && l.id === cur[1]);
    if (idx === -1) return;

    if ((e.key === 'j' || e.key === 'ArrowRight') && flat[idx + 1]) {
      location.hash = `#/${flat[idx + 1].mod.id}/${flat[idx + 1].id}`;
    }
    if ((e.key === 'k' || e.key === 'ArrowLeft') && flat[idx - 1]) {
      location.hash = `#/${flat[idx - 1].mod.id}/${flat[idx - 1].id}`;
    }
    if (e.key === 'c') $('#toggle-done')?.click();
  });
}

init();
