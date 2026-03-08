import React, { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div style={{
      background: 'white',
      padding: '2rem',
      borderRadius: '20px',
      boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
      textAlign: 'center'
    }}>
      <h3 style={{ color: '#3b82f6', marginBottom: '1.5rem' }}>Счетчик</h3>
      <div style={{ fontSize: '4rem', fontWeight: 'bold', margin: '2rem 0' }}>{count}</div>
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
        <button onClick={() => setCount(Math.max(0, count - 1))} 
          style={{
            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
            color: 'white',
            border: 'none',
            padding: '1rem 2rem',
            borderRadius: '10px',
            fontSize: '1.5rem',
            cursor: 'pointer'
          }}>−</button>
        <button onClick={() => setCount(0)} 
          style={{
            background: '#fc8181',
            color: 'white',
            border: 'none',
            padding: '1rem 2rem',
            borderRadius: '10px',
            cursor: 'pointer'
          }}>Сброс</button>
        <button onClick={() => setCount(count + 1)} 
          style={{
            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
            color: 'white',
            border: 'none',
            padding: '1rem 2rem',
            borderRadius: '10px',
            fontSize: '1.5rem',
            cursor: 'pointer'
          }}>+</button>
      </div>
    </div>
  );
}

export default Counter;