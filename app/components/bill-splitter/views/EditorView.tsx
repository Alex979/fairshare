import React, { useState } from "react";
import { BillData, LineItem, CalculatedTotals } from "../../../types";
import { Header } from "../ui/Header";
import { ParticipantsList } from "../ui/ParticipantsList";
import { LineItemsList } from "../ui/LineItemsList";
import { ModifierSection } from "../ui/ModifierSection";
import { ResultsPanel } from "../ui/ResultsPanel";
import { MobileTabs } from "../ui/MobileTabs";
import { ItemModal } from "../ui/ItemModal";

interface EditorViewProps {
  data: BillData;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  onStartOver: () => void;
  calculatedTotals: CalculatedTotals | null;
  onUpdateParticipantName: (id: string, name: string) => void;
  onAddParticipant: () => void;
  onDeleteParticipant: (id: string) => void;
  onUpdateSplit: (itemId: string, participantId: string, weight: number) => void;
  onUpdateModifier: (key: "tax" | "tip", field: string, value: any) => void;
  onSaveItem: (item: Partial<LineItem>) => void;
  onDeleteItem: (itemId: string) => void;
}

export const EditorView: React.FC<EditorViewProps> = ({
  data,
  isDarkMode,
  toggleDarkMode,
  onStartOver,
  calculatedTotals,
  onUpdateParticipantName,
  onAddParticipant,
  onDeleteParticipant,
  onUpdateSplit,
  onUpdateModifier,
  onSaveItem,
  onDeleteItem,
}) => {
  const [mobileTab, setMobileTab] = useState<"editor" | "results">("editor");
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<Partial<LineItem> | null>(null);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);

  const openAddModal = () => {
    setEditingItem({
      description: "",
      total_price: 0,
      quantity: 1,
      category: "custom",
    });
    setIsItemModalOpen(true);
  };

  const openEditModal = (item: LineItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingItem({ ...item });
    setIsItemModalOpen(true);
  };

  const handleSaveItem = () => {
    if (editingItem) {
      onSaveItem(editingItem);
      setIsItemModalOpen(false);
      setEditingItem(null);
    }
  };

  const handleDeleteItem = () => {
    if (editingItem?.id) {
      onDeleteItem(editingItem.id);
      setIsItemModalOpen(false);
      setEditingItem(null);
    }
  };

  return (
    <div className={isDarkMode ? "dark" : ""}>
      <div className="fixed inset-0 w-full h-[100dvh] flex flex-col bg-gray-100 dark:bg-gray-900 overflow-hidden font-sans transition-colors duration-200">
        <Header
          isDarkMode={isDarkMode}
          toggleDarkMode={toggleDarkMode}
          onStartOver={onStartOver}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex overflow-hidden relative">
          {/* LEFT PANEL: EDITOR */}
          <div
            className={`flex-1 flex flex-col bg-gray-100 dark:bg-gray-900 h-full overflow-hidden ${
              mobileTab === "results" ? "hidden lg:flex" : "flex"
            }`}
          >
            <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-24 lg:pb-4">
              <ParticipantsList
                participants={data.participants}
                onUpdateName={onUpdateParticipantName}
                onAddParticipant={onAddParticipant}
                onDeleteParticipant={onDeleteParticipant}
              />

              <LineItemsList
                data={data}
                activeItemId={activeItemId}
                setActiveItemId={setActiveItemId}
                onOpenAddModal={openAddModal}
                onOpenEditModal={openEditModal}
                onUpdateSplit={onUpdateSplit}
              />

              <ModifierSection
                modifiers={data.modifiers}
                onUpdateModifier={onUpdateModifier}
              />
            </div>
          </div>

          {/* RIGHT PANEL: RESULTS */}
          <ResultsPanel
            calculatedTotals={calculatedTotals}
            mobileTab={mobileTab}
          />

          <MobileTabs
            mobileTab={mobileTab}
            setMobileTab={setMobileTab}
            calculatedTotals={calculatedTotals}
          />
        </div>
      </div>

      <ItemModal
        isOpen={isItemModalOpen}
        editingItem={editingItem}
        onClose={() => setIsItemModalOpen(false)}
        onSave={handleSaveItem}
        onDelete={handleDeleteItem}
        setEditingItem={setEditingItem}
      />
    </div>
  );
};

