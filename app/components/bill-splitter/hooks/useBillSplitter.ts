import { useState, useMemo, useEffect } from "react";
import {
  BillData,
  LineItem,
  Modifier,
  ModifierField,
  ModifierKey,
} from "../../../types";
import { processReceiptAction } from "../../../actions";
import { MOCK_DATA } from "../../../lib/constants";
import { calculateTotals } from "../../../lib/bill-utils";
import { compressImage } from "../../../lib/image-utils";

export type Step = "input" | "processing" | "editor";

export function useBillSplitter() {
  const [step, setStep] = useState<Step>("input");
  const [image, setImage] = useState<string | null>(null);
  const [promptText, setPromptText] = useState("");
  const [data, setData] = useState<BillData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

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
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
  };

  const processReceipt = async () => {
    if (!image && !promptText) return;
    setStep("processing");
    setError(null);

    try {
      const base64Data = image ? image.split(",")[1] ?? null : null;
      const parsedData = await processReceiptAction(
        base64Data,
        promptText.trim()
      );

      // Ensure IDs exist
      parsedData.participants = parsedData.participants.map((participant, i) => ({
        ...participant,
        id: participant.id || `p${i}`,
      }));
      parsedData.line_items = parsedData.line_items.map((item, i) => ({
        ...item,
        id: item.id || `item${i}`,
      }));

      setData(parsedData);
      setStep("editor");
    } catch (err: unknown) {
      console.error(err);
      const message =
        err instanceof Error ? err.message : "Something went wrong.";
      setError("Failed to process. " + message);
      setStep("input");
    }
  };

  const handleLoadMock = () => {
    const mockCopy =
      typeof structuredClone === "function"
        ? structuredClone(MOCK_DATA)
        : JSON.parse(JSON.stringify(MOCK_DATA));
    setData(mockCopy);
    setStep("editor");
  };

  const updateItemSplit = (
    itemId: string,
    participantId: string,
    newWeight: number
  ) => {
    setData((prev) => {
      if (!prev) return null;
      const newData = { ...prev };
      newData.split_logic = [...prev.split_logic];

      const logicIndex = newData.split_logic.findIndex(
        (l) => l.item_id === itemId
      );

      if (logicIndex === -1) {
        newData.split_logic.push({
          item_id: itemId,
          method: "ratio",
          allocations: [{ participant_id: participantId, weight: newWeight }],
        });
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
  };

  const coerceModifierValue = (
    field: ModifierField,
    value: number | Modifier["type"]
  ) => {
    if (field === "value") {
      return typeof value === "number" ? value : Number(value) || 0;
    }
    return value === "percentage" ? "percentage" : "fixed";
  };

  const updateModifier = (
    key: ModifierKey,
    field: ModifierField,
    value: number | Modifier["type"]
  ) => {
    setData((prev) => {
      if (!prev) return null;
      const nextValue = coerceModifierValue(field, value);
      return {
        ...prev,
        modifiers: {
          ...prev.modifiers,
          [key]: { ...prev.modifiers[key], [field]: nextValue },
        },
      };
    });
  };

  const updateParticipantName = (id: string, name: string) => {
    setData((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        participants: prev.participants.map((p) =>
          p.id === id ? { ...p, name } : p
        ),
      };
    });
  };

  const addParticipant = () => {
    setData((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        participants: [
          ...prev.participants,
          { id: `p${Date.now()}`, name: "New Person" },
        ],
      };
    });
  };

  const deleteParticipant = (id: string) => {
    setData((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        participants: prev.participants.filter((p) => p.id !== id),
        split_logic: prev.split_logic.map((logic) => ({
          ...logic,
          allocations: logic.allocations.filter((a) => a.participant_id !== id),
        })),
      };
    });
  };

  const saveItem = (editingItem: Partial<LineItem>) => {
     if (!editingItem || !editingItem.description) return;

    setData((prev) => {
      if (!prev) return null;
      const newItem: LineItem = {
        id: editingItem.id || `item-${Date.now()}`,
        description: editingItem.description || "Item",
        quantity: editingItem.quantity || 1,
        unit_price: editingItem.total_price || 0,
        total_price: editingItem.total_price || 0,
        category: editingItem.category || "custom",
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
  }

  const deleteItem = (itemId: string) => {
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
  }

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

