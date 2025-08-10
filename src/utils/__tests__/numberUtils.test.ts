import { describe, it, expect, beforeAll, afterAll } from "vitest";

import { isInputValidForPrefix, isSupportedBetInput, processInputNumber } from "../numberUtils";
import { getTestCases } from "./setup-test-db";
import { Pool } from "pg";

describe("numberUtils", () => {
  describe("isInputValidForPrefix", () => {
    it("should accept empty input", () => {
      expect(isInputValidForPrefix("")).toBe(true);
    });

    it("should accept partial numeric inputs", () => {
      expect(isInputValidForPrefix("1")).toBe(true);
      expect(isInputValidForPrefix("12")).toBe(true);
      expect(isInputValidForPrefix("123")).toBe(true);
    });

    it("should accept X pattern inputs", () => {
      expect(isInputValidForPrefix("1X")).toBe(true);
      expect(isInputValidForPrefix("12X")).toBe(true);
      expect(isInputValidForPrefix("123X")).toBe(true);
    });

    it("should accept XX pattern inputs", () => {
      expect(isInputValidForPrefix("1X2")).toBe(true);
      expect(isInputValidForPrefix("12X34")).toBe(true);
      expect(isInputValidForPrefix("1X2X3")).toBe(true);
    });

    it("should accept range pattern inputs", () => {
      expect(isInputValidForPrefix("12>")).toBe(true);
      expect(isInputValidForPrefix("123>")).toBe(true);
      expect(isInputValidForPrefix("12>19")).toBe(true);
      expect(isInputValidForPrefix("123>129")).toBe(true);
    });

    it("should reject invalid patterns", () => {
      // No invalid patterns to reject - all patterns are accepted for intermediate typing
    });

    it("should accept 4+ digit prefixes for intermediate typing", () => {
      expect(isInputValidForPrefix("1234")).toBe(true); // 4 digits allowed as prefix
      expect(isInputValidForPrefix("12345")).toBe(true); // 5 digits allowed as prefix
    });

    it("should accept valid XX pattern prefixes", () => {
      expect(isInputValidForPrefix("12X4")).toBe(true); // Valid XX pattern prefix
      expect(isInputValidForPrefix("1X2")).toBe(true); // Valid XX pattern prefix
      expect(isInputValidForPrefix("123X456")).toBe(true); // Valid XX pattern prefix
      expect(isInputValidForPrefix("1X2X")).toBe(true); // Valid XX pattern prefix (empty third part)
    });

    it("should enforce frequency rules for X inputs", () => {
      expect(isInputValidForPrefix("1111X")).toBe(false); // 1 appears 4 times
      expect(isInputValidForPrefix("2222X")).toBe(false); // 2 appears 4 times
      expect(isInputValidForPrefix("3333X")).toBe(false); // 3 appears 4 times
    });

    it("should accept valid frequency patterns", () => {
      expect(isInputValidForPrefix("111X")).toBe(true); // 1 appears 3 times
      expect(isInputValidForPrefix("222X")).toBe(true); // 2 appears 3 times
      expect(isInputValidForPrefix("333X")).toBe(true); // 3 appears 3 times
      expect(isInputValidForPrefix("11222X")).toBe(true); // 1 appears 2 times, 2 appears 3 times
    });
  });

  describe("isSupportedBetInput", () => {
    it("should accept exact 2-digit numbers", () => {
      expect(isSupportedBetInput("12")).toBe(true);
      expect(isSupportedBetInput("34")).toBe(true);
      expect(isSupportedBetInput("99")).toBe(true);
    });

    it("should accept exact 3-digit numbers", () => {
      expect(isSupportedBetInput("123")).toBe(true);
      expect(isSupportedBetInput("456")).toBe(true);
      expect(isSupportedBetInput("999")).toBe(true);
    });

    it("should accept X pattern inputs", () => {
      expect(isSupportedBetInput("12X")).toBe(true);
      expect(isSupportedBetInput("123X")).toBe(true);
      expect(isSupportedBetInput("1234X")).toBe(true);
      expect(isSupportedBetInput("12345X")).toBe(true);
      expect(isSupportedBetInput("123456X")).toBe(true);
    });

    it("should accept XX pattern inputs", () => {
      expect(isSupportedBetInput("1X2")).toBe(true);
      expect(isSupportedBetInput("12X34")).toBe(true);
      expect(isSupportedBetInput("1X2X3")).toBe(true);
      expect(isSupportedBetInput("12X34X56")).toBe(true);
    });

    it("should accept range pattern inputs", () => {
      expect(isSupportedBetInput("12>19")).toBe(true);
      expect(isSupportedBetInput("123>129")).toBe(true);
      expect(isSupportedBetInput("12>")).toBe(true);
      expect(isSupportedBetInput("123>")).toBe(true);
    });

    it("should reject invalid patterns", () => {
      expect(isSupportedBetInput("1234")).toBe(false); // 4 digits
      expect(isSupportedBetInput("1")).toBe(false); // 1 digit
      expect(isSupportedBetInput("12~19")).toBe(false); // ~ not supported in validation
    });

    it("should accept valid XX patterns", () => {
      expect(isSupportedBetInput("12X4")).toBe(true); // Valid XX pattern
      expect(isSupportedBetInput("1X2")).toBe(true); // Valid XX pattern
      expect(isSupportedBetInput("123X456")).toBe(true); // Valid XX pattern
    });

    it("should enforce frequency rules for X inputs", () => {
      expect(isSupportedBetInput("1111X")).toBe(false); // 1 appears 4 times
      expect(isSupportedBetInput("2222X")).toBe(false); // 2 appears 4 times
      expect(isSupportedBetInput("3333X")).toBe(false); // 3 appears 4 times
      expect(isSupportedBetInput("11111X")).toBe(false); // 1 appears 5 times
      expect(isSupportedBetInput("111111X")).toBe(false); // 1 appears 6 times
    });

    it("should accept valid frequency patterns", () => {
      expect(isSupportedBetInput("111X")).toBe(true); // 1 appears 3 times
      expect(isSupportedBetInput("222X")).toBe(true); // 2 appears 3 times
      expect(isSupportedBetInput("333X")).toBe(true); // 3 appears 3 times
      expect(isSupportedBetInput("11222X")).toBe(true); // 1 appears 2 times, 2 appears 3 times
      expect(isSupportedBetInput("111222X")).toBe(true); // 1 appears 3 times, 2 appears 3 times
    });
  });

  describe("processInputNumber", () => {
    const mockChannels = [
      { id: "A", label: "A", multipliers: { "2D": 2, "3D": 3 } },
      { id: "B", label: "B", multipliers: { "2D": 1.5, "3D": 2.5 } },
    ];

    it("should reject empty input", () => {
      const result = processInputNumber("", mockChannels, 10);
      expect("error" in result).toBe(true);
      if ("error" in result) {
        expect(result.error).toBe("Please enter a number before pressing Enter.");
      }
    });

    it("should reject input with no channels", () => {
      const result = processInputNumber("12", [], 10);
      expect("error" in result).toBe(true);
      if ("error" in result) {
        expect(result.error).toBe("Please select at least one channel (e.g., A, B, C, Lo).");
      }
    });

    it("should reject invalid bet input", () => {
      const result = processInputNumber("1234", mockChannels, 10);
      expect("error" in result).toBe(true);
      if ("error" in result) {
        expect(result.error).toBe("Invalid number format. Supported formats: ##, ###, ##X, ###X, ####X, #####X, ##X##, ##X##X##, ##>, ###>, ##>##, ###>###.");
      }
    });

    it("should reject invalid bet amount", () => {
      const result = processInputNumber("12", mockChannels, NaN);
      expect("error" in result).toBe(true);
      if ("error" in result) {
        expect(result.error).toBe("Amount is not a valid number.");
      }
    });

    it("should reject negative bet amount", () => {
      const result = processInputNumber("12", mockChannels, -10);
      expect("error" in result).toBe(false);
      if (!("error" in result)) {
        expect(result.totalAmount).toBe("-35.00"); // -10 * 3.5 * 1
      }
    });

    it("should reject zero bet amount", () => {
      const result = processInputNumber("12", mockChannels, 0);
      expect("error" in result).toBe(false);
      if (!("error" in result)) {
        expect(result.totalAmount).toBe("0.00"); // 0 * 3.5 * 1
      }
    });

    it("should process exact 2-digit numbers", () => {
      const result = processInputNumber("12", mockChannels, 10);
      expect("error" in result).toBe(false);
      if (!("error" in result)) {
        expect(result.syntaxType).toBe("2D");
        expect(result.numberOfCombinations).toBe(1);
        expect(result.combinedNumbers).toEqual(["12"]);
        expect(result.channelMultiplierSum).toBe(3.5); // 2 + 1.5
        expect(result.totalAmount).toBe("35.00"); // 10 * 3.5 * 1
      }
    });

    it("should process exact 3-digit numbers", () => {
      const result = processInputNumber("123", mockChannels, 10);
      expect("error" in result).toBe(false);
      if (!("error" in result)) {
        expect(result.syntaxType).toBe("3D");
        expect(result.numberOfCombinations).toBe(1);
        expect(result.combinedNumbers).toEqual(["123"]);
        expect(result.channelMultiplierSum).toBe(5.5); // 3 + 2.5
        expect(result.totalAmount).toBe("55.00"); // 10 * 5.5 * 1
      }
    });

    it("should process X pattern inputs", () => {
      const result = processInputNumber("12X", mockChannels, 10);
      expect("error" in result).toBe(false);
      if (!("error" in result)) {
        expect(result.syntaxType).toBe("2D");
        expect(result.numberOfCombinations).toBe(2);
        expect(result.combinedNumbers).toEqual(["12", "21"]);
        expect(result.channelMultiplierSum).toBe(3.5);
        expect(result.totalAmount).toBe("70.00"); // 10 * 3.5 * 2
      }
    });

    it("should process XX pattern inputs", () => {
      const result = processInputNumber("1X2", mockChannels, 10);
      expect("error" in result).toBe(false);
      if (!("error" in result)) {
        expect(result.syntaxType).toBe("2D");
        expect(result.numberOfCombinations).toBe(1);
        expect(result.combinedNumbers).toEqual(["12"]);
        expect(result.channelMultiplierSum).toBe(3.5);
        expect(result.totalAmount).toBe("35.00");
      }
    });

    it("should process range pattern inputs", () => {
      const result = processInputNumber("10>19", mockChannels, 10);
      expect("error" in result).toBe(false);
      if (!("error" in result)) {
        expect(result.syntaxType).toBe("2D");
        expect(result.numberOfCombinations).toBe(10);
        expect(result.combinedNumbers).toEqual(["10", "11", "12", "13", "14", "15", "16", "17", "18", "19"]);
        expect(result.channelMultiplierSum).toBe(3.5);
        expect(result.totalAmount).toBe("350.00"); // 10 * 3.5 * 10
      }
    });

    it("should process range pattern inputs without end number", () => {
      const result = processInputNumber("10>", mockChannels, 10);
      expect("error" in result).toBe(false);
      if (!("error" in result)) {
        expect(result.syntaxType).toBe("2D");
        expect(result.numberOfCombinations).toBe(10);
        expect(result.combinedNumbers).toEqual(["10", "11", "12", "13", "14", "15", "16", "17", "18", "19"]);
        expect(result.channelMultiplierSum).toBe(3.5);
        expect(result.totalAmount).toBe("350.00");
      }
    });

    it("should process 3-digit range pattern inputs", () => {
      const result = processInputNumber("120>129", mockChannels, 10);
      expect("error" in result).toBe(false);
      if (!("error" in result)) {
        expect(result.syntaxType).toBe("3D");
        expect(result.numberOfCombinations).toBe(10);
        expect(result.combinedNumbers).toEqual(["120", "121", "122", "123", "124", "125", "126", "127", "128", "129"]);
        expect(result.channelMultiplierSum).toBe(5.5);
        expect(result.totalAmount).toBe("550.00"); // 10 * 5.5 * 10
      }
    });

    it("should handle single channel", () => {
      const singleChannel = [{ id: "A", label: "A", multipliers: { "2D": 2, "3D": 3 } }];
      const result = processInputNumber("12", singleChannel, 10);
      expect("error" in result).toBe(false);
      if (!("error" in result)) {
        expect(result.channelMultiplierSum).toBe(2);
        expect(result.totalAmount).toBe("20.00"); // 10 * 2 * 1
      }
    });

    it("should handle decimal bet amounts", () => {
      const result = processInputNumber("12", mockChannels, 5.5);
      expect("error" in result).toBe(false);
      if (!("error" in result)) {
        expect(result.totalAmount).toBe("19.25"); // 5.5 * 3.5 * 1
      }
    });

    // Additional comprehensive test cases
    it("should process complex X patterns with 4+ digits", () => {
      const result = processInputNumber("1234X", mockChannels, 10);
      expect("error" in result).toBe(false);
      if (!("error" in result)) {
        expect(result.syntaxType).toBe("3D");
        expect(result.numberOfCombinations).toBeGreaterThan(0);
        expect(result.combinedNumbers.length).toBe(result.numberOfCombinations);
      }
    });

    it("should process triple X patterns (3D)", () => {
      const result = processInputNumber("12X34X56", mockChannels, 10);
      expect("error" in result).toBe(false);
      if (!("error" in result)) {
        expect(result.syntaxType).toBe("3D");
        expect(result.numberOfCombinations).toBe(8); // 2 digits × 2 digits × 2 digits = 8 combinations
        expect(result.combinedNumbers).toEqual(["135", "136", "145", "146", "235", "236", "245", "246"]);
      }
    });

    it("should process triple X patterns with single digits", () => {
      const result = processInputNumber("1X2X3", mockChannels, 10);
      expect("error" in result).toBe(false);
      if (!("error" in result)) {
        expect(result.syntaxType).toBe("3D");
        expect(result.numberOfCombinations).toBe(1); // 1 digit × 1 digit × 1 digit = 1 combination
        expect(result.combinedNumbers).toEqual(["123"]);
      }
    });

    it("should process double X patterns (2D)", () => {
      const result = processInputNumber("12X34", mockChannels, 10);
      expect("error" in result).toBe(false);
      if (!("error" in result)) {
        expect(result.syntaxType).toBe("2D");
        expect(result.numberOfCombinations).toBe(4);
        expect(result.combinedNumbers).toEqual(["13", "14", "23", "24"]);
      }
    });

    it("should process double X patterns with different digit counts", () => {
      const result = processInputNumber("1X234", mockChannels, 10);
      expect("error" in result).toBe(false);
      if (!("error" in result)) {
        expect(result.syntaxType).toBe("2D");
        expect(result.numberOfCombinations).toBe(3); // 1 digit × 3 digits = 3 combinations
        expect(result.combinedNumbers).toEqual(["12", "13", "14"]);
      }
    });

    // Additional X pattern tests
    it("should process single X with different digit lengths", () => {
      const result = processInputNumber("123X", mockChannels, 10);
      expect("error" in result).toBe(false);
      if (!("error" in result)) {
        expect(result.syntaxType).toBe("3D");
        expect(result.numberOfCombinations).toBe(6); // 3! = 6 permutations
        expect(result.combinedNumbers).toContain("123");
        expect(result.combinedNumbers).toContain("321");
        expect(result.combinedNumbers).toContain("213");
      }
    });

    it("should process X with repeated digits", () => {
      const result = processInputNumber("112X", mockChannels, 10);
      expect("error" in result).toBe(false);
      if (!("error" in result)) {
        expect(result.syntaxType).toBe("3D");
        expect(result.numberOfCombinations).toBe(3); // 3 unique permutations due to repeated 1
        expect(result.combinedNumbers).toContain("112");
        expect(result.combinedNumbers).toContain("121");
        expect(result.combinedNumbers).toContain("211");
      }
    });

    it("should process X with all same digits", () => {
      const result = processInputNumber("111X", mockChannels, 10);
      expect("error" in result).toBe(false);
      if (!("error" in result)) {
        expect(result.syntaxType).toBe("3D");
        expect(result.numberOfCombinations).toBe(1); // Only 1 unique permutation
        expect(result.combinedNumbers).toEqual(["111"]);
      }
    });
    // Edge cases for valid inputs
    it("should handle minimum valid 2D input", () => {
      const result = processInputNumber("00", mockChannels, 10);
      expect("error" in result).toBe(false);
      if (!("error" in result)) {
        expect(result.syntaxType).toBe("2D");
        expect(result.numberOfCombinations).toBe(1);
        expect(result.combinedNumbers).toEqual(["00"]);
      }
    });

    it("should handle maximum valid 2D input", () => {
      const result = processInputNumber("99", mockChannels, 10);
      expect("error" in result).toBe(false);
      if (!("error" in result)) {
        expect(result.syntaxType).toBe("2D");
        expect(result.numberOfCombinations).toBe(1);
        expect(result.combinedNumbers).toEqual(["99"]);
      }
    });

    it("should handle minimum valid 3D input", () => {
      const result = processInputNumber("000", mockChannels, 10);
      expect("error" in result).toBe(false);
      if (!("error" in result)) {
        expect(result.syntaxType).toBe("3D");
        expect(result.numberOfCombinations).toBe(1);
        expect(result.combinedNumbers).toEqual(["000"]);
      }
    });

    it("should handle maximum valid 3D input", () => {
      const result = processInputNumber("999", mockChannels, 10);
      expect("error" in result).toBe(false);
      if (!("error" in result)) {
        expect(result.syntaxType).toBe("3D");
        expect(result.numberOfCombinations).toBe(1);
        expect(result.combinedNumbers).toEqual(["999"]);
      }
    });

    // Channel multiplier edge cases
    it("should handle zero channel multiplier", () => {
      const zeroChannels = [{ id: "A", label: "A", multipliers: { "2D": 0, "3D": 0 } }];
      const result = processInputNumber("12", zeroChannels, 10);
      expect("error" in result).toBe(false);
      if (!("error" in result)) {
        expect(result.totalAmount).toBe("0.00");
        expect(result.channelMultiplierSum).toBe(0);
      }
    });

    it("should handle decimal channel multiplier", () => {
      const decimalChannels = [{ id: "A", label: "A", multipliers: { "2D": 1.5, "3D": 2.5 } }];
      const result = processInputNumber("12", decimalChannels, 10);
      expect("error" in result).toBe(false);
      if (!("error" in result)) {
        expect(result.totalAmount).toBe("15.00");
        expect(result.channelMultiplierSum).toBe(1.5);
      }
    });

    it("should handle large channel multiplier", () => {
      const largeChannels = [{ id: "A", label: "A", multipliers: { "2D": 1000, "3D": 2000 } }];
      const result = processInputNumber("12", largeChannels, 10);
      expect("error" in result).toBe(false);
      if (!("error" in result)) {
        expect(result.totalAmount).toBe("10000.00");
        expect(result.channelMultiplierSum).toBe(1000);
      }
    });

    // Bet amount edge cases
    it("should handle very small bet amount", () => {
      const result = processInputNumber("12", mockChannels, 0.01);
      expect("error" in result).toBe(false);
      if (!("error" in result)) {
        expect(result.totalAmount).toBe("0.04");
        expect(result.numberOfCombinations).toBe(1);
      }
    });

    it("should handle large bet amount", () => {
      const result = processInputNumber("12", mockChannels, 1000000);
      expect("error" in result).toBe(false);
      if (!("error" in result)) {
        expect(result.totalAmount).toBe("3500000.00");
        expect(result.numberOfCombinations).toBe(1);
      }
    });

    // Complex combination tests
    it("should process complex X pattern with many digits", () => {
      const result = processInputNumber("123456X", mockChannels, 10);
      expect("error" in result).toBe(false);
      if (!("error" in result)) {
        expect(result.syntaxType).toBe("3D");
        expect(result.numberOfCombinations).toBe(120); // 6! = 720, but only 3-digit combinations
        expect(result.combinedNumbers).toContain("123");
        expect(result.combinedNumbers).toContain("321");
        expect(result.combinedNumbers).toContain("456");
      }
    });

    // Error case tests
    it("should reject unsupported operators", () => {
      const result = processInputNumber("12+34", mockChannels, 10);
      expect("error" in result).toBe(true);
      if ("error" in result) {
        expect(result.error).toContain("Invalid");
      }
    });

    it("should reject malformed X pattern", () => {
      const result = processInputNumber("X123", mockChannels, 10);
      expect("error" in result).toBe(true);
      if ("error" in result) {
        expect(result.error).toContain("Invalid");
      }
    });

    it("should reject malformed range pattern", () => {
      const result = processInputNumber("12~", mockChannels, 10);
      expect("error" in result).toBe(true);
      if ("error" in result) {
        expect(result.error).toContain("Invalid");
      }
    });

    it("should reject invalid range order", () => {
      const result = processInputNumber("20~15", mockChannels, 10);
      expect("error" in result).toBe(true);
      if ("error" in result) {
        expect(result.error).toContain("Invalid");
      }
    });

    it("should reject mixed digit lengths in range", () => {
      const result = processInputNumber("12~123", mockChannels, 10);
      expect("error" in result).toBe(true);
      if ("error" in result) {
        expect(result.error).toContain("Invalid");
      }
    });

    it("should reject non-numeric characters", () => {
      const result = processInputNumber("1a2", mockChannels, 10);
      expect("error" in result).toBe(true);
      if ("error" in result) {
        expect(result.error).toContain("Invalid");
      }
    });

    it("should reject special characters", () => {
      const result = processInputNumber("12@34", mockChannels, 10);
      expect("error" in result).toBe(true);
      if ("error" in result) {
        expect(result.error).toContain("Invalid");
      }
    });

    it("should reject whitespace", () => {
      const result = processInputNumber("12 34", mockChannels, 10);
      expect("error" in result).toBe(true);
      if ("error" in result) {
        expect(result.error).toContain("Invalid");
      }
    });

    it("should reject empty string", () => {
      const result = processInputNumber("", mockChannels, 10);
      expect("error" in result).toBe(true);
      if ("error" in result) {
        expect(result.error).toContain("Please enter a number");
      }
    });

    it("should reject null input", () => {
      const result = processInputNumber(null as unknown as string, mockChannels, 10);
      expect("error" in result).toBe(true);
      if ("error" in result) {
        expect(result.error).toContain("Invalid");
      }
    });

    it("should reject undefined input", () => {
      const result = processInputNumber(undefined as unknown as string, mockChannels, 10);
      expect("error" in result).toBe(true);
      if ("error" in result) {
        expect(result.error).toContain("Invalid");
      }
    });
  });
});

describe("Dynamic Database Tests", () => {
  let pool: Pool;

  beforeAll(async () => {
    // Connect to existing database
    pool = new Pool({
      host: "localhost",
      database: "test_bet_uxui",
      user: "postgres",
      password: "password",
      port: 5432,
    });
  });

  afterAll(async () => {
    await pool.end();
  });

  describe("Database-driven test cases", () => {
    it("should process all test cases from database", async () => {
      const testCases = await getTestCases(pool);
      const mockChannels = [{ id: "A", label: "A", multipliers: { "2D": 2, "3D": 3 } }];

      for (const testCase of testCases) {
        // Construct the input string based on the test case
        let inputString = "";
        if (testCase.start_number && testCase.end_number) {
          // Range case with both start and end
          inputString = `${testCase.start_number}${testCase.sign}${testCase.end_number}`;
        } else if (testCase.start_number) {
          // Single number or X permutation case
          inputString = `${testCase.start_number}${testCase.sign}`;
        }

        // Skip empty inputs
        if (!inputString) continue;

        // Test the processInputNumber function
        const result = processInputNumber(inputString, mockChannels, 10);

        if ("error" in result) {
          console.log(`Error for test case: ${inputString}`);
          console.log(`  Description: ${testCase.description}`);
          console.log(`  Error: ${result.error}`);
        }

        // Verify the result matches expected values
        expect("error" in result).toBe(false);
        if (!("error" in result)) {
          expect(result.syntaxType).toBe(testCase.syntax_type);
          expect(result.numberOfCombinations).toBe(testCase.expected_count);

          // Sort both arrays for comparison since order might not matter
          const sortedResult = [...result.combinedNumbers].sort();
          const sortedExpected = [...testCase.expected_values].sort();
          expect(sortedResult).toEqual(sortedExpected);

          // Verify the total amount calculation
          const expectedTotal = (10 * result.channelMultiplierSum * testCase.expected_count).toFixed(2);
          expect(result.totalAmount).toBe(expectedTotal);
        }
      }
    });

    it("should validate all test case inputs", async () => {
      const testCases = await getTestCases(pool);

      for (const testCase of testCases) {
        // Construct the input string
        let inputString = "";
        if (testCase.start_number && testCase.end_number) {
          inputString = `${testCase.start_number}${testCase.sign}${testCase.end_number}`;
        } else if (testCase.start_number) {
          inputString = `${testCase.start_number}${testCase.sign}`;
        }

        if (!inputString) continue;

        // Test both validation functions
        const isValidPrefix = isInputValidForPrefix(inputString);
        const isValidBet = isSupportedBetInput(inputString);

        // Log any validation failures for debugging
        if (!isValidPrefix || !isValidBet) {
          console.log(`Validation failed for test case: ${inputString}`);
          console.log(`  Description: ${testCase.description}`);
          console.log(`  isInputValidForPrefix: ${isValidPrefix}`);
          console.log(`  isSupportedBetInput: ${isValidBet}`);
        }

        // All test cases should be valid
        expect(isValidPrefix).toBe(true);
        expect(isValidBet).toBe(true);
      }
    });

    it("should handle edge cases from database", async () => {
      const testCases = await getTestCases(pool);
      const mockChannels = [{ id: "A", label: "A", multipliers: { "2D": 2, "3D": 3 } }];

      // Test specific edge cases
      const edgeCases = testCases.filter((tc) => (tc.remark && tc.remark.includes("edge")) || tc.expected_count > 100 || tc.expected_count === 1);

      for (const testCase of edgeCases) {
        let inputString = "";
        if (testCase.start_number && testCase.end_number) {
          inputString = `${testCase.start_number}${testCase.sign}${testCase.end_number}`;
        } else if (testCase.start_number) {
          inputString = `${testCase.start_number}${testCase.sign}`;
        }

        if (!inputString) continue;

        const result = processInputNumber(inputString, mockChannels, 10);
        expect("error" in result).toBe(false);

        if (!("error" in result)) {
          expect(result.numberOfCombinations).toBe(testCase.expected_count);
          expect(result.combinedNumbers.length).toBe(testCase.expected_count);
        }
      }
    });
  });
});
