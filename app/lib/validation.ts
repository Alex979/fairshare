import { BillData, LineItem, Participant } from "../types";

/**
 * Validates that a weight value is valid (non-negative finite number)
 */
export const isValidWeight = (weight: number): boolean => {
  return typeof weight === 'number' && 
         isFinite(weight) && 
         weight >= 0;
};

/**
 * Validates that a price value is valid (non-negative finite number)
 */
export const isValidPrice = (price: number): boolean => {
  return typeof price === 'number' && 
         isFinite(price) && 
         price >= 0;
};

/**
 * Validates that a participant name is valid
 */
export const isValidParticipantName = (name: string): boolean => {
  return typeof name === 'string' && 
         name.trim().length > 0 &&
         name.length <= 50;
};

/**
 * Validates that an item description is valid
 */
export const isValidItemDescription = (description: string): boolean => {
  return typeof description === 'string' && 
         description.trim().length > 0 &&
         description.length <= 200;
};

/**
 * Validates that bill data has the minimum required structure
 */
export const isValidBillData = (data: unknown): data is BillData => {
  if (!data || typeof data !== 'object') return false;

  const billData = data as Partial<BillData>;

  return (
    Array.isArray(billData.participants) &&
    Array.isArray(billData.line_items) &&
    Array.isArray(billData.split_logic) &&
    Array.isArray(billData.additional_charges) &&
    billData.meta !== undefined
  );
};

/**
 * Checks if all line items are assigned to at least one participant
 */
export const getAllUnassignedItems = (data: BillData): LineItem[] => {
  return data.line_items.filter((item) => {
    const logic = data.split_logic.find((l) => l.item_id === item.id);
    return !logic || logic.allocations.length === 0;
  });
};

/**
 * Validates that participant can be safely deleted (not sole participant)
 */
export const canDeleteParticipant = (data: BillData, participantId: string): boolean => {
  return data.participants.length > 1;
};

/**
 * Sanitizes a participant name
 */
export const sanitizeParticipantName = (name: string): string => {
  return name.trim().slice(0, 50);
};

/**
 * Sanitizes an item description
 */
export const sanitizeItemDescription = (description: string): string => {
  return description.trim().slice(0, 200);
};

/**
 * Validates environment variables are set
 */
export const validateEnvironment = (): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  // Check for required environment variables on the server side only
  if (typeof window === 'undefined') {
    if (!process.env.OPENROUTER_API_KEY) {
      errors.push('OPENROUTER_API_KEY environment variable is not set');
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
};

