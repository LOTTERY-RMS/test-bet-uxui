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
  Modal, // Import Modal for custom messages
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
  rangeType?: string; // New: To store the selected range type
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

// Regex for valid FINAL input patterns: ##, ###, ##X, ##>, ###X, ###>
const VALID_FINAL_INPUT_REGEX = /^(\d{2}|\d{3})(X|>.*)?$/;
const RANGE_INPUT_REGEX = /^(\d{2}|\d{3})>(.*)$/; // Regex to extract digits and range type

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
 * Generates combinations based on the selected range type for 2-digit numbers.
 * @param digits The 2-digit number string.
 * @param rangeType The selected range type (e.g., "Right", "Left").
 * @returns An array of combined number strings.
 */
const getTwoDigitRangeCombinations = (digits: string, rangeType: string): string[] => {
  if (digits.length !== 2) return [digits];
  const d1 = parseInt(digits[0]);
  const d2 = parseInt(digits[1]);
  const result: string[] = [];

  switch (rangeType) {
    case "កន្ទុយ": // Example: 10> -> 10, 11, ..., 19 (Fix first digit, vary second)
      for (let i = d2; i <= 9; i++) {
        result.push(`${d1}${i}`);
      }
      return result;
    case "ក្បាល": // Example: 01> -> 01, 11, ..., 91 (Fix second digit, vary first)
      for (let i = d1; i <= 9; i++) {
        result.push(`${i}${d2}`);
      }
      return result;
    default:
      return [digits];
  }
};

/**
 * Generates combinations based on the selected range type for 3-digit numbers.
 * @param digits The 3-digit number string.
 * @param rangeType The selected range type.
 * @returns An array of combined number strings.
 */
const getThreeDigitRangeCombinations = (digits: string, rangeType: string): string[] => {
  if (digits.length !== 3) return [digits];
  const d1 = parseInt(digits[0]);
  const d2 = parseInt(digits[1]);
  const d3 = parseInt(digits[2]);
  const result: string[] = [];
  console.log(rangeType, "Range Type");
  switch (rangeType) {
    case "កន្ទុយ": // Fix first two (d1, d2), vary third (d3 to 9)
      for (let i = d3; i <= 9; i++) {
        result.push(`${d1}${d2}${i}`);
      }
      break;
    case "ក្បាល": // Fix last two (d2, d3), vary first (d1 to 9)
      for (let i = d1; i <= 9; i++) {
        result.push(`${i}${d2}${d3}`);
      }
      break;
    case "កណ្ដាល": // Fix first and third (d1, d3), vary second (d2 to 9)
      for (let i = d2; i <= 9; i++) {
        result.push(`${d1}${i}${d3}`);
      }
      break;
    case "កណ្ដាល + កន្ទុយ": // Fix first (d1), vary middle (d2 to 9) and right (d3 to 9)
      for (let i = d2; i <= 9; i++) {
        for (let j = d3; j <= 9; j++) {
          result.push(`${d1}${i}${j}`);
        }
      }
      break;
    case "ក្បាល + កណ្ដាល": // Fix third (d3), vary left (d1 to 9) and middle (d2 to 9)
      for (let i = d1; i <= 9; i++) {
        for (let j = d2; j <= 9; j++) {
          result.push(`${i}${j}${d3}`);
        }
      }
      break;
    case "ក្បាល + កន្ទុយ": // Fix middle (d2), vary left (d1 to 9) and right (d3 to 9)
      for (let i = d1; i <= 9; i++) {
        for (let j = d3; j <= 9; j++) {
          result.push(`${i}${d2}${j}`);
        }
      }
      break;
    default:
      result.push(digits);
  }
  return Array.from(new Set(result)); // Ensure uniqueness for combined ranges
};

/**
 * Determines available range options based on digits and syntax type,
 * considering the presence and position of '0'.
 * @param digits The number string (2 or 3 digits).
 * @param syntaxType "2D" or "3D".
 * @returns An array of { label, value } for Select options.
 */
const getRangeOptions = (digits: string, syntaxType: "2D" | "3D"): { label: string; value: string }[] => {
  const options: { label: string; value: string }[] = [];

  if (syntaxType === "2D") {
    const hasZeroLeft = digits[0] === "0";
    const hasZeroRight = digits[1] === "0";

    if (hasZeroLeft) {
      // e.g., 01
      options.push({ label: "ក្បាល", value: "ក្បាល" });
    }
    if (hasZeroRight) {
      // e.g., 10
      options.push({ label: "កន្ទុយ", value: "កន្ទុយ" });
    }
  } else if (syntaxType === "3D") {
    const hasZeroLeft = digits[0] === "0";
    const hasZeroMiddle = digits[1] === "0";
    const hasZeroRight = digits[2] === "0";

    // Build options based on which positions have a '0'
    if (hasZeroLeft) {
      options.push({ value: "ក្បាល", label: "ក្បាល" });
    }
    if (hasZeroRight) {
      options.push({ value: "កន្ទុយ", label: "កន្ទុយ" });
    }
    if (hasZeroMiddle) {
      options.push({ value: "កណ្ដាល", label: "កណ្ដាល" });
    }
    if (hasZeroLeft && hasZeroMiddle) {
      options.push({
        value: "ក្បាល + កណ្ដាល",
        label: "ក្បាល + កណ្ដាល",
      });
    }
    if (hasZeroLeft && hasZeroRight) {
      options.push({
        value: "ក្បាល + កន្ទុយ",
        label: "ក្បាល + កន្ទុយ",
      });
    }
    if (hasZeroMiddle && hasZeroRight) {
      options.push({
        value: "កណ្ដាល + កន្ទុយ",
        label: "កណ្ដាល + កន្ទុយ",
      });
    }
  }
  return Array.from(new Set(options)); // Ensure unique options
};

function App() {
  const [input, setInput] = useState<string>(""); // State for calculator display
  const [enteredNumbers, setEnteredNumbers] = useState<EnteredNumber[]>([]);
  const [amountInput, setAmountInput] = useState<string>("");
  const [selectedServer, setSelectedServer] = useState<string | undefined>(undefined);
  const [selectedServerTime, setSelectedServerTime] = useState<string | undefined>(undefined);
  const [selectedCurrency, setSelectedCurrency] = useState<string>("USD");

  const { message } = AntApp.useApp();

  const [channelsButtons, setChannelsButtons] = useState<ChannelButton[]>([]);
  const [pButtons, setPButtons] = useState<PButton[]>([]);
  const [servers, setServers] = useState<Server[]>([]); // State to hold servers data

  // New states for Range dropdown
  const [showRangeModal, setShowRangeModal] = useState<boolean>(false);
  const [currentDigitsForRange, setCurrentDigitsForRange] = useState<string>("");
  const [availableRangeOptions, setAvailableRangeOptions] = useState<{ label: string; value: string }[]>([]);
  const [tempSelectedRange, setTempSelectedRange] = useState<string | undefined>(undefined);

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
      .catch((error) => message.error("Failed to load server data: " + error.message));
  }, [message]);

  // Effect to update channels and p-buttons when server time changes
  useEffect(() => {
    if (selectedServer && selectedServerTime && servers.length > 0) {
      const server = servers.find((s) => s.id === selectedServer);
      const time = server?.times.find((t) => t.id === selectedServerTime);
      if (time) {
        // Reset active state for buttons when server time changes
        setChannelsButtons(time.channels.map((channel) => ({ ...channel, isActive: false })));
        setPButtons(time.pButtons.map((pBtn) => ({ ...pBtn, isActive: false })));
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
  const handleCalculatorInputChange = useCallback(
    (newInput: string) => {
      // If the new input ends with '>', trigger the range modal
      if (newInput.endsWith(">") && newInput.length > 1 && !newInput.includes("X")) {
        const digits = newInput.slice(0, -1); // Get digits before '>'
        const syntaxType = digits.length === 2 ? "2D" : digits.length === 3 ? "3D" : undefined;

        if (syntaxType) {
          const options = getRangeOptions(digits, syntaxType);

          if (options.length === 0) {
            message.error(`No range options available for "${digits}".`);
            setInput(digits); // Revert input to just digits
            return;
          } else if (options.length === 1) {
            // Automatically select the single option
            setInput(`${digits}>${options[0].value}`);
            return;
          } else {
            // More than one option, show modal
            setCurrentDigitsForRange(digits);
            setAvailableRangeOptions(options);
            setTempSelectedRange(undefined); // Reset temp selection
            setShowRangeModal(true);
            setInput(digits); // Set input back to just digits, will be updated after selection
            return;
          }
        }
      }
      setInput(newInput);
    },
    [message]
  ); // Added 'message' to dependencies

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

    const selectedActiveChannels = channelsButtons.filter((button) => button.isActive);

    if (!VALID_FINAL_INPUT_REGEX.test(input)) {
      message.error("Invalid number format. Please follow ##, ###, ##X, ##>, ###X, or ###>.");
      return;
    }

    if (selectedActiveChannels.length === 0) {
      message.error("Please select at least one channel (A, B, C, D, Ho, I, N, Lo, etc.) to proceed.");
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
    let digitsPart: string;
    let combinedNumbers: string[] = [];
    let numberOfCombinations = 1;
    let selectedRangeType: string | undefined = undefined;

    const rangeMatch = input.match(RANGE_INPUT_REGEX);
    console.log("Range Match:", rangeMatch);

    if (rangeMatch) {
      digitsPart = rangeMatch[1];
      selectedRangeType = rangeMatch[2]; // e.g., "Right"

      if (digitsPart.length === 2) {
        syntaxType = "2D";
        combinedNumbers = getTwoDigitRangeCombinations(digitsPart, selectedRangeType);
        numberOfCombinations = combinedNumbers.length;
      } else if (digitsPart.length === 3) {
        syntaxType = "3D";
        combinedNumbers = getThreeDigitRangeCombinations(digitsPart, selectedRangeType);
        numberOfCombinations = combinedNumbers.length;
      } else {
        message.error("Invalid number format for based on digit count.");
        return;
      }
    } else {
      // Handle 'X' or plain numbers
      digitsPart = input.replace(/[X>]/, ""); // Remove 'X' or potential leftover '>'
      if (digitsPart.length === 2) {
        syntaxType = "2D";
        if (input.endsWith("X")) {
          combinedNumbers = getTwoDigitPermutations(digitsPart);
          numberOfCombinations = combinedNumbers.length;
        } else {
          // Plain 2-digit number
          combinedNumbers = [digitsPart];
          numberOfCombinations = 1;
        }
      } else if (digitsPart.length === 3) {
        syntaxType = "3D";
        if (input.endsWith("X")) {
          combinedNumbers = getThreeDigitPermutations(digitsPart);
          numberOfCombinations = combinedNumbers.length;
        } else {
          // Plain 3-digit number
          combinedNumbers = [digitsPart];
          numberOfCombinations = 1;
        }
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
      displayChannelsArray.push(`${channel.label} (${syntaxType}x${multiplier})`);
    });

    // Calculate total amount using the summed multiplier and number of combinations
    const calculatedTotalAmount = parsedAmount * totalMultiplier * numberOfCombinations;

    // Store channel IDs in the enteredNumbers state for easier lookup later
    const selectedChannelIdsArray = selectedActiveChannels.map((button) => button.id);

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
        rangeType: selectedRangeType, // Store the selected type
      },
    ]);

    // Reset input fields and button states after successful entry
    setInput("");
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
    setPButtons((prevPButtons) => prevPButtons.map((button) => ({ ...button, isActive: false })));

    setChannelsButtons((prevChannelsButtons) => {
      const clickedButton = prevChannelsButtons.find((button) => button.id === clickedId);

      if (!clickedButton) return prevChannelsButtons; // Should not happen

      // If the clicked button is already active, deactivate it
      if (clickedButton.isActive) {
        return prevChannelsButtons.map((button) => (button.id === clickedId ? { ...button, isActive: false } : button));
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
      const clickedPButton = prevPButtons.find((button) => button.id === clickedId);

      if (!clickedPButton) return prevPButtons; // Should not happen

      // If the clicked P button is already active, deactivate it and all channels
      if (clickedPButton.isActive) {
        setChannelsButtons((prevChannels) => prevChannels.map((channel) => ({ ...channel, isActive: false })));
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
        // Determine the display value for the number
        let displayNum = record.value;
        if (record.rangeType) {
          // If it's a range, display "digits>RangeType"
          const digits = record.value.split(">")[0];
          displayNum = `${digits}> (${record.rangeType})`;
        }

        // Only show tooltip if there are combinations (i.e., 'X' or was used)
        if (record.numberOfCombinations > 1) {
          return (
            <Tooltip title={<div style={{ whiteSpace: "pre-line" }}>{record.combinedNumbers.join(", ")}</div>}>
              <span>{displayNum} </span>
              <span style={{ color: "#1890ff" }}>({record.numberOfCombinations})</span>
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
          <Tooltip title={<div style={{ whiteSpace: "pre-line" }}>{record.displayChannels.join("\n")}</div>}>
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
        return record.numberOfCombinations > 1 ? `${record.numberOfCombinations} x ${record.totalMultiplier}` : record.totalMultiplier;
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
  const availableServerTimes = selectedServer ? servers.find((s) => s.id === selectedServer)?.times || [] : [];

  const handleRangeModalOk = () => {
    if (tempSelectedRange) {
      // Update the main input with the selected range
      setInput(`${currentDigitsForRange}>${tempSelectedRange}`);
      setShowRangeModal(false);
    } else {
      message.error("Please select a option.");
    }
  };

  const handleRangeModalCancel = () => {
    setShowRangeModal(false);
    // Optionally clear the input if the user cancels selection
    // setInput("");
  };

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
                  <Select placeholder="Select Server" style={{ width: "100%", marginBottom: "10px" }} onChange={handleServerChange} value={selectedServer}>
                    {servers.map((server) => (
                      <Option key={server.id} value={server.id}>
                        {server.label}
                      </Option>
                    ))}
                  </Select>
                  <Select placeholder="Select Server Time" style={{ width: "100%" }} onChange={handleServerTimeChange} value={selectedServerTime} disabled={!selectedServer}>
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
                      <Button key={button.id} onClick={() => handleChannelButtonClick(button.id)} className={`middle-control-button ${button.isActive ? "active" : ""}`} disabled={!selectedServerTime}>
                        {button.label} ({button.multipliers["2D"]},{button.multipliers["3D"]})
                      </Button>
                    ))}
                  </div>
                  <div className="middle-controls-separator"></div>
                  <div className="middle-controls-right-column">
                    {pButtons.map((button) => (
                      <Button
                        key={button.id}
                        onClick={() => handlePButtonClick(button.id)}
                        className={`middle-control-button p-button ${button.isActive ? "active" : ""}`}
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
                <CalculatorPad input={input} onInputChange={handleCalculatorInputChange} />
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
                <Button onClick={handleEnterClick} className="antd-calc-button-enter" block disabled={!selectedServerTime}>
                  Enter
                </Button>
              </Col>
            </Row>
          </Col>

          {/* Right Column: Entered Data Table */}
          <Col span={14}>
            <div className="entered-numbers-table">
              <h2>Entered Data</h2>
              <Table dataSource={enteredNumbers} columns={columns} pagination={false} size="small" scroll={{ y: 550 }} />
            </div>
          </Col>
        </Row>
      </div>

      {/* Selection Modal */}
      <Modal title="Select Option" open={showRangeModal} onOk={handleRangeModalOk} onCancel={handleRangeModalCancel} okText="Select" cancelText="Cancel">
        <p>Please select a option for "{currentDigitsForRange}":</p>
        <Select placeholder="Select Range" style={{ width: "100%" }} onChange={(value: string) => setTempSelectedRange(value)} value={tempSelectedRange}>
          {availableRangeOptions.map((option) => (
            <Option key={option.value} value={option.value}>
              {option.label}
            </Option>
          ))}
        </Select>
      </Modal>
    </AntApp>
  );
}

export default App;
