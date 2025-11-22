export interface Participant {
  id: string;
  name: string;
}

export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  category: string;
}

export interface SplitAllocation {
  participant_id: string;
  weight: number;
}

export interface SplitLogic {
  item_id: string;
  method: 'explicit' | 'equal' | 'ratio';
  allocations: SplitAllocation[];
}

export interface Modifier {
  source: 'receipt' | 'user_prompt' | 'user';
  type: 'fixed' | 'percentage';
  value: number;
}

export interface Fee {
  description: string;
  type: 'fixed' | 'percentage';
  value: number;
}

export interface Modifiers {
  tax: Modifier;
  tip: Modifier;
  fees: Fee[];
}

export interface Meta {
  currency: string;
  notes: string;
}

export interface BillData {
  meta: Meta;
  participants: Participant[];
  line_items: LineItem[];
  split_logic: SplitLogic[];
  modifiers: Modifiers;
}

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

