type Listener = (payload: any) => void;

class EventBus {
  private listeners: Record<string, Listener[]> = {};

  on(evento: string, cb: Listener) {
    this.listeners[evento] = [...(this.listeners[evento] ?? []), cb];
    return () => {
      this.listeners[evento] = this.listeners[evento].filter((l) => l !== cb);
    };
  }

  emit(evento: string, payload: any) {
    (this.listeners[evento] ?? []).forEach((cb) => cb(payload));
  }
}

export const eventBus = new EventBus();