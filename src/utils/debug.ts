/**
 * Debug utilities for development and debugging
 */
import React from "react";

// Debug flag - can be toggled via environment or manually
export const DEBUG_MODE = import.meta.env.DEV || import.meta.env["VITE_DEBUG_MODE"] === "true";

/**
 * Enhanced console.log that only works in debug mode
 */
export const debugLog = (...args: unknown[]) => {
  if (DEBUG_MODE) {
    console.log("[DEBUG]", ...args);
  }
};

/**
/**
 * Enhanced console.warn that only works in debug mode
 */
export const debugWarn = (...args: unknown[]) => {
  if (DEBUG_MODE) {
    console.warn("[DEBUG WARN]", ...args);
  }
};

/**
 * Enhanced console.error that works in both debug and production
 */
export const debugError = (...args: unknown[]) => {
  console.error("[ERROR]", ...args);
};

/**
 * Performance timer for debugging
 */
export class DebugTimer {
  private startTime: number;
  private label: string;

  constructor(label: string) {
    this.label = label;
    this.startTime = performance.now();
    if (DEBUG_MODE) {
      console.time(`[TIMER] ${label}`);
    }
  }

  end(): number {
    const endTime = performance.now();
    const duration = endTime - this.startTime;

    if (DEBUG_MODE) {
      console.timeEnd(`[TIMER] ${this.label}`);
      debugLog(`${this.label} took ${duration.toFixed(2)}ms`);
    }

    return duration;
  }
}

/**
 * Debug state logger for React components
 */
export const debugState = (componentName: string, state: unknown) => {
  if (DEBUG_MODE) {
    console.group(`[STATE] ${componentName}`);
    console.table(state);
    console.groupEnd();
  }
};

/**
 * Debug props logger for React components
 */
export const debugProps = (componentName: string, props: unknown) => {
  if (DEBUG_MODE) {
    console.group(`[PROPS] ${componentName}`);
    console.table(props);
    console.groupEnd();
  }
};

/**
 * Function to add to window for runtime debugging
 */
export const exposeDebugHelpers = () => {
  if (DEBUG_MODE && typeof window !== "undefined") {
    (
      window as unknown as {
        debug: {
          log: typeof debugLog;
          warn: typeof debugWarn;
          error: typeof debugError;
          state: typeof debugState;
          props: typeof debugProps;
          timer: typeof DebugTimer;
          mode: typeof DEBUG_MODE;
        };
      }
    ).debug = {
      log: debugLog,
      warn: debugWarn,
      error: debugError,
      state: debugState,
      props: debugProps,
      timer: DebugTimer,
      mode: DEBUG_MODE,
    };
    debugLog("Debug helpers exposed to window.debug");
  }
};

/**
 * Trace function calls for debugging (TypeScript decorator)
 */
export const trace = (_target: unknown, propertyName: string, descriptor: PropertyDescriptor) => {
  if (!DEBUG_MODE) return descriptor;

  const method = descriptor.value;
  descriptor.value = function (...args: unknown[]) {
    debugLog(`[TRACE] Calling ${propertyName} with args:`, args);
    const result = method.apply(this, args);
    debugLog(`[TRACE] ${propertyName} returned:`, result);
    return result;
  };
  return descriptor;
};

/**
 * React component debugging HOC
 */
export const withDebugInfo = <P extends object>(WrappedComponent: React.ComponentType<P>, componentName?: string) => {
  const displayName = componentName || WrappedComponent.displayName || WrappedComponent.name;

  const DebugComponent = (props: P) => {
    if (DEBUG_MODE) {
      debugProps(displayName, props);
    }
    return React.createElement(WrappedComponent, props);
  };

  DebugComponent.displayName = `withDebugInfo(${displayName})`;
  return DebugComponent;
};

/**
 * Hook for debugging component renders
 */
export const useDebugRender = (componentName: string, props?: unknown) => {
  if (DEBUG_MODE) {
    debugLog(`[RENDER] ${componentName}`, props);
  }
};

/**
 * Breakpoint function for programmatic debugging
 */
export const debugBreakpoint = (message?: string) => {
  if (DEBUG_MODE) {
    if (message) {
      debugLog(`[BREAKPOINT] ${message}`);
    }
    // eslint-disable-next-line no-debugger
    debugger;
  }
};
