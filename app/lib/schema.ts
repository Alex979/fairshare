import { z } from "zod";

export const MetaSchema = z.object({
  currency: z.string().default("USD"),
  notes: z.string().optional().default(""),
});

export const ParticipantSchema = z.object({
  id: z.string(),
  name: z.string(),
});

export const LineItemSchema = z.object({
  id: z.string(),
  description: z.string(),
  quantity: z.number(),
  unit_price: z.number(),
  total_price: z.number(),
  category: z.string().optional().default("custom"),
});

export const AllocationSchema = z.object({
  participant_id: z.string(),
  weight: z.number(),
});

export const SplitLogicSchema = z.object({
  item_id: z.string(),
  method: z.enum(["explicit", "equal", "ratio"]),
  allocations: z.array(AllocationSchema),
});

export const ModifierSchema = z.object({
  source: z.enum(["receipt", "user_prompt", "user"]),
  type: z.enum(["fixed", "percentage"]),
  value: z.number(),
});

export const ModifiersSchema = z.object({
  tax: ModifierSchema,
  tip: ModifierSchema,
  fees: z.array(ModifierSchema).default([]),
});

export const BillDataSchema = z.object({
  meta: MetaSchema,
  participants: z.array(ParticipantSchema),
  line_items: z.array(LineItemSchema),
  split_logic: z.array(SplitLogicSchema),
  modifiers: ModifiersSchema,
});

export type Meta = z.infer<typeof MetaSchema>;
export type Participant = z.infer<typeof ParticipantSchema>;
export type LineItem = z.infer<typeof LineItemSchema>;
export type SplitAllocation = z.infer<typeof AllocationSchema>;
export type SplitLogic = z.infer<typeof SplitLogicSchema>;
export type Modifier = z.infer<typeof ModifierSchema>;
export type Modifiers = z.infer<typeof ModifiersSchema>;
export type BillData = z.infer<typeof BillDataSchema>;

