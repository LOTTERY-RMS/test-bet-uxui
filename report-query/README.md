# Report Query Mini Project

A simple Node.js application that queries PostgreSQL database and generates an HTML report with the results displayed in a table format.

## Features

- 🔌 PostgreSQL database connection
- 📊 SQL query execution
- 📄 HTML report generation with styled table
- 🎨 Responsive and modern UI design
- 📋 Console output with sample data
- ⚡ Fast execution with proper error handling

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL database running
- Access to the `public.number_utils_test_cases` table

## Setup

1. **Install dependencies:**

   ```bash
   cd report-query
   npm install
   ```

2. **Configure database connection:**

   Copy the environment example file:

   ```bash
   cp env.example .env
   ```

   Edit `.env` file with your database credentials:

   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=your_database_name
   DB_USER=your_username
   DB_PASSWORD=your_password
   DB_SSL=false
   ```

## Usage

### Generate Report

Run the application to generate the HTML report:

```bash
npm start
```

Or run in development mode with auto-restart:

```bash
npm run dev
```

### Output

The application will:

1. Connect to your PostgreSQL database
2. Execute the SQL query
3. Generate an HTML file (`report.html`) with the results
4. Display sample data in the console

### SQL Query

The application executes this query:

```sql
SELECT
  n.remark,
  n.description,
  array_to_string(n.expected_values, ',') AS expected_values
FROM
  public.number_utils_test_cases n;
```

## File Structure

```
report-query/
├── index.js          # Main application file
├── package.json      # Dependencies and scripts
├── env.example       # Environment variables template
├── README.md         # This file
└── report.html       # Generated HTML report (created after running)
```

## Troubleshooting

### Common Issues

1. **Connection Error:**

   - Verify PostgreSQL is running
   - Check database credentials in `.env` file
   - Ensure database exists and is accessible

2. **Table Not Found:**

   - Verify the table `public.number_utils_test_cases` exists
   - Check table permissions for your database user

3. **Permission Denied:**
   - Ensure your database user has SELECT permissions on the table
   - Check if the schema `public` is accessible

### Error Messages

The application provides helpful error messages and troubleshooting tips when issues occur.

## Customization

### Modify the Query

Edit the `sqlQuery` variable in `index.js` to change the SQL query:

```javascript
const sqlQuery = `
  SELECT 
    your_column1,
    your_column2
  FROM
    your_table;
`;
```

### Customize HTML Styling

Modify the CSS styles in the `createHTMLDocument` function to change the appearance of the generated report.

## Dependencies

- `pg`: PostgreSQL client for Node.js
- `dotenv`: Environment variable management

## License

This project is part of the test-bet-uxui workspace.
