// src/services/statusService.js

class StatusService {
  constructor() {
    this.listeners = new Set();
    this.history = [];
    this.activeOps = new Map();
    this.counter = 0;
    this.current = null;
  }

  notify() {
    const state = this.getState();
    this.listeners.forEach((listener) => {
      try {
        listener(state);
      } catch (err) {
        console.error("StatusService listener error:", err);
      }
    });
  }

  getState() {
    return {
      current: this.current,
      history: [...this.history],
      pendingCount: this.activeOps.size,
    };
  }

  subscribe(listener) {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  start(message) {
    const id = ++this.counter;
    const startTime = performance.now();
    const entry = {
      id,
      message,
      type: "pending",
      timestamp: new Date(),
      startTime,
    };
    this.activeOps.set(id, entry);
    this.current = entry;
    this.history.unshift(entry);
    if (this.history.length > 50) {
      this.history.pop();
    }
    this.notify();
    return id;
  }

  success(idOrMessage, maybeMessage) {
    let id = null;
    let message = "Completed";

    if (maybeMessage !== undefined) {
      id = idOrMessage;
      message = maybeMessage || "Completed";
    } else if (typeof idOrMessage === "number") {
      id = idOrMessage;
      message = "Completed";
    } else if (typeof idOrMessage === "string") {
      message = idOrMessage;
    }

    const now = performance.now();
    let durationMs;
    if (id && this.activeOps.has(id)) {
      const op = this.activeOps.get(id);
      durationMs = Math.round(now - op.startTime);
      this.activeOps.delete(id);
    }

    const entryId = id || ++this.counter;
    const completedEntry = {
      id: entryId,
      message,
      type: "success",
      timestamp: new Date(),
      durationMs,
    };

    if (id) {
      const histItem = this.history.find((item) => item.id === id);
      if (histItem) {
        histItem.message = message;
        histItem.type = "success";
        histItem.durationMs = durationMs;
        histItem.completedAt = new Date();
      }
    } else {
      this.history.unshift(completedEntry);
      if (this.history.length > 50) {
        this.history.pop();
      }
    }

    this.current = completedEntry;
    this.notify();
    return completedEntry;
  }

  error(idOrMessage, maybeMessage) {
    let id = null;
    let message = "Operation failed";

    if (maybeMessage !== undefined) {
      id = idOrMessage;
      message = maybeMessage || "Operation failed";
    } else if (typeof idOrMessage === "number") {
      id = idOrMessage;
      message = "Operation failed";
    } else if (typeof idOrMessage === "string") {
      message = idOrMessage;
    }

    const now = performance.now();
    let durationMs;
    if (id && this.activeOps.has(id)) {
      const op = this.activeOps.get(id);
      durationMs = Math.round(now - op.startTime);
      this.activeOps.delete(id);
    }

    const entryId = id || ++this.counter;
    const errorEntry = {
      id: entryId,
      message,
      type: "error",
      timestamp: new Date(),
      durationMs,
    };

    if (id) {
      const histItem = this.history.find((item) => item.id === id);
      if (histItem) {
        histItem.message = message;
        histItem.type = "error";
        histItem.durationMs = durationMs;
        histItem.completedAt = new Date();
      }
    } else {
      this.history.unshift(errorEntry);
      if (this.history.length > 50) {
        this.history.pop();
      }
    }

    this.current = errorEntry;
    this.notify();
    return errorEntry;
  }

  info(message) {
    return this.report(message, "info");
  }

  warn(message) {
    return this.report(message, "warn");
  }

  report(message, type = "info") {
    const id = ++this.counter;
    const entry = {
      id,
      message,
      type,
      timestamp: new Date(),
    };
    this.current = entry;
    this.history.unshift(entry);
    if (this.history.length > 50) {
      this.history.pop();
    }
    this.notify();
    return id;
  }

  clearHistory() {
    this.history = [];
    this.notify();
  }
}

const statusService = new StatusService();
export default statusService;
