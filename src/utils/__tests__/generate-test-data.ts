// import { setupTestDatabase, insertTestCases } from "./setup-test-db";

// import { generateMappedTwoDigitRangeCombinations, generateMappedThreeDigitRangeCombinations, generateDigitPermutations, generateSimpleRangeCombinations } from "../numberUtils.ts";

// const testCaseDefinitions = [
//   // =====================
//   // Single number cases
//   // =====================
//   { start_number: "12", sign: "", syntax_type: "2D" as const },
//   { start_number: "99", sign: "", syntax_type: "2D" as const },
//   { start_number: "00", sign: "", syntax_type: "2D" as const },
//   { start_number: "123", sign: "", syntax_type: "3D" as const },
//   { start_number: "999", sign: "", syntax_type: "3D" as const },
//   { start_number: "000", sign: "", syntax_type: "3D" as const },

//   // =====================
//   // X permutation cases
//   // =====================
//   // 2D X
//   { start_number: "12", sign: "X", syntax_type: "2D" as const },
//   { start_number: "11", sign: "X", syntax_type: "2D" as const },
//   { start_number: "99", sign: "X", syntax_type: "2D" as const },
//   // 3D X
//   { start_number: "111", sign: "X", syntax_type: "3D" as const },
//   { start_number: "112", sign: "X", syntax_type: "3D" as const },
//   { start_number: "123", sign: "X", syntax_type: "3D" as const },
//   { start_number: "1112", sign: "X", syntax_type: "3D" as const },
//   { start_number: "1122", sign: "X", syntax_type: "3D" as const },
//   { start_number: "1123", sign: "X", syntax_type: "3D" as const },
//   { start_number: "1234", sign: "X", syntax_type: "3D" as const },
//   { start_number: "11122", sign: "X", syntax_type: "3D" as const },
//   { start_number: "11123", sign: "X", syntax_type: "3D" as const },
//   { start_number: "11223", sign: "X", syntax_type: "3D" as const },
//   { start_number: "11234", sign: "X", syntax_type: "3D" as const },
//   { start_number: "12345", sign: "X", syntax_type: "3D" as const },
//   { start_number: "111222", sign: "X", syntax_type: "3D" as const },
//   { start_number: "111223", sign: "X", syntax_type: "3D" as const },
//   { start_number: "112233", sign: "X", syntax_type: "3D" as const },
//   { start_number: "111234", sign: "X", syntax_type: "3D" as const },
//   { start_number: "112234", sign: "X", syntax_type: "3D" as const },
//   { start_number: "112345", sign: "X", syntax_type: "3D" as const },
//   { start_number: "123456", sign: "X", syntax_type: "3D" as const },
//   { start_number: "1234567", sign: "X", syntax_type: "3D" as const },
//   { start_number: "12345678", sign: "X", syntax_type: "3D" as const },
//   { start_number: "123456789", sign: "X", syntax_type: "3D" as const },

//   // =====================
//   // Mapped two digit range cases (> operator)
//   // =====================
//   { start_number: "01", end_number: "04", sign: ">", syntax_type: "2D" as const },
//   { start_number: "05", end_number: "09", sign: ">", syntax_type: "2D" as const },
//   { start_number: "51", end_number: "91", sign: ">", syntax_type: "2D" as const },
//   { start_number: "10", end_number: "19", sign: ">", syntax_type: "2D" as const },
//   { start_number: "01", end_number: "91", sign: ">", syntax_type: "2D" as const },
//   { start_number: "00", end_number: "05", sign: ">", syntax_type: "2D" as const },
//   { start_number: "11", end_number: "22", sign: ">", syntax_type: "2D" as const },

//   // =====================
//   // Mapped three digit range cases (> operator)
//   // =====================
//   { start_number: "000", end_number: "999", sign: ">", syntax_type: "3D" as const },
//   { start_number: "100", end_number: "109", sign: ">", syntax_type: "3D" as const },
//   { start_number: "120", end_number: "129", sign: ">", syntax_type: "3D" as const },
//   { start_number: "100", end_number: "199", sign: ">", syntax_type: "3D" as const },
//   { start_number: "401", end_number: "491", sign: ">", syntax_type: "3D" as const },
//   { start_number: "055", end_number: "955", sign: ">", syntax_type: "3D" as const },
//   { start_number: "054", end_number: "954", sign: ">", syntax_type: "3D" as const },
//   { start_number: "540", end_number: "544", sign: ">", syntax_type: "3D" as const },
//   { start_number: "545", end_number: "549", sign: ">", syntax_type: "3D" as const },
//   { start_number: "111", end_number: "333", sign: ">", syntax_type: "3D" as const },
//   { start_number: "101", end_number: "191", sign: ">", syntax_type: "3D" as const },
//   { start_number: "210", end_number: "910", sign: ">", syntax_type: "3D" as const },
//   { start_number: "100", end_number: "105", sign: ">", syntax_type: "3D" as const },

//   // =====================
//   // Simple range cases (~ operator)
//   // =====================
//   // 2D ~
//   { start_number: "01", end_number: "05", sign: "~", syntax_type: "2D" as const },
//   { start_number: "10", end_number: "19", sign: "~", syntax_type: "2D" as const },
//   { start_number: "00", end_number: "05", sign: "~", syntax_type: "2D" as const },
//   // 3D ~
//   { start_number: "100", end_number: "105", sign: "~", syntax_type: "3D" as const },
//   { start_number: "120", end_number: "129", sign: "~", syntax_type: "3D" as const },
//   { start_number: "120", end_number: "125", sign: "~", syntax_type: "3D" as const },
// ];

// async function generateTestData() {
//   const pool = await setupTestDatabase();
//   const testCases = [];

//   for (const testCase of testCaseDefinitions) {
//     try {
//       let expected_values: string[] = [];
//       let expected_count = 0;

//       if (testCase.sign === ">") {
//         if (testCase.syntax_type === "2D") {
//           expected_values = generateMappedTwoDigitRangeCombinations(testCase.start_number!, testCase.end_number);
//         } else {
//           expected_values = generateMappedThreeDigitRangeCombinations(testCase.start_number!, testCase.end_number);
//         }
//       } else if (testCase.sign === "~") {
//         expected_values = generateSimpleRangeCombinations(testCase.start_number!, testCase.end_number!, testCase.syntax_type);
//       } else if (testCase.sign === "X") {
//         expected_values = generateDigitPermutations(testCase.start_number!, testCase.syntax_type);
//       } else if (testCase.sign === "") {
//         expected_values = [testCase.start_number!];
//       }

//       expected_count = expected_values.length;

//       // Generate dynamic description
//       let description = "";
//       if (testCase.sign === ">") {
//         description = `${testCase.start_number}>${testCase.end_number} (${expected_count})`;
//       } else if (testCase.sign === "~") {
//         description = `${testCase.start_number}~${testCase.end_number} (${expected_count})`;
//       } else if (testCase.sign === "X") {
//         description = `${testCase.start_number}X (${expected_count})`;
//       } else if (testCase.sign === "") {
//         description = `${testCase.start_number} (${expected_count})`;
//       }

//       console.log(`Generated ${expected_count} values for ${description}`);

//       testCases.push({
//         start_number: testCase.start_number,
//         end_number: testCase.end_number || undefined,
//         sign: testCase.sign,
//         syntax_type: testCase.syntax_type,
//         expected_count,
//         expected_values,
//         description,
//       });
//     } catch (error) {
//       console.error(`Error generating data for ${testCase.start_number}${testCase.sign}${testCase.end_number || ""}:`, error);
//     }
//   }

//   await insertTestCases(pool, testCases);
//   await pool.end();
//   console.log(`\nTest data generated successfully!`);
//   console.log(`Database: number_utils_test_cases table in your local Postgres`);
//   console.log(`Total test cases: ${testCases.length}`);
// }

// generateTestData().catch(console.error);
