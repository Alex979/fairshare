import React from "react";
import { ExternalLink, ChevronDown } from "lucide-react";
import { CalculatedTotals } from "../../../types";
import { formatMoney, generateVenmoLink } from "../../../lib/bill-utils";

interface ResultsPanelProps {
  calculatedTotals: CalculatedTotals | null;
  mobileTab: "editor" | "results";
}

export const ResultsPanel: React.FC<ResultsPanelProps> = ({
  calculatedTotals,
  mobileTab,
}) => {
  return (
    <div
      className={`lg:w-96 bg-white dark:bg-gray-800 shadow-xl flex-col h-full z-20 ${
        mobileTab === "results" ? "flex w-full" : "hidden lg:flex"
      }`}
    >
      <div className="p-4 bg-gray-900 dark:bg-black text-white shrink-0">
        <h2 className="text-lg font-bold mb-1">Final Breakdown</h2>
        <p className="text-gray-400 text-xs">Request money via Venmo</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24 lg:pb-4">
        {Object.values(calculatedTotals?.byUser || {})
          .filter((u) => u.name !== "Unassigned" || u.total > 0)
          .map((user, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-xl border ${
                user.name === "Unassigned"
                  ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                  : "bg-gray-50 dark:bg-gray-700/30 border-gray-200 dark:border-gray-700"
              }`}
            >
              <div className="flex justify-between items-center mb-3">
                <h3
                  className={`font-bold text-base truncate max-w-[120px] ${
                    user.name === "Unassigned"
                      ? "text-red-600 dark:text-red-400"
                      : "text-gray-800 dark:text-white"
                  }`}
                >
                  {user.name}
                </h3>
                <span className="font-bold text-xl text-gray-900 dark:text-white">
                  {formatMoney(user.total)}
                </span>
              </div>

              {/* Venmo Button */}
              {user.name !== "Unassigned" && (
                <a
                  href={generateVenmoLink(user)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mb-4 w-full bg-[#008CFF] hover:bg-[#0077D9] text-white py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors font-bold text-sm"
                >
                  <span className="uppercase tracking-wide">Request</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}

              <div className="space-y-1 text-xs text-gray-500 dark:text-gray-400">
                <div className="flex justify-between">
                  <span>Base</span>
                  <span>{formatMoney(user.base_amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax</span>
                  <span>{formatMoney(user.tax_share)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tip</span>
                  <span>{formatMoney(user.tip_share)}</span>
                </div>
              </div>

              {user.items.length > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                  <button
                    className="text-[10px] text-gray-400 font-bold uppercase mb-1 w-full text-left flex justify-between items-center hover:text-gray-600 dark:hover:text-gray-300"
                    onClick={(e) => {
                      const list = e.currentTarget.nextSibling as HTMLElement;
                      if (list) list.classList.toggle("hidden");
                    }}
                  >
                    <span>{user.items.length} Items</span>
                    <ChevronDown className="w-3 h-3" />
                  </button>
                  <ul className="space-y-1 hidden">
                    {user.items.map((item, i) => (
                      <li
                        key={i}
                        className="text-[10px] flex justify-between text-gray-600 dark:text-gray-400"
                      >
                        <span className="truncate pr-2">
                          {item.description}
                        </span>
                        <span className="whitespace-nowrap">
                          {formatMoney(item.total_price * item.share)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
      </div>

      {/* Grand Total Footer */}
      <div className="p-4 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800 shrink-0 mb-16 lg:mb-0">
        <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400 mb-1">
          <span>Subtotal</span>
          <span>{formatMoney(calculatedTotals?.subtotal || 0)}</span>
        </div>
        <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400 mb-1">
          <span>Tax + Tip</span>
          <span>
            {formatMoney(
              (calculatedTotals?.totalTax || 0) +
                (calculatedTotals?.totalTip || 0)
            )}
          </span>
        </div>
        <div className="flex justify-between items-center text-xl font-bold text-gray-900 dark:text-white mt-2">
          <span>Total</span>
          <span>{formatMoney(calculatedTotals?.grandTotal || 0)}</span>
        </div>
      </div>
    </div>
  );
};

