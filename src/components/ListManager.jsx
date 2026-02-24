import React, { useState } from 'react';
import '../styles/ListManager.css';

function ListManager() {
  const [items, setItems] = useState([]);
  const [inputValue, setInputValue] = useState('');

  const addItem = (e) => {
    e.preventDefault();
    if (inputValue.trim() !== '') {
      setItems([...items, { id: Date.now(), text: inputValue }]);
      setInputValue('');
    }
  };

  const removeItem = (id) => {
    setItems(items.filter(item => item.id !== id));
  };

  return (
    <div className="list-manager-container">
      <h3>Динамический список</h3>
      <form onSubmit={addItem} className="list-form">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Введите элемент..."
        />
        <button type="submit">Добавить</button>
      </form>
      <ul className="items-list">
        {items.map(item => (
          <li key={item.id} className="list-item">
            <span>{item.text}</span>
            <button onClick={() => removeItem(item.id)}>✕</button>
          </li>
        ))}
      </ul>
      {items.length === 0 && <p className="empty-message">Список пуст</p>}
    </div>
  );
}

export default ListManager;