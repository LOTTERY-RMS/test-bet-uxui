import { useCallback, useState, useEffect } from "react";
import {
  Button,
  Row,
  Col,
  Table,
  Input,
  App as AntApp,
  Select,
  Tooltip,
} from "antd";
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
  value: string; // e.g., "51X", "123", "12>Range Right"
  channels: string[]; // This will still store channel IDs
  displayChannels: string[]; // New: to store pre-formatted channel strings for display
  amount: string;
  totalAmount: string;
  syntaxType: "2D" | "3D"; // Ensure this is strictly typed
  currency: string;
  totalMultiplier: number; // Added to store the calculated total multiplier
  numberOfCombinations: number; // New: To store the count of combinations
  combinedNumbers: string[]; // Storing combined numbers for tooltip display
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

// Define the valid final input patterns (consistent with CalculatorPad.tsx)
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

/**
 * Checks if a final input string matches any of the allowed final patterns.
 * @param finalInput The string to check.
 * @returns True if it matches a final pattern, false otherwise.
 */
const isFinalInputValid = (finalInput: string): boolean => {
  return VALID_FINAL_INPUT_PATTERNS.some((regex) => regex.test(finalInput));
};

/**
 * Helper function to generate permutations for two digits.
 * For "12", returns ["12", "21"]. For "11", returns ["11"].
 * @param numStr The two-digit number string.
 * @returns An array of unique permutations.
 */
const getTwoDigitPermutations = (numStr: string): string[] => {
  if (numStr.length !== 2) return [numStr];
  const [d1, d2] = numStr.split("");
  if (d1 === d2) return [numStr]; // No distinct permutations for '11'
  return [numStr, d2 + d1];
};

/**
 * Helper function to generate permutations for three digits.
 * For "123", returns ["123", "132", "213", "231", "312", "321"].
 * Handles duplicate digits correctly (e.g., "112" returns "112", "121", "211").
 * @param numStr The three-digit number string.
 * @returns An array of unique permutations.
 */
const getThreeDigitPermutations = (numStr: string): string[] => {
  if (numStr.length !== 3) return [numStr];
  const chars = numStr.split("");
  const result: string[] = [];

  const permute = (arr: string[], memo: string[] = []) => {
    let cur;
    const memoized = memo;
    for (let i = 0; i < arr.length; i++) {
      cur = arr.splice(i, 1);
      if (arr.length === 0) {
        result.push(memoized.concat(cur).join(""));
      }
      permute(arr.slice(), memoized.concat(cur));
      arr.splice(i, 0, cur[0]);
    }
    return Array.from(new Set(result)); // Ensure unique permutations
  };
  return permute(chars);
};

/**
 * Generates combinations for 3-digit numbers based on range.
 * @param startDigits The starting 3-digit number string.
 * @param endDigits Optional. The ending 3-digit number string for compound ranges. If undefined, implies "start to 999".
 * @returns An array of combined number strings.
 */
const getRangeCombinations = (
  startDigits: string,
  endDigits: string,
  digit: number
): string[] => {
  const result: string[] = [];
  const startNum = parseInt(startDigits, 10);
  const endNum = parseInt(endDigits, 10);

  if (
    isNaN(startNum) ||
    startDigits.length !== digit ||
    isNaN(endNum) ||
    endDigits.length !== digit
  )
    return [];

  if (startNum > endNum) {
    return [];
  }
  for (let i = startNum; i <= endNum; i++) {
    result.push(i.toString().padStart(digit, "0"));
  }

  return Array.from(new Set(result));
};

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
    fetch("data/servers.json") // Assumes servers.json is in the public/data directory
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
   * This now simply updates the input. Validation is handled by CalculatorPad.
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

    // Using the isFinalInputValid function here
    if (!isFinalInputValid(input)) {
      message.error(
        "Invalid number format. Please follow ##, ###, ##X, ###X, ##>, ###>, ###>###, ##>##, ###~###, or ##~##."
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

    // Determine syntax type (2D or 3D), combined numbers, and number of combinations
    let syntaxType: "2D" | "3D";
    let combinedNumbers: string[] = [];
    let numberOfCombinations = 1;

    // Check for 'X' suffix
    if (input.endsWith("X")) {
      const digitsPart = input.slice(0, -1);
      if (digitsPart.length === 2) {
        syntaxType = "2D";
        combinedNumbers = getTwoDigitPermutations(digitsPart);
      } else if (digitsPart.length === 3) {
        syntaxType = "3D";
        combinedNumbers = getThreeDigitPermutations(digitsPart);
      } else {
        message.error("Invalid number format for permutation.");
        return;
      }
      numberOfCombinations = combinedNumbers.length;
    }
    // Check '~' suffix (simple or compound range)
    else if (input.includes("~")) {
      const separator = "~";
      const parts = input.split(separator);
      const startDigits = parts[0];
      const endDigits = parts[1]; // If no second part, it's a simple '>' or '~' range

      if (startDigits.length === 2 && endDigits.length === 2) {
        syntaxType = "2D";
        combinedNumbers = getRangeCombinations(startDigits, endDigits, 2);
      } else if (startDigits.length === 3 && endDigits.length === 3) {
        syntaxType = "3D";
        combinedNumbers = getRangeCombinations(startDigits, endDigits, 3);
      } else {
        message.error("Invalid number format for range.");
        return;
      }

      if (combinedNumbers.length === 0) {
        message.error(
          "Invalid range specified or start number is greater than end number, or an invalid type of range for 2-digit numbers."
        );
        return;
      }
      numberOfCombinations = combinedNumbers.length;
    }
    // Plain numbers
    else {
      const digitsPart = input;
      if (digitsPart.length === 2) {
        syntaxType = "2D";
        combinedNumbers = [digitsPart];
        numberOfCombinations = 1;
      } else if (digitsPart.length === 3) {
        syntaxType = "3D";
        combinedNumbers = [digitsPart];
        numberOfCombinations = 1;
      } else {
        message.error("Invalid number format based on digit count.");
        return;
      }
    }

    // Calculate total multiplier first
    let totalMultiplier = 0;
    const displayChannelsArray: string[] = []; // Array to store formatted channel strings

    selectedActiveChannels.forEach((channel) => {
      const multiplier = channel.multipliers[syntaxType];
      totalMultiplier += multiplier;
      // Store the full formatted string for tooltip, and just the label for for main display
      displayChannelsArray.push(
        `${channel.label} (${syntaxType}x${multiplier})`
      );
    });

    // Calculate total amount using the summed multiplier and number of combinations
    const calculatedTotalAmount =
      parsedAmount * totalMultiplier * numberOfCombinations;

    // Store channel IDs in the enteredNumbers state for easier lookup later
    const selectedChannelIdsArray = selectedActiveChannels.map(
      (button) => button.id
    );

    // Add the new entry to the table data
    setEnteredNumbers((prevNumbers) => [
      ...prevNumbers,
      {
        key: prevNumbers.length, // Unique key for table row
        value: input, // Store the original input string (e.g., "12>Range Right")
        channels: selectedChannelIdsArray, // Store channel IDs
        displayChannels: displayChannelsArray, // Store the pre-formatted display string
        amount: parsedAmount.toFixed(2),
        totalAmount: calculatedTotalAmount.toFixed(2),
        syntaxType: syntaxType,
        currency: selectedCurrency, // Store the selected currency
        totalMultiplier: totalMultiplier, // Store the calculated total multiplier
        numberOfCombinations: numberOfCombinations,
        combinedNumbers: combinedNumbers, // Store the number of combinations
      },
    ]);

    // Reset input fields and button states after successful entry
    setInput("");
    // setAmountInput(""); // Uncomment if you want to clear amount after entry
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
      render: (_text, _record, index) => index + 1,
      width: "5%",
    },
    {
      title: "Entered Number",
      key: "value",
      width: "18%",
      render: (_text, record) => {
        // record.value directly holds "12", "12X", "12>", "12>34"
        const displayNum = record.value;

        // Only show tooltip if there are combinations (i.e., 'X' or '>' or '~' was used)
        if (record.numberOfCombinations > 1) {
          return (
            <Tooltip
              title={
                <div style={{ whiteSpace: "pre-line" }}>
                  {record.combinedNumbers.join(", ")}
                </div>
              }
            >
              <span>{displayNum} </span>
              <span style={{ color: "#1890ff" }}>
                ({record.numberOfCombinations})
              </span>
            </Tooltip>
          );
        }
        return <span>{displayNum}</span>;
      },
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
      dataIndex: "channels", // Keep dataIndex as 'channels' (IDs)
      key: "channels",
      width: "23%",
      render: (channelIds: string[], record) => {
        // Map channel IDs to their labels for display in the cell
        const channelLabels = channelIds
          .map((channelId) => {
            // Find the actual channel label from the current channelsButtons state
            const channel = channelsButtons.find((c) => c.id === channelId);
            return channel ? channel.label : channelId;
          })
          .join(", ");

        // Use Tooltip to show the full displayChannels, now wrapping the labels directly
        return (
          <Tooltip
            title={
              <div style={{ whiteSpace: "pre-line" }}>
                {record.displayChannels.join("\n")}
              </div>
            }
          >
            <span>{channelLabels} </span>
            {/* Add the total multiplier in blue and wrap it in the tooltip */}
            <span style={{ color: "#1890ff" }}>({record.totalMultiplier})</span>
          </Tooltip>
        );
      },
    },
    {
      title: "Multiplier", // New Multiplier column
      dataIndex: "totalMultiplier",
      key: "totalMultiplier",
      width: "10%",
      render: (_text, record) => {
        return record.numberOfCombinations > 1
          ? `${record.numberOfCombinations} x ${record.totalMultiplier}`
          : record.totalMultiplier;
      },
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
