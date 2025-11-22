import {
  BillData,
  LineItem,
  Modifier,
  Participant,
  SplitLogic,
} from "../types";

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const toNumber = (value: unknown, fallback = 0): number => {
  if (typeof value === "number") return Number.isFinite(value) ? value : fallback;
  if (typeof value === "string") {
    const next = Number.parseFloat(value);
    return Number.isFinite(next) ? next : fallback;
  }
  return fallback;
};

const generateId = (prefix: string, index: number) =>
  `${prefix}-${index}-${Math.random().toString(36).slice(2, 7)}`;

const normalizeParticipant = (
  participant: unknown,
  index: number
): Participant => {
  const raw = (participant || {}) as Partial<Participant>;
  return {
    id: isNonEmptyString(raw.id) ? raw.id : generateId("participant", index),
    name: isNonEmptyString(raw.name) ? raw.name.trim() : `Person ${index + 1}`,
  };
};

const normalizeLineItem = (item: unknown, index: number): LineItem => {
  const raw = (item || {}) as Partial<LineItem>;
  const quantity = Math.max(1, Math.round(toNumber(raw.quantity, 1)));
  const total = Math.max(
    0,
    toNumber(
      raw.total_price,
      toNumber(raw.unit_price, 0) * Math.max(1, toNumber(raw.quantity, 1))
    )
  );
  const unit =
    quantity > 0
      ? total / quantity
      : Math.max(0, toNumber(raw.unit_price, total));

  return {
    id: isNonEmptyString(raw.id) ? raw.id : generateId("item", index),
    description: isNonEmptyString(raw.description)
      ? raw.description.trim()
      : `Item ${index + 1}`,
    quantity,
    unit_price: Number(unit.toFixed(2)),
    total_price: Number(total.toFixed(2)),
    category: isNonEmptyString(raw.category) ? raw.category : "uncategorized",
  };
};

const normalizeModifier = (
  modifier: unknown,
  fallbackSource: Modifier["source"]
): Modifier => {
  const raw = (modifier || {}) as Partial<Modifier>;
  const allowedSources: Modifier["source"][] = ["receipt", "user", "user_prompt"];
  const allowedTypes: Modifier["type"][] = ["fixed", "percentage"];

  return {
    source: allowedSources.includes(raw.source as Modifier["source"])
      ? (raw.source as Modifier["source"])
      : fallbackSource,
    type: allowedTypes.includes(raw.type as Modifier["type"])
      ? (raw.type as Modifier["type"])
      : "fixed",
    value: Number(toNumber(raw.value, 0).toFixed(2)),
  };
};

const normalizeSplitLogic = (
  logic: unknown,
  index: number,
  validItemIds: Set<string>,
  validParticipantIds: Set<string>
): SplitLogic | null => {
  const raw = (logic || {}) as Partial<SplitLogic>;
  const itemId = isNonEmptyString(raw.item_id)
    ? raw.item_id
    : Array.from(validItemIds)[index];
  if (!itemId || !validItemIds.has(itemId)) return null;

  const allowedMethods: SplitLogic["method"][] = ["explicit", "equal", "ratio"];
  const method: SplitLogic["method"] = allowedMethods.includes(
    raw.method as SplitLogic["method"]
  )
    ? (raw.method as SplitLogic["method"])
    : "ratio";

  const allocations = Array.isArray(raw.allocations)
    ? raw.allocations
        .map((alloc) => {
          const participantId = isNonEmptyString(alloc?.participant_id)
            ? alloc?.participant_id
            : null;
          const weight = Number(toNumber(alloc?.weight, 0).toFixed(3));
          if (
            !participantId ||
            !validParticipantIds.has(participantId) ||
            weight <= 0
          ) {
            return null;
          }
          return { participant_id: participantId, weight };
        })
        .filter(Boolean)
    : [];

  return {
    item_id: itemId,
    method,
    allocations,
  };
};

export const sanitizeBillData = (payload: unknown): BillData => {
  const raw = (typeof payload === "object" && payload !== null
    ? payload
    : {}) as Partial<BillData>;

  const participantList = Array.isArray(raw.participants) ? raw.participants : [];
  const normalizedParticipants = (
    participantList.length ? participantList : [{ name: "Person 1" }]
  ).map((participant, index) => normalizeParticipant(participant, index));

  const lineItemList = Array.isArray(raw.line_items) ? raw.line_items : [];
  const normalizedLineItems = lineItemList.map((item, index) =>
    normalizeLineItem(item, index)
  );

  const participantIds = new Set(normalizedParticipants.map((p) => p.id));
  const itemIds = new Set(normalizedLineItems.map((item) => item.id));

  const splitLogicList = Array.isArray(raw.split_logic) ? raw.split_logic : [];
  const normalizedSplitLogic = splitLogicList
    .map((logic, index) =>
      normalizeSplitLogic(logic, index, itemIds, participantIds)
    )
    .filter(
      (logic): logic is SplitLogic =>
        Boolean(logic) && itemIds.has((logic as SplitLogic).item_id)
    );

  const uniqueSplitLogic = Array.from(
    normalizedSplitLogic.reduce((map, logic) => {
      map.set(logic.item_id, logic);
      return map;
    }, new Map<string, SplitLogic>())
  ).map(([, logic]) => logic);

  const meta = raw.meta || {};

  return {
    meta: {
      currency: isNonEmptyString(meta?.currency) ? meta.currency : "USD",
      notes: typeof meta?.notes === "string" ? meta.notes : "",
    },
    participants: normalizedParticipants,
    line_items: normalizedLineItems,
    split_logic: uniqueSplitLogic,
    modifiers: {
      tax: normalizeModifier(raw.modifiers?.tax, "receipt"),
      tip: normalizeModifier(raw.modifiers?.tip, "user_prompt"),
      fees: Array.isArray(raw.modifiers?.fees) ? raw.modifiers?.fees : [],
    },
  };
};


