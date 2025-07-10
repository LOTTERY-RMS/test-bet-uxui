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
  /^\d{3}~\d{3}$/, // ###~###
  /^\d{2}~\d{2}$/, // ##~##
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

    // Allow 2 or 3 digits followed by 'X', '>', or '~'
    if (/^(\d{2}|\d{3})[X>~]$/.test(potentialInput)) return true;

    // Allow 2 or 3 digits, then '>', or '~' then 0 to 3 digits (for compound ranges in progress)
    if (/^(\d{2}|\d{3})[>~]\d{0,3}$/.test(potentialInput)) return true;

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
   * Handles clicks on number and special character buttons (X, >, ~).
   * Manages the input string based on predefined regex patterns.
   * 'C' clears the input. 'Del' removes the last character.
   */
  const handleNumberClick = useCallback(
    (char: string) => {
      let currentInput = input;

      if (char === "C") {
        currentInput = "";
      } else if (char === "Del") {
        currentInput = input.slice(0, -1);
      } else {
        const newPotentialInput = input + char;

        // Check if the new potential input is a valid intermediate state or a valid final pattern
        if (
          isInputValidForPrefix(newPotentialInput) ||
          isFinalInputValid(newPotentialInput)
        ) {
          currentInput = newPotentialInput;
        } else {
          // If neither, it's an invalid sequence, revert to previous input
          message.error(
            "Invalid input sequence. Please follow patterns like ##, ###, ##X, ###X, ##>, ###>, ###>###, ##>##, ###~###, or ##~##."
          );
          return; // Do not update input
        }
      }
      onInputChange(currentInput);
    },
    [input, message, onInputChange]
  );

  return (
    <div className="calculator">
      <div className="display">
        <div className="result">{input || "_"}</div>
      </div>
      <Row gutter={[10, 10]} className="input-grid">
        {/* First Row: 7, 8, 9, C */}
        <Col span={6}>
          <Button
            onClick={() => handleNumberClick("7")}
            className="antd-calc-button"
          >
            7
          </Button>
        </Col>
        <Col span={6}>
          <Button
            onClick={() => handleNumberClick("8")}
            className="antd-calc-button"
          >
            8
          </Button>
        </Col>
        <Col span={6}>
          <Button
            onClick={() => handleNumberClick("9")}
            className="antd-calc-button"
          >
            9
          </Button>
        </Col>
        <Col span={6}>
          <Button
            onClick={() => handleNumberClick("X")}
            className="antd-calc-button"
          >
            X
          </Button>
        </Col>

        {/* Second Row: 4, 5, 6, X */}
        <Col span={6}>
          <Button
            onClick={() => handleNumberClick("4")}
            className="antd-calc-button"
          >
            4
          </Button>
        </Col>
        <Col span={6}>
          <Button
            onClick={() => handleNumberClick("5")}
            className="antd-calc-button"
          >
            5
          </Button>
        </Col>
        <Col span={6}>
          <Button
            onClick={() => handleNumberClick("6")}
            className="antd-calc-button"
          >
            6
          </Button>
        </Col>
        <Col span={6}>
          <Button
            onClick={() => handleNumberClick(">")}
            className="antd-calc-button"
          >
            &gt;
          </Button>
        </Col>

        {/* Third Row: 1, 2, 3, > */}
        <Col span={6}>
          <Button
            onClick={() => handleNumberClick("1")}
            className="antd-calc-button"
          >
            1
          </Button>
        </Col>
        <Col span={6}>
          <Button
            onClick={() => handleNumberClick("2")}
            className="antd-calc-button"
          >
            2
          </Button>
        </Col>
        <Col span={6}>
          <Button
            onClick={() => handleNumberClick("3")}
            className="antd-calc-button"
          >
            3
          </Button>
        </Col>

        <Col span={6}>
          <Button
            onClick={() => handleNumberClick("Del")}
            className="antd-calc-button antd-calc-button-clear"
          >
            Del
          </Button>
        </Col>

        {/* <Col span={6}>
          <Button
            onClick={() => handleNumberClick("~")}
            className="antd-calc-button"
          >
            ~
          </Button>
        </Col> */}

        {/* Fourth Row: 0, ~, Del */}
        <Col span={12}>
          {" "}
          {/* Span 12 for 0 to make it wider */}
          <Button
            onClick={() => handleNumberClick("0")}
            className="antd-calc-button"
            style={{ width: "100%", borderRadius: "40px" }}
          >
            0
          </Button>
        </Col>

        <Col span={12}>
          <Button
            onClick={() => handleNumberClick("C")}
            className="antd-calc-button antd-calc-button-clear"
          >
            Clear
          </Button>
        </Col>
      </Row>
    </div>
  );
};

export default CalculatorPad;
