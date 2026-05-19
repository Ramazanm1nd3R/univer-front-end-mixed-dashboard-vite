const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || '';
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const MODEL = 'gpt-4o-mini';

const INSIGHTS_CACHE_KEY = 'ai_insights_cache_v2';
const PREDICTIONS_CACHE_KEY = 'ai_predictions_cache_v2';
const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hour

function parseJsonSafely(text, fallbackValue) {
  try {
    return JSON.parse(text);
  } catch {
    return fallbackValue;
  }
}

function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash &= hash;
  }
  return hash.toString(36);
}

function generateDataHash(analytics) {
  const keyData = {
    totalTasks: analytics.totalTasks,
    activeTasks: analytics.activeTasks,
    completedTasks: analytics.completedTasks,
    completionRate: analytics.completionRate,
    assignmentPeakHour: analytics.assignmentPeakHour,
    assignmentPeakDay: analytics.assignmentPeakDay,
    duePeakHour: analytics.duePeakHour,
    duePeakDay: analytics.duePeakDay,
    scheduledTasks: analytics.scheduledTasks,
    explicitScheduledTasks: analytics.explicitScheduledTasks,
    inferredScheduledTasks: analytics.inferredScheduledTasks,
    unscheduledTasks: analytics.unscheduledTasks,
    scheduleCoverageRate: analytics.scheduleCoverageRate,
    plannedCompletionRate: analytics.plannedCompletionRate,
    overdueTasks: analytics.overdueTasks,
    upcomingTasks7Days: analytics.upcomingTasks7Days,
    topCategories: (analytics.topCategories || [])
      .slice(0, 3)
      .map((category) => ({ name: category.name, count: category.count })),
    priorityDistribution: analytics.priorityDistribution || {},
    recentTrend: (analytics.last30Days || [])
      .slice(-7)
      .map((day) => ({ date: day.date, completed: day.completed, active: day.active })),
  };

  return simpleHash(JSON.stringify(keyData));
}

function getCachedInsightsWithHash(dataHash) {
  const raw = localStorage.getItem(INSIGHTS_CACHE_KEY);
  if (!raw) return null;

  const parsed = parseJsonSafely(raw, null);
  if (
    !parsed?.dataHash ||
    parsed.dataHash !== dataHash ||
    !parsed?.timestamp ||
    Date.now() - parsed.timestamp > CACHE_DURATION_MS
  ) {
    localStorage.removeItem(INSIGHTS_CACHE_KEY);
    return null;
  }

  console.log('✅ AI Insights: данные не изменились, используем кэш (экономия $0.0002)');
  return parsed.data;
}

function setCachedInsightsWithHash(data, dataHash) {
  localStorage.setItem(INSIGHTS_CACHE_KEY, JSON.stringify({
    data,
    dataHash,
    timestamp: Date.now(),
  }));
}

function getCachedPredictionsWithHash(dataHash) {
  const raw = localStorage.getItem(PREDICTIONS_CACHE_KEY);
  if (!raw) return null;

  const parsed = parseJsonSafely(raw, null);
  if (
    !parsed?.dataHash ||
    parsed.dataHash !== dataHash ||
    !parsed?.timestamp ||
    Date.now() - parsed.timestamp > CACHE_DURATION_MS
  ) {
    localStorage.removeItem(PREDICTIONS_CACHE_KEY);
    return null;
  }

  console.log('✅ AI Predictions: данные не изменились, используем кэш (экономия $0.00015)');
  return parsed.data;
}

function setCachedPredictionsWithHash(data, dataHash) {
  localStorage.setItem(PREDICTIONS_CACHE_KEY, JSON.stringify({
    data,
    dataHash,
    timestamp: Date.now(),
  }));
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
- Не выдавай предположение за точный факт
- Длина каждого инсайта: 1-2 предложения (максимум 150 символов)

Возвращай JSON строго в формате:
{
  "productivity": "текст о времени назначения задач",
  "bestDay": "текст о дне и часе с наибольшей плановой нагрузкой",
  "completionTime": "текст о планировании, сроках и статусах",
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
  "completionSpeed": "анализ выполнения задач по плану"
}`;

function buildInsightsPrompt(analytics) {
  return `Проанализируй данные пользователя:

СТАТИСТИКА:
- Всего задач: ${analytics.totalTasks}
- Активных: ${analytics.activeTasks}
- Завершено: ${analytics.completedTasks}
- Выполнено всего: ${analytics.completionRate}%
- Задач со сроком: ${analytics.scheduledTasks}
- Из них с явным сроком: ${analytics.explicitScheduledTasks}
- Восстановлено автоматически из legacy-данных: ${analytics.inferredScheduledTasks}
- Без срока: ${analytics.unscheduledTasks}
- Покрытие сроками: ${analytics.scheduleCoverageRate}%
- Выполнено среди задач со сроком: ${analytics.plannedCompletionRate}%
- Просрочено активных задач: ${analytics.overdueTasks}
- Назначают чаще всего в ${analytics.assignmentPeakHour}:00
- Больше всего задач стоит на ${analytics.duePeakDay} в ${analytics.duePeakHour}:00

КАТЕГОРИИ (топ-3):
${(analytics.topCategories || []).slice(0, 3).map((c) => `- ${c.name}: ${c.count} задач (${c.percentage}%)`).join('\n') || '- Нет данных'}

ПРИОРИТЕТЫ:
${Object.entries(analytics.priorityDistribution || {}).map(([p, count]) => `- ${p}: ${count} задач`).join('\n') || '- Нет данных'}

ТРЕНД (последние 7 дней):
${(analytics.last30Days || []).slice(-7).map((d) => `${d.date}: ${d.completed} завершено в задачах этого срока, ${d.active} еще активных на этот срок`).join('\n') || '- Нет данных'}

Сделай акцент на планировании: когда задачи назначаются, на какие дни/часы они ставятся и как их текущий статус влияет на нагрузку. Не делай главным сигналом фактическое время закрытия.
Если часть сроков восстановлена автоматически из старых данных, прямо учитывай это и не называй их полностью точными дедлайнами пользователя.

Сгенерируй 4 персонализированных инсайта в JSON формате.`;
}

function buildPredictionsPrompt(analytics) {
  const recentTrend = (analytics.last30Days || []).slice(-7);
  const avgPerDay = analytics.scheduledTasks > 0 ? analytics.scheduledTasks / 30 : 0;
  const activeShare = analytics.totalTasks > 0
    ? Math.round((analytics.activeTasks / analytics.totalTasks) * 100)
    : 0;

  return `Построй прогнозы на основе данных:

ОБЩАЯ СТАТИСТИКА:
- Задач со сроком за период: ${analytics.scheduledTasks}
- Из них с явным сроком: ${analytics.explicitScheduledTasks}
- Восстановлено автоматически: ${analytics.inferredScheduledTasks}
- В среднем задач со сроком в день: ${avgPerDay.toFixed(1)}
- Активных сейчас: ${analytics.activeTasks}
- Завершено: ${analytics.completedTasks}
- Выполнено всего: ${analytics.completionRate}%
- Выполнено среди задач со сроком: ${analytics.plannedCompletionRate}%
- Просрочено активных: ${analytics.overdueTasks}
- В ближайшие 7 дней запланировано: ${analytics.upcomingTasks7Days}

НЕДЕЛЬНЫЙ ТРЕНД:
${recentTrend.map((d) => `${d.date}: ${d.completed + d.active} задач стоит на этот день, из них ${d.completed} завершено`).join('\n') || '- Нет данных'}

НАГРУЗКА:
- Доля активных: ${activeShare}%
- Приоритет HIGH: ${(analytics.priorityDistribution || {}).high || 0} задач
- Пиковый день по срокам: ${analytics.duePeakDay}
- Пиковый час по срокам: ${analytics.duePeakHour}:00

На основе этих данных предскажи:
1. Какую плановую нагрузку ждать на следующую неделю
2. Есть ли риск перегрузки (burnout)
3. Оптимальное кол-во задач в день с учетом текущей плотности сроков
4. Оценку того, насколько пользователь успевает закрывать запланированные задачи

Верни JSON с прогнозами.`;
}

function getFallbackInsights(analytics) {
  const {
    assignmentPeakHour,
    duePeakDay,
    duePeakHour,
    scheduleCoverageRate,
    plannedCompletionRate,
    overdueTasks,
    inferredScheduledTasks,
    topCategories,
  } = analytics;
  const topCat = topCategories?.[0];
  const inferredNote = inferredScheduledTasks > 0
    ? ` Часть сроков восстановлена автоматически из старых задач (${inferredScheduledTasks}).`
    : '';

  return {
    productivity: `Чаще всего задачи назначаются около ${assignmentPeakHour}:00. Это твое главное окно планирования.`,
    bestDay: `Самая плотная точка по срокам сейчас — ${duePeakDay} в ${duePeakHour}:00.`,
    completionTime: `Сроки стоят у ${scheduleCoverageRate}% задач, выполнено среди них ${plannedCompletionRate}%. Просроченных активных: ${overdueTasks}.${inferredNote}`,
    topCategory: topCat
      ? `«${topCat.name}» занимает ${topCat.percentage}% задач (${topCat.count} шт).`
      : 'Добавь задачи с категориями.',
  };
}

function getFallbackPredictions(analytics) {
  const { totalTasks, activeTasks, plannedCompletionRate, overdueTasks, upcomingTasks7Days, scheduledTasks } = analytics;
  const nextWeekEst = Math.max(1, upcomingTasks7Days || Math.round(((scheduledTasks || totalTasks) / 30) * 7));
  const burnoutRisk = activeTasks > totalTasks * 0.7 ? 'high' : activeTasks > totalTasks * 0.4 ? 'medium' : 'low';
  const recommended = Math.max(1, Math.round(nextWeekEst / 7));

  return {
    nextWeekForecast: `На ближайшие 7 дней уже видна плановая нагрузка примерно в ${nextWeekEst} задач.`,
    burnoutRisk: overdueTasks > 0
      ? `Есть ${overdueTasks} просроченных активных задач, это повышает риск перегрузки.`
      : burnoutRisk === 'high'
      ? 'Слишком много незакрытых задач. Постарайся разгрузить ближайшие сроки.'
      : burnoutRisk === 'medium'
      ? 'Нагрузка умеренная, но следи за плотными днями по срокам.'
      : 'Нагрузка в норме. Отличный ритм!',
    dailyRecommendation: `Оптимально держать около ${recommended} задач со сроком в день.`,
    completionSpeed: plannedCompletionRate >= 70
      ? 'Большая часть задач со сроком уже доводится до нужного статуса.'
      : plannedCompletionRate >= 40
      ? 'Темп средний: часть плановых задач стоит выравнивать по дням.'
      : 'План перегружен: лучше ставить меньше дедлайнов на один день.',
  };
}

function isOpenAIAvailable() {
  return Boolean(OPENAI_API_KEY);
}

function getFallbackWheelAnalysis(wheelData) {
  const average = Number.parseFloat(wheelData.averageScore || 0);
  let summary = '';

  if (average >= 7) {
    summary = `Отличный баланс! Средний балл ${average}/10 показывает гармоничное распределение внимания между сферами.`;
  } else if (average >= 5) {
    summary = `Хорошая база (${average}/10), но видно точки роста. Начни с усиления сферы "${wheelData.lowestCategory.name}".`;
  } else {
    summary = `Сейчас баланс проседает (${average}/10). Первый шаг: подними "${wheelData.lowestCategory.name}" хотя бы на 1-2 балла за неделю.`;
  }

  return {
    summary,
    recommendations: [
      `Ежедневно выделяй минимум 30 минут на сферу "${wheelData.lowestCategory.name}".`,
      `Опирайся на сильную сферу "${wheelData.highestCategory.name}", чтобы поддержать остальные направления.`,
      'Ставь короткие недельные цели по 2-3 приоритетным сферам и фиксируй прогресс раз в день.',
    ],
  };
}

export async function generateWheelAnalysis(wheelData) {
  const fallback = getFallbackWheelAnalysis(wheelData);

  if (!isOpenAIAvailable()) {
    return fallback;
  }

  try {
    const prompt = `Проанализируй Колесо Баланса Жизни пользователя.

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
}`;

    const response = await callOpenAI({
      systemPrompt: 'Ты — коуч по life balance. Помогаешь людям находить баланс между сферами жизни.',
      userPrompt: prompt,
      maxTokens: 500,
      temperature: 0.7,
    });

    return {
      summary: response?.summary || fallback.summary,
      recommendations: Array.isArray(response?.recommendations) && response.recommendations.length > 0
        ? response.recommendations
        : fallback.recommendations,
    };
  } catch (error) {
    console.error('AI Wheel Analysis error:', error);
    return fallback;
  }
}

export async function generateInsights(analytics) {
  const fallback = getFallbackInsights(analytics);
  const dataHash = generateDataHash(analytics);

  const cached = getCachedInsightsWithHash(dataHash);
  if (cached) return cached;

  if (!isOpenAIAvailable()) {
    console.warn('⚠️ OpenAI API key не настроен, используем fallback.');
    return fallback;
  }

  try {
    console.log(`🤖 Генерируем новые AI Insights (hash: ${dataHash})`);
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

    setCachedInsightsWithHash(normalized, dataHash);
    return normalized;
  } catch (error) {
    console.error('❌ Ошибка генерации AI инсайтов:', error);
    return fallback;
  }
}

export async function generatePredictions(analytics) {
  const fallback = getFallbackPredictions(analytics);
  const dataHash = generateDataHash(analytics);

  const cached = getCachedPredictionsWithHash(dataHash);
  if (cached) return cached;

  if (!isOpenAIAvailable()) {
    console.warn('⚠️ OpenAI API key не настроен, используем fallback.');
    return fallback;
  }

  try {
    console.log(`🤖 Генерируем новые AI Predictions (hash: ${dataHash})`);
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

    setCachedPredictionsWithHash(normalized, dataHash);
    return normalized;
  } catch (error) {
    console.error('❌ Ошибка генерации AI прогнозов:', error);
    return fallback;
  }
}

export default {
  generateInsights,
  generatePredictions,
  generateWheelAnalysis,
};
