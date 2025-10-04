// Circuit Breaker Pattern Implementation
interface CircuitBreakerConfig {
  failureThreshold: number;
  recoveryTimeout: number;
  monitoringPeriod: number;
}

enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN'
}

class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount = 0;
  private lastFailureTime = 0;
  private nextAttemptTime = 0;

  constructor(private config: CircuitBreakerConfig) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (Date.now() < this.nextAttemptTime) {
        throw new Error('Circuit breaker is OPEN');
      }
      this.state = CircuitState.HALF_OPEN;
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failureCount = 0;
    this.state = CircuitState.CLOSED;
  }

  private onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.config.failureThreshold) {
      this.state = CircuitState.OPEN;
      this.nextAttemptTime = Date.now() + this.config.recoveryTimeout;
    }
  }

  getState(): CircuitState {
    return this.state;
  }

  getFailureCount(): number {
    return this.failureCount;
  }

  reset() {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.lastFailureTime = 0;
    this.nextAttemptTime = 0;
  }
}

// Pre-configured circuit breakers for different operations
export const networkCircuitBreaker = new CircuitBreaker({
  failureThreshold: 5,
  recoveryTimeout: 30000, // 30 seconds
  monitoringPeriod: 60000  // 1 minute
});

export const notificationCircuitBreaker = new CircuitBreaker({
  failureThreshold: 3,
  recoveryTimeout: 60000, // 1 minute
  monitoringPeriod: 300000 // 5 minutes
});

export const apiCircuitBreaker = new CircuitBreaker({
  failureThreshold: 10,
  recoveryTimeout: 15000, // 15 seconds
  monitoringPeriod: 60000  // 1 minute
});

export { CircuitBreaker, CircuitState };
