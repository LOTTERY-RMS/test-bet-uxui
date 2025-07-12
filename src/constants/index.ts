// Application constants
export const APP_CONFIG = {
  LOCAL_STORAGE_KEYS: {
    ENTERED_NUMBERS: "enteredNumbers",
  },
  API_ENDPOINTS: {
    SERVERS_DATA: "data/servers.json",
  },
  VALIDATION: {
    MAX_COMBINATIONS_DISPLAY: 100,
    AMOUNT_DECIMAL_PLACES: 2,
  },
  CURRENCIES: {
    USD: "USD",
    KHR: "KHR",
  },
  SYNTAX_TYPES: {
    TWO_D: "2D",
    THREE_D: "3D",
  },
} as const;

// Calculator input patterns
export const CALCULATOR_PATTERNS = {
  VALID_FINAL_INPUT_PATTERNS: [
    /^\d{2}$/, // ## (e.g., 12)
    /^\d{3}$/, // ### (e.g., 123)
    /^\d{2,}X$/, // ##X, ###X, ####X, etc. (permutations with frequency rules)
    /^\d{2}>$/, // ##> (e.g., 12>)
    /^\d{3}>$/, // ###> (e.g., 123>)
    /^\d{3}>\d{3}$/, // ###>### (e.g., 123>125)
    /^\d{2}>\d{2}$/, // ##>## (e.g., 12>15)
    /^\d{3}~\d{3}$/, // ###~### (e.g., 123~125)
    /^\d{2}~\d{2}$/, // ##~## (e.g., 12~15)
  ],
  MAX_DIGIT_FREQUENCY: 3,
} as const;

// Error messages
export const ERROR_MESSAGES = {
  LOAD_SERVER_DATA: "Failed to load server data: ",
  LOAD_SAVED_DATA: "Failed to load saved data. Starting fresh.",
  INVALID_AMOUNT: "Invalid amount entered. Please enter a number.",
  INVALID_NUMBER_FORMAT: "Invalid number format. Supported formats: ##, ###, ##X, ###X, ####X, #####X, ##>, ###>, ##>##, ###>###, ##~##, ###~###.",
  NO_NUMBER_ENTERED: "Please enter a number before pressing Enter.",
  NO_CHANNEL_SELECTED: "Please select at least one channel (e.g., A, B, C, Lo).",
  INVALID_AMOUNT_NUMBER: "Amount is not a valid number.",
  INVALID_RANGE: "Invalid range: start number must not exceed end number.",
  INVALID_RANGE_FORMAT: "Invalid number format for range.",
  INVALID_DIGIT_COUNT: "Invalid number format based on digit count.",
} as const;

// UI constants
export const UI_CONFIG = {
  TABLE_SCROLL_HEIGHT: 700,
  TOOLTIP_MAX_COMBINATIONS: 100,
  LOADING_HEIGHT: 200,
  LOADING_FONT_SIZE: "18px",
  LOADING_COLOR: "#666",
} as const;
