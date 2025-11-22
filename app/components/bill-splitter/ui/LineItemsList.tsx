import React from "react";
import { Plus, Pencil, ChevronUp, ChevronDown } from "lucide-react";
import { BillData, LineItem } from "../../../types";
import { formatMoney } from "../../../lib/bill-utils";

interface LineItemsListProps {
  data: BillData;
  activeItemId: string | null;
  setActiveItemId: (id: string | null) => void;
  onOpenAddModal: () => void;
  onOpenEditModal: (item: LineItem, e: React.MouseEvent) => void;
  onUpdateSplit: (itemId: string, participantId: string, weight: number) => void;
}

export const LineItemsList: React.FC<LineItemsListProps> = ({
  data,
  activeItemId,
  setActiveItemId,
  onOpenAddModal,
  onOpenEditModal,
  onUpdateSplit,
}) => {
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center ml-1">
        <h2 className="font-semibold text-gray-700 dark:text-gray-200 text-sm">
          Line Items
        </h2>
        <button
          onClick={onOpenAddModal}
          className="text-blue-600 dark:text-blue-400 text-xs font-medium hover:bg-blue-50 dark:hover:bg-blue-900/30 px-2 py-1 rounded flex items-center gap-1"
        >
          <Plus className="w-3 h-3" /> Add Item
        </button>
      </div>
      {data.line_items.map((item) => {
        const logic = data.split_logic.find((l) => l.item_id === item.id);
        const isExpanded = activeItemId === item.id;
        return (
          <div
            key={item.id}
            className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border transition-all ${
              isExpanded
                ? "ring-2 ring-blue-500 border-transparent"
                : "border-gray-200 dark:border-gray-700"
            }`}
          >
            <div
              className="p-4 cursor-pointer flex justify-between items-center"
              onClick={() => setActiveItemId(isExpanded ? null : item.id)}
            >
              <div className="flex-1">
                <div className="flex justify-between mb-1">
                  <span className="font-medium text-gray-800 dark:text-gray-200 text-sm">
                    {item.description}
                  </span>
                  <span className="font-bold text-gray-900 dark:text-white text-sm">
                    {formatMoney(item.total_price)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {logic && logic.allocations.length > 0 ? (
                    <div className="flex -space-x-1.5">
                      {logic.allocations.map((a) => {
                        const person = data.participants.find(
                          (p) => p.id === a.participant_id
                        );
                        return person ? (
                          <div
                            key={a.participant_id}
                            className="w-5 h-5 rounded-full bg-gray-100 dark:bg-gray-600 border border-white dark:border-gray-700 flex items-center justify-center text-[9px] font-bold text-gray-600 dark:text-gray-200"
                          >
                            {person.name.charAt(0)}
                          </div>
                        ) : null;
                      })}
                    </div>
                  ) : (
                    <span className="text-[10px] text-red-500 dark:text-red-400 font-medium bg-red-50 dark:bg-red-900/30 px-1.5 py-0.5 rounded">
                      Unassigned
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => onOpenEditModal(item, e)}
                  className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <Pencil className="w-3 h-3" />
                </button>
                {isExpanded ? (
                  <ChevronUp className="text-gray-400 w-4 h-4" />
                ) : (
                  <ChevronDown className="text-gray-400 w-4 h-4" />
                )}
              </div>
            </div>

            {isExpanded && (
              <div className="border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30 p-4 rounded-b-xl">
                <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider mb-3">
                  Assign Shares
                </p>
                <div className="grid grid-cols-1 gap-2">
                  {data.participants.map((p) => {
                    const alloc = logic?.allocations.find(
                      (a) => a.participant_id === p.id
                    );
                    const weight = alloc ? alloc.weight : 0;

                    return (
                      <div
                        key={p.id}
                        className={`flex items-center justify-between p-2 rounded border ${
                          weight > 0
                            ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
                            : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-[10px] font-bold text-gray-600 dark:text-gray-200">
                            {p.name.charAt(0)}
                          </div>
                          <span
                            className={`text-sm ${
                              weight > 0
                                ? "text-blue-800 dark:text-blue-300 font-medium"
                                : "text-gray-500 dark:text-gray-400"
                            }`}
                          >
                            {p.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            className="w-6 h-6 rounded hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700"
                            onClick={() =>
                              onUpdateSplit(
                                item.id,
                                p.id,
                                Math.max(0, weight - 0.5)
                              )
                            }
                          >
                            -
                          </button>
                          <span className="w-6 text-center font-mono text-sm font-bold dark:text-gray-200">
                            {weight}
                          </span>
                          <button
                            className="w-6 h-6 rounded hover:bg-blue-200 dark:hover:bg-blue-800 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 flex items-center justify-center"
                            onClick={() =>
                              onUpdateSplit(
                                item.id,
                                p.id,
                                weight + (weight === 0 ? 1 : 0.5)
                              )
                            }
                          >
                            +
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
