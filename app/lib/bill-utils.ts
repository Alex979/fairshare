import { BillData, CalculatedTotals, CalculatedUserTotal } from "../types";

export const formatMoney = (amount: number, currency: string = "USD") => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
  }).format(amount);
};

export const generateVenmoLink = (user: CalculatedUserTotal) => {
  const amount = user.total.toFixed(2);
  let note = `${user.items.map((i) => i.description).join(", ")}`;
  if (note.length > 150) note = note.substring(0, 147) + "...";
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
      tax_share: 0,
      tip_share: 0,
      total: 0,
      items: [],
    };
  });
  totals["unassigned"] = {
    name: "Unassigned",
    base_amount: 0,
    tax_share: 0,
    tip_share: 0,
    total: 0,
    items: [],
  };

  data.line_items.forEach((item) => {
    subtotal += item.total_price;
    const logic = data.split_logic.find((l) => l.item_id === item.id);
    const allocs = logic ? logic.allocations : [];

    if (!allocs || allocs.length === 0) {
      totals["unassigned"].base_amount += item.total_price;
      totals["unassigned"].items.push({
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

  const getModValue = (mod: any, basis: number) => {
    if (!mod) return 0;
    return mod.type === "percentage" ? basis * (mod.value / 100) : mod.value;
  };

  const totalTax = getModValue(data.modifiers.tax, subtotal);
  const totalTip = getModValue(data.modifiers.tip, subtotal);

  Object.keys(totals).forEach((pid) => {
    const userShareOfSubtotal =
      subtotal > 0 ? totals[pid].base_amount / subtotal : 0;
    totals[pid].tax_share = totalTax * userShareOfSubtotal;
    totals[pid].tip_share = totalTip * userShareOfSubtotal;
    totals[pid].total =
      totals[pid].base_amount + totals[pid].tax_share + totals[pid].tip_share;
  });

  return {
    subtotal,
    totalTax,
    totalTip,
    grandTotal: subtotal + totalTax + totalTip,
    byUser: totals,
  };
};

