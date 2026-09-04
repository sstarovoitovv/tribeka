# Лендинг металлообрабатывающей компании

Стек: React, Vite, Tailwind CSS, JavaScript.

## Локальный запуск

```bash
npm install
npm run dev
```

Vite покажет локальный адрес, обычно `http://localhost:5173`.

## Проверка production-сборки

```bash
npm run build
npm run preview
```

## Деплой

### Vercel

1. Загрузите проект в GitHub.
2. В Vercel выберите **Add New → Project** и подключите репозиторий.
3. Framework Preset: `Vite`, Build Command: `npm run build`, Output Directory: `dist`.
4. Форма по умолчанию отправляет заявки через PHP-обработчик на REG.RU. При необходимости адрес можно переопределить в **Settings → Environment Variables** под именем `VITE_FORM_ENDPOINT`.

### Cloudflare Pages

1. Подключите GitHub-репозиторий в **Workers & Pages → Create → Pages**.
2. Build command: `npm run build`.
3. Build output directory: `dist`.

Название, логотип, контакты и реквизиты хранятся в `src/siteConfig.js`. Контент услуг и преимущества — в `src/data/company.js`.

Ссылки WhatsApp, Telegram и MAX также настраиваются в `src/siteConfig.js`. Для MAX нужно вставить пригласительную ссылку на профиль, скопированную из приложения.

Форма отправляет заявки через `public/api/request.php` на REG.RU. Обработчик принимает запросы с основного домена, Vercel Preview и локального Vite-сервера и отправляет письмо на адрес из конфигурации обработчика.

### Схема веток и production-деплой

- `develop` — локальная разработка и Vercel Preview;
- `main` — Vercel Production и автоматическая публикация на REG.RU;
- GitHub Actions собирает проект, создаёт резервную копию текущего сайта и синхронизирует `dist` с `/var/www/u3633961/data/www/xn--80abmkm6an.xn--p1ai`.

Для workflow требуется GitHub Actions secret `REG_RU_SSH_KEY` с отдельным SSH-ключом деплоя.

Страницы проекта:

- `/` — главная;
- `/about` — о компании;
- `/services` — услуги и технические возможности;
- `/contacts` — контакты и заявка на расчёт;
- `/privacy` — политика обработки персональных данных.
