export const fetchMockData = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const mockData = [
        { id: 1, name: 'Элемент 1', value: 100 },
        { id: 2, name: 'Элемент 2', value: 200 },
        { id: 3, name: 'Элемент 3', value: 150 },
        { id: 4, name: 'Элемент 4', value: 300 },
        { id: 5, name: 'Элемент 5', value: 250 }
      ];
      resolve(mockData);
    }, 2000); // Имитация задержки 2 секунды
  });
};