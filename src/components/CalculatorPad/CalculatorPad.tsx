// src/components/CalculatorPad/CalculatorPad.tsx
import React, { useCallback } from "react";
import { Button, Row, Col, App as AntApp } from "antd";
import "./CalculatorPad.css"; // Component-specific CSS

// Define the valid final input patterns
const VALID_FINAL_INPUT_PATTERNS = [
  /^\d{2}$/, // ##
  /^\d{3}$/, // ###
  /^\d{2}X$/, // ##X
  /^\d{3}X$/, // ###X
  /^\d{2}>$/, // ##>
  /^\d{3}>$/, // ###>
  /^\d{3}>\d{3}$/, // ###>###
  /^\d{2}>\d{2}$/, // ##>##
];

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
   * Checks if a potential input string is a valid intermediate prefix
   * that could lead to a final valid pattern.
   * @param potentialInput The string to check.
   * @returns True if it's a valid prefix, false otherwise.
   */
  const isInputValidForPrefix = (potentialInput: string): boolean => {
    // Allow empty string
    if (potentialInput === "") return true;

    // Allow 1-3 digits
    if (/^\d{1,3}$/.test(potentialInput)) return true;

    // Allow 2 or 3 digits followed by 'X' or '>'
    if (/^(\d{2}|\d{3})[X>]$/.test(potentialInput)) return true;

    // Allow 2 or 3 digits, then '>', then 1 to 3 digits (for compound ranges in progress)
    if (/^(\d{2}|\d{3})>\d{1,3}$/.test(potentialInput)) return true;

    return false;
  };

  /**
   * Checks if a final input string matches any of the allowed final patterns.
   * @param finalInput The string to check.
   * @returns True if it matches a final pattern, false otherwise.
   */
  const isFinalInputValid = (finalInput: string): boolean => {
    return VALID_FINAL_INPUT_PATTERNS.some((regex) => regex.test(finalInput));
  };

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

        if (isInputValidForPrefix(newPotentialInput)) {
          updatedInput = newPotentialInput;
        } else {
          // If it's not a valid intermediate prefix, check if adding 'char'
          // completes a final valid pattern (e.g., adding the last digit for ##>##)
          if (isFinalInputValid(newPotentialInput)) {
            updatedInput = newPotentialInput;
          } else {
            message.error(
              "Invalid input sequence. Please follow ##, ###, ##X, ##>, ###X, ###>, ###>###, or ##>##."
            );
            updatedInput = input; // Revert to previous valid input
          }
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
