import { useState, useMemo, useEffect, useCallback } from "react";
import { BillData, LineItem } from "../../../types";
import { processReceiptAction } from "../../../actions";
import { 
  MOCK_DATA, 
  DEFAULT_NEW_PARTICIPANT_NAME, 
  DEFAULT_ITEM_DESCRIPTION, 
  DEFAULT_ITEM_CATEGORY, 
  DEFAULT_QUANTITY, 
  DEFAULT_PRICE,
  WEIGHT_INCREMENT,
  WEIGHT_INITIAL,
  WEIGHT_MIN
} from "../../../lib/constants";
import { calculateTotals } from "../../../lib/bill-utils";
import { compressImage } from "../../../lib/image-utils";
import { 
  isValidWeight, 
  isValidPrice, 
  isValidBillData,
  canDeleteParticipant,
  sanitizeParticipantName,
  sanitizeItemDescription
} from "../../../lib/validation";

export type Step = "input" | "processing" | "editor";

export function useBillSplitter() {
  const [step, setStep] = useState<Step>("input");
  const [image, setImage] = useState<string | null>(null);
  const [promptText, setPromptText] = useState("");
  const [data, setData] = useState<BillData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // --- DARK MODE INIT ---
  useEffect(() => {
    if (
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    ) {
      setIsDarkMode(true);
    }
  }, []);

  const toggleDarkMode = useCallback(() => setIsDarkMode(prev => !prev), []);

  // --- BODY BACKGROUND & OVERSCROLL SYNC ---
  useEffect(() => {
    return () => {
      document.body.style.overflow = "";
      document.body.style.overscrollBehaviorY = "";
      document.body.style.backgroundColor = "";
      document.documentElement.style.backgroundColor = "";
      document.documentElement.classList.remove("dark");
    };
  }, []);

  useEffect(() => {
    const body = document.body;
    const root = document.documentElement;

    // 1. Handle Dark Mode
    if (isDarkMode) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    // 2. Single fallback colors
    const defaultColor = isDarkMode ? "#111827" : "#f9fafb";

    // 3. Apply the fallback color
    body.style.backgroundColor = defaultColor;
    root.style.backgroundColor = defaultColor;

    // 4. Manage scroll locking
    if (step === "editor") {
      body.style.overflow = "hidden";
      body.style.overscrollBehaviorY = "none";
    } else {
      body.style.overflow = "auto";
      body.style.overscrollBehaviorY = "auto";
    }
  }, [step, isDarkMode]);

  // --- CALCULATED TOTALS ---
  const calculatedTotals = useMemo(() => calculateTotals(data), [data]);

  // --- HANDLERS ---
  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        // Compress image before setting state
        const compressedDataUrl = await compressImage(file);
        console.log(
          `Image compressed: ${Math.round(file.size / 1024)}KB -> ${Math.round(
            compressedDataUrl.length / 1024
          )}KB`
        );
        setImage(compressedDataUrl);
      } catch (err) {
        console.error("Failed to compress image:", err);
        // Fallback to original file if compression fails (though unlikely)
        const reader = new FileReader();
        reader.onload = (e) => setImage(e.target?.result as string);
        reader.readAsDataURL(file);
      }
    }
  }, []);

  const processReceipt = useCallback(async () => {
    if (!image && !promptText) return;
    setStep("processing");
    setError(null);

    try {
      const base64Data = image ? image.split(",")[1] : ""; 

      const parsedData = await processReceiptAction(base64Data, promptText) as BillData;

      // Validate the response structure
      if (!isValidBillData(parsedData)) {
        throw new Error("Invalid response structure from API");
      }

      // Ensure IDs exist and sanitize data
      parsedData.participants = parsedData.participants.map(
        (p, i) => ({ 
          ...p, 
          id: p.id || `p${i}`,
          name: sanitizeParticipantName(p.name)
        })
      );
      parsedData.line_items = parsedData.line_items.map(
        (item, i) => ({ 
          ...item, 
          id: item.id || `item${i}`,
          description: sanitizeItemDescription(item.description),
          total_price: Math.max(0, item.total_price || 0),
          unit_price: Math.max(0, item.unit_price || 0),
          quantity: Math.max(1, item.quantity || 1)
        })
      );

      setData(parsedData);
      setStep("editor");
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";
      setError("Failed to process. " + errorMessage);
      setStep("input");
    }
  }, [image, promptText]);

  const handleLoadMock = useCallback(() => {
    setData(MOCK_DATA);
    setStep("editor");
  }, []);

  const updateItemSplit = useCallback((
    itemId: string,
    participantId: string,
    newWeight: number
  ) => {
    // Validate weight
    if (!isValidWeight(newWeight)) {
      console.error("Invalid weight value:", newWeight);
      return;
    }

    setData((prev) => {
      if (!prev) return null;
      const newData = { ...prev };
      newData.split_logic = [...prev.split_logic];

      const logicIndex = newData.split_logic.findIndex(
        (l) => l.item_id === itemId
      );

      if (logicIndex === -1) {
        if (newWeight > 0) {
          newData.split_logic.push({
            item_id: itemId,
            method: "ratio",
            allocations: [{ participant_id: participantId, weight: newWeight }],
          });
        }
      } else {
        const logic = {
          ...newData.split_logic[logicIndex],
          allocations: [...newData.split_logic[logicIndex].allocations],
        };
        const allocIndex = logic.allocations.findIndex(
          (a) => a.participant_id === participantId
        );

        if (allocIndex > -1) {
          if (newWeight <= 0) logic.allocations.splice(allocIndex, 1);
          else
            logic.allocations[allocIndex] = {
              ...logic.allocations[allocIndex],
              weight: newWeight,
            };
        } else if (newWeight > 0) {
          logic.allocations.push({
            participant_id: participantId,
            weight: newWeight,
          });
        }
        newData.split_logic[logicIndex] = logic;
      }
      return newData;
    });
  }, []);

  const updateModifier = useCallback((key: "tax" | "tip", field: string, value: any) => {
    setData((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        modifiers: {
          ...prev.modifiers,
          [key]: { ...prev.modifiers[key], [field]: value },
        },
      };
    });
  }, []);

  const updateParticipantName = useCallback((id: string, name: string) => {
    const sanitizedName = sanitizeParticipantName(name);
    if (!sanitizedName) return;

    setData((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        participants: prev.participants.map((p) =>
          p.id === id ? { ...p, name: sanitizedName } : p
        ),
      };
    });
  }, []);

  const addParticipant = useCallback(() => {
    setData((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        participants: [
          ...prev.participants,
          { id: `p${Date.now()}`, name: DEFAULT_NEW_PARTICIPANT_NAME },
        ],
      };
    });
  }, []);

  const deleteParticipant = useCallback((id: string) => {
    setData((prev) => {
      if (!prev) return null;
      
      // Prevent deleting the last participant
      if (!canDeleteParticipant(prev, id)) {
        console.warn("Cannot delete the last participant");
        return prev;
      }

      return {
        ...prev,
        participants: prev.participants.filter((p) => p.id !== id),
        split_logic: prev.split_logic.map((logic) => ({
          ...logic,
          allocations: logic.allocations.filter((a) => a.participant_id !== id),
        })),
      };
    });
  }, []);

  const saveItem = useCallback((editingItem: Partial<LineItem>) => {
     if (!editingItem || !editingItem.description) return;

    const sanitizedDescription = sanitizeItemDescription(editingItem.description);
    if (!sanitizedDescription) return;

    const price = editingItem.total_price || DEFAULT_PRICE;
    if (!isValidPrice(price)) {
      console.error("Invalid price value:", price);
      return;
    }

    setData((prev) => {
      if (!prev) return null;
      const newItem: LineItem = {
        id: editingItem.id || `item-${Date.now()}`,
        description: sanitizedDescription,
        quantity: Math.max(DEFAULT_QUANTITY, editingItem.quantity || DEFAULT_QUANTITY),
        unit_price: price,
        total_price: price,
        category: editingItem.category || DEFAULT_ITEM_CATEGORY,
      };

      if (editingItem.id) {
        return {
          ...prev,
          line_items: prev.line_items.map((i) =>
            i.id === editingItem.id ? newItem : i
          ),
        };
      } else {
        return {
          ...prev,
          line_items: [...prev.line_items, newItem],
        };
      }
    });
  }, []);

  const deleteItem = useCallback((itemId: string) => {
     setData((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        line_items: prev.line_items.filter((i) => i.id !== itemId),
        split_logic: prev.split_logic.filter(
          (l) => l.item_id !== itemId
        ),
      };
    });
  }, []);

  return {
    step,
    setStep,
    image,
    promptText,
    setPromptText,
    data,
    error,
    isDarkMode,
    toggleDarkMode,
    calculatedTotals,
    handleImageUpload,
    processReceipt,
    handleLoadMock,
    updateItemSplit,
    updateModifier,
    updateParticipantName,
    addParticipant,
    deleteParticipant,
    saveItem,
    deleteItem,
  };
}

