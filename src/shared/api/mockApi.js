import { initialDashboardData } from '@shared/config/mixedDashboardSeed';

const STORAGE_KEY = 'mixed-dashboard-db-v1';
const NETWORK_DELAY = 240;

function delay(ms = NETWORK_DELAY) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function createId(prefix) {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function readStore() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return clone(initialDashboardData);
  }

  try {
    const parsed = JSON.parse(raw);
    return {
      tasks: Array.isArray(parsed.tasks) ? parsed.tasks : [],
      recipes: Array.isArray(parsed.recipes) ? parsed.recipes : [],
      movies: Array.isArray(parsed.movies) ? parsed.movies : [],
    };
  } catch {
    return clone(initialDashboardData);
  }
}

function writeStore(store) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  return clone(store);
}

function normalizeCollection(type) {
  if (!['tasks', 'recipes', 'movies'].includes(type)) {
    throw new Error(`Unknown entity type: ${type}`);
  }
}

function withTimestamps(item, previous = null) {
  const now = new Date().toISOString();
  return {
    ...item,
    createdAt: previous?.createdAt || item.createdAt || now,
    updatedAt: now,
  };
}

const mockApi = {
  async getAllData() {
    await delay();
    return { success: true, data: readStore() };
  },

  async getCollection(type) {
    normalizeCollection(type);
    await delay();
    const store = readStore();
    return { success: true, data: clone(store[type]) };
  },

  async createItem(type, item) {
    normalizeCollection(type);
    await delay();

    const store = readStore();
    const nextItem = withTimestamps({ id: createId(type.slice(0, -1)), ...clone(item) });
    store[type] = [nextItem, ...store[type]];
    writeStore(store);

    return { success: true, item: nextItem, data: clone(store) };
  },

  async updateItem(type, id, item) {
    normalizeCollection(type);
    await delay();

    const store = readStore();
    const index = store[type].findIndex((entry) => entry.id === id);
    if (index === -1) {
      return { success: false, error: 'Item not found' };
    }

    const previous = store[type][index];
    const nextItem = withTimestamps({ ...previous, ...clone(item), id }, previous);
    store[type][index] = nextItem;
    writeStore(store);

    return { success: true, item: nextItem, data: clone(store) };
  },

  async deleteItem(type, id) {
    normalizeCollection(type);
    await delay();

    const store = readStore();
    const nextCollection = store[type].filter((entry) => entry.id !== id);

    if (nextCollection.length === store[type].length) {
      return { success: false, error: 'Item not found' };
    }

    store[type] = nextCollection;
    writeStore(store);
    return { success: true, data: clone(store) };
  },

  reset() {
    writeStore(clone(initialDashboardData));
    return { success: true };
  },
};

export default mockApi;
