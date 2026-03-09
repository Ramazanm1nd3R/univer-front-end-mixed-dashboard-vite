import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { generateWheelAnalysis } from '../../services/openai';
import './LifeWheelTool.css';

const DEFAULT_CATEGORIES = [
  { id: 'health', name: 'Здоровье', color: '#10b981' },
  { id: 'career', name: 'Карьера', color: '#3b82f6' },
  { id: 'finance', name: 'Финансы', color: '#f59e0b' },
  { id: 'relationships', name: 'Отношения', color: '#ec4899' },
  { id: 'personal_growth', name: 'Саморазвитие', color: '#8b5cf6' },
  { id: 'family', name: 'Семья', color: '#06b6d4' },
  { id: 'leisure', name: 'Досуг', color: '#84cc16' },
  { id: 'spirituality', name: 'Духовность', color: '#a855f7' },
];

const DEFAULT_CATEGORY_IDS = new Set(DEFAULT_CATEGORIES.map((category) => category.id));

const NEON_COLORS = [
  '#10b981',
  '#3b82f6',
  '#f59e0b',
  '#ec4899',
  '#8b5cf6',
  '#06b6d4',
  '#84cc16',
  '#a855f7',
  '#f43f5e',
  '#14b8a6',
  '#eab308',
  '#6366f1',
];

function randomNeonColor() {
  return NEON_COLORS[Math.floor(Math.random() * NEON_COLORS.length)];
}

function toRgba(hex, alpha) {
  const normalized = hex.replace('#', '');
  const value = normalized.length === 3
    ? normalized.split('').map((char) => char + char).join('')
    : normalized;
  const r = Number.parseInt(value.slice(0, 2), 16);
  const g = Number.parseInt(value.slice(2, 4), 16);
  const b = Number.parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function LifeWheelTool({ userCategories = [] }) {
  const canvasRef = useRef(null);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [scores, setScores] = useState({});
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    setScores((previous) => {
      const next = {};
      categories.forEach((category) => {
        next[category.id] = previous[category.id] ?? 5;
      });
      return next;
    });
  }, [categories]);

  useEffect(() => {
    if (!userCategories.length) return;

    setCategories((previous) => {
      let changed = false;
      const existingNames = new Set(previous.map((category) => category.name.toLowerCase()));
      const next = [...previous];

      userCategories.forEach((categoryName) => {
        const normalizedName = String(categoryName || '').trim();
        if (!normalizedName) return;
        if (existingNames.has(normalizedName.toLowerCase())) return;

        changed = true;
        existingNames.add(normalizedName.toLowerCase());
        next.push({
          id: `user_${normalizedName.toLowerCase().replace(/\s+/g, '_')}`,
          name: normalizedName,
          color: randomNeonColor(),
        });
      });

      return changed ? next.slice(0, 12) : previous;
    });
  }, [userCategories]);

  const calculateAverage = useCallback(() => {
    const values = Object.values(scores);
    if (!values.length) return '0.0';
    return (values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(1);
  }, [scores]);

  const lowestCategory = useMemo(() => {
    if (!categories.length) return { name: '—', score: 0 };
    return categories.reduce((lowest, category) => {
      const score = scores[category.id] ?? 0;
      if (score < lowest.score) return { name: category.name, score };
      return lowest;
    }, { name: categories[0].name, score: scores[categories[0].id] ?? 0 });
  }, [categories, scores]);

  const highestCategory = useMemo(() => {
    if (!categories.length) return { name: '—', score: 0 };
    return categories.reduce((highest, category) => {
      const score = scores[category.id] ?? 0;
      if (score > highest.score) return { name: category.name, score };
      return highest;
    }, { name: categories[0].name, score: scores[categories[0].id] ?? 0 });
  }, [categories, scores]);

  const getBalanceScore = useCallback(() => {
    if (!categories.length) return '0.0';

    const avg = Number.parseFloat(calculateAverage());
    const variance = categories.reduce((sum, category) => {
      const score = scores[category.id] ?? 0;
      return sum + (score - avg) ** 2;
    }, 0) / categories.length;
    const stdDev = Math.sqrt(variance);
    return Math.max(0, 10 - stdDev).toFixed(1);
  }, [calculateAverage, categories, scores]);

  const drawWheel = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !categories.length) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(centerX, centerY) - 42;
    const segmentAngle = (2 * Math.PI) / categories.length;

    ctx.clearRect(0, 0, width, height);

    ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
    ctx.lineWidth = 1;
    for (let i = 1; i <= 10; i += 1) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, (radius / 10) * i, 0, 2 * Math.PI);
      ctx.stroke();
    }

    categories.forEach((_, index) => {
      const angle = segmentAngle * index - Math.PI / 2;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(
        centerX + radius * Math.cos(angle),
        centerY + radius * Math.sin(angle),
      );
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)';
      ctx.stroke();
    });

    categories.forEach((category, index) => {
      const score = scores[category.id] ?? 0;
      const startAngle = segmentAngle * index - Math.PI / 2;
      const endAngle = startAngle + segmentAngle;
      const segmentRadius = (radius / 10) * score;

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, segmentRadius, startAngle, endAngle);
      ctx.closePath();

      const gradient = ctx.createRadialGradient(
        centerX,
        centerY,
        0,
        centerX,
        centerY,
        segmentRadius || 1,
      );
      gradient.addColorStop(0, toRgba(category.color, 0.2));
      gradient.addColorStop(1, toRgba(category.color, 0.85));

      ctx.fillStyle = gradient;
      ctx.fill();

      ctx.strokeStyle = category.color;
      ctx.lineWidth = 2;
      ctx.shadowBlur = 12;
      ctx.shadowColor = category.color;
      ctx.stroke();
      ctx.shadowBlur = 0;

      const labelAngle = startAngle + segmentAngle / 2;
      const labelRadius = radius + 24;
      const labelX = centerX + labelRadius * Math.cos(labelAngle);
      const labelY = centerY + labelRadius * Math.sin(labelAngle);

      ctx.save();
      ctx.translate(labelX, labelY);
      ctx.rotate(labelAngle + Math.PI / 2);
      ctx.fillStyle = category.color;
      ctx.font = 'bold 11px "Space Grotesk", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(category.name, 0, 0);
      ctx.restore();
    });
  }, [categories, scores]);

  useEffect(() => {
    drawWheel();
  }, [drawWheel]);

  const handleScoreChange = (categoryId, value) => {
    setScores((previous) => ({ ...previous, [categoryId]: Number.parseInt(value, 10) }));
  };

  const handleAddCategory = () => {
    const trimmed = newCategoryName.trim();
    if (!trimmed || categories.length >= 12) return;

    const exists = categories.some((category) => category.name.toLowerCase() === trimmed.toLowerCase());
    if (exists) {
      setNewCategoryName('');
      setIsAddingCategory(false);
      return;
    }

    setCategories((previous) => ([
      ...previous,
      {
        id: `custom_${Date.now()}`,
        name: trimmed,
        color: randomNeonColor(),
      },
    ]));
    setNewCategoryName('');
    setIsAddingCategory(false);
  };

  const handleRemoveCategory = (categoryId) => {
    if (categories.length <= 3) return;

    setCategories((previous) => previous.filter((category) => category.id !== categoryId));
    setScores((previous) => {
      const next = { ...previous };
      delete next[categoryId];
      return next;
    });
  };

  const handleAnalyzeWithAI = async () => {
    setIsAnalyzing(true);
    try {
      const payload = {
        categories: categories.map((category) => ({
          name: category.name,
          score: scores[category.id] ?? 0,
        })),
        averageScore: calculateAverage(),
        lowestCategory,
        highestCategory,
      };

      const analysis = await generateWheelAnalysis(payload);
      setAiAnalysis(analysis);
    } catch (error) {
      console.error('AI Wheel Analysis error:', error);
      setAiAnalysis({
        summary: 'Не удалось получить AI анализ. Попробуйте позже.',
        recommendations: [],
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="life-wheel-tool">
      <div className="wheel-header">
        <h3>🎯 Колесо Баланса Жизни</h3>
        <p className="wheel-subtitle">Оцените каждую сферу от 0 до 10</p>
      </div>

      <div className="wheel-content">
        <div className="wheel-canvas-container">
          <canvas ref={canvasRef} width={500} height={500} className="wheel-canvas" />

          <div className="wheel-center-stats">
            <div className="center-stat">
              <span className="center-stat-value">{calculateAverage()}</span>
              <span className="center-stat-label">Среднее</span>
            </div>
            <div className="center-stat">
              <span className="center-stat-value">{getBalanceScore()}</span>
              <span className="center-stat-label">Баланс</span>
            </div>
          </div>
        </div>

        <div className="wheel-controls">
          <div className="wheel-sliders">
            {categories.map((category) => (
              <div key={category.id} className="wheel-slider-group">
                <div className="slider-header">
                  <span className="slider-label" style={{ color: category.color }}>
                    {category.name}
                  </span>
                  <span className="slider-value">{scores[category.id] ?? 0}/10</span>
                  {!DEFAULT_CATEGORY_IDS.has(category.id) && (
                    <button
                      className="btn-remove-category"
                      onClick={() => handleRemoveCategory(category.id)}
                      title="Удалить категорию"
                      type="button"
                    >
                      ×
                    </button>
                  )}
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={scores[category.id] ?? 0}
                  onChange={(event) => handleScoreChange(category.id, event.target.value)}
                  className="wheel-slider"
                  style={{ '--slider-color': category.color }}
                />
              </div>
            ))}
          </div>

          {categories.length < 12 && (
            <div className="add-category-section">
              {!isAddingCategory ? (
                <button
                  className="btn-add-category"
                  onClick={() => setIsAddingCategory(true)}
                  type="button"
                >
                  ➕ Добавить категорию
                </button>
              ) : (
                <div className="add-category-form">
                  <input
                    type="text"
                    placeholder="Название категории"
                    value={newCategoryName}
                    onChange={(event) => setNewCategoryName(event.target.value)}
                    onKeyDown={(event) => event.key === 'Enter' && handleAddCategory()}
                    className="category-input"
                    maxLength={20}
                  />
                  <button className="btn-save-category" onClick={handleAddCategory} type="button">✓</button>
                  <button
                    className="btn-cancel-category"
                    onClick={() => {
                      setIsAddingCategory(false);
                      setNewCategoryName('');
                    }}
                    type="button"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="wheel-analysis-section">
            <button
              className="btn-analyze-ai"
              onClick={handleAnalyzeWithAI}
              disabled={isAnalyzing}
              type="button"
            >
              {isAnalyzing ? '⏳ Анализирую...' : '✨ AI Анализ Баланса'}
            </button>

            {aiAnalysis && (
              <div className="ai-analysis-result">
                <h4>🧠 AI Рекомендации:</h4>
                <p className="analysis-summary">{aiAnalysis.summary}</p>

                {(aiAnalysis.recommendations || []).length > 0 && (
                  <div className="recommendations-list">
                    {aiAnalysis.recommendations.map((recommendation, index) => (
                      <div key={`${recommendation}-${index}`} className="recommendation-item">
                        <span className="rec-icon">💡</span>
                        <span>{recommendation}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="wheel-quick-stats">
            <div className="quick-stat-item">
              <span className="stat-emoji">📈</span>
              <div>
                <span className="stat-label">Сильная сторона:</span>
                <span className="stat-value">{highestCategory.name}</span>
              </div>
            </div>
            <div className="quick-stat-item">
              <span className="stat-emoji">📉</span>
              <div>
                <span className="stat-label">Требует внимания:</span>
                <span className="stat-value">{lowestCategory.name}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LifeWheelTool;
