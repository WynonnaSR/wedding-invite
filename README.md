# Wedding Invite Landing

Лендинг-приглашение на свадьбу. Контент управляется JSON-файлами, без правок верстки. Поддержаны: структурированный invite, расписание, FAQ, адрес с картой (Яндекс + кнопки для Google/Yandex), RSVP с отправкой в Google Sheets, фоновая текстура, аудио с иконкой-кнопкой.

## Быстрый старт

- Требований к сборке нет. Рекомендуется запускать через локальный сервер (чтобы работали fetch и карты).
- Варианты запуска (Windows):
  - VS Code → Live Server (рекомендуется)
  - PowerShell: `npx serve -p 5500` и откройте http://127.0.0.1:5500/
  - Или: `py -m http.server 5500`

Структура:
- index.html — разметка разделов (hero, invite, schedule, photo, rsvp, faq, address, footer)
- css/style.css — стили и темы (в т.ч. фиксированная бумажная текстура)
- js/script.js — загрузка контента, эффекты, аудио, карты, RSVP, календарь (.ics) + модальное окно помощи
- data/text.json — весь текст контента (редактируете здесь)
- data/links.json — базовые ссылки (например, Telegram)
- map/location.json — координаты/адрес для карты
- assets/img — изображения и иконки (в т.ч. sound-state-on/off.png, paper_texture.png)
- assets/audio — фоновая музыка

## Контент (data/text.json)

Редактируете тексты здесь. Примеры структур:

- Заголовок hero:
```json
"header": {
  "hero_countdown_label": "До встречи"
}
```

- Invite (структурированный):
```json
"invite": {
  "schemaVersion": 1,
  "description": {
    "title": "💦 WEDDING POOL PARTY 💃🕺",
    "subTitle": "Свадьба + бассейн + тусич = ты обязан быть там!",
    "text": "Друзья, легенды, тусовщики!\n13 сентября 2025 года..."
  },
  "sections": [
    { "id": "location",   "icon": "📍", "title": "Где?",        "text": "..." },
    { "id": "date",       "icon": "⏰", "title": "Во сколько?", "text": "..." },
    { "id": "quest",      "icon": "👙", "title": "Квест",       "text": "..." },
    { "id": "additional", "icon": "🎁", "title": "P.S.",        "text": "..." },
    { "id": "dress_code", "icon": "👗", "title": "Дресс-код",   "text": "..." }
  ],
  "footer": { "text": "Ждём, любим, целуем —\nДоно & Сагит 💍🫶" }
}
```

- Фото:
```json
"photo": { "text": "Если сделали крутые фото или видео — кидайте в ТГ @Totoro_4668" }
```
В блоке “Фото” @username автоматически линкуется в Telegram (см. data/links.json).

- Расписание:
```json
"schedule": {
  "title": "Свадебное расписание",
  "content": [
    { "time": "17:45", "event": "Сбор гостей" },
    { "time": "18:00", "event": "Начало церемонии" },
    { "time": "22:00", "event": "HARD POOL PARTY" }
  ]
}
```
Рендерится в pre.mono строками «время … точки … событие», количество пунктов любое.

- Адрес:
```json
"address": {
  "title": "Адрес",
  "location": "Ташкент Малая кольцевая дорога, 70",
  "description": "Здесь пройдёт наша свадьба. Приходите, не стесняйтесь!",
  "mapLabels": {
    "google": "Открыть в Google Maps",
    "yandex": "Открыть в Яндекс.Картах"
  }
}
```

- FAQ:
```json
"faq": {
  "title": "FAQ",
  "items": [
    { "q": "Что с парковкой/такси?", "answers": ["..."] },
    { "q": "Есть ли раздевалка?",     "answers": ["..."] }
  ]
}
```
Селектор вариантов ответов скрыт по умолчанию (включается флагом в CONFIG; см. ниже).

- RSVP подписи:
```json
"rsvp_labels": {
  "title": "Дайте знать, что будете",
  "firstName": "Имя",
  "lastName": "Фамилия",
  "attendYes": "Я буду!",
  "attendNo": "Увы, не смогу",
  "note": "Пожелания",
  "firstNamePlaceholder": "Как вас зовут, герой дня?",
  "lastNamePlaceholder": "А фамилия у вас какая?",
  "notePlaceholder": "Хотите пожелать нам что-то тёплое или смешное?",
  "button": "Даю знать!"
}
```

— Подсказки для календаря (device-specific):
```json
"calendar_help": {
  "title": "Как добавить в календарь",
  "button_ok": "Понятно",
  "android": "…инструкция для Android…",
  "ios": "…инструкция для iOS…",
  "desktop": "…инструкция для ПК…"
}
```
Точные тексты уже добавлены в data/text.json и могут быть отредактированы там.

## Ссылки (data/links.json)

```json
{
  "telegram": { "base": "https://t.me/" }
}
```

В тексте фото-блока все @username (5–32 символов) превращаются в ссылки на https://t.me/username.

## Добавление в календарь (.ics) и модальное окно помощи

- В навбаре есть кнопка «Добавить в календарь». При клике генерируется .ics-файл (через Blob) с данными события и запускается его скачивание.
- Сразу после этого показывается модальное окно с краткой инструкцией, зависящей от устройства (Android / iOS / ПК). Тексты берутся из data/text.json → calendar_help.

Где править:
- Тексты: data/text.json → calendar_help.title, .button_ok, .android, .ios, .desktop.
- Логика/детекция устройства и показ модалки: js/script.js.
- Разметка модалки: index.html (контейнер с id="calendar-help", внутри — плейсхолдеры заголовка, контента и кнопки).
- Стили модалки: css/style.css (классы .modal, .modal__dialog, .modal__backdrop, .modal__title, .modal__content, .modal__actions, .modal__close).

Детекция устройства (в коде):
- Android: userAgent содержит "Android"
- iOS: userAgent содержит "iPhone"/"iPad"/"iPod" или (platform === "MacIntel" и navigator.maxTouchPoints > 1)
- Desktop: userAgent содержит "Windows"/"Macintosh"/"Linux" и не содержит мобильные ключевые слова

Настройка события для .ics (js/script.js → CONFIG.event):
- title — заголовок события (SUMMARY)
- start — ISO-строка локального времени начала (например, 2025-09-13T17:45:00)
- durationMinutes — длительность события в минутах
- location — место проведения (LOCATION)
- uidDomain — домен для формирования UID события (UID: <random>@uidDomain)

Известные ограничения:
- Встроенные браузеры приложений (Telegram/Instagram) могут блокировать скачивание .ics. Поэтому модалка подсказывает открыть сайт во внешнем браузере (Safari/Chrome) и повторить действие.
- iOS/Safari обычно сразу открывает окно добавления события, без явного скачивания файла.
- На ПК .ics следует открыть двойным кликом — календарь предложит добавить событие.

## Карта

- Встраивается Яндекс-карта (iframe). Источник координат и поисковой строки:
```json
// map/location.json
{ "lat": 41.269219137162985, "lng": 69.26317252697527, "query": "Ташкент ..." }
```
Если заданы lat/lng — показываются метка и центр. Иначе используется query.

- Под картой — две круглые кнопки-иконки:
  - Открыть в Google Maps (в приложении, если установлено)
  - Открыть в Яндекс.Картах
Подписи (aria-label/title) берутся из address.mapLabels.

## Аудио

- Файлы: положите в assets/audio/background.mp3 (и опционально .m4a).
- Кнопка в навбаре — иконка (assets/img/sound-state-on.png/off.png).
- Никакого автозапуска: звук включается только по клику на иконке. Кнопка синхронизирует состояние и aria-атрибуты.

## RSVP → Google Sheets

1) В Google Sheets создайте лист “RSVP” с колонками:
- A: Timestamp
- B: Имя
- C: Фамилия
- D: Придёт
- E: Пожелания

2) Привяжите Apps Script (Extensions → Apps Script) и вставьте:

```javascript
const SHEET_NAME = 'RSVP';
function doPost(e) {
  const out = obj => ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
  try {
    const ct = e?.postData?.type || '';
    let data = {};
    if (ct.indexOf('application/json') === 0) {
      data = JSON.parse(e.postData.contents || '{}');
    } else {
      data = e.parameter || {};
    }
    const attendMap = { yes: 'Приду', no: 'Не приду' };
    const row = [
      new Date(),
      (data.firstName || '').toString().trim(),
      (data.lastName  || '').toString().trim(),
      attendMap[(data.attend || '').toLowerCase()] || (data.attend || ''),
      (data.note      || '').toString().trim()
    ];
    const sh = SpreadsheetApp.getActive().getSheetByName(SHEET_NAME);
    const r = sh.getLastRow() + 1;
    sh.getRange(r, 1, 1, 5).setValues([row]);
    sh.getRange(r, 1).setNumberFormat("yyyy-mm-dd hh:mm:ss");
    return out({ ok: true });
  } catch (err) {
    return out({ ok: false, error: String(err) });
  }
}
```

3) Deploy → New deployment → Web app → Execute as: Me, Who has access: Anyone → Deploy. Скопируйте URL.

4) В js/script.js пропишите URL в CONFIG.appsScriptUrl. Отправка формы идёт через FormData и mode: no-cors (обходит CORS). Успех показывается, если запрос не упал по сети.

## Конфигурация (js/script.js)

В файле объявлен CONFIG (пример):

```javascript
const CONFIG = {
  appsScriptUrl: "https://script.google.com/macros/s/…/exec",
  faqAnswerOptionsEnabled: false, // включить селектор “вариантов ответов” в FAQ при answers > 1
  audio: { volume: 0.5 },         // громкость 0..1
  event: {
    title: "ДОНО & САГИТ — Свадебная вечеринка",
    start: "2025-09-13T17:45:00", // локальное время ISO
    durationMinutes: 300,
    location: "Ташкент Малая кольцевая дорога, 70",
    uidDomain: "donosagit.example.local"
  }
};
```

## Фон и тема

- Начиная с секции Invite, сзади отображается фиксированная непрокручиваемая бумажная текстура (assets/img/paper_texture.png). Секции имеют полупрозрачный tint, скроллится только контент. Текстура появляется при входе в Invite и скрывается при скролле назад к герою.
- Цвета и отступы настраиваются в :root в css/style.css.

## Доступность и мобильные нюансы

- Кнопки карт имеют aria-label/title из text.json.
- Кнопка аудио — aria-pressed и изменяемый aria-label.
- iOS Safari: учтены баги рендера текста на кнопках и бургер-иконки.

## Трюблшутинг

- RSVP: CORS в Apps Script — используем mode: no-cors и FormData. Если нужен читаемый ответ, поднимайте прокси (Cloudflare Workers/Netlify Function).
- Яндекс карта не грузится в iframe? Проверьте, что src формируется по координатам/запросу и что домен не блокируется браузером.
- Телеграм-хэндл не кликается? Проверьте data/links.json (telegram.base) и что в тексте есть @username (5–32 символов A-Za-z0-9_).

## Лицензии ассетов

- Текстуры/иконки/шрифты должны быть с разрешённой лицензией. Для paper_texture можно использовать CC0 (ambientCG).