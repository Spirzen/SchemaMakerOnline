# Schema Maker Online

**Онлайн-конструктор схем** — одностраничное приложение (SPA) для [GitHub Pages](https://pages.github.com/). Рисуйте блок-схемы, эскизы и диаграммы в браузере и сразу выгружайте в **PNG**, **JPG** или **PDF**.

Основан на [Schema Maker](https://github.com/) (десктопная/локальная версия). Данные не уходят на сервер: всё работает в браузере, черновик сохраняется в `localStorage`.

## Возможности

- Фигуры, линии, стрелки, связи между блоками, рисование от руки, ластик
- Подписи и комментарии, пастельная палитра, масштаб и панорама
- Экспорт **PNG / JPG / PDF** и обмен проектами через **JSON**
- Автосохранение черновика в браузере
- Защищённый импорт JSON (лимиты размера, валидация типов и цветов)

## Локальная разработка

```bash
npm install
npm run dev
```

Откройте http://localhost:5173

## Сборка

```bash
# Локальный preview (корень /)
npm run build
npm run preview

# GitHub Pages (base /SchemaMakerOnline/)
npm run build:pages
```

Если репозиторий на GitHub называется иначе, измените `GITHUB_PAGES_BASE` в `vite.config.ts`.

## Публикация

### Свой домен (schema.spirzen.ru)

1. Запушьте код в ветку `main`.
2. В **Settings → Pages** выберите источник **GitHub Actions** и укажите кастомный домен.
3. Workflow `.github/workflows/deploy.yml` соберёт с `base: /` и опубликует `dist`.

### GitHub Pages (подпуть /SchemaMakerOnline/)

```bash
npm run build:pages
```

Сайт: `https://<username>.github.io/SchemaMakerOnline/`

## Безопасность

- **CSP** в `index.html` — только свой origin, шрифты Google; `frame-ancestors` задавайте HTTP-заголовком на сервере
- Импорт JSON: макс. 2 МБ, до 500 элементов, проверка цветов и полей
- Имена файлов при экспорте санитизируются
- Нет бэкенда, cookies и трекеров

## Структура

```
src/
  components/   # UI и холст Konva
  hooks/        # состояние схемы
  utils/        # экспорт, валидация, localStorage
```

## Лицензия

Проект для личного и учебного использования. Исходный Schema Maker — отдельный репозиторий.
