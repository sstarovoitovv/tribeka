# Маршруты и SEO

`npm run build` создаёт клиентскую сборку и готовый HTML через `scripts/generate-seo-pages.mjs`. Текст, навигация, форма, метаданные и JSON-LD доступны без JavaScript. Неизвестные URL возвращают HTTP 404.

`src/serviceRoutes.js` задаёт постоянные идентификаторы услуг, `slug` и `aliases`; `src/seoConfig.js` — canonical, метаданные и индексацию. При смене slug прежний адрес добавляется в aliases: сборка создаёт 301 и отклоняет конфликты.

Страницы услуг пока имеют `noindex,follow`. Перед включением индексации необходимо утвердить контент и адреса. Sitemap содержит только индексируемые маршруты, без юридических страниц и ошибок; `lastmod` не изменяется при каждой сборке.

`npm run sitemap:submit` показывает план, `npm run sitemap:submit -- --submit` отправляет sitemap. Для Google используются `GOOGLE_SEARCH_CONSOLE_TOKEN`, `GOOGLE_SEARCH_CONSOLE_PROPERTY`; для Яндекса — `YANDEX_WEBMASTER_TOKEN`, `YANDEX_WEBMASTER_USER_ID`, `YANDEX_WEBMASTER_HOST_ID`.
