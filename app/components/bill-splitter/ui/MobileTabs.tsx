import React from "react";
import { List, Receipt } from "lucide-react";
import { CalculatedTotals } from "../../../types";
import { UNASSIGNED_ID } from "../../../lib/constants";

interface MobileTabsProps {
  mobileTab: "editor" | "results";
  setMobileTab: (tab: "editor" | "results") => void;
  calculatedTotals: CalculatedTotals | null;
}

export const MobileTabs: React.FC<MobileTabsProps> = ({
  mobileTab,
  setMobileTab,
  calculatedTotals,
}) => {
  return (
    <div className="lg:hidden absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t dark:border-gray-700 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-30 pb-[env(safe-area-inset-bottom)]">
      <div className="flex h-16">
        <button
          onClick={() => setMobileTab("editor")}
          className={`flex-1 flex flex-col items-center justify-center gap-1 text-xs font-medium transition-colors ${
            mobileTab === "editor"
              ? "text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/20"
              : "text-gray-500 dark:text-gray-400"
          }`}
        >
          <List className="w-5 h-5" />
          Edit Split
        </button>
        <button
          onClick={() => setMobileTab("results")}
          className={`flex-1 flex flex-col items-center justify-center gap-1 text-xs font-medium transition-colors ${
            mobileTab === "results"
              ? "text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/20"
              : "text-gray-500 dark:text-gray-400"
          }`}
        >
          <div className="relative">
            <Receipt className="w-5 h-5" />
            {(calculatedTotals?.byUser?.[UNASSIGNED_ID]?.total ?? 0) > 0 && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-gray-800"></span>
            )}
          </div>
          Final Bill
        </button>
      </div>
    </div>
  );
};

