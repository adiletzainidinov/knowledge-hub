# Этап 2: постоянная база и первые 5 роликов

## Что уже реализовано в коде
- SQL-схема Supabase с закрытым доступом (RLS без публичных политик).
- Защищённый серверный POST /api/admin/import-five.
- Импорт пяти первых публичных роликов канала @olegcloser через YouTube Data API в Supabase.
- Поля для будущих заметок и конспектов. Пока сохраняются только метаданные.

## Что требуется для запуска
1. Создать Supabase project.
2. Выполнить supabase/schema.sql в SQL Editor.
3. В Vercel -> Project -> Settings -> Environment Variables добавить:
   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, YOUTUBE_API_KEY, ADMIN_IMPORT_TOKEN.
4. Redeploy production.
5. Вызвать POST /api/admin/import-five с заголовком Authorization: Bearer <ADMIN_IMPORT_TOKEN> из защищённого клиента. Не вводить секреты в публичный сайт или GitHub.
6. Проверить таблицы channels/videos. Не считать импорт завершённым до фактического ответа API.

## Ограничения
YouTube Data API возвращает метаданные, но не свободный доступ к субтитрам чужих видео. Не генерировать «советы автора» только по заголовкам и не копировать видео без прав. Для заметок нужен достоверный доступный текст или ручной конспект.
