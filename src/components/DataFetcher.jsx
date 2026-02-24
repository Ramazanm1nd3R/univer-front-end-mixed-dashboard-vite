import React, { useState, useEffect } from 'react';
import { fetchMockData } from '../utils/mockApi';
import '../styles/DataFetcher.css';

function DataFetcher() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const result = await fetchMockData();
        setData(result);
      } catch (err) {
        setError('Ошибка загрузки данных');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="data-fetcher-container">
        <h3>Загрузка данных</h3>
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="data-fetcher-container">
        <h3>Ошибка</h3>
        <p className="error-message">{error}</p>
      </div>
    );
  }

  return (
    <div className="data-fetcher-container">
      <h3>Загруженные данные</h3>
      <ul className="data-list">
        {data.map(item => (
          <li key={item.id} className="data-item">
            <span className="item-icon">📦</span>
            <span>{item.name}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default DataFetcher;