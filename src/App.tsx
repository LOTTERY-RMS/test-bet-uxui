import { useCallback, useState, useEffect } from "react";
import { Button, Row, Col, Table, Input, App as AntApp, Select } from "antd";
import type { ColumnsType } from "antd/es/table";
import "antd/dist/reset.css";
import "./App.css"; // Global styles

// Import the CalculatorPad component
import CalculatorPad from "./components/CalculatorPad/CalculatorPad";

const { Option } = Select;

// Define interfaces for your data structures
interface ChannelButton {
  id: string;
  label: string;
  isActive: boolean;
  conflictsWith?: string[];
  multipliers: { "2D": number; "3D": number }; // Changed to an object
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
  channels: string[]; // This will now store channel IDs to allow multiplier lookup
  amount: string;
  totalAmount: string;
  syntaxType: "2D" | "3D"; // Ensure this is strictly typed
  currency: string;
  totalMultiplier: number; // Added to store the calculated total multiplier
}

interface ServerTime {
  id: string;
  label: string;
  channels: ChannelButton[];
  pButtons: PButton[];
}

interface Server {
  id: string;
  label: string;
  times: ServerTime[];
}

// Regex for valid FINAL input patterns (used in handleEnterClick)
const VALID_FINAL_INPUT_REGEX = /^(\d{2}|\d{3})[X>]?$/;

function App() {
  const [input, setInput] = useState<string>(""); // State for calculator display
  const [enteredNumbers, setEnteredNumbers] = useState<EnteredNumber[]>([]);
  const [amountInput, setAmountInput] = useState<string>("");
  const [selectedServer, setSelectedServer] = useState<string | undefined>(
    undefined
  );
  const [selectedServerTime, setSelectedServerTime] = useState<
    string | undefined
  >(undefined);
  const [selectedCurrency, setSelectedCurrency] = useState<string>("USD");

  const { message } = AntApp.useApp();

  const [channelsButtons, setChannelsButtons] = useState<ChannelButton[]>([]);
  const [pButtons, setPButtons] = useState<PButton[]>([]);
  const [servers, setServers] = useState<Server[]>([]); // State to hold servers data

  // Fetch servers data from JSON on component mount
  useEffect(() => {
    fetch("/data/servers.json") // Assumes servers.json is in the public/data directory
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => setServers(data))
      .catch((error) =>
        message.error("Failed to load server data: " + error.message)
      );
  }, [message]);

  // Effect to update channels and p-buttons when server time changes
  useEffect(() => {
    if (selectedServer && selectedServerTime && servers.length > 0) {
      const server = servers.find((s) => s.id === selectedServer);
      const time = server?.times.find((t) => t.id === selectedServerTime);
      if (time) {
        // Reset active state for buttons when server time changes
        setChannelsButtons(
          time.channels.map((channel) => ({ ...channel, isActive: false }))
        );
        setPButtons(
          time.pButtons.map((pBtn) => ({ ...pBtn, isActive: false }))
        );
      }
    } else {
      // Clear buttons if no server or server time is selected
      setChannelsButtons([]);
      setPButtons([]);
    }
  }, [selectedServer, selectedServerTime, servers]); // Add servers to dependency array

  /**
   * Callback for CalculatorPad to update the main input state.
   * This replaces the direct handleNumberClick in App.tsx.
   */
  const handleCalculatorInputChange = useCallback((newInput: string) => {
    setInput(newInput);
  }, []);

  /**
   * Handles changes in the amount input field.
   * Allows only valid numerical input (including decimals).
   */
  const handleAmountInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Regex to allow only numbers and a single decimal point
    if (/^\d*\.?\d*$/.test(value) || value === "") {
      setAmountInput(value);
    }
  };

  /**
   * Handles the blur event for the amount input field.
   * Formats the amount to two decimal places or clears if invalid.
   */
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

  /**
   * Handles the "Enter" button click.
   * Validates all inputs (number, channels, amount, server, time, currency)
   * Calculates total amount and adds the entry to the table.
   * Resets input fields and selected buttons.
   */
  const handleEnterClick = () => {
    // Basic validations
    if (input.trim() === "") {
      message.error("Please enter a number before pressing Enter.");
      return;
    }

    const selectedActiveChannels = channelsButtons.filter(
      (button) => button.isActive
    );

    if (!VALID_FINAL_INPUT_REGEX.test(input)) {
      message.error(
        "Invalid number format. Please follow ##, ###, ##X, ##>, ###X, or ###>."
      );
      return;
    }

    if (selectedActiveChannels.length === 0) {
      message.error(
        "Please select at least one channel (A, B, C, D, Ho, I, N, Lo, etc.) to proceed."
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

    // New validations for server, server time, and currency
    if (!selectedServer || !selectedServerTime || !selectedCurrency) {
      message.error("Please select Server, Server Time, and Currency.");
      return;
    }

    // Determine syntax type (2D or 3D)
    let syntaxType: "2D" | "3D" = "2D"; // Default to 2D
    const digitsPart = input.replace(/[X>]/, ""); // Remove X or > to get just the digits
    if (digitsPart.length === 2) {
      syntaxType = "2D";
    } else if (digitsPart.length === 3) {
      syntaxType = "3D";
    }

    // Calculate total multiplier first
    let totalMultiplier = 0;
    selectedActiveChannels.forEach((channel) => {
      totalMultiplier += channel.multipliers[syntaxType];
    });

    // Calculate total amount using the summed multiplier
    const calculatedTotalAmount = parsedAmount * totalMultiplier;

    // Store channel IDs in the enteredNumbers state for easier lookup later
    const selectedChannelIdsArray = selectedActiveChannels.map(
      (button) => button.id
    );

    // Add the new entry to the table data
    setEnteredNumbers((prevNumbers) => [
      ...prevNumbers,
      {
        key: prevNumbers.length, // Unique key for table row
        value: input,
        channels: selectedChannelIdsArray, // Store channel IDs
        amount: parsedAmount.toFixed(2),
        totalAmount: calculatedTotalAmount.toFixed(2),
        syntaxType: syntaxType,
        currency: selectedCurrency, // Store the selected currency
        totalMultiplier: totalMultiplier, // Store the calculated total multiplier
      },
    ]);

    // // Reset input fields and button states after successful entry
    // setInput("");
    // setAmountInput("");
    // setChannelsButtons((prev) =>
    //   prev.map((btn) => ({ ...btn, isActive: false }))
    // );
    // setPButtons((prev) => prev.map((btn) => ({ ...btn, isActive: false })));
  };

  /**
   * Handles clicks on channel buttons (A, B, C, D, Ho, I, N, Lo).
   * Toggles their active state and handles conflicts (e.g., Lo conflicts with A, B, C, D).
   * Deactivates all P buttons when a channel button is clicked.
   */
  const handleChannelButtonClick = (clickedId: string) => {
    // Deactivate all P buttons when a channel button is clicked
    setPButtons((prevPButtons) =>
      prevPButtons.map((button) => ({ ...button, isActive: false }))
    );

    setChannelsButtons((prevChannelsButtons) => {
      const clickedButton = prevChannelsButtons.find(
        (button) => button.id === clickedId
      );

      if (!clickedButton) return prevChannelsButtons; // Should not happen

      // If the clicked button is already active, deactivate it
      if (clickedButton.isActive) {
        return prevChannelsButtons.map((button) =>
          button.id === clickedId ? { ...button, isActive: false } : button
        );
      }

      // Determine which buttons conflict with the clicked button
      const conflictsToDeactivate = clickedButton.conflictsWith || [];

      // Update button states: activate clicked, deactivate conflicts
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

  /**
   * Handles clicks on P buttons (4P, 5P, 6P, 7P).
   * Activates the clicked P button and deactivates others.
   * Automatically activates associated channel buttons.
   */
  const handlePButtonClick = (clickedId: string) => {
    setPButtons((prevPButtons) => {
      const clickedPButton = prevPButtons.find(
        (button) => button.id === clickedId
      );

      if (!clickedPButton) return prevPButtons; // Should not happen

      // If the clicked P button is already active, deactivate it and all channels
      if (clickedPButton.isActive) {
        setChannelsButtons((prevChannels) =>
          prevChannels.map((channel) => ({ ...channel, isActive: false }))
        );
        return prevPButtons.map((button) => ({ ...button, isActive: false }));
      }

      // Activate the clicked P button and deactivates others
      const updatedPButtons = prevPButtons.map((button) => ({
        ...button,
        isActive: button.id === clickedId,
      }));

      // Activate channels associated with the clicked P button
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

  /**
   * Handles server selection change. Resets server time.
   */
  const handleServerChange = (value: string) => {
    setSelectedServer(value);
    setSelectedServerTime(undefined); // Reset server time when server changes
  };

  /**
   * Handles server time selection change.
   */
  const handleServerTimeChange = (value: string) => {
    setSelectedServerTime(value);
  };

  /**
   * Handles currency selection change.
   */
  const handleCurrencyChange = (value: string) => {
    setSelectedCurrency(value);
  };

  // Column definitions for the Ant Design Table
  const columns: ColumnsType<EnteredNumber> = [
    {
      title: "No.",
      dataIndex: "key",
      key: "key",
      render: (text, record, index) => index + 1,
      width: "5%",
    },
    {
      title: "Entered Number",
      dataIndex: "value",
      key: "value",
      width: "18%",
    },
    {
      title: "Syntax",
      dataIndex: "syntaxType",
      key: "syntaxType",
      width: "9%",
    },
    {
      title: "Currency",
      dataIndex: "currency",
      key: "currency",
      width: "10%",
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      width: "10%",
    },
    {
      title: "Channels",
      dataIndex: "channels",
      key: "channels",
      width: "23%",
      render: (channelIds: string[], record) => {
        // Find the current server and time to get the correct channel definitions
        const currentServer = servers.find((s) => s.id === selectedServer);
        const currentServerTimeData = currentServer?.times.find(
          (t) => t.id === selectedServerTime
        );
        return channelIds
          .map((channelId) => {
            const channel = currentServerTimeData?.channels.find(
              (c) => c.id === channelId
            );
            if (channel) {
              // Display only the multiplier relevant to the row's syntaxType
              return `${channel.label} (${
                channel.multipliers[record.syntaxType]
              })`;
            }
            return channelId; // Fallback if channel data not found
          })
          .join(", ");
      },
    },
    {
      title: "Multiplier", // New Multiplier column
      dataIndex: "totalMultiplier", // Now directly use the stored totalMultiplier
      key: "totalMultiplier",
      width: "10%",
    },
    {
      title: "Total Amount",
      dataIndex: "totalAmount",
      key: "totalAmount",
      width: "25%",
    },
  ];

  // Dynamically get available server times based on selected server
  const availableServerTimes = selectedServer
    ? servers.find((s) => s.id === selectedServer)?.times || []
    : [];

  return (
    <AntApp>
      <div className="container">
        <Row gutter={[20, 20]} style={{ width: "100%" }}>
          {/* Left Column: Calculator and Input */}
          <Col span={10}>
            <Row gutter={[10, 10]}>
              {/* Right Column within Left Section: Server, Time, Channels, P-Buttons, Amount, Currency */}
              <Col span={10}>
                {/* Server and Server Time Selectors */}
                <div style={{ marginBottom: "15px" }}>
                  <Select
                    placeholder="Select Server"
                    style={{ width: "100%", marginBottom: "10px" }}
                    onChange={handleServerChange}
                    value={selectedServer}
                  >
                    {servers.map((server) => (
                      <Option key={server.id} value={server.id}>
                        {server.label}
                      </Option>
                    ))}
                  </Select>
                  <Select
                    placeholder="Select Server Time"
                    style={{ width: "100%" }}
                    onChange={handleServerTimeChange}
                    value={selectedServerTime}
                    disabled={!selectedServer}
                  >
                    {availableServerTimes.map((time) => (
                      <Option key={time.id} value={time.id}>
                        {time.label}
                      </Option>
                    ))}
                  </Select>
                </div>

                {/* Channel and P Buttons Container */}
                <div className="middle-controls-container">
                  <div className="middle-controls-left-column">
                    {channelsButtons.map((button) => (
                      <Button
                        key={button.id}
                        onClick={() => handleChannelButtonClick(button.id)}
                        className={`middle-control-button ${
                          button.isActive ? "active" : ""
                        }`}
                        disabled={!selectedServerTime}
                      >
                        {button.label} ({button.multipliers["2D"]},
                        {button.multipliers["3D"]})
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
                        disabled={!selectedServerTime}
                      >
                        {button.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Amount Input and Currency Selector */}
              </Col>
              <Col span={14}>
                {/* Use the new CalculatorPad component here */}
                <CalculatorPad
                  input={input}
                  onInputChange={handleCalculatorInputChange}
                />
                <div style={{ marginTop: "15px" }}>
                  <Row>
                    <Col span={19}>
                      <Input
                        placeholder="Enter Amount"
                        value={amountInput}
                        onChange={handleAmountInputChange}
                        onBlur={handleAmountInputBlur}
                        style={{
                          width: "100%",
                        }}
                        disabled={!selectedServerTime}
                      />
                    </Col>
                    <Col span={5}>
                      <Select
                        placeholder="Select Currency"
                        style={{
                          width: "100%",
                          marginLeft: "5px",
                        }}
                        onChange={handleCurrencyChange}
                        value={selectedCurrency}
                      >
                        <Option value="USD">USD</Option>
                        <Option value="KHR">KHR</Option>
                      </Select>
                    </Col>
                  </Row>
                </div>
              </Col>
            </Row>
            {/* Enter Button */}
            <Row style={{ marginTop: "15px" }}>
              <Col span={24}>
                <Button
                  onClick={handleEnterClick}
                  className="antd-calc-button-enter"
                  block
                  disabled={!selectedServerTime}
                >
                  Enter
                </Button>
              </Col>
            </Row>
          </Col>

          {/* Right Column: Entered Data Table */}
          <Col span={14}>
            <div className="entered-numbers-table">
              <h2>Entered Data</h2>
              <Table
                dataSource={enteredNumbers}
                columns={columns}
                pagination={false}
                size="small"
                scroll={{ y: 550 }}
              />
            </div>
          </Col>
        </Row>
      </div>
    </AntApp>
  );
}

export default App;
