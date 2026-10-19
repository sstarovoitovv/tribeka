# ТРИБЕКА

Корпоративный сайт металлообрабатывающей компании: каталог услуг, сведения о производстве, контакты и форма заявки с вложениями.

[трибека.рф](https://трибека.рф/)

## Архитектура

React 18, React Router 7 и Tailwind CSS. Vite создаёт статический HTML для всех маршрутов; PHP 8.3 принимает заявки и сохраняет их в MySQL. Вложения находятся вне публичного каталога. После сохранения заявка и файлы передаются почтовому транспорту сервера.

```text
src/pages/             страницы
src/components/        интерфейс и форма заявки
src/data/company.js    услуги и изображения
src/siteConfig.js      контакты и версии документов
public/api/            обработчик заявки и серверная валидация
server/                обслуживание данных, backup и атомарная публикация
scripts/               сборка, локальные проверки и HTTP-preview
tests/                 PHP и браузерные сценарии
database/migrations/   схема MySQL
docs/                  техническая документация
```

## Разработка

Node.js 20+, PHP 8.3+ с `curl`, `mbstring`, `fileinfo`, `pdo_mysql`, `pdo_sqlite`, `zip`. Для HTTP-проверок нужен Apache с `mod_rewrite` и `mod_headers`.

```sh
npm ci
npm run hooks:install
npx playwright install chromium
npm run dev
```

Для локального обработчика: `.env.local` с `VITE_FORM_ENDPOINT=/api/request.php`. Vite не исполняет PHP. Обработчик читает отдельный конфигурационный файл из `TRIBEKA_PRIVATE_CONFIG`; структура — `server/config.example.php`.

```sh
npm run build
npm run preview:production
```

Preview отдаёт готовую сборку на `127.0.0.1:4173` и сохраняет HTTP 404; PHP не исполняется.

## Проверки

```sh
npm run check
```

Полный локальный прогон: ESLint, Vitest, синтаксис PHP, серверная валидация и SQL, вложения, backup/deploy, сборка, SSG, Apache и Playwright. Используется отдельный порт `4183` (`PLAYWRIGHT_PORT`); обращения формы изолированы от production. Результаты и диагностика — `.work/`. Точечные проверки доступны через `npm run test:*`.

GitHub Actions выполняет сборку и публикацию после слияния в `main`; тесты выполняются локально до слияния. `develop` — разработка.

Локальный `pre-push` запускает полный прогон и блокирует Git push при ошибке. Hook устанавливается командой `npm run hooks:install`; GitHub API и web-интерфейс его не выполняют.

## Документация

- [Защита формы и вложений](docs/security.md)
- [Обслуживание и восстановление](docs/operations.md)
- [Статическая генерация и SEO](docs/ssg-seo.md)
- [Обработка персональных данных](docs/personal-data.md)
- [Изображения и описания услуг](docs/service-photo-sources.md)
