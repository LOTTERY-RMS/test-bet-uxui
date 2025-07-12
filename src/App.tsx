import { useCallback, useState, useEffect, useMemo } from "react";
import { Button, Row, Col, Table, Input, App as AntApp, Select, Tooltip } from "antd";
import type { ColumnsType } from "antd/es/table";
import "antd/dist/reset.css";
import "./App.css";
import CalculatorPad from "./components/CalculatorPad/CalculatorPad";
import ChannelSelector from "./components/ChannelSelector/ChannelSelector";
import { processInputNumber } from "./utils/numberUtils";

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
  channelMultiplierSum: number;
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

function App() {
  const [input, setInput] = useState<string>("");
  const [enteredNumbers, setEnteredNumbers] = useState<EnteredNumber[]>([]);
  const [amountInput, setAmountInput] = useState<string>("");
  const [selectedServer, setSelectedServer] = useState<string | undefined>(undefined);
  const [selectedServerTime, setSelectedServerTime] = useState<string | undefined>(undefined);
  const [selectedCurrency, setSelectedCurrency] = useState<string>("USD");
  const [channelsButtons, setChannelsButtons] = useState<ChannelButton[]>([]);
  const [pButtons, setPButtons] = useState<PButton[]>([]);
  const [servers, setServers] = useState<Server[]>([]);

  const { message } = AntApp.useApp();

  /** Load server data from JSON and initialize enteredNumbers from localStorage on mount. */
  useEffect(() => {
    fetch("data/servers.json")
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return response.json();
      })
      .then((data) => setServers(data))
      .catch((error) => message.error("Failed to load server data: " + error.message));

    const savedNumbers = localStorage.getItem("enteredNumbers");
    if (savedNumbers) {
      setEnteredNumbers(JSON.parse(savedNumbers));
    }
  }, [message]);

  /** Save enteredNumbers to localStorage whenever it updates. */
  useEffect(() => {
    localStorage.setItem("enteredNumbers", JSON.stringify(enteredNumbers));
  }, [enteredNumbers]);

  /** Update channels and P buttons when server or server time changes.
   * Resets active states to false to ensure a clean slate.
   */
  useEffect(() => {
    if (selectedServer && selectedServerTime && servers.length > 0) {
      const server = servers.find((s) => s.id === selectedServer);
      const time = server?.times.find((t) => t.id === selectedServerTime);
      if (time) {
        setChannelsButtons(time.channels.map((channel) => ({ ...channel, isActive: false })));
        setPButtons(time.pButtons.map((pBtn) => ({ ...pBtn, isActive: false })));
      }
    } else {
      setChannelsButtons([]);
      setPButtons([]);
    }
  }, [selectedServer, selectedServerTime, servers]);

  /** Handle calculator input changes from CalculatorPad component.
   * @param newInput The updated input string from the calculator.
   */
  const handleCalculatorInputChange = useCallback((calculatorInput: string) => {
    setInput(calculatorInput);
  }, []);

  /** Handle changes in the amount input field, allowing only numbers and decimals.
   * @param e The input event containing the new value.
   * Examples:
   * - Input "123.45" → Allowed
   * - Input "abc" → Ignored
   */
  const handleAmountInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = event.target.value;
    if (/^\d*\.?\d*$/.test(inputValue) || inputValue === "") {
      setAmountInput(inputValue);
    }
  };

  /** Format amount to two decimal places on blur or clear if invalid.
   * Examples:
   * - Input "123.4" → Sets to "123.40"
   * - Input "abc" → Clears and shows error
   */
  const handleAmountInputBlur = () => {
    const trimmedAmount = amountInput.trim();
    if (trimmedAmount === "") {
      setAmountInput("");
      return;
    }
    const parsedAmount = parseFloat(trimmedAmount);
    if (isNaN(parsedAmount)) {
      setAmountInput("");
      message.error("Invalid amount entered. Please enter a number.");
      return;
    }
    setAmountInput(parsedAmount.toFixed(2));
  };

  /** Handles the Enter button click to validate and process user input.
   * Validates the number format, selected channels, amount, server, time, and currency.
   * Generates combinations (e.g., permutations for X, ranges for > or ~), calculates total amount using multipliers,
   * adds the entry to the table, and resets the input field.
   * Displays error messages for invalid inputs.
   */
  const handleEnterClick = () => {
    const activeChannels = channelsButtons.filter((channel) => channel.isActive);
    const betAmount = parseFloat(amountInput);
    const processResult = processInputNumber(input, activeChannels, betAmount);
    if ("error" in processResult) {
      message.error(processResult.error);
      return;
    }

    // Create the table row data with all necessary information
    const tableRowData = {
      key: enteredNumbers.length,
      value: input,
      channels: activeChannels.map((channel) => channel.id),
      displayChannels: activeChannels.map((channel) => `${channel.label} (${processResult.syntaxType}x${channel.multipliers[processResult.syntaxType]})`),
      amount: betAmount.toFixed(2),
      currency: selectedCurrency,
      ...processResult,
    };

    setEnteredNumbers((previousNumbers) => [...previousNumbers, tableRowData]);
    setInput("");
    // Optionally reset amount and channels:
    // setAmountInput("");
    // setChannelsButtons((prev) => prev.map((btn) => ({ ...btn, isActive: false })));
    // setPButtons((prev) => prev.map((btn) => ({ ...btn, isActive: false })));
  };

  /** Handle server selection change and reset server time.
   * @param value The selected server ID.
   */
  const handleServerChange = (serverId: string) => {
    setSelectedServer(serverId);
    setSelectedServerTime(undefined);
  };

  /** Handle server time selection change.
   * @param serverTimeId The selected server time ID.
   */
  const handleServerTimeChange = (serverTimeId: string) => {
    setSelectedServerTime(serverTimeId);
  };

  /** Handle currency selection change.
   * @param currencyCode The selected currency (e.g., "USD", "KHR").
   */
  const handleCurrencyChange = (currencyCode: string) => {
    setSelectedCurrency(currencyCode);
  };

  /** Table columns for displaying entered numbers.
   * Memoized to prevent unnecessary re-renders.
   */
  const columns: ColumnsType<EnteredNumber> = useMemo(
    () => [
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
        width: "13%",
        render: (_text, record) =>
          record.numberOfCombinations > 1 ? (
            <Tooltip title={<div style={{ whiteSpace: "pre-line" }}>{record.combinedNumbers.join(", ")}</div>}>
              <span>{record.value} </span>
              <span style={{ color: "#1890ff" }}>({record.numberOfCombinations})</span>
            </Tooltip>
          ) : (
            <span>{record.value}</span>
          ),
      },
      {
        title: "Combinations List",
        key: "combinedNumbersList",
        width: "28%",
        render: (_text, record) => {
          const combinations = record.combinedNumbers || [];
          if (combinations.length <= 100) {
            return combinations.join(", ");
          } else {
            const firstThree = combinations.slice(0, 4).join(", ");
            const lastThree = combinations.slice(-4).join(", ");
            return (
              <Tooltip title={<div style={{ whiteSpace: "pre-line" }}>{combinations.join(", ")}</div>}>
                <span>
                  {firstThree}, ... , {lastThree}
                </span>
              </Tooltip>
            );
          }
        },
      },
      {
        title: "Syntax",
        dataIndex: "syntaxType",
        key: "syntaxType",
        width: "7%",
      },
      {
        title: "Currency",
        dataIndex: "currency",
        key: "currency",
        width: "7%",
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
        width: "10%",
        render: (channelIds: string[], record) => {
          const channelLabels = channelIds.map((channelId) => channelsButtons.find((c) => c.id === channelId)?.label || channelId).join(", ");
          return (
            <Tooltip title={<div style={{ whiteSpace: "pre-line" }}>{record.displayChannels.join("\n")}</div>}>
              <span>{channelLabels} </span>
              <span style={{ color: "#1890ff" }}>({record.channelMultiplierSum})</span>
            </Tooltip>
          );
        },
      },
      {
        title: "Channel Multiplier",
        dataIndex: "channelMultiplierSum",
        key: "channelMultiplierSum",
        width: "10%",
        render: (_text, record) => (record.numberOfCombinations > 1 ? `${record.numberOfCombinations} x ${record.channelMultiplierSum}` : record.channelMultiplierSum),
      },
      {
        title: "Total Amount",
        dataIndex: "totalAmount",
        key: "totalAmount",
        width: "10%",
      },
    ],
    [channelsButtons]
  );

  // Get available server times based on selected server
  const availableServerTimes = selectedServer ? servers.find((server) => server.id === selectedServer)?.times || [] : [];

  return (
    <AntApp>
      <div className="container">
        <Row gutter={[20, 20]} style={{ width: "100%" }}>
          <Col span={8}>
            <Row gutter={[10, 10]}>
              <Col span={10}>
                {/* Server and Server Time selectors */}
                <div style={{ marginBottom: "15px" }}>
                  <Select placeholder="Select Server" style={{ width: "100%", marginBottom: "10px" }} onChange={handleServerChange} value={selectedServer} aria-label="Server selection">
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
                    elicit
                  </Select>
                </div>
                {/* Channel and P buttons container */}
                <ChannelSelector channelsButtons={channelsButtons} pButtons={pButtons} setChannelsButtons={setChannelsButtons} setPButtons={setPButtons} selectedServerTime={selectedServerTime} />
              </Col>
              <Col span={14}>
                <CalculatorPad input={input} onInputChange={handleCalculatorInputChange} />
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
                      <Select placeholder="Select Currency" style={{ width: "100%", marginLeft: "5px" }} onChange={handleCurrencyChange} value={selectedCurrency} aria-label="Currency selection">
                        <Option value="USD">USD</Option>
                        <Option value="KHR">KHR</Option>
                      </Select>
                    </Col>
                  </Row>
                </div>
              </Col>
            </Row>
            {/* Enter button */}
            <Row style={{ marginTop: "15px" }}>
              <Col span={24}>
                <Button onClick={handleEnterClick} className="antd-calc-button-enter" block disabled={!selectedServerTime} aria-label="Submit entry">
                  Enter
                </Button>
              </Col>
            </Row>
          </Col>
          <Col span={16}>
            <div className="entered-numbers-table">
              <h2>Entered Data</h2>
              <Table dataSource={enteredNumbers} columns={columns} pagination={false} size="small" scroll={{ y: 700 }} aria-label="Entered numbers table" />
            </div>
          </Col>
        </Row>
      </div>
    </AntApp>
  );
}

export default App;
