import {
  BillData,
  LineItem,
  Modifier,
  Modifiers,
  Participant,
  SplitAllocation,
  SplitLogic,
  Meta,
} from "./lib/schema";

export type {
  BillData,
  LineItem,
  Modifier,
  Modifiers,
  Participant,
  SplitAllocation,
  SplitLogic,
  Meta,
};

export interface CalculatedUserTotal {
  name: string;
  base_amount: number;
  tax_share: number;
  tip_share: number;
  total: number;
  items: {
    description: string;
    total_price: number;
    share: number;
  }[];
}

export interface CalculatedTotals {
  subtotal: number;
  totalTax: number;
  totalTip: number;
  grandTotal: number;
  byUser: Record<string, CalculatedUserTotal>;
}
