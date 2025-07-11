import { useCallback, useState, useEffect, useMemo } from "react";
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
import "./App.css";
import CalculatorPad from "./components/CalculatorPad/CalculatorPad";

const { Option } = Select;

// Interfaces for data structures
interface ChannelButton {
  id: string;
  label: string;
  isActive: boolean;
  conflictsWith?: string[];
  multipliers: { "2D": number; "3D": number };
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
  displayChannels: string[];
  amount: string;
  totalAmount: string;
  syntaxType: "2D" | "3D";
  currency: string;
  totalMultiplier: number;
  numberOfCombinations: number;
  combinedNumbers: string[];
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

/** Valid input patterns for number entry. */
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

/** Validates if a string is a valid number of specified digit length. */
const isValidDigitString = (str: string, digitLength: number): boolean => {
  const num = parseInt(str, 10);
  return !isNaN(num) && str.length === digitLength;
};

/** Checks if a final input string matches allowed patterns. */
const isFinalInputValid = (finalInput: string): boolean => {
  return VALID_FINAL_INPUT_PATTERNS.some((regex) => regex.test(finalInput));
};

/** Generates two-digit permutations (e.g., "12" → ["12", "21"]). */
const getTwoDigitPermutations = (numStr: string): string[] => {
  if (numStr.length !== 2) return [numStr];
  const [d1, d2] = numStr.split("");
  if (d1 === d2) return [numStr];
  return [numStr, d2 + d1];
};

/** Generates three-digit permutations (e.g., "123" → ["123", "132", ...]). */
const getThreeDigitPermutations = (numStr: string): string[] => {
  if (numStr.length !== 3) return [numStr];
  const chars = numStr.split("");
  const result: string[] = [];
  const permute = (arr: string[], memo: string[] = []) => {
    let cur;
    for (let i = 0; i < arr.length; i++) {
      cur = arr.splice(i, 1);
      if (arr.length === 0) {
        result.push(memo.concat(cur).join(""));
      }
      permute(arr.slice(), memo.concat(cur));
      arr.splice(i, 0, cur[0]);
    }
  };
  permute(chars);
  return Array.from(new Set(result));
};

/** Generates combinations for 2D or 3D ranges (e.g., "12~15" → ["12", "13", "14", "15"]). */
const getRangeCombinations = (
  startDigits: string,
  endDigits: string,
  digit: number
): string[] => {
  if (
    !isValidDigitString(startDigits, digit) ||
    !isValidDigitString(endDigits, digit)
  ) {
    return [];
  }
  const startNum = parseInt(startDigits, 10);
  const endNum = parseInt(endDigits, 10);
  if (startNum > endNum) return [];
  const result: string[] = [];
  for (let i = startNum; i <= endNum; i++) {
    result.push(i.toString().padStart(digit, "0"));
  }
  return Array.from(new Set(result));
};

/** Generates two-digit range combinations (e.g., "12>" → ["12", ..., "21"]). */
const getTwoDigitMapRangeCombinations = (
  startDigits: string,
  endDigits?: string
): string[] => {
  const result: string[] = [];
  if (!isValidDigitString(startDigits, 2)) return [];
  const startNum = parseInt(startDigits, 10);

  if (endDigits === undefined) {
    for (let i = startNum; i < startNum + 10; i++) {
      result.push(i.toString().padStart(2, "0"));
    }
  } else {
    if (
      !isValidDigitString(endDigits, 2) ||
      startNum > parseInt(endDigits, 10)
    ) {
      return [];
    }
    const startD1 = startDigits[0];
    const startD2 = startDigits[1];
    const endD1 = endDigits[0];
    const endD2 = endDigits[1];

    if (startD1 === startD2 && endD1 === endD2) {
      for (let i = parseInt(startD1); i <= parseInt(endD1); i++) {
        result.push(`${i}${i}`);
      }
    } else if (startD1 === endD1) {
      for (let i = startNum; i <= parseInt(endDigits, 10); i++) {
        result.push(i.toString().padStart(2, "0"));
      }
    } else if (startD2 === endD2) {
      for (let i = parseInt(startD1); i <= parseInt(endD1); i++) {
        result.push(`${i}${startD2}`);
      }
    } else {
      return [];
    }
  }
  return Array.from(new Set(result));
};

/** Generates three-digit range combinations (e.g., "123>" → ["123", ..., "132"]). */
const getThreeDigitMapRangeCombinations = (
  startDigits: string,
  endDigits?: string
): string[] => {
  const result: string[] = [];
  if (!isValidDigitString(startDigits, 3)) return [];
  const startNum = parseInt(startDigits, 10);

  if (endDigits === undefined) {
    /** Simple range: Generates 10 sequential numbers (e.g., "123>" → "123" to "132"). */
    for (let i = startNum; i < startNum + 10; i++) {
      result.push(i.toString().padStart(3, "0"));
    }
    return Array.from(new Set(result));
  }

  if (!isValidDigitString(endDigits, 3) || startNum > parseInt(endDigits, 10)) {
    return [];
  }

  const startD1 = startDigits[0];
  const startD2 = startDigits[1];
  const startD3 = startDigits[2];
  const endD1 = endDigits[0];
  const endD2 = endDigits[1];
  const endD3 = endDigits[2];

  /** Repeating digits (e.g., "111>555" → ["111", "222", "333", "444", "555"]). */
  if (
    startD1 === startD2 &&
    startD2 === startD3 &&
    endD1 === endD2 &&
    endD2 === endD3
  ) {
    for (let i = parseInt(startD1); i <= parseInt(endD1); i++) {
      result.push(`${i}${i}${i}`);
    }
    return Array.from(new Set(result));
  }

  /** Identify fixed and varying digits for compound ranges. */
  const fixedDigits: { [key: number]: string } = {};
  const varyingIndices: number[] = [];
  if (startD1 === endD1) fixedDigits[1] = startD1;
  else varyingIndices.push(1);
  if (startD2 === endD2) fixedDigits[2] = startD2;
  else varyingIndices.push(2);
  if (startD3 === endD3) fixedDigits[3] = startD3;
  else varyingIndices.push(3);

  if (varyingIndices.length === 1) {
    /** One digit varies (e.g., "111>115" → ["111", "112", "113", "114", "115"]). */
    const varyingIndex = varyingIndices[0];
    const startValue = parseInt(startDigits[varyingIndex - 1]);
    const endValue = parseInt(endDigits[varyingIndex - 1]);
    for (let i = startValue; i <= endValue; i++) {
      const digits = [startD1, startD2, startD3];
      digits[varyingIndex - 1] = i.toString();
      result.push(digits.join(""));
    }
  } else if (varyingIndices.length === 2) {
    /** Two digits vary and must be equal (e.g., "511>566" → ["511", "522", ..., "566"]). */
    const [idx1, idx2] = varyingIndices;
    if (
      startDigits[idx1 - 1] !== startDigits[idx2 - 1] ||
      endDigits[idx1 - 1] !== endDigits[idx2 - 1]
    ) {
      return [];
    }
    const startValue = parseInt(startDigits[idx1 - 1]);
    const endValue = parseInt(endDigits[idx1 - 1]);
    for (let i = startValue; i <= endValue; i++) {
      const digits = [
        fixedDigits[1] || i.toString(),
        fixedDigits[2] || i.toString(),
        fixedDigits[3] || i.toString(),
      ];
      result.push(digits.join(""));
    }
  } else {
    /** Invalid pattern: Three varying digits are not supported. */
    return [];
  }

  return Array.from(new Set(result));
};

function App() {
  const [input, setInput] = useState<string>("");
  const [enteredNumbers, setEnteredNumbers] = useState<EnteredNumber[]>([]);
  const [amountInput, setAmountInput] = useState<string>("");
  const [selectedServer, setSelectedServer] = useState<string | undefined>(
    undefined
  );
  const [selectedServerTime, setSelectedServerTime] = useState<
    string | undefined
  >(undefined);
  const [selectedCurrency, setSelectedCurrency] = useState<string>("USD");
  const [channelsButtons, setChannelsButtons] = useState<ChannelButton[]>([]);
  const [pButtons, setPButtons] = useState<PButton[]>([]);
  const [servers, setServers] = useState<Server[]>([]);

  const { message } = AntApp.useApp();

  /** Load server data from JSON and initialize enteredNumbers from localStorage on mount. */
  useEffect(() => {
    fetch("data/servers.json")
      .then((response) => {
        if (!response.ok)
          throw new Error(`HTTP error! status: ${response.status}`);
        return response.json();
      })
      .then((data) => setServers(data))
      .catch((error) =>
        message.error("Failed to load server data: " + error.message)
      );

    const savedNumbers = localStorage.getItem("enteredNumbers");
    if (savedNumbers) {
      setEnteredNumbers(JSON.parse(savedNumbers));
    }
  }, [message]);

  /** Save enteredNumbers to localStorage on update. */
  useEffect(() => {
    localStorage.setItem("enteredNumbers", JSON.stringify(enteredNumbers));
  }, [enteredNumbers]);

  /** Update channels and P buttons when server time changes. */
  useEffect(() => {
    if (selectedServer && selectedServerTime && servers.length > 0) {
      const server = servers.find((s) => s.id === selectedServer);
      const time = server?.times.find((t) => t.id === selectedServerTime);
      if (time) {
        setChannelsButtons(
          time.channels.map((channel) => ({ ...channel, isActive: false }))
        );
        setPButtons(
          time.pButtons.map((pBtn) => ({ ...pBtn, isActive: false }))
        );
      }
    } else {
      setChannelsButtons([]);
      setPButtons([]);
    }
  }, [selectedServer, selectedServerTime, servers]);

  /** Handle calculator input changes from CalculatorPad. */
  const handleCalculatorInputChange = useCallback((newInput: string) => {
    setInput(newInput);
  }, []);

  /** Handle amount input changes, allowing only numbers and decimals. */
  const handleAmountInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*\.?\d*$/.test(value) || value === "") {
      setAmountInput(value);
    }
  };

  /** Format amount to two decimal places on blur. */
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

  /** Handle Enter button click to validate and add entry to table. */
  const handleEnterClick = () => {
    if (input.trim() === "") {
      message.error("Please enter a number before pressing Enter.");
      return;
    }

    const selectedActiveChannels = channelsButtons.filter(
      (button) => button.isActive
    );
    if (selectedActiveChannels.length === 0) {
      message.error("Please select at least one channel (e.g., A, B, C, Lo).");
      return;
    }

    if (!isFinalInputValid(input)) {
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
        `Invalid number format. Supported formats: ${validFormats.join(", ")}.`
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

    if (!selectedServer || !selectedServerTime || !selectedCurrency) {
      message.error("Please select Server, Server Time, and Currency.");
      return;
    }

    let syntaxType: "2D" | "3D";
    let combinedNumbers: string[] = [];
    let numberOfCombinations = 1;

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
    } else if (input.includes(">")) {
      const parts = input.split(">");
      const startDigits = parts[0];
      const endDigits = parts[1] || undefined;

      if (startDigits.length === 2) {
        syntaxType = "2D";
        combinedNumbers = getTwoDigitMapRangeCombinations(
          startDigits,
          endDigits
        );
      } else if (startDigits.length === 3) {
        syntaxType = "3D";
        combinedNumbers = getThreeDigitMapRangeCombinations(
          startDigits,
          endDigits
        );
      } else {
        message.error("Invalid number format for range.");
        return;
      }

      if (combinedNumbers.length === 0) {
        message.error(
          "Invalid range: start number must not exceed end number."
        );
        return;
      }
      numberOfCombinations = combinedNumbers.length;
    } else if (input.includes("~")) {
      const [startDigits, endDigits] = input.split("~");
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
          "Invalid range: start number must not exceed end number."
        );
        return;
      }
      numberOfCombinations = combinedNumbers.length;
    } else {
      const digitsPart = input;
      if (digitsPart.length === 2) {
        syntaxType = "2D";
        combinedNumbers = [digitsPart];
      } else if (digitsPart.length === 3) {
        syntaxType = "3D";
        combinedNumbers = [digitsPart];
      } else {
        message.error("Invalid number format based on digit count.");
        return;
      }
    }

    let totalMultiplier = 0;
    const displayChannelsArray: string[] = [];
    selectedActiveChannels.forEach((channel) => {
      const multiplier = channel.multipliers[syntaxType];
      totalMultiplier += multiplier;
      displayChannelsArray.push(
        `${channel.label} (${syntaxType}x${multiplier})`
      );
    });

    const calculatedTotalAmount =
      parsedAmount * totalMultiplier * numberOfCombinations;

    setEnteredNumbers((prevNumbers) => [
      ...prevNumbers,
      {
        key: prevNumbers.length,
        value: input,
        channels: selectedActiveChannels.map((button) => button.id),
        displayChannels: displayChannelsArray,
        amount: parsedAmount.toFixed(2),
        totalAmount: calculatedTotalAmount.toFixed(2),
        syntaxType,
        currency: selectedCurrency,
        totalMultiplier,
        numberOfCombinations,
        combinedNumbers,
      },
    ]);

    setInput("");
    // Optionally reset amount and channels:
    // setAmountInput("");
    // setChannelsButtons((prev) => prev.map((btn) => ({ ...btn, isActive: false })));
    // setPButtons((prev) => prev.map((btn) => ({ ...btn, isActive: false })));
  };

  /** Toggle channel button and handle conflicts. */
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

  /** Toggle P button and activate associated channels. */
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

  /** Handle server selection change and reset server time. */
  const handleServerChange = (value: string) => {
    setSelectedServer(value);
    setSelectedServerTime(undefined);
  };

  /** Handle server time selection change. */
  const handleServerTimeChange = (value: string) => {
    setSelectedServerTime(value);
  };

  /** Handle currency selection change. */
  const handleCurrencyChange = (value: string) => {
    setSelectedCurrency(value);
  };

  /** Table columns for displaying entered numbers. */
  const columns: ColumnsType<EnteredNumber> = useMemo(
    () => [
      {
        title: "No.",
        dataIndex: "key",
        key: "key",
        render: (_text, _record, index) => index + 1,
        width: "10%",
      },
      {
        title: "Entered Number",
        key: "value",
        width: "18%",
        render: (_text, record) =>
          record.numberOfCombinations > 1 ? (
            <Tooltip
              title={
                <div style={{ whiteSpace: "pre-line" }}>
                  {record.combinedNumbers.join(", ")}
                </div>
              }
            >
              <span>{record.value} </span>
              <span style={{ color: "#1890ff" }}>
                ({record.numberOfCombinations})
              </span>
            </Tooltip>
          ) : (
            <span>{record.value}</span>
          ),
      },
      {
        title: "Combinations List",
        key: "combinedNumbersList",
        width: "40%",
        render: (_text, record) => record.combinedNumbers?.join(", ") || "",
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
        width: "15%",
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
          const channelLabels = channelIds
            .map(
              (channelId) =>
                channelsButtons.find((c) => c.id === channelId)?.label ||
                channelId
            )
            .join(", ");
          return (
            <Tooltip
              title={
                <div style={{ whiteSpace: "pre-line" }}>
                  {record.displayChannels.join("\n")}
                </div>
              }
            >
              <span>{channelLabels} </span>
              <span style={{ color: "#1890ff" }}>
                ({record.totalMultiplier})
              </span>
            </Tooltip>
          );
        },
      },
      {
        title: "Multiplier",
        dataIndex: "totalMultiplier",
        key: "totalMultiplier",
        width: "15%",
        render: (_text, record) =>
          record.numberOfCombinations > 1
            ? `${record.numberOfCombinations} x ${record.totalMultiplier}`
            : record.totalMultiplier,
      },
      {
        title: "Total Amount",
        dataIndex: "totalAmount",
        key: "totalAmount",
        width: "25%",
      },
    ],
    [channelsButtons]
  );

  const availableServerTimes = selectedServer
    ? servers.find((s) => s.id === selectedServer)?.times || []
    : [];

  return (
    <AntApp>
      <div className="container">
        <Row gutter={[20, 20]} style={{ width: "100%" }}>
          <Col span={8}>
            <Row gutter={[10, 10]}>
              <Col span={10}>
                <div style={{ marginBottom: "15px" }}>
                  <Select
                    placeholder="Select Server"
                    style={{ width: "100%", marginBottom: "10px" }}
                    onChange={handleServerChange}
                    value={selectedServer}
                    aria-label="Server selection"
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
                    aria-label="Server time selection"
                  >
                    {availableServerTimes.map((time) => (
                      <Option key={time.id} value={time.id}>
                        {time.label}
                      </Option>
                    ))}
                  </Select>
                </div>
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
                        aria-label={`Channel ${button.label}`}
                        aria-pressed={button.isActive}
                      >
                        {button.label} ({button.multipliers["2D"]},{" "}
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
                        aria-label={`P button ${button.label}`}
                        aria-pressed={button.isActive}
                      >
                        {button.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </Col>
              <Col span={14}>
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
                        style={{ width: "100%" }}
                        disabled={!selectedServerTime}
                        aria-label="Betting amount input"
                      />
                    </Col>
                    <Col span={5}>
                      <Select
                        placeholder="Select Currency"
                        style={{ width: "100%", marginLeft: "5px" }}
                        onChange={handleCurrencyChange}
                        value={selectedCurrency}
                        aria-label="Currency selection"
                      >
                        <Option value="USD">USD</Option>
                        <Option value="KHR">KHR</Option>
                      </Select>
                    </Col>
                  </Row>
                </div>
              </Col>
            </Row>
            <Row style={{ marginTop: "15px" }}>
              <Col span={24}>
                <Button
                  onClick={handleEnterClick}
                  className="antd-calc-button-enter"
                  block
                  disabled={!selectedServerTime}
                  aria-label="Submit entry"
                >
                  Enter
                </Button>
              </Col>
            </Row>
          </Col>
          <Col span={16}>
            <div className="entered-numbers-table">
              <h2>Entered Data</h2>
              <Table
                dataSource={enteredNumbers}
                columns={columns}
                pagination={false}
                size="small"
                scroll={{ y: 700 }}
                aria-label="Entered numbers table"
              />
            </div>
          </Col>
        </Row>
      </div>
    </AntApp>
  );
}

export default App;
