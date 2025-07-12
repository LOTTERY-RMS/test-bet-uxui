declare module "../test/test-cases.json" {
  const value: Array<{
    remark: string;
    description: string;
    expected_values: string[];
  }>;
  export default value;
}
