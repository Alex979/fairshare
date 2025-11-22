import React from "react";
import { DollarSign, Plus, Trash2 } from "lucide-react";
import { AdditionalCharge } from "../../../types";

interface ModifierSectionProps {
  additionalCharges: AdditionalCharge[];
  onUpdateCharge: (chargeId: string, field: string, value: string | number) => void;
  onAddCharge: () => void;
  onDeleteCharge: (chargeId: string) => void;
}

export const ModifierSection: React.FC<ModifierSectionProps> = ({
  additionalCharges,
  onUpdateCharge,
  onAddCharge,
  onDeleteCharge,
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 space-y-4 mb-8">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2 text-sm">
          <DollarSign className="w-4 h-4" /> Additional Charges
        </h2>
        <button
          onClick={onAddCharge}
          className="text-xs bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-lg flex items-center gap-1 transition-colors"
          aria-label="Add charge"
        >
          <Plus className="w-3 h-3" />
          Add
        </button>
      </div>

      <div className="space-y-3">
        {additionalCharges.map((charge) => (
          <div
            key={charge.id}
            className="p-3 border dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700/30"
          >
            <div className="flex items-start gap-2 mb-2">
              <input
                type="text"
                value={charge.label}
                onChange={(e) => onUpdateCharge(charge.id, "label", e.target.value)}
                className="flex-1 p-1.5 border dark:border-gray-600 rounded text-sm font-medium dark:bg-gray-700 dark:text-white"
                placeholder="Charge name"
                aria-label={`${charge.label} name`}
              />
              <button
                onClick={() => onDeleteCharge(charge.id)}
                className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-1.5 transition-colors"
                aria-label={`Delete ${charge.label}`}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="flex gap-2">
              <select
                value={charge.type}
                onChange={(e) => onUpdateCharge(charge.id, "type", e.target.value)}
                className="bg-white dark:bg-gray-700 border dark:border-gray-600 rounded text-xs px-2 py-1.5 dark:text-white"
                aria-label={`${charge.label} type`}
              >
                <option value="percentage">%</option>
                <option value="fixed">$</option>
              </select>
              <input
                type="number"
                step={charge.type === 'percentage' ? '1' : '0.01'}
                min="0"
                value={charge.value}
                onChange={(e) => onUpdateCharge(charge.id, "value", parseFloat(e.target.value) || 0)}
                className="flex-1 p-1.5 border dark:border-gray-600 rounded text-right font-mono text-sm dark:bg-gray-700 dark:text-white"
                aria-label={`${charge.label} ${charge.type === 'percentage' ? 'percentage' : 'amount in dollars'}`}
              />
            </div>
          </div>
        ))}

        {additionalCharges.length === 0 && (
          <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-2">
            No additional charges. Click &ldquo;Add&rdquo; to create one.
          </p>
        )}
      </div>
    </div>
  );
};

