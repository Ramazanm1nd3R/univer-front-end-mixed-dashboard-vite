const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || '';
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const MODEL = 'gpt-4o-mini';

const INSIGHTS_CACHE_PREFIX = 'ai_insights_cache';
const PREDICTIONS_CACHE_PREFIX = 'ai_predictions_cache';
const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hour

function parseJsonSafely(text, fallbackValue) {
  try {
    return JSON.parse(text);
  } catch {
    return fallbackValue;
  }
}

function getCacheKey(prefix, analytics) {
  const userScope = `${analytics.totalTasks}-${analytics.activeTasks}-${analytics.completedTasks}-${analytics.completionRate}`;
  return `${prefix}:${userScope}`;
}

function getCachedData(key) {
  const raw = localStorage.getItem(key);
  if (!raw) return null;

  const parsed = parseJsonSafely(raw, null);
  if (!parsed?.timestamp || !parsed?.data) return null;

  if (Date.now() - parsed.timestamp > CACHE_DURATION_MS) {
    localStorage.removeItem(key);
    return null;
  }

  return parsed.data;
}

function setCachedData(key, data) {
  localStorage.setItem(key, JSON.stringify({ data, timestamp: Date.now() }));
}

async function callOpenAI({ systemPrompt, userPrompt, maxTokens = 800, temperature = 0.7 }) {
  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature,
      max_tokens: maxTokens,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error?.error?.message || `OpenAI request failed: ${response.status}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('Empty response from OpenAI');
  }

  return parseJsonSafely(content, null);
}

const SYSTEM_PROMPT = `Ты — персональный аналитик продуктивности. Анализируй данные о задачах пользователя и генерируй полезные инсайты.

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
}`;

const PREDICTIONS_SYSTEM_PROMPT = `Ты — AI-прогнозист для системы управления задачами. Анализируй тренды и предсказывай будущее поведение.

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
}`;

function buildInsightsPrompt(analytics) {
  return `Проанализируй данные пользователя:

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

Сгенерируй 4 персонализированных инсайта в JSON формате.`;
}

function buildPredictionsPrompt(analytics) {
  const recentTrend = (analytics.last30Days || []).slice(-7);
  const avgPerDay = analytics.totalTasks > 0 ? analytics.totalTasks / 30 : 0;
  const activeShare = analytics.totalTasks > 0
    ? Math.round((analytics.activeTasks / analytics.totalTasks) * 100)
    : 0;

  return `Построй прогнозы на основе данных:

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

Верни JSON с прогнозами.`;
}

function getFallbackInsights(analytics) {
  const { peakProductivityHour, peakProductivityDay, avgCompletionTime, topCategories } = analytics;
  const topCat = topCategories?.[0];

  return {
    productivity: `Больше всего задач создаётся в ${peakProductivityHour}:00. Планируй важное на это время.`,
    bestDay: `Самый активный день — ${peakProductivityDay}. Именно тогда ты наиболее продуктивен.`,
    completionTime: `Среднее время закрытия задачи: ${avgCompletionTime}.${avgCompletionTime === 'N/A' ? ' Заверши задачи чтобы увидеть метрику.' : ' Отличный темп!'}`,
    topCategory: topCat
      ? `«${topCat.name}» занимает ${topCat.percentage}% задач (${topCat.count} шт).`
      : 'Добавь задачи с категориями.',
  };
}

function getFallbackPredictions(analytics) {
  const { totalTasks, activeTasks, completionRate } = analytics;
  const nextWeekEst = Math.max(1, Math.round((totalTasks / 30) * 7));
  const burnoutRisk = activeTasks > totalTasks * 0.7 ? 'high' : activeTasks > totalTasks * 0.4 ? 'medium' : 'low';
  const recommended = Math.max(1, Math.round(nextWeekEst / 7));

  return {
    nextWeekForecast: `Ожидаемое кол-во задач на следующую неделю на основе текущего темпа: ~${nextWeekEst} задач.`,
    burnoutRisk: burnoutRisk === 'high'
      ? 'Слишком много незакрытых задач. Постарайся завершить часть из них.'
      : burnoutRisk === 'medium'
      ? 'Умеренная нагрузка. Следи за балансом.'
      : 'Нагрузка в норме. Отличный ритм!',
    dailyRecommendation: `Рекомендуемое количество задач в день: ~${recommended} задач.`,
    completionSpeed: completionRate >= 70
      ? 'Превосходный результат! Продолжай в том же духе.'
      : completionRate >= 40
      ? 'Хороший результат. Есть куда расти.'
      : 'Попробуй разбивать задачи на маленькие шаги.',
  };
}

function isOpenAIAvailable() {
  return Boolean(OPENAI_API_KEY);
}

export async function generateInsights(analytics) {
  const fallback = getFallbackInsights(analytics);
  const cacheKey = getCacheKey(INSIGHTS_CACHE_PREFIX, analytics);

  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  if (!isOpenAIAvailable()) {
    console.warn('⚠️ OpenAI API key не настроен, используем fallback.');
    return fallback;
  }

  try {
    const insights = await callOpenAI({
      systemPrompt: SYSTEM_PROMPT,
      userPrompt: buildInsightsPrompt(analytics),
      maxTokens: 800,
      temperature: 0.7,
    });

    const normalized = {
      productivity: insights?.productivity || fallback.productivity,
      bestDay: insights?.bestDay || fallback.bestDay,
      completionTime: insights?.completionTime || fallback.completionTime,
      topCategory: insights?.topCategory || fallback.topCategory,
    };

    setCachedData(cacheKey, normalized);
    return normalized;
  } catch (error) {
    console.error('❌ Ошибка генерации AI инсайтов:', error);
    return fallback;
  }
}

export async function generatePredictions(analytics) {
  const fallback = getFallbackPredictions(analytics);
  const cacheKey = getCacheKey(PREDICTIONS_CACHE_PREFIX, analytics);

  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  if (!isOpenAIAvailable()) {
    console.warn('⚠️ OpenAI API key не настроен, используем fallback.');
    return fallback;
  }

  try {
    const predictions = await callOpenAI({
      systemPrompt: PREDICTIONS_SYSTEM_PROMPT,
      userPrompt: buildPredictionsPrompt(analytics),
      maxTokens: 600,
      temperature: 0.6,
    });

    const normalized = {
      nextWeekForecast: predictions?.nextWeekForecast || fallback.nextWeekForecast,
      burnoutRisk: predictions?.burnoutRisk || fallback.burnoutRisk,
      dailyRecommendation: predictions?.dailyRecommendation || fallback.dailyRecommendation,
      completionSpeed: predictions?.completionSpeed || fallback.completionSpeed,
    };

    setCachedData(cacheKey, normalized);
    return normalized;
  } catch (error) {
    console.error('❌ Ошибка генерации AI прогнозов:', error);
    return fallback;
  }
}

export default {
  generateInsights,
  generatePredictions,
};
