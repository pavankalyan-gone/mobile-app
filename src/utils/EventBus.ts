export type EventType = 
  | 'LoginSuccess'
  | 'Logout'
  | 'WorkspaceChanged'
  | 'PermissionChanged'
  | 'AppAdded'
  | 'AppRemoved'
  | 'AccessRevoked';

type EventCallback = (data?: any) => void;

class EventBus {
  private listeners: Record<string, EventCallback[]> = {};

  on(event: EventType, callback: EventCallback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);

    // Return unsubscribe function
    return () => {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    };
  }

  emit(event: EventType, data?: any) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => callback(data));
    }
  }
}

export const eventBus = new EventBus();
