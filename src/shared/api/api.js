const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

class ApiService {
  // ============================================
  // AUTH
  // ============================================

  async register(userData) {
    const response = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    return await response.json();
  }

  async login(credentials) {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    return await response.json();
  }

  async sendVerificationCode(email, code, type) {
    const response = await fetch(`${API_URL}/send-verification-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code, type })
    });
    return await response.json();
  }

  // ============================================
  // USER PROFILE
  // ============================================

  async getUser(userId) {
    const response = await fetch(`${API_URL}/user/${userId}`);
    return await response.json();
  }

  async updateProfile(userId, profileData) {
    const response = await fetch(`${API_URL}/user/${userId}/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profileData)
    });
    return await response.json();
  }

  async updateSettings(userId, settingsData) {
    const response = await fetch(`${API_URL}/user/${userId}/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settingsData)
    });
    return await response.json();
  }

  // ============================================
  // DASHBOARD ITEMS
  // ============================================

  async getDashboardItems(userId) {
    const response = await fetch(`${API_URL}/dashboard/${userId}/items`);
    return await response.json();
  }

  async createDashboardItem(userId, itemData) {
    const response = await fetch(`${API_URL}/dashboard/${userId}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(itemData)
    });
    return await response.json();
  }

  async updateDashboardItem(userId, itemId, itemData) {
    const response = await fetch(`${API_URL}/dashboard/${userId}/items/${itemId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(itemData)
    });
    return await response.json();
  }

  async deleteDashboardItem(userId, itemId) {
    const response = await fetch(`${API_URL}/dashboard/${userId}/items/${itemId}`, {
      method: 'DELETE'
    });
    return await response.json();
  }

  // ============================================
  // ANALYTICS
  // ============================================

  async getUserActivities(userId, limit = 50) {
    const response = await fetch(`${API_URL}/user/${userId}/activities?limit=${limit}`);
    return await response.json();
  }

  async getDashboardAnalytics(userId) {
    const response = await fetch(`${API_URL}/dashboard/${userId}/analytics`);
    return await response.json();
  }
}

export default new ApiService();