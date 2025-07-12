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
      id SERIAL PRIMARY KEY,
      start_number TEXT,
      end_number TEXT,
      sign TEXT,
      syntax_type TEXT NOT NULL,
      expected_count INTEGER NOT NULL,
      expected_values TEXT[] NOT NULL,
      description TEXT
    )
  `);
  return pool;
}

export async function insertTestCases(
  pool: Pool,
  testCases: Array<{
    start_number?: string;
    end_number?: string | undefined;
    sign: string;
    syntax_type: "2D" | "3D";
    expected_count: number;
    expected_values: string[];
    description: string;
  }>
) {
  await pool.query("TRUNCATE TABLE number_utils_test_cases");
  for (const testCase of testCases) {
    await pool.query("INSERT INTO number_utils_test_cases (start_number, end_number, sign, syntax_type, expected_count, expected_values, description) VALUES ($1, $2, $3, $4, $5, $6, $7)", [
      testCase.start_number || null,
      testCase.end_number || null,
      testCase.sign,
      testCase.syntax_type,
      testCase.expected_count,
      testCase.expected_values,
      testCase.description,
    ]);
  }
}

export async function getTestCases(pool: Pool): Promise<
  Array<{
    start_number?: string;
    end_number?: string;
    sign: string;
    syntax_type: "2D" | "3D";
    expected_count: number;
    expected_values: string[];
    description: string;
  }>
> {
  console.log("Getting test cases");
  const { rows } = await pool.query("SELECT * FROM number_utils_test_cases ORDER BY id");
  console.log(`Found ${rows.length} test cases`);
  return rows;
}
