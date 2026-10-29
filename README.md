# ТРИБЕКА

Корпоративный сайт [трибека.рф](https://трибека.рф/): услуги металлообработки, сведения о компании и заявки с чертежами.

## Стек и структура

React 18, React Router 7, Tailwind CSS 3, Vite 6. Сборка содержит готовый HTML страниц; PHP 8.3 принимает заявки и сохраняет их в MySQL. Вложения хранятся вне публичного каталога.

| Каталог | Назначение |
| --- | --- |
| `src/pages`, `src/components` | Страницы и интерфейс |
| `src/data/company.js`, `src/siteConfig.js` | Услуги, контакты и версии документов |
| `src/index.css`, `tailwind.config.js` | Дизайн-токены, общие стили и утилиты |
| `public` | Публичные ресурсы, HTTP-конфигурация и API |
| `server`, `database/migrations` | Обслуживание данных, публикация и схема БД |
| `scripts`, `tests` | Сборка и локальные проверки |

## Разработка

Требуются Node.js 20+, PHP 8.3+ (`curl`, `mbstring`, `fileinfo`, `pdo_mysql`, `pdo_sqlite`, `zip`). Полный прогон использует Apache с `mod_rewrite` и `mod_headers`.

```sh
npm ci
npm run hooks:install
npx playwright install chromium
npm run dev
```

Vite не исполняет PHP. URL обработчика задаётся через `VITE_FORM_ENDPOINT` в `.env.local`; серверная конфигурация — через `TRIBEKA_PRIVATE_CONFIG`, образец в `server/config.example.php`.

| Команда | Назначение |
| --- | --- |
| `npm run build` | Сборка и статическая генерация страниц |
| `npm run preview:production` | Просмотр сборки на `127.0.0.1:4173` с HTTP 404, без PHP |
| `npm run check` | ESLint, Vitest, PHP, backup/deploy, SSG, Apache и Playwright |
| `npm test`, `npm run test:e2e`, `npm run test:php` | Отдельные наборы тестов |

Проверки изолированы от production; браузерные тесты используют порт `4183`. Установленный `pre-push` запускает полный прогон. GitHub Actions собирает и публикует `main`; `develop` используется для разработки.

## Сопровождение

- [Публикация, данные и восстановление](docs/operations.md)
- [Безопасность API и вложений](docs/security.md)
- [Маршруты и SEO](docs/ssg-seo.md)
- [Персональные данные](docs/personal-data.md)
- [Источники изображений](docs/service-photo-sources.md)
