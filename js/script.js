const menuButton = document.querySelector('.menu-btn');
const nav = document.querySelector('.nav');

if (menuButton && nav) {
  menuButton.addEventListener('click', () => {
    const opened = nav.classList.toggle('open');
    document.body.classList.toggle('menu-open', opened);
    menuButton.textContent = opened ? '×' : '☰';
    menuButton.setAttribute('aria-expanded', String(opened));
  });

  nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
    nav.classList.remove('open');
    document.body.classList.remove('menu-open');
    menuButton.textContent = '☰';
    menuButton.setAttribute('aria-expanded', 'false');
  }));
}

function twoDigits(number) {
  return String(number).padStart(2, '0');
}

function smartImage(folder, number, alt, className = '', onFinalError = null) {
  const img = document.createElement('img');
  const base = `${folder}/${twoDigits(number)}`;
  const extensions = ['jpg', 'jpeg', 'png', 'webp'];
  let index = 0;
  img.src = `${base}.${extensions[index]}`;
  img.alt = alt;
  img.loading = 'lazy';
  if (className) img.className = className;
  img.onerror = () => {
    index += 1;
    if (index < extensions.length) img.src = `${base}.${extensions[index]}`;
    else {
      if (typeof onFinalError === 'function') onFinalError();
      img.remove();
    }
  };
  return img;
}

function coverImage(folder, alt) {
  const wrap = document.createElement('div');
  wrap.className = 'content-cover';
  const fallback = document.createElement('div');
  fallback.className = 'content-cover-fallback';
  fallback.textContent = 'PHOTO';
  wrap.appendChild(fallback);
  const img = smartImage(folder, 1, alt, 'content-cover-image');
  wrap.appendChild(img);
  return wrap;
}

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
        link.className = 'event-card';
        link.href = `event.html?id=${encodeURIComponent(item.id)}`;
        link.appendChild(coverImage(item.folder, item.title));
        const copy = document.createElement('div');
        copy.className = 'event-card-copy';
        copy.innerHTML = `
          <div class="event-card-top"><span>${twoDigits(index + 1)}</span><span>${item.date}</span></div>
          <p class="news-type">${item.type || 'СЕМЕЙНОЕ СОБЫТИЕ'}</p>
          <h3>${item.title}</h3>
          <p>${item.summary || ''}</p>
          <strong>Открыть историю и фотографии →</strong>`;
        link.appendChild(copy);
        grid.appendChild(link);
      });
    }
  }

  const birthdays = document.querySelector('#birthdaysBody');
  if (birthdays) {
    birthdays.innerHTML = '';
    (data.birthdays || []).forEach(item => {
      const row = document.createElement('tr');
      row.innerHTML = `<td>${item.name}</td><td>${item.date || '—'}</td>`;
      birthdays.appendChild(row);
    });
  }
}

function renderEventPage() {
  const root = document.querySelector('#eventDetail');
  if (!root) return;
  const id = new URLSearchParams(location.search).get('id');
  const events = (window.FAMILY_CONTENT || {}).events || [];
  const item = events.find(event => event.id === id) || events[0];
  if (!item) {
    root.innerHTML = '<p>Событие не найдено.</p>';
    return;
  }

  document.title = `${item.title} — МолБаКуЗаСу`;
  root.innerHTML = `
    <a class="back" href="news.html">← Ко всем семейным событиям</a>
    <p class="eyebrow">${item.type || 'СЕМЕЙНОЕ СОБЫТИЕ'} · ${item.date}</p>
    <h1 class="detail-title">${item.title}</h1>
    <p class="detail-lead">${item.summary || ''}</p>
    <div class="photo-grid" id="eventPhotos"></div>`;

  const photos = root.querySelector('#eventPhotos');
  for (let i = 1; i <= (item.maxPhotos || 30); i += 1) {
    const frame = document.createElement('figure');
    frame.className = 'photo-tile';
    const img = smartImage(item.folder, i, `${item.title} — фото ${i}`, '', () => frame.remove());
    frame.appendChild(img);
    photos.appendChild(frame);
  }
}

function renderGalleryPage() {
  const grid = document.querySelector('#galleryGrid');
  if (!grid) return;
  const albums = (window.FAMILY_CONTENT || {}).albums || [];
  grid.innerHTML = '';
  albums.forEach(album => {
    const link = document.createElement('a');
    link.className = 'album album-rich';
    link.href = `album.html?id=${encodeURIComponent(album.id)}`;
    link.appendChild(coverImage(album.folder, album.title));
    const copy = document.createElement('div');
    copy.className = 'album-copy';
    copy.innerHTML = `<p>ALBUM ${album.number}</p><h3>${album.title}</h3><span>${album.subtitle || ''}</span><strong>Открыть альбом →</strong>`;
    link.appendChild(copy);
    grid.appendChild(link);
  });
}

function renderAlbumPage() {
  const root = document.querySelector('#albumDetail');
  if (!root) return;
  const id = new URLSearchParams(location.search).get('id');
  const albums = (window.FAMILY_CONTENT || {}).albums || [];
  const album = albums.find(item => item.id === id) || albums[0];
  if (!album) {
    root.innerHTML = '<p>Альбом не найден.</p>';
    return;
  }

  document.title = `${album.title} — МолБаКуЗаСу`;
  root.innerHTML = `
    <a class="back" href="gallery.html">← Ко всем альбомам</a>
    <p class="eyebrow">ALBUM ${album.number}</p>
    <h1 class="detail-title">${album.title}</h1>
    <p class="detail-lead">${album.subtitle || ''}</p>
    <div class="photo-grid" id="albumPhotos"></div>`;

  const photos = root.querySelector('#albumPhotos');
  for (let i = 1; i <= (album.maxPhotos || 40); i += 1) {
    const frame = document.createElement('figure');
    frame.className = 'photo-tile';
    const img = smartImage(album.folder, i, `${album.title} — фото ${i}`, '', () => frame.remove());
    frame.appendChild(img);
    photos.appendChild(frame);
  }
}

const feedbackForm = document.querySelector('#feedbackForm');
if (feedbackForm) {
  const status = document.querySelector('#formStatus');
  feedbackForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const endpoint = (window.FAMILY_SITE_CONFIG || {}).formspreeEndpoint || '';
    if (!endpoint) {
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

renderNewsPage();
renderEventPage();
renderGalleryPage();
renderAlbumPage();
