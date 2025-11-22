import React from "react";
import { DollarSign } from "lucide-react";
import { BillData } from "../../../types";

interface ModifierSectionProps {
  modifiers: BillData["modifiers"];
  onUpdateModifier: (key: "tax" | "tip", field: string, value: string | number) => void;
}

export const ModifierSection: React.FC<ModifierSectionProps> = ({
  modifiers,
  onUpdateModifier,
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 space-y-4 mb-8">
      <h2 className="font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2 text-sm">
        <DollarSign className="w-4 h-4" /> Tax & Tip
      </h2>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[10px] font-medium text-gray-500 dark:text-gray-400 mb-1">
            Tax ($)
          </label>
          <input
            type="number"
            value={modifiers.tax.value}
            onChange={(e) =>
              onUpdateModifier("tax", "value", parseFloat(e.target.value) || 0)
            }
            className="w-full p-2 border dark:border-gray-600 rounded text-right font-mono text-base dark:bg-gray-700 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-[10px] font-medium text-gray-500 dark:text-gray-400 mb-1">
            Tip
          </label>
          <div className="flex">
            <select
              value={modifiers.tip.type}
              onChange={(e) => onUpdateModifier("tip", "type", e.target.value)}
              className="bg-gray-50 dark:bg-gray-700 border-y border-l dark:border-gray-600 rounded-l text-xs px-1 dark:text-white"
            >
              <option value="percentage">%</option>
              <option value="fixed">$</option>
            </select>
            <input
              type="number"
              value={modifiers.tip.value}
              onChange={(e) =>
                onUpdateModifier("tip", "value", parseFloat(e.target.value) || 0)
              }
              className="w-full p-2 border dark:border-gray-600 rounded-r text-right font-mono text-base dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
