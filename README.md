# ТРИБЕКА

Сайт металлообрабатывающей компании: услуги, оборудование, контакты и заявка с чертежами.

**Сайт:** [трибека.рф](https://трибека.рф/)

## Стек

| Часть | Технологии |
| --- | --- |
| Интерфейс | React, React Router, Tailwind CSS |
| Сборка | Vite, статическая генерация HTML |
| Сервер | PHP 8.3, MySQL |
| Тесты | Vitest, Playwright, PHP |
| Хостинг и деплой | REG.RU, GitHub Actions |

## Структура

```text
src/pages/            # Страницы
src/components/       # Общие элементы и форма заявки
src/data/company.js   # Услуги, параметры и фотографии
src/siteConfig.js     # Контакты и настройки сайта
public/               # Изображения и PHP-обработчик формы
server/               # Деплой, резервные копии и обслуживание
scripts/              # Сборка HTML и локальный просмотр
tests/                # Серверные и браузерные тесты
database/migrations/  # Схема базы данных
docs/                 # Технические инструкции
.github/workflows/    # Автоматические проверки и публикация
```

## Локальный запуск

Нужен Node.js 20+. Создайте `.env.local` с `VITE_FORM_ENDPOINT=/api/request.php`, чтобы локальная форма не отправляла заявки на основной сайт. Для исполнения обработчика нужен PHP-сервер.

```bash
npm ci
npm run dev
```

Просмотр готовой сборки на `http://127.0.0.1:4173`:

```bash
npm run build
npm run preview:production
```

## Проверки

```bash
npm run lint
npm test
npm run build
npm run test:ssg
```

PHP- и браузерные проверки автоматически выполняются в GitHub Actions.

## Публикация

`develop` — разработка, `main` — основной сайт. После объединения pull request в `main` GitHub Actions выполняет проверки, создаёт резервную копию и публикует релиз на REG.RU. При ошибке проверки сайта выполняется откат.

Подробности: [деплой и backup](docs/deployment.md), [защита формы](docs/security.md), [SEO](docs/ssg-seo.md), [источники фотографий](docs/service-photo-sources.md).
