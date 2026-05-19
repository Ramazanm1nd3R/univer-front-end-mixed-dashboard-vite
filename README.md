# TaskFlow AI — Mixed Dashboard

> Финальный проект по дисциплине React. Smart task management с AI-инсайтами, аналитикой и интегрированными рецептами/фильмами в едином дашборде.

Единое React-приложение, которое объединяет три сущности (**задачи / рецепты / фильмы**) в одном пользовательском опыте: dashboard с фильтрацией и сортировкой, аналитика с heatmap'ом, AI-рекомендации, авторизация с email-верификацией и темизация.

---

## Содержание

- [Возможности](#возможности)
- [Стек технологий](#стек-технологий)
- [Быстрый старт](#быстрый-старт)
- [Переменные окружения](#переменные-окружения)
- [Архитектура — Feature-Sliced Design](#архитектура--feature-sliced-design)
- [Дерево папок](#дерево-папок)
- [Слой `app/`](#слой-app--композиция-приложения)
- [Слой `pages/`](#слой-pages--роутовые-страницы)
- [Слой `widgets/`](#слой-widgets--композиционные-блоки)
- [Слой `features/`](#слой-features--пользовательские-сценарии)
- [Слой `entities/`](#слой-entities--бизнес-сущности)
- [Слой `shared/`](#слой-shared--переиспользуемое)
- [Стили](#стили)
- [Тестирование](#тестирование)
- [Поток данных](#поток-данных-типовой-сценарий)
- [Особенности и решения](#особенности-и-решения)
- [Архитектурные решения (защита проекта)](#архитектурные-решения-защита-проекта)

---

## Возможности

- 📋 **Dashboard задач** — карточки с приоритетами, статусом, сроками, лайками
- ✏️ **CRUD-формы** — controlled inputs, валидация в реальном времени, cross-field правила
- 📊 **Аналитика** — статистика, 7×24 heatmap активности, тренды за 30 дней, распределения
- 🧠 **AI-инсайты** — OpenAI генерирует рекомендации и предсказания на основе ваших данных
- 🛠 **Tools** — Life Wheel виджет с AI-анализом баланса
- 🍳 **Рецепты и фильмы** — переиспользуемый паттерн entity-страниц
- 🔐 **Auth с email-верификацией** — двухшаговый flow (login → 6-значный код)
- 🌗 **Темизация** — light/dark с CSS-переменными
- 🛡 **Screen protection** — manual toggle для скрытия контента
- 📱 **Responsive** — breakpoints 1024px / 768px / 480px
- ⚠️ **ErrorBoundary** — отлов рантайм-ошибок с fallback UI

---

## Стек технологий

| Слой | Технология | Версия | Назначение |
|------|------------|--------|------------|
| UI | React | 19.2 | Компонентный фреймворк |
| Build | Vite | 8.0.0-beta.13 | Сборка + dev-сервер |
| Routing | react-router-dom | 7.13 | Клиентская маршрутизация |
| Тесты | Vitest + React Testing Library | 4.1 / 16.3 | Юнит + интеграция |
| Backend | Flask + SQLite | — | REST API на :5001 |
| AI | OpenAI Chat Completions API | `gpt-4o-mini` | Инсайты и предсказания |
| Lint | ESLint + react-hooks | 9.39 | Статический анализ |

---

## Быстрый старт

### Frontend

```bash
npm install
npm run dev          # → http://localhost:5173
```

### Backend (Flask)

```bash
cd backend
pip install -r requirements.txt
python server.py     # → http://localhost:5001
```

### Тесты

```bash
npm test             # одноразовый запуск
npm run test:watch   # watch режим
```

### Production build

```bash
npm run build        # → dist/
npm run preview      # локальный preview билда
```

---

## Переменные окружения

Создайте `.env` в корне проекта:

```bash
VITE_API_URL=http://localhost:5001/api
VITE_OPENAI_API_KEY=your_openai_key
```

`VITE_API_URL` опционален — по умолчанию используется `http://localhost:5001/api`.
`VITE_OPENAI_API_KEY` нужен только для AI-инсайтов на Tools и DataPage.

---

## Архитектура — Feature-Sliced Design

Проект построен по методологии **Feature-Sliced Design (FSD)** — современному стандарту для масштабируемых React-приложений (https://feature-sliced.design/). Архитектура состоит из 6 слоёв, импорты строго **однонаправленные сверху вниз**: `app → pages → widgets → features → entities → shared`. Это даёт **низкую связанность и высокую когезию** — изменение в одной фиче не каскадирует в другие.

```
┌─────────────────────────────────────────────────────────────────┐
│  app/        Точка входа: App.jsx, провайдеры, глобальные стили │
├─────────────────────────────────────────────────────────────────┤
│  pages/      Роутовые страницы (Dashboard, Tools, Data, ...)    │
├─────────────────────────────────────────────────────────────────┤
│  widgets/    Композиционные блоки (Header, TaskCollection, ...) │
├─────────────────────────────────────────────────────────────────┤
│  features/   Пользовательские сценарии (auth, task-form, ...)   │
├─────────────────────────────────────────────────────────────────┤
│  entities/   Бизнес-сущности (task, dashboard-item, ...)        │
├─────────────────────────────────────────────────────────────────┤
│  shared/     Переиспользуемое (UI kit, hooks, API, config)      │
└─────────────────────────────────────────────────────────────────┘
            ↓ импорты могут идти ТОЛЬКО вниз ↓
```

Каждый слой делится на **слайсы** (`auth/`, `task/`, ...), а слайс — на **сегменты**:
- `ui/` — React-компоненты
- `model/` — стейт (контексты, стор, хуки состояния)
- `lib/` — утилиты и helpers
- `api/` — обращения к внешним API

**Provider-tree на рантайме** (определён в [src/app/App.jsx](src/app/App.jsx)):

```
<BrowserRouter>
  └─ <AuthProvider>              ← features/auth/model
      └─ <DashboardProvider>     ← entities/task/model
          └─ <ScreenProtectionProvider>  ← features/screen-protection/model
              └─ <ScreenshotGuard>        ← features/screen-protection/ui
                  └─ <AppContent>
                      ├─ <Header>           ← widgets/header
                      ├─ <Notifications>    ← widgets/notifications
                      └─ <ErrorBoundary>    ← shared/ui
                          └─ <Suspense fallback>
                              └─ <Routes>   ← pages/*
```

**Маршруты ленивые** (`React.lazy` + `<Suspense>`), что даёт code splitting на уровне страниц.

**Алиасы импортов** (настроены в [vite.config.js](vite.config.js)):

```js
'@app'      → src/app
'@pages'    → src/pages
'@widgets'  → src/widgets
'@features' → src/features
'@entities' → src/entities
'@shared'   → src/shared
```

Пример канонического импорта: `import Card from '@entities/task/ui/Card';`

---

## Дерево папок

```
src/
├── main.jsx                            ← Vite bootstrap
├── __tests__/                          ← E2E integration test (mixed-dashboard)
│
├── app/                                ← Слой 1: APP
│   ├── App.jsx                         ← Router + Providers + Routes
│   └── styles/
│       ├── App.css                     ← global app layout
│       └── index.css                   ← global tokens
│
├── pages/                              ← Слой 2: PAGES
│   ├── dashboard/{ui,__tests__}        ← / — главный дашборд
│   ├── tools/ui                        ← /tools
│   ├── data/ui                         ← /data — аналитика + AI
│   ├── profile/ui                      ← /profile
│   ├── not-found/ui                    ← *
│   └── tasks/, movies/, recipes/       ← entity-страницы (для тестов)
│
├── widgets/                            ← Слой 3: WIDGETS
│   ├── header/ui                       ← шапка
│   ├── notifications/ui                ← toast viewport
│   ├── task-collection/ui              ← render-prop коллекция
│   ├── entity-board/ui                 ← универсальная доска сущностей
│   └── life-wheel/ui                   ← LifeWheel SVG-виджет
│
├── features/                           ← Слой 4: FEATURES
│   ├── auth/                           ← аутентификация
│   │   ├── model/AuthContext.jsx
│   │   ├── lib/withAuth.jsx
│   │   └── ui/{Login,Register,VerificationCode,Auth.css}
│   ├── screen-protection/              ← защита от скриншотов
│   │   ├── model/{ScreenProtectionContext,useScreenProtection}
│   │   └── ui/{ScreenshotGuard,ScreenshotButton}+css
│   ├── task-filter/model/FilterContext.jsx
│   ├── task-form/ui/{AddItemModal,EditItemModal}
│   └── entity-form/ui/EntityFormModal.jsx
│
├── entities/                           ← Слой 5: ENTITIES
│   ├── task/
│   │   ├── model/{DashboardContext,taskFormConfig}
│   │   └── ui/Card.jsx + card-parts/
│   ├── dashboard-item/
│   │   └── model/{ItemsContext,entityConfigs}
│   └── notification/model/NotificationContext.jsx
│
└── shared/                             ← Слой 6: SHARED
    ├── ui/                             ← UI kit
    │   ├── Card, Modal, Skeleton, ErrorBoundary,
    │   ├── FilterableList, ToastViewport, ServerError
    │   └── __tests__/
    ├── lib/                            ← хуки и утилиты
    │   ├── useFetch, useForm, useModal, useFilter, safeParseJSON
    │   └── __tests__/
    ├── api/                            ← API клиенты
    │   ├── api.js (REST к Flask)
    │   ├── openai.js (OpenAI)
    │   ├── mockApi.js (in-memory mock)
    │   └── fetchMockData.js
    ├── config/mixedDashboardSeed.js
    └── styles/
        ├── design-tokens.css
        ├── mixedDashboard.module.css
        └── Dashboard.css
```

---

## Слой `app/` — Композиция приложения

### [src/main.jsx](src/main.jsx) — Bootstrap
Точка запуска для Vite. Импортирует глобальные стили (`./app/styles/index.css`), создаёт React root через `createRoot`, рендерит `<App />` в `<StrictMode>`.

### [src/app/App.jsx](src/app/App.jsx) — Корневой компонент
- **Provider tree:** оборачивает приложение в `<BrowserRouter>` → `<AuthProvider>` → `<DashboardProvider>` → `<ScreenProtectionProvider>` → `<ScreenshotGuard>`. Порядок имеет значение: Auth должен быть выше Dashboard (Dashboard читает `currentUser`).
- **Тема:** управляет `isDarkTheme` через `useState`, синхронизирует с `localStorage` и классом `dark-theme`/`light-theme` на `<html>`.
- **Роутинг:** определяет маршруты, использует `<ProtectedRouteWrapper>` (для `/` и `/tools`) и HOC [withAuth](src/features/auth/lib/withAuth.jsx) (для `/data` и `/profile`).
- **Performance:** все страницы лениво загружаются через `React.lazy()` + `<Suspense fallback>` — code splitting.
- **Error handling:** `<ErrorBoundary>` оборачивает `<Routes>`, ловит рантайм-ошибки страниц.

### [src/app/styles/](src/app/styles/)
- `App.css` — глобальные стили приложения (.App layout, scrollbar, переменные темы)
- `index.css` — корневые сбросы и переменные

---

## Слой `pages/` — Роутовые страницы

Каждая страница — отдельный slice с папкой `ui/`. Страница агрегирует виджеты, фичи и сущности нижних слоёв. Логику бизнес-сценариев в страницах **не пишут** — она живёт в features и entities.

| Маршрут | Slice | Что делает |
|---------|-------|------------|
| `/` | [pages/dashboard/](src/pages/dashboard/) | Главный дашборд: hero, статистика, фильтры, сетка карточек задач. Композирует `TaskCollection` (widget), `Card` (entity/task), `AddItemModal`/`EditItemModal` (features). Использует `DashboardContext` из entity/task. |
| `/tools` | [pages/tools/](src/pages/tools/) | Обёртка для `<LifeWheelTool />` (widget). |
| `/data` | [pages/data/](src/pages/data/) | Аналитика: `MainStats`, `Heatmap` (7×24), `TrendChart` (30 дней), `DistributionSection`, `InsightsSection` (AI). Защищена `withAuth`. |
| `/profile` | [pages/profile/](src/pages/profile/) | Редактирование профиля пользователя. Защищена `withAuth`. |
| `/login` | (см. features/auth) | Рендерит [features/auth/ui/Login](src/features/auth/ui/Login.jsx) напрямую — отдельной page-обёртки не требуется. |
| `/register` | (см. features/auth) | Аналогично — [features/auth/ui/Register](src/features/auth/ui/Register.jsx). |
| `*` | [pages/not-found/](src/pages/not-found/) | 404 с easter-egg анимациями. |
| (тесты) | [pages/tasks/](src/pages/tasks/ui/TasksPage.jsx), [movies/](src/pages/movies/ui/MoviesPage.jsx), [recipes/](src/pages/recipes/ui/RecipesPage.jsx) | Лаб-страницы — обёртки над `<EntityBoard entityType="..." />`. Используются интеграционным тестом `mixed-dashboard.integration.test.jsx`. |

Тесты страниц лежат в `pages/<slice>/__tests__/` (например, [Dashboard.integration.test.jsx](src/pages/dashboard/__tests__/Dashboard.integration.test.jsx)).

---

## Слой `widgets/` — Композиционные блоки

Виджеты — крупные самостоятельные UI-блоки, которые комбинируют features и entities. В отличие от страниц, виджет не привязан к маршруту и может переиспользоваться.

### [widgets/header/](src/widgets/header/ui/Header.jsx)
Шапка приложения. Содержит:
- Логотип «TaskFlow AI»
- Навигацию между маршрутами (`/`, `/tools`, `/data`, `/profile`)
- `<ScreenshotButton />` из `features/screen-protection`
- Переключатель темы (light/dark)
- Имя пользователя + кнопку logout (из `useAuth`)

### [widgets/notifications/](src/widgets/notifications/ui/Notifications.jsx)
Toast-viewport для дашборда задач. Подписан на `DashboardNotificationsContext`, рендерит уведомления через `createPortal`. Каждый тост живёт 4 секунды.

### [widgets/task-collection/](src/widgets/task-collection/ui/TaskCollection.jsx)
**Render-prop виджет** для фильтрации и сортировки задач. Принимает `items` и `children`-функцию, применяет `useFilter`, передаёт обратно `{ filteredItems, filters, sortBy, setFilters, setSortBy, ... }`. Отделяет **логику** от **представления** — Dashboard.jsx сам определяет как рендерить отфильтрованные элементы.

### [widgets/entity-board/](src/widgets/entity-board/)
- [EntityBoard.jsx](src/widgets/entity-board/ui/EntityBoard.jsx) — универсальная доска: принимает `entityType` (`tasks`/`recipes`/`movies`), читает данные из `ItemsContext`, рендерит сетку карточек с фильтрами через `FilterContext` и `EntityFormModal`.
- [EntityDetails.jsx](src/widgets/entity-board/ui/EntityDetails.jsx) — модалка деталей сущности.

### [widgets/life-wheel/](src/widgets/life-wheel/ui/LifeWheelTool.jsx)
Виджет «колесо жизненного баланса». 8 категорий с ползунками 0-10, средний балл, визуализация через `<svg>` polygon. Кнопка «AI Анализ» отправляет данные в `@shared/api/openai` и показывает рекомендации.

---

## Слой `features/` — Пользовательские сценарии

Фичи — отдельные «фичи» приложения: то, **что пользователь делает** (логинится, защищает экран, фильтрует, заполняет форму). Каждая фича самодостаточна.

### [features/auth/](src/features/auth/) — Аутентификация

| Файл | Что делает |
|------|------------|
| [model/AuthContext.jsx](src/features/auth/model/AuthContext.jsx) | Глобальный контекст: `currentUser`, `loading`, `pendingVerification`. Восстанавливает сессию из `localStorage`. Двухшаговый flow: `initiateLogin/Register` → код на email → `completeLogin/Register`. Методы: `logout`, `updateUserProfile`, `updateUserSettings`. |
| [lib/withAuth.jsx](src/features/auth/lib/withAuth.jsx) | HOC для защиты страниц. Если `!currentUser` — рендерит fallback с предложением войти. Используется в App.jsx для `/data` и `/profile`. |
| [ui/Login.jsx](src/features/auth/ui/Login.jsx) | Форма входа → `initiateLogin` → переключение на `VerificationCode` при `pendingVerification`. Включает demo-кнопку. |
| [ui/Register.jsx](src/features/auth/ui/Register.jsx) | Регистрация: firstName, lastName, email, password, confirmPassword + локальная валидация. После `initiateRegister` → `VerificationCode`. |
| [ui/VerificationCode.jsx](src/features/auth/ui/VerificationCode.jsx) | Ввод 6-значного кода, таймер 60 секунд, кнопка повторной отправки. Завершает flow через `completeLogin` / `completeRegister`. |
| [ui/Auth.css](src/features/auth/ui/Auth.css) | Стили: glass + neumorphic, gradient-text заголовки, theme-aware через CSS-переменные. |
| [__tests__/withAuth.test.jsx](src/features/auth/__tests__/withAuth.test.jsx) | Тест HOC: показывает контент если залогинен, иначе fallback. |

### [features/screen-protection/](src/features/screen-protection/) — Защита от скриншотов

| Файл | Что делает |
|------|------------|
| [model/ScreenProtectionContext.jsx](src/features/screen-protection/model/ScreenProtectionContext.jsx) | Контекст-обёртка над хуком. Расшаривает состояние между `ScreenshotButton` (в Header) и `ScreenshotGuard` (оверлей). |
| [model/useScreenProtection.js](src/features/screen-protection/model/useScreenProtection.js) | Логика: `isProtectionActive`, `protectionReason`, `activate`, `deactivate`, `toggle`. |
| [ui/ScreenshotGuard.jsx](src/features/screen-protection/ui/ScreenshotGuard.jsx) | Оборачивает приложение. При активации блюрит контент и показывает overlay с кнопкой «Снять защиту». |
| [ui/ScreenshotButton.jsx](src/features/screen-protection/ui/ScreenshotButton.jsx) | Кнопка-toggle в Header для ручного включения защиты. |

### [features/task-filter/](src/features/task-filter/) — Фильтры для entity-страниц
- [model/FilterContext.jsx](src/features/task-filter/model/FilterContext.jsx) — фильтры (категория, поиск, статус) и сортировка для tasks/recipes/movies. Хранит отдельные настройки по каждой сущности.

### [features/task-form/](src/features/task-form/) — Создание/редактирование задач
- [ui/AddItemModal.jsx](src/features/task-form/ui/AddItemModal.jsx) — модалка создания задачи.
- [ui/EditItemModal.jsx](src/features/task-form/ui/EditItemModal.jsx) — модалка редактирования.

Обе используют `@shared/lib/useForm` + конфиг из `@entities/task/model/taskFormConfig`. Рендерятся через `createPortal`. Имеют:
- Валидацию title (минимум 3 символа)
- Cross-field: время без даты — ошибка, время в прошлом — ошибка
- Live preview карточки в момент заполнения

### [features/entity-form/](src/features/entity-form/) — Универсальная форма entity
- [ui/EntityFormModal.jsx](src/features/entity-form/ui/EntityFormModal.jsx) — форма создания/редактирования произвольной сущности. Поля рендерятся динамически из `entityConfig.fields`. Использует `@shared/ui/Modal` (с `createPortal`).

---

## Слой `entities/` — Бизнес-сущности

Сущности — это **данные** домена + способ их рендерить. Не содержат пользовательских сценариев (это features), но содержат стор и UI-представление самой сущности.

### [entities/task/](src/entities/task/) — Задача

| Файл | Что делает |
|------|------------|
| [model/DashboardContext.jsx](src/entities/task/model/DashboardContext.jsx) | **Главный стор задач.** Разделён на 3 субконтекста для оптимизации ре-рендеров: `DashboardDataContext` (items, CRUD), `DashboardUIContext` (filters, sortBy, modals), `DashboardNotificationsContext` (toasts). Особенности: `isMountedRef` + `requestId` против race conditions; таймеры тостов в `useRef` чистятся при unmount. |
| [model/taskFormConfig.js](src/entities/task/model/taskFormConfig.js) | Конфиг формы задачи: `MAX_TITLE`, `priorityConfig`, `categoryOptions`, валидаторы (включая cross-field `validateControlledTaskFields`). |
| [ui/Card.jsx](src/entities/task/ui/Card.jsx) | **Compound TaskCard.** Слоты `Card.Header`, `Card.Body`, `Card.Footer` через `TaskCardContext.Provider` без prop-drilling: `<Card item={t}><Card.Header/><Card.Body/><Card.Footer/></Card>` |
| [ui/card-parts/taskCardContext.jsx](src/entities/task/ui/card-parts/taskCardContext.jsx) | Локальный контекст карточки — передаёт item и handlers в дочерние слоты. |
| [ui/card-parts/TaskCardHeader.jsx](src/entities/task/ui/card-parts/TaskCardHeader.jsx) | Приоритет, категория, кнопки toggle-статуса и like. |
| [ui/card-parts/TaskCardBody.jsx](src/entities/task/ui/card-parts/TaskCardBody.jsx) | Заголовок + описание. Клик открывает `TaskCardDetailsModal`. |
| [ui/card-parts/TaskCardFooter.jsx](src/entities/task/ui/card-parts/TaskCardFooter.jsx) | Дедлайн, счётчик лайков, edit/delete кнопки. |
| [ui/card-parts/TaskCardDetailsModal.jsx](src/entities/task/ui/card-parts/TaskCardDetailsModal.jsx) | Модалка деталей через `createPortal`. |
| [ui/__tests__/Card.test.jsx](src/entities/task/ui/__tests__/Card.test.jsx) | Compound TaskCard рендерит слоты и пробрасывает callbacks. |

### [entities/dashboard-item/](src/entities/dashboard-item/) — Универсальный item

| Файл | Что делает |
|------|------------|
| [model/ItemsContext.jsx](src/entities/dashboard-item/model/ItemsContext.jsx) | Универсальное хранилище для tasks/recipes/movies — единый CRUD-интерфейс. Используется entity-страницами и интеграционным тестом. Работает поверх `@shared/api/mockApi`. |
| [model/entityConfigs.js](src/entities/dashboard-item/model/entityConfigs.js) | Конфиги типов сущностей: `tasks` (title, description, category, priority, status, dueDate), `recipes` (cuisine, difficulty, prepTime, cookTime, servings), `movies` (genre, status, rating, year, director, posterUrl). Каждый конфиг содержит `validate(values, touched)` с cross-field правилами. |
| [model/__tests__/entityConfigs.test.js](src/entities/dashboard-item/model/__tests__/entityConfigs.test.js) | Тесты cross-field валидации для всех трёх сущностей. |

### [entities/notification/](src/entities/notification/) — Toast
- [model/NotificationContext.jsx](src/entities/notification/model/NotificationContext.jsx) — глобальные тосты для entity-страниц (отдельно от дашбордовых). Рендерится через `ToastViewport` (`@shared/ui/ToastViewport`) с `createPortal`.

---

## Слой `shared/` — Переиспользуемое

Самый нижний слой. Не зависит ни от чего внутри проекта (кроме других файлов в shared). Это инфраструктура.

### [shared/ui/](src/shared/ui/) — UI Kit

| Компонент | Описание |
|-----------|----------|
| [Card.jsx](src/shared/ui/Card.jsx) | Generic compound-card для entity-страниц (отличается от `entities/task/ui/Card` — там доменный TaskCard). |
| [Modal.jsx](src/shared/ui/Modal.jsx) | Универсальная модалка через `createPortal`, блокирует скролл `body` через `useEffect`. |
| [Skeleton.jsx](src/shared/ui/Skeleton.jsx) | Skeleton-loader для списков. |
| [FilterableList.jsx](src/shared/ui/FilterableList.jsx) | Список с фильтрацией через `useFilter`. |
| [ToastViewport.jsx](src/shared/ui/ToastViewport.jsx) | Render-площадка для тостов из `entities/notification`. |
| [ErrorBoundary.jsx](src/shared/ui/ErrorBoundary.jsx) | Class component с `getDerivedStateFromError` + `componentDidCatch`. Оборачивает `<Routes>` в App. |
| [ServerError.jsx](src/shared/ui/ServerError.jsx) | Универсальный fallback при ошибке сервера, с кнопкой «Повторить». |

Тесты: [shared/ui/__tests__/](src/shared/ui/__tests__/) — Card, ErrorBoundary.

### [shared/lib/](src/shared/lib/) — Хуки и утилиты

| Файл | Что делает |
|------|------------|
| [useFetch.js](src/shared/lib/useFetch.js) | Async data fetcher с `data`, `loading`, `error`, `execute()`. |
| [useForm.js](src/shared/lib/useForm.js) | Управление формой: `values`, `errors`, `touched`, `handleChange`, `handleBlur`, `submitForm`. Поддерживает кастомные валидаторы. |
| [useFilter.js](src/shared/lib/useFilter.js) | Memoized фильтрация и сортировка массивов. Используется TaskCollection и EntityBoard. |
| [useModal.js](src/shared/lib/useModal.js) | Boolean state + `open()` / `close()` / `toggle()`. Используется в DashboardContext для add/edit модалок. |
| [safeParseJSON.js](src/shared/lib/safeParseJSON.js) | Защищённый `JSON.parse(value, fallback)` — спасает от падений при битом localStorage. |

Тесты: [shared/lib/__tests__/](src/shared/lib/__tests__/) — useFetch, useForm, useFilter, useModal, safeParseJSON.

### [shared/api/](src/shared/api/) — API-клиенты

| Файл | Описание |
|------|----------|
| [api.js](src/shared/api/api.js) | REST-клиент к Flask-backend. Базовый URL из `import.meta.env.VITE_API_URL` (по умолчанию `http://localhost:5001/api`). Группы методов: **Auth** (`register`, `login`, `sendVerificationCode`), **Profile** (`getUser`, `updateProfile`, `updateSettings`), **Dashboard items** (`getDashboardItems`, `createDashboardItem`, `updateDashboardItem`, `deleteDashboardItem`), **Analytics** (`getUserActivities`, `getDashboardAnalytics`). |
| [openai.js](src/shared/api/openai.js) | Клиент к OpenAI. Методы `generateInsights` (рекомендации по задачам) и `generatePredictions` (прогнозы). Используется DataPage и LifeWheelTool. |
| [mockApi.js](src/shared/api/mockApi.js) | In-memory mock с поддержкой `getAllData`, `createItem`, `updateItem`, `deleteItem`, `reset` для tasks/recipes/movies. Используется `ItemsContext` и интеграционным тестом. |
| [fetchMockData.js](src/shared/api/fetchMockData.js) | Простой Promise-based loader для демо-данных (`DataFetcher` сценарий). |

### [shared/config/](src/shared/config/)
- [mixedDashboardSeed.js](src/shared/config/mixedDashboardSeed.js) — сид-данные для mockApi (по 5 элементов в каждой коллекции).

### [shared/styles/](src/shared/styles/)
- [design-tokens.css](src/shared/styles/design-tokens.css) — переменные дизайн-системы (цвета, отступы, типографика, тени).
- [mixedDashboard.module.css](src/shared/styles/mixedDashboard.module.css) — CSS Module для entity-страниц и shared UI-компонентов.
- [Dashboard.css](src/shared/styles/Dashboard.css) — стили дашборда (hero, карточки, фильтры). Используется на `pages/dashboard/` и в `features/task-form/`.

---

## Стили

Стили организованы по FSD: глобальные — в `app/styles/`, переиспользуемые — в `shared/styles/`, page/widget/feature-специфичные — рядом со своими компонентами.

| Файл | Где живёт | Используется в |
|------|-----------|----------------|
| [app/styles/App.css](src/app/styles/App.css) | app | Глобальный layout: `.App`, scrollbar, переменные темы |
| [app/styles/index.css](src/app/styles/index.css) | app | Корневые сбросы и токены |
| [shared/styles/design-tokens.css](src/shared/styles/design-tokens.css) | shared | Дизайн-система: цвета, отступы, типографика, тени |
| [shared/styles/mixedDashboard.module.css](src/shared/styles/mixedDashboard.module.css) | shared | CSS Module для entity-страниц и shared UI |
| [shared/styles/Dashboard.css](src/shared/styles/Dashboard.css) | shared | Стили дашборда (hero, карточки, модалки, фильтры) — общий для page/dashboard и features/task-form |
| [features/auth/ui/Auth.css](src/features/auth/ui/Auth.css) | feature | Auth-страницы (Login/Register/VerificationCode) |
| [features/screen-protection/ui/*.module.css](src/features/screen-protection/ui/) | feature | ScreenshotGuard + ScreenshotButton |
| [widgets/header/ui/Header.css](src/widgets/header/ui/Header.css) | widget | Шапка |
| [widgets/life-wheel/ui/LifeWheelTool.css](src/widgets/life-wheel/ui/LifeWheelTool.css) | widget | LifeWheel виджет |
| [pages/data/ui/DataPage.css](src/pages/data/ui/DataPage.css) | page | Analytics, heatmap, графики |
| [pages/tools/ui/ToolsPage.css](src/pages/tools/ui/ToolsPage.css) | page | Tools-страница |
| [pages/profile/ui/ProfilePage.css](src/pages/profile/ui/ProfilePage.css) | page | Профиль |
| [pages/not-found/ui/NotFoundPage.css](src/pages/not-found/ui/NotFoundPage.css) | page | 404 |
| [shared/ui/ServerError.css](src/shared/ui/ServerError.css) | shared | ServerError fallback |

**Темизация:** CSS-переменные на `:root` для светлой темы, на `.dark-theme` для тёмной. JavaScript добавляет класс на `<html>` по `localStorage.theme`.

**Responsive:** breakpoints — `1024px` (tablet), `768px` (mobile), `480px` (small mobile).

---

## Тестирование

Vitest + React Testing Library + jsdom. **36 тестов в 14 файлах.**

| Тест | Слой | Что проверяет |
|------|------|---------------|
| [shared/lib/__tests__/useForm.test.js](src/shared/lib/__tests__/useForm.test.js) | shared | Обновления значений, touched, валидация на blur и submit |
| [shared/lib/__tests__/useFilter.test.js](src/shared/lib/__tests__/useFilter.test.js) | shared | Логика фильтрации |
| [shared/lib/__tests__/useFetch.test.js](src/shared/lib/__tests__/useFetch.test.js) | shared | Async data fetching, success/error states |
| [shared/lib/__tests__/useModal.test.js](src/shared/lib/__tests__/useModal.test.js) | shared | Open/close/toggle state |
| [shared/lib/__tests__/safeParseJSON.test.js](src/shared/lib/__tests__/safeParseJSON.test.js) | shared | Парсинг валидного/невалидного JSON, fallback |
| [shared/ui/__tests__/Card.test.jsx](src/shared/ui/__tests__/Card.test.jsx) | shared | Generic compound Card рендерит слоты и пробрасывает callbacks |
| [shared/ui/__tests__/ErrorBoundary.test.jsx](src/shared/ui/__tests__/ErrorBoundary.test.jsx) | shared | Ловит ошибку дочернего компонента, показывает fallback |
| [entities/dashboard-item/model/__tests__/entityConfigs.test.js](src/entities/dashboard-item/model/__tests__/entityConfigs.test.js) | entity | Cross-field валидация для tasks/recipes/movies |
| [entities/task/ui/__tests__/Card.test.jsx](src/entities/task/ui/__tests__/Card.test.jsx) | entity | Compound TaskCard с слотами Header/Body/Footer |
| [features/auth/__tests__/withAuth.test.jsx](src/features/auth/__tests__/withAuth.test.jsx) | feature | HOC показывает контент если залогинен, иначе fallback |
| [features/task-form/ui/__tests__/AddItemModal.test.jsx](src/features/task-form/ui/__tests__/AddItemModal.test.jsx) | feature | Валидация title, schedule, submit flow |
| [widgets/task-collection/ui/__tests__/TaskCollection.test.jsx](src/widgets/task-collection/ui/__tests__/TaskCollection.test.jsx) | widget | Применение фильтров и сортировки |
| [pages/dashboard/__tests__/Dashboard.integration.test.jsx](src/pages/dashboard/__tests__/Dashboard.integration.test.jsx) | page | Интеграция Dashboard с контекстом |
| [\_\_tests\_\_/mixed-dashboard.integration.test.jsx](src/__tests__/mixed-dashboard.integration.test.jsx) | e2e | E2E-сценарий: создание, поиск, удаление задачи через EntityBoard |

---

## Поток данных: типовой сценарий

**Сценарий: пользователь создаёт новую задачу.**

```
1. User кликает "✨ Создать задачу" в Dashboard
   ↓
2. Dashboard вызывает openAddModal() из useDashboardUI
   → DashboardContext устанавливает isAddModalOpen = true
   ↓
3. React ре-рендерит, AddItemModal монтируется
   → createPortal помещает оверлей в document.body
   → useEffect блокирует scroll: body.style.overflow = 'hidden'
   ↓
4. User заполняет title, выбирает приоритет/категорию/дату
   → useForm: onChange → setValues → перерисовка input
   → onBlur → validate → setErrors если что-то не так
   ↓
5. User нажимает "Создать задачу"
   → submitForm: финальная валидация всех полей
   → если ошибки — return false, modal остаётся открытой
   → если ок — addItem(payload) из DashboardContext
   ↓
6. addItem делает POST через api.createDashboardItem
   → Flask отвечает { success: true, item: {...} }
   → loadDashboardItems перезагружает список
   → notifySuccess('Задача создана')
   ↓
7. Notifications viewport показывает toast (4 секунды, потом fade)
8. Card перерисовывается с новой задачей в сетке
9. AddItemModal вызывает onClose → isAddModalOpen = false
   → useEffect cleanup: восстанавливает body overflow
   → модалка размонтируется
```

---

## Особенности и решения

| Проблема | Решение |
|----------|---------|
| Модалка «прибита» к области карточек | `createPortal(modal, document.body)` обходит containing block родителей с `transform`/`animation: ...both` |
| Память течёт от setTimeout | Все таймеры хранятся в `useRef`, чистятся в useEffect cleanup |
| Race condition при быстрой смене юзера | `loadDashboardItems` использует `requestId` ref для отсева устаревших ответов |
| setState после unmount | `isMountedRef` проверяется перед каждым setState в async flow |
| Битый localStorage крашит app | `safeParseJSON(value, fallback)` оборачивает все парсинги |
| Cmd+Shift+3 невозможно перехватить | Защита от скриншотов через manual button toggle |
| Heatmap labels плыли | Grid с `repeat(24, 28px)` синхронно для cells и labels — точное выравнивание |

---

## Архитектурные решения (защита проекта)

Раздел отвечает на каверзные вопросы по архитектуре: **что было выбрано, какие альтернативы рассматривались, и почему выбран именно этот подход**.

### Управление состоянием

#### Почему Context API, а не Redux / Zustand / MobX?

**Решение:** Context API + `useState` / `useReducer` внутри провайдеров.

**Альтернативы:**
- Redux Toolkit — глобальное состояние, time-travel debug, middleware
- Zustand — легковесный store без boilerplate
- MobX — observable state, реактивность

**Почему Context:**
- Размер приложения не оправдывает Redux: 6 контекстов на разные домены — меньше кода, чем настройка стора
- Нет требований к time-travel debug или сложной асинхронной логике (Redux Saga / Thunk не нужны)
- Context — нативный механизм React, не добавляет зависимостей
- Производительность достигается разделением на субконтексты (см. ниже)

**Trade-off:** Context при изменении значения ре-рендерит всех подписчиков. Решено через разделение `DashboardContext` на 3 субконтекста.

---

#### Почему `DashboardContext` разделён на 3 субконтекста?

**Решение:** `DashboardDataContext` + `DashboardUIContext` + `DashboardNotificationsContext`.

**Альтернатива:** один монолитный `DashboardContext` со всем состоянием.

**Почему разделение:**
- Карточка задачи (`Card`) подписана только на `DashboardDataContext`. Когда меняется `filters` (UI-состояние) — карточки **не перерисовываются**.
- `FilterPanel` подписан на `DashboardUIContext`. Когда подгружаются новые задачи — фильтр **не перерисовывается**.
- Notifications viewport подписан только на свой контекст. Toast'ы добавляются/убираются без затрагивания остального дерева.

**Цена:** чуть больше кода в провайдере, но видимо лучшая производительность на 50+ карточках.

---

#### Почему custom `useForm`, а не Formik / React Hook Form?

**Решение:** свой [useForm.js](src/shared/lib/useForm.js) на 85 строк.

**Альтернативы:**
- Formik — popular, полный набор features, но 13KB gzipped
- React Hook Form — meta-uncontrolled, очень производительный, 9KB gzipped
- Final Form — гибкий, поддерживает field arrays

**Почему свой:**
- Surface area формы маленький: title, category, priority, dueDate — нет nested fields, field arrays, conditional fields
- Полный контроль над валидацией (`validate(values, touched)` с cross-field правилами)
- Никакой внешней зависимости — меньше bundle, меньше API для изучения
- Учебный проект — показать что мы **умеем писать** хук, а не подключить готовый

**Trade-off:** При расширении до сложных форм (wizard, field arrays) свой `useForm` станет тесным.

---

### Композиция компонентов

#### Почему compound component для Card, а не props?

**Решение:** `<Card item={...}><Card.Header /><Card.Body /></Card>` — слоты через дочерний `TaskCardContext`.

**Альтернатива:** один компонент с большим количеством props:
```jsx
<Card
  item={task}
  showHeader
  showBody
  showFooter
  headerTitle="..."
  ...
/>
```

**Почему compound:**
- **Гибкость:** на разных страницах можно собирать карточку по-разному — например, только Header + Footer без Body
- **Композиция:** props слотов остаются внутри слотов, родитель не знает о деталях рендера
- **Нет prop-drilling:** все три слота получают `item`, `handlers` из единого `TaskCardContext`
- Это рекомендуемый паттерн React community (см. Reach UI, Radix UI, shadcn/ui)

**Trade-off:** Больше файлов (Header/Body/Footer вынесены), но каждый — маленький и понятный.

---

#### Почему модалки через `createPortal`, а не inline?

**Решение:** `return createPortal(<div className="modal-overlay">...</div>, document.body)`.

**Альтернатива:** просто `return <div className="modal-overlay">...</div>` без портала.

**Проблема, которую решает портал:**
CSS-свойства `transform`, `filter`, `perspective`, `backdrop-filter` создают **новый containing block** для `position: fixed` дочерних элементов. Если у предка `transform: translateY(0)` (например, из-за `animation-fill-mode: both` после анимации) — `position: fixed` начинает позиционироваться **относительно этого предка**, а не viewport.

У нас в `.cards-grid` был `animation: fadeInUp ... both` — модалка деталей задачи «прибивалась» к контейнеру карточек.

**Почему `document.body`:**
- Всегда существует, не требует доп. setup (#modal-root div)
- Гарантированно вне любых containing blocks
- Стандартный React-паттерн (так делает MUI, Radix, react-modal)

**Trade-off:** Может ломать z-index стэки если параллельно есть `position: fixed` элементы. Решено через `z-index: 2000` на модалках.

---

#### Почему `withAuth` HOC, а не hook?

**Решение:** HOC-обёртка [withAuth.jsx](src/features/auth/lib/withAuth.jsx).

**Альтернатива:** `useAuth` hook внутри каждой страницы:
```jsx
function ProtectedPage() {
  const { currentUser } = useAuth();
  if (!currentUser) return <LoginPrompt />;
  // ...
}
```

**Почему HOC:**
- DRY: одна обёртка для всех защищённых страниц, не дублируем `if (!currentUser) return <LoginPrompt />`
- Декларативно: на уровне роутинга видно, что страница защищена (`withAuth(DataPage)`)
- Можно передавать конфигурацию: `withAuth(DataPage, { fallbackMessage: '...' })`

**Trade-off:** HOC считается «уходящим» паттерном после введения hooks. Hooks-вариант (`useRequireAuth`) тоже валиден. Параллельно используется `ProtectedRouteWrapper` через React Router `<Outlet />` — это даже более современно.

---

### Производительность

#### Зачем столько `React.memo` / `useMemo` / `useCallback`? Это не преждевременная оптимизация?

**Решение:** Heavy memoization — 10 компонентов в `memo`, `useMemo` для тяжёлых вычислений, `useCallback` для всех handler'ов.

**Альтернатива:** ничего не мемоизировать, полагаться на React reconciliation.

**Почему мемоизация:**
- `Card` рендерится в списке. Без `React.memo` — все 50+ карточек перерисовываются при любом изменении `items`, даже если конкретная карточка не менялась
- `useCallback` для handler'ов (`onEdit`, `onDelete`) необходим, потому что они в зависимостях `Card` (memo'д). Без useCallback — новая ссылка на функцию каждый рендер → memo не работает
- `useMemo` для `contextValue` — иначе каждый рендер контекст-провайдер передаёт новый объект → все потребители ре-рендерятся

**Когда мемоизация ВРЕДНА:**
- Если компонент дешёвый и редко получает одинаковые props — useMemo съест больше времени на сравнение, чем сэкономит на ре-рендере
- В большинстве форм useCallback не нужен — input всё равно перерисуется при изменении value

**В нашем коде мемоизация оправдана** для списков карточек и провайдеров с большим количеством значений. Можем точно ответить — где, почему и какова цена.

---

#### Почему `React.lazy()` + `Suspense` для каждой страницы?

**Решение:** `const Dashboard = lazy(() => import('@pages/dashboard/ui/Dashboard'))` в [App.jsx](src/app/App.jsx).

**Альтернатива:** обычные `import` сверху файла.

**Почему lazy:**
- Code splitting: каждая страница — отдельный chunk. Initial bundle загружает только то, что нужно для текущего роута
- Bundle analyzer показывает: Dashboard (12KB) + ToolsPage (14KB) + DataPage (24KB) грузятся **по требованию**
- Первая загрузка приложения = 255KB (gzipped 81KB) вместо 320+KB

**Trade-off:** При первом переходе на страницу — небольшая задержка (показывается `<Suspense fallback>`). На быстром интернете незаметно, на 3G — ~200мс.

---

### Стили

#### Почему смесь CSS Modules и обычных CSS?

**Решение:** Hybrid — entity-страницы используют `mixedDashboard.module.css`, Dashboard — обычный `Dashboard.css`.

**Альтернативы:**
- Tailwind CSS — utility-first, но vendor lock-in и многословный JSX
- styled-components / Emotion — CSS-in-JS, динамические стили, но runtime cost
- Чисто CSS Modules — все стили scoped
- Чисто глобальный CSS — простота, но конфликты имён

**Почему hybrid:**
- Исторически: проект начинался с лабораторных, где использовался глобальный CSS
- Постепенная миграция: новые компоненты (UI Kit, entity-страницы) на CSS Modules
- Без big-bang переписывания: risk-free подход
- Глобальный CSS оправдан для тем-переменных (`--bg-card`, `--gradient-primary`) — они должны быть глобальны

**Trade-off:** Не идеально единообразно. Будущая итерация — мигрировать остаток.

---

#### Почему темизация через CSS-переменные, а не Theme Provider?

**Решение:** `:root { --bg-card: white }` + `.dark-theme { --bg-card: #161b22 }`, классы на `<html>`.

**Альтернатива:** `<ThemeProvider value={'dark'}>` с Context + CSS-in-JS.

**Почему CSS-переменные:**
- Нативно: не требует React, переменные меняются мгновенно, без ре-рендера дерева
- Перфоманс: переключение темы — это один class toggle на `<html>`, browser сам пересчитывает CSS
- Все стили (CSS, CSS Modules) автоматически получают новые значения через `var(--bg-card)`
- Меньше JS-кода

**Trade-off:** Нельзя из React узнать текущее значение переменной (например, чтобы передать в библиотечный компонент которому нужен hex). Решается чтением `getComputedStyle(root).getPropertyValue('--bg-card')`.

---

### Бэкенд и API

#### Почему Flask, а не Node.js / Firebase / Supabase?

**Решение:** Flask + SQLite на отдельном порту.

**Альтернативы:**
- Node.js + Express — JavaScript end-to-end, общая кодовая база
- Firebase — managed, без своего сервера, real-time БД
- Supabase — open-source Firebase, Postgres
- Hardcoded mock — без бэкенда, всё в memory

**Почему Flask:**
- Разделение ответственности: frontend и backend — независимые сервисы (как в реальной разработке)
- SQLite — простая локальная БД, не требует Docker / отдельной СУБД
- Python lab-friendly: знакомый язык
- Дисциплина — React, бэкенд это бонус. Не хочется тратить время на сложный stack

**Trade-off:** Невозможно деплоить на статический хостинг (Vercel, Netlify) без отдельного хостинга для Flask. Для учебного проекта это не проблема.

---

#### Почему JWT-less auth с email-верификацией?

**Решение:** двухшаговый flow — пароль → email-код → сессия в localStorage.

**Альтернативы:**
- JWT — стандартный stateless токен в Authorization header
- OAuth (Google, GitHub) — без своих паролей
- Session cookies — server-managed

**Почему наш подход:**
- Показывает **полный auth flow**: регистрация, верификация, повторная отправка, защита от brute-force (3 попытки)
- Email-код добавляет 2FA-like безопасность для учебной демонстрации
- Простота: не нужно настраивать JWT-секреты, OAuth-приложения, refresh tokens

**Trade-off:** localStorage уязвим для XSS. Для production — httpOnly cookies + CSRF token. В учебном проекте этого пока нет.

---

### Безопасность

#### Почему screen protection через ручную кнопку, а не автоматическое определение?

**Решение:** кнопка в Header → toggle blur overlay вручную.

**Альтернатива:** автоматически детектить нажатия Cmd+Shift+3/4/5 и блюрить.

**Почему ручное:**
- **OS-уровневые скриншот-хоткеи технически невозможно перехватить из браузера.** macOS / Windows ловят `Cmd+Shift+3` на уровне ядра ДО того, как событие доходит до приложения. Любая JS-реакция — после факта (скрин уже сделан).
- Автоматический подход даёт **ложное чувство безопасности** + ложные срабатывания (например, `Cmd+Shift+T` для открытия закрытой вкладки тоже триггерил бы блюр)
- Честное архитектурное решение: показываем что мы **знаем ограничения веба**

**Реальная защита возможна:**
- Нативное приложение (macOS `ScreenCaptureKit`, Android `FLAG_SECURE`, iOS `UIScreen.isCaptured`)
- DRM-видео (Widevine) — пиксели шифруются в GPU
- Не отображать чувствительные данные на frontend (маскировать на бэкенде)

---

#### Почему `safeParseJSON` helper, а не try-catch на месте?

**Решение:** [src/shared/lib/safeParseJSON.js](src/shared/lib/safeParseJSON.js) — обёртка `(value, fallback) => parsed | fallback`.

**Альтернатива:** `try { JSON.parse(...) } catch { fallback }` в каждом месте использования.

**Почему helper:**
- DRY: один файл — все парсинги защищены
- Тестируется отдельно ([safeParseJSON.test.js](src/shared/lib/__tests__/safeParseJSON.test.js))
- Невозможно забыть try-catch (легко пропустить в одном из 5 мест в `AuthContext.jsx`)

**Trade-off:** Лишняя функция в bundle (но это `< 100 байт`).

---

### Инструменты разработки

#### Почему Vitest, а не Jest?

**Решение:** Vitest 4.1 как test runner.

**Альтернативы:**
- Jest — самый популярный, большое community
- @testing-library/react с любым runner'ом

**Почему Vitest:**
- **Нативная интеграция с Vite:** один transform pipeline, один конфиг
- **ESM-first:** работает с современным JavaScript без CommonJS-хаков
- **Быстрее Jest** на больших тестах (parallel by default)
- API идентичен Jest (`describe`, `it`, `expect`, `vi.mock`) — нет проблем мигрировать в обе стороны

**Trade-off:** Меньше community / плагинов, но для базового тестирования компонентов хватает.

---

#### Почему React 19, а не 18?

**Решение:** React 19.2 (последняя stable).

**Альтернативы:**
- React 18.3 — широко используется, стабильнее в production

**Почему 19:**
- Нет breaking changes для нашего кода: все hooks работают одинаково
- Новые возможности: `use()` hook, server components, ref как prop (нам не нужно, но не мешает)
- Демонстрирует знание текущего состояния экосистемы

**Trade-off:** Меньше production-ready библиотек поддерживают 19. Но для нашего стека (без сторонних UI-библиотек) — не проблема.

---

#### Почему Vite, а не CRA (Create React App)?

**Решение:** Vite 8.0.0-beta.

**Альтернативы:**
- CRA — официальный, но **deprecated** Facebook'ом в 2023
- Next.js — overkill для SPA без SSR
- Webpack manual config — слишком много boilerplate

**Почему Vite:**
- Скорость dev-сервера (HMR < 100мс vs CRA 2-5 сек)
- ESM-native — нет CommonJS compatibility layer
- Простой конфиг (один файл, ~10 строк)
- Production build через Rollup — отличный tree-shaking

**Trade-off:** Бета-версия (8.0.0-beta.13). Можно было откатиться на стабильную 5.x, но риск ломать сборку выше выгоды.

---

### React-специфичные решения

#### Почему `ErrorBoundary` — class component, а не функциональный?

**Решение:** [ui/ErrorBoundary.jsx](src/shared/ui/ErrorBoundary.jsx) как class component.

**Альтернатива:** функциональный компонент с хуками.

**Почему class:**
- **React не предоставляет hook-эквивалент `componentDidCatch`.** На сегодня (React 19) error boundaries возможны **только в class components**. Это документировано в официальных docs.
- Альтернатива — использовать библиотеку `react-error-boundary` (которая под капотом всё равно class component)
- Своя реализация показывает понимание API React (`getDerivedStateFromError`, `componentDidCatch`)

---

#### Почему `isMountedRef` + `requestId`, а не `AbortController`?

**Решение:** ref-based отсечение устаревших ответов в `DashboardContext.loadDashboardItems`.

**Альтернатива:** `AbortController` + `fetch(url, { signal })`.

**Почему refs:**
- Наш `api.js` сервис не принимает `signal` параметр (методы — простые wrappers над fetch)
- Refactoring API под `AbortSignal` — нетривиальный (нужно прокидывать signal в каждый метод)
- Ref-pattern работает без изменений API: проверка `isMountedRef.current && requestId === currentId` перед `setState`

**Trade-off:** Сетевой запрос всё равно выполнится до конца (нет реальной отмены). Но `setState` не сработает, что предотвращает ошибки и лишние ре-рендеры.

---

### Тестирование

#### Почему так мало E2E тестов?

**Решение:** 36 тестов = 32 unit + 4 интеграционных. Нет Cypress / Playwright.

**Альтернативы:**
- Cypress — полные E2E с реальным браузером
- Playwright — современная альтернатива Cypress
- Только ручное тестирование

**Почему такой выбор:**
- Юнит-тесты покрывают логику (валидация, фильтры, formы)
- Интеграционные тесты проверяют связку components + context
- E2E не требуется по критериям, добавил бы 1-2 часа конфигурации
- Bundle, CI-конфигурации, headless-браузеры — overkill для учебного проекта

**Trade-off:** UI-регрессии не ловятся автоматически. Решается через ручное тестирование сценариев перед демо.

---

### Шпаргалка для защиты

**Если спросят про конкретное место в коде — где смотреть:**

| Вопрос | Файл с ответом |
|--------|----------------|
| «Где Provider tree?» | [src/app/App.jsx:132-144](src/app/App.jsx#L132-L144) — AuthProvider → DashboardProvider → ScreenProtectionProvider |
| «Покажите кастомный хук» | [src/shared/lib/useForm.js](src/shared/lib/useForm.js) — полный пример |
| «Где Context?» | 6 контекстов разнесены по FSD: [features/auth](src/features/auth/model/AuthContext.jsx), [entities/task](src/entities/task/model/DashboardContext.jsx), [entities/dashboard-item](src/entities/dashboard-item/model/ItemsContext.jsx), [entities/notification](src/entities/notification/model/NotificationContext.jsx), [features/task-filter](src/features/task-filter/model/FilterContext.jsx), [features/screen-protection](src/features/screen-protection/model/ScreenProtectionContext.jsx) |
| «Где FSD-архитектура?» | [vite.config.js](vite.config.js) — алиасы `@app`/`@pages`/...; [src/](src/) — слои на верхнем уровне |
| «Где React.memo?» | [src/pages/dashboard/ui/Dashboard.jsx](src/pages/dashboard/ui/Dashboard.jsx) — `export default memo(Dashboard)` |
| «Где useMemo для дорогих вычислений?» | [src/pages/dashboard/ui/Dashboard.jsx](src/pages/dashboard/ui/Dashboard.jsx) — статистика |
| «Где useCallback?» | [src/entities/task/model/DashboardContext.jsx](src/entities/task/model/DashboardContext.jsx) — все CRUD методы |
| «Где валидация форм?» | [src/shared/lib/useForm.js](src/shared/lib/useForm.js) + [src/entities/dashboard-item/model/entityConfigs.js](src/entities/dashboard-item/model/entityConfigs.js) |
| «Где cleanup в useEffect?» | [src/entities/task/model/DashboardContext.jsx](src/entities/task/model/DashboardContext.jsx) — `notificationTimeouts.current.forEach(clearTimeout)` |
| «Где Suspense + lazy?» | [src/app/App.jsx:23-30](src/app/App.jsx#L23-L30) — `lazy()` импорты страниц; [App.jsx:85](src/app/App.jsx#L85) — `<Suspense fallback>` |
| «Где Error Boundary?» | [src/shared/ui/ErrorBoundary.jsx](src/shared/ui/ErrorBoundary.jsx) + [App.jsx:84](src/app/App.jsx#L84) |
| «Где портал?» | [src/entities/task/ui/card-parts/TaskCardDetailsModal.jsx](src/entities/task/ui/card-parts/TaskCardDetailsModal.jsx) — `createPortal(..., document.body)` |
| «Где compound component?» | [src/entities/task/ui/Card.jsx](src/entities/task/ui/Card.jsx) — `Card.Header`, `Card.Body`, `Card.Footer` |
| «Где HOC?» | [src/features/auth/lib/withAuth.jsx](src/features/auth/lib/withAuth.jsx) |
| «Где Protected Route?» | [src/app/App.jsx:42-54](src/app/App.jsx#L42-L54) — `ProtectedRouteWrapper` через Outlet |
| «Где интеграция с API?» | [src/shared/api/api.js](src/shared/api/api.js) |
| «Где обработка ошибок API?» | [src/entities/task/model/DashboardContext.jsx](src/entities/task/model/DashboardContext.jsx) — try/catch + `notifyError` |
| «Где тесты?» | По FSD: `__tests__/` папки в [shared/lib](src/shared/lib/__tests__/), [shared/ui](src/shared/ui/__tests__/), [entities/task/ui](src/entities/task/ui/__tests__/), [entities/dashboard-item/model](src/entities/dashboard-item/model/__tests__/), [features/auth](src/features/auth/__tests__/), [features/task-form/ui](src/features/task-form/ui/__tests__/), [widgets/task-collection/ui](src/widgets/task-collection/ui/__tests__/), [pages/dashboard](src/pages/dashboard/__tests__/) + e2e в [src/\_\_tests\_\_/](src/__tests__/) |
