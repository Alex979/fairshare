import React from "react";
import { X, Trash2 } from "lucide-react";
import { LineItem } from "../../../types";

interface ItemModalProps {
  isOpen: boolean;
  editingItem: Partial<LineItem> | null;
  onClose: () => void;
  onSave: () => void;
  onDelete: () => void;
  setEditingItem: (item: Partial<LineItem>) => void;
}

export const ItemModal: React.FC<ItemModalProps> = ({
  isOpen,
  editingItem,
  onClose,
  onSave,
  onDelete,
  setEditingItem,
}) => {
  if (!isOpen || !editingItem) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-xs p-6 space-y-4 border dark:border-gray-700">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white">
            {editingItem.id ? "Edit Item" : "Add Item"}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
            Description
          </label>
          <input
            value={editingItem.description}
            onChange={(e) =>
              setEditingItem({
                ...editingItem,
                description: e.target.value,
              })
            }
            className="w-full border dark:border-gray-600 rounded-lg p-2 text-base dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="Item name"
            autoFocus
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
            Price ($)
          </label>
          <input
            type="number"
            value={editingItem.total_price}
            onChange={(e) =>
              setEditingItem({
                ...editingItem,
                total_price: parseFloat(e.target.value) || 0,
              })
            }
            className="w-full border dark:border-gray-600 rounded-lg p-2 text-base dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="0.00"
          />
        </div>

        <div className="flex gap-2 pt-2">
          {editingItem.id && (
            <button
              onClick={onDelete}
              className="flex-1 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 font-medium py-2 rounded-lg text-sm flex items-center justify-center gap-1"
            >
              <Trash2 className="w-4 h-4" /> Delete
            </button>
          )}
          <button
            onClick={onSave}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg text-sm shadow-lg shadow-blue-200 dark:shadow-none"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

