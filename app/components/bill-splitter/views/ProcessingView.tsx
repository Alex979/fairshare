import React from "react";

interface ProcessingViewProps {
  isDarkMode: boolean;
}

export const ProcessingView: React.FC<ProcessingViewProps> = ({ isDarkMode }) => {
  return (
    <div className={isDarkMode ? "dark" : ""}>
      <div className="min-h-[100dvh] bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-6 transition-colors duration-200">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mb-4"></div>
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
          Reading receipt...
        </h2>
      </div>
    </div>
  );
};

