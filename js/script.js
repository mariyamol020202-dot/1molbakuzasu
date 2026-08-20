/* =========================================================
   BUILD: 2026-08-20 LATEST-CLOUD-3
   В ЭТОЙ ВЕРСИИ: +новости, +альбомы, +фото, +меловая доска В НОВОСТЯХ, имя+PIN
   МОЛБАКУЗАСУ — основной скрипт сайта
   Статика GitHub Pages + живые новости/медиатека/доска Supabase
   ========================================================= */

const CLOUD_CONFIG = {
  url: 'https://zvmbfugwbylgcaonkowh.supabase.co',
  publishableKey: 'sb_publishable_CYOYpQqXa_nb9Ias9KCi6A__m4FJcFt',
  bucket: 'family-media'
};

/* ---------- базовый интерфейс ---------- */

const menuButton = document.querySelector('.menu-btn');
const nav = document.querySelector('.nav');

if (menuButton && nav) {
  menuButton.addEventListener('click', () => {
    const opened = nav.classList.toggle('open');
    document.body.classList.toggle('menu-open', opened);
    menuButton.textContent = opened ? '×' : '☰';
    menuButton.setAttribute('aria-expanded', String(opened));
  });

  nav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      nav.classList.remove('open');
      document.body.classList.remove('menu-open');
      menuButton.textContent = '☰';
      menuButton.setAttribute('aria-expanded', 'false');
    });
  });
}

function twoDigits(number) {
  return String(number).padStart(2, '0');
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function formatDateRu(value) {
  if (!value) return '';
  try {
    return new Intl.DateTimeFormat('ru-RU', {
      day: 'numeric', month: 'long', year: 'numeric'
    }).format(new Date(`${value}T12:00:00`));
  } catch {
    return value;
  }
}

function todayInputValue() {
  const date = new Date();
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function ensureCloudStyles() {
  if (document.querySelector('link[data-family-cloud-style]')) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'css/family-cloud.css?v=20260820-2';
  link.dataset.familyCloudStyle = '1';
  document.head.appendChild(link);
}

/* ---------- старые фото GitHub: без битых значков и 60 лишних запросов ---------- */

const imageUrlCache = new Map();
const folderPatternCache = new Map();

function candidateList(folder, number) {
  const padded = twoDigits(number);
  const plain = String(number);
  const extensions = ['jpg', 'jpeg', 'png', 'webp', 'JPG', 'JPEG', 'PNG', 'WEBP'];
  const names = [];
  extensions.forEach((ext) => {
    names.push(`${folder}/${padded}.${ext}`);
    if (plain !== padded) names.push(`${folder}/${plain}.${ext}`);
  });
  return [...new Set(names)];
}

function probeImage(url) {
  if (imageUrlCache.has(url)) return Promise.resolve(imageUrlCache.get(url) ? url : null);
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      imageUrlCache.set(url, true);
      resolve(url);
    };
    img.onerror = () => {
      imageUrlCache.set(url, false);
      resolve(null);
    };
    img.src = url;
  });
}

function patternFromUrl(folder, url, number) {
  const filename = url.slice(folder.length + 1);
  const dot = filename.lastIndexOf('.');
  if (dot < 0) return null;
  const stem = filename.slice(0, dot);
  const ext = filename.slice(dot + 1);
  return { padded: stem === twoDigits(number), ext };
}

async function findImageUrl(folder, number) {
  const cacheKey = `${folder}::${number}`;
  if (imageUrlCache.has(cacheKey)) return imageUrlCache.get(cacheKey) || null;

  const pattern = folderPatternCache.get(folder);
  if (pattern) {
    const stem = pattern.padded ? twoDigits(number) : String(number);
    const direct = `${folder}/${stem}.${pattern.ext}`;
    const found = await probeImage(direct);
    if (found) {
      imageUrlCache.set(cacheKey, found);
      return found;
    }
  }

  for (const candidate of candidateList(folder, number)) {
    const found = await probeImage(candidate);
    if (found) {
      folderPatternCache.set(folder, patternFromUrl(folder, found, number));
      imageUrlCache.set(cacheKey, found);
      return found;
    }
  }

  imageUrlCache.set(cacheKey, '');
  return null;
}

function createSkeletonCover() {
  const wrap = document.createElement('div');
  wrap.className = 'content-cover cloud-image-shell';
  wrap.innerHTML = '<div class="cloud-image-skeleton" aria-hidden="true"></div>';
  return wrap;
}

async function fillLegacyCover(wrap, folder, alt) {
  const url = await findImageUrl(folder, 1);
  if (!url || !wrap.isConnected) {
    wrap.classList.add('cloud-cover-empty');
    return;
  }
  const img = document.createElement('img');
  img.className = 'content-cover-image cloud-loaded-image';
  img.alt = alt;
  img.loading = 'eager';
  img.decoding = 'async';
  img.src = url;
  img.addEventListener('load', () => wrap.classList.add('is-loaded'), { once: true });
  wrap.appendChild(img);
}

async function loadLegacyGallery(container, folder, maxPhotos, title) {
  if (!container) return;
  container.innerHTML = '<div class="cloud-gallery-loading">Загружаем фотографии…</div>';
  const items = [];
  const max = Math.max(1, Number(maxPhotos) || 60);

  for (let i = 1; i <= max; i += 1) {
    const url = await findImageUrl(folder, i);
    if (!url) break;
    items.push({ url, name: `${title}-${twoDigits(i)}.jpg` });

    if (i === 1) container.innerHTML = '';
    const figure = document.createElement('figure');
    figure.className = 'photo-tile cloud-clickable-photo';
    const img = document.createElement('img');
    img.src = url;
    img.alt = `${title} — фото ${i}`;
    img.decoding = 'async';
    img.loading = i <= 3 ? 'eager' : 'lazy';
    figure.appendChild(img);
    figure.addEventListener('click', () => openLightbox(items, i - 1));
    container.appendChild(figure);
  }

  if (!items.length) {
    container.innerHTML = '<div class="empty-state">В этом альбоме пока нет фотографий.</div>';
  }
}

/* ---------- статические новости / события ---------- */

function renderNewsPage() {
  const data = window.FAMILY_CONTENT || {};
  const grid = document.querySelector('#eventsGrid');

  if (grid) {
    const events = data.events || [];
    grid.innerHTML = '';
    if (!events.length) {
      grid.innerHTML = '<div class="empty-state">Пока семейных событий нет.</div>';
    } else {
      events.forEach((item, index) => {
        const link = document.createElement('a');
        link.className = 'event-card legacy-event-card';
        link.href = `event.html?id=${encodeURIComponent(item.id)}`;

        const cover = createSkeletonCover();
        link.appendChild(cover);
        fillLegacyCover(cover, item.folder, item.title);

        const copy = document.createElement('div');
        copy.className = 'event-card-copy';
        copy.innerHTML = `
          <div class="event-card-top"><span>${twoDigits(index + 1)}</span><span>${escapeHtml(item.date)}</span></div>
          <p class="news-type">${escapeHtml(item.type || 'СЕМЕЙНОЕ СОБЫТИЕ')}</p>
          <h3>${escapeHtml(item.title)}</h3>
          <p>${escapeHtml(item.summary || '')}</p>
          <strong>Открыть историю и фотографии →</strong>`;
        link.appendChild(copy);
        grid.appendChild(link);
      });
    }
  }

  const birthdays = document.querySelector('#birthdaysBody');
  if (birthdays) {
    birthdays.innerHTML = '';
    (data.birthdays || []).forEach((item) => {
      const row = document.createElement('tr');
      row.innerHTML = `<td>${escapeHtml(item.name)}</td><td>${escapeHtml(item.date || '—')}</td>`;
      birthdays.appendChild(row);
    });
  }
}

function renderEventPage() {
  const root = document.querySelector('#eventDetail');
  if (!root) return;

  const id = new URLSearchParams(location.search).get('id');
  const events = (window.FAMILY_CONTENT || {}).events || [];
  const item = events.find((event) => event.id === id);

  if (!item) {
    root.innerHTML = '<p>Событие не найдено.</p>';
    return;
  }

  document.title = `${item.title} — МолБаКуЗаСу`;
  root.innerHTML = `
    <a class="back" href="news.html">← Ко всем семейным событиям</a>
    <p class="eyebrow">${escapeHtml(item.type || 'СЕМЕЙНОЕ СОБЫТИЕ')} · ${escapeHtml(item.date)}</p>
    <h1 class="detail-title">${escapeHtml(item.title)}</h1>
    <p class="detail-lead">${escapeHtml(item.summary || '')}</p>
    <div class="photo-grid" id="eventPhotos"></div>`;

  loadLegacyGallery(root.querySelector('#eventPhotos'), item.folder, item.maxPhotos || 60, item.title);
}

/* ---------- статическая медиатека ---------- */

function renderGalleryPage() {
  const grid = document.querySelector('#galleryGrid');
  if (!grid) return;

  const albums = (window.FAMILY_CONTENT || {}).albums || [];
  grid.innerHTML = '';

  albums.forEach((album) => {
    const link = document.createElement('a');
    link.className = 'album album-rich legacy-album-card';
    link.href = `album.html?id=${encodeURIComponent(album.id)}`;

    const cover = createSkeletonCover();
    link.appendChild(cover);
    fillLegacyCover(cover, album.folder, album.title);

    const copy = document.createElement('div');
    copy.className = 'album-copy';
    copy.innerHTML = `
      <p>ALBUM ${escapeHtml(album.number)}</p>
      <h3>${escapeHtml(album.title)}</h3>
      <span>${escapeHtml(album.subtitle || '')}</span>
      <strong>Открыть альбом →</strong>`;
    link.appendChild(copy);
    grid.appendChild(link);
  });
}

function looksLikeUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value || '');
}

function renderAlbumPage() {
  const root = document.querySelector('#albumDetail');
  if (!root) return;

  const id = new URLSearchParams(location.search).get('id');
  if (looksLikeUuid(id)) {
    root.innerHTML = '<div class="cloud-gallery-loading">Открываем семейный альбом…</div>';
    return;
  }

  const albums = (window.FAMILY_CONTENT || {}).albums || [];
  const album = albums.find((item) => item.id === id);

  if (!album) {
    root.innerHTML = '<p>Альбом не найден.</p>';
    return;
  }

  document.title = `${album.title} — МолБаКуЗаСу`;
  root.innerHTML = `
    <a class="back" href="gallery.html">← Ко всем альбомам</a>
    <p class="eyebrow">ALBUM ${escapeHtml(album.number)}</p>
    <h1 class="detail-title">${escapeHtml(album.title)}</h1>
    <p class="detail-lead">${escapeHtml(album.subtitle || '')}</p>
    <div class="photo-grid" id="albumPhotos"></div>`;

  loadLegacyGallery(root.querySelector('#albumPhotos'), album.folder, album.maxPhotos || 80, album.title);
}

/* ---------- форма связи ---------- */

const feedbackForm = document.querySelector('#feedbackForm');
if (feedbackForm) {
  const status = document.querySelector('#formStatus');
  feedbackForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const endpoint = (window.FAMILY_SITE_CONFIG || {}).formspreeEndpoint || feedbackForm.action || '';
    if (!endpoint || !endpoint.includes('formspree.io')) {
      status.className = 'form-status error-mode';
      status.textContent = 'Форма пока недоступна. Попробуйте немного позже.';
      return;
    }

    const button = feedbackForm.querySelector('button[type="submit"]');
    button.disabled = true;
    status.className = 'form-status';
    status.textContent = 'Отправляем…';

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        body: new FormData(feedbackForm),
        headers: { Accept: 'application/json' }
      });
      if (!response.ok) throw new Error('send');
      feedbackForm.reset();
      status.className = 'form-status success-mode';
      status.textContent = 'Сообщение отправлено семейному руководству ❤️';
    } catch {
      status.className = 'form-status error-mode';
      status.textContent = 'Не получилось отправить сообщение. Попробуйте ещё раз.';
    } finally {
      button.disabled = false;
    }
  });
}

/* ---------- Lightbox: открыть / увеличить / скачать ---------- */

let lightboxItems = [];
let lightboxIndex = 0;

function ensureLightbox() {
  if (document.querySelector('#familyLightbox')) return;
  const box = document.createElement('div');
  box.id = 'familyLightbox';
  box.className = 'family-lightbox';
  box.setAttribute('aria-hidden', 'true');
  box.innerHTML = `
    <button class="lightbox-close" type="button" aria-label="Закрыть">×</button>
    <button class="lightbox-nav lightbox-prev" type="button" aria-label="Предыдущее фото">‹</button>
    <div class="lightbox-stage">
      <img class="lightbox-image" alt="Семейная фотография">
      <div class="lightbox-meta">
        <span class="lightbox-counter"></span>
        <button class="lightbox-download" type="button">↓ Скачать оригинал</button>
      </div>
    </div>
    <button class="lightbox-nav lightbox-next" type="button" aria-label="Следующее фото">›</button>`;
  document.body.appendChild(box);

  box.querySelector('.lightbox-close').addEventListener('click', closeLightbox);
  box.querySelector('.lightbox-prev').addEventListener('click', () => moveLightbox(-1));
  box.querySelector('.lightbox-next').addEventListener('click', () => moveLightbox(1));
  box.querySelector('.lightbox-download').addEventListener('click', downloadCurrentLightboxImage);
  box.querySelector('.lightbox-image').addEventListener('click', (event) => {
    event.currentTarget.classList.toggle('is-zoomed');
  });
  box.addEventListener('click', (event) => {
    if (event.target === box) closeLightbox();
  });

  document.addEventListener('keydown', (event) => {
    if (!box.classList.contains('open')) return;
    if (event.key === 'Escape') closeLightbox();
    if (event.key === 'ArrowLeft') moveLightbox(-1);
    if (event.key === 'ArrowRight') moveLightbox(1);
  });
}

function openLightbox(items, index = 0) {
  if (!items?.length) return;
  ensureLightbox();
  lightboxItems = items;
  lightboxIndex = Math.max(0, Math.min(index, items.length - 1));
  const box = document.querySelector('#familyLightbox');
  box.classList.add('open');
  box.setAttribute('aria-hidden', 'false');
  document.body.classList.add('lightbox-open');
  paintLightbox();
}

function closeLightbox() {
  const box = document.querySelector('#familyLightbox');
  if (!box) return;
  box.classList.remove('open');
  box.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('lightbox-open');
  box.querySelector('.lightbox-image')?.classList.remove('is-zoomed');
}

function moveLightbox(delta) {
  if (!lightboxItems.length) return;
  lightboxIndex = (lightboxIndex + delta + lightboxItems.length) % lightboxItems.length;
  paintLightbox();
}

function paintLightbox() {
  const box = document.querySelector('#familyLightbox');
  if (!box || !lightboxItems.length) return;
  const item = lightboxItems[lightboxIndex];
  const img = box.querySelector('.lightbox-image');
  img.classList.remove('is-zoomed');
  img.src = item.url;
  img.alt = item.name || 'Семейная фотография';
  box.querySelector('.lightbox-counter').textContent = `${lightboxIndex + 1} / ${lightboxItems.length}`;
  const many = lightboxItems.length > 1;
  box.querySelector('.lightbox-prev').hidden = !many;
  box.querySelector('.lightbox-next').hidden = !many;
}

async function downloadCurrentLightboxImage() {
  const item = lightboxItems[lightboxIndex];
  if (!item) return;
  try {
    const response = await fetch(item.url);
    if (!response.ok) throw new Error('download');
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = item.name || 'family-photo.jpg';
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(objectUrl), 2000);
  } catch {
    window.open(item.url, '_blank', 'noopener');
  }
}

/* =========================================================
   SUPABASE — живые семейные функции
   ========================================================= */

let supabaseClient = null;
const familyState = {
  user: null,
  isMember: false,
  name: localStorage.getItem('molbakuzasu-family-name') || ''
};

function loadSupabaseLibrary() {
  if (window.supabase?.createClient) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-supabase-lib]');
    if (existing) {
      existing.addEventListener('load', resolve, { once: true });
      existing.addEventListener('error', reject, { once: true });
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
    script.async = true;
    script.dataset.supabaseLib = '1';
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

async function refreshFamilyState() {
  if (!supabaseClient) return;
  const { data: sessionData } = await supabaseClient.auth.getSession();
  const session = sessionData?.session || null;
  familyState.user = session?.user || null;
  familyState.isMember = false;

  if (!familyState.user) return;

  const { data, error } = await supabaseClient
    .from('family_members')
    .select('display_name')
    .eq('user_id', familyState.user.id)
    .maybeSingle();

  if (!error && data) {
    familyState.isMember = true;
    familyState.name = data.display_name || familyState.name || 'Семья';
    localStorage.setItem('molbakuzasu-family-name', familyState.name);
  }
}

async function initCloud() {
  /* Интерфейс живых функций показываем сразу, даже пока Supabase подключается. */
  ensureCloudStyles();
  injectCloudControls();
  ensureFamilyBoardSection();

  try {
    await loadSupabaseLibrary();
    if (!window.supabase?.createClient) throw new Error('Supabase library unavailable');

    supabaseClient = window.supabase.createClient(
      CLOUD_CONFIG.url,
      CLOUD_CONFIG.publishableKey,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      }
    );

    await refreshFamilyState();
    refreshCloudActionLabels();

    await Promise.allSettled([
      renderCloudNews(),
      renderCloudGallery(),
      renderCloudAlbum(),
      renderFamilyBoard()
    ]);
  } catch (error) {
    console.warn('Живые семейные функции временно недоступны:', error);
    /* Не убираем кнопки и доску: пользователь хотя бы видит актуальный интерфейс. */
    document.querySelectorAll('[data-family-name-label]').forEach((el) => {
      el.textContent = 'Подключение семейных функций не удалось — обновите страницу';
    });
    const board = document.querySelector('#familyNotesGrid');
    if (board) board.innerHTML = '<div class="chalk-loading">Доска временно не подключилась. Обновите страницу.</div>';
  }
}

function publicMediaUrl(path) {
  if (!path || !supabaseClient) return '';
  const { data } = supabaseClient.storage.from(CLOUD_CONFIG.bucket).getPublicUrl(path);
  return data?.publicUrl || '';
}

function injectCloudUnavailableHint() {
  document.querySelectorAll('.cloud-action-zone').forEach((zone) => {
    zone.innerHTML = '<span class="cloud-muted">Добавление сейчас недоступно, просмотр сайта работает как обычно.</span>';
  });
}

/* ---------- простая семейная авторизация: имя + PIN ---------- */

function ensureAuthModal() {
  let modal = document.querySelector('#familyAuthModal');
  if (modal) return modal;

  modal = document.createElement('div');
  modal.id = 'familyAuthModal';
  modal.className = 'cloud-modal-backdrop';
  modal.hidden = true;
  modal.innerHTML = `
    <div class="cloud-modal cloud-auth-modal" role="dialog" aria-modal="true" aria-labelledby="familyAuthTitle">
      <button class="cloud-modal-close" type="button" aria-label="Закрыть">×</button>
      <p class="eyebrow">ТОЛЬКО ДЛЯ СЕМЬИ</p>
      <h2 id="familyAuthTitle">Кто это у нас?</h2>
      <p class="cloud-modal-lead">Чтобы что-то добавить, достаточно имени и общего семейного кода.</p>
      <form id="familyAuthForm" class="cloud-form">
        <label>Ваше имя<input name="name" autocomplete="name" maxlength="40" required placeholder="Например, Ася"></label>
        <label>Семейный код<input name="pin" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{4}" maxlength="4" required placeholder="••••"></label>
        <button class="cloud-primary-button" type="submit">Войти →</button>
        <div class="cloud-form-status" aria-live="polite"></div>
      </form>
    </div>`;
  document.body.appendChild(modal);

  modal.querySelector('.cloud-modal-close').addEventListener('click', () => closeModal(modal));
  modal.addEventListener('click', (event) => {
    if (event.target === modal) closeModal(modal);
  });
  return modal;
}

let authResolve = null;
let authFailures = 0;
let authLockedUntil = 0;

function requireFamilyAccess() {
  if (familyState.isMember) return Promise.resolve(true);
  if (!supabaseClient) return Promise.resolve(false);

  return new Promise((resolve) => {
    authResolve = resolve;
    const modal = ensureAuthModal();
    const form = modal.querySelector('#familyAuthForm');
    const nameInput = form.elements.name;
    if (familyState.name) nameInput.value = familyState.name;
    form.elements.pin.value = '';
    form.querySelector('.cloud-form-status').textContent = '';
    openModal(modal);
    setTimeout(() => nameInput.focus(), 50);

    form.onsubmit = async (event) => {
      event.preventDefault();
      const status = form.querySelector('.cloud-form-status');
      const button = form.querySelector('button[type="submit"]');
      const now = Date.now();

      if (now < authLockedUntil) {
        const seconds = Math.ceil((authLockedUntil - now) / 1000);
        status.textContent = `Слишком много попыток. Подождите ${seconds} сек.`;
        return;
      }

      const name = form.elements.name.value.trim();
      const pin = form.elements.pin.value.trim();
      if (!name || !/^\d{4}$/.test(pin)) {
        status.textContent = 'Введите имя и 4 цифры семейного кода.';
        return;
      }

      button.disabled = true;
      status.textContent = 'Проверяем…';

      try {
        let { data: sessionData } = await supabaseClient.auth.getSession();
        if (!sessionData?.session?.user) {
          const { data: signData, error: signError } = await supabaseClient.auth.signInAnonymously();
          if (signError) throw signError;
          if (!signData?.user) throw new Error('Anonymous user was not created');
        }

        const { data, error } = await supabaseClient.rpc('claim_family_access', {
          p_name: name,
          p_pin: pin
        });
        if (error) throw error;

        if (data !== true) {
          authFailures += 1;
          if (authFailures >= 3) {
            authLockedUntil = Date.now() + 30000;
            authFailures = 0;
            status.textContent = 'Код не подошёл. Следующая попытка через 30 секунд.';
          } else {
            status.textContent = 'Код не подошёл. Проверьте цифры.';
          }
          return;
        }

        authFailures = 0;
        await refreshFamilyState();
        closeModal(modal);
        refreshCloudActionLabels();
        if (authResolve) authResolve(true);
        authResolve = null;
      } catch (error) {
        console.error('Ошибка семейного входа:', error);

        const message = String(error?.message || error?.error_description || '').trim();
        const lower = message.toLowerCase();

        if (lower.includes('anonymous') && (lower.includes('disabled') || lower.includes('not enabled'))) {
          status.textContent = 'В Supabase выключен анонимный вход. Включите Allow anonymous sign-ins.';
        } else if (lower.includes('signup') && (lower.includes('disabled') || lower.includes('not allowed'))) {
          status.textContent = 'В Supabase запрещено создание новых пользователей. Включите Allow new users to sign up.';
        } else if (lower.includes('captcha')) {
          status.textContent = 'Supabase требует CAPTCHA для анонимного входа. Отключите CAPTCHA либо настройте её для сайта.';
        } else if (lower.includes('api key') || lower.includes('apikey') || lower.includes('jwt')) {
          status.textContent = 'Supabase не принял публичный ключ проекта. Нужно проверить Publishable key.';
        } else if (message) {
          status.textContent = `Supabase не дал войти: ${message}`;
        } else {
          status.textContent = 'Supabase не создал пользователя. Проверьте настройки входа и попробуйте ещё раз.';
        }
      } finally {
        button.disabled = false;
      }
    };
  });
}

function openModal(modal) {
  modal.hidden = false;
  requestAnimationFrame(() => modal.classList.add('open'));
  document.body.classList.add('cloud-modal-open');
}

function closeModal(modal) {
  modal.classList.remove('open');
  document.body.classList.remove('cloud-modal-open');
  setTimeout(() => { modal.hidden = true; }, 180);
  if (modal.id === 'familyAuthModal' && authResolve) {
    authResolve(false);
    authResolve = null;
  }
}

function refreshCloudActionLabels() {
  document.querySelectorAll('[data-family-name-label]').forEach((el) => {
    el.textContent = familyState.isMember ? `Вы вошли как ${familyState.name}` : 'Для публикации нужен семейный код';
  });
}

/* ---------- тулбары ---------- */

function makeActionZone(kind, buttonText) {
  const zone = document.createElement('div');
  zone.className = 'cloud-action-zone';
  zone.dataset.cloudKind = kind;
  zone.innerHTML = `
    <button class="cloud-add-button" type="button">${buttonText}</button>
    <span class="cloud-access-label" data-family-name-label>${familyState.isMember ? `Вы вошли как ${escapeHtml(familyState.name)}` : 'Для публикации нужен семейный код'}</span>`;
  return zone;
}

function injectCloudControls() {
  const eventsGrid = document.querySelector('#eventsGrid') || document.querySelector('.events-grid');
  if (eventsGrid && !document.querySelector('[data-cloud-kind="news"]')) {
    const zone = makeActionZone('news', '＋ Добавить новость');
    eventsGrid.parentElement.insertBefore(zone, eventsGrid);
    zone.querySelector('button').addEventListener('click', async () => {
      if (await requireFamilyAccess()) openNewsModal();
    });
  }

  const galleryGrid = document.querySelector('#galleryGrid') || document.querySelector('.gallery-grid');
  if (galleryGrid && !document.querySelector('[data-cloud-kind="albums"]')) {
    const zone = makeActionZone('albums', '＋ Создать альбом');
    galleryGrid.parentElement.insertBefore(zone, galleryGrid);
    zone.querySelector('button').addEventListener('click', async () => {
      if (await requireFamilyAccess()) openAlbumModal();
    });
  }

  refreshCloudActionLabels();
}

/* ---------- живые новости ---------- */

function ensureNewsModal() {
  let modal = document.querySelector('#familyNewsModal');
  if (modal) return modal;
  modal = document.createElement('div');
  modal.id = 'familyNewsModal';
  modal.className = 'cloud-modal-backdrop';
  modal.hidden = true;
  modal.innerHTML = `
    <div class="cloud-modal" role="dialog" aria-modal="true">
      <button class="cloud-modal-close" type="button" aria-label="Закрыть">×</button>
      <p class="eyebrow">НОВАЯ СЕМЕЙНАЯ НОВОСТЬ</p>
      <h2>Что произошло?</h2>
      <form id="familyNewsForm" class="cloud-form">
        <label>Заголовок<input name="title" maxlength="120" required placeholder="Например, Мы наконец-то собрались все вместе"></label>
        <label>Дата<input name="event_date" type="date"></label>
        <label>Текст<textarea name="body" maxlength="2000" placeholder="Пара слов об этом событии…"></textarea></label>
        <label>Фотография<input name="image" type="file" accept="image/*"></label>
        <button class="cloud-primary-button" type="submit">Опубликовать →</button>
        <div class="cloud-form-status" aria-live="polite"></div>
      </form>
    </div>`;
  document.body.appendChild(modal);
  modal.querySelector('.cloud-modal-close').addEventListener('click', () => closeModal(modal));
  modal.addEventListener('click', (event) => { if (event.target === modal) closeModal(modal); });
  return modal;
}

function openNewsModal() {
  const modal = ensureNewsModal();
  const form = modal.querySelector('#familyNewsForm');
  form.reset();
  form.elements.event_date.value = todayInputValue();
  form.querySelector('.cloud-form-status').textContent = '';
  openModal(modal);

  form.onsubmit = async (event) => {
    event.preventDefault();
    if (!familyState.isMember || !familyState.user) return;
    const status = form.querySelector('.cloud-form-status');
    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    status.textContent = 'Публикуем…';

    let uploadedPath = '';
    try {
      const file = form.elements.image.files?.[0] || null;
      if (file) {
        uploadedPath = await uploadOneFile(file, `news/${familyState.user.id}`);
      }

      const { error } = await supabaseClient.from('family_news').insert({
        author_id: familyState.user.id,
        author_name: familyState.name,
        title: form.elements.title.value.trim(),
        body: form.elements.body.value.trim(),
        event_date: form.elements.event_date.value || null,
        image_path: uploadedPath || null
      });
      if (error) throw error;

      closeModal(modal);
      await renderCloudNews();
    } catch (error) {
      console.error(error);
      if (uploadedPath) await supabaseClient.storage.from(CLOUD_CONFIG.bucket).remove([uploadedPath]);
      status.textContent = 'Не получилось опубликовать. Попробуйте ещё раз.';
    } finally {
      button.disabled = false;
    }
  };
}

async function renderCloudNews() {
  const grid = document.querySelector('#eventsGrid');
  if (!grid || !supabaseClient) return;
  grid.querySelectorAll('.cloud-news-card').forEach((el) => el.remove());

  const { data, error } = await supabaseClient
    .from('family_news')
    .select('*')
    .order('created_at', { ascending: false });
  if (error || !data?.length) return;

  [...data].reverse().forEach((item) => {
    const card = document.createElement('article');
    card.className = 'event-card cloud-news-card';
    const imageUrl = item.image_path ? publicMediaUrl(item.image_path) : '';

    if (imageUrl) {
      const shell = document.createElement('button');
      shell.type = 'button';
      shell.className = 'content-cover cloud-image-shell cloud-news-image';
      shell.innerHTML = `<div class="cloud-image-skeleton"></div><img class="content-cover-image cloud-loaded-image" src="${escapeHtml(imageUrl)}" alt="${escapeHtml(item.title)}" loading="eager" decoding="async">`;
      const img = shell.querySelector('img');
      img.addEventListener('load', () => shell.classList.add('is-loaded'), { once: true });
      shell.addEventListener('click', () => openLightbox([{ url: imageUrl, name: item.title }], 0));
      card.appendChild(shell);
    } else {
      const shell = document.createElement('div');
      shell.className = 'content-cover cloud-no-photo';
      shell.innerHTML = '<span>МОЛБАКУЗАСУ</span>';
      card.appendChild(shell);
    }

    const copy = document.createElement('div');
    copy.className = 'event-card-copy';
    const canDelete = familyState.user?.id === item.author_id;
    copy.innerHTML = `
      <div class="event-card-top"><span>NEW</span><span>${escapeHtml(formatDateRu(item.event_date) || 'Семейная новость')}</span></div>
      <p class="news-type">ОТ ${escapeHtml(item.author_name || 'СЕМЬИ')}</p>
      <h3>${escapeHtml(item.title)}</h3>
      <p>${escapeHtml(item.body || '')}</p>
      ${canDelete ? `<button class="cloud-text-button cloud-delete-news" type="button" data-news-id="${escapeHtml(item.id)}" data-image-path="${escapeHtml(item.image_path || '')}">Удалить мою новость</button>` : ''}`;
    card.appendChild(copy);
    grid.insertBefore(card, grid.firstChild);
  });

  grid.querySelectorAll('.cloud-delete-news').forEach((button) => {
    button.addEventListener('click', async () => {
      if (!confirm('Удалить эту новость?')) return;
      const id = button.dataset.newsId;
      const imagePath = button.dataset.imagePath;
      const { error } = await supabaseClient.from('family_news').delete().eq('id', id);
      if (error) return alert('Не получилось удалить новость.');
      if (imagePath) await supabaseClient.storage.from(CLOUD_CONFIG.bucket).remove([imagePath]);
      await renderCloudNews();
    });
  });
}

/* ---------- живая медиатека ---------- */

function ensureAlbumModal() {
  let modal = document.querySelector('#familyAlbumModal');
  if (modal) return modal;
  modal = document.createElement('div');
  modal.id = 'familyAlbumModal';
  modal.className = 'cloud-modal-backdrop';
  modal.hidden = true;
  modal.innerHTML = `
    <div class="cloud-modal" role="dialog" aria-modal="true">
      <button class="cloud-modal-close" type="button" aria-label="Закрыть">×</button>
      <p class="eyebrow">НОВЫЙ АЛЬБОМ</p>
      <h2>Сохраним это.</h2>
      <form id="familyAlbumForm" class="cloud-form">
        <label>Название альбома<input name="title" maxlength="120" required placeholder="Например, Лето в Суздале"></label>
        <label>Описание<textarea name="description" maxlength="1000" placeholder="Где были и что происходило…"></textarea></label>
        <label>Фотографии<input name="images" type="file" accept="image/*" multiple></label>
        <p class="cloud-small-note">Можно выбрать сразу несколько фотографий. Оригиналы сохранятся в полном качестве.</p>
        <button class="cloud-primary-button" type="submit">Создать альбом →</button>
        <div class="cloud-form-status" aria-live="polite"></div>
      </form>
    </div>`;
  document.body.appendChild(modal);
  modal.querySelector('.cloud-modal-close').addEventListener('click', () => closeModal(modal));
  modal.addEventListener('click', (event) => { if (event.target === modal) closeModal(modal); });
  return modal;
}

function openAlbumModal() {
  const modal = ensureAlbumModal();
  const form = modal.querySelector('#familyAlbumForm');
  form.reset();
  form.querySelector('.cloud-form-status').textContent = '';
  openModal(modal);

  form.onsubmit = async (event) => {
    event.preventDefault();
    if (!familyState.isMember || !familyState.user) return;
    const status = form.querySelector('.cloud-form-status');
    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    status.textContent = 'Создаём альбом…';

    try {
      const { data: album, error } = await supabaseClient
        .from('media_albums')
        .insert({
          author_id: familyState.user.id,
          author_name: familyState.name,
          title: form.elements.title.value.trim(),
          description: form.elements.description.value.trim()
        })
        .select('*')
        .single();
      if (error) throw error;

      const files = [...(form.elements.images.files || [])];
      if (files.length) {
        await uploadPhotosToAlbum(album.id, files, status);
      }

      closeModal(modal);
      location.href = `album.html?id=${encodeURIComponent(album.id)}`;
    } catch (error) {
      console.error(error);
      status.textContent = 'Не получилось создать альбом. Попробуйте ещё раз.';
    } finally {
      button.disabled = false;
    }
  };
}

async function renderCloudGallery() {
  const grid = document.querySelector('#galleryGrid');
  if (!grid || !supabaseClient) return;
  grid.querySelectorAll('.cloud-album-card').forEach((el) => el.remove());

  const [{ data: albums, error: albumsError }, { data: photos, error: photosError }] = await Promise.all([
    supabaseClient.from('media_albums').select('*').order('created_at', { ascending: false }),
    supabaseClient.from('media_photos').select('*').order('sort_order', { ascending: true }).order('created_at', { ascending: true })
  ]);

  if (albumsError || photosError || !albums?.length) return;

  const firstPhoto = new Map();
  (photos || []).forEach((photo) => {
    if (!firstPhoto.has(photo.album_id)) firstPhoto.set(photo.album_id, photo);
  });

  [...albums].reverse().forEach((album, reverseIndex) => {
    const link = document.createElement('a');
    link.className = 'album album-rich cloud-album-card';
    link.href = `album.html?id=${encodeURIComponent(album.id)}`;

    const coverPhoto = firstPhoto.get(album.id);
    if (coverPhoto) {
      const url = publicMediaUrl(coverPhoto.storage_path);
      const shell = document.createElement('div');
      shell.className = 'content-cover cloud-image-shell';
      shell.innerHTML = `<div class="cloud-image-skeleton"></div><img class="content-cover-image cloud-loaded-image" src="${escapeHtml(url)}" alt="${escapeHtml(album.title)}" loading="eager" decoding="async">`;
      shell.querySelector('img').addEventListener('load', () => shell.classList.add('is-loaded'), { once: true });
      link.appendChild(shell);
    } else {
      const shell = document.createElement('div');
      shell.className = 'content-cover cloud-no-photo';
      shell.innerHTML = '<span>НОВЫЙ АЛЬБОМ</span>';
      link.appendChild(shell);
    }

    const copy = document.createElement('div');
    copy.className = 'album-copy';
    copy.innerHTML = `
      <p>FAMILY CLOUD</p>
      <h3>${escapeHtml(album.title)}</h3>
      <span>${escapeHtml(album.description || `Создал(а) ${album.author_name}`)}</span>
      <strong>Открыть альбом →</strong>`;
    link.appendChild(copy);
    grid.insertBefore(link, grid.firstChild);
  });
}

async function renderCloudAlbum() {
  const root = document.querySelector('#albumDetail');
  if (!root || !supabaseClient) return;
  const id = new URLSearchParams(location.search).get('id');
  if (!looksLikeUuid(id)) return;

  const { data: album, error } = await supabaseClient
    .from('media_albums')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error || !album) {
    root.innerHTML = '<p>Альбом не найден.</p>';
    return;
  }

  document.title = `${album.title} — МолБаКуЗаСу`;
  root.innerHTML = `
    <a class="back" href="gallery.html">← Ко всем альбомам</a>
    <p class="eyebrow">СЕМЕЙНАЯ МЕДИАТЕКА · ${escapeHtml(album.author_name || '')}</p>
    <div class="cloud-album-heading">
      <div><h1 class="detail-title">${escapeHtml(album.title)}</h1><p class="detail-lead">${escapeHtml(album.description || '')}</p></div>
      <button class="cloud-add-button" id="addPhotosToAlbum" type="button">＋ Добавить фотографии</button>
    </div>
    <div class="cloud-upload-status" id="albumUploadStatus"></div>
    <div class="photo-grid" id="albumPhotos"></div>`;

  root.querySelector('#addPhotosToAlbum').addEventListener('click', async () => {
    if (!(await requireFamilyAccess())) return;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    input.addEventListener('change', async () => {
      const files = [...(input.files || [])];
      if (!files.length) return;
      const status = root.querySelector('#albumUploadStatus');
      try {
        await uploadPhotosToAlbum(album.id, files, status);
        await renderCloudAlbum();
      } catch (error) {
        console.error(error);
        status.textContent = 'Не все фотографии удалось загрузить.';
      }
    }, { once: true });
    input.click();
  });

  await renderCloudAlbumPhotos(album.id, root.querySelector('#albumPhotos'), album.title);
}

async function renderCloudAlbumPhotos(albumId, container, albumTitle) {
  const { data: photos, error } = await supabaseClient
    .from('media_photos')
    .select('*')
    .eq('album_id', albumId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) {
    container.innerHTML = '<div class="empty-state">Не получилось загрузить фотографии.</div>';
    return;
  }

  if (!photos?.length) {
    container.innerHTML = '<div class="empty-state">В альбоме пока нет фотографий. Можно добавить первые.</div>';
    return;
  }

  const lightbox = photos.map((photo, index) => ({
    url: publicMediaUrl(photo.storage_path),
    name: photo.original_name || `${albumTitle}-${twoDigits(index + 1)}.jpg`
  }));

  container.innerHTML = '';
  photos.forEach((photo, index) => {
    const figure = document.createElement('figure');
    figure.className = 'photo-tile cloud-clickable-photo cloud-photo-with-actions';
    const img = document.createElement('img');
    img.src = publicMediaUrl(photo.storage_path);
    img.alt = photo.caption || `${albumTitle} — фото ${index + 1}`;
    img.decoding = 'async';
    img.loading = index < 4 ? 'eager' : 'lazy';
    figure.appendChild(img);
    figure.addEventListener('click', (event) => {
      if (event.target.closest('.cloud-photo-delete')) return;
      openLightbox(lightbox, index);
    });

    if (familyState.user?.id === photo.uploader_id) {
      const del = document.createElement('button');
      del.type = 'button';
      del.className = 'cloud-photo-delete';
      del.textContent = '×';
      del.title = 'Удалить мою фотографию';
      del.addEventListener('click', async (event) => {
        event.stopPropagation();
        if (!confirm('Удалить эту фотографию?')) return;
        const { error: dbError } = await supabaseClient.from('media_photos').delete().eq('id', photo.id);
        if (dbError) return alert('Не получилось удалить фотографию.');
        await supabaseClient.storage.from(CLOUD_CONFIG.bucket).remove([photo.storage_path]);
        await renderCloudAlbumPhotos(albumId, container, albumTitle);
      });
      figure.appendChild(del);
    }

    container.appendChild(figure);
  });
}

async function uploadPhotosToAlbum(albumId, files, statusEl) {
  if (!familyState.user || !familyState.isMember) throw new Error('not member');
  const { count } = await supabaseClient
    .from('media_photos')
    .select('*', { count: 'exact', head: true })
    .eq('album_id', albumId);
  let order = Number(count) || 0;

  for (let i = 0; i < files.length; i += 1) {
    if (statusEl) statusEl.textContent = `Загружаем ${i + 1} из ${files.length}…`;
    const file = files[i];
    const path = await uploadOneFile(file, `albums/${albumId}/${familyState.user.id}`);
    const { error } = await supabaseClient.from('media_photos').insert({
      album_id: albumId,
      uploader_id: familyState.user.id,
      uploader_name: familyState.name,
      storage_path: path,
      original_name: file.name,
      sort_order: order
    });
    if (error) {
      await supabaseClient.storage.from(CLOUD_CONFIG.bucket).remove([path]);
      throw error;
    }
    order += 1;
  }
  if (statusEl) statusEl.textContent = `Готово: ${files.length} фото загружено.`;
}

async function uploadOneFile(file, prefix) {
  const extFromName = file.name.includes('.') ? file.name.split('.').pop().toLowerCase() : '';
  const ext = /^[a-z0-9]{2,5}$/.test(extFromName) ? extFromName : 'jpg';
  const uuid = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const path = `${prefix}/${uuid}.${ext}`;
  const { error } = await supabaseClient.storage.from(CLOUD_CONFIG.bucket).upload(path, file, {
    cacheControl: '31536000',
    upsert: false,
    contentType: file.type || undefined
  });
  if (error) throw error;
  return path;
}

/* ---------- семейная меловая доска ---------- */

function ensureFamilyBoardSection() {
  const onNewsPage = /news\.html$/i.test(location.pathname) || Boolean(document.querySelector('#eventsGrid'));
  if (!onNewsPage) return null;
  let section = document.querySelector('#familyBoard');
  if (section) return section;

  section = document.createElement('section');
  section.id = 'familyBoard';
  section.className = 'family-board-section';
  section.innerHTML = `
    <div class="family-board-head">
      <div><p class="eyebrow">FAMILY BOARD</p><h2>Семейная<br>доска.</h2></div>
      <div class="family-board-actions"><p>Быстрая новость, напоминание, шутка или просто мысль — оставьте её мелом.</p><button class="cloud-add-button light" id="addFamilyNote" type="button">＋ Написать мелом</button></div>
    </div>
    <div class="chalkboard"><div class="chalk-notes" id="familyNotesGrid"><div class="chalk-loading">Загружаем записки…</div></div></div>`;

  const anchor = document.querySelector('.birthday-section') || document.querySelector('footer');
  if (anchor) anchor.parentElement.insertBefore(section, anchor);
  else document.body.appendChild(section);

  section.querySelector('#addFamilyNote').addEventListener('click', async () => {
    if (await requireFamilyAccess()) openNoteModal();
  });
  return section;
}

function ensureNoteModal() {
  let modal = document.querySelector('#familyNoteModal');
  if (modal) return modal;
  modal = document.createElement('div');
  modal.id = 'familyNoteModal';
  modal.className = 'cloud-modal-backdrop';
  modal.hidden = true;
  modal.innerHTML = `
    <div class="cloud-modal" role="dialog" aria-modal="true">
      <button class="cloud-modal-close" type="button" aria-label="Закрыть">×</button>
      <p class="eyebrow">СЕМЕЙНАЯ ДОСКА</p>
      <h2>Что написать мелом?</h2>
      <form id="familyNoteForm" class="cloud-form">
        <label>Записка<textarea name="body" maxlength="1000" required placeholder="Например, 30 августа все к бабушке! Не опаздывать :) "></textarea></label>
        <button class="cloud-primary-button" type="submit">Написать мелом →</button>
        <div class="cloud-form-status" aria-live="polite"></div>
      </form>
    </div>`;
  document.body.appendChild(modal);
  modal.querySelector('.cloud-modal-close').addEventListener('click', () => closeModal(modal));
  modal.addEventListener('click', (event) => { if (event.target === modal) closeModal(modal); });
  return modal;
}

function openNoteModal() {
  const modal = ensureNoteModal();
  const form = modal.querySelector('#familyNoteForm');
  form.reset();
  form.querySelector('.cloud-form-status').textContent = '';
  openModal(modal);

  form.onsubmit = async (event) => {
    event.preventDefault();
    if (!familyState.user || !familyState.isMember) return;
    const status = form.querySelector('.cloud-form-status');
    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    status.textContent = 'Пишем…';
    try {
      const { error } = await supabaseClient.from('family_notes').insert({
        author_id: familyState.user.id,
        author_name: familyState.name,
        body: form.elements.body.value.trim()
      });
      if (error) throw error;
      closeModal(modal);
      await renderFamilyBoard();
    } catch (error) {
      console.error(error);
      status.textContent = 'Не получилось оставить записку.';
    } finally {
      button.disabled = false;
    }
  };
}

function tiltFromId(id) {
  let sum = 0;
  for (const char of String(id)) sum += char.charCodeAt(0);
  return ((sum % 7) - 3) * 0.45;
}

async function renderFamilyBoard() {
  const section = ensureFamilyBoardSection();
  if (!section || !supabaseClient) return;
  const grid = section.querySelector('#familyNotesGrid');

  const { data: notes, error } = await supabaseClient
    .from('family_notes')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    grid.innerHTML = '<div class="chalk-loading">Записки сейчас не загрузились.</div>';
    return;
  }

  if (!notes?.length) {
    grid.innerHTML = '<div class="chalk-empty">Пока чисто. Кто-то должен написать первым.</div>';
    return;
  }

  grid.innerHTML = '';
  notes.forEach((note) => {
    const article = document.createElement('article');
    article.className = 'chalk-note';
    article.style.setProperty('--tilt', `${tiltFromId(note.id)}deg`);
    const canDelete = familyState.user?.id === note.author_id;
    article.innerHTML = `
      ${canDelete ? `<button class="chalk-erase" type="button" title="Стереть мою записку">стереть ×</button>` : ''}
      <p>${escapeHtml(note.body)}</p>
      <footer>— ${escapeHtml(note.author_name || 'Кто-то из наших')}</footer>`;
    if (canDelete) {
      article.querySelector('.chalk-erase').addEventListener('click', async () => {
        if (!confirm('Стереть эту записку?')) return;
        const { error: deleteError } = await supabaseClient.from('family_notes').delete().eq('id', note.id);
        if (!deleteError) await renderFamilyBoard();
      });
    }
    grid.appendChild(article);
  });
}

/* ---------- запуск ---------- */

function startMolbakuzasuSite() {
  renderNewsPage();
  renderEventPage();
  renderGalleryPage();
  renderAlbumPage();
  ensureLightbox();
  initCloud();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startMolbakuzasuSite, { once: true });
} else {
  startMolbakuzasuSite();
}
