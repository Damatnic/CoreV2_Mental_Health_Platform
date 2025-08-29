/**
 * Mock for Workbox Window Module
 * Used for testing service worker registration and lifecycle
 */

export class Workbox {
  constructor(scriptURL, options) {
    this.scriptURL = scriptURL;
    this.options = options || {};
    this.eventListeners = {};
    this.controlling = false;
    this.waiting = false;
  }

  async register() {
    return Promise.resolve({
      installing: null,
      waiting: null,
      active: {
        scriptURL: this.scriptURL,
        state: 'activated'
      }
    });
  }

  addEventListener(type, listener) {
    if (!this.eventListeners[type]) {
      this.eventListeners[type] = [];
    }
    this.eventListeners[type].push(listener);
  }

  removeEventListener(type, listener) {
    if (this.eventListeners[type]) {
      const index = this.eventListeners[type].indexOf(listener);
      if (index > -1) {
        this.eventListeners[type].splice(index, 1);
      }
    }
  }

  async messageSW(data) {
    return Promise.resolve();
  }

  async update() {
    return Promise.resolve();
  }

  // Helper method for testing - simulate events
  _triggerEvent(type, event = {}) {
    if (this.eventListeners[type]) {
      this.eventListeners[type].forEach(listener => listener(event));
    }
  }
}
