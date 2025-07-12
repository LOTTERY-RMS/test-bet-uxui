// Number utility functions for permutations, ranges, and validation

/**
 * Regular expressions for valid bet input patterns.
 * Supports 2D, 3D, and extended formats with operators X, >, and ~.
 *
 * Examples of valid patterns:
 *   "12"        // two digits
 *   "123"       // three digits
 *   "12X"       // two digits + X
 *   "123X"      // three digits + X
 *   "10>"       // two digits + '>'
 *   "120>"      // three digits + '>'
 *   "10>19"     // two digits > two digits
 *   "120>129"   // three digits > three digits
 *   "10~19"     // two digits ~ two digits
 *   "120~129"   // three digits ~ three digits
 */
export const VALID_FINAL_INPUT_PATTERNS = [
  /^\d{2}$/, // e.g., "12"
  /^\d{3}$/, // e.g., "123"
  /^\d{2,}X$/, // e.g., "12X", "123X", "1234X"
  /^\d{2}>$/, // e.g., "10>"
  /^\d{3}>$/, // e.g., "120>"
  /^\d{3}>\d{3}$/, // e.g., "120>129"
  /^\d{2}>\d{2}$/, // e.g., "10>19"
  /^\d{3}~\d{3}$/, // e.g., "120~129"
  /^\d{2}~\d{2}$/, // e.g., "10~19"
];

/**
 * Checks if a string is a valid number of the specified length.
 *
 * @param {string} numericString - The string to check.
 * @param {number} expectedLength - The required length.
 * @returns {boolean} True if numericString is a number and has the exact length.
 *
 * @example isExactLengthNumericString("12", 2) // true
 * @example isExactLengthNumericString("123", 2) // false
 * @example isExactLengthNumericString("ab", 2) // false
 * @example isExactLengthNumericString("01", 2) // true
 */
export const isExactLengthNumericString = (numericString: string, expectedLength: number): boolean => {
  const parsedNumber = parseInt(numericString, 10);
  return !isNaN(parsedNumber) && numericString.length === expectedLength;
};

/**
 * Validates if a bet input string matches allowed patterns and, for 'X' patterns, checks digit frequency.
 *
 * @param {string} betInput - The input string to validate.
 * @returns {boolean} True if input is valid.
 *
 * @example isSupportedBetInput("12") // true
 * @example isSupportedBetInput("123X") // true
 * @example isSupportedBetInput("1111X") // false (digit '1' appears 4 times)
 * @example isSupportedBetInput("10>") // true
 * @example isSupportedBetInput("10>19") // true
 * @example isSupportedBetInput("10~19") // true
 * @example isSupportedBetInput("1X") // false (not enough digits)
 * @example isSupportedBetInput("abc") // false
 */
export const isSupportedBetInput = (betInput: string): boolean => {
  const matchesPattern = VALID_FINAL_INPUT_PATTERNS.some((pattern) => pattern.test(betInput));
  if (!matchesPattern) return false;
  if (betInput.endsWith("X")) {
    const digitSequence = betInput.slice(0, -1);
    // Inline frequency check: single digit can appear at most 3 times
    const digitFrequency: { [key: string]: number } = {};
    for (const digit of digitSequence) {
      digitFrequency[digit] = (digitFrequency[digit] || 0) + 1;
    }
    return Object.values(digitFrequency).every((frequency) => frequency <= 3);
  }
  return true;
};

/**
 * Generates all unique permutations for 2D or 3D digit strings.
 *
 * @param {string} digitString - The string of digits to permute.
 * @param {"2D"|"3D"} syntaxType - "2D" or "3D".
 * @returns {string[]} Array of unique permutations.
 *
 * @example generateDigitPermutations("12", "2D") // ["12", "21"]
 * @example generateDigitPermutations("11", "2D") // ["11"]
 * @example generateDigitPermutations("123", "3D") // ["123", "132", "213", "231", "312", "321"]
 * @example generateDigitPermutations("112", "3D") // ["112", "121", "211"]
 * @example generateDigitPermutations("1", "2D") // ["1"]
 */
export function generateDigitPermutations(digitString: string, syntaxType: "2D" | "3D"): string[] {
  // syntaxType === "2D"
  if (syntaxType === "2D") {
    if (digitString.length !== 2) return [digitString];
    const [a, b] = digitString;
    return a === b ? [digitString] : [digitString, b + a];
  }
  // syntaxType === "3D"
  if (digitString.length < 2) return [digitString];
  const digits = digitString.split("");
  const results: string[] = [];
  const permutate = (arr: string[], memo: string[] = []) => {
    if (memo.length === 3) {
      results.push(memo.join(""));
      return;
    }
    for (let i = 0; i < arr.length; i++) {
      const cur = arr.splice(i, 1)[0];
      permutate(arr, memo.concat(cur));
      arr.splice(i, 0, cur);
    }
  };
  permutate(digits);
  return Array.from(new Set(results));
}

/**
 * Generates all numbers in a simple range (using ~) for 2D or 3D numbers.
 *
 * @param {string} startNumber - Start of the range.
 * @param {string} endNumber - End of the range.
 * @param {number} digitLength - 2 or 3.
 * @returns {string[]} Array of all numbers in the range, padded to digitLength.
 *
 * @example generateSimpleRangeCombinations("10", "12", 2) // ["10", "11", "12"]
 * @example generateSimpleRangeCombinations("120", "122", 3) // ["120", "121", "122"]
 */
export const generateSimpleRangeCombinations = (startNumber: string, endNumber: string, digitLength: number): string[] => {
  if (!isExactLengthNumericString(startNumber, digitLength) || !isExactLengthNumericString(endNumber, digitLength)) {
    return [];
  }
  const startValue = parseInt(startNumber, 10);
  const endValue = parseInt(endNumber, 10);
  if (startValue > endValue) return [];
  const rangeCombinations: string[] = [];
  for (let i = startValue; i <= endValue; i++) {
    rangeCombinations.push(i.toString().padStart(digitLength, "0"));
  }
  return Array.from(new Set(rangeCombinations));
};

/**
 * Generates combinations for a 2-digit range using the '>' operator.
 * If endNumber is omitted, generates 10 consecutive numbers.
 *
 * @param {string} startNumber - Start of the range (2 digits).
 * @param {string} [endNumber] - Optional end of the range (2 digits).
 * @returns {string[]} Array of numbers in the range.
 *
 * @example generateMappedTwoDigitRangeCombinations("10") // ["10", "11", ..., "19"]
 * @example generateMappedTwoDigitRangeCombinations("10", "19") // ["10", "11", ..., "19"]
 * @example generateMappedTwoDigitRangeCombinations("11", "22") // ["11", "22"]
 * @example generateMappedTwoDigitRangeCombinations("12", "15") // ["12", "13", "14", "15"]
 * @example generateMappedTwoDigitRangeCombinations("99", "00") // []
 */
export const generateMappedTwoDigitRangeCombinations = (startNumber: string, endNumber?: string): string[] => {
  const rangeCombinations: string[] = [];
  if (!isExactLengthNumericString(startNumber, 2)) return [];
  const startValue = parseInt(startNumber, 10);
  if (endNumber === undefined) {
    for (let i = startValue; i < startValue + 10; i++) {
      rangeCombinations.push(i.toString().padStart(2, "0"));
    }
  } else {
    if (!isExactLengthNumericString(endNumber, 2) || startValue > parseInt(endNumber, 10)) {
      return [];
    }
    const startFirstDigit = startNumber[0];
    const startSecondDigit = startNumber[1];
    const endFirstDigit = endNumber[0];
    const endSecondDigit = endNumber[1];
    if (startFirstDigit === startSecondDigit && endFirstDigit === endSecondDigit) {
      for (let i = parseInt(startFirstDigit); i <= parseInt(endFirstDigit); i++) {
        rangeCombinations.push(`${i}${i}`);
      }
    } else if (startFirstDigit === endFirstDigit) {
      for (let i = startValue; i <= parseInt(endNumber, 10); i++) {
        rangeCombinations.push(i.toString().padStart(2, "0"));
      }
    } else if (startSecondDigit === endSecondDigit) {
      for (let i = parseInt(startFirstDigit); i <= parseInt(endFirstDigit); i++) {
        rangeCombinations.push(`${i}${startSecondDigit}`);
      }
    } else {
      return [];
    }
  }
  return Array.from(new Set(rangeCombinations));
};

/**
 * Generates combinations for a 3-digit range using the '>' operator.
 * If endNumber is omitted, generates 10 consecutive numbers.
 *
 * @param {string} startNumber - Start of the range (3 digits).
 * @param {string} [endNumber] - Optional end of the range (3 digits).
 * @returns {string[]} Array of numbers in the range.
 *
 * @example generateMappedThreeDigitRangeCombinations("120") // ["120", "121", ..., "129"]
 * @example generateMappedThreeDigitRangeCombinations("111", "113") // ["111", "112", "113"]
 * @example generateMappedThreeDigitRangeCombinations("123", "125") // ["123", "124", "125"]
 * @example generateMappedThreeDigitRangeCombinations("999", "000") // []
 */
export const generateMappedThreeDigitRangeCombinations = (startNumber: string, endNumber?: string): string[] => {
  const rangeCombinations: string[] = [];
  if (!isExactLengthNumericString(startNumber, 3)) return [];
  const startValue = parseInt(startNumber, 10);
  if (endNumber === undefined) {
    for (let i = startValue; i < startValue + 10; i++) {
      rangeCombinations.push(i.toString().padStart(3, "0"));
    }
    return Array.from(new Set(rangeCombinations));
  }
  if (!isExactLengthNumericString(endNumber, 3) || startValue > parseInt(endNumber, 10)) {
    return [];
  }
  const startFirstDigit = startNumber[0];
  const startSecondDigit = startNumber[1];
  const startThirdDigit = startNumber[2];
  const endFirstDigit = endNumber[0];
  const endSecondDigit = endNumber[1];
  const endThirdDigit = endNumber[2];
  if (startFirstDigit === startSecondDigit && startSecondDigit === startThirdDigit && endFirstDigit === endSecondDigit && endSecondDigit === endThirdDigit) {
    for (let i = parseInt(startFirstDigit); i <= parseInt(endFirstDigit); i++) {
      rangeCombinations.push(`${i}${i}${i}`);
    }
    return Array.from(new Set(rangeCombinations));
  }
  const fixedDigits: { [key: number]: string } = {};
  const varyingIndices: number[] = [];
  if (startFirstDigit === endFirstDigit) fixedDigits[1] = startFirstDigit;
  else varyingIndices.push(1);
  if (startSecondDigit === endSecondDigit) fixedDigits[2] = startSecondDigit;
  else varyingIndices.push(2);
  if (startThirdDigit === endThirdDigit) fixedDigits[3] = startThirdDigit;
  else varyingIndices.push(3);
  if (varyingIndices.length === 1) {
    const varyingIndex = varyingIndices[0];
    const varyingStartValue = parseInt(startNumber[varyingIndex - 1]);
    const varyingEndValue = parseInt(endNumber[varyingIndex - 1]);
    for (let i = varyingStartValue; i <= varyingEndValue; i++) {
      const digitArray = [startFirstDigit, startSecondDigit, startThirdDigit];
      digitArray[varyingIndex - 1] = i.toString();
      rangeCombinations.push(digitArray.join(""));
    }
  } else if (varyingIndices.length === 2) {
    if (fixedDigits[1] && !fixedDigits[2] && !fixedDigits[3]) {
      const fullStartValue = parseInt(startNumber);
      const fullEndValue = parseInt(endNumber);
      for (let i = fullStartValue; i <= fullEndValue; i++) {
        rangeCombinations.push(i.toString().padStart(3, "0"));
      }
    } else {
      return [];
    }
  } else {
    return [];
  }
  return Array.from(new Set(rangeCombinations));
};

/**
 * Result type for processInputNumber.
 */
export interface ProcessInputNumberResult {
  totalAmount: string;
  syntaxType: "2D" | "3D";
  channelMultiplierSum: number;
  numberOfCombinations: number;
  combinedNumbers: string[];
}

/**
 * Processes a bet input, validates it, generates all possible number combinations,
 * and calculates the total amount based on selected channels and bet amount.
 *
 * @param {string} betInput - The bet input string (e.g., "12X", "120~122", "10>19").
 * @param {Array} activeChannels - Array of channel objects with multipliers.
 * @param {number} betAmount - The amount to bet.
 * @returns {ProcessInputNumberResult|{error: string}} On success: result object. On error: { error }.
 *
 * @example
 *   processInputNumber("12X", [{id: "A", label: "A", multipliers: {"2D": 2, "3D": 3}}], 10)
 *   => { totalAmount: "40.00", syntaxType: "2D", channelMultiplierSum: 2, numberOfCombinations: 2, combinedNumbers: ["12", "21"] }
 *
 * @example
 *   processInputNumber("120~122", [{id: "A", label: "A", multipliers: {"2D": 2, "3D": 3}}], 5)
 *   => { totalAmount: "45.00", syntaxType: "3D", channelMultiplierSum: 3, numberOfCombinations: 3, combinedNumbers: ["120", "121", "122"] }
 *
 * @example
 *   processInputNumber("", [], 10)
 *   => { error: "Please enter a number before pressing Enter." }
 *
 * @example
 *   processInputNumber("9999X", [{id: "A", label: "A", multipliers: {"2D": 2, "3D": 3}}], 10)
 *   => { error: "Invalid number format. Supported formats: ..." }
 */
export function processInputNumber(
  betInput: string,
  activeChannels: { id: string; label: string; multipliers: { "2D": number; "3D": number } }[],
  betAmount: number
): ProcessInputNumberResult | { error: string } {
  if (betInput.trim() === "") {
    return { error: "Please enter a number before pressing Enter." };
  }
  if (activeChannels.length === 0) {
    return { error: "Please select at least one channel (e.g., A, B, C, Lo)." };
  }
  if (!isSupportedBetInput(betInput)) {
    return { error: "Invalid number format. Supported formats: ##, ###, ##X, ###X, ####X, #####X, ##>, ###>, ##>##, ###>###, ##~##, ###~###." };
  }
  if (isNaN(betAmount)) {
    return { error: "Amount is not a valid number." };
  }

  let syntaxType: "2D" | "3D";
  let combinedNumbers: string[] = [];
  let numberOfCombinations = 1;

  if (betInput.endsWith("X")) {
    const digitSequence = betInput.slice(0, -1);
    if (digitSequence.length === 2) {
      syntaxType = "2D";
    } else {
      syntaxType = "3D";
    }
    combinedNumbers = generateDigitPermutations(digitSequence, syntaxType);
    numberOfCombinations = combinedNumbers.length;
  } else if (betInput.includes(">")) {
    const rangeParts = betInput.split(">");
    const startNumber = rangeParts[0];
    const endNumber = rangeParts[1] || undefined;
    if (startNumber.length === 2) {
      syntaxType = "2D";
      combinedNumbers = generateMappedTwoDigitRangeCombinations(startNumber, endNumber);
    } else if (startNumber.length === 3) {
      syntaxType = "3D";
      combinedNumbers = generateMappedThreeDigitRangeCombinations(startNumber, endNumber);
    } else {
      return { error: "Invalid number format for range." };
    }
    if (combinedNumbers.length === 0) {
      return { error: "Invalid range: start number must not exceed end number." };
    }
    numberOfCombinations = combinedNumbers.length;
  } else if (betInput.includes("~")) {
    const [startNumber, endNumber] = betInput.split("~");
    if (startNumber.length === 2 && endNumber.length === 2) {
      syntaxType = "2D";
      combinedNumbers = generateSimpleRangeCombinations(startNumber, endNumber, 2);
    } else if (startNumber.length === 3 && endNumber.length === 3) {
      syntaxType = "3D";
      combinedNumbers = generateSimpleRangeCombinations(startNumber, endNumber, 3);
    } else {
      return { error: "Invalid number format for range." };
    }
    if (combinedNumbers.length === 0) {
      return { error: "Invalid range: start number must not exceed end number." };
    }
    numberOfCombinations = combinedNumbers.length;
  } else {
    const digitSequence = betInput;
    if (digitSequence.length === 2) {
      syntaxType = "2D";
      combinedNumbers = [digitSequence];
    } else if (digitSequence.length === 3) {
      syntaxType = "3D";
      combinedNumbers = [digitSequence];
    } else if (digitSequence.length > 3) {
      syntaxType = "3D";
      combinedNumbers = [digitSequence];
    } else {
      return { error: "Invalid number format based on digit count." };
    }
  }

  let channelMultiplierSum = 0;
  const channelDisplayInfo: string[] = [];
  activeChannels.forEach((channel) => {
    const multiplier = channel.multipliers[syntaxType];
    channelMultiplierSum += multiplier;
    channelDisplayInfo.push(`${channel.label} (${syntaxType}x${multiplier})`);
  });

  const calculatedTotalAmount = betAmount * channelMultiplierSum * numberOfCombinations;

  return {
    totalAmount: calculatedTotalAmount.toFixed(2),
    syntaxType,
    channelMultiplierSum,
    numberOfCombinations,
    combinedNumbers,
  };
}
