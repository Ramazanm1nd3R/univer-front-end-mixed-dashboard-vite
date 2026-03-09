import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './NotFoundPage.css';

function NotFoundPage() {
  const navigate = useNavigate();
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [stars, setStars] = useState([]);
  const [astronautFloat, setAstronautFloat] = useState({ x: 0, y: 0 });
  const [foundEasterEggs, setFoundEasterEggs] = useState([]);
  const [showSecret, setShowSecret] = useState(false);
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const animationFrameRef = useRef(0);
  const floatIntervalRef = useRef(0);

  useEffect(() => {
    document.body.classList.add('page-404');
    return () => document.body.classList.remove('page-404');
  }, []);

  useEffect(() => {
    const newStars = Array.from({ length: 150 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      opacity: Math.random() * 0.7 + 0.3,
      twinkleSpeed: Math.random() * 2 + 1,
    }));
    setStars(newStars);

    floatIntervalRef.current = window.setInterval(() => {
      setAstronautFloat({
        x: Math.sin(Date.now() / 1000) * 20,
        y: Math.cos(Date.now() / 1500) * 15,
      });
    }, 50);

    return () => {
      window.clearInterval(floatIntervalRef.current);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    const setupCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    setupCanvas();

    const animateParticles = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particlesRef.current = particlesRef.current.filter((particle) => particle.life > 0);
      particlesRef.current.forEach((particle) => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.life -= 2;
        particle.size *= 0.95;

        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${particle.color}, ${particle.life / 100})`;
        ctx.fill();
      });

      animationFrameRef.current = window.requestAnimationFrame(animateParticles);
    };

    animationFrameRef.current = window.requestAnimationFrame(animateParticles);
    window.addEventListener('resize', setupCanvas);

    return () => {
      window.cancelAnimationFrame(animationFrameRef.current);
      window.removeEventListener('resize', setupCanvas);
    };
  }, []);

  const createExplosion = useCallback((id) => {
    const element = document.getElementById(id);
    if (!element) return;

    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    for (let i = 0; i < 30; i += 1) {
      const angle = (Math.PI * 2 * i) / 30;
      particlesRef.current.push({
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * 5,
        vy: Math.sin(angle) * 5,
        size: Math.random() * 6 + 3,
        life: 100,
        color: '251, 191, 36',
      });
    }
  }, []);

  const handleEasterEgg = useCallback((id) => {
    setFoundEasterEggs((prev) => {
      if (prev.includes(id)) return prev;

      createExplosion(id);
      const updated = [...prev, id];
      if (updated.length === 3) {
        setShowSecret(true);
      }
      return updated;
    });
  }, [createExplosion]);

  const handleMouseMove = (e) => {
    setMousePos({ x: e.clientX, y: e.clientY });

    for (let i = 0; i < 3; i += 1) {
      particlesRef.current.push({
        x: e.clientX,
        y: e.clientY,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        size: Math.random() * 4 + 2,
        life: 100,
        color: ['59, 130, 246', '147, 51, 234', '236, 72, 153'][Math.floor(Math.random() * 3)],
      });
    }
  };

  const handleCopyReward = async () => {
    try {
      await navigator.clipboard.writeText('PRODUCTIVITY_MASTER_2025');
    } catch {
      // Ignore clipboard errors in unsupported contexts.
    }
  };

  return (
    <div className="not-found-page" onMouseMove={handleMouseMove}>
      <canvas ref={canvasRef} className="particle-canvas" />

      <div className="stars-container">
        {stars.map((star, index) => (
          <div
            key={`${star.x}-${star.y}-${index}`}
            className="star"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              opacity: star.opacity,
              animation: `twinkle ${star.twinkleSpeed}s infinite alternate`,
            }}
          />
        ))}
      </div>

      <div className="meteor meteor-1" />
      <div className="meteor meteor-2" />
      <div className="meteor meteor-3" />

      <button
        id="planet-1"
        className={`planet planet-blue ${foundEasterEggs.includes('planet-1') ? 'found' : ''}`}
        onClick={() => handleEasterEgg('planet-1')}
        title="Click me!"
        type="button"
      >
        🪐
      </button>
      <button
        id="planet-2"
        className={`planet planet-purple ${foundEasterEggs.includes('planet-2') ? 'found' : ''}`}
        onClick={() => handleEasterEgg('planet-2')}
        title="Click me!"
        type="button"
      >
        🌍
      </button>
      <button
        id="planet-3"
        className={`planet planet-pink ${foundEasterEggs.includes('planet-3') ? 'found' : ''}`}
        onClick={() => handleEasterEgg('planet-3')}
        title="Click me!"
        type="button"
      >
        🌙
      </button>

      <div className="content-404">
        <div className="error-code">
          <span className="digit digit-4-1" data-text="4">4</span>
          <span className="digit digit-0" data-text="0">
            <div
              className="astronaut"
              style={{
                transform: `translate(${astronautFloat.x}px, ${astronautFloat.y}px)`,
              }}
            >
              🧑‍🚀
            </div>
          </span>
          <span className="digit digit-4-2" data-text="4">4</span>
        </div>

        <h1 className="glitch-text" data-text="Task Not Found">
          Task Not Found
        </h1>

        <p className="error-description">
          <span className="typing-animation">
            Looks like this task drifted into deep space...
          </span>
        </p>

        <div className="action-buttons">
          <button
            className="btn-home"
            onClick={() => navigate('/')}
            type="button"
          >
            <span className="btn-icon">🏠</span>
            <span>Return to Dashboard</span>
            <span className="btn-glow" />
          </button>

          <button
            className="btn-back"
            onClick={() => navigate(-1)}
            type="button"
          >
            <span className="btn-icon">⬅️</span>
            <span>Go Back</span>
          </button>
        </div>

        <div className="easter-egg-hint">
          {foundEasterEggs.length === 0 && (
            <p className="hint-text">Hint: Click on the floating planets...</p>
          )}
          {foundEasterEggs.length > 0 && foundEasterEggs.length < 3 && (
            <p className="hint-text">
              Found {foundEasterEggs.length}/3 planets! Keep going...
            </p>
          )}
          {showSecret && (
            <div className="secret-message">
              <div className="secret-box">
                <h3>Secret Unlocked!</h3>
                <p>You found all the planets! Here is your reward:</p>
                <div className="reward-code">
                  <code>PRODUCTIVITY_MASTER_2025</code>
                </div>
                <button
                  className="btn-copy"
                  onClick={handleCopyReward}
                  type="button"
                >
                  Copy Code
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div
        className="floating-rocket"
        style={{
          left: `${mousePos.x}px`,
          top: `${mousePos.y}px`,
        }}
      >
        🚀
      </div>

      <div className="comet">☄️</div>
      <div className="satellite">🛰️</div>
    </div>
  );
}

export default NotFoundPage;
