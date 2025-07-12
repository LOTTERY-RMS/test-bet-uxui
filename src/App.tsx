import { useCallback, useState, useEffect, useMemo } from "react";
import { Button, Row, Col, Table, Input, App as AntApp, Select, Tooltip } from "antd";
import type { ColumnsType } from "antd/es/table";
import "antd/dist/reset.css";
import "./App.css";
import CalculatorPad from "./components/CalculatorPad/CalculatorPad";
import ChannelSelector from "./components/ChannelSelector/ChannelSelector";

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

/** Valid input patterns for number entry. Supports 2D, 3D, and extended formats with operators X, >, and ~.
 * Examples:
 * - ##: "12" (single 2-digit number)
 * - ###: "123" (single 3-digit number)
 * - ##X: "12X" (permutations of 2 digits, e.g., ["12", "21"])
 * - ###X: "123X" (permutations of 3 digits, e.g., ["123", "132", "213", "231", "312", "321"])
 * - ####X: "1112X" (permutations with frequency rules, e.g., ["111", "112", "211", "121"])
 * - #####X: "11222X" (permutations with frequency rules)
 * - ##>: "10>" (range of 10 numbers, e.g., ["10", "11", ..., "19"])
 * - ###>: "120>" (range of 10 numbers, e.g., ["120", "121", ..., "129"])
 * - ##>##: "10>19" (specific 2-digit range, e.g., ["10", "11", ..., "19"])
 * - ###>###: "120>129" (specific 3-digit range, e.g., ["120", "121", ..., "129"])
 * - ##~##: "10~19" (simple 2-digit range, e.g., ["10", "11", ..., "19"])
 * - ###~###: "120~129" (simple 3-digit range, e.g., ["120", "121", ..., "129"])
 */
const VALID_FINAL_INPUT_PATTERNS = [
  /^\d{2}$/, // ## (e.g., 12)
  /^\d{3}$/, // ### (e.g., 123)
  /^\d{2,}X$/, // ##X, ###X, ####X, etc. (permutations with frequency rules)
  /^\d{2}>$/, // ##> (e.g., 10>)
  /^\d{3}>$/, // ###> (e.g., 120>)
  /^\d{3}>\d{3}$/, // ###>### (e.g., 120>129)
  /^\d{2}>\d{2}$/, // ##>## (e.g., 10>19)
  /^\d{3}~\d{3}$/, // ###~### (e.g., 120~129)
  /^\d{2}~\d{2}$/, // ##~## (e.g., 10~19)
];

/** Validates if a string is a valid number of specified digit length.
 * @param str The string to validate (e.g., "10" for 2 digits, "120" for 3 digits).
 * @param digitLength The expected number of digits (2 or 3).
 * @returns True if the string is a valid number of the specified length, false otherwise.
 * Examples:
 * - isValidDigitString("12", 2) → true
 * - isValidDigitString("123", 3) → true
 * - isValidDigitString("123", 2) → false
 * - isValidDigitString("ab", 2) → false
 */
const isValidDigitString = (str: string, digitLength: number): boolean => {
  const num = parseInt(str, 10);
  return !isNaN(num) && str.length === digitLength;
};

/** Validates frequency rules for X inputs (single digit can appear at most 3 times).
 * @param digitsPart The digits part of the input (e.g., "1112", "11222").
 * @returns True if the frequency rules are satisfied, false otherwise.
 * Examples:
 * - isValidXFrequency("1112") → true (1 appears 3 times, 2 appears 1 time)
 * - isValidXFrequency("1111") → false (1 appears 4 times, exceeds limit)
 * - isValidXFrequency("11222") → true (1 appears 2 times, 2 appears 3 times)
 */
const isValidXFrequency = (digitsPart: string): boolean => {
  const digitCount: { [key: string]: number } = {};
  for (const digit of digitsPart) {
    digitCount[digit] = (digitCount[digit] || 0) + 1;
  }
  return Object.values(digitCount).every((count) => count <= 3);
};

/** Checks if a final input string matches allowed patterns.
 * @param finalInput The input string to validate (e.g., "10X", "120>129").
 * @returns True if the input matches a valid pattern, false otherwise.
 * Examples:
 * - isFinalInputValid("12X") → true
 * - isFinalInputValid("120>129") → true
 * - isFinalInputValid("10~19") → true
 * - isFinalInputValid("1234") → false
 * - isFinalInputValid("1111X") → false (frequency rule violation)
 */
const isFinalInputValid = (finalInput: string): boolean => {
  // Check basic pattern first
  const matchesPattern = VALID_FINAL_INPUT_PATTERNS.some((regex) => regex.test(finalInput));
  if (!matchesPattern) return false;

  // For X inputs, check frequency rules
  if (finalInput.endsWith("X")) {
    const digitsPart = finalInput.slice(0, -1);
    return isValidXFrequency(digitsPart);
  }

  return true;
};

/** Generates permutations for a two-digit number.
 * @param numStr The two-digit number string (e.g., "12").
 * @returns Array of unique permutations. For "12" returns ["12", "21"], for "11" returns ["11"].
 * Examples:
 * - getTwoDigitPermutations("12") → ["12", "21"]
 * - getTwoDigitPermutations("11") → ["11"]
 * - getTwoDigitPermutations("123") → ["123"] (invalid input, returns unchanged)
 */
const getTwoDigitPermutations = (numStr: string): string[] => {
  if (numStr.length !== 2) return [numStr];
  const [d1, d2] = numStr.split("");
  if (d1 === d2) return [numStr]; // No permutations for identical digits
  return [numStr, d2 + d1];
};

/** Generates permutations for a three-digit number.
 * @param numStr The three-digit number string (e.g., "123").
 * @returns Array of unique permutations (e.g., ["123", "132", "213", "231", "312", "321"]).
 * Examples:
 * - getThreeDigitPermutations("123") → ["123", "132", "213", "231", "312", "321"]
 * - getThreeDigitPermutations("112") → ["112", "121", "211"]
 * - getThreeDigitPermutations("111") → ["111"]
 * - getThreeDigitPermutations("12") → ["12"] (invalid input, returns unchanged)
 */
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
  return Array.from(new Set(result)); // Ensure unique permutations
};

/** Generates 3-digit permutations for variable-length numbers with frequency rules.
 * @param numStr The number string (e.g., "1112", "1122", "1123", "111222").
 * @returns Array of unique 3-digit permutations respecting frequency rules.
 * Examples:
 * - getVariableDigitPermutations("1112") → ["111", "112", "211", "121"] (4 permutations)
 * - getVariableDigitPermutations("1122") → ["112", "121", "211", "221", "122", "212"] (6 permutations)
 * - getVariableDigitPermutations("1123") → ["112", "121", "211", "113", "131", "311", "123", "132", "213", "231", "312", "321"] (12 permutations)
 * - getVariableDigitPermutations("111222") → ["111", "222", "112", "211", "121", "221", "122", "212"] (8 permutations)
 */
const getVariableDigitPermutations = (numStr: string): string[] => {
  if (numStr.length < 2) return [numStr];

  const chars = numStr.split("");
  const result: string[] = [];

  // Generate all possible 3-digit combinations from the input digits
  const generateCombinations = (arr: string[], memo: string[] = []) => {
    if (memo.length === 3) {
      result.push(memo.join(""));
      return;
    }

    for (let i = 0; i < arr.length; i++) {
      const cur = arr.splice(i, 1)[0];
      generateCombinations(arr, memo.concat(cur));
      arr.splice(i, 0, cur);
    }
  };

  generateCombinations(chars);

  // Remove duplicates and return
  return Array.from(new Set(result));
};

/** Generates combinations for a simple range of 2-digit or 3-digit numbers (using ~ operator).
 * @param startDigits The starting number string (e.g., "10", "120").
 * @param endDigits The ending number string (e.g., "19", "129").
 * @param digit The number of digits (2 for 2D, 3 for 3D).
 * @returns Array of numbers in the range, padded with leading zeros.
 * Examples:
 * - getRangeCombinations("10", "19", 2) → ["10", "11", ..., "19"]
 * - getRangeCombinations("120", "129", 3) → ["120", "121", ..., "129"]
 * - getRangeCombinations("19", "10", 2) → [] (invalid: start > end)
 * - getRangeCombinations("10", "abc", 2) → [] (invalid: non-numeric)
 */
const getRangeCombinations = (startDigits: string, endDigits: string, digit: number): string[] => {
  if (!isValidDigitString(startDigits, digit) || !isValidDigitString(endDigits, digit)) {
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

/** Generates combinations for a 2-digit range using the > operator.
 * @param startDigits The starting 2-digit number (e.g., "10").
 * @param endDigits The ending 2-digit number (optional, for ##>##, e.g., "19").
 * @returns Array of numbers in the range, considering specific patterns.
 * Examples:
 * - getTwoDigitMapRangeCombinations("10") → ["10", "11", "12", ..., "19"] (10 sequential numbers)
 * - getTwoDigitMapRangeCombinations("00", "99") → ["00", "11", "22", "33", "44", "55", "66", "77", "88", "99"] (repeating digits)
 * - getTwoDigitMapRangeCombinations("10", "19") → ["10", "11", "12", "13", "14", "15", "16", "17", "18", "19"] (same first digit)
 * - getTwoDigitMapRangeCombinations("01", "91") → ["01", "11", "21", "31", "41", "51", "61", "71", "81", "91"] (same second digit)
 * - getTwoDigitMapRangeCombinations("12", "23") → [] (invalid range)
 */
const getTwoDigitMapRangeCombinations = (startDigits: string, endDigits?: string): string[] => {
  const result: string[] = [];
  if (!isValidDigitString(startDigits, 2)) return [];
  const startNum = parseInt(startDigits, 10);

  if (endDigits === undefined) {
    // Simple range: 10 sequential numbers (e.g., "10>" → ["10", "11", ..., "19"])
    for (let i = startNum; i < startNum + 10; i++) {
      result.push(i.toString().padStart(2, "0"));
    }
  } else {
    if (!isValidDigitString(endDigits, 2) || startNum > parseInt(endDigits, 10)) {
      return [];
    }
    const startD1 = startDigits[0];
    const startD2 = startDigits[1];
    const endD1 = endDigits[0];
    const endD2 = endDigits[1];

    if (startD1 === startD2 && endD1 === endD2) {
      // Case: Repeating digits (e.g., "00>99" → ["00", "11", "22", ..., "99"])
      for (let i = parseInt(startD1); i <= parseInt(endD1); i++) {
        result.push(`${i}${i}`);
      }
    } else if (startD1 === endD1) {
      // Case: Same first digit (e.g., "10>19" → ["10", "11", ..., "19"])
      for (let i = startNum; i <= parseInt(endDigits, 10); i++) {
        result.push(i.toString().padStart(2, "0"));
      }
    } else if (startD2 === endD2) {
      // Case: Same second digit (e.g., "01>91" → ["01", "11", ..., "91"])
      for (let i = parseInt(startD1); i <= parseInt(endD1); i++) {
        result.push(`${i}${startD2}`);
      }
    } else {
      // Invalid range (e.g., "12>23")
      return [];
    }
  }
  return Array.from(new Set(result));
};

/** Generates combinations for a 3-digit range using the > operator.
 * @param startDigits The starting 3-digit number (e.g., "120").
 * @param endDigits The ending 3-digit number (optional, for ###>###, e.g., "129").
 * @returns Array of numbers in the range, considering specific patterns.
 * Examples:
 * - getThreeDigitMapRangeCombinations("120") → ["120", "121", ..., "129"] (10 sequential numbers)
 * - getThreeDigitMapRangeCombinations("000", "999") → ["000", "111", "222", "333", "444", "555", "666", "777", "888", "999"] (repeating digits)
 * - getThreeDigitMapRangeCombinations("120", "129") → ["120", "121", "122", "123", "124", "125", "126", "127", "128", "129"] (same first two digits)
 * - getThreeDigitMapRangeCombinations("101", "191") → ["101", "111", "121", "131", "141", "151", "161", "171", "181", "191"] (same first and third digits)
 * - getThreeDigitMapRangeCombinations("110", "910") → ["110", "210", "310", "410", "510", "610", "710", "810", "910"] (same second and third digits)
 * - getThreeDigitMapRangeCombinations("500", "599") → ["500", "501", "502", ..., "599"] (100 sequential numbers)
 * - getThreeDigitMapRangeCombinations("050", "959") → [] (invalid)
 * - getThreeDigitMapRangeCombinations("005", "995") → [] (invalid)
 * - getThreeDigitMapRangeCombinations("123", "456") → [] (invalid range)
 */
const getThreeDigitMapRangeCombinations = (startDigits: string, endDigits?: string): string[] => {
  const result: string[] = [];
  if (!isValidDigitString(startDigits, 3)) return [];
  const startNum = parseInt(startDigits, 10);

  if (endDigits === undefined) {
    // Simple range: Generates 10 sequential numbers (e.g., "120>" → ["120", "121", ..., "129"])
    for (let i = startNum; i < startNum + 10; i++) {
      result.push(i.toString().padStart(3, "0"));
    }
    return Array.from(new Set(result));
  }

  if (!isValidDigitString(endDigits, 3) || startNum > parseInt(endDigits, 10)) {
    // Invalid: End digits not 3-digit or start > end (e.g., "120>119")
    return [];
  }

  const startD1 = startDigits[0];
  const startD2 = startDigits[1];
  const startD3 = startDigits[2];
  const endD1 = endDigits[0];
  const endD2 = endDigits[1];
  const endD3 = endDigits[2];

  if (startD1 === startD2 && startD2 === startD3 && endD1 === endD2 && endD2 === endD3) {
    // Case: Repeating digits (e.g., "000>999" → ["000", "111", ..., "999"])
    for (let i = parseInt(startD1); i <= parseInt(endD1); i++) {
      result.push(`${i}${i}${i}`);
    }
    return Array.from(new Set(result));
  }

  const fixedDigits: { [key: number]: string } = {};
  const varyingIndices: number[] = [];
  if (startD1 === endD1) fixedDigits[1] = startD1;
  else varyingIndices.push(1);
  if (startD2 === endD2) fixedDigits[2] = startD2;
  else varyingIndices.push(2);
  if (startD3 === endD3) fixedDigits[3] = startD3;
  else varyingIndices.push(3);

  if (varyingIndices.length === 1) {
    // Case: One digit varies
    // - First two fixed (e.g., "120>129" → ["120", "121", ..., "129"])
    // - First and third fixed (e.g., "101>191" → ["101", "111", ..., "191"])
    // - Second and third fixed (e.g., "110>910" → ["110", "210", ..., "910"])
    const varyingIndex = varyingIndices[0];
    const startValue = parseInt(startDigits[varyingIndex - 1]);
    const endValue = parseInt(endDigits[varyingIndex - 1]);
    for (let i = startValue; i <= endValue; i++) {
      const digits = [startD1, startD2, startD3];
      digits[varyingIndex - 1] = i.toString();
      result.push(digits.join(""));
    }
  } else if (varyingIndices.length === 2) {
    // Case: Two digits vary - generate sequential range
    // - First fixed, second and third vary (e.g., "500>599" → ["500", "501", ..., "599"])
    // - Second fixed, first and third vary (e.g., "050>959" → invalid)
    // - Third fixed, first and second vary (e.g., "005>995" → invalid)

    // Only allow when first digit is fixed and second/third digits vary
    if (fixedDigits[1] && !fixedDigits[2] && !fixedDigits[3]) {
      // Case: First digit fixed, second and third vary (e.g., "500>599")
      const startValue = parseInt(startDigits);
      const endValue = parseInt(endDigits);
      for (let i = startValue; i <= endValue; i++) {
        result.push(i.toString().padStart(3, "0"));
      }
    } else {
      // Invalid: Other combinations like "050>959" or "005>995" are not supported
      return [];
    }
  } else {
    // Invalid: Three varying digits not supported (e.g., "123>456")
    return [];
  }

  return Array.from(new Set(result));
};

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
  const handleCalculatorInputChange = useCallback((newInput: string) => {
    setInput(newInput);
  }, []);

  /** Handle changes in the amount input field, allowing only numbers and decimals.
   * @param e The input event containing the new value.
   * Examples:
   * - Input "123.45" → Allowed
   * - Input "abc" → Ignored
   */
  const handleAmountInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*\.?\d*$/.test(value) || value === "") {
      setAmountInput(value);
    }
  };

  /** Format amount to two decimal places on blur or clear if invalid.
   * Examples:
   * - Input "123.4" → Sets to "123.40"
   * - Input "abc" → Clears and shows error
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

  /** Handles the Enter button click to validate and process user input.
   * Validates the number format, selected channels, amount, server, time, and currency.
   * Generates combinations (e.g., permutations for X, ranges for > or ~), calculates total amount using multipliers,
   * adds the entry to the table, and resets the input field.
   * Displays error messages for invalid inputs.
   */
  const handleEnterClick = () => {
    if (input.trim() === "") {
      message.error("Please enter a number before pressing Enter.");
      return;
    }

    const selectedActiveChannels = channelsButtons.filter((button) => button.isActive);
    if (selectedActiveChannels.length === 0) {
      message.error("Please select at least one channel (e.g., A, B, C, Lo).");
      return;
    }

    if (!isFinalInputValid(input)) {
      const validFormats = [
        "## (e.g., 10)",
        "### (e.g., 120)",
        "##X (e.g., 10X)",
        "###X (e.g., 120X)",
        "####X (e.g., 1112X)",
        "#####X (e.g., 11222X)",
        "##> (e.g., 10>)",
        "###> (e.g., 120>)",
        "##>## (e.g., 10>19)",
        "###>### (e.g., 120>129)",
        "##~## (e.g., 10~19)",
        "###~### (e.g., 120~129)",
      ];
      message.error(`Invalid number format. Supported formats: ${validFormats.join(", ")}.`);
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
      // Handle permutation input with X operator
      const digitsPart = input.slice(0, -1);
      if (digitsPart.length === 2) {
        syntaxType = "2D";
        combinedNumbers = getTwoDigitPermutations(digitsPart);
        // Example: "12X" → ["12", "21"]
      } else if (digitsPart.length === 3) {
        syntaxType = "3D";
        combinedNumbers = getThreeDigitPermutations(digitsPart);
        // Example: "123X" → ["123", "132", "213", "231", "312", "321"]
      } else {
        // Handle variable-length permutations (4+ digits)
        syntaxType = "3D"; // Treat as 3D syntax for digits > 3
        combinedNumbers = getVariableDigitPermutations(digitsPart);
        // Examples:
        // - "1112X" → ["111", "112", "211", "121"] (4 permutations)
        // - "1122X" → ["112", "121", "211", "221", "122", "212"] (6 permutations)
        // - "1123X" → ["112", "121", "211", "113", "131", "311", "123", "132", "213", "231", "312", "321"] (12 permutations)
        // - "111222X" → ["111", "222", "112", "211", "121", "221", "122", "212"] (8 permutations)
      }
      numberOfCombinations = combinedNumbers.length;
    } else if (input.includes(">")) {
      // Handle range input with > operator
      const parts = input.split(">");
      const startDigits = parts[0];
      const endDigits = parts[1] || undefined;

      if (startDigits.length === 2) {
        syntaxType = "2D";
        combinedNumbers = getTwoDigitMapRangeCombinations(startDigits, endDigits);
        // Examples:
        // - "10>" → ["10", "11", ..., "19"]
        // - "00>99" → ["00", "11", ..., "99"]
        // - "10>19" → ["10", "11", ..., "19"]
        // - "01>91" → ["01", "11", ..., "91"]
      } else if (startDigits.length === 3) {
        syntaxType = "3D";
        combinedNumbers = getThreeDigitMapRangeCombinations(startDigits, endDigits);
        // Examples:
        // - "120>" → ["120", "121", ..., "129"]
        // - "000>999" → ["000", "111", ..., "999"]
        // - "120>129" → ["120", "121", ..., "129"]
        // - "101>191" → ["101", "111", ..., "191"]
        // - "110>910" → ["110", "210", ..., "910"]
        // - "500>599" → ["500", "501", ..., "599"] (100 numbers)
        // - "050>959" → invalid
        // - "005>995" → invalid
      } else {
        message.error("Invalid number format for range.");
        return;
      }

      if (combinedNumbers.length === 0) {
        message.error("Invalid range: start number must not exceed end number.");
        return;
      }
      numberOfCombinations = combinedNumbers.length;
    } else if (input.includes("~")) {
      // Handle simple range input with ~ operator
      const [startDigits, endDigits] = input.split("~");
      if (startDigits.length === 2 && endDigits.length === 2) {
        syntaxType = "2D";
        combinedNumbers = getRangeCombinations(startDigits, endDigits, 2);
        // Example: "10~19" → ["10", "11", ..., "19"]
      } else if (startDigits.length === 3 && endDigits.length === 3) {
        syntaxType = "3D";
        combinedNumbers = getRangeCombinations(startDigits, endDigits, 3);
        // Example: "120~129" → ["120", "121", ..., "129"]
      } else {
        message.error("Invalid number format for range.");
        return;
      }

      if (combinedNumbers.length === 0) {
        message.error("Invalid range: start number must not exceed end number.");
        return;
      }
      numberOfCombinations = combinedNumbers.length;
    } else {
      // Handle single number input
      const digitsPart = input;
      if (digitsPart.length === 2) {
        syntaxType = "2D";
        combinedNumbers = [digitsPart];
        // Example: "10" → ["10"]
      } else if (digitsPart.length === 3) {
        syntaxType = "3D";
        combinedNumbers = [digitsPart];
        // Example: "120" → ["120"]
      } else if (digitsPart.length > 3) {
        syntaxType = "3D"; // Treat as 3D syntax for digits > 3
        combinedNumbers = [digitsPart];
        // Example: "1112" → ["1112"]
      } else {
        message.error("Invalid number format based on digit count.");
        return;
      }
    }

    // Calculate total multiplier from selected channels
    let totalMultiplier = 0;
    const displayChannelsArray: string[] = [];
    selectedActiveChannels.forEach((channel) => {
      const multiplier = channel.multipliers[syntaxType];
      totalMultiplier += multiplier;
      displayChannelsArray.push(`${channel.label} (${syntaxType}x${multiplier})`);
    });

    // Calculate total amount: amount * totalMultiplier * numberOfCombinations
    const calculatedTotalAmount = parsedAmount * totalMultiplier * numberOfCombinations;

    // Add new entry to the table
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

    // Reset input after successful entry
    setInput("");
    // Optionally reset amount and channels:
    // setAmountInput("");
    // setChannelsButtons((prev) => prev.map((btn) => ({ ...btn, isActive: false })));
    // setPButtons((prev) => prev.map((btn) => ({ ...btn, isActive: false })));
  };

  /** Handle server selection change and reset server time.
   * @param value The selected server ID.
   */
  const handleServerChange = (value: string) => {
    setSelectedServer(value);
    setSelectedServerTime(undefined);
  };

  /** Handle server time selection change.
   * @param value The selected server time ID.
   */
  const handleServerTimeChange = (value: string) => {
    setSelectedServerTime(value);
  };

  /** Handle currency selection change.
   * @param value The selected currency (e.g., "USD", "KHR").
   */
  const handleCurrencyChange = (value: string) => {
    setSelectedCurrency(value);
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
          if (combinations.length <= 10) {
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
              <span style={{ color: "#1890ff" }}>({record.totalMultiplier})</span>
            </Tooltip>
          );
        },
      },
      {
        title: "Multiplier",
        dataIndex: "totalMultiplier",
        key: "totalMultiplier",
        width: "10%",
        render: (_text, record) => (record.numberOfCombinations > 1 ? `${record.numberOfCombinations} x ${record.totalMultiplier}` : record.totalMultiplier),
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
  const availableServerTimes = selectedServer ? servers.find((s) => s.id === selectedServer)?.times || [] : [];

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
