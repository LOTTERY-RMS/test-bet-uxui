import React, { useCallback } from "react";
import { Button, Row, Col, App as AntApp } from "antd";
import "./CalculatorPad.css";
import { isInputValidForPrefix, isSupportedBetInput } from "../../utils/numberUtils";

interface CalculatorPadProps {
  input: string;
  onInputChange: (newInput: string) => void;
}

/** CalculatorPad component for entering numbers and operators (0-9, X, >, ~, C, Del).
 * Displays the current input and updates it based on button clicks.
 * Uses memoization to prevent unnecessary re-renders.
 */
const CalculatorPad: React.FC<CalculatorPadProps> = React.memo(({ input, onInputChange }) => {
  const { message } = AntApp.useApp();

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
    (buttonValue: string) => {
      let updatedInput = input;
      if (buttonValue === "C") {
        // Clear the entire input
        updatedInput = "";
      } else if (buttonValue === "Del") {
        // Remove the last character
        updatedInput = input.slice(0, -1);
      } else {
        const candidateInput = input + buttonValue;
        if (isInputValidForPrefix(candidateInput) || isSupportedBetInput(candidateInput)) {
          // Append character if it forms a valid prefix or final pattern
          updatedInput = candidateInput;
        } else {
          // Show error for invalid sequence
          const validFormats = [
            "## (e.g., 12)",
            "### (e.g., 123)",
            "##X (e.g., 12X)",
            "###X (e.g., 123X)",
            "####X (e.g., 1112X)",
            "#####X (e.g., 11222X)",
            "##> (e.g., 12>)",
            "###> (e.g., 123>)",
            "##>## (e.g., 12>15)",
            "###>### (e.g., 123>125)",
            "##~## (e.g., 12~15)",
            "###~### (e.g., 123~125)",
          ];
          message.error(`Invalid input sequence. Supported formats: ${validFormats.join(", ")}.`);
          return;
        }
      }
      onInputChange(updatedInput);
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
          <Button onClick={() => handleNumberClick("7")} className="antd-calc-button" aria-label="Digit 7">
            7
          </Button>
        </Col>
        <Col span={6}>
          <Button onClick={() => handleNumberClick("8")} className="antd-calc-button" aria-label="Digit 8">
            8
          </Button>
        </Col>
        <Col span={6}>
          <Button onClick={() => handleNumberClick("9")} className="antd-calc-button" aria-label="Digit 9">
            9
          </Button>
        </Col>
        <Col span={6}>
          <Button onClick={() => handleNumberClick("X")} className="antd-calc-button" aria-label="Permutation operator">
            X
          </Button>
        </Col>
        <Col span={6}>
          <Button onClick={() => handleNumberClick("4")} className="antd-calc-button" aria-label="Digit 4">
            4
          </Button>
        </Col>
        <Col span={6}>
          <Button onClick={() => handleNumberClick("5")} className="antd-calc-button" aria-label="Digit 5">
            5
          </Button>
        </Col>
        <Col span={6}>
          <Button onClick={() => handleNumberClick("6")} className="antd-calc-button" aria-label="Digit 6">
            6
          </Button>
        </Col>
        <Col span={6}>
          <Button onClick={() => handleNumberClick(">")} className="antd-calc-button" aria-label="Range operator">
            &gt;
          </Button>
        </Col>
        <Col span={6}>
          <Button onClick={() => handleNumberClick("1")} className="antd-calc-button" aria-label="Digit 1">
            1
          </Button>
        </Col>
        <Col span={6}>
          <Button onClick={() => handleNumberClick("2")} className="antd-calc-button" aria-label="Digit 2">
            2
          </Button>
        </Col>
        <Col span={6}>
          <Button onClick={() => handleNumberClick("3")} className="antd-calc-button" aria-label="Digit 3">
            3
          </Button>
        </Col>
        <Col span={6}>
          <Button onClick={() => handleNumberClick("Del")} className="antd-calc-button antd-calc-button-clear" aria-label="Delete last character">
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
          <Button onClick={() => handleNumberClick("0")} className="antd-calc-button" style={{ width: "100%", borderRadius: "40px" }} aria-label="Digit 0">
            0
          </Button>
        </Col>
        <Col span={12}>
          <Button onClick={() => handleNumberClick("C")} className="antd-calc-button antd-calc-button-clear" aria-label="Clear input">
            Clear
          </Button>
        </Col>
      </Row>
    </div>
  );
});

export default CalculatorPad;
