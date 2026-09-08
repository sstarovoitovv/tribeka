# Доставка, резервные копии и восстановление

Основной сайт — `https://xn--80abmkm6an.xn--p1ai` (трибека.рф), REG.RU, Apache + PHP 8.3 + MySQL. Ветка `main` запускает production workflow. `develop` и feature-ветки используются для просмотра в Vercel. Vercel не исполняет PHP: сборщик исключает `api/` из его публичного артефакта, форма обращается к разрешённому origin на основном домене. Все страницы Vercel получают `X-Robots-Tag: noindex, nofollow`.

## Что проверяется перед релизом

CI запускает lint, frontend, PHP, deployment/backup и Chromium e2e-тесты, затем загружает **полный отдельный релиз**. Production-каталог больше не обновляется через `rsync --delete`.

```text
/var/www/u3633961/data/
├── www/xn--80abmkm6an.xn--p1ai -> ../tribeka-app/current/public [абсолютная ссылка]
├── tribeka-app/
│   ├── current -> releases/<release-id> [абсолютная ссылка]
│   ├── deploy.lock
│   └── releases/<release-id>/
│       ├── public/                 # dist, включая release.json
│       └── server/                 # CLI-скрипты этого же релиза, права 700/600
└── tribeka-private/
    ├── config.php                  # 600; не входит в Git или публичный релиз
    ├── maintenance.lock
    ├── uploads/
    ├── rate-limits/
    └── backups/                    # 700, SQL/архивы 600
```

`server/deploy-release.php` берёт отдельную блокировку деплоя, проверяет расположение ссылок, идентификатор, комплектность релиза и PHP-синтаксис. Затем создаёт резервную копию данных. Только после её успеха `rename()` атомарно заменяет ссылку `current`: открытые запросы завершаются на старом релизе, новые переходят на новый. Переключается одновременно frontend и набор CLI-скриптов. Удаления старой ссылки перед заменой нет.

HTTP-проверка читает новый `release.json`, содержимое SSG, security headers, настоящий 404, OPTIONS формы и `www → apex`. Ошибка или исключение возвращает предыдущий код через подготовленный rollback-релиз. Проверка не отправляет заявку и не создаёт лид. Скрипт никогда автоматически не меняет схему БД: будущие миграции должны сохранять совместимость как минимум с предыдущим релизом.

Перед переключением в новый релиз добавляются отсутствующие хешированные `assets/` предыдущего: вкладка, получившая старый HTML в момент релиза, всё ещё загрузит свой JS/CSS. Совпавшие имена сверяются по SHA-256; разные байты с одним именем прерывают деплой. Для обратного переключения заранее создаётся отдельный rollback-релиз с предыдущим кодом и объединёнными assets. Исходные опубликованные релизы не меняются. Явный rollback также создаёт новый `rollback-*` с полем `restored_from` в `release.json`. Assets сохраняются аддитивно; следить за их объёмом и не удалять их сразу после релиза.

## Первый переход с физического каталога

**На основном сервере этот переход выполнен 07.09.2026; повторять его не нужно.** Фактический релиз и проверки описаны в [production-status.md](production-status.md). Раздел ниже остаётся инструкцией для нового сервера: существующий physical docroot нельзя заменить символьной ссылкой стандартным атомарным `rename` без подготовки хостинга.

1. В ISPmanager проверить, что Apache разрешает `FollowSymLinks`/`SymLinksIfOwnerMatch`, `.htaccess` (`FileInfo`, `Options`, `Indexes`, `AuthConfig`) и `mod_rewrite`/`mod_headers`. Каталоги-предки публичных файлов должны разрешать обход веб-серверу; закрытые `server/` и `tribeka-private/` — только владельцу. `www` должен иметь DNS-запись, привязку к этому же vhost и действующий TLS-сертификат: HTTPS-редирект происходит **после** TLS handshake.
2. Проверить закрытый config по `server/config.example.php`. Путь по умолчанию `/var/www/u3633961/data/tribeka-private/config.php`; при другом расположении один и тот же `TRIBEKA_PRIVATE_CONFIG` требуется PHP-FPM и CLI. Вписать точные preview origins. Указать одинаковый `maintenance_lock` во всех процессах. Проверить `mysqldump`, `tar`, `curl`, место под БД + архивы + два релиза. PHP CLI: `/opt/php/8.3/bin/php`.
3. На время первой миграции закрыть **POST к API** на уровне vhost/ISPmanager ответом `503` с `Retry-After`, остановить cron очистки и дождаться завершения активных запросов. Старая версия формы не знает о новой maintenance-блокировке; первая копия требует такого окна. Не закрывать GET/OPTIONS, нужные для проверки сайта. Обычные последующие релизы обходятся общей блокировкой без этого этапа.
4. Подготовить `bootstrap-YYYYMMDD` на сервере. Команды ниже выполняются из подготовленного checkout с проверенной новой сборкой `dist/`; при SSH-загрузке пути к исходникам должны указывать на загруженный закрытый staging. Не копировать secret config в checkout.

```bash
TRIBEKA_APP=/var/www/u3633961/data/tribeka-app
TRIBEKA_SITE=/var/www/u3633961/data/www/xn--80abmkm6an.xn--p1ai
TRIBEKA_BOOT=bootstrap-20260907
test -d "$TRIBEKA_SITE" && test ! -L "$TRIBEKA_SITE"
test ! -e "$TRIBEKA_APP/current"
test ! -e "$TRIBEKA_APP/releases/$TRIBEKA_BOOT"
install -d -m 755 "$TRIBEKA_APP/releases/$TRIBEKA_BOOT/public"
install -d -m 700 "$TRIBEKA_APP/releases/$TRIBEKA_BOOT/server"
rsync -a "$TRIBEKA_SITE/" "$TRIBEKA_APP/releases/$TRIBEKA_BOOT/public/"
rsync -a --chmod=D700,F600 server/ "$TRIBEKA_APP/releases/$TRIBEKA_BOOT/server/"
cp dist/404.html "$TRIBEKA_APP/releases/$TRIBEKA_BOOT/public/404.html"
printf '{"release":"%s"}\n' "$TRIBEKA_BOOT" > "$TRIBEKA_APP/releases/$TRIBEKA_BOOT/public/release.json"
ln -s "$TRIBEKA_APP/releases/$TRIBEKA_BOOT" "$TRIBEKA_APP/current"
/opt/php/8.3/bin/php "$TRIBEKA_APP/current/server/backup-data.php"
```

5. В согласованное короткое окно обслуживания заменить physical docroot. Это **единственный неатомарный начальный переход**, обычно занимает доли секунды; исходный каталог сохраняется целиком. В SSH shell включить `set -e`, выполнить проверки и заменить:

```bash
set -e
test ! -e "$TRIBEKA_SITE.pre-atomic"
test -L "$TRIBEKA_APP/current"
mv "$TRIBEKA_SITE" "$TRIBEKA_SITE.pre-atomic"
if ! ln -s "$TRIBEKA_APP/current/public" "$TRIBEKA_SITE"; then
  mv "$TRIBEKA_SITE.pre-atomic" "$TRIBEKA_SITE"
  exit 1
fi
```

Если HTTP-проверка bootstrap не проходит, удалить **только созданную ссылку** командой `test -L "$TRIBEKA_SITE" && unlink "$TRIBEKA_SITE"`, затем `mv "$TRIBEKA_SITE.pre-atomic" "$TRIBEKA_SITE"`. Не использовать `rm -rf` и не удалять исходный каталог.

6. Выполнить первый новый production workflow. Открыть POST после успешного health check, включить обновлённые cron-задачи. Если FPM удерживает старые PHP-пути после переключения, настроить переопределение путей OPcache/realpath на хостинге (`opcache.revalidate_path=1`, проверка timestamp, небольшой `realpath_cache_ttl`) или перезапускать pool через разрешённый механизм панели при переключении. CLI `opcache_reset()` не сбрасывает кэш PHP-FPM. Проверить релиз PHP по `X-Tribeka-Release` ответа OPTIONS.

Не удалять `pre-atomic`, bootstrap и предыдущий релиз до проверки первой публикации и восстановления тестовой копии. Дальнейшие релизы сохраняются для явного rollback; следить за объёмом каталога `releases`, удалять только неактивные проверенные старые каталоги после периода отката.

## Регулярные backup и срок хранения

`backup-data.php` держит `LOCK_EX` на общем `maintenance_lock` от начала SQL dump до окончания архивирования. Форма, очистка и аналитика держат `LOCK_SH` при записи. Новые заявки при занятой блокировке получают кратковременный `503`, пользователь может повторить отправку; уже начатая запись завершается до начала snapshot. Прямые изменения через phpMyAdmin во время backup запрещены, поскольку они обходят эту файловую блокировку.

В одном завершённом snapshot находятся:

- `database.sql` — `mysqldump --single-transaction` всех таблиц базы;
- `uploads.tar.gz` — закрытые вложения;
- `config.tar.gz` — конфигурация, необходимая для восстановления;
- `manifest.json` — время, срок хранения, размеры и SHA-256 каждого файла.

Пароль MySQL передаётся через временный `.mysql.cnf` с правами `600`, не через аргументы процесса; файл удаляется до завершения. Незавершённые копии имеют `.pending-*` и удаляются при обработанной ошибке. После аварийного выключения/`SIGKILL` проверить и удалить оставшийся закрытый `.pending-*` вручную: он не считается готовым backup.

Завершённый snapshot публикуется переименованием каталога. По умолчанию сохраняется до 10 копий и **не старше 14 дней**, задаётся `backup_keep` и `backup_max_age_days` (1–90). Старые копии с персональными данными удаляются по возрасту, даже если новых копий не было. Для этого отдельный `--prune-only` запускается ежедневно независимо от успеха backup.

Пример cron (на сервере, после изменения текущих заданий, а не дополнительным дубликатом):

```cron
15 2 * * * /opt/php/8.3/bin/php /var/www/u3633961/data/tribeka-app/current/server/backup-data.php --prune-only
30 2 * * * /opt/php/8.3/bin/php /var/www/u3633961/data/tribeka-app/current/server/backup-data.php
23 3 * * * /opt/php/8.3/bin/php /var/www/u3633961/data/tribeka-app/current/server/purge-expired-leads.php
```

Старый `prune-backups.php` обслуживает только прежние копии **кода** `tribeka-before-*`; их нельзя считать резервными копиями лидов. Локальная копия на REG.RU защищает от неудачного релиза, но не от потери сервера. Внешний backup требует выбранного пользователем закрытого хранилища, шифрования, учётных данных и той же ротации; внешний перенос в этом изменении не настроен.

## Восстановление данных

Сначала проверить восстановление в отдельной закрытой БД и каталоге вне webroot. Сверить SHA-256 всех файлов с `manifest.json`, проверить `tar -tzf` на абсолютные пути/`..` и извлечь в пустой карантинный каталог, не поверх работающих uploads. Импортировать SQL в тестовую БД, проверить число лидов/вложений, контрольные суммы файлов и возможность обработки заявки без реальной отправки email.

Для production закрыть POST и cron, взять `LOCK_EX` на том же maintenance-файле и сделать копию текущего состояния. Восстановить БД и соответствующие ей uploads **из одного snapshot**; config распаковать отдельно и сравнить вручную, не перезаписывать актуальные ключи и пароли автоматически. Сохранить права 700/600. После восстановления выполнить очистку истёкших лидов до открытия доступа и согласовать досрочные удаления, сделанные после времени backup: старый snapshot не должен возвращать уже удалённые данные в рабочий реестр.

## Откат только кода

GitHub Actions → Deploy production to REG.RU → Run workflow → ветка `main` → `rollback_id` из имени сохранённого каталога. Workflow снова запускает проверки, создаёт backup данных, подготавливает новый артефакт с выбранным кодом и сохранёнными assets, переключает ссылку и проверяет HTTP; при ошибке возвращает исходный активный код. Данные при откате кода не откатываются.

На сервере эквивалентно:

```bash
/opt/php/8.3/bin/php /var/www/u3633961/data/tribeka-app/current/server/deploy-release.php \
  --app-path=/var/www/u3633961/data/tribeka-app \
  --docroot=/var/www/u3633961/data/www/xn--80abmkm6an.xn--p1ai \
  --rollback-id=REPLACE-WITH-EXISTING-RELEASE-ID \
  --health-url=https://xn--80abmkm6an.xn--p1ai
```

## HTTP и preview

Apache отдаёт существующие SSG HTML, для неизвестного URL — `404.html` со статусом **404**, а не успешный SPA fallback. `.htaccess` фиксирует HTTPS и `www → apex`, запрещает листинг, dotfiles и внутренние PHP-библиотеки. CSP сохраняет карту Яндекса, inline CSS существующих фоновых изображений, JSON-LD и отправку формы с preview на apex. Выполняемые inline scripts запрещены. HSTS не включает `includeSubDomains`/preload, поскольку владение и TLS остальных поддоменов не проверялись.

Vercel использует `scripts/prepare-vercel.mjs` и [Build Output API](https://vercel.com/docs/build-output-api/configuration): HTTP-коды, маршруты и redirects берутся из готовой сборки; PHP-файлы физически исключены. Preview нужно разрешать в закрытом CORS-конфиге точным origin. Локальный Vite служит разработке; HTTP-семантика production проверяется Apache/e2e, а не SPA fallback сервера разработки.

Локальная проверка без сервера: `npm run test:deploy` покрывает успешную активацию, возврат после ошибки, явный rollback, непрерывное чтение во время смены ссылки, запрет physical docroot и обхода путей, блокировку backup, комплектность и SHA-256 архивов, права файлов, очистку неудачного dump и ротацию по возрасту. Это fixture-тесты; реальный MySQL restore и поведение REG.RU vhost подтверждаются только на сервере.

В локальной ветке `design/ui-review` статистика удалена. При её будущей публикации убрать устаревший cron `server/purge-analytics.php`; см. [заметку об удалении](search-and-analytics.md#сбор-статистики-удалён). Эта правка сама по себе прод не обновляет.
