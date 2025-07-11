import React, { useCallback } from "react";
import { Button, Row, Col, App as AntApp } from "antd";
import "./CalculatorPad.css";

// Define valid input patterns for the calculator
const VALID_FINAL_INPUT_PATTERNS = [
  /^\d{2}$/, // ## (e.g., 12)
  /^\d{3}$/, // ### (e.g., 123)
  /^\d{2}X$/, // ##X (e.g., 12X)
  /^\d{3}X$/, // ###X (e.g., 123X)
  /^\d{2}>$/, // ##> (e.g., 12>)
  /^\d{3}>$/, // ###> (e.g., 123>)
  /^\d{3}>\d{3}$/, // ###>### (e.g., 123>125)
  /^\d{2}>\d{2}$/, // ##>## (e.g., 12>15)
  /^\d{3}~\d{3}$/, // ###~### (e.g., 123~125)
  /^\d{2}~\d{2}$/, // ##~## (e.g., 12~15)
];

interface CalculatorPadProps {
  input: string;
  onInputChange: (newInput: string) => void;
}

/** CalculatorPad component for entering numbers and operators (0-9, X, >, ~, C, Del).
 * Displays the current input and updates it based on button clicks.
 * Uses memoization to prevent unnecessary re-renders.
 */
const CalculatorPad: React.FC<CalculatorPadProps> = React.memo(
  ({ input, onInputChange }) => {
    const { message } = AntApp.useApp();

    /** Checks if a potential input is a valid prefix for allowed patterns.
     * Allows intermediate states that could lead to a valid final pattern.
     * @param potentialInput The input string to check (e.g., "12", "123>", "12~").
     * @returns True if the input is a valid prefix, false otherwise.
     * Examples:
     * - isInputValidForPrefix("") → true (empty input)
     * - isInputValidForPrefix("12") → true (partial 2-digit number)
     * - isInputValidForPrefix("123>") → true (partial range)
     * - isInputValidForPrefix("12X4") → false (invalid sequence)
     */
    const isInputValidForPrefix = (potentialInput: string): boolean => {
      if (potentialInput === "") return true;
      if (/^\d{1,3}$/.test(potentialInput)) return true;
      if (/^(\d{2}|\d{3})[X>~]$/.test(potentialInput)) return true;
      if (/^(\d{2}|\d{3})[>~]\d{0,3}$/.test(potentialInput)) return true;
      return false;
    };

    /** Checks if a final input string matches allowed patterns.
     * @param finalInput The input string to validate (e.g., "12X", "123>125").
     * @returns True if the input matches a valid pattern, false otherwise.
     * Examples:
     * - isFinalInputValid("12X") → true
     * - isFinalInputValid("123>125") → true
     * - isFinalInputValid("12~15") → true
     * - isFinalInputValid("1234") → false
     */
    const isFinalInputValid = (finalInput: string): boolean => {
      return VALID_FINAL_INPUT_PATTERNS.some((regex) => regex.test(finalInput));
    };

    /** Handles button clicks for numbers and operators.
     * Updates the input string based on valid patterns.
     * @param char The character or action from the button (e.g., "1", "X", "C", "Del").
     * Examples:
     * - Clicking "1" on empty input → "1"
     * - Clicking "X" after "12" → "12X"
     * - Clicking "C" → Clears input to ""
     * - Clicking "Del" on "123" → "12"
     */
    const handleNumberClick = useCallback(
      (char: string) => {
        let currentInput = input;
        if (char === "C") {
          // Clear the entire input
          currentInput = "";
        } else if (char === "Del") {
          // Remove the last character
          currentInput = input.slice(0, -1);
        } else {
          const newPotentialInput = input + char;
          if (
            isInputValidForPrefix(newPotentialInput) ||
            isFinalInputValid(newPotentialInput)
          ) {
            // Append character if it forms a valid prefix or final pattern
            currentInput = newPotentialInput;
          } else {
            // Show error for invalid sequence
            const validFormats = [
              "## (e.g., 12)",
              "### (e.g., 123)",
              "##X (e.g., 12X)",
              "###X (e.g., 123X)",
              "##> (e.g., 12>)",
              "###> (e.g., 123>)",
              "##>## (e.g., 12>15)",
              "###>### (e.g., 123>125)",
              "##~## (e.g., 12~15)",
              "###~### (e.g., 123~125)",
            ];
            message.error(
              `Invalid input sequence. Supported formats: ${validFormats.join(
                ", "
              )}.`
            );
            return;
          }
        }
        onInputChange(currentInput);
      },
      [input, message, onInputChange]
    );

    return (
      <div className="calculator">
        <div className="display">
          <div className="result" aria-live="polite">
            {input || "_"}
          </div>
        </div>
        <Row gutter={[10, 10]} className="input-grid">
          <Col span={6}>
            <Button
              onClick={() => handleNumberClick("7")}
              className="antd-calc-button"
              aria-label="Digit 7"
            >
              7
            </Button>
          </Col>
          <Col span={6}>
            <Button
              onClick={() => handleNumberClick("8")}
              className="antd-calc-button"
              aria-label="Digit 8"
            >
              8
            </Button>
          </Col>
          <Col span={6}>
            <Button
              onClick={() => handleNumberClick("9")}
              className="antd-calc-button"
              aria-label="Digit 9"
            >
              9
            </Button>
          </Col>
          <Col span={6}>
            <Button
              onClick={() => handleNumberClick("X")}
              className="antd-calc-button"
              aria-label="Permutation operator"
            >
              X
            </Button>
          </Col>
          <Col span={6}>
            <Button
              onClick={() => handleNumberClick("4")}
              className="antd-calc-button"
              aria-label="Digit 4"
            >
              4
            </Button>
          </Col>
          <Col span={6}>
            <Button
              onClick={() => handleNumberClick("5")}
              className="antd-calc-button"
              aria-label="Digit 5"
            >
              5
            </Button>
          </Col>
          <Col span={6}>
            <Button
              onClick={() => handleNumberClick("6")}
              className="antd-calc-button"
              aria-label="Digit 6"
            >
              6
            </Button>
          </Col>
          <Col span={6}>
            <Button
              onClick={() => handleNumberClick(">")}
              className="antd-calc-button"
              aria-label="Range operator"
            >
              &gt;
            </Button>
          </Col>
          <Col span={6}>
            <Button
              onClick={() => handleNumberClick("1")}
              className="antd-calc-button"
              aria-label="Digit 1"
            >
              1
            </Button>
          </Col>
          <Col span={6}>
            <Button
              onClick={() => handleNumberClick("2")}
              className="antd-calc-button"
              aria-label="Digit 2"
            >
              2
            </Button>
          </Col>
          <Col span={6}>
            <Button
              onClick={() => handleNumberClick("3")}
              className="antd-calc-button"
              aria-label="Digit 3"
            >
              3
            </Button>
          </Col>
          <Col span={6}>
            <Button
              onClick={() => handleNumberClick("Del")}
              className="antd-calc-button antd-calc-button-clear"
              aria-label="Delete last character"
            >
              Del
            </Button>
          </Col>
          {/* <Col span={6}>
            <Button
              onClick={() => handleNumberClick("~")}
              className="antd-calc-button"
              aria-label="Simple range operator"
            >
              ~
            </Button>
          </Col> */}
          <Col span={12}>
            <Button
              onClick={() => handleNumberClick("0")}
              className="antd-calc-button"
              style={{ width: "100%", borderRadius: "40px" }}
              aria-label="Digit 0"
            >
              0
            </Button>
          </Col>
          <Col span={12}>
            <Button
              onClick={() => handleNumberClick("C")}
              className="antd-calc-button antd-calc-button-clear"
              aria-label="Clear input"
            >
              Clear
            </Button>
          </Col>
        </Row>
      </div>
    );
  }
);

export default CalculatorPad;
