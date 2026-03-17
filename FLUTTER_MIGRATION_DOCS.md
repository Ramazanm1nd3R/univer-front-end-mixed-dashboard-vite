# TaskFlow AI - Flutter Migration Documentation

## 1. API Reference

Base URL (frontend usage):
- `VITE_API_URL` from env, fallback: `http://localhost:5001/api`
- Source: [api.js](/Users/mac/Downloads/mixed-dashboard-vite/src/services/api.js)

Backend stack:
- Flask + SQLite
- CORS enabled globally (`CORS(app)`)
- Source: [server.py](/Users/mac/Downloads/mixed-dashboard-vite/backend/server.py)

Authentication model (current backend):
- There is **no JWT / bearer auth** in current API implementation.
- Endpoints rely on credentials in body (login/register) and `user_id` in path params.
- Flutter migration should either keep this model for parity or introduce token auth as a separate backend enhancement.

---

### 1.1 `POST /api/send-verification-code`

Purpose:
- Sends verification code to email via SMTP (`smtp.gmail.com:587`) for login/register flow.

Source:
- [server.py](/Users/mac/Downloads/mixed-dashboard-vite/backend/server.py)

Headers:
- `Content-Type: application/json`

Request body:
```json
{
  "email": "user@example.com",
  "code": "123456",
  "type": "login"
}
```

Fields:
- `email` (string, required)
- `code` (string, required)
- `type` (string, optional): `"login"` default, or `"register"`

Success response (`200`):
```json
{
  "success": true,
  "message": "Код отправлен на user@example.com",
  "code": "123456"
}
```

Error responses:
- `400` (validation)
```json
{
  "success": false,
  "error": "Email и код обязательны"
}
```
- `500` (SMTP or runtime failure)
```json
{
  "success": false,
  "error": "Не удалось отправить email"
}
```
or
```json
{
  "success": false,
  "error": "<python exception text>"
}
```

Business logic:
1. Reads JSON body.
2. Validates `email` and `code`.
3. Builds branded HTML email (verification type-specific text).
4. Sends via Gmail SMTP with env credentials (`EMAIL_SENDER`, `EMAIL_PASSWORD`).
5. Returns success or error.

Flutter notes:
- Code generation happens client-side in current web flow.
- Backend currently returns the same `code` in response; preserve for parity, or remove for stricter security in production.

---

### 1.2 `POST /api/register`

Purpose:
- Creates a new user record in SQLite.

Source:
- [server.py](/Users/mac/Downloads/mixed-dashboard-vite/backend/server.py)
- [database.py](/Users/mac/Downloads/mixed-dashboard-vite/backend/database.py)

Headers:
- `Content-Type: application/json`

Request body:
```json
{
  "email": "user@example.com",
  "password": "plain-text-password",
  "firstName": "John",
  "lastName": "Doe"
}
```

Success response (`201`):
```json
{
  "success": true,
  "userId": "user-1741684523.123"
}
```

Error responses:
- `400` when email already exists
```json
{
  "success": false,
  "error": "Email уже зарегистрирован"
}
```
- `500` runtime/db error
```json
{
  "success": false,
  "error": "<python exception text>"
}
```

Business logic:
1. Checks uniqueness by `email` in `users`.
2. Generates `user_id` as `user-<timestamp>`.
3. Inserts user with:
   - plain text password (as-is in current backend),
   - `created_at`,
   - empty `profile_data`,
   - default `settings_data` JSON (`language`, `timezone`, `theme`, notifications).
4. Logs activity `register` in `user_activities`.

Flutter notes:
- No server-side schema validation beyond duplicate email and required field access.
- Missing required keys can trigger 500 due to direct indexing (`data['email']`, etc.).
- Strongly recommended for migration: add client-side pre-validation before request.

---

### 1.3 `POST /api/login`

Purpose:
- Authenticates user by email+password against SQLite and returns user profile basics.

Source:
- [server.py](/Users/mac/Downloads/mixed-dashboard-vite/backend/server.py)

Headers:
- `Content-Type: application/json`

Request body:
```json
{
  "email": "user@example.com",
  "password": "plain-text-password"
}
```

Success response (`200`):
```json
{
  "success": true,
  "user": {
    "id": "user-1741684523.123",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "createdAt": "2026-03-11T09:10:11.000000"
  }
}
```

Error responses:
- `401` invalid credentials
```json
{
  "success": false,
  "error": "Неверный email или пароль"
}
```
- `500` runtime/db error
```json
{
  "success": false,
  "error": "<python exception text>"
}
```

Business logic:
1. Selects user by `email` + `password`.
2. On success updates `last_login`.
3. Logs activity `login`.
4. Returns normalized user object.

Flutter notes:
- No token returned; session is client-managed (store returned `user`).
- Existing React app stores current user in Context and requests by `userId`.

---

### 1.4 `GET /api/user/<user_id>`

Purpose:
- Returns full user profile + settings JSON blobs.

Source:
- [server.py](/Users/mac/Downloads/mixed-dashboard-vite/backend/server.py)

Headers:
- No custom headers required.

Path params:
- `user_id` (string, required)

Request example:
```http
GET /api/user/user-1741684523.123
```

Success response (`200`):
```json
{
  "success": true,
  "user": {
    "id": "user-1741684523.123",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "createdAt": "2026-03-11T09:10:11.000000",
    "lastLogin": "2026-03-11T09:16:12.000000",
    "profile": {},
    "settings": {
      "emailNotifications": true,
      "pushNotifications": false,
      "weeklyDigest": true,
      "language": "ru",
      "timezone": "Asia/Almaty",
      "dateFormat": "DD.MM.YYYY",
      "theme": "auto"
    }
  }
}
```

Error responses:
- `404` user not found
```json
{
  "success": false,
  "error": "Пользователь не найден"
}
```
- `500` runtime/db error
```json
{
  "success": false,
  "error": "<python exception text>"
}
```

Business logic:
1. Reads user row by `id`.
2. Parses JSON text columns `profile_data` and `settings_data`.
3. Returns defaults `{}` if JSON fields are empty.

Flutter notes:
- Model must support nullable `lastLogin`.
- `profile` and `settings` should be dynamic maps with typed wrappers in Dart.

---

### 1.5 `PUT /api/user/<user_id>/profile`

Purpose:
- Overwrites `profile_data` JSON for a user.

Source:
- [server.py](/Users/mac/Downloads/mixed-dashboard-vite/backend/server.py)

Headers:
- `Content-Type: application/json`

Path params:
- `user_id` (string, required)

Request body example:
```json
{
  "phone": "+7 700 123 4567",
  "bio": "Flutter engineer",
  "company": "TaskFlow",
  "position": "Mobile Developer",
  "location": "Almaty",
  "website": "https://example.com",
  "github": "username",
  "linkedin": "username",
  "twitter": "username"
}
```

Success response (`200`):
```json
{
  "success": true
}
```

Error response (`500`):
```json
{
  "success": false,
  "error": "<python exception text>"
}
```

Business logic:
1. Reads full JSON body as-is.
2. Stores it in `users.profile_data` (full replacement, not partial merge).
3. Logs activity `update_profile` with payload details.

Flutter notes:
- Send complete profile object each update to avoid accidental field loss.
- No backend validation of shape/types for profile payload.

---

### 1.6 `PUT /api/user/<user_id>/settings`

Purpose:
- Overwrites `settings_data` JSON for a user.

Headers:
- `Content-Type: application/json`

Request body example:
```json
{
  "emailNotifications": true,
  "pushNotifications": false,
  "weeklyDigest": true,
  "language": "ru",
  "timezone": "Asia/Almaty",
  "dateFormat": "DD.MM.YYYY",
  "theme": "auto"
}
```

Success response (`200`):
```json
{
  "success": true
}
```

Business logic:
1. Stores entire JSON body into `users.settings_data`.
2. Logs activity `update_settings`.

---

### 1.7 `GET /api/dashboard/<user_id>/items`

Purpose:
- Returns all tasks for a user ordered by newest `created_at`.

Success response (`200`):
```json
{
  "success": true,
  "items": [
    {
      "id": "item-1741684523.123",
      "text": "Create mobile wireframes",
      "status": "active",
      "priority": "high",
      "category": "work",
      "createdAt": "2026-03-11T10:00:00",
      "updatedAt": "2026-03-11T10:00:00"
    }
  ]
}
```

Business logic:
1. Selects rows from `dashboard_items` by `user_id`.
2. Returns normalized list.
3. Current API does not expose `due_date` / `due_time` even though DB stores them.

---

### 1.8 `POST /api/dashboard/<user_id>/items`

Purpose:
- Creates a task.

Request body:
```json
{
  "text": "Create mobile wireframes",
  "status": "active",
  "priority": "high",
  "category": "work"
}
```

Success response (`201`):
```json
{
  "success": true,
  "itemId": "item-1741684523.123"
}
```

Business logic:
1. Generates `item-<timestamp>` id.
2. Inserts task with `created_at` and `updated_at = now`.
3. `status` defaults to `active`.
4. Logs activity `create_task`.

Edge cases:
- `text` is mandatory by direct access `data['text']`.
- `priority` and `category` may be null.
- `due_date` and `due_time` are not written by this endpoint.

---

### 1.9 `PUT /api/dashboard/<user_id>/items/<item_id>`

Purpose:
- Updates task fields.

Request body:
```json
{
  "text": "Create mobile wireframes",
  "status": "completed",
  "priority": "medium",
  "category": "work"
}
```

Success response (`200`):
```json
{
  "success": true
}
```

Business logic:
1. Updates `text`, `status`, `priority`, `category`, `updated_at`.
2. Filters by `item_id` and `user_id`.
3. Logs activity `update_task`.

Edge cases:
- No `404` when row is missing; endpoint still returns success.
- `text` and `status` are effectively required.

---

### 1.10 `DELETE /api/dashboard/<user_id>/items/<item_id>`

Purpose:
- Deletes task by user and id.

Success response (`200`):
```json
{
  "success": true
}
```

Business logic:
1. Deletes row from `dashboard_items`.
2. Logs activity `delete_task`.
3. No explicit not-found handling.

---

### 1.11 `GET /api/user/<user_id>/activities?limit=<n>`

Purpose:
- Returns recent user activity records.

Query params:
- `limit` optional, default `50`

Success response (`200`):
```json
{
  "success": true,
  "activities": [
    {
      "action": "create_task",
      "details": {
        "text": "Create mobile wireframes"
      },
      "timestamp": "2026-03-11T10:00:00"
    }
  ]
}
```

Business logic:
1. Reads `user_activities` ordered by newest first.
2. Parses `details` JSON string into object.

---

### 1.12 `GET /api/dashboard/<user_id>/analytics`

Purpose:
- Returns the full analytics payload consumed by `DataPage`.

Success response shape:
```json
{
  "success": true,
  "analytics": {
    "totalTasks": 12,
    "activeTasks": 4,
    "completedTasks": 8,
    "completionRate": 67,
    "categoryDistribution": {
      "work": 6,
      "personal": 4,
      "health": 2
    },
    "priorityDistribution": {
      "high": 3,
      "medium": 5,
      "low": 4
    },
    "topCategories": [
      {
        "name": "work",
        "count": 6,
        "percentage": 50.0
      }
    ],
    "last30Days": [
      {
        "date": "2026-03-11",
        "completed": 1,
        "active": 2
      }
    ],
    "heatmapData": {},
    "peakProductivityHour": 10,
    "peakProductivityDay": "Tuesday",
    "avgCompletionTime": "2.3 д.",
    "recentActivities": []
  }
}
```

Exact formulas:
- `totalTasks = len(items)`
- `activeTasks = count(status == "active")`
- `completedTasks = count(status == "completed")`
- `completionRate = round((completed / total) * 100)` else `0`
- `topCategories = sorted counts desc` with `percentage = round((count / total) * 100, 1)`
- `priorityDistribution = count by high / medium / low`
- `last30Days = for each day in [today-29 ... today], count created tasks by status`
- `peakProductivityHour = hour with max created task count`, fallback `10`
- `peakProductivityDay = day with max created task count`, fallback `Monday`
- `avgCompletionTime = average((updatedAt - createdAt) in days for completed tasks)` formatted as `"N.N д."`, else `"N/A"`
- `recentActivities = latest 10 tasks by updatedAt`

Day mapping detail:
- Python `weekday()` is remapped into custom names array `['Sunday', 'Monday', ..., 'Saturday']` using:
  - `day_names[dt.weekday() + 1 if dt.weekday() < 6 else 0]`

---

### 1.13 `GET /api/health`

Purpose:
- Health check.

Success response (`200`):
```json
{
  "status": "OK",
  "message": "Flask backend с SQLite работает",
  "database": "SQLite",
  "email_sender": "example@gmail.com"
}
```

## 2. Dashboard & Tasks

Sources:
- [Dashboard.jsx](/Users/mac/Downloads/mixed-dashboard-vite/src/components/Dashboard/Dashboard.jsx)
- [AddItemModal.jsx](/Users/mac/Downloads/mixed-dashboard-vite/src/components/Dashboard/AddItemModal.jsx)
- [EditItemModal.jsx](/Users/mac/Downloads/mixed-dashboard-vite/src/components/Dashboard/EditItemModal.jsx)
- [DashboardContext.jsx](/Users/mac/Downloads/mixed-dashboard-vite/src/context/DashboardContext.jsx)

Frontend task model:
```json
{
  "id": "item-1741684523.123",
  "title": "Create mobile wireframes",
  "description": "Create mobile wireframes",
  "category": "work",
  "status": "active",
  "priority": "high",
  "date": "DateTime",
  "updatedAt": "DateTime",
  "dueDate": "",
  "dueTime": "",
  "likes": 0
}
```

Task CRUD flow:
1. `AddItemModal` keeps form fields in `formData`.
2. `handleChange` updates one field at a time.
3. Validation rules:
   - title required
   - title max 100 chars
   - if time is set, date is required
4. `onAdd(formData)` delegates to `DashboardContext.addItem()`.
5. Context sends backend payload:
```json
{
  "text": "<title>",
  "status": "<status>",
  "priority": "<priority>",
  "category": "<category>"
}
```
6. After success, items reload from API and a notification is pushed.

Edit flow:
1. `openEditModal(item)` stores current item.
2. `EditItemModal` creates initial controlled state from item.
3. Submit calls `onUpdate({ ...item, ...formData })`.
4. Backend receives full updated task payload.

Delete flow:
- `deleteItem(id)` -> `DELETE /dashboard/<user_id>/items/<item_id>` -> reload list.

Status toggle flow:
- `toggleStatus(id)` flips `active` and `completed`, then sends full update request.

Local-only behavior:
- `toggleLike(id)` updates React state only and is not persisted.

Filtering:
- by category if `filters.category !== 'all'`
- by status if `filters.status !== 'all'`
- by search using `title.toLowerCase().includes(query)`

Sorting:
- `date`: newest first
- `title`: `localeCompare`
- `priority`: weight map `{ high: 3, medium: 2, low: 1 }`

Derived stats:
- `totalTasks = items.length`
- `activeCount = count(active)`
- `completedCount = count(completed)`
- `highCount = count(priority == high && status == active)`
- `completionPct = round((completedCount / totalTasks) * 100)` else `0`
- `streak = consecutive days backwards from today where completed task exists by updated date`

Important mismatch:
- DB schema supports `due_date` and `due_time`
- Current create/update/get task API does not transport these fields end-to-end

## 3. Analytics

Sources:
- [server.py](/Users/mac/Downloads/mixed-dashboard-vite/backend/server.py)
- [DataPage.jsx](/Users/mac/Downloads/mixed-dashboard-vite/src/components/Pages/DataPage.jsx)

Page views:
- `overview`
- `distribution`
- `predictions`
- `activities`

Sections:
- main stat cards
- AI insights
- 30-day trend chart
- heatmap
- category distribution
- priority distribution
- AI predictions
- recent activities table

Frontend helper formulas:
- `getHeatmapColor(count)`:
  - `0 -> var(--bg-secondary)`
  - `<=1 -> #dbeafe`
  - `<=3 -> #93c5fd`
  - `<=6 -> #3b82f6`
  - else `#1d4ed8`
- `getPriorityColor(priority)`:
  - `high -> linear-gradient(90deg,#ef4444,#dc2626)`
  - `medium -> linear-gradient(90deg,#f59e0b,#d97706)`
  - `low -> linear-gradient(90deg,#10b981,#059669)`

Prediction heuristics:
- `nextWeekEst = max(1, round((totalTasks / 30) * 7))`
- `burnoutRisk = high if active > 70% total, medium if active > 40%, else low`
- `recommended = max(1, round(nextWeekEst / 7))`

Formatting:
- `formatDate()` converts timestamps into relative Russian text for recent updates.

Load sequence:
1. `api.getDashboardAnalytics(userId)`
2. store `analytics`
3. call AI layer in background

## 4. AI Integration

Source:
- [openai.js](/Users/mac/Downloads/mixed-dashboard-vite/src/services/openai.js)

OpenAI config:
- endpoint: `https://api.openai.com/v1/chat/completions`
- model: `gpt-4o-mini`
- key env: `VITE_OPENAI_API_KEY`

### 4.1 Insights

System prompt:
```text
Ты — персональный аналитик продуктивности. Анализируй данные о задачах пользователя и генерируй полезные инсайты.

Правила:
- Пиши по-русски, неформально и дружелюбно (на "ты")
- Будь конкретным: используй числа и факты из данных
- Давай практические рекомендации, а не общие фразы
- Тон: мотивирующий, но честный
- Длина каждого инсайта: 1-2 предложения (максимум 150 символов)

Возвращай JSON строго в формате:
{
  "productivity": "текст о пике продуктивности",
  "bestDay": "текст о лучшем дне",
  "completionTime": "текст о среднем времени выполнения",
  "topCategory": "текст о топ-категории"
}
```

User prompt template:
```text
Проанализируй данные пользователя:

СТАТИСТИКА:
- Всего задач: ${analytics.totalTasks}
- Активных: ${analytics.activeTasks}
- Завершено: ${analytics.completedTasks}
- Скорость выполнения: ${analytics.completionRate}%
- Пик продуктивности: ${analytics.peakProductivityHour}:00
- Лучший день: ${analytics.peakProductivityDay}
- Среднее время закрытия: ${analytics.avgCompletionTime}

КАТЕГОРИИ (топ-3):
${(analytics.topCategories || []).slice(0, 3).map((c) => `- ${c.name}: ${c.count} задач (${c.percentage}%)`).join('\n') || '- Нет данных'}

ПРИОРИТЕТЫ:
${Object.entries(analytics.priorityDistribution || {}).map(([p, count]) => `- ${p}: ${count} задач`).join('\n') || '- Нет данных'}

ТРЕНД (последние 7 дней):
${(analytics.last30Days || []).slice(-7).map((d) => `${d.date}: ${d.completed} завершено, ${d.active} активных`).join('\n') || '- Нет данных'}

Сгенерируй 4 персонализированных инсайта в JSON формате.
```

Output:
```json
{
  "productivity": "string",
  "bestDay": "string",
  "completionTime": "string",
  "topCategory": "string"
}
```

### 4.2 Predictions

System prompt:
```text
Ты — AI-прогнозист для системы управления задачами. Анализируй тренды и предсказывай будущее поведение.

Правила:
- Основывайся на реальных данных (30 дней истории)
- Учитывай seasonality и паттерны
- Давай количественные прогнозы где возможно
- Предупреждай о рисках, но оставайся оптимистичным
- Каждое описание: 1-2 предложения

Возвращай JSON:
{
  "nextWeekForecast": "описание прогноза на неделю",
  "burnoutRisk": "оценка риска перегрузки",
  "dailyRecommendation": "рекомендация задач/день",
  "completionSpeed": "анализ скорости выполнения"
}
```

User prompt template:
```text
Построй прогнозы на основе данных:

ОБЩАЯ СТАТИСТИКА:
- Всего задач за 30 дней: ${analytics.totalTasks}
- В среднем в день: ${avgPerDay.toFixed(1)}
- Активных сейчас: ${analytics.activeTasks}
- Завершено: ${analytics.completedTasks}
- Скорость: ${analytics.completionRate}%

НЕДЕЛЬНЫЙ ТРЕНД:
${recentTrend.map((d) => `${d.date}: +${d.completed + d.active} задач`).join('\n') || '- Нет данных'}

НАГРУЗКА:
- Доля активных: ${activeShare}%
- Приоритет HIGH: ${(analytics.priorityDistribution || {}).high || 0} задач

На основе этих данных предскажи:
1. Сколько задач ожидается на следующую неделю
2. Есть ли риск перегрузки (burnout)
3. Оптимальное кол-во задач в день
4. Оценка текущей скорости выполнения

Верни JSON с прогнозами.
```

### 4.3 Life Wheel

System prompt:
```text
Ты — коуч по life balance. Помогаешь людям находить баланс между сферами жизни.
```

User prompt template:
```text
Проанализируй Колесо Баланса Жизни пользователя.

КАТЕГОРИИ И ОЦЕНКИ:
${wheelData.categories.map((category) => `- ${category.name}: ${category.score}/10`).join('\n')}

СТАТИСТИКА:
- Средний балл: ${wheelData.averageScore}/10
- Самая сильная сфера: ${wheelData.highestCategory.name} (${wheelData.highestCategory.score}/10)
- Требует внимания: ${wheelData.lowestCategory.name} (${wheelData.lowestCategory.score}/10)

Дай персональный анализ:
1. Краткая общая оценка баланса (1-2 предложения)
2. 3-4 конкретные рекомендации

Тон: дружелюбный, мотивирующий, конкретный.

Верни JSON:
{
  "summary": "общая оценка баланса",
  "recommendations": ["рекомендация 1", "рекомендация 2", "рекомендация 3"]
}
```

Caching:
- `INSIGHTS_CACHE_KEY = ai_insights_cache_v2`
- `PREDICTIONS_CACHE_KEY = ai_predictions_cache_v2`
- TTL = `3600000 ms`

Hash invalidation fields:
- `totalTasks`
- `activeTasks`
- `completedTasks`
- `completionRate`
- `peakProductivityHour`
- `peakProductivityDay`
- `avgCompletionTime`
- top 3 categories (`name`, `count`)
- `priorityDistribution`
- last 7 days trend (`date`, `completed`, `active`)

Additional client throttling:
- `MIN_AI_INTERVAL = 5 minutes` in `DataPage`

Fallback strategy:
- if no API key -> fallback text
- if API error -> fallback text
- if partial JSON -> merge with fallback defaults

## 5. Tools

Sources:
- [ToolsPage.jsx](/Users/mac/Downloads/mixed-dashboard-vite/src/components/Pages/ToolsPage.jsx)
- [LifeWheelTool.jsx](/Users/mac/Downloads/mixed-dashboard-vite/src/components/Tools/LifeWheelTool.jsx)

Tools tabs:
- `pomodoro`
- `wheel`

### 5.1 Pomodoro

Modes:
```json
{
  "work": { "defaultSeconds": 1500, "color": "#1d4ed8" },
  "shortBreak": { "defaultSeconds": 300, "color": "#0ea5e9" },
  "longBreak": { "defaultSeconds": 900, "color": "#0f766e" }
}
```

Persistence keys:
- `taskflow-pomodoro-mode-seconds`
- `taskflow-pomodoros`

Behavior:
1. User selects mode.
2. Current mode duration can be manually changed from `1` to `180` minutes.
3. Timer counts down every second.
4. When remaining time reaches zero:
   - timer stops
   - if mode is `work`, increment completed pomodoros
5. Reset restores current mode duration.

Quick stats formulas:
- `completedToday = count(updated today and status completed)`
- `activeToday = count(status active)`
- `focusTime = max(1, round((completedToday * 35) / 60))`

### 5.2 Life Wheel

Default categories:
- health
- career
- finance
- relationships
- personal_growth
- family
- leisure
- spirituality

Rules:
- initial score for each category = `5`
- max categories = `12`
- remove allowed only when total categories > `3`
- default categories are not removable

Canvas algorithm:
1. draw 10 concentric circles
2. draw radial dividers
3. draw one sector per category
4. `segmentRadius = (radius / 10) * score`
5. apply neon radial gradient and glow stroke
6. draw rotated category label outside circle

Metrics:
- `averageScore = avg(scores).toFixed(1)`
- `lowestCategory = min(score)`
- `highestCategory = max(score)`
- `variance = sum((score - avg)^2) / n`
- `balanceScore = max(0, 10 - sqrt(variance)).toFixed(1)`

## 6. Data Models

### 6.1 `users`
```sql
id TEXT PRIMARY KEY
email TEXT UNIQUE NOT NULL
password TEXT NOT NULL
first_name TEXT NOT NULL
last_name TEXT NOT NULL
created_at TEXT NOT NULL
last_login TEXT
profile_data TEXT
settings_data TEXT
```

### 6.2 `dashboard_items`
```sql
id TEXT PRIMARY KEY
user_id TEXT NOT NULL
text TEXT NOT NULL
status TEXT NOT NULL
priority TEXT
category TEXT
due_date TEXT
due_time TEXT
created_at TEXT NOT NULL
updated_at TEXT NOT NULL
```

### 6.3 `user_activities`
```sql
id INTEGER PRIMARY KEY AUTOINCREMENT
user_id TEXT NOT NULL
action TEXT NOT NULL
details TEXT
timestamp TEXT NOT NULL
```

Relationships:
- one user -> many tasks
- one user -> many activities

Frontend validation rules:
- register:
  - firstName required
  - lastName required
  - email required and regex valid
  - password min 6
  - confirmPassword must match
- task forms:
  - title required
  - title max 100 chars
  - dueTime requires dueDate

## 7. Authentication Flow

Sources:
- [AuthContext.jsx](/Users/mac/Downloads/mixed-dashboard-vite/src/context/AuthContext.jsx)
- [Login.jsx](/Users/mac/Downloads/mixed-dashboard-vite/src/components/Auth/Login.jsx)
- [Register.jsx](/Users/mac/Downloads/mixed-dashboard-vite/src/components/Auth/Register.jsx)
- [VerificationCode.jsx](/Users/mac/Downloads/mixed-dashboard-vite/src/components/Auth/VerificationCode.jsx)

Current implementation:
- no JWT
- no refresh token
- session stored in localStorage

Storage keys:
- `currentSession`
- `pendingVerification`
- `pendingRegistration`
- `pendingLoginUserId`

Session shape:
```json
{
  "user": {
    "id": "user-123",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "createdAt": "ISO String"
  },
  "expiresAt": "ISO String"
}
```

TTL:
- 24 hours

Verification flow:
- code generated client-side
- code stored locally with 60-second expiry
- 3 attempts max
- resend allowed after expiry or block

Register:
1. validate fields on frontend
2. save form to `pendingRegistration`
3. send email code
4. verify code locally
5. call `/register`
6. fetch `/user/<id>`
7. create session

Login:
1. call `/login`
2. store `pendingLoginUserId`
3. send email code
4. verify code locally
5. fetch `/user/<id>`
6. create session

Migration note:
- For production Flutter, move code generation and verification entirely to backend and issue secure tokens.

## 8. State Management

Sources:
- [DashboardContext.jsx](/Users/mac/Downloads/mixed-dashboard-vite/src/context/DashboardContext.jsx)
- [AuthContext.jsx](/Users/mac/Downloads/mixed-dashboard-vite/src/context/AuthContext.jsx)

React contexts:

### 8.1 AuthContext
State:
- `currentUser`
- `loading`
- `pendingVerification`

Actions:
- `initiateRegister`
- `completeRegister`
- `initiateLogin`
- `completeLogin`
- `resendCode`
- `logout`
- `updateUserProfile`
- `updateUserSettings`
- `getCurrentUserData`

### 8.2 DashboardDataContext
State:
- `items`
- `loading`
- `error`

Actions:
- `loadDashboardItems`
- `addItem`
- `updateItem`
- `deleteItem`
- `toggleStatus`
- `toggleLike`

### 8.3 DashboardUIContext
State:
- `filters`
- `sortBy`
- `isAddModalOpen`
- `isEditModalOpen`
- `editingItem`

Actions:
- `setFilters`
- `setSortBy`
- `openAddModal`
- `closeAddModal`
- `openEditModal`
- `closeEditModal`
- `resetFilters`

### 8.4 DashboardNotificationsContext
State:
- `notifications`

Actions:
- `removeNotification`
- `notifySuccess`
- `notifyError`
- `notifyInfo`

Performance measures:
- split contexts by responsibility
- actions wrapped in `useCallback`
- provider values wrapped in `useMemo`

Flutter mapping:
- `AuthContext -> AuthController`
- `DashboardDataContext -> TasksController`
- `DashboardUIContext -> DashboardUiController`
- `DashboardNotificationsContext -> NotificationsController`
