# TaskFlow AI — Mixed Dashboard

> Финальный проект по дисциплине React. Smart task management с AI-инсайтами, аналитикой и интегрированными рецептами/фильмами в едином дашборде.

Единое React-приложение, которое объединяет три сущности (**задачи / рецепты / фильмы**) в одном пользовательском опыте: dashboard с фильтрацией и сортировкой, аналитика с heatmap'ом, AI-рекомендации, авторизация с email-верификацией и темизация.

---

## Содержание

- [Возможности](#возможности)
- [Стек технологий](#стек-технологий)
- [Быстрый старт](#быстрый-старт)
- [Переменные окружения](#переменные-окружения)
- [Архитектура](#архитектура)
- [Дерево папок](#дерево-папок)
- [Точка входа](#точка-входа)
- [Контексты (`src/context/`)](#контексты-srccontext)
- [Кастомные хуки (`src/hooks/`)](#кастомные-хуки-srchooks)
- [Маршруты и страницы](#маршруты-и-страницы)
- [Layout](#layout-srccomponentslayout)
- [Domain — Dashboard](#domain--dashboard)
- [Domain — Entities](#domain--entities)
- [Auth](#auth-srccomponentsauth)
- [UI Kit](#ui-kit-srccomponentsui)
- [Tools](#tools-srccomponentstools)
- [Services](#services-srcservices)
- [Utils](#utils-srcutils)
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

## Архитектура

```
┌────────────────────────────────────────────────────────────┐
│                       <BrowserRouter>                       │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  <AuthProvider>                                      │  │
│  │   └─ <DashboardProvider>                             │  │
│  │       └─ <ScreenProtectionProvider>                  │  │
│  │           └─ <ScreenshotGuard>                       │  │
│  │               └─ <AppContent>                        │  │
│  │                   ├─ <Header>                        │  │
│  │                   ├─ <Notifications>                 │  │
│  │                   └─ <ErrorBoundary>                 │  │
│  │                       └─ <Suspense fallback>         │  │
│  │                           └─ <Routes>                │  │
│  │                               ├─ /          Dashboard│  │
│  │                               ├─ /tools     ToolsPage│  │
│  │                               ├─ /data      DataPage │  │
│  │                               ├─ /profile   Profile  │  │
│  │                               ├─ /login     Login    │  │
│  │                               ├─ /register  Register │  │
│  │                               └─ *          NotFound │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘

         Flask backend (отдельный процесс на :5001)
```

**Ключевая идея:** Provider-tree оборачивает приложение, передавая глобальное состояние через Context API. Маршруты ленивые (`React.lazy` + `Suspense`). ErrorBoundary защищает дерево от падений.

---

## Дерево папок

```
src/
├── App.jsx                  ← корень: Router + Providers + Routes
├── main.jsx                 ← bootstrap (ReactDOM.createRoot)
│
├── api/
│   └── mockApi.js           ← in-memory mock для интеграционных тестов
│
├── components/
│   ├── Auth/                ← страницы авторизации + HOC
│   ├── Dashboard/           ← основной дашборд задач
│   │   ├── card-parts/      ← compound-pattern для карточки
│   │   └── ...
│   ├── entities/            ← переиспользуемые компоненты под рецепты/фильмы
│   ├── forms/               ← EntityFormModal (универсальная форма)
│   ├── Layout/              ← Header, Footer, AppShell
│   ├── Pages/               ← страницы (DataPage, ToolsPage, ProfilePage)
│   ├── shared/              ← переиспользуемые ошибки
│   ├── Tools/               ← LifeWheelTool (виджет)
│   ├── ui/                  ← UI kit: Card, Modal, Skeleton, ErrorBoundary
│   └── *.jsx                ← legacy виджеты лабораторных
│
├── context/                 ← глобальное состояние через Context API
│
├── hooks/                   ← кастомные хуки
│
├── pages/                   ← entity-страницы (Tasks/Recipes/Movies)
│
├── services/
│   ├── api.js               ← REST-клиент к Flask бэкенду
│   └── openai.js            ← AI-инсайты
│
├── styles/                  ← глобальные CSS
│
├── utils/
│   ├── entityConfigs.js     ← конфиги сущностей (поля, валидация)
│   ├── safeParseJSON.js     ← безопасный парсинг localStorage
│   └── mixedDashboardSeed.js
│
└── __tests__/               ← интеграционные тесты
```

---

## Точка входа

### [src/main.jsx](src/main.jsx)
Bootstrap React-приложения. Создаёт root и рендерит `<App />`.

### [src/App.jsx](src/App.jsx)
Корневой компонент:
- Оборачивает в `<BrowserRouter>`, провайдеры и `<ScreenshotGuard>`
- Управляет темой (`isDarkTheme`) и хранит её в `localStorage`
- Определяет маршруты (некоторые защищены `<ProtectedRouteWrapper>` или `withAuth`)
- Использует `React.lazy()` + `<Suspense>` для code splitting
- Оборачивает `<Routes>` в `<ErrorBoundary>`

---

## Контексты (`src/context/`)

Глобальное состояние разделено по **доменам**, не по типу данных. Это даёт независимые ре-рендеры — подписчики `AuthContext` не перерисуются при изменении задач.

### [AuthContext.jsx](src/context/AuthContext.jsx)
**Авторизация и пользовательская сессия.**

- Хранит: `currentUser`, `loading`, `pendingVerification`
- При маунте восстанавливает сессию из `localStorage` (через `safeParseJSON`)
- Двухшаговый flow: `initiateLogin` / `completeLogin` с email-кодом
- Аналогично для регистрации: `initiateRegister` / `completeRegister`
- Методы: `logout`, `updateUserProfile`, `updateUserSettings`, `getCurrentUserData`

### [DashboardContext.jsx](src/context/DashboardContext.jsx)
**Главный контекст дашборда. Разделён на 3 субконтекста для оптимизации.**

| Контекст | Что хранит | Кто подписан |
|----------|------------|--------------|
| `DashboardDataContext` | `items`, `loading`, `error`, CRUD методы | Карточки, статистика |
| `DashboardUIContext` | `filters`, `sortBy`, состояние модалок | FilterPanel, кнопки модалок |
| `DashboardNotificationsContext` | `notifications`, push-методы | Notifications viewport |

Особенности:
- `loadDashboardItems` использует `isMountedRef` + `requestId` для защиты от race conditions
- `pushNotification` хранит таймеры в `useRef`, чистит при размонтировании
- API-вызовы через `api.getDashboardItems / createDashboardItem / ...`

### [NotificationContext.jsx](src/context/NotificationContext.jsx)
Toast-уведомления для entity-страниц (рецепты/фильмы). `ToastViewport` рендерит через portal.

### [FilterContext.jsx](src/context/FilterContext.jsx)
Фильтры и сортировка для entity-страниц. Отдельные настройки для каждой сущности.

### [ItemsContext.jsx](src/context/ItemsContext.jsx)
Универсальное хранилище для entity-страниц. Работает с любым типом (`tasks`, `recipes`, `movies`) через единый интерфейс CRUD.

### [ScreenProtectionContext.jsx](src/context/ScreenProtectionContext.jsx)
Обёртка над `useScreenProtection`. Позволяет кнопке в Header и оверлею в ScreenshotGuard шарить одно состояние.

---

## Кастомные хуки (`src/hooks/`)

| Хук | Что делает | Где используется |
|-----|------------|------------------|
| [useFetch.js](src/hooks/useFetch.js) | Async data fetcher с `data`, `loading`, `error`, `execute()` | Везде где нужен ad-hoc запрос |
| [useForm.js](src/hooks/useForm.js) | Управление формой: `values`, `errors`, `touched`, валидация | Все модалки форм |
| [useFilter.js](src/hooks/useFilter.js) | Memoized фильтрация массива | Tasks/Recipes/Movies pages |
| [useModal.js](src/hooks/useModal.js) | Boolean state + `open` / `close` / `toggle` | Add/Edit модалки |
| [useServerData.js](src/hooks/useServerData.js) | Wrapper для запросов через `mockApi` | ItemsContext |
| [useScreenProtection.js](src/hooks/useScreenProtection.js) | Управление защитой: `activate`, `deactivate`, `toggle` | ScreenProtectionContext |

---

## Маршруты и страницы

### `/` — Dashboard
[components/Dashboard/Dashboard.jsx](src/components/Dashboard/Dashboard.jsx) — главная страница с hero, статистикой, фильтрами, сеткой карточек. Использует `DashboardContext`.

### `/tools` — Tools
[components/Pages/ToolsPage.jsx](src/components/Pages/ToolsPage.jsx) — обёртка для `<LifeWheelTool />`. Виджет «колесо жизненного баланса» с AI-рекомендациями.

### `/data` — Analytics
[components/Pages/DataPage.jsx](src/components/Pages/DataPage.jsx) — большая страница аналитики:
- `MainStats` — карточки общей статистики
- `Heatmap` — 7×24 тепловая карта (выровненная по grid)
- `TrendChart` — гистограмма за 30 дней
- `DistributionSection` — распределение по категориям и приоритетам
- `InsightsSection` — AI-инсайты через OpenAI

### `/profile` — Profile
[components/Pages/ProfilePage.jsx](src/components/Pages/ProfilePage.jsx) — редактирование профиля.

### `/login`, `/register` — Auth
[Login.jsx](src/components/Auth/Login.jsx) / [Register.jsx](src/components/Auth/Register.jsx) — с email-верификацией.

### Entity-страницы (`src/pages/`)
[TasksPage.jsx](src/pages/TasksPage.jsx), [RecipesPage.jsx](src/pages/RecipesPage.jsx), [MoviesPage.jsx](src/pages/MoviesPage.jsx) — обобщённый CRUD через `ItemsContext` + `FilterContext` + `EntityFormModal` + `entityConfigs`.

### `*` — NotFound
[NotFoundPage.jsx](src/components/Pages/NotFoundPage.jsx) — 404 с easter-egg анимациями.

---

## Layout (`src/components/Layout/`)

| Компонент | Описание |
|-----------|----------|
| [Header.jsx](src/components/Layout/Header.jsx) | Шапка: логотип, навигация, ScreenshotButton, переключатель темы, имя пользователя, logout |
| [Footer.jsx](src/components/Layout/Footer.jsx) | Подвал (legacy) |
| [AppShell.jsx](src/components/Layout/AppShell.jsx) | Обёртка для entity-страниц с боковой панелью |

---

## Domain — Dashboard

Главный домен. Управление задачами.

### [Dashboard.jsx](src/components/Dashboard/Dashboard.jsx)
Контейнер: hero, статистика, фильтры, `TaskCollection` render-prop, сетка карточек. Подписан на `useDashboardData` + `useDashboardUI`.

### [TaskCollection.jsx](src/components/Dashboard/TaskCollection.jsx)
Render-prop: применяет фильтры/сортировку, передаёт `{ filteredItems }` через `children`. Логика отделена от представления.

### [StatsPanel.jsx](src/components/Dashboard/StatsPanel.jsx)
Карточки статистики (всего / активных / завершено / процент).

### [FilterPanel.jsx](src/components/Dashboard/FilterPanel.jsx)
Поиск, фильтр по категории/статусу, выбор сортировки.

### [Card.jsx](src/components/Dashboard/Card.jsx)
**Compound-component для карточки задачи.** Слоты `Card.Header`, `Card.Body`, `Card.Footer` через `TaskCardContext.Provider` без prop-drilling:

```jsx
<Card item={task} onEdit={...} onDelete={...}>
  <Card.Header />
  <Card.Body />
  <Card.Footer />
</Card>
```

### card-parts/
- [taskCardContext.jsx](src/components/Dashboard/card-parts/taskCardContext.jsx) — контекст карточки
- [TaskCardHeader.jsx](src/components/Dashboard/card-parts/TaskCardHeader.jsx) — приоритет, категория, toggle-кнопки
- [TaskCardBody.jsx](src/components/Dashboard/card-parts/TaskCardBody.jsx) — заголовок + описание (открывает details)
- [TaskCardFooter.jsx](src/components/Dashboard/card-parts/TaskCardFooter.jsx) — дата, лайки, кнопки
- [TaskCardDetailsModal.jsx](src/components/Dashboard/card-parts/TaskCardDetailsModal.jsx) — модалка деталей через `createPortal`

### [AddItemModal.jsx](src/components/Dashboard/AddItemModal.jsx) / [EditItemModal.jsx](src/components/Dashboard/EditItemModal.jsx)
Модалки создания/редактирования через `useForm` + `taskFormConfig`. Рендерятся через `createPortal`. Имеют:
- Валидацию title (минимум 3 символа)
- Cross-field: время без даты — ошибка, время в прошлом — ошибка
- Live preview карточки

### [taskFormConfig.js](src/components/Dashboard/taskFormConfig.js)
Конфигурация формы задачи: `MAX_TITLE`, `priorityConfig`, `categoryOptions`, валидаторы.

---

## Domain — Entities

Универсальный паттерн для рецептов и фильмов.

### [components/entities/EntityBoard.jsx](src/components/entities/EntityBoard.jsx)
Доска с карточками сущностей. Принимает `entityConfig`, работает с любым типом.

### [components/entities/EntityDetails.jsx](src/components/entities/EntityDetails.jsx)
Модалка деталей сущности.

### [components/forms/EntityFormModal.jsx](src/components/forms/EntityFormModal.jsx)
Универсальная форма создания/редактирования. Поля рендерятся из `entityConfig.fields`. Использует [ui/Modal.jsx](src/components/ui/Modal.jsx) с `createPortal`.

### [utils/entityConfigs.js](src/utils/entityConfigs.js)
Конфиги для каждой сущности:
- `tasks`: title, description, category, priority, status, dueDate
- `recipes`: title, description, cuisine, difficulty, prepTime, cookTime, servings
- `movies`: title, description, genre, status, rating, year, director, posterUrl

Каждый конфиг содержит `validate(values, touched)`, включая cross-field правила (rating > 0 если movie watched, prepTime + cookTime > 0 и т.д.).

---

## Auth (`src/components/Auth/`)

### [Login.jsx](src/components/Auth/Login.jsx)
Форма входа → `initiateLogin` → `VerificationCode` при `pendingVerification`. Имеет demo-кнопку.

### [Register.jsx](src/components/Auth/Register.jsx)
Регистрация: firstName, lastName, email, password, confirmPassword + локальная валидация. После `initiateRegister` → `VerificationCode`.

### [VerificationCode.jsx](src/components/Auth/VerificationCode.jsx)
6-значный код, таймер 60 секунд, кнопка повторной отправки. Завершает flow через `completeLogin` / `completeRegister`.

### [withAuth.jsx](src/components/Auth/withAuth.jsx)
HOC для защиты страниц. Если не залогинен — fallback с предложением войти.

### [Auth.css](src/components/Auth/Auth.css)
Стилизация в стиле сайта: glass + neumorphic, gradient-text заголовки, theme-aware через CSS-переменные.

---

## UI Kit (`src/components/ui/`)

Переиспользуемые UI-примитивы.

| Компонент | Описание |
|-----------|----------|
| [Card.jsx](src/components/ui/Card.jsx) | Compound-card для entity-страниц |
| [Modal.jsx](src/components/ui/Modal.jsx) | Универсальная модалка через `createPortal`, блокирует скролл body |
| [Skeleton.jsx](src/components/ui/Skeleton.jsx) | Skeleton-loader для списков |
| [FilterableList.jsx](src/components/ui/FilterableList.jsx) | Список с фильтрацией через `useFilter` |
| [ToastViewport.jsx](src/components/ui/ToastViewport.jsx) | Toast-уведомления через `createPortal` |
| [ErrorBoundary.jsx](src/components/ui/ErrorBoundary.jsx) | Class component с `getDerivedStateFromError` + `componentDidCatch` |
| [ScreenshotGuard.jsx](src/components/ui/ScreenshotGuard.jsx) | Обёртка приложения. При активации блюрит контент и показывает overlay |
| [ScreenshotButton.jsx](src/components/ui/ScreenshotButton.jsx) | Кнопка-toggle в Header для ручного включения защиты |

---

## Tools (`src/components/Tools/`)

### [LifeWheelTool.jsx](src/components/Tools/LifeWheelTool.jsx)
Виджет «колесо жизненного баланса». 8 категорий с ползунками 0-10, средний балл, визуализация через `<svg>` polygon. Кнопка «AI Анализ» отправляет данные в `services/openai.js` и показывает рекомендации.

---

## Services (`src/services/`)

### [api.js](src/services/api.js)
REST-клиент к Flask backend. Базовый URL из `import.meta.env.VITE_API_URL` (по умолчанию `http://localhost:5001/api`).

| Группа | Методы |
|--------|--------|
| Auth | `register`, `login`, `sendVerificationCode` |
| Profile | `getUser`, `updateProfile`, `updateSettings` |
| Dashboard items | `getDashboardItems`, `createDashboardItem`, `updateDashboardItem`, `deleteDashboardItem` |
| Analytics | `getUserActivities`, `getDashboardAnalytics` |

### [openai.js](src/services/openai.js)
Запросы к OpenAI: `generateInsights` (рекомендации) и `generatePredictions` (прогнозы).

---

## Utils (`src/utils/`)

| Файл | Назначение |
|------|------------|
| [entityConfigs.js](src/utils/entityConfigs.js) | Описание полей и валидации для tasks/recipes/movies |
| [safeParseJSON.js](src/utils/safeParseJSON.js) | Защищённый `JSON.parse` с fallback — спасает от падений при битом localStorage |
| [mixedDashboardSeed.js](src/utils/mixedDashboardSeed.js) | Сид-данные для демо-режима |
| [mockApi.js](src/utils/mockApi.js) | Дублирует `api/mockApi.js`, для legacy-страниц |

---

## Стили

Смесь CSS Modules и обычных CSS (исторически).

| Файл | Используется в |
|------|----------------|
| [src/App.css](src/App.css) | Глобальные стили: переменные темы, scrollbar, .App layout |
| [src/styles/Dashboard.css](src/styles/Dashboard.css) | Дашборд: hero, карточки, модалки, фильтры |
| [src/styles/mixedDashboard.module.css](src/styles/mixedDashboard.module.css) | CSS Module для entity-страниц |
| [src/components/Auth/Auth.css](src/components/Auth/Auth.css) | Auth страницы (Login/Register) |
| [src/components/Layout/Header.css](src/components/Layout/Header.css) | Шапка |
| [src/components/Pages/DataPage.css](src/components/Pages/DataPage.css) | Analytics, heatmap, графики |
| [src/components/ui/*.module.css](src/components/ui/) | CSS Modules для UI-компонентов |

**Темизация:** CSS-переменные на `:root` для светлой темы, на `.dark-theme` для тёмной. JavaScript добавляет класс на `<html>` по `localStorage.theme`.

**Responsive:** breakpoints — `1024px` (tablet), `768px` (mobile), `480px` (small mobile).

---

## Тестирование

Vitest + React Testing Library + jsdom. **36 тестов в 14 файлах.**

| Тест | Что проверяет |
|------|---------------|
| [hooks/__tests__/useForm.test.js](src/hooks/__tests__/useForm.test.js) | Обновления значений, touched, валидация на blur и submit |
| [hooks/__tests__/useFilter.test.js](src/hooks/__tests__/useFilter.test.js) | Логика фильтрации |
| [hooks/__tests__/useFetch.test.js](src/hooks/__tests__/useFetch.test.js) | Async data fetching, success/error states |
| [hooks/__tests__/useModal.test.js](src/hooks/__tests__/useModal.test.js) | Open/close/toggle state |
| [utils/__tests__/safeParseJSON.test.js](src/utils/__tests__/safeParseJSON.test.js) | Парсинг валидного/невалидного JSON, fallback |
| [utils/__tests__/entityConfigs.test.js](src/utils/__tests__/entityConfigs.test.js) | Cross-field валидация для tasks/recipes/movies |
| [components/ui/__tests__/Card.test.jsx](src/components/ui/__tests__/Card.test.jsx) | Compound Card рендерит слоты и пробрасывает callbacks |
| [components/ui/__tests__/ErrorBoundary.test.jsx](src/components/ui/__tests__/ErrorBoundary.test.jsx) | Ловит ошибку дочернего компонента, показывает fallback |
| [components/Auth/__tests__/withAuth.test.jsx](src/components/Auth/__tests__/withAuth.test.jsx) | HOC показывает контент если залогинен, иначе fallback |
| [components/Dashboard/__tests__/Card.test.jsx](src/components/Dashboard/__tests__/Card.test.jsx) | Compound TaskCard с слотами Header/Body/Footer |
| [components/Dashboard/__tests__/AddItemModal.test.jsx](src/components/Dashboard/__tests__/AddItemModal.test.jsx) | Валидация title, schedule, submit flow |
| [components/Dashboard/__tests__/TaskCollection.test.jsx](src/components/Dashboard/__tests__/TaskCollection.test.jsx) | Применение фильтров и сортировки |
| [components/Dashboard/__tests__/Dashboard.integration.test.jsx](src/components/Dashboard/__tests__/Dashboard.integration.test.jsx) | Интеграция Dashboard с контекстом |
| [__tests__/mixed-dashboard.integration.test.jsx](src/__tests__/mixed-dashboard.integration.test.jsx) | E2E-сценарий: создание, поиск, удаление задачи |

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

**Решение:** свой [useForm.js](src/hooks/useForm.js) на 85 строк.

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

**Решение:** HOC-обёртка [withAuth.jsx](src/components/Auth/withAuth.jsx).

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

**Решение:** `const Dashboard = lazy(() => import('./Dashboard.jsx'))` в [App.jsx](src/App.jsx).

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

**Решение:** [src/utils/safeParseJSON.js](src/utils/safeParseJSON.js) — обёртка `(value, fallback) => parsed | fallback`.

**Альтернатива:** `try { JSON.parse(...) } catch { fallback }` в каждом месте использования.

**Почему helper:**
- DRY: один файл — все парсинги защищены
- Тестируется отдельно ([safeParseJSON.test.js](src/utils/__tests__/safeParseJSON.test.js))
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

**Решение:** [ui/ErrorBoundary.jsx](src/components/ui/ErrorBoundary.jsx) как class component.

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
| «Где Provider tree?» | [src/App.jsx](src/App.jsx) lines 127-141 |
| «Покажите кастомный хук» | [src/hooks/useForm.js](src/hooks/useForm.js) — полный пример |
| «Где Context?» | [src/context/](src/context/) — 6 контекстов |
| «Где React.memo?» | [src/components/Dashboard/Dashboard.jsx:329](src/components/Dashboard/Dashboard.jsx#L329) — `export default memo(Dashboard)` |
| «Где useMemo для дорогих вычислений?» | [src/components/Dashboard/Dashboard.jsx](src/components/Dashboard/Dashboard.jsx) — статистика |
| «Где useCallback?» | [src/context/DashboardContext.jsx](src/context/DashboardContext.jsx) — все CRUD методы |
| «Где валидация форм?» | [src/hooks/useForm.js](src/hooks/useForm.js) + [src/utils/entityConfigs.js](src/utils/entityConfigs.js) |
| «Где cleanup в useEffect?» | [src/context/DashboardContext.jsx](src/context/DashboardContext.jsx) — `notificationTimeouts.current.forEach(clearTimeout)` |
| «Где Suspense + lazy?» | [src/App.jsx](src/App.jsx) lines 21-28, 82 |
| «Где Error Boundary?» | [src/components/ui/ErrorBoundary.jsx](src/components/ui/ErrorBoundary.jsx) + [App.jsx:83](src/App.jsx#L83) |
| «Где портал?» | [src/components/Dashboard/card-parts/TaskCardDetailsModal.jsx](src/components/Dashboard/card-parts/TaskCardDetailsModal.jsx) — `createPortal(..., document.body)` |
| «Где compound component?» | [src/components/Dashboard/Card.jsx](src/components/Dashboard/Card.jsx) — `Card.Header`, `Card.Body`, `Card.Footer` |
| «Где HOC?» | [src/components/Auth/withAuth.jsx](src/components/Auth/withAuth.jsx) |
| «Где Protected Route?» | [src/App.jsx:40-52](src/App.jsx#L40-L52) — `ProtectedRouteWrapper` через Outlet |
| «Где интеграция с API?» | [src/services/api.js](src/services/api.js) |
| «Где обработка ошибок API?» | [src/context/DashboardContext.jsx](src/context/DashboardContext.jsx) — try/catch + `notifyError` |
| «Где тесты?» | `__tests__/` папки в hooks, components, utils |
