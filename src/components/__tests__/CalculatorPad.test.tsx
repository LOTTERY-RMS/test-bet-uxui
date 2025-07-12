import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { App } from "antd";
import CalculatorPad from "../CalculatorPad/CalculatorPad";

// Mock the AntApp context
const TestWrapper = ({ children }: { children: React.ReactNode }) => <App>{children}</App>;

describe("CalculatorPad", () => {
  const mockOnInputChange = vi.fn();

  beforeEach(() => {
    mockOnInputChange.mockClear();
  });

  it("should render calculator buttons", () => {
    render(
      <TestWrapper>
        <CalculatorPad input="" onInputChange={mockOnInputChange} />
      </TestWrapper>
    );

    // Check if all number buttons are rendered
    expect(screen.getByLabelText("Digit 1")).toBeInTheDocument();
    expect(screen.getByLabelText("Digit 2")).toBeInTheDocument();
    expect(screen.getByLabelText("Digit 3")).toBeInTheDocument();
    expect(screen.getByLabelText("Digit 4")).toBeInTheDocument();
    expect(screen.getByLabelText("Digit 5")).toBeInTheDocument();
    expect(screen.getByLabelText("Digit 6")).toBeInTheDocument();
    expect(screen.getByLabelText("Digit 7")).toBeInTheDocument();
    expect(screen.getByLabelText("Digit 8")).toBeInTheDocument();
    expect(screen.getByLabelText("Digit 9")).toBeInTheDocument();
    expect(screen.getByLabelText("Digit 0")).toBeInTheDocument();

    // Check if operator buttons are rendered
    expect(screen.getByLabelText("Permutation operator")).toBeInTheDocument();
    expect(screen.getByLabelText("Range operator")).toBeInTheDocument();
    expect(screen.getByLabelText("Delete last character")).toBeInTheDocument();
    expect(screen.getByLabelText("Clear input")).toBeInTheDocument();
  });

  it("should display current input", () => {
    render(
      <TestWrapper>
        <CalculatorPad input="123" onInputChange={mockOnInputChange} />
      </TestWrapper>
    );

    expect(screen.getByText("123")).toBeInTheDocument();
  });

  it("should display underscore when input is empty", () => {
    render(
      <TestWrapper>
        <CalculatorPad input="" onInputChange={mockOnInputChange} />
      </TestWrapper>
    );

    expect(screen.getByText("_")).toBeInTheDocument();
  });

  it("should handle number button clicks", () => {
    const { rerender } = render(
      <TestWrapper>
        <CalculatorPad input="" onInputChange={mockOnInputChange} />
      </TestWrapper>
    );

    fireEvent.click(screen.getByLabelText("Digit 1"));
    expect(mockOnInputChange).toHaveBeenCalledWith("1");

    // Clear mock and rerender with updated input
    mockOnInputChange.mockClear();

    rerender(
      <TestWrapper>
        <CalculatorPad input="1" onInputChange={mockOnInputChange} />
      </TestWrapper>
    );

    fireEvent.click(screen.getByLabelText("Digit 2"));
    expect(mockOnInputChange).toHaveBeenCalledWith("12");
  });

  it("should handle operator button clicks", () => {
    render(
      <TestWrapper>
        <CalculatorPad input="12" onInputChange={mockOnInputChange} />
      </TestWrapper>
    );

    fireEvent.click(screen.getByLabelText("Permutation operator"));
    expect(mockOnInputChange).toHaveBeenCalledWith("12X");

    fireEvent.click(screen.getByLabelText("Range operator"));
    expect(mockOnInputChange).toHaveBeenCalledWith("12>");
  });

  it("should handle clear button", () => {
    render(
      <TestWrapper>
        <CalculatorPad input="123" onInputChange={mockOnInputChange} />
      </TestWrapper>
    );

    fireEvent.click(screen.getByLabelText("Clear input"));
    expect(mockOnInputChange).toHaveBeenCalledWith("");
  });

  it("should handle delete button", () => {
    render(
      <TestWrapper>
        <CalculatorPad input="123" onInputChange={mockOnInputChange} />
      </TestWrapper>
    );

    fireEvent.click(screen.getByLabelText("Delete last character"));
    expect(mockOnInputChange).toHaveBeenCalledWith("12");
  });

  it("should prevent invalid input sequences", () => {
    render(
      <TestWrapper>
        <CalculatorPad input="1111" onInputChange={mockOnInputChange} />
      </TestWrapper>
    );

    // Try to add X to a sequence that violates frequency rules
    fireEvent.click(screen.getByLabelText("Permutation operator"));

    // The function should not be called due to validation
    expect(mockOnInputChange).not.toHaveBeenCalled();
  });

  it("should allow valid input sequences", () => {
    render(
      <TestWrapper>
        <CalculatorPad input="111" onInputChange={mockOnInputChange} />
      </TestWrapper>
    );

    // Add X to a valid sequence
    fireEvent.click(screen.getByLabelText("Permutation operator"));
    expect(mockOnInputChange).toHaveBeenCalledWith("111X");
  });
});
