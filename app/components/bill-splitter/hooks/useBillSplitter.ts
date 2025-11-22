import { useState, useMemo } from "react";
import { BillData, LineItem, Participant } from "../../../types";
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

  // --- CALCULATED TOTALS ---
  const calculatedTotals = useMemo(() => calculateTotals(data), [data]);

  // --- HANDLERS ---
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressedDataUrl = await compressImage(file);
        console.log(
          `Image compressed: ${Math.round(file.size / 1024)}KB -> ${Math.round(
            compressedDataUrl.length / 1024
          )}KB`
        );
        setImage(compressedDataUrl);
      } catch (err) {
        console.error("Failed to compress image:", err);
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
      const base64Data = image ? image.split(",")[1] : ""; 

      const parsedData = await processReceiptAction(base64Data, promptText);

      // Ensure IDs exist (though Zod should catch this, this is safe for fallback/mock if needed)
      parsedData.participants = parsedData.participants.map(
        (p: Participant, i: number) => ({ ...p, id: p.id || `p${i}` })
      );
      parsedData.line_items = parsedData.line_items.map(
        (item: LineItem, i: number) => ({ ...item, id: item.id || `item${i}` })
      );

      setData(parsedData);
      setStep("editor");
    } catch (err: unknown) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : "Failed to process receipt";
      setError(errorMessage);
      setStep("input");
    }
  };

  const handleLoadMock = () => {
    // MOCK_DATA is typed as 'any' in constants usually, so we cast or it just works if structure matches
    // Assuming MOCK_DATA matches BillData structure
    setData(MOCK_DATA as unknown as BillData);
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
      // Deep copy logic arrays to avoid mutation
      newData.split_logic = prev.split_logic.map(l => ({...l, allocations: [...l.allocations]}));

      let logicIndex = newData.split_logic.findIndex(
        (l) => l.item_id === itemId
      );

      if (logicIndex === -1) {
        // Create new logic if it doesn't exist
        newData.split_logic.push({
          item_id: itemId,
          method: "ratio",
          allocations: [],
        });
        logicIndex = newData.split_logic.length - 1;
      }

      const logic = newData.split_logic[logicIndex];
      const allocIndex = logic.allocations.findIndex(
        (a) => a.participant_id === participantId
      );

      if (allocIndex > -1) {
        if (newWeight <= 0) {
            logic.allocations.splice(allocIndex, 1);
        } else {
            logic.allocations[allocIndex].weight = newWeight;
        }
      } else if (newWeight > 0) {
        logic.allocations.push({
          participant_id: participantId,
          weight: newWeight,
        });
      }
      
      return newData;
    });
  };

  const updateModifier = (key: "tax" | "tip", field: string, value: string | number) => {
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
        unit_price: editingItem.total_price || 0, // Fallback if unit_price missing
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
