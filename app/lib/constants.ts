import { BillData } from "../types";

export const MOCK_DATA: BillData = {
  meta: { currency: "USD", notes: "Generated example" },
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
      category: "food",
    },
    {
      id: "i2",
      description: "Alex's Burger",
      quantity: 1,
      unit_price: 16.5,
      total_price: 16.5,
      category: "food",
    },
    {
      id: "i3",
      description: "Pitcher of Beer",
      quantity: 1,
      unit_price: 24.0,
      total_price: 24.0,
      category: "alcohol",
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
  modifiers: {
    tax: { source: "receipt", type: "fixed", value: 5.85 },
    tip: { source: "user_prompt", type: "percentage", value: 20 },
    fees: [],
  },
};

