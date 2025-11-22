import { BillData } from "../types";

// UI Constants
export const APP_NAME = "FairShare";
export const APP_TAGLINE = "Snap a receipt, explain the split, done.";

// Image Processing
export const IMAGE_MAX_WIDTH = 1280;
export const IMAGE_QUALITY = 0.7;
export const IMAGE_MIME_TYPE = "image/jpeg";

// Split Weight Adjustments
export const WEIGHT_INCREMENT = 0.5;
export const WEIGHT_INITIAL = 1;
export const WEIGHT_MIN = 0;

// API Configuration
export const API_MODEL = "google/gemini-2.5-flash-preview-09-2025";
export const API_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";

// Currency
export const DEFAULT_CURRENCY = "USD";
export const CURRENCY_LOCALE = "en-US";

// Participant IDs
export const UNASSIGNED_ID = "unassigned";
export const UNASSIGNED_NAME = "Unassigned";

// Default Values
export const DEFAULT_NEW_PARTICIPANT_NAME = "New Person";
export const DEFAULT_ITEM_DESCRIPTION = "Item";
export const DEFAULT_QUANTITY = 1;
export const DEFAULT_PRICE = 0;

// Validation
export const VENMO_NOTE_MAX_LENGTH = 150;

// Common Charge Types
export const COMMON_CHARGE_TYPES = [
  { id: "tax", label: "Tax" },
  { id: "tip", label: "Tip" },
  { id: "service_charge", label: "Service Charge" },
  { id: "sf_mandate", label: "SF Mandate" },
  { id: "delivery_fee", label: "Delivery Fee" },
];

export const MOCK_DATA: BillData = {
  meta: { currency: DEFAULT_CURRENCY, notes: "Generated example" },
  participants: [
    { id: "p1", name: "Alex" },
    { id: "p2", name: "Sam" },
    { id: "p3", name: "Jordan" },
  ],
  line_items: [
    {
      id: "i1",
      description: "Shared Appetizer Platter",
      quantity: 1,
      unit_price: 18.0,
      total_price: 18.0,
    },
    {
      id: "i2",
      description: "Alex's Burger",
      quantity: 1,
      unit_price: 16.5,
      total_price: 16.5,
    },
    {
      id: "i3",
      description: "Pitcher of Beer",
      quantity: 1,
      unit_price: 24.0,
      total_price: 24.0,
    },
  ],
  split_logic: [
    {
      item_id: "i1",
      method: "equal",
      allocations: [
        { participant_id: "p1", weight: 1 },
        { participant_id: "p2", weight: 1 },
        { participant_id: "p3", weight: 1 },
      ],
    },
    {
      item_id: "i2",
      method: "explicit",
      allocations: [{ participant_id: "p1", weight: 1 }],
    },
    {
      item_id: "i3",
      method: "ratio",
      allocations: [
        { participant_id: "p2", weight: 2 },
        { participant_id: "p3", weight: 1 },
      ],
    },
  ],
  additional_charges: [
    { id: "tax", label: "Tax", source: "receipt", type: "fixed", value: 5.85 },
    { id: "tip", label: "Tip", source: "user_prompt", type: "percentage", value: 20 },
  ],
};

