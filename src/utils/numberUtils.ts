// Number utility functions for permutations, ranges, and validation

/** Valid input patterns for number entry. Supports 2D, 3D, and extended formats with operators X, >, and ~. */
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

/** Validates if a string is a valid number of specified digit length. */
export const isExactLengthNumericString = (numericString: string, expectedLength: number): boolean => {
  const parsedNumber = parseInt(numericString, 10);
  return !isNaN(parsedNumber) && numericString.length === expectedLength;
};

/** Checks if a final input string matches allowed patterns and frequency rules. */
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

/** Generates unique 2D or 3D digit combinations/permutations. */
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

/** Generates combinations for a simple range of 2-digit or 3-digit numbers (using ~ operator). */
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

/** Generates combinations for a 2-digit range using the > operator. */
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

/** Generates combinations for a 3-digit range using the > operator. */
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

export interface ProcessInputNumberResult {
  totalAmount: string;
  syntaxType: "2D" | "3D";
  channelMultiplierSum: number;
  numberOfCombinations: number;
  combinedNumbers: string[];
}

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
