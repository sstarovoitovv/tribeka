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
4. Если подключён обработчик формы, добавьте его адрес в **Settings → Environment Variables** под именем `VITE_FORM_ENDPOINT` и выполните новый деплой.

### Cloudflare Pages

1. Подключите GitHub-репозиторий в **Workers & Pages → Create → Pages**.
2. Build command: `npm run build`.
3. Build output directory: `dist`.

Название, логотип, контакты и реквизиты хранятся в `src/siteConfig.js`. Контент услуг и преимущества — в `src/data/company.js`.

Ссылки WhatsApp, Telegram и MAX также настраиваются в `src/siteConfig.js`. Для MAX нужно вставить пригласительную ссылку на профиль, скопированную из приложения.

Форма отправляет заявки на адрес из переменной `VITE_FORM_ENDPOINT`. Пока переменная не задана, посетитель увидит сообщение о том, что отправка ещё не подключена.

Страницы проекта:

- `/` — главная;
- `/about` — о компании;
- `/services` — услуги и технические возможности;
- `/contacts` — контакты и заявка на расчёт;
- `/privacy` — политика обработки персональных данных.
