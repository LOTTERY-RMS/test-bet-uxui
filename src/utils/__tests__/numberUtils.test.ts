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

    // Range + X pattern tests (new functionality)
    it("should process range + X with 2D numbers", () => {
      const result = processInputNumber("15>X", mockChannels, 10);
      expect("error" in result).toBe(false);
      if (!("error" in result)) {
        expect(result.syntaxType).toBe("2D");
        // 15..19 with X and global dedupe → {15,51,16,61,17,71,18,81,19,91}
        expect(result.numberOfCombinations).toBe(10);
        expect(result.combinedNumbers).toContain("51");
        expect(result.combinedNumbers).toContain("71");
        expect(result.combinedNumbers).not.toContain("14");
      }
    });

    it("should process range + X with 3D numbers", () => {
      const result = processInputNumber("125>X", mockChannels, 10);
      expect("error" in result).toBe(false);
      if (!("error" in result)) {
        expect(result.syntaxType).toBe("3D");
        // 125..129, each 3 distinct digits → 5 × 6 = 30
        expect(result.numberOfCombinations).toBe(30);
        expect(result.combinedNumbers).toContain("251"); // from 125X
        expect(result.combinedNumbers).toContain("912"); // from 129X
        expect(result.combinedNumbers).not.toContain("130");
      }
    });

    it("should process range + X with specific range", () => {
      const result = processInputNumber("123>129X", mockChannels, 10);
      expect("error" in result).toBe(false);
      if (!("error" in result)) {
        expect(result.syntaxType).toBe("3D");
        expect(result.numberOfCombinations).toBe(42); // 7 × 6
        expect(result.combinedNumbers).toContain("231");
        expect(result.combinedNumbers).toContain("219");
        expect(result.combinedNumbers).not.toContain("112");
      }
    });

    it("should process range + X with repeated digits", () => {
      const result = processInputNumber("111>119X", mockChannels, 10);
      expect("error" in result).toBe(false);
      if (!("error" in result)) {
        expect(result.syntaxType).toBe("3D");
        expect(result.numberOfCombinations).toBe(25); // 1 + 8 × 3
        expect(result.combinedNumbers).toContain("211");
        expect(result.combinedNumbers).toContain("191");
        expect(result.combinedNumbers).not.toContain("122");
      }
    });

    it("should process range + X with mapped range", () => {
      const result = processInputNumber("025>925X", mockChannels, 10);
      expect("error" in result).toBe(false);
      if (!("error" in result)) {
        expect(result.syntaxType).toBe("3D");
        // 025,125,...,925 → 10 numbers; entries with a repeated digit (225,525) yield 3 perms; others yield 6 → 54
        expect(result.numberOfCombinations).toBe(54);
        expect(result.combinedNumbers).toContain("052"); // from 025X
        expect(result.combinedNumbers).toContain("250"); // from 025X
        expect(result.combinedNumbers).toContain("295"); // from 925X
        expect(result.combinedNumbers).not.toContain("135");
      }
    });

    it("should process range + X with single digit step", () => {
      const result = processInputNumber("00>05X", mockChannels, 10);
      expect("error" in result).toBe(false);
      if (!("error" in result)) {
        expect(result.syntaxType).toBe("2D");
        // 00 (1) + 01..05 (2 each) → 11
        expect(result.numberOfCombinations).toBe(11);
        expect(result.combinedNumbers).toContain("10"); // from 01X
        expect(result.combinedNumbers).toContain("50"); // from 05X
        expect(result.combinedNumbers).not.toContain("06");
      }
    });

    it("should process range + X with tens pattern", () => {
      const result = processInputNumber("10>19X", mockChannels, 10);
      expect("error" in result).toBe(false);
      if (!("error" in result)) {
        expect(result.syntaxType).toBe("2D");
        // {01,10,11,12,21,...,19,91} → 19
        expect(result.numberOfCombinations).toBe(19);
        expect(result.combinedNumbers).toContain("01"); // from 10X
        expect(result.combinedNumbers).toContain("91"); // from 19X
        expect(result.combinedNumbers).not.toContain("20");
      }
    });

    it("should process range + X with hundreds pattern", () => {
      const result = processInputNumber("100>109X", mockChannels, 10);
      expect("error" in result).toBe(false);
      if (!("error" in result)) {
        expect(result.syntaxType).toBe("3D");
        // 100 (3) + 101 (3) + 102..109 (8 × 6) = 54
        expect(result.numberOfCombinations).toBe(54);
        expect(result.combinedNumbers).toContain("012"); // from 102X
        expect(result.combinedNumbers).toContain("210"); // from 102X
        expect(result.combinedNumbers).not.toContain("200");
      }
    });

    it("should process range + X with large span", () => {
      const result = processInputNumber("100>199X", mockChannels, 10);
      expect("error" in result).toBe(false);
      if (!("error" in result)) {
        expect(result.syntaxType).toBe("3D");
        // All 3-digit strings containing at least one '1' → 271
        expect(result.numberOfCombinations).toBe(271);
        expect(result.combinedNumbers).toContain("001");
        expect(result.combinedNumbers).toContain("910");
        expect(result.combinedNumbers).not.toContain("200");
      }
    });

    it("should process range + X with asymmetric range", () => {
      const result = processInputNumber("120>129X", mockChannels, 10);
      expect("error" in result).toBe(false);
      if (!("error" in result)) {
        expect(result.syntaxType).toBe("3D");
        // 120 (6) + 121 (3) + 122 (3) + 123..129 (7 × 6) = 54
        expect(result.numberOfCombinations).toBe(54);
        expect(result.combinedNumbers).toContain("012"); // from 120X
        expect(result.combinedNumbers).toContain("211"); // from 121X
        expect(result.combinedNumbers).toContain("921"); // from 129X
        expect(result.combinedNumbers).not.toContain("130");
      }
    });

    // Edge cases for range + X patterns
    it("should handle range + X with minimum range", () => {
      const result = processInputNumber("12>12X", mockChannels, 10);
      expect("error" in result).toBe(true);
      if ("error" in result) {
        expect(result.error).toContain("Invalid");
      }
    });

    it("should handle range + X with maximum range", () => {
      const result = processInputNumber("00>99X", mockChannels, 10);
      expect("error" in result).toBe(false);
      if (!("error" in result)) {
        expect(result.syntaxType).toBe("2D");
        // Mapped range 00,11,22,...,99 → 10 numbers; X doesn't add new values for doubles
        expect(result.numberOfCombinations).toBe(10);
        expect(result.combinedNumbers).toContain("00");
        expect(result.combinedNumbers).toContain("55");
        expect(result.combinedNumbers).toContain("99");
        expect(result.combinedNumbers).not.toContain("12");
      }
    });

    it("should process range + X with maximum 3D mapped range", () => {
      const result = processInputNumber("000>999X", mockChannels, 10);
      expect("error" in result).toBe(false);
      if (!("error" in result)) {
        expect(result.syntaxType).toBe("3D");
        // Mapped range 000,111,222,...,999 → 10 numbers; X doesn't add new values for triples
        expect(result.numberOfCombinations).toBe(10);
        expect(result.combinedNumbers).toContain("000");
        expect(result.combinedNumbers).toContain("555");
        expect(result.combinedNumbers).toContain("999");
      }
    });

    // Complex range + X combinations
    it("should process complex range + X with many digits", () => {
      const result = processInputNumber("123>129X", mockChannels, 10);
      expect("error" in result).toBe(false);
      if (!("error" in result)) {
        expect(result.syntaxType).toBe("3D");
        expect(result.numberOfCombinations).toBe(42); // 7 numbers × 6 permutations each
        // Verify some key combinations exist
        expect(result.combinedNumbers).toContain("123");
        expect(result.combinedNumbers).toContain("321");
        expect(result.combinedNumbers).toContain("129");
        expect(result.combinedNumbers).toContain("921");
        expect(result.combinedNumbers).toContain("125");
        expect(result.combinedNumbers).toContain("521");
      }
    });

    it("should process mapped range + X with tens pattern", () => {
      const result = processInputNumber("01>91X", mockChannels, 10);
      expect("error" in result).toBe(false);
      if (!("error" in result)) {
        expect(result.syntaxType).toBe("2D");
        // {01,10,11,21,12,31,13,41,14,51,15,61,16,71,17,81,18,91,19} → 19
        expect(result.numberOfCombinations).toBe(19);
        expect(result.combinedNumbers).toContain("10"); // from 01X
        expect(result.combinedNumbers).toContain("19"); // from 91X
        expect(result.combinedNumbers).toEqual(["01", "10", "11", "21", "12", "31", "13", "41", "14", "51", "15", "61", "16", "71", "17", "81", "18", "91", "19"]);
        expect(result.combinedNumbers).not.toContain("00");
      }
    });

    it("should process mapped range + X with hundreds pattern", () => {
      const result = processInputNumber("100>199X", mockChannels, 10);
      expect("error" in result).toBe(false);
      if (!("error" in result)) {
        expect(result.syntaxType).toBe("3D");
        // Range 100..199 (100 numbers), then apply X to each and dedupe globally.
        // Final set equals all 3-digit strings that contain at least one '1'.
        // Count = 10^3 total (1000) minus strings with no '1' (9^3 = 729) → 271.
        expect(result.numberOfCombinations).toBe(271);
        // Spot-check non-trivial permutations across the union
        expect(result.combinedNumbers).toContain("001"); // from 100X
        expect(result.combinedNumbers).toContain("011"); // from 101X
        expect(result.combinedNumbers).toContain("121"); // from 112X
        expect(result.combinedNumbers).toContain("291"); // from 192X
        expect(result.combinedNumbers).toContain("910"); // from 190X
        expect(result.combinedNumbers).not.toContain("200"); // excludes numbers without '1'
      }
    });

    it("should process range + X with middle digit varying (101>191X)", () => {
      const result = processInputNumber("101>191X", mockChannels, 10);
      expect("error" in result).toBe(false);
      if (!("error" in result)) {
        expect(result.syntaxType).toBe("3D");
        // Two 1's plus one other digit: {111} + 9×3 = 28
        expect(result.numberOfCombinations).toBe(28);
        expect(result.combinedNumbers).toContain("110"); // from 101X
        expect(result.combinedNumbers).toContain("011"); // from 101X
        expect(result.combinedNumbers).toContain("911"); // from 191X
        expect(result.combinedNumbers).not.toContain("222");
      }
    });

    it("should process range + X with middle digit sweep (103>193X)", () => {
      const result = processInputNumber("103>193X", mockChannels, 10);
      expect("error" in result).toBe(false);
      if (!("error" in result)) {
        expect(result.syntaxType).toBe("3D");
        // 103,113,123,133,143,153,163,173,183,193 → 6 + 3 + 6 + 3 + 6×6 = 54
        expect(result.numberOfCombinations).toBe(54);
        expect(result.combinedNumbers).toContain("031"); // from 103X
        expect(result.combinedNumbers).toContain("331"); // from 133X
        expect(result.combinedNumbers).toContain("931"); // from 193X
        expect(result.combinedNumbers).not.toContain("200");
      }
    });

    it("should process range + X with first digit sweep (210>910X)", () => {
      const result = processInputNumber("210>910X", mockChannels, 10);
      expect("error" in result).toBe(false);
      if (!("error" in result)) {
        expect(result.syntaxType).toBe("3D");
        // 8 numbers × 6 permutations each = 48
        expect(result.numberOfCombinations).toBe(48);
        expect(result.combinedNumbers).toContain("012"); // from 210X
        expect(result.combinedNumbers).toContain("901"); // from 910X
        expect(result.combinedNumbers).not.toContain("110");
      }
    });

    it("should process range + X with short tail window (540>544X)", () => {
      const result = processInputNumber("540>544X", mockChannels, 10);
      expect("error" in result).toBe(false);
      if (!("error" in result)) {
        expect(result.syntaxType).toBe("3D");
        // 540,541,542,543 (6 each) + 544 (3) = 27
        expect(result.numberOfCombinations).toBe(27);
        expect(result.combinedNumbers).toContain("045"); // from 540X
        expect(result.combinedNumbers).toContain("451"); // from 541X
        expect(result.combinedNumbers).toContain("454"); // from 544X
        expect(result.combinedNumbers).not.toContain("555");
      }
    });

    it("should process range + X with first digit sweep including repeats (054>954X)", () => {
      const result = processInputNumber("054>954X", mockChannels, 10);
      expect("error" in result).toBe(false);
      if (!("error" in result)) {
        expect(result.syntaxType).toBe("3D");
        // 8×6 + 2×3 = 54 (repeats at 454 and 554)
        expect(result.numberOfCombinations).toBe(54);
        expect(result.combinedNumbers).toContain("045"); // from 054X
        expect(result.combinedNumbers).toContain("549"); // from 954X
        expect(result.combinedNumbers).toContain("544"); // from 454X/544X set
        expect(result.combinedNumbers).not.toContain("000");
      }
    });

    it("should process range + X with tens sweep and fixed edges (401>491X)", () => {
      const result = processInputNumber("401>491X", mockChannels, 10);
      expect("error" in result).toBe(false);
      if (!("error" in result)) {
        expect(result.syntaxType).toBe("3D");
        // 8×6 + 2×3 = 54 (repeats at 411 and 441)
        expect(result.numberOfCombinations).toBe(54);
        expect(result.combinedNumbers).toContain("014"); // from 401X
        expect(result.combinedNumbers).toContain("941"); // from 491X
        expect(result.combinedNumbers).toContain("411"); // from 411X
        expect(result.combinedNumbers).not.toContain("222");
      }
    });

    it("should process range + X with small hundreds window (100>105X)", () => {
      const result = processInputNumber("100>105X", mockChannels, 10);
      expect("error" in result).toBe(false);
      if (!("error" in result)) {
        expect(result.syntaxType).toBe("3D");
        // 100 (3) + 101 (3) + 102..105 (4×6) = 30
        expect(result.numberOfCombinations).toBe(30);
        expect(result.combinedNumbers).toContain("001"); // from 100X
        expect(result.combinedNumbers).toContain("110"); // from 101X
        expect(result.combinedNumbers).toContain("210"); // from 102X
        expect(result.combinedNumbers).not.toContain("200");
      }
    });

    // General error case tests
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
