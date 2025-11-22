import React from "react";
import { Calculator, Sun, Moon, RefreshCw } from "lucide-react";

interface HeaderProps {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  onStartOver: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  isDarkMode,
  toggleDarkMode,
  onStartOver,
}) => {
  return (
    <header className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 px-4 pb-3 pt-[calc(env(safe-area-inset-top)+0.75rem)] flex justify-between items-center shadow-sm z-20 shrink-0">
      <div className="flex items-center gap-2">
        <div className="bg-blue-600 p-1.5 rounded-lg">
          <Calculator className="w-4 h-4 text-white" />
        </div>
        <h1 className="text-lg font-bold text-gray-800 dark:text-white">
          FairShare
        </h1>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={toggleDarkMode}
          className="text-gray-500 dark:text-gray-400 hover:text-blue-600"
        >
          {isDarkMode ? (
            <Sun className="w-5 h-5" />
          ) : (
            <Moon className="w-5 h-5" />
          )}
        </button>
        <button
          onClick={onStartOver}
          className="text-xs text-gray-500 dark:text-gray-400 hover:text-blue-600 flex items-center gap-1"
        >
          <RefreshCw className="w-3 h-3" /> Start Over
        </button>
      </div>
    </header>
  );
};

