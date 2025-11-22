import { BillData, CalculatedTotals, CalculatedUserTotal } from "../types";
import { DEFAULT_CURRENCY, CURRENCY_LOCALE, VENMO_NOTE_MAX_LENGTH, UNASSIGNED_ID, UNASSIGNED_NAME } from "./constants";

export const formatMoney = (amount: number, currency: string = DEFAULT_CURRENCY) => {
  return new Intl.NumberFormat(CURRENCY_LOCALE, {
    style: "currency",
    currency: currency,
  }).format(amount);
};

export const generateVenmoLink = (user: CalculatedUserTotal) => {
  const amount = user.total.toFixed(2);
  let note = `${user.items.map((i) => i.description).join(", ")}`;
  if (note.length > VENMO_NOTE_MAX_LENGTH) {
    note = note.substring(0, VENMO_NOTE_MAX_LENGTH - 3) + "...";
  }
  return `venmo://paycharge?txn=charge&amount=${amount}&note=${encodeURIComponent(
    note
  )}`;
};

export const calculateTotals = (data: BillData | null): CalculatedTotals | null => {
  if (!data) return null;

  const totals: Record<string, CalculatedUserTotal> = {};
  let subtotal = 0;

  data.participants.forEach((p) => {
    totals[p.id] = {
      name: p.name,
      base_amount: 0,
      charge_shares: {},
      total: 0,
      items: [],
    };
  });
  totals[UNASSIGNED_ID] = {
    name: UNASSIGNED_NAME,
    base_amount: 0,
    charge_shares: {},
    total: 0,
    items: [],
  };

  data.line_items.forEach((item) => {
    subtotal += item.total_price;
    const logic = data.split_logic.find((l) => l.item_id === item.id);
    const allocs = logic ? logic.allocations : [];

    if (!allocs || allocs.length === 0) {
      totals[UNASSIGNED_ID].base_amount += item.total_price;
      totals[UNASSIGNED_ID].items.push({
        description: item.description,
        total_price: item.total_price,
        share: 1,
      });
      return;
    }

    const totalWeight = allocs.reduce((sum, a) => sum + a.weight, 0);

    allocs.forEach((alloc) => {
      if (totals[alloc.participant_id]) {
        const shareFraction = alloc.weight / totalWeight;
        const costShare = item.total_price * shareFraction;
        totals[alloc.participant_id].base_amount += costShare;
        totals[alloc.participant_id].items.push({
          description: item.description,
          total_price: item.total_price,
          share: shareFraction,
        });
      }
    });
  });

  const getChargeValue = (charge: { type: 'fixed' | 'percentage'; value: number }, basis: number): number => {
    if (charge.value === undefined || charge.value === null) return 0;
    return charge.type === "percentage" ? basis * (charge.value / 100) : charge.value;
  };

  // Calculate total for each charge and distribute to users
  const totalCharges: Record<string, number> = {};
  let totalChargesSum = 0;

  data.additional_charges.forEach((charge) => {
    const chargeTotal = getChargeValue(charge, subtotal);
    totalCharges[charge.id] = chargeTotal;
    totalChargesSum += chargeTotal;

    // Distribute charge to users based on their share of subtotal
    Object.keys(totals).forEach((pid) => {
      const userShareOfSubtotal =
        subtotal > 0 ? totals[pid].base_amount / subtotal : 0;
      totals[pid].charge_shares[charge.id] = chargeTotal * userShareOfSubtotal;
    });
  });

  // Calculate final totals for each user
  Object.keys(totals).forEach((pid) => {
    const chargesTotal = Object.values(totals[pid].charge_shares).reduce((sum, val) => sum + val, 0);
    totals[pid].total = totals[pid].base_amount + chargesTotal;
  });

  return {
    subtotal,
    totalCharges,
    grandTotal: subtotal + totalChargesSum,
    byUser: totals,
  };
};

