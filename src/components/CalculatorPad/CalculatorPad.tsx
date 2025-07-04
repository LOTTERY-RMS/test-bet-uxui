// src/components/CalculatorPad/CalculatorPad.tsx
import React, { useCallback } from "react";
import { Button, Row, Col, App as AntApp } from "antd";
import "./CalculatorPad.css"; // Component-specific CSS

// Regex for valid FINAL input patterns: ##, ###, ##X, ##>, ###X, ###>
const VALID_FINAL_INPUT_REGEX = /^(\d{2}|\d{3})[X>]?$/;

// Regex for valid intermediate numerical input (up to 3 digits)
const VALID_NUMERIC_PREFIX_REGEX = /^\d{1,3}$/;

interface CalculatorPadProps {
  input: string;
  onInputChange: (newInput: string) => void;
}

const CalculatorPad: React.FC<CalculatorPadProps> = ({
  input,
  onInputChange,
}) => {
  const { message } = AntApp.useApp();

  /**
   * Handles clicks on number and special character buttons (X, >).
   * Manages the input string based on predefined regex patterns.
   * 'C' clears the input.
   */
  const handleNumberClick = useCallback(
    (char: string) => {
      let updatedInput = input; // Start with the current input prop value

      // Clear button functionality
      if (char === "C") {
        updatedInput = "";
      } else {
        const newPotentialInput = input + char;

        // Allow empty input initially
        if (newPotentialInput === "") {
          updatedInput = newPotentialInput;
        }
        // Allow numerical prefixes (up to 3 digits)
        else if (VALID_NUMERIC_PREFIX_REGEX.test(newPotentialInput)) {
          updatedInput = newPotentialInput;
        }
        // Allow final valid input patterns (e.g., 12, 123, 12X, 123>)
        else if (VALID_FINAL_INPUT_REGEX.test(newPotentialInput)) {
          updatedInput = newPotentialInput;
        }
        // If none of the above, it's an invalid input sequence
        else {
          message.error(
            "Invalid number format. Please follow ##, ###, ##X, ##>, ###X, or ###>."
          );
          // If invalid, revert to the previous valid input (which is the current 'input' prop)
          updatedInput = input;
        }
      }
      onInputChange(updatedInput); // Pass the final string directly
    },
    [input, message, onInputChange] // Add 'input' to dependencies
  );

  return (
    <div className="calculator">
      <div className="display">
        <div className="result">{input || "_"}</div>
      </div>
      <Row gutter={[10, 10]} className="input-grid">
        <Col span={8}>
          <Button
            onClick={() => handleNumberClick("7")}
            className="antd-calc-button"
          >
            7
          </Button>
        </Col>
        <Col span={8}>
          <Button
            onClick={() => handleNumberClick("8")}
            className="antd-calc-button"
          >
            8
          </Button>
        </Col>
        <Col span={8}>
          <Button
            onClick={() => handleNumberClick("9")}
            className="antd-calc-button"
          >
            9
          </Button>
        </Col>
        <Col span={8}>
          <Button
            onClick={() => handleNumberClick("4")}
            className="antd-calc-button"
          >
            4
          </Button>
        </Col>
        <Col span={8}>
          <Button
            onClick={() => handleNumberClick("5")}
            className="antd-calc-button"
          >
            5
          </Button>
        </Col>
        <Col span={8}>
          <Button
            onClick={() => handleNumberClick("6")}
            className="antd-calc-button"
          >
            6
          </Button>
        </Col>
        <Col span={8}>
          <Button
            onClick={() => handleNumberClick("1")}
            className="antd-calc-button"
          >
            1
          </Button>
        </Col>
        <Col span={8}>
          <Button
            onClick={() => handleNumberClick("2")}
            className="antd-calc-button"
          >
            2
          </Button>
        </Col>
        <Col span={8}>
          <Button
            onClick={() => handleNumberClick("3")}
            className="antd-calc-button"
          >
            3
          </Button>
        </Col>
        <Col span={8}>
          <Button
            onClick={() => handleNumberClick("X")}
            className="antd-calc-button"
          >
            X
          </Button>
        </Col>
        <Col span={8}>
          <Button
            onClick={() => handleNumberClick("0")}
            className="antd-calc-button"
          >
            0
          </Button>
        </Col>
        <Col span={8}>
          <Button
            onClick={() => handleNumberClick(">")}
            className="antd-calc-button"
          >
            &gt;
          </Button>
        </Col>
        <Col span={24}>
          <Button
            onClick={() => handleNumberClick("C")}
            className="antd-calc-button antd-calc-button-clear"
            block
          >
            Clear
          </Button>
        </Col>
      </Row>
    </div>
  );
};

export default CalculatorPad;
