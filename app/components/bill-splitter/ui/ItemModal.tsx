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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'Enter' && e.metaKey) {
      onSave();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-xs p-6 space-y-4 border dark:border-gray-700"
        onKeyDown={handleKeyDown}
      >
        <div className="flex justify-between items-center">
          <h3 id="modal-title" className="text-lg font-bold text-gray-800 dark:text-white">
            {editingItem.id ? "Edit Item" : "Add Item"}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div>
          <label htmlFor="item-description" className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
            Description
          </label>
          <input
            id="item-description"
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
            aria-required="true"
          />
        </div>

        <div>
          <label htmlFor="item-unit-price" className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
            Unit Price ($)
          </label>
          <input
            id="item-unit-price"
            type="number"
            step="0.01"
            min="0"
            value={editingItem.unit_price}
            onChange={(e) => {
              const unitPrice = parseFloat(e.target.value) || 0;
              const quantity = editingItem.quantity || 1;
              setEditingItem({
                ...editingItem,
                unit_price: unitPrice,
                total_price: unitPrice * quantity,
              });
            }}
            className="w-full border dark:border-gray-600 rounded-lg p-2 text-base dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="0.00"
            aria-required="true"
          />
        </div>

        <div>
          <label htmlFor="item-quantity" className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
            Quantity
          </label>
          <input
            id="item-quantity"
            type="number"
            step="1"
            min="1"
            value={editingItem.quantity || 1}
            onChange={(e) => {
              const quantity = parseInt(e.target.value) || 1;
              const unitPrice = editingItem.unit_price || 0;
              setEditingItem({
                ...editingItem,
                quantity: quantity,
                total_price: unitPrice * quantity,
              });
            }}
            className="w-full border dark:border-gray-600 rounded-lg p-2 text-base dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="1"
            aria-required="true"
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

