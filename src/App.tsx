import { useCallback, useState } from "react";
import { Button, Row, Col, Table, Input, App as AntApp } from "antd";
import type { ColumnsType } from "antd/es/table";
import "antd/dist/reset.css";
import "./App.css";

// Define interfaces for your data structures
interface ChannelButton {
  id: string;
  label: string;
  isActive: boolean;
  conflictsWith?: string[];
  multiplier: number;
}

interface PButton {
  id: string;
  label: string;
  isActive: boolean;
  channelsToActivate: string[];
}

interface EnteredNumber {
  key: number;
  value: string;
  channels: string[];
  amount: string;
  totalAmount: string;
  syntaxType: string; // New property: "2D" or "3D"
}

// Regex for valid FINAL input patterns: ##, ###, ##X, ##>, ###X, ###>
const VALID_FINAL_INPUT_REGEX = /^(\d{2}|\d{3})[X>]?$/;

// Regex for valid intermediate numerical input (up to 3 digits)
const VALID_NUMERIC_PREFIX_REGEX = /^\d{1,3}$/;

function App() {
  const [input, setInput] = useState<string>("");
  const [enteredNumbers, setEnteredNumbers] = useState<EnteredNumber[]>([]);
  const [amountInput, setAmountInput] = useState<string>("");

  const { message } = AntApp.useApp();

  const [channelsButtons, setChannelsButtons] = useState<ChannelButton[]>([
    {
      id: "A",
      label: "A",
      isActive: false,
      conflictsWith: ["Lo"],
      multiplier: 1,
    },
    {
      id: "B",
      label: "B",
      isActive: false,
      conflictsWith: ["Lo"],
      multiplier: 1,
    },
    {
      id: "C",
      label: "C",
      isActive: false,
      conflictsWith: ["Lo"],
      multiplier: 1,
    },
    {
      id: "D",
      label: "D",
      isActive: false,
      conflictsWith: ["Lo"],
      multiplier: 1,
    },
    { id: "Ho", label: "Ho", isActive: false, multiplier: 1 },
    { id: "I", label: "I", isActive: false, multiplier: 1 },
    { id: "N", label: "N", isActive: false, multiplier: 1 },
    {
      id: "Lo",
      label: "Lo",
      isActive: false,
      conflictsWith: ["A", "B", "C", "D"],
      multiplier: 19,
    },
  ]);

  const [pButtons, setPButtons] = useState<PButton[]>([
    {
      id: "4P",
      label: "4P",
      isActive: false,
      channelsToActivate: ["A", "B", "C", "D"],
    },
    {
      id: "5P",
      label: "5P",
      isActive: false,
      channelsToActivate: ["A", "B", "C", "D", "Ho"],
    },
    {
      id: "6P",
      label: "6P",
      isActive: false,
      channelsToActivate: ["A", "B", "C", "D", "Ho", "I"],
    },
    {
      id: "7P",
      label: "7P",
      isActive: false,
      channelsToActivate: ["A", "B", "C", "D", "Ho", "I", "N"],
    },
  ]);

  // --- REFINED handleNumberClick logic for syntax ---

  const handleNumberClick = useCallback(
    (char: string) => {
      setInput((prevInput) => {
        // Handle Clear button

        const newPotentialInput = prevInput + char;

        console.log({ prevInput, char });

        if (char === "C") {
          return "";
        }
        // Rule 1: Always allow initial empty input
        if (newPotentialInput === "") {
          return newPotentialInput;
        }

        // Rule 2: If the newPotentialInput is a digit
        if (VALID_NUMERIC_PREFIX_REGEX.test(newPotentialInput)) {
          return newPotentialInput;
        }

        // Rule 3: If the newPotentialInput is a Correct
        if (VALID_FINAL_INPUT_REGEX.test(newPotentialInput)) {
          return newPotentialInput;
        }

        message.error(
          "Invalid number format. Please follow ##, ###, ##X, ##>, ###X, or ###>."
        );
        return prevInput;
      });
    },
    [message]
  );
  // --- END REFINED handleNumberClick ---

  const handleAmountInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*\.?\d*$/.test(value) || value === "") {
      setAmountInput(value);
    }
  };

  const handleAmountInputBlur = () => {
    const value = amountInput.trim();
    if (value === "") {
      setAmountInput("");
      return;
    }

    const parsedValue = parseFloat(value);
    if (isNaN(parsedValue)) {
      setAmountInput("");
      message.error("Invalid amount entered. Please enter a number.");
      return;
    }
    setAmountInput(parsedValue.toFixed(2));
  };

  const handleEnterClick = () => {
    if (input.trim() === "") {
      message.error("Please enter a number before pressing Enter.");
      return;
    }

    const selectedChannels = channelsButtons.filter(
      (button) => button.isActive
    );

    if (!VALID_FINAL_INPUT_REGEX.test(input)) {
      message.error(
        "Invalid number format. Please follow ##, ###, ##X, ##>, ###X, or ###>."
      );
      return;
    }

    if (selectedChannels.length === 0) {
      message.error(
        "Please select at least one channel (A, B, C, D, Ho, I, N, Lo) to proceed."
      );
      return;
    }

    if (amountInput.trim() === "") {
      message.error("Please enter an amount.");
      return;
    }

    const parsedAmount = parseFloat(amountInput);
    if (isNaN(parsedAmount)) {
      message.error("Amount is not a valid number.");
      return;
    }

    // --- Final validation and syntax type determination using VALID_FINAL_INPUT_REGEX ---
    let syntaxType = "";
    // Extract the digit part to determine 2D or 3D
    const digitsPart = input.replace(/[X>]/, "");
    if (digitsPart.length === 2) {
      syntaxType = "2D";
    } else if (digitsPart.length === 3) {
      syntaxType = "3D";
    }

    // --- END Final validation ---

    let calculatedTotalAmount = 0;
    selectedChannels.forEach((channel) => {
      calculatedTotalAmount += parsedAmount * channel.multiplier;
    });

    const selectedChannelIdsArray = selectedChannels.map((button) => button.id);

    setEnteredNumbers((prevNumbers) => [
      ...prevNumbers,
      {
        key: prevNumbers.length,
        value: input,
        channels: selectedChannelIdsArray,
        amount: parsedAmount.toFixed(2),
        totalAmount: calculatedTotalAmount.toFixed(2),
        syntaxType: syntaxType, // Store the determined syntax type
      },
    ]);

    setInput("");
    setAmountInput("");
  };

  const handleChannelButtonClick = (clickedId: string) => {
    setPButtons((prevPButtons) =>
      prevPButtons.map((button) => ({ ...button, isActive: false }))
    );

    setChannelsButtons((prevChannelsButtons) => {
      const clickedButton = prevChannelsButtons.find(
        (button) => button.id === clickedId
      );

      if (!clickedButton) return prevChannelsButtons;

      if (clickedButton.isActive) {
        return prevChannelsButtons.map((button) =>
          button.id === clickedId ? { ...button, isActive: false } : button
        );
      }

      const conflictsToDeactivate = clickedButton.conflictsWith || [];

      return prevChannelsButtons.map((button) => {
        if (button.id === clickedId) {
          return { ...button, isActive: true };
        } else if (conflictsToDeactivate.includes(button.id)) {
          return { ...button, isActive: false };
        }
        return button;
      });
    });
  };

  const handlePButtonClick = (clickedId: string) => {
    setPButtons((prevPButtons) => {
      const clickedPButton = prevPButtons.find(
        (button) => button.id === clickedId
      );

      if (!clickedPButton) return prevPButtons;

      if (clickedPButton.isActive) {
        setChannelsButtons((prevChannels) =>
          prevChannels.map((channel) => ({ ...channel, isActive: false }))
        );
        return prevPButtons.map((button) => ({ ...button, isActive: false }));
      }

      const updatedPButtons = prevPButtons.map((button) => ({
        ...button,
        isActive: button.id === clickedId,
      }));

      const channelsToActivate = clickedPButton.channelsToActivate;
      setChannelsButtons((prevChannels) =>
        prevChannels.map((channel) => ({
          ...channel,
          isActive: channelsToActivate.includes(channel.id),
        }))
      );

      return updatedPButtons;
    });
  };

  const columns: ColumnsType<EnteredNumber> = [
    {
      title: "No.",
      dataIndex: "key",
      key: "key",
      render: (text, record, index) => index + 1,
      width: "6%", // Adjusted width
    },
    {
      title: "Entered Number",
      dataIndex: "value",
      key: "value",
      width: "20%", // Adjusted width
    },
    {
      title: "Syntax", // New column for Syntax Type
      dataIndex: "syntaxType",
      key: "syntaxType",
      width: "10%",
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      width: "12%", // Adjusted width
    },
    {
      title: "Channels",
      dataIndex: "channels",
      key: "channels",
      width: "27%", // Adjusted width
      render: (channels) => channels.join(", "),
    },
    {
      title: "Total Amount",
      dataIndex: "totalAmount",
      key: "totalAmount",
      width: "25%", // Adjusted width
    },
  ];

  return (
    <AntApp>
      {" "}
      {/* Wrap the entire App with AntApp */}
      <div className="container">
        <Row gutter={[20, 20]} style={{ width: "100%" }}>
          <Col span={12}>
            <Row gutter={[10, 10]}>
              <Col span={14}>
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
                        onClick={() => handleNumberClick("C")} // Clear button
                        className="antd-calc-button antd-calc-button-clear"
                        block
                      >
                        Clear
                      </Button>
                    </Col>
                  </Row>
                </div>
              </Col>
              <Col span={10}>
                <div className="middle-controls-container">
                  <div className="middle-controls-left-column">
                    {channelsButtons.map((button) => (
                      <Button
                        key={button.id}
                        onClick={() => handleChannelButtonClick(button.id)}
                        className={`middle-control-button ${
                          button.isActive ? "active" : ""
                        }`}
                      >
                        {button.label}
                      </Button>
                    ))}
                  </div>
                  <div className="middle-controls-separator"></div>
                  <div className="middle-controls-right-column">
                    {pButtons.map((button) => (
                      <Button
                        key={button.id}
                        onClick={() => handlePButtonClick(button.id)}
                        className={`middle-control-button p-button ${
                          button.isActive ? "active" : ""
                        }`}
                      >
                        {button.label}
                      </Button>
                    ))}
                  </div>
                </div>
                <div style={{ marginTop: "15px" }}>
                  <Input
                    placeholder="Enter Amount"
                    value={amountInput}
                    onChange={handleAmountInputChange}
                    onBlur={handleAmountInputBlur}
                    style={{ width: "100%", height: "40px" }}
                  />
                </div>
              </Col>
            </Row>
            <Row style={{ marginTop: "15px" }}>
              <Col span={24}>
                <Button
                  onClick={handleEnterClick}
                  className="antd-calc-button antd-calc-button-enter"
                  block
                >
                  Enter
                </Button>
              </Col>
            </Row>
          </Col>
          <Col span={12}>
            <div className="entered-numbers-table">
              <h2>Entered Data</h2>
              <Table
                dataSource={enteredNumbers}
                columns={columns}
                pagination={false}
                size="small"
                scroll={{ y: 200 }}
              />
            </div>
          </Col>
        </Row>
      </div>
    </AntApp>
  );
}

export default App;
