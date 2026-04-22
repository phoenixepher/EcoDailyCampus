/**
 * Local Storage Store Management
 * Simulates a database for our fully functional demo.
 */
class Store {
  constructor() {
    // Initialized async below
  }

  async initialize() {
    if (!localStorage.getItem('eco_products')) {
      try {
        const response = await fetch('../src/data/dummyData.json');
        const initialData = await response.json();
        localStorage.setItem('eco_products', JSON.stringify(initialData.products));
      } catch (e) {
        console.error('Store: Initial seed failed', e);
      }
    }
    if (!localStorage.getItem('eco_users')) {
      localStorage.setItem('eco_users', JSON.stringify([
        { id: 1, email: 'admin@eco.com', password: 'admin', name: 'Campus Admin', role: 'admin' },
        { id: 2, email: 'user@eco.com', password: 'user123', name: 'Green Warrior', role: 'user', points: 450, wasteSaved: 12.5 }
      ]));
    }
    if (!localStorage.getItem('eco_orders')) {
      localStorage.setItem('eco_orders', JSON.stringify([]));
    }
    if (!localStorage.getItem('eco_challenges')) {
      localStorage.setItem('eco_challenges', JSON.stringify([
        { id: 1, title: 'No Plastic Day', points: 50, category: 'Habit' },
        { id: 2, title: 'Recycle 5 Bottles', points: 30, category: 'Action' }
      ]));
    }
  }

  getData(key) {
    try {
      const data = localStorage.getItem(`eco_${key}`);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error(`Store: Failed to get ${key}`, e);
      return [];
    }
  }

  setData(key, data) {
    localStorage.setItem(`eco_${key}`, JSON.stringify(data));
  }
}

export default new Store();
