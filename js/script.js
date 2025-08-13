/* ===== SCRIPT: CONFIG, HELPERS, SECTION LOGIC ===== */

const CONFIG = {
  appsScriptUrl: "https://script.google.com/macros/s/AKfycbzTAZlCvjIwWBz8nYTvsUVaakt783uDu3BIsP0wYr36Cqy7X2rPHbWR0YlV70qu2BGy/exec",
  faqAnswerOptionsEnabled: false,
  event: {
    title: "ДОНО & САГИТ — Свадебная вечеринка",
    start: "2025-09-13T17:45:00", // ISO (локальное время)
    durationMinutes: 300,
    location: "Ташкент Малая кольцевая дорога, 70a",
    uidDomain: "donosagit.example.local"
  }
};

// ----- DATA LOADERS -----
async function loadText() {
  const res = await fetch('data/text.json');
  if (!res.ok) throw new Error('Не удалось загрузить data/text.json');
  return res.json();
}

// ----- DOM HELPERS -----
function el(q) { return document.querySelector(q); }
function els(q) { return Array.from(document.querySelectorAll(q)); }

// Safe: переводит \n в <br>
function nl2brSafe(str = "") {
  return escapeHtml(str).replace(/\n/g, '<br>');
}

document.addEventListener('DOMContentLoaded', async () => {
  /* ===== BOOTSTRAP / GLOBAL INIT ===== */
  // iOS detection для CSS-фикса кнопки
  const ua = navigator.userAgent || navigator.vendor || window.opera;
  const isIOS = /iPad|iPhone|iPod/.test(ua);
  if (isIOS) document.documentElement.classList.add('ios');

  // гарантируем старт с самого верха и без восстановленного скролла
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  window.scrollTo({ top: 0, behavior: 'auto' });

  let data;
  try {
    data = await loadText();
  } catch (e) {
    console.error(e);
    alert('Ошибка загрузки data/text.json. Проверьте, что в JSON нет комментариев и он валиден.');
    return;
  }

  /* ===== HERO SECTION (multistep) ===== */
  // Step 1: Имена
  el('#hero-line1').textContent = data.header.hero_line1_raw || "";
  el('#hero-and-text').textContent = data.header.hero_line2_raw || "";
  el('#hero-line3').textContent = data.header.hero_line3_raw || "";

  // Step 2: PARTY LINES
  el('#party-line1').textContent = data.header.hero_party_lines[0] || "";
  el('#party-line2').textContent = data.header.hero_party_lines[1] || "";
  el('#party-line3').textContent = data.header.hero_party_lines[2] || "";

  // Step 3: meta note + date
  el('#hero-meta-note').textContent = data.header.hero_meta_note || "";
  el('#hero-date-full').textContent = data.header.hero_date_full || "";

  // Step 5: Главный экран
  el('#hero-main-line1').textContent = data.header.hero_line1_raw || "";
  el('#hero-main-and-text').textContent = data.header.hero_line2_raw || "";
  el('#hero-main-line3').textContent = data.header.hero_line3_raw || "";
  el('#hero-main-meta-note').textContent = data.header.hero_meta_note || "";
  // Разбить дату на части
  const dateFull = (data.header.hero_date_full || "").trim();
  const dateParts = dateFull.match(/^(\d{1,2})\s+([A-Za-zA-Яа-я]+)\s+(\d{4})$/);
  if (dateParts) {
    el('#hero-main-date-day').textContent = dateParts[1];
    el('#hero-main-date-month').textContent = dateParts[2];
    el('#hero-main-date-year').textContent = dateParts[3];
  } else {
    el('#hero-main-date-full').textContent = dateFull;
  }
  el('#countdown-label').textContent = data.header.hero_countdown_label || "";
  startCountdown(CONFIG.event.start, el('#countdown'));

  // Overlay в hero включается при реальном скролле (>8px) и пока блок в вьюпорте
  const stepsRoot = el('#hero-steps');
  const bgFixed = stepsRoot.querySelector('.hero-bg-fixed');
  const paperBg = el('.paper-bg-fixed');
  const inviteEl = el('#invite');

  let overlayActive = false;
  function onScrollUpdate() {
    const rect = stepsRoot.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight;
    const inView = rect.bottom > 0 && rect.top < vh;
    const active = (window.scrollY > 8) && inView;

    if (active !== overlayActive) {
      overlayActive = active;
      stepsRoot.classList.toggle('overlay-on', overlayActive);
      if (!overlayActive) {
        // уходим назад к чистому фону — скрыть тексты шагов
        els('.hero-step-content.show').forEach(n => n.classList.remove('show'));
      } else {
        // при входе — показать видимый шаг
        els('.hero-step-content').forEach(n => {
          const r = n.getBoundingClientRect();
          const visible = Math.min(r.bottom, vh) - Math.max(r.top, 0);
          const ratio = Math.max(0, visible) / Math.max(1, r.height);
          if (ratio >= 0.6) n.classList.add('show');
        });
      }
    }
  }
  window.addEventListener('scroll', onScrollUpdate, { passive: true });
  window.addEventListener('resize', onScrollUpdate);
  onScrollUpdate();

  // Reveal текста шагов: только когда overlayActive = true
  els('.hero-step-content').forEach((node) => {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting && overlayActive) node.classList.add('show');
        else if (!e.isIntersecting) node.classList.remove('show');
      });
    }, { threshold: 0.6 });
    obs.observe(node);
  });

  /* ===== INVITE SECTION ===== */
  function normalizeSections(inv = {}) {
    // Новый формат: sections[]
    if (Array.isArray(inv.sections)) return inv.sections.filter(s => s && (s.title || s.text));
    // Фолбэк на старый формат (если вдруг)
    const keys = ['location','date','quest','additional','dress_code'];
    return keys.map(k => inv[k]).filter(s => s && (s.title || s.text));
  }

  function renderInvite(inv = {}) {
    const blocks = [];
    if (inv.description) {
      const d = inv.description;
      const sub = d.subTitle ?? d['sub-title'];
      blocks.push(`
        <header class="inv-head">
          ${d.title ? `<h3 class="inv-h1">${nonBreaking(d.title)}</h3>` : ``}
          ${sub ? `<div class="inv-subtitle">${escapeHtml(sub)}</div>` : ``}
          ${d.text ? `<p class="inv-text">${nl2brSafe(d.text)}</p>` : ``}
        </header>
      `);
    }

    // Sections (в порядке массива)
    const sections = normalizeSections(inv);
    sections.forEach(sec => {
      const icon = sec.icon ? `<span class="icon" aria-hidden="true">${escapeHtml(sec.icon)}</span>` : '';
      const title = sec.title ? `<h4 class="inv-title">${icon}${escapeHtml(sec.title)}</h4>` : '';
      const text  = sec.text ? `<p class="inv-text">${nl2brSafe(sec.text)}</p>` : '';
      if (title || text) blocks.push(`<section class="inv-section">${title}${text}</section>`);
    });

    // Footer
    if (inv.footer?.text) {
      blocks.push(`<footer class="inv-footer"><p>${nl2brSafe(inv.footer.text)}</p></footer>`);
    }

    return `<div class="inv">${blocks.join('')}</div>`;
  }

  // Render Invite
  el('#invite-text').innerHTML = renderInvite(data.invite);

  /* ===== SCHEDULE SECTION ===== */
  const sc = data.schedule || {};
  el('#schedule-title').textContent = sc.title || "";
  const pre = el('#schedule-content');
  if (Array.isArray(sc.content)) {
    pre.innerHTML = sc.content.map(it => renderScheduleLine(it.time, it.event)).join('');
  } else {
    // фолбэк на строку, если старый формат
    pre.textContent = sc.content || "";
  }

  /* ===== PHOTO SECTION ===== */
  el('#photo-title').textContent = data.photo.title;
  el('#photo-text').textContent = data.photo.text;

  /* ===== ADDRESS SECTION ===== */
  const addr = data.address || {};
  el('#address-title').textContent    = addr.title || 'Адрес';
  el('#address-location').textContent = addr.location || '';
  el('#address-text').textContent     = addr.description || '';
  const mapInfo = await (await fetch('map/location.json')).json();
  const iframe = el('#map-iframe');
  // Встраиваем Яндекс карту (фиксированный виджет)
  const lat = Number(mapInfo.lat), lng = Number(mapInfo.lng);
  const hasCoords = Number.isFinite(lat) && Number.isFinite(lng);
  const yEmbed = hasCoords
    ? `https://yandex.ru/map-widget/v1/?ll=${encodeURIComponent(lng)},${encodeURIComponent(lat)}&z=16&l=map&pt=${encodeURIComponent(lng)},${encodeURIComponent(lat)},pm2rdm`
    : `https://yandex.ru/map-widget/v1/?text=${encodeURIComponent(mapInfo.query || '')}`;
  iframe.src = yEmbed;

  // Map actions: open in apps (deep-links via web)
  const gHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapInfo.query || (hasCoords ? `${lat},${lng}` : ''))}`;
  const yHref = hasCoords
    ? `https://yandex.ru/maps/?ll=${encodeURIComponent(lng)},${encodeURIComponent(lat)}&z=16&pt=${encodeURIComponent(lng)},${encodeURIComponent(lat)},pm2rdm`
    : `https://yandex.ru/maps/?text=${encodeURIComponent(mapInfo.query || '')}`;
  const gBtn = el('#map-open-google');
  const yBtn = el('#map-open-yandex');
  if (gBtn) {
    gBtn.href = gHref;
    const label = addr.mapLabels?.google || 'Открыть в Google Maps';
    gBtn.setAttribute('aria-label', label);
    gBtn.setAttribute('title', label);
  }
  if (yBtn) {
    yBtn.href = yHref;
    const label = addr.mapLabels?.yandex || 'Открыть в Яндекс.Картах';
    yBtn.setAttribute('aria-label', label);
    yBtn.setAttribute('title', label);
  }

  /* ===== FOOTER SECTION ===== */
  el('#footer-slogan').textContent = data.footer.slogan || "";

  /* ===== FAQ SECTION ===== */
  const faqList = el('#faq-list');
  const faqData = data.faq || {};
  const faqItems = Array.isArray(faqData.items) ? faqData.items
                   : (Array.isArray(data.faq) ? data.faq : []);
  const faqTitleEl = el('#faq-title');
  if (faqTitleEl) faqTitleEl.textContent = faqData.title || 'FAQ';

  faqItems.forEach(item => {
    const details = document.createElement('details');
    const summary = document.createElement('summary');
    summary.textContent = item.q;
    details.appendChild(summary);

    // всегда показываем первый ответ
    const answers = Array.isArray(item.answers) ? item.answers : [];
    const p = document.createElement('p');
    p.textContent = answers[0] || "";
    details.appendChild(p);

    // селектор вариантов только если включено и есть >1 ответа
    if (CONFIG.faqAnswerOptionsEnabled && answers.length > 1) {
      const sel = document.createElement('select');
      sel.className = 'faq-variant-select';
      answers.forEach((a,i)=> {
        const opt = document.createElement('option');
        opt.value = i; opt.text = `Вариант ${i+1}`;
        sel.appendChild(opt);
      });
      sel.addEventListener('change', (e)=> {
        p.textContent = answers[e.target.value];
      });
      details.appendChild(sel);
    }

    faqList.appendChild(details);
  });

  /* ===== RSVP SECTION ===== */
  // Заголовок секции
  el('#rsvp-title').textContent = data.rsvp_labels.title || 'RSVP';
  // подписи полей
  el('#rsvp-name-label').textContent = data.rsvp_labels.firstName || '';
  el('#rsvp-lastname-label').textContent = data.rsvp_labels.lastName || '';
  el('#rsvp-note-label').textContent = data.rsvp_labels.note || '';
  // легенда группы «приду/не приду» — используем заголовок как групповой лейбл
  el('#rsvp-attend-label').textContent = data.rsvp_labels.title || '';
  // радио-подписи
  el('#rsvp-attend-yes').textContent = data.rsvp_labels.attendYes || 'Я буду!';
  el('#rsvp-attend-no').textContent  = data.rsvp_labels.attendNo  || 'Увы, не смогу';
  // плейсхолдеры
  el('#rsvp-form input[name="firstName"]').placeholder = data.rsvp_labels.firstNamePlaceholder || "";
  el('#rsvp-form input[name="lastName"]').placeholder  = data.rsvp_labels.lastNamePlaceholder  || "";
  el('#rsvp-form textarea[name="note"]').placeholder   = data.rsvp_labels.notePlaceholder      || "";
  // текст кнопки
  const submitBtn = el('#rsvp-submit');
  if (submitBtn) {
    const btnText = data.rsvp_labels.button || 'Отправить';
    submitBtn.textContent = btnText;
    // для iOS-фикса дублируем текст в data-атрибут
    submitBtn.setAttribute('data-label', btnText);
  }

  /* ===== NAV SECTION ===== */
  const burger = el('#burger'), navOverlay = el('#nav-overlay');
  burger.addEventListener('click', ()=> {
    const open = navOverlay.classList.toggle('open');
    burger.setAttribute('aria-expanded', String(open));
  });

  /* ===== AUDIO TOGGLE ===== */
  const audio = el('#bg-audio');
  const audioBtn = el('#audio-toggle');
  const audioIcon = el('#audio-icon');

  if (audio) {
    audio.autoplay = false;
    try { audio.pause(); } catch(_) {}
  }

  let audioAllowed = false;
  const ICONS = {
    on:  'assets/img/sound-state-on.png',
    off: 'assets/img/sound-state-off.png'
  };
  const setUI = (isOn) => {
    if (!audioIcon || !audioBtn) return;
    audioIcon.src = isOn ? ICONS.on : ICONS.off;
    audioBtn.setAttribute('aria-pressed', isOn ? 'true' : 'false');
    audioBtn.setAttribute('aria-label', isOn ? 'Выключить звук' : 'Включить звук');
  };

  if (audio && audioBtn) {
    // защита от чужого автозапуска
    audio.addEventListener('play', () => { if (!audioAllowed) audio.pause(); });

    audioBtn.addEventListener('click', () => {
      if (audio.paused) {
        audioAllowed = true;
        audio.play().then(() => setUI(true)).catch(()=>{ /* play blocked */ });
      } else {
        audio.pause();
        audioAllowed = false;
        setUI(false);
      }
    });

    // начальное состояние
    setUI(false);
  }

  /* ===== CALENDAR (.ics) ===== */
  el('#calendar-btn').addEventListener('click', (e) => {
    generateICS();
    openCalHelpModal();
  });

  // Синхронизация размера кнопки звука с высотой кнопки календаря
  const calBtn = el('#calendar-btn');
  if (calBtn && audioBtn) {
    const syncIconBtnSize = () => {
      const h = Math.max(32, calBtn.offsetHeight || 0);
      audioBtn.style.setProperty('--icon-btn-size', `${h}px`);
    };
    syncIconBtnSize();
    window.addEventListener('resize', syncIconBtnSize);
    window.addEventListener('load', syncIconBtnSize);
    setTimeout(syncIconBtnSize, 200); // на случай поздней подгрузки шрифтов
  }

  // RSVP form submit
  const form = el('#rsvp-form');
  const status = el('#rsvp-status');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(form);

    const firstName = formData.get('firstName')?.toString().trim();
    const lastName  = formData.get('lastName')?.toString().trim();
    if (!firstName || !lastName) {
      status.textContent = 'Пожалуйста, заполните имя и фамилию.';
      return;
    }
    if (!CONFIG.appsScriptUrl) {
      status.textContent = 'RSVP: локально — сохранено. Настройте appsScriptUrl.';
      console.log('RSVP payload:', Object.fromEntries(formData.entries()));
      return;
    }

    try {
      status.textContent = 'Отправляем...';
      await fetch(CONFIG.appsScriptUrl, {
        method: 'POST',
        mode: 'no-cors',          // обходим CORS
        body: formData            // form-data; на сервере читаем e.parameter
      });
      // Оpaque-ответ: считаем успешным, если сеть не бросила исключение
      status.textContent = 'Спасибо! Ответ записан.';
      form.reset();
    } catch (err) {
      console.error(err);
      status.textContent = 'Ошибка сети. Попробуйте позже.';
    }
  });

  // Reveal animations for general sections
  const revealObserver = new IntersectionObserver((entries)=>{
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('show');
      }
    });
  }, {threshold: 0.15});
  els('.fade-in, .slide-up, .card, .section-title').forEach(n => revealObserver.observe(n));

  // Navbar fade-in on load
  el('.nav').classList.add('fade-in');
  setTimeout(() => {
    el('.nav').classList.add('show');
  }, 100);

  // Nav darken on scroll
  window.addEventListener('scroll', ()=> {
    const nav = el('#main-nav');
    if (window.scrollY > 20) nav.classList.add('scrolled'); else nav.classList.remove('scrolled');
  }, {passive:true});

  // Close menu on outside click
  navOverlay.addEventListener('mousedown', (e) => {
    if (!e.target.closest('.menu-panel')) {
      navOverlay.classList.remove('open');
      burger.setAttribute('aria-expanded', 'false');
    }
  });

  // Close menu on nav item click
  els('.menu-panel a').forEach(link => {
    link.addEventListener('click', () => {
      navOverlay.classList.remove('open');
      burger.setAttribute('aria-expanded', 'false');
    });
  });

  // Toggle paper texture when entering/leaving Invite
  function updatePaperBg() {
    if (!inviteEl || !paperBg) return;
    const r = inviteEl.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight;
    // Порог показа: как только Invite начинает входить в вьюпорт (чуть раньше)
    const showThreshold = vh - 80;
    // Порог скрытия вверх: когда верх Invite достиг верха экрана (ровно на границе)
    if (r.top <= showThreshold) {
      paperBg.classList.add('visible');
    }
    if (r.top >= 0) {
      paperBg.classList.remove('visible');
    }
  }
  window.addEventListener('scroll', updatePaperBg, { passive: true });
  window.addEventListener('resize', updatePaperBg);
  updatePaperBg();

  // Линковка всех @username (5–32 символов [A-Za-z0-9_]) на базу из links.json
  function linkifyHandles(text, base = "https://t.me/") {
    const safe = escapeHtml(text || "");
    const re = /(^|[\s(])@([A-Za-z0-9_]{5,32})\b/g;
    return safe.replace(re, (m, pre, user) =>
      `${pre}<a class="tg-handle" href="${base}${user}" target="_blank" rel="noopener">@${user}</a>`
    );
  }

  let links = {};
  try {
    const resp = await fetch('data/links.json');
    if (resp.ok) links = await resp.json();
  } catch (_) {}

  const tgBase = links?.telegram?.base || 'https://t.me/';

  // PHOTO: авто-линкуем @ник в тексте
  const photoTextEl = document.querySelector('#photo-text');
  if (photoTextEl && data?.photo?.text) {
    photoTextEl.innerHTML = linkifyHandles(data.photo.text, tgBase);
  }

  // Footer credit: авто-линковка @ника
  const footerCreditEl = el('#footer-credit');
  if (footerCreditEl && data?.footer?.credit) {
    footerCreditEl.innerHTML = linkifyHandles(data.footer.credit, tgBase);
  }

  /* ===== CALENDAR HELP MODAL ===== */
  function getDeviceType() {
    const ua = navigator.userAgent || '';
    const platform = navigator.platform || '';
    if (/android/i.test(ua)) return 'android';
    if (/iphone|ipad|ipod/i.test(ua)) return 'ios';
    if (platform === 'MacIntel' && navigator.maxTouchPoints > 1) return 'ios';
    if (/windows|macintosh|linux/i.test(ua)) return 'desktop';
    return 'desktop';
  }
  function fillCalHelpModalText(data) {
    const titleEl = el('#cal-help-title');
    const contentEl = el('#cal-help-content');
    const okBtn = el('#cal-help-ok');
    const dev = getDeviceType();
    const ch = data?.calendar_help || {};
    if (titleEl) titleEl.textContent = ch.title || 'Как добавить в календарь';
    if (okBtn) okBtn.textContent = ch.button_ok || 'Понятно';
    let text = ch[dev] || ch.desktop || '';
    // preserve newlines as paragraphs
    if (contentEl) contentEl.innerHTML = (text || '')
      .split('\n\n')
      .map(p => `<p>${escapeHtml(p).replace(/\n/g,'<br>')}</p>`)
      .join('');
  }
  function openCalHelpModal() {
    const modal = el('#calendar-help');
    if (!modal) return;
    // Ensure text is filled with current data
    fillCalHelpModalText(data);
    modal.setAttribute('aria-hidden', 'false');
    const ok = el('#cal-help-ok');
    if (ok) setTimeout(()=> ok.focus(), 0);
  }
  function closeCalHelpModal() {
    const modal = el('#calendar-help');
    if (!modal) return;
    modal.setAttribute('aria-hidden', 'true');
  }
  // delegate close actions
  const calModal = el('#calendar-help');
  if (calModal) {
    calModal.addEventListener('click', (e)=>{
      const target = e.target;
      if (target.matches('[data-close]')) closeCalHelpModal();
    });
    const okBtn = el('#cal-help-ok');
    if (okBtn) okBtn.addEventListener('click', closeCalHelpModal);
    // Esc to close
    document.addEventListener('keydown', (e)=>{
      if (e.key === 'Escape' && calModal.getAttribute('aria-hidden') === 'false') closeCalHelpModal();
    });
  }
});

/* ===== COUNTDOWN ===== */
function startCountdown(isoString, elNode) {
  const target = new Date(isoString);
  if (isNaN(target)) { elNode.innerHTML = ''; return; }
  function update() {
    const now = new Date();
    const diff = target - now;
    if (diff <= 0) {
      elNode.innerHTML = '<div class="count-row"><span>0</span><span>0</span><span>0</span><span>0</span></div><div class="count-labels"><span>Дней</span><span>Часов</span><span>Минут</span><span>Секунд</span></div>';
      clearInterval(timer);
      return;
    }
    const d = Math.floor(diff / (1000*60*60*24));
    const h = Math.floor((diff / (1000*60*60)) % 24);
    const m = Math.floor((diff / (1000*60)) % 60);
    const s = Math.floor((diff / 1000) % 60);
    elNode.innerHTML = `
      <div class="count-row">
        <span>${d}</span>
        <span>${h.toString().padStart(2,'0')}</span>
        <span>${m.toString().padStart(2,'0')}</span>
        <span>${s.toString().padStart(2,'0')}</span>
      </div>
      <div class="count-labels">
        <span>Дней</span>
        <span>Часов</span>
        <span>Минут</span>
        <span>Секунд</span>
      </div>
    `;
  }
  update();
  const timer = setInterval(update, 1000);
}

/* ===== ICS GENERATION ===== */
function uid() {
  return 'id-' + Math.random().toString(36).slice(2,10);
}
function formatDateForICS(d) {
  // returns in UTC YYYYMMDDTHHMMSSZ
  const pad = n => String(n).padStart(2,'0');
  return d.getUTCFullYear() + pad(d.getUTCMonth()+1) + pad(d.getUTCDate()) + 'T' +
         pad(d.getUTCHours()) + pad(d.getUTCMinutes()) + pad(d.getUTCSeconds()) + 'Z';
}
function generateICS() {
  const ev = CONFIG.event;
  const start = new Date(ev.start);
  const end = new Date(start.getTime() + (ev.durationMinutes || 180)*60000);
  const uidStr = `${uid()}@${ev.uidDomain || 'local'}`;
  const ics =
`BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Wedding Invite//EN
CALSCALE:GREGORIAN
BEGIN:VEVENT
UID:${uidStr}
DTSTAMP:${formatDateForICS(new Date())}
DTSTART:${formatDateForICS(start)}
DTEND:${formatDateForICS(end)}
SUMMARY:${ev.title}
DESCRIPTION:Приглашение на свадьбу — ${ev.title}
LOCATION:${ev.location}
END:VEVENT
END:VCALENDAR`;
  const blob = new Blob([ics], {type:'text/calendar;charset=utf-8'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'donosagit_invite.ics';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(()=> URL.revokeObjectURL(url), 5000);
}

function escapeHtml(s = "") {
  return s.replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}

// добавьте helper для неразрывных пробелов
function nonBreaking(str = "") {
  // экранируем HTML и заменяем обычные пробелы на &nbsp; (U+00A0)
  return escapeHtml(str).replace(/ /g, '&nbsp;');
}

// лидеры: одна строка расписания
function renderScheduleLine(time = "", eventText = "") {
  return `<span class="mono-line"><span class="time">${escapeHtml(time || "")}</span><span class="dots" aria-hidden="true"></span><span class="event">${escapeHtml(eventText || "")}</span></span>`;
}
