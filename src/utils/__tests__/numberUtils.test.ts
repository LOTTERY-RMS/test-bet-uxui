import { describe, it, expect, beforeAll } from "vitest";
import { setupTestDatabase, getTestCases } from "./setup-test-db";

import {
  VALID_FINAL_INPUT_PATTERNS,
  isExactLengthNumericString,
  isSupportedBetInput,
  generateDigitPermutations,
  generateSimpleRangeCombinations,
  generateMappedTwoDigitRangeCombinations,
  generateMappedThreeDigitRangeCombinations,
  processInputNumber,
  type ProcessInputNumberResult,
} from "../numberUtils";

// Load test data from PostgreSQL database
async function loadTestCases() {
  // Use Vitest's built-in logger for test output

  const pool = await setupTestDatabase();
  const testCases = await getTestCases(pool);
  await pool.end();
  return testCases;
}

// Load test cases synchronously for tests
let testCases: Record<string, { count: number; values: string[] }> = {};

// Initialize test cases before running tests
beforeAll(async () => {
  testCases = await loadTestCases();
});

describe("numberUtils", () => {
  describe("VALID_FINAL_INPUT_PATTERNS", () => {
    it("should match valid 2-digit numbers", () => {
      expect(VALID_FINAL_INPUT_PATTERNS.some((pattern) => pattern.test("12"))).toBe(true);
      expect(VALID_FINAL_INPUT_PATTERNS.some((pattern) => pattern.test("99"))).toBe(true);
    });

    it("should match valid 3-digit numbers", () => {
      expect(VALID_FINAL_INPUT_PATTERNS.some((pattern) => pattern.test("123"))).toBe(true);
      expect(VALID_FINAL_INPUT_PATTERNS.some((pattern) => pattern.test("999"))).toBe(true);
    });

    it("should match valid X patterns", () => {
      expect(VALID_FINAL_INPUT_PATTERNS.some((pattern) => pattern.test("12X"))).toBe(true);
      expect(VALID_FINAL_INPUT_PATTERNS.some((pattern) => pattern.test("123X"))).toBe(true);
    });

    it("should match valid > patterns", () => {
      expect(VALID_FINAL_INPUT_PATTERNS.some((pattern) => pattern.test("12>"))).toBe(true);
      expect(VALID_FINAL_INPUT_PATTERNS.some((pattern) => pattern.test("123>"))).toBe(true);
      expect(VALID_FINAL_INPUT_PATTERNS.some((pattern) => pattern.test("12>15"))).toBe(true);
      expect(VALID_FINAL_INPUT_PATTERNS.some((pattern) => pattern.test("123>125"))).toBe(true);
    });

    it("should match valid ~ patterns", () => {
      expect(VALID_FINAL_INPUT_PATTERNS.some((pattern) => pattern.test("12~15"))).toBe(true);
      expect(VALID_FINAL_INPUT_PATTERNS.some((pattern) => pattern.test("123~125"))).toBe(true);
    });

    it("should not match invalid patterns", () => {
      expect(VALID_FINAL_INPUT_PATTERNS.some((pattern) => pattern.test("1"))).toBe(false);
      expect(VALID_FINAL_INPUT_PATTERNS.some((pattern) => pattern.test("1234"))).toBe(false);
      expect(VALID_FINAL_INPUT_PATTERNS.some((pattern) => pattern.test("12X3"))).toBe(false);
    });
  });

  describe("isExactLengthNumericString", () => {
    it("should validate correct 2-digit strings", () => {
      expect(isExactLengthNumericString("12", 2)).toBe(true);
      expect(isExactLengthNumericString("99", 2)).toBe(true);
      expect(isExactLengthNumericString("00", 2)).toBe(true);
    });

    it("should validate correct 3-digit strings", () => {
      expect(isExactLengthNumericString("123", 3)).toBe(true);
      expect(isExactLengthNumericString("999", 3)).toBe(true);
      expect(isExactLengthNumericString("000", 3)).toBe(true);
    });

    it("should reject invalid strings", () => {
      expect(isExactLengthNumericString("1", 2)).toBe(false);
      expect(isExactLengthNumericString("123", 2)).toBe(false);
      expect(isExactLengthNumericString("ab", 2)).toBe(false);
      expect(isExactLengthNumericString("12", 3)).toBe(false);
    });
  });

  describe("isSupportedBetInput", () => {
    it("should accept valid 2D inputs", () => {
      expect(isSupportedBetInput("12")).toBe(true);
      expect(isSupportedBetInput("12X")).toBe(true);
      expect(isSupportedBetInput("12>")).toBe(true);
      expect(isSupportedBetInput("12>15")).toBe(true);
      expect(isSupportedBetInput("12~15")).toBe(true);
    });

    it("should accept valid 3D inputs", () => {
      expect(isSupportedBetInput("123")).toBe(true);
      expect(isSupportedBetInput("123X")).toBe(true);
      expect(isSupportedBetInput("123>")).toBe(true);
      expect(isSupportedBetInput("123>125")).toBe(true);
      expect(isSupportedBetInput("123~125")).toBe(true);
    });

    it("should reject invalid inputs", () => {
      expect(isSupportedBetInput("1")).toBe(false);
      expect(isSupportedBetInput("1234")).toBe(false);
      expect(isSupportedBetInput("12X3")).toBe(false);
      expect(isSupportedBetInput("1111X")).toBe(false); // frequency rule violation
    });

    it("should enforce frequency rules for X inputs", () => {
      expect(isSupportedBetInput("111X")).toBe(true); // 1 appears 3 times
      expect(isSupportedBetInput("1111X")).toBe(false); // 1 appears 4 times
      expect(isSupportedBetInput("11222X")).toBe(true); // 1 appears 2 times, 2 appears 3 times
    });
  });

  describe("generateDigitPermutations", () => {
    it("should generate 2D permutations correctly", () => {
      expect(generateDigitPermutations("12", "2D")).toEqual(["12", "21"]);
      expect(generateDigitPermutations("11", "2D")).toEqual(["11"]);
      expect(generateDigitPermutations("99", "2D")).toEqual(["99"]);
    });

    it("should generate 3D permutations correctly", () => {
      expect(generateDigitPermutations("123", "3D")).toEqual(["123", "132", "213", "231", "312", "321"]);
      expect(generateDigitPermutations("112", "3D")).toEqual(["112", "121", "211"]);
      expect(generateDigitPermutations("111", "3D")).toEqual(["111"]);
    });

    it("should handle invalid inputs", () => {
      expect(generateDigitPermutations("1", "2D")).toEqual([]);
      expect(generateDigitPermutations("12", "3D")).toEqual([]);
    });
  });

  describe("generateSimpleRangeCombinations", () => {
    it("should generate 2D ranges correctly", () => {
      expect(generateSimpleRangeCombinations("10", "19", "2D")).toEqual(["10", "11", "12", "13", "14", "15", "16", "17", "18", "19"]);
      expect(generateSimpleRangeCombinations("00", "05", "2D")).toEqual(["00", "01", "02", "03", "04", "05"]);
    });

    it("should generate 3D ranges correctly", () => {
      expect(generateSimpleRangeCombinations("120", "125", "3D")).toEqual(["120", "121", "122", "123", "124", "125"]);
    });

    it("should handle invalid ranges", () => {
      expect(generateSimpleRangeCombinations("19", "10", "2D")).toEqual([]);
      expect(generateSimpleRangeCombinations("abc", "def", "2D")).toEqual([]);
    });
  });

  describe("generateMappedTwoDigitRangeCombinations", () => {
    it("should generate 10 consecutive numbers when no end specified", () => {
      expect(generateMappedTwoDigitRangeCombinations("10")).toEqual(["10", "11", "12", "13", "14", "15", "16", "17", "18", "19"]);
    });

    it("should handle same digits pattern", () => {
      expect(generateMappedTwoDigitRangeCombinations("11", "22")).toEqual(["11", "22"]);
    });

    it("should handle first digit same pattern", () => {
      expect(generateMappedTwoDigitRangeCombinations("10", "19")).toEqual(["10", "11", "12", "13", "14", "15", "16", "17", "18", "19"]);
    });

    it("should handle second digit same pattern", () => {
      expect(generateMappedTwoDigitRangeCombinations("01", "91")).toEqual(["01", "11", "21", "31", "41", "51", "61", "71", "81", "91"]);
    });

    it("should handle invalid ranges", () => {
      expect(generateMappedTwoDigitRangeCombinations("12", "23")).toEqual([]);
    });
  });

  describe("generateMappedThreeDigitRangeCombinations", () => {
    it("should generate 10 consecutive numbers when no end specified", () => {
      expect(generateMappedThreeDigitRangeCombinations("120")).toEqual(["120", "121", "122", "123", "124", "125", "126", "127", "128", "129"]);
    });

    it("should handle all digits same pattern", () => {
      expect(generateMappedThreeDigitRangeCombinations("111", "333")).toEqual(["111", "222", "333"]);
    });

    it("should handle varying last digit", () => {
      expect(generateMappedThreeDigitRangeCombinations("120", "125")).toEqual(["120", "121", "122", "123", "124", "125"]);
    });

    it("should handle varying middle digit", () => {
      expect(generateMappedThreeDigitRangeCombinations("101", "191")).toEqual(["101", "111", "121", "131", "141", "151", "161", "171", "181", "191"]);
    });

    it("should handle varying first digit", () => {
      expect(generateMappedThreeDigitRangeCombinations("210", "910")).toEqual(["210", "310", "410", "510", "610", "710", "810", "910"]);
    });

    it("should handle full range when first digit fixed", () => {
      expect(generateMappedThreeDigitRangeCombinations("100", "105")).toEqual(["100", "101", "102", "103", "104", "105"]);
    });

    it("should handle invalid ranges", () => {
      expect(generateMappedThreeDigitRangeCombinations("123", "456")).toEqual([]);
    });
  });

  describe("processInputNumber", () => {
    const mockChannels = [
      { id: "A", label: "A", multipliers: { "2D": 2, "3D": 3 } },
      { id: "B", label: "B", multipliers: { "2D": 1, "3D": 1 } },
    ];

    it("should process 2D single number", () => {
      const result = processInputNumber("12", mockChannels, 10) as ProcessInputNumberResult;
      expect(result.totalAmount).toBe("30.00");
      expect(result.syntaxType).toBe("2D");
      expect(result.numberOfCombinations).toBe(1);
      expect(result.combinedNumbers).toEqual(["12"]);
    });

    it("should process 3D single number", () => {
      const result = processInputNumber("123", mockChannels, 10) as ProcessInputNumberResult;
      expect(result.totalAmount).toBe("40.00");
      expect(result.syntaxType).toBe("3D");
      expect(result.numberOfCombinations).toBe(1);
      expect(result.combinedNumbers).toEqual(["123"]);
    });

    it("should process 2D X permutations", () => {
      const result = processInputNumber("12X", mockChannels, 10) as ProcessInputNumberResult;
      expect(result.totalAmount).toBe("60.00");
      expect(result.syntaxType).toBe("2D");
      expect(result.numberOfCombinations).toBe(2);
      expect(result.combinedNumbers).toEqual(["12", "21"]);
    });

    it("should process 3D X permutations", () => {
      const result = processInputNumber("123X", mockChannels, 10) as ProcessInputNumberResult;
      expect(result.totalAmount).toBe("240.00");
      expect(result.syntaxType).toBe("3D");
      expect(result.numberOfCombinations).toBe(6);
      expect(result.combinedNumbers).toEqual(["123", "132", "213", "231", "312", "321"]);
    });

    it("should process 2D range with > operator", () => {
      const result = processInputNumber("10>15", mockChannels, 10) as ProcessInputNumberResult;
      expect(result.totalAmount).toBe("180.00");
      expect(result.syntaxType).toBe("2D");
      expect(result.numberOfCombinations).toBe(6);
      expect(result.combinedNumbers).toEqual(["10", "11", "12", "13", "14", "15"]);
    });

    it("should process 3D range with > operator", () => {
      const result = processInputNumber("120>125", mockChannels, 10) as ProcessInputNumberResult;
      expect(result.totalAmount).toBe("240.00");
      expect(result.syntaxType).toBe("3D");
      expect(result.numberOfCombinations).toBe(6);
      expect(result.combinedNumbers).toEqual(["120", "121", "122", "123", "124", "125"]);
    });

    it("should process 2D range with ~ operator", () => {
      const result = processInputNumber("10~15", mockChannels, 10) as ProcessInputNumberResult;
      expect(result.totalAmount).toBe("180.00");
      expect(result.syntaxType).toBe("2D");
      expect(result.numberOfCombinations).toBe(6);
      expect(result.combinedNumbers).toEqual(["10", "11", "12", "13", "14", "15"]);
    });

    it("should process 3D range with ~ operator", () => {
      const result = processInputNumber("120~125", mockChannels, 10) as ProcessInputNumberResult;
      expect(result.totalAmount).toBe("240.00");
      expect(result.syntaxType).toBe("3D");
      expect(result.numberOfCombinations).toBe(6);
      expect(result.combinedNumbers).toEqual(["120", "121", "122", "123", "124", "125"]);
    });

    it("should handle empty input", () => {
      const result = processInputNumber("", mockChannels, 10);
      expect("error" in result).toBe(true);
      expect((result as { error: string }).error).toBe("Please enter a number before pressing Enter.");
    });

    it("should handle no channels selected", () => {
      const result = processInputNumber("12", [], 10);
      expect("error" in result).toBe(true);
      expect((result as { error: string }).error).toBe("Please select at least one channel (e.g., A, B, C, Lo).");
    });

    it("should handle invalid number format", () => {
      const result = processInputNumber("1234", mockChannels, 10);
      expect("error" in result).toBe(true);
      expect((result as { error: string }).error).toContain("Invalid number format");
    });

    it("should handle invalid amount", () => {
      const result = processInputNumber("12", mockChannels, NaN);
      expect("error" in result).toBe(true);
      expect((result as { error: string }).error).toBe("Amount is not a valid number.");
    });

    it("should handle invalid range", () => {
      const result = processInputNumber("19>10", mockChannels, 10);
      expect("error" in result).toBe(true);
      expect((result as { error: string }).error).toBe("Invalid range: start number must not exceed end number.");
    });
  });
});

describe("integration: real-world cases", () => {
  it("10> (10) => 10, 11, 12, 13, 14, 15, 16, 17, 18, 19", () => {
    expect(generateMappedTwoDigitRangeCombinations("10")).toEqual(["10", "11", "12", "13", "14", "15", "16", "17", "18", "19"]);
  });
  it("01> (10) => 01, 02, 03, 04, 05, 06, 07, 08, 09, 10", () => {
    expect(generateMappedTwoDigitRangeCombinations("01")).toEqual(["01", "02", "03", "04", "05", "06", "07", "08", "09", "10"]);
  });
  it("01>91 (10) => 01, 11, 21, 31, 41, 51, 61, 71, 81, 91", () => {
    expect(generateMappedTwoDigitRangeCombinations("01", "91")).toEqual(["01", "11", "21", "31", "41", "51", "61", "71", "81", "91"]);
  });
  it("01>04 (4) => 01, 02, 03, 04", () => {
    const { count, values } = testCases["01>04"];
    const result = generateMappedTwoDigitRangeCombinations("01", "04");
    expect(result.length).toBe(count);
    expect(result).toEqual(values);
  });
  it("05>09 (5) => 05, 06, 07, 08, 09", () => {
    const { count, values } = testCases["05>09"];
    const result = generateMappedTwoDigitRangeCombinations("05", "09");
    expect(result.length).toBe(count);
    expect(result).toEqual(values);
  });
  it("51>91 (5) => 51, 61, 71, 81, 91", () => {
    const { count, values } = testCases["51>91"];
    const result = generateMappedTwoDigitRangeCombinations("51", "91");
    expect(result.length).toBe(count);
    expect(result).toEqual(values);
  });
  it("10>19 (10) => 10, 11, 12, 13, 14, 15, 16, 17, 18, 19", () => {
    const { count, values } = testCases["10>19"];
    const result = generateMappedTwoDigitRangeCombinations("10", "19");
    expect(result.length).toBe(count);
    expect(result).toEqual(values);
  });
  it("01>91 (10) => 01, 11, 21, 31, 41, 51, 61, 71, 81, 91", () => {
    const { count, values } = testCases["01>91"];
    const result = generateMappedTwoDigitRangeCombinations("01", "91");
    expect(result.length).toBe(count);
    expect(result).toEqual(values);
  });
  it("000>999 (10) => 000, 111, 222, 333, 444, 555, 666, 777, 888, 999", () => {
    const { count, values } = testCases["000>999"];
    const result = generateMappedThreeDigitRangeCombinations("000", "999");
    expect(result.length).toBe(count);
    expect(result).toEqual(values);
  });
  it("100> (10) => 100, 101, 102, 103, 104, 105, 106, 107, 108, 109", () => {
    const { count, values } = testCases["100>109"];
    const result = generateMappedThreeDigitRangeCombinations("100");
    expect(result.length).toBe(count);
    expect(result).toEqual(values);
  });
  it("120> (10) => 120, 121, 122, 123, 124, 125, 126, 127, 128, 129", () => {
    const { count, values } = testCases["120>129"];
    const result = generateMappedThreeDigitRangeCombinations("120");
    expect(result.length).toBe(count);
    expect(result).toEqual(values);
  });
  it("100>199 (100) => 100, 101, ..., 199", () => {
    const expected = [];
    for (let i = 100; i <= 199; i++) {
      expected.push(i.toString());
    }
    expect(generateSimpleRangeCombinations("100", "199", "3D")).toEqual(expected);
  });
  it("401>491 (10) => 401, 411, 421, 431, 441, 451, 461, 471, 481, 491", () => {
    const { count, values } = testCases["401>491"];
    const result = generateMappedThreeDigitRangeCombinations("401", "491");
    expect(result.length).toBe(count);
    expect(result).toEqual(values);
  });
  it("12X (2) => 12, 21", () => {
    const { count, values } = testCases["12X"];
    const result = generateDigitPermutations("12", "2D");
    expect(result.length).toBe(count);
    expect(result).toEqual(values);
  });
  it("123X (6) => 123, 132, 213, 231, 312, 321", () => {
    const { count, values } = testCases["123X"];
    const result = generateDigitPermutations("123", "3D");
    expect(result.length).toBe(count);
    expect(result).toEqual(values);
  });
  it("1112X (4) => 111, 112, 121, 211", () => {
    const { count, values } = testCases["1112X"];
    const result = generateDigitPermutations("1112", "3D");
    expect(result.length).toBe(count);
    expect(result).toEqual(values);
  });
  it("1122X (6) => 112, 121, 122, 211, 212, 221", () => {
    const { count, values } = testCases["1122X"];
    const result = generateDigitPermutations("1122", "3D");
    expect(result.length).toBe(count);
    expect(result).toEqual(values);
  });
  it("1123X (12) => 112, 113, 121, 123, 131, 132, 211, 213, 231, 311, 312, 321", () => {
    const { count, values } = testCases["1123X"];
    const result = generateDigitPermutations("1123", "3D");
    expect(result.length).toBe(count);
    expect(result).toEqual(values);
  });
  it("1234X (24) => 123, 124, 132, 134, ..., 421, 423, 431, 432", () => {
    const { count, values } = testCases["1234X"];
    const result = generateDigitPermutations("1234", "3D");
    expect(result.length).toBe(count);
    expect(result).toEqual(values);
  });
  it("11122X (7) => 111, 112, 121, 122, 211, 212, 221", () => {
    const { count, values } = testCases["11122X"];
    const result = generateDigitPermutations("11122", "3D");
    expect(result.length).toBe(count);
    expect(result).toEqual(values);
  });
  it("11123X (13) => 111, 112, 113, 121, ..., 231, 311, 312, 321", () => {
    const { count, values } = testCases["11123X"];
    const result = generateDigitPermutations("11123", "3D");
    expect(result.length).toBe(count);
    expect(result).toEqual(values);
  });
  it("11223X (18) => 112, 113, 121, 122, ..., 311, 312, 321, 322", () => {
    const { count, values } = testCases["11223X"];
    const result = generateDigitPermutations("11223", "3D");
    expect(result.length).toBe(count);
    expect(result).toEqual(values);
  });
  it("11234X (33) => 112, 113, 114, 121, ..., 421, 423, 431, 432", () => {
    const { count, values } = testCases["11234X"];
    const result = generateDigitPermutations("11234", "3D");
    expect(result.length).toBe(count);
    expect(result).toEqual(values);
  });
  it("12345X (60) => 123, 124, 125, 132, ..., 534, 541, 542, 543", () => {
    const { count, values } = testCases["12345X"];
    const result = generateDigitPermutations("12345", "3D");
    expect(result.length).toBe(count);
    expect(result).toEqual(values);
  });
  it("111222X (8) => 111, 112, 121, 122, 211, 212, 221, 222", () => {
    const { count, values } = testCases["111222X"];
    const result = generateDigitPermutations("111222", "3D");
    expect(result.length).toBe(count);
    expect(result).toEqual(values);
  });
  it("111223X (19) => 111, 112, 113, 121, 122, 123, 131, 132, 211, 212, 213, 221, 223, 231, 232, 311, 312, 321, 322", () => {
    const { count, values } = testCases["111223X"];
    const result = generateDigitPermutations("111223", "3D");
    expect(result.length).toBe(count);
    expect(result).toEqual(values);
  });
  it("112233X (24) => 112, 113, 121, 122, ..., 322, 323, 331, 332", () => {
    const { count, values } = testCases["112233X"];
    const result = generateDigitPermutations("112233", "3D");
    expect(result.length).toBe(count);
    expect(result).toEqual(values);
  });
  it("111234X (34) => 111, 112, 113, 114, ..., 421, 423, 431, 432", () => {
    const { count, values } = testCases["111234X"];
    const result = generateDigitPermutations("111234", "3D");
    expect(result.length).toBe(count);
    expect(result).toEqual(values);
  });
  it("112234X (42) => 112, 113, 114, 121, ..., 422, 423, 431, 432", () => {
    const { count, values } = testCases["112234X"];
    const result = generateDigitPermutations("112234", "3D");
    expect(result.length).toBe(count);
    expect(result).toEqual(values);
  });
  it("112345X (72) => 112, 113, 114, 115, ..., 534, 541, 542, 543", () => {
    const { count, values } = testCases["112345X"];
    const result = generateDigitPermutations("112345", "3D");
    expect(result.length).toBe(count);
    expect(result).toEqual(values);
  });
  it("123456X (120) => 120 permutations, includes 123, 124, 125, 126, 132, 135, 654", () => {
    const { count, values } = testCases["123456X"];
    const result = generateDigitPermutations("123456", "3D");
    expect(result.length).toBe(count);
    expect(result).toEqual(values);
  });
  it("1234567X (210) => 210 permutations, includes 123, 124, 125, 126, 127, 321, 765", () => {
    const { count, values } = testCases["1234567X"];
    const result = generateDigitPermutations("1234567", "3D");
    expect(result.length).toBe(count);
    expect(result).toEqual(values);
  });
  it("12345678X (336) => 336 permutations, includes 123, 124, 125, 126, 127, 128, 876", () => {
    const { count, values } = testCases["12345678X"];
    const result = generateDigitPermutations("12345678", "3D");
    expect(result.length).toBe(count);
    expect(result).toEqual(values);
  });
  it("123456789X (504) => 504 permutations, includes 123, 124, 125, 126, 127, 128, 129, 987", () => {
    const { count, values } = testCases["123456789X"];
    const result = generateDigitPermutations("123456789", "3D");
    expect(result.length).toBe(count);
    expect(result).toEqual(values);
  });
});

describe("negative test cases", () => {
  describe("VALID_FINAL_INPUT_PATTERNS", () => {
    it("should not match single digit numbers", () => {
      expect(VALID_FINAL_INPUT_PATTERNS.some((pattern) => pattern.test("1"))).toBe(false);
      expect(VALID_FINAL_INPUT_PATTERNS.some((pattern) => pattern.test("5"))).toBe(false);
      expect(VALID_FINAL_INPUT_PATTERNS.some((pattern) => pattern.test("9"))).toBe(false);
    });

    it("should not match 4+ digit numbers", () => {
      expect(VALID_FINAL_INPUT_PATTERNS.some((pattern) => pattern.test("1234"))).toBe(false);
      expect(VALID_FINAL_INPUT_PATTERNS.some((pattern) => pattern.test("12345"))).toBe(false);
      expect(VALID_FINAL_INPUT_PATTERNS.some((pattern) => pattern.test("123456"))).toBe(false);
    });

    it("should not match invalid X patterns", () => {
      expect(VALID_FINAL_INPUT_PATTERNS.some((pattern) => pattern.test("1X"))).toBe(false);
      expect(VALID_FINAL_INPUT_PATTERNS.some((pattern) => pattern.test("12X3"))).toBe(false);
    });

    it("should not match invalid > patterns", () => {
      expect(VALID_FINAL_INPUT_PATTERNS.some((pattern) => pattern.test("1>"))).toBe(false);
      expect(VALID_FINAL_INPUT_PATTERNS.some((pattern) => pattern.test("12>1"))).toBe(false);
      expect(VALID_FINAL_INPUT_PATTERNS.some((pattern) => pattern.test("123>12"))).toBe(false);
      expect(VALID_FINAL_INPUT_PATTERNS.some((pattern) => pattern.test("12>123"))).toBe(false);
    });

    it("should not match invalid ~ patterns", () => {
      expect(VALID_FINAL_INPUT_PATTERNS.some((pattern) => pattern.test("1~"))).toBe(false);
      expect(VALID_FINAL_INPUT_PATTERNS.some((pattern) => pattern.test("12~1"))).toBe(false);
      expect(VALID_FINAL_INPUT_PATTERNS.some((pattern) => pattern.test("123~12"))).toBe(false);
      expect(VALID_FINAL_INPUT_PATTERNS.some((pattern) => pattern.test("12~123"))).toBe(false);
    });

    it("should not match non-numeric characters", () => {
      expect(VALID_FINAL_INPUT_PATTERNS.some((pattern) => pattern.test("ab"))).toBe(false);
      expect(VALID_FINAL_INPUT_PATTERNS.some((pattern) => pattern.test("abc"))).toBe(false);
      expect(VALID_FINAL_INPUT_PATTERNS.some((pattern) => pattern.test("12a"))).toBe(false);
      expect(VALID_FINAL_INPUT_PATTERNS.some((pattern) => pattern.test("a12"))).toBe(false);
    });

    it("should not match empty strings", () => {
      expect(VALID_FINAL_INPUT_PATTERNS.some((pattern) => pattern.test(""))).toBe(false);
    });

    it("should not match whitespace", () => {
      expect(VALID_FINAL_INPUT_PATTERNS.some((pattern) => pattern.test(" "))).toBe(false);
      expect(VALID_FINAL_INPUT_PATTERNS.some((pattern) => pattern.test(" 12"))).toBe(false);
      expect(VALID_FINAL_INPUT_PATTERNS.some((pattern) => pattern.test("12 "))).toBe(false);
    });
  });

  describe("isExactLengthNumericString", () => {
    it("should reject strings with wrong length", () => {
      expect(isExactLengthNumericString("1", 2)).toBe(false);
      expect(isExactLengthNumericString("123", 2)).toBe(false);
      expect(isExactLengthNumericString("12", 3)).toBe(false);
      expect(isExactLengthNumericString("1234", 3)).toBe(false);
    });

    it("should reject non-numeric strings", () => {
      expect(isExactLengthNumericString("ab", 2)).toBe(false);
      expect(isExactLengthNumericString("abc", 3)).toBe(false);
      expect(isExactLengthNumericString("1a", 2)).toBe(false);
      expect(isExactLengthNumericString("a1", 2)).toBe(false);
      expect(isExactLengthNumericString("12a", 3)).toBe(false);
      expect(isExactLengthNumericString("a12", 3)).toBe(false);
    });

    it("should reject empty strings", () => {
      expect(isExactLengthNumericString("", 2)).toBe(false);
      expect(isExactLengthNumericString("", 3)).toBe(false);
    });

    it("should reject whitespace strings", () => {
      expect(isExactLengthNumericString(" ", 1)).toBe(false);
      expect(isExactLengthNumericString(" 12", 3)).toBe(false);
      expect(isExactLengthNumericString("12 ", 3)).toBe(false);
    });

    it("should reject invalid digit lengths", () => {
      expect(isExactLengthNumericString("12", 0)).toBe(false);
      expect(isExactLengthNumericString("12", -1)).toBe(false);
      expect(isExactLengthNumericString("12", 1.5)).toBe(false);
    });
  });

  describe("isSupportedBetInput", () => {
    it("should reject single digit inputs", () => {
      expect(isSupportedBetInput("1")).toBe(false);
      expect(isSupportedBetInput("5")).toBe(false);
      expect(isSupportedBetInput("9")).toBe(false);
    });

    it("should reject 4+ digit inputs", () => {
      expect(isSupportedBetInput("1234")).toBe(false);
      expect(isSupportedBetInput("12345")).toBe(false);
      expect(isSupportedBetInput("123456")).toBe(false);
    });

    it("should reject invalid X patterns", () => {
      expect(isSupportedBetInput("1X")).toBe(false);
      expect(isSupportedBetInput("12X3")).toBe(false);
      expect(isSupportedBetInput("1111X")).toBe(false);
      expect(isSupportedBetInput("11111X")).toBe(false);
      expect(isSupportedBetInput("1122322X")).toBe(false);
    });

    it("should reject invalid > patterns", () => {
      expect(isSupportedBetInput("1>")).toBe(false);
      expect(isSupportedBetInput("12>1")).toBe(false);
      expect(isSupportedBetInput("123>12")).toBe(false);
      expect(isSupportedBetInput("12>123")).toBe(false);
    });

    it("should reject invalid ~ patterns", () => {
      expect(isSupportedBetInput("1~")).toBe(false);
      expect(isSupportedBetInput("12~1")).toBe(false);
      expect(isSupportedBetInput("123~12")).toBe(false);
      expect(isSupportedBetInput("12~123")).toBe(false);
    });

    it("should reject non-numeric characters", () => {
      expect(isSupportedBetInput("ab")).toBe(false);
      expect(isSupportedBetInput("abc")).toBe(false);
      expect(isSupportedBetInput("12a")).toBe(false);
      expect(isSupportedBetInput("a12")).toBe(false);
    });

    it("should reject empty strings", () => {
      expect(isSupportedBetInput("")).toBe(false);
    });

    it("should reject whitespace", () => {
      expect(isSupportedBetInput(" ")).toBe(false);
      expect(isSupportedBetInput(" 12")).toBe(false);
      expect(isSupportedBetInput("12 ")).toBe(false);
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

  describe("generateDigitPermutations", () => {
    it("should handle invalid 2D inputs", () => {
      expect(generateDigitPermutations("1", "2D")).toEqual([]);
      expect(generateDigitPermutations("123", "2D")).toEqual([]);
      expect(generateDigitPermutations("", "2D")).toEqual([]);
      expect(generateDigitPermutations("ab", "2D")).toEqual([]);
    });

    it("should handle invalid 3D inputs", () => {
      expect(generateDigitPermutations("1", "3D")).toEqual([]);
      expect(generateDigitPermutations("12", "3D")).toEqual([]);
      expect(generateDigitPermutations("", "3D")).toEqual([]);
      expect(generateDigitPermutations("abc", "3D")).toEqual([]);
    });

    it("should handle invalid syntax types", () => {
      expect(generateDigitPermutations("12", "4D" as "2D" | "3D")).toEqual([]);
      expect(generateDigitPermutations("123", "1D" as "2D" | "3D")).toEqual([]);
    });

    it("should handle empty strings", () => {
      expect(generateDigitPermutations("", "2D")).toEqual([]);
      expect(generateDigitPermutations("", "3D")).toEqual([]);
    });

    it("should handle non-numeric strings", () => {
      expect(generateDigitPermutations("ab", "2D")).toEqual([]);
      expect(generateDigitPermutations("abc", "3D")).toEqual([]);
      expect(generateDigitPermutations("1a", "2D")).toEqual([]);
      expect(generateDigitPermutations("12a", "3D")).toEqual([]);
    });
  });

  describe("generateSimpleRangeCombinations", () => {
    it("should handle invalid start numbers", () => {
      expect(generateSimpleRangeCombinations("1", "19", "2D")).toEqual([]);
      expect(generateSimpleRangeCombinations("123", "129", "2D")).toEqual([]);
      expect(generateSimpleRangeCombinations("", "19", "2D")).toEqual([]);
      expect(generateSimpleRangeCombinations("ab", "19", "2D")).toEqual([]);
    });

    it("should handle invalid end numbers", () => {
      expect(generateSimpleRangeCombinations("10", "1", "2D")).toEqual([]);
      expect(generateSimpleRangeCombinations("10", "1234", "2D")).toEqual([]);
      expect(generateSimpleRangeCombinations("10", "", "2D")).toEqual([]);
      expect(generateSimpleRangeCombinations("10", "ab", "2D")).toEqual([]);
    });

    it("should handle invalid ranges (start > end)", () => {
      expect(generateSimpleRangeCombinations("19", "10", "2D")).toEqual([]);
      expect(generateSimpleRangeCombinations("99", "00", "2D")).toEqual([]);
      expect(generateSimpleRangeCombinations("129", "120", "3D")).toEqual([]);
      expect(generateSimpleRangeCombinations("999", "000", "3D")).toEqual([]);
    });

    it("should handle mismatched digit lengths", () => {
      expect(generateSimpleRangeCombinations("10", "123", "2D")).toEqual([]);
      expect(generateSimpleRangeCombinations("123", "12", "3D")).toEqual([]);
    });

    it("should handle invalid syntax types", () => {
      expect(generateSimpleRangeCombinations("10", "19", "4D" as "2D" | "3D")).toEqual([]);
      expect(generateSimpleRangeCombinations("120", "129", "1D" as "2D" | "3D")).toEqual([]);
    });

    it("should handle non-numeric inputs", () => {
      expect(generateSimpleRangeCombinations("ab", "cd", "2D")).toEqual([]);
      expect(generateSimpleRangeCombinations("abc", "def", "3D")).toEqual([]);
      expect(generateSimpleRangeCombinations("1a", "2b", "2D")).toEqual([]);
      expect(generateSimpleRangeCombinations("12a", "12b", "3D")).toEqual([]);
    });
  });

  describe("generateMappedTwoDigitRangeCombinations", () => {
    it("should handle invalid start numbers", () => {
      expect(generateMappedTwoDigitRangeCombinations("1")).toEqual([]);
      expect(generateMappedTwoDigitRangeCombinations("123")).toEqual([]);
      expect(generateMappedTwoDigitRangeCombinations("")).toEqual([]);
      expect(generateMappedTwoDigitRangeCombinations("ab")).toEqual([]);
    });

    it("should handle invalid end numbers", () => {
      expect(generateMappedTwoDigitRangeCombinations("10", "1")).toEqual([]);
      expect(generateMappedTwoDigitRangeCombinations("10", "123")).toEqual([]);
      expect(generateMappedTwoDigitRangeCombinations("10", "")).toEqual([]);
      expect(generateMappedTwoDigitRangeCombinations("10", "ab")).toEqual([]);
    });

    it("should handle invalid ranges (start > end)", () => {
      expect(generateMappedTwoDigitRangeCombinations("19", "10")).toEqual([]);
      expect(generateMappedTwoDigitRangeCombinations("99", "00")).toEqual([]);
    });

    it("should handle unsupported range patterns", () => {
      expect(generateMappedTwoDigitRangeCombinations("12", "23")).toEqual([]);
      expect(generateMappedTwoDigitRangeCombinations("13", "24")).toEqual([]);
      expect(generateMappedTwoDigitRangeCombinations("14", "25")).toEqual([]);
    });

    it("should handle non-numeric inputs", () => {
      expect(generateMappedTwoDigitRangeCombinations("ab")).toEqual([]);
      expect(generateMappedTwoDigitRangeCombinations("1a")).toEqual([]);
      expect(generateMappedTwoDigitRangeCombinations("a1")).toEqual([]);
      expect(generateMappedTwoDigitRangeCombinations("10", "ab")).toEqual([]);
      expect(generateMappedTwoDigitRangeCombinations("ab", "10")).toEqual([]);
    });
  });

  describe("generateMappedThreeDigitRangeCombinations", () => {
    it("should handle invalid start numbers", () => {
      expect(generateMappedThreeDigitRangeCombinations("1")).toEqual([]);
      expect(generateMappedThreeDigitRangeCombinations("12")).toEqual([]);
      expect(generateMappedThreeDigitRangeCombinations("1234")).toEqual([]);
      expect(generateMappedThreeDigitRangeCombinations("")).toEqual([]);
      expect(generateMappedThreeDigitRangeCombinations("abc")).toEqual([]);
    });

    it("should handle invalid end numbers", () => {
      expect(generateMappedThreeDigitRangeCombinations("120", "1")).toEqual([]);
      expect(generateMappedThreeDigitRangeCombinations("120", "12")).toEqual([]);
      expect(generateMappedThreeDigitRangeCombinations("120", "1234")).toEqual([]);
      expect(generateMappedThreeDigitRangeCombinations("120", "")).toEqual([]);
      expect(generateMappedThreeDigitRangeCombinations("120", "abc")).toEqual([]);
    });

    it("should handle invalid ranges (start > end)", () => {
      expect(generateMappedThreeDigitRangeCombinations("129", "120")).toEqual([]);
      expect(generateMappedThreeDigitRangeCombinations("999", "000")).toEqual([]);
    });

    it("should handle unsupported range patterns", () => {
      expect(generateMappedThreeDigitRangeCombinations("123", "456")).toEqual([]);
      expect(generateMappedThreeDigitRangeCombinations("124", "357")).toEqual([]);
      expect(generateMappedThreeDigitRangeCombinations("135", "246")).toEqual([]);
    });

    it("should handle non-numeric inputs", () => {
      expect(generateMappedThreeDigitRangeCombinations("abc")).toEqual([]);
      expect(generateMappedThreeDigitRangeCombinations("12a")).toEqual([]);
      expect(generateMappedThreeDigitRangeCombinations("a12")).toEqual([]);
      expect(generateMappedThreeDigitRangeCombinations("120", "abc")).toEqual([]);
      expect(generateMappedThreeDigitRangeCombinations("abc", "120")).toEqual([]);
    });
  });

  describe("processInputNumber", () => {
    const mockChannels = [
      { id: "A", label: "A", multipliers: { "2D": 2, "3D": 3 } },
      { id: "B", label: "B", multipliers: { "2D": 1, "3D": 1 } },
    ];

    it("should handle empty input", () => {
      const result = processInputNumber("", mockChannels, 10);
      expect("error" in result).toBe(true);
      expect((result as { error: string }).error).toBe("Please enter a number before pressing Enter.");
    });

    it("should handle whitespace-only input", () => {
      const result = processInputNumber("   ", mockChannels, 10);
      expect("error" in result).toBe(true);
      expect((result as { error: string }).error).toBe("Please enter a number before pressing Enter.");
    });

    it("should handle no channels selected", () => {
      const result = processInputNumber("12", [], 10);
      expect("error" in result).toBe(true);
      expect((result as { error: string }).error).toBe("Please select at least one channel (e.g., A, B, C, Lo).");
    });

    it("should handle invalid number format", () => {
      const result = processInputNumber("1234", mockChannels, 10);
      expect("error" in result).toBe(true);
      expect((result as { error: string }).error).toContain("Invalid number format");
    });

    it("should handle invalid amount", () => {
      const result = processInputNumber("12", mockChannels, NaN);
      expect("error" in result).toBe(true);
      expect((result as { error: string }).error).toBe("Amount is not a valid number.");
    });

    it("should handle negative amount", () => {
      const result = processInputNumber("12", mockChannels, -10);
      expect("totalAmount" in result).toBe(true);
      expect((result as ProcessInputNumberResult).totalAmount).toBe("-30.00");
    });

    it("should handle zero amount", () => {
      const result = processInputNumber("12", mockChannels, 0);
      expect("totalAmount" in result).toBe(true);
      expect((result as ProcessInputNumberResult).totalAmount).toBe("0.00");
    });

    it("should handle invalid range", () => {
      const result = processInputNumber("19>10", mockChannels, 10);
      expect("error" in result).toBe(true);
      expect((result as { error: string }).error).toBe("Invalid range: start number must not exceed end number.");
    });

    it("should handle invalid X pattern with frequency violation", () => {
      const result = processInputNumber("1111X", mockChannels, 10);
      expect("error" in result).toBe(true);
      expect((result as { error: string }).error).toContain("Invalid number format");
    });

    it("should handle invalid ~ range format", () => {
      const result = processInputNumber("12~", mockChannels, 10);
      expect("error" in result).toBe(true);
      expect((result as { error: string }).error).toContain("Invalid number format");
    });

    it("should handle unsupported range patterns", () => {
      const result = processInputNumber("12>23", mockChannels, 10);
      expect("error" in result).toBe(true);
      expect((result as { error: string }).error).toBe("Invalid range: start number must not exceed end number.");
    });

    it("should handle invalid channel multipliers", () => {
      const invalidChannels = [{ id: "A", label: "A", multipliers: { "2D": NaN, "3D": 3 } }];
      const result = processInputNumber("12", invalidChannels, 10);
      expect("totalAmount" in result).toBe(true);
      expect((result as ProcessInputNumberResult).totalAmount).toBe("NaN");
    });

    it("should handle very large amounts", () => {
      const result = processInputNumber("12", mockChannels, Number.MAX_SAFE_INTEGER);
      expect("totalAmount" in result).toBe(true);
      // Calculation: Number.MAX_SAFE_INTEGER * (2 + 1) * 1 = 9007199254740991 * 3 = 27021597764222972
      expect((result as ProcessInputNumberResult).totalAmount).toBe("27021597764222972.00");
    });

    it("should handle very small amounts", () => {
      const result = processInputNumber("12", mockChannels, Number.MIN_VALUE);
      expect("totalAmount" in result).toBe(true);
      expect((result as ProcessInputNumberResult).totalAmount).toBe("0.00");
    });
  });

  describe("edge cases and boundary conditions", () => {
    it("should handle maximum valid 2D numbers", () => {
      expect(isSupportedBetInput("99")).toBe(true);
      expect(generateDigitPermutations("99", "2D")).toEqual(["99"]);
    });

    it("should handle maximum valid 3D numbers", () => {
      expect(isSupportedBetInput("999")).toBe(true);
      expect(generateDigitPermutations("999", "3D")).toEqual(["999"]);
    });

    it("should handle minimum valid 2D numbers", () => {
      expect(isSupportedBetInput("00")).toBe(true);
      expect(generateDigitPermutations("00", "2D")).toEqual(["00"]);
    });

    it("should handle minimum valid 3D numbers", () => {
      expect(isSupportedBetInput("000")).toBe(true);
      expect(generateDigitPermutations("000", "3D")).toEqual(["000"]);
    });

    it("should handle special characters in input", () => {
      expect(isSupportedBetInput("12!")).toBe(false);
      expect(isSupportedBetInput("12@")).toBe(false);
      expect(isSupportedBetInput("12#")).toBe(false);
      expect(isSupportedBetInput("12$")).toBe(false);
      expect(isSupportedBetInput("12%")).toBe(false);
    });

    it("should handle unicode characters", () => {
      expect(isSupportedBetInput("12\u{1F600}")).toBe(false); // emoji
      expect(isSupportedBetInput("12\u{00A0}")).toBe(false); // non-breaking space
      expect(isSupportedBetInput("12\u{200B}")).toBe(false); // zero-width space
    });

    it("should handle very long strings", () => {
      const longString = "1".repeat(20);
      expect(isSupportedBetInput(longString)).toBe(false);
      expect(generateDigitPermutations(longString, "2D")).toEqual([]);
      expect(generateDigitPermutations(longString, "3D")).toEqual([]);
    });

    it("should handle null and undefined inputs", () => {
      expect(isSupportedBetInput(null as unknown as string)).toBe(false);
      expect(isSupportedBetInput(undefined as unknown as string)).toBe(false);
      expect(generateDigitPermutations(null as unknown as string, "2D")).toEqual([]);
      expect(generateDigitPermutations(undefined as unknown as string, "3D")).toEqual([]);
    });
  });
});

describe("additional negative test cases", () => {
  describe("edge cases and boundary conditions", () => {
    it("should handle maximum valid 2D numbers", () => {
      expect(isSupportedBetInput("99")).toBe(true);
      expect(generateDigitPermutations("99", "2D")).toEqual(["99"]);
    });

    it("should handle maximum valid 3D numbers", () => {
      expect(isSupportedBetInput("999")).toBe(true);
      expect(generateDigitPermutations("999", "3D")).toEqual(["999"]);
    });

    it("should handle minimum valid 2D numbers", () => {
      expect(isSupportedBetInput("00")).toBe(true);
      expect(generateDigitPermutations("00", "2D")).toEqual(["00"]);
    });

    it("should handle minimum valid 3D numbers", () => {
      expect(isSupportedBetInput("000")).toBe(true);
      expect(generateDigitPermutations("000", "3D")).toEqual(["000"]);
    });

    it("should handle special characters in input", () => {
      expect(isSupportedBetInput("12!")).toBe(false);
      expect(isSupportedBetInput("12@")).toBe(false);
      expect(isSupportedBetInput("12#")).toBe(false);
      expect(isSupportedBetInput("12$")).toBe(false);
      expect(isSupportedBetInput("12%")).toBe(false);
      expect(isSupportedBetInput("12&")).toBe(false);
      expect(isSupportedBetInput("12*")).toBe(false);
      expect(isSupportedBetInput("12(")).toBe(false);
      expect(isSupportedBetInput("12)")).toBe(false);
      expect(isSupportedBetInput("12-")).toBe(false);
      expect(isSupportedBetInput("12_")).toBe(false);
      expect(isSupportedBetInput("12+")).toBe(false);
      expect(isSupportedBetInput("12=")).toBe(false);
    });

    it("should handle unicode characters", () => {
      expect(isSupportedBetInput("12\u{1F600}")).toBe(false); // emoji
      expect(isSupportedBetInput("12\u{00A0}")).toBe(false); // non-breaking space
      expect(isSupportedBetInput("12\u{200B}")).toBe(false); // zero-width space
      expect(isSupportedBetInput("12\u{2028}")).toBe(false); // line separator
      expect(isSupportedBetInput("12\u{2029}")).toBe(false); // paragraph separator
    });

    it("should handle null and undefined inputs", () => {
      expect(isSupportedBetInput(null as unknown as string)).toBe(false);
      expect(isSupportedBetInput(undefined as unknown as string)).toBe(false);
      expect(generateDigitPermutations(null as unknown as string, "2D")).toEqual([]);
      expect(generateDigitPermutations(undefined as unknown as string, "3D")).toEqual([]);
    });

    it("should handle mixed case letters", () => {
      expect(isSupportedBetInput("12A")).toBe(false);
      expect(isSupportedBetInput("12a")).toBe(false);
      expect(isSupportedBetInput("A12")).toBe(false);
      expect(isSupportedBetInput("a12")).toBe(false);
      expect(isSupportedBetInput("1A2")).toBe(false);
      expect(isSupportedBetInput("1a2")).toBe(false);
    });
  });

  describe("malformed range patterns", () => {
    it("should handle incomplete > patterns", () => {
      expect(isSupportedBetInput(">")).toBe(false);
      expect(isSupportedBetInput(">12")).toBe(false);
      expect(isSupportedBetInput(">123")).toBe(false);
    });

    it("should handle incomplete ~ patterns", () => {
      expect(isSupportedBetInput("~")).toBe(false);
      expect(isSupportedBetInput("~12")).toBe(false);
      expect(isSupportedBetInput("~123")).toBe(false);
      expect(isSupportedBetInput("12~")).toBe(false);
      expect(isSupportedBetInput("123~")).toBe(false);
    });

    it("should handle multiple operators", () => {
      expect(isSupportedBetInput("12>>15")).toBe(false);
      expect(isSupportedBetInput("12~~15")).toBe(false);
      expect(isSupportedBetInput("12>~15")).toBe(false);
      expect(isSupportedBetInput("12~>15")).toBe(false);
      expect(isSupportedBetInput("12X>15")).toBe(false);
      expect(isSupportedBetInput("12>X15")).toBe(false);
    });

    it("should handle operators in wrong positions", () => {
      expect(isSupportedBetInput("1>2")).toBe(false);
      expect(isSupportedBetInput("1~2")).toBe(false);
      expect(isSupportedBetInput("12>3")).toBe(false);
      expect(isSupportedBetInput("12~3")).toBe(false);
      expect(isSupportedBetInput("1>23")).toBe(false);
      expect(isSupportedBetInput("1~23")).toBe(false);
    });

    it("should handle mixed patterns", () => {
      expect(isSupportedBetInput("12X>15")).toBe(false);
      expect(isSupportedBetInput("12>X15")).toBe(false);
      expect(isSupportedBetInput("12X~15")).toBe(false);
      expect(isSupportedBetInput("12~X15")).toBe(false);
      expect(isSupportedBetInput("12X>")).toBe(false);
      expect(isSupportedBetInput("12X~")).toBe(false);
    });
  });

  describe("frequency rule violations", () => {
    it("should reject 4+ consecutive same digits in X patterns", () => {
      expect(isSupportedBetInput("1111X")).toBe(false);
      expect(isSupportedBetInput("2222X")).toBe(false);
      expect(isSupportedBetInput("3333X")).toBe(false);
      expect(isSupportedBetInput("4444X")).toBe(false);
      expect(isSupportedBetInput("5555X")).toBe(false);
      expect(isSupportedBetInput("6666X")).toBe(false);
      expect(isSupportedBetInput("7777X")).toBe(false);
      expect(isSupportedBetInput("8888X")).toBe(false);
      expect(isSupportedBetInput("9999X")).toBe(false);
      expect(isSupportedBetInput("0000X")).toBe(false);
    });

    it("should reject 5+ consecutive same digits in X patterns", () => {
      expect(isSupportedBetInput("11111X")).toBe(false);
      expect(isSupportedBetInput("22222X")).toBe(false);
      expect(isSupportedBetInput("33333X")).toBe(false);
      expect(isSupportedBetInput("44444X")).toBe(false);
      expect(isSupportedBetInput("55555X")).toBe(false);
    });

    it("should reject 6+ consecutive same digits in X patterns", () => {
      expect(isSupportedBetInput("111111X")).toBe(false);
      expect(isSupportedBetInput("222222X")).toBe(false);
      expect(isSupportedBetInput("333333X")).toBe(false);
    });

    it("should reject mixed frequency violations", () => {
      expect(isSupportedBetInput("11112222X")).toBe(false); // 1 appears 4 times, 2 appears 4 times
      expect(isSupportedBetInput("11111222X")).toBe(false); // 1 appears 5 times, 2 appears 3 times
      expect(isSupportedBetInput("11122222X")).toBe(false); // 1 appears 3 times, 2 appears 5 times
    });

    it("should accept valid frequency patterns", () => {
      expect(isSupportedBetInput("111X")).toBe(true); // 1 appears 3 times
      expect(isSupportedBetInput("222X")).toBe(true); // 2 appears 3 times
      expect(isSupportedBetInput("333X")).toBe(true); // 3 appears 3 times
      expect(isSupportedBetInput("111222X")).toBe(true); // 1 appears 3 times, 2 appears 3 times
      expect(isSupportedBetInput("111223X")).toBe(true); // 1 appears 3 times, 2 appears 2 times, 3 appears 1 time
    });
  });

  describe("numeric boundary tests", () => {
    it("should handle negative numbers", () => {
      expect(isSupportedBetInput("-12")).toBe(false);
      expect(isSupportedBetInput("-123")).toBe(false);
      expect(isSupportedBetInput("-12X")).toBe(false);
      expect(isSupportedBetInput("-123X")).toBe(false);
    });

    it("should handle decimal numbers", () => {
      expect(isSupportedBetInput("12.5")).toBe(false);
      expect(isSupportedBetInput("123.45")).toBe(false);
      expect(isSupportedBetInput("12.5X")).toBe(false);
      expect(isSupportedBetInput("123.45X")).toBe(false);
    });

    it("should handle scientific notation", () => {
      expect(isSupportedBetInput("1e2")).toBe(false);
      expect(isSupportedBetInput("1.2e3")).toBe(false);
      expect(isSupportedBetInput("12e1")).toBe(false);
    });

    it("should handle hexadecimal numbers", () => {
      expect(isSupportedBetInput("0x12")).toBe(false);
      expect(isSupportedBetInput("0x123")).toBe(false);
      expect(isSupportedBetInput("12x")).toBe(false); // different from 12X
    });

    it("should handle binary numbers", () => {
      expect(isSupportedBetInput("0b12")).toBe(false);
      expect(isSupportedBetInput("0b101")).toBe(false);
    });
  });

  describe("whitespace and formatting edge cases", () => {
    it("should handle various whitespace characters", () => {
      expect(isSupportedBetInput("\t12")).toBe(false);
      expect(isSupportedBetInput("12\t")).toBe(false);
      expect(isSupportedBetInput("\n12")).toBe(false);
      expect(isSupportedBetInput("12\n")).toBe(false);
      expect(isSupportedBetInput("\r12")).toBe(false);
      expect(isSupportedBetInput("12\r")).toBe(false);
      expect(isSupportedBetInput("\f12")).toBe(false);
      expect(isSupportedBetInput("12\f")).toBe(false);
      expect(isSupportedBetInput("\v12")).toBe(false);
      expect(isSupportedBetInput("12\v")).toBe(false);
    });

    it("should handle multiple spaces", () => {
      expect(isSupportedBetInput("  12")).toBe(false);
      expect(isSupportedBetInput("12  ")).toBe(false);
      expect(isSupportedBetInput("  12  ")).toBe(false);
      expect(isSupportedBetInput("12  34")).toBe(false);
    });

    it("should handle zero-width characters", () => {
      expect(isSupportedBetInput("\u200B12")).toBe(false); // zero-width space
      expect(isSupportedBetInput("12\u200B")).toBe(false);
      expect(isSupportedBetInput("\u200C12")).toBe(false); // zero-width non-joiner
      expect(isSupportedBetInput("12\u200C")).toBe(false);
      expect(isSupportedBetInput("\u200D12")).toBe(false); // zero-width joiner
      expect(isSupportedBetInput("12\u200D")).toBe(false);
      expect(isSupportedBetInput("\uFEFF12")).toBe(false); // zero-width no-break space
      expect(isSupportedBetInput("12\uFEFF")).toBe(false);
    });
  });

  describe("function parameter validation", () => {
    it("should handle invalid digit lengths in isExactLengthNumericString", () => {
      expect(isExactLengthNumericString("12", -1)).toBe(false);
      expect(isExactLengthNumericString("12", 0)).toBe(false);
      expect(isExactLengthNumericString("12", 1.5)).toBe(false);
      expect(isExactLengthNumericString("12", Infinity)).toBe(false);
      expect(isExactLengthNumericString("12", -Infinity)).toBe(false);
      expect(isExactLengthNumericString("12", NaN)).toBe(false);
    });

    it("should handle invalid syntax types in generateDigitPermutations", () => {
      expect(generateDigitPermutations("12", "1D" as "2D" | "3D")).toEqual([]);
      expect(generateDigitPermutations("12", "4D" as "2D" | "3D")).toEqual([]);
      expect(generateDigitPermutations("12", "5D" as "2D" | "3D")).toEqual([]);
      expect(generateDigitPermutations("12", "XD" as "2D" | "3D")).toEqual([]);
      expect(generateDigitPermutations("12", "" as "2D" | "3D")).toEqual([]);
    });

    it("should handle invalid syntax types in generateSimpleRangeCombinations", () => {
      expect(generateSimpleRangeCombinations("10", "19", "1D" as "2D" | "3D")).toEqual([]);
      expect(generateSimpleRangeCombinations("10", "19", "4D" as "2D" | "3D")).toEqual([]);
      expect(generateSimpleRangeCombinations("10", "19", "5D" as "2D" | "3D")).toEqual([]);
      expect(generateSimpleRangeCombinations("10", "19", "XD" as "2D" | "3D")).toEqual([]);
      expect(generateSimpleRangeCombinations("10", "19", "" as "2D" | "3D")).toEqual([]);
    });
  });

  describe("processInputNumber edge cases", () => {
    const mockChannels = [
      { id: "A", label: "A", multipliers: { "2D": 2, "3D": 3 } },
      { id: "B", label: "B", multipliers: { "2D": 1, "3D": 1 } },
    ];

    it("should handle invalid channel objects", () => {
      const invalidChannels = [
        { id: "A", label: "A", multipliers: { "2D": NaN, "3D": 3 } },
        { id: "B", label: "B", multipliers: { "2D": 1, "3D": Infinity } },
        { id: "C", label: "C", multipliers: { "2D": -1, "3D": 1 } },
      ];
      const result = processInputNumber("12", invalidChannels, 10);
      expect("totalAmount" in result).toBe(true);
      expect((result as ProcessInputNumberResult).totalAmount).toBe("NaN");
    });

    it("should handle missing multiplier properties", () => {
      const incompleteChannels = [
        { id: "A", label: "A", multipliers: { "2D": 2 } } as { id: string; label: string; multipliers: { "2D": number; "3D": number } },
        { id: "B", label: "B", multipliers: { "3D": 1 } } as { id: string; label: string; multipliers: { "2D": number; "3D": number } },
      ];
      const result = processInputNumber("12", incompleteChannels, 10);
      expect("totalAmount" in result).toBe(true);
      expect((result as ProcessInputNumberResult).totalAmount).toBe("NaN");
    });

    it("should handle extreme bet amounts", () => {
      const result = processInputNumber("12", mockChannels, Number.MAX_VALUE);
      expect("totalAmount" in result).toBe(true);
      expect((result as ProcessInputNumberResult).totalAmount).toBe("Infinity");
    });

    it("should handle negative infinity", () => {
      const result = processInputNumber("12", mockChannels, -Infinity);
      expect("totalAmount" in result).toBe(true);
      expect((result as ProcessInputNumberResult).totalAmount).toBe("-Infinity");
    });

    it("should handle very small positive numbers", () => {
      const result = processInputNumber("12", mockChannels, Number.MIN_VALUE);
      expect("totalAmount" in result).toBe(true);
      expect((result as ProcessInputNumberResult).totalAmount).toBe("0.00");
    });

    it("should handle zero with multiple channels", () => {
      const result = processInputNumber("12", mockChannels, 0);
      expect("totalAmount" in result).toBe(true);
      expect((result as ProcessInputNumberResult).totalAmount).toBe("0.00");
    });

    it("should handle empty channel array", () => {
      const result = processInputNumber("12", [], 10);
      expect("error" in result).toBe(true);
      expect((result as { error: string }).error).toBe("Please select at least one channel (e.g., A, B, C, Lo).");
    });
  });

  describe("string manipulation edge cases", () => {
    it("should handle strings with only operators", () => {
      expect(isSupportedBetInput(">")).toBe(false);
      expect(isSupportedBetInput("<")).toBe(false);
      expect(isSupportedBetInput("~")).toBe(false);
      expect(isSupportedBetInput("X")).toBe(false);
      expect(isSupportedBetInput(">>")).toBe(false);
      expect(isSupportedBetInput("~~")).toBe(false);
      expect(isSupportedBetInput("XX")).toBe(false);
    });

    it("should handle strings with operators at wrong positions", () => {
      expect(isSupportedBetInput(">12")).toBe(false);
      expect(isSupportedBetInput("12<")).toBe(false);
      expect(isSupportedBetInput("1>2")).toBe(false);
      expect(isSupportedBetInput("1~2")).toBe(false);
      expect(isSupportedBetInput("1X2")).toBe(false);
    });

    it("should handle strings with multiple X operators", () => {
      expect(isSupportedBetInput("12XX")).toBe(false);
      expect(isSupportedBetInput("123XX")).toBe(false);
      expect(isSupportedBetInput("12XXX")).toBe(false);
      expect(isSupportedBetInput("123XXX")).toBe(false);
    });

    it("should handle strings with mixed operators", () => {
      expect(isSupportedBetInput("12X>15")).toBe(false);
      expect(isSupportedBetInput("12>X15")).toBe(false);
      expect(isSupportedBetInput("12X~15")).toBe(false);
      expect(isSupportedBetInput("12~X15")).toBe(false);
      expect(isSupportedBetInput("12X>X15")).toBe(false);
    });
  });
});
