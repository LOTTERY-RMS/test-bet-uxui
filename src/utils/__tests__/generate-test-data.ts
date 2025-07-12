import { setupTestDatabase, insertTestCases } from "./setup-test-db";

import { generateMappedTwoDigitRangeCombinations, generateMappedThreeDigitRangeCombinations, generateDigitPermutations } from "../numberUtils.ts";

const testCaseDefinitions = [
  { key: "01>04", func: () => generateMappedTwoDigitRangeCombinations("01", "04") },
  { key: "05>09", func: () => generateMappedTwoDigitRangeCombinations("05", "09") },
  { key: "51>91", func: () => generateMappedTwoDigitRangeCombinations("51", "91") },
  { key: "10>19", func: () => generateMappedTwoDigitRangeCombinations("10", "19") },
  { key: "01>91", func: () => generateMappedTwoDigitRangeCombinations("01", "91") },
  { key: "000>999", func: () => generateMappedThreeDigitRangeCombinations("000", "999") },
  { key: "100>109", func: () => generateMappedThreeDigitRangeCombinations("100", "109") },
  { key: "120>129", func: () => generateMappedThreeDigitRangeCombinations("120", "129") },
  { key: "100>199", func: () => generateMappedThreeDigitRangeCombinations("100", "199") },
  { key: "200>299", func: () => generateMappedThreeDigitRangeCombinations("200", "299") },
  { key: "300>399", func: () => generateMappedThreeDigitRangeCombinations("300", "399") },
  { key: "400>499", func: () => generateMappedThreeDigitRangeCombinations("400", "499") },
  { key: "401>491", func: () => generateMappedThreeDigitRangeCombinations("401", "491") },
  { key: "500>599", func: () => generateMappedThreeDigitRangeCombinations("500", "599") },
  { key: "600>699", func: () => generateMappedThreeDigitRangeCombinations("600", "699") },
  { key: "700>799", func: () => generateMappedThreeDigitRangeCombinations("700", "799") },
  { key: "800>899", func: () => generateMappedThreeDigitRangeCombinations("800", "899") },
  { key: "900>999", func: () => generateMappedThreeDigitRangeCombinations("900", "999") },
  { key: "12X", func: () => generateDigitPermutations("12", "2D") },
  { key: "112X", func: () => generateDigitPermutations("112", "3D") },
  { key: "123X", func: () => generateDigitPermutations("123", "3D") },
  { key: "1112X", func: () => generateDigitPermutations("1112", "3D") },
  { key: "1122X", func: () => generateDigitPermutations("1122", "3D") },
  { key: "1123X", func: () => generateDigitPermutations("1123", "3D") },
  { key: "1234X", func: () => generateDigitPermutations("1234", "3D") },
  { key: "11122X", func: () => generateDigitPermutations("11122", "3D") },
  { key: "11123X", func: () => generateDigitPermutations("11123", "3D") },
  { key: "11223X", func: () => generateDigitPermutations("11223", "3D") },
  { key: "11234X", func: () => generateDigitPermutations("11234", "3D") },
  { key: "12345X", func: () => generateDigitPermutations("12345", "3D") },
  { key: "111222X", func: () => generateDigitPermutations("111222", "3D") },
  { key: "111223X", func: () => generateDigitPermutations("111223", "3D") },
  { key: "112233X", func: () => generateDigitPermutations("112233", "3D") },
  { key: "111234X", func: () => generateDigitPermutations("111234", "3D") },
  { key: "112234X", func: () => generateDigitPermutations("112234", "3D") },
  { key: "112345X", func: () => generateDigitPermutations("112345", "3D") },
  { key: "123456X", func: () => generateDigitPermutations("123456", "3D") },
  { key: "1234567X", func: () => generateDigitPermutations("1234567", "3D") },
  { key: "12345678X", func: () => generateDigitPermutations("12345678", "3D") },
  { key: "123456789X", func: () => generateDigitPermutations("123456789", "3D") },
];

async function generateTestData() {
  const pool = await setupTestDatabase();
  const testCases = [];
  for (const testCase of testCaseDefinitions) {
    try {
      const values = testCase.func();
      console.log(`Generated ${values.length} values for ${testCase.key}`);
      testCases.push({ key: testCase.key, values });
    } catch (error) {
      console.error(`Error generating data for ${testCase.key}:`, error);
    }
  }
  await insertTestCases(pool, testCases);
  await pool.end();
  console.log(`\nTest data generated successfully!`);
  console.log(`Database: test_cases table in your local Postgres`);
  console.log(`Total test cases: ${testCases.length}`);
}

generateTestData().catch(console.error);
