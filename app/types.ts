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

export interface AdditionalCharge {
  id: string;
  label: string;
  source: 'receipt' | 'user_prompt' | 'user';
  type: 'fixed' | 'percentage';
  value: number;
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
  additional_charges: AdditionalCharge[];
}

export interface CalculatedUserTotal {
  name: string;
  base_amount: number;
  charge_shares: Record<string, number>; // Maps charge ID to amount
  total: number;
  items: {
    description: string;
    total_price: number;
    share: number;
  }[];
}

export interface CalculatedTotals {
  subtotal: number;
  totalCharges: Record<string, number>; // Maps charge ID to total amount
  grandTotal: number;
  byUser: Record<string, CalculatedUserTotal>;
}

