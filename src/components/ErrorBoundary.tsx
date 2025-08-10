import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";
import { debugError, DEBUG_MODE } from "../utils/debug";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Enhanced debugging with our debug utilities
    debugError("ErrorBoundary caught an error:", {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });

    // Store error info for debugging display
    this.setState({
      errorInfo,
    });

    // Report error to monitoring service in production
    if (import.meta.env.PROD) {
      // Add your error reporting service here
      // Example: Sentry.captureException(error, { contexts: { react: errorInfo } });
    }
  }

  resetError = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div
            style={{
              padding: "20px",
              textAlign: "center",
              color: "#ff4d4f",
              backgroundColor: "#fff2f0",
              border: "1px solid #ffccc7",
              borderRadius: "8px",
              margin: "20px",
            }}
          >
            <h3>Something went wrong</h3>
            <p>{DEBUG_MODE && this.state.error ? `Error: ${this.state.error.message}` : "Please refresh the page to try again."}</p>

            <div style={{ marginTop: "16px" }}>
              <button
                onClick={this.resetError}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#52c41a",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  marginRight: "8px",
                }}
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.reload()}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#1890ff",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Refresh Page
              </button>
            </div>

            {DEBUG_MODE && this.state.error && (
              <details style={{ textAlign: "left", marginTop: "20px" }}>
                <summary style={{ cursor: "pointer", fontWeight: "bold" }}>Debug Information (Development Only)</summary>
                <div style={{ marginTop: "10px", fontFamily: "monospace", fontSize: "12px" }}>
                  <h4>Error Details:</h4>
                  <pre style={{ backgroundColor: "#f5f5f5", padding: "10px", borderRadius: "4px", overflow: "auto" }}>{this.state.error.message}</pre>

                  <h4>Stack Trace:</h4>
                  <pre style={{ backgroundColor: "#f5f5f5", padding: "10px", borderRadius: "4px", overflow: "auto", maxHeight: "200px" }}>{this.state.error.stack}</pre>

                  {this.state.errorInfo && (
                    <>
                      <h4>Component Stack:</h4>
                      <pre style={{ backgroundColor: "#f5f5f5", padding: "10px", borderRadius: "4px", overflow: "auto", maxHeight: "150px" }}>{this.state.errorInfo.componentStack}</pre>
                    </>
                  )}
                </div>
              </details>
            )}
          </div>
        )
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
