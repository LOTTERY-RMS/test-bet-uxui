import { Pool } from "pg";

const pool = new Pool({
  host: "localhost",
  database: "test_bet_uxui",
  user: "postgres",
  password: "password",
  port: 5432,
});

export async function setupTestDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS number_utils_test_cases (
      key TEXT NOT NULL,
      number TEXT NOT NULL,
      PRIMARY KEY (key, number)
    )
  `);
  return pool;
}

export async function insertTestCases(pool: Pool, testCases: Array<{ key: string; values: string[] }>) {
  await pool.query("TRUNCATE TABLE number_utils_test_cases");
  for (const testCase of testCases) {
    for (const value of testCase.values) {
      await pool.query("INSERT INTO number_utils_test_cases (key, number) VALUES ($1, $2)", [testCase.key, value]);
    }
  }
}

export async function getTestCases(pool: Pool): Promise<Record<string, { count: number; values: string[] }>> {
  console.log("Getting test cases");
  const { rows } = await pool.query("SELECT key, number FROM number_utils_test_cases ORDER BY key, number");
  const testCases: Record<string, { count: number; values: string[] }> = {};
  for (const row of rows) {
    if (!testCases[row.key]) testCases[row.key] = { count: 0, values: [] };
    testCases[row.key].values.push(row.number);
    testCases[row.key].count = testCases[row.key].values.length;
  }
  console.log(testCases);
  return testCases;
}
