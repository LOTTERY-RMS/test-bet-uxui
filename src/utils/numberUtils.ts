// Number utility functions for permutations, ranges, and validation

/** Valid input patterns for number entry. Supports 2D and 3D formats with operators X, >, and ~.
 * Examples:
 * - ##: "12" (single 2-digit number)
 * - ###: "123" (single 3-digit number)
 * - ##X: "12X" (permutations of 2 digits, e.g., ["12", "21"])
 * - ###X: "123X" (permutations of 3 digits, e.g., ["123", "132", "213", "231", "312", "321"])
 * - ##>: "10>" (range of 10 numbers, e.g., ["10", "11", ..., "19"])
 * - ###>: "120>" (range of 10 numbers, e.g., ["120", "121", ..., "129"])
 * - ##>##: "10>19" (specific 2-digit range, e.g., ["10", "11", ..., "19"])
 * - ###>###: "120>129" (specific 3-digit range, e.g., ["120", "121", ..., "129"])
 * - ##~##: "10~19" (simple 2-digit range, e.g., ["10", "11", ..., "19"])
 * - ###~###: "120~129" (simple 3-digit range, e.g., ["120", "121", ..., "129"])
 */
export const VALID_FINAL_INPUT_PATTERNS = [
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
 * - isExactLengthNumericString("12", 2) → true
 * - isExactLengthNumericString("123", 3) → true
 * - isExactLengthNumericString("123", 2) → false
 * - isExactLengthNumericString("ab", 2) → false
 */
export const isExactLengthNumericString = (str: string, digitLength: number): boolean => {
  const num = parseInt(str, 10);
  return !isNaN(num) && str.length === digitLength;
};

/** Checks if a final input string matches allowed patterns and frequency rules.
 * @param betInput The input string to validate (e.g., "10X", "120>129").
 * @returns True if the input matches a valid pattern and frequency rules, false otherwise.
 * Examples:
 * - isSupportedBetInput("12X") → true
 * - isSupportedBetInput("120>129") → true
 * - isSupportedBetInput("10~19") → true
 * - isSupportedBetInput("1234") → false
 * - isSupportedBetInput("1111X") → false (digit '1' appears 4 times)
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

/** Generates unique 2D or 3D digit permutations.
 * @param digitString The string of digits to permute (e.g., "12", "123").
 * @param syntaxType "2D" or "3D".
 * @returns Array of unique permutations.
 * Examples:
 * - generateDigitPermutations("12", "2D") → ["12", "21"]
 * - generateDigitPermutations("11", "2D") → ["11"]
 * - generateDigitPermutations("123", "3D") → ["123", "132", "213", "231", "312", "321"]
 * - generateDigitPermutations("112", "3D") → ["112", "121", "211"]
 */
export function generateDigitPermutations(digitString: string, syntaxType: "2D" | "3D"): string[] {
  // Handle 2D case: only two digits
  if (syntaxType === "2D") {
    if (digitString.length !== 2) return [];
    const [a, b] = digitString; // Destructure the two digits
    // If both digits are the same, only one permutation exists
    // Otherwise, return both the original and its reverse
    return a === b ? [digitString] : [digitString, b + a];
  }
  // Handle 3D case:
  if (digitString.length < 3) return [];
  const digits = digitString.split(""); // Split the string into an array of digits
  const results: string[] = [];

  // Recursive helper to generate all permutations
  const permutate = (arr: string[], memo: string[] = []) => {
    // If we've built a 3-digit permutation, join and add to results
    if (memo.length === 3) {
      results.push(memo.join(""));
      return;
    }
    // Try each remaining digit in the current position
    for (let i = 0; i < arr.length; i++) {
      const cur = arr.splice(i, 1)[0]; // Remove digit at index i
      permutate(arr, memo.concat(cur)); // Recurse with the chosen digit added to the memo
      arr.splice(i, 0, cur); // Restore digit (backtrack)
    }
  };
  permutate(digits); // Start permutation with all digits
  return Array.from(new Set(results));
}

/** Generates combinations for a simple range of 2-digit or 3-digit numbers (using ~ operator).
 * @param startNumber The starting number string (e.g., "10", "120").
 * @param endNumber The ending number string (e.g., "19", "129").
 * @param syntaxType Either "2D" or "3D".
 * @returns Array of numbers in the range, padded with leading zeros.
 * Examples:
 * - generateSimpleRangeCombinations("10", "19", "2D") → ["10", "11", ..., "19"]
 * - generateSimpleRangeCombinations("120", "129", "3D") → ["120", "121", ..., "129"]
 * - generateSimpleRangeCombinations("19", "10", "2D") → [] (invalid: start > end)
 * - generateSimpleRangeCombinations("10", "abc", "2D") → [] (invalid: non-numeric)
 */
export const generateSimpleRangeCombinations = (startNumber: string, endNumber: string, syntaxType: "2D" | "3D"): string[] => {
  const digitLength = syntaxType === "2D" ? 2 : 3;
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

/** Generates combinations for a 2-digit range using the > operator.
 * @param startNumber The starting 2-digit number (e.g., "10").
 * @param endNumber The ending 2-digit number (optional, for ##>##, e.g., "19").
 * @returns Array of numbers in the range, considering specific patterns.
 * Examples:
 * - generateMappedTwoDigitRangeCombinations("10") → ["10", "11", ..., "19"]
 * - generateMappedTwoDigitRangeCombinations("00", "99") → ["00", "11", ..., "99"]
 * - generateMappedTwoDigitRangeCombinations("10", "19") → ["10", "11", ..., "19"]
 * - generateMappedTwoDigitRangeCombinations("01", "91") → ["01", "11", ..., "91"]
 * - generateMappedTwoDigitRangeCombinations("12", "23") → [] (invalid range)
 */
export const generateMappedTwoDigitRangeCombinations = (startNumber: string, endNumber?: string): string[] => {
  // Validate input: must be 2 digits
  if (!isExactLengthNumericString(startNumber, 2)) return [];
  const startValue = parseInt(startNumber, 10);

  // Case 1: No endNumber, generate 10 consecutive numbers
  if (endNumber === undefined) {
    const result: string[] = [];
    for (let i = 0; i < 10; i++) {
      result.push((startValue + i).toString().padStart(2, "0"));
    }
    return result;
  }

  // Validate endNumber
  if (!isExactLengthNumericString(endNumber, 2) || startValue > parseInt(endNumber, 10)) {
    return [];
  }

  const startFirst = startNumber[0];
  const startSecond = startNumber[1];
  const endFirst = endNumber[0];
  const endSecond = endNumber[1];

  // Case 2: Both digits same in start and end (e.g., "11" to "22")
  if (startFirst === startSecond && endFirst === endSecond) {
    const from = parseInt(startFirst);
    const to = parseInt(endFirst);
    if (from > to) return [];
    const result: string[] = [];
    for (let i = from; i <= to; i++) {
      result.push(i.toString() + i.toString());
    }
    return result;
  }

  // Case 3: First digit same (e.g., "10" to "19")
  if (startFirst === endFirst) {
    const from = parseInt(startNumber, 10);
    const to = parseInt(endNumber, 10);
    const result: string[] = [];
    for (let i = from; i <= to; i++) {
      result.push(i.toString().padStart(2, "0"));
    }
    return result;
  }

  // Case 4: Second digit same (e.g., "01" to "91")
  if (startSecond === endSecond) {
    const from = parseInt(startFirst);
    const to = parseInt(endFirst);
    if (from > to) return [];
    const result: string[] = [];
    for (let i = from; i <= to; i++) {
      result.push(i.toString() + startSecond);
    }
    return result;
  }

  // Not supported
  return [];
};

/** Generates combinations for a 3-digit range using the > operator.
 * @param startNumber The starting 3-digit number (e.g., "120").
 * @param endNumber The ending 3-digit number (optional, for ###>###, e.g., "129").
 * @returns Array of numbers in the range, considering specific patterns.
 * Examples:
 * - generateMappedThreeDigitRangeCombinations("120") → ["120", "121", ..., "129"]
 * - generateMappedThreeDigitRangeCombinations("000", "999") → ["000", "111", ..., "999"]
 * - generateMappedThreeDigitRangeCombinations("120", "129") → ["120", "121", ..., "129"]
 * - generateMappedThreeDigitRangeCombinations("101", "191") → ["101", "111", ..., "191"]
 * - generateMappedThreeDigitRangeCombinations("110", "910") → ["110", "210", ..., "910"]
 * - generateMappedThreeDigitRangeCombinations("500", "599") → ["500", "501", ..., "599"]
 * - generateMappedThreeDigitRangeCombinations("050", "959") → [] (invalid range)
 * - generateMappedThreeDigitRangeCombinations("005", "995") → [] (invalid range)
 * - generateMappedThreeDigitRangeCombinations("123", "456") → [] (invalid range)
 */
export const generateMappedThreeDigitRangeCombinations = (startNumber: string, endNumber?: string): string[] => {
  const rangeCombinations: string[] = [];
  // Validate input: must be 3 digits
  if (!isExactLengthNumericString(startNumber, 3)) return [];
  const startValue = parseInt(startNumber, 10);

  // Case 1: No endNumber, generate 10 consecutive numbers
  // Example: "120" → ["120", "121", ..., "129"]
  if (endNumber === undefined) {
    for (let i = startValue; i < startValue + 10; i++) {
      rangeCombinations.push(i.toString().padStart(3, "0"));
    }
    return Array.from(new Set(rangeCombinations));
  }

  // Validate endNumber
  if (!isExactLengthNumericString(endNumber, 3) || startValue > parseInt(endNumber, 10)) {
    return [];
  }

  // Extract digits for case analysis
  const startD1 = startNumber[0];
  const startD2 = startNumber[1];
  const startD3 = startNumber[2];
  const endD1 = endNumber[0];
  const endD2 = endNumber[1];
  const endD3 = endNumber[2];

  // Case 2: All digits same in start and end (e.g., "111" to "999")
  // Example: "111", "999" → ["111", "222", ..., "999"]
  if (startD1 === startD2 && startD2 === startD3 && endD1 === endD2 && endD2 === endD3) {
    for (let i = parseInt(startD1); i <= parseInt(endD1); i++) {
      rangeCombinations.push(`${i}${i}${i}`);
    }
    return Array.from(new Set(rangeCombinations));
  }

  // Determine which digits are fixed (store their indices)
  const fixedIndices: number[] = [];
  if (startD1 === endD1) fixedIndices.push(0);
  if (startD2 === endD2) fixedIndices.push(1);
  if (startD3 === endD3) fixedIndices.push(2);

  const numFixed = fixedIndices.length;

  // Case 3: Only one digit varies (others fixed)
  // - Vary last digit: "120", "125" → ["120", "121", ..., "125"]
  // - Vary middle digit: "101", "191" → ["101", "111", ..., "191"]
  // - Vary first digit: "210", "910" → ["210", "310", ..., "910"]
  if (numFixed === 2) {
    // Find the varying index (0, 1, or 2)
    const varyingIndex = [0, 1, 2].find((idx) => !fixedIndices.includes(idx));
    if (varyingIndex === undefined) return [];
    const varyingStartValue = parseInt(startNumber[varyingIndex]);
    const varyingEndValue = parseInt(endNumber[varyingIndex]);
    for (let i = varyingStartValue; i <= varyingEndValue; i++) {
      const digitArray = [startD1, startD2, startD3];
      digitArray[varyingIndex] = i.toString();
      rangeCombinations.push(digitArray.join(""));
    }
  }
  // Case 4: First digit fixed, other two vary together (full range)
  // Example:
  //  - "100", "199" → ["100", "101", ..., "199"]
  //  - "100", "150" → ["100", "101", ..., "150"]
  //  - "151", "199" → ["151", "152", ..., "199"]
  else if (numFixed === 1 && fixedIndices[0] === 0) {
    const fullStartValue = parseInt(startNumber);
    const fullEndValue = parseInt(endNumber);
    for (let i = fullStartValue; i <= fullEndValue; i++) {
      rangeCombinations.push(i.toString().padStart(3, "0"));
    }
  } else {
    // Not supported: more than two digits vary or not a supported pattern
    return [];
  }
  return Array.from(new Set(rangeCombinations));
};

/** Result type for processInputNumber. */
export interface ProcessInputNumberResult {
  totalAmount: string;
  syntaxType: "2D" | "3D";
  channelMultiplierSum: number;
  numberOfCombinations: number;
  combinedNumbers: string[];
}

/** Processes a bet input, validates it, generates all possible number combinations, and calculates the total amount.
 * @param betInput The bet input string (e.g., "12X", "120~122", "10>19").
 * @param activeChannels Array of channel objects with multipliers.
 * @param betAmount The amount to bet.
 * @returns On success: result object. On error: { error }.
 * Examples:
 * - processInputNumber("12X", [{id: "A", label: "A", multipliers: {"2D": 2, "3D": 3}}], 10)
 *   → { totalAmount: "40.00", syntaxType: "2D", channelMultiplierSum: 2, numberOfCombinations: 2, combinedNumbers: ["12", "21"] }
 * - processInputNumber("120~122", [{id: "A", label: "A", multipliers: {"2D": 2, "3D": 3}}], 5)
 *   → { totalAmount: "45.00", syntaxType: "3D", channelMultiplierSum: 3, numberOfCombinations: 3, combinedNumbers: ["120", "121", "122"] }
 * - processInputNumber("", [], 10)
 *   → { error: "Please enter a number before pressing Enter." }
 * - processInputNumber("9999X", [{id: "A", label: "A", multipliers: {"2D": 2, "3D": 3}}], 10)
 *   → { error: "Invalid number format. Supported formats: ..." }
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
    } else if (startNumber.length === 3 && endNumber.length === 3) {
      syntaxType = "3D";
    } else {
      return { error: "Invalid number format for range." };
    }
    combinedNumbers = generateSimpleRangeCombinations(startNumber, endNumber, syntaxType);
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
  activeChannels.forEach((channel) => {
    const multiplier = channel.multipliers[syntaxType];
    channelMultiplierSum += multiplier;
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
