# zall.dev

Статический личный сайт (CV): **Astro** + **React** (острова для модалок), **Tailwind** и **DaisyUI**. Данные страницы — [`site/src/zall.dev.json`](site/src/zall.dev.json) (схема проверяется через Zod на сборке).

Корень репозитория держит **Firebase** (Firestore / Storage rules, hosting). Исходники сайта — в каталоге [`site/`](site/).

## Требования

- Node.js 22
- [Yarn classic](https://classic.yarnpkg.com/) (v1)

## Команды

Из корня репозитория (workspace):

```bash
yarn install
yarn dev      # http://localhost:8080
yarn build    # выход: site/dist/
yarn preview  # локальный просмотр сборки
yarn typecheck
```

## Контент

- Редактируйте **`site/src/zall.dev.json`**: имя, опыт, портфолио, ссылки и т.д.
- Аватар и PDF задаются URL в JSON (например, публичные объекты в Firebase Storage).
- Картинки портфолио в карусели: относительные ключи в JSON и статические файлы в **`site/public/thumbnails/…`** и **`site/public/screenshots/…`** (те же пути, что в JSON).

## Деплой (Firebase Hosting)

Сборка должна попасть в каталог, который смотрит Hosting:

```bash
yarn build
firebase deploy --only hosting
```

В [`firebase.json`](firebase.json) для сайта указано `"public": "site/dist"`.

## Прочее в корне

- **`storage.rules`** — правила Storage (например, доступ к объектам под префиксом `cvs/`).
- **`thumbnails.sh`** — вспомогательный скрипт для генерации превью из изображений (ffmpeg).
