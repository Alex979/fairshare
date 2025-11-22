import React, { useRef } from "react";
import Image from "next/image";
import { Camera, Moon, Sun, PieChart, AlertCircle } from "lucide-react";

interface InputViewProps {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  image: string | null;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  promptText: string;
  setPromptText: (text: string) => void;
  error: string | null;
  processReceipt: () => void;
  handleLoadMock: () => void;
}

export const InputView: React.FC<InputViewProps> = ({
  isDarkMode,
  toggleDarkMode,
  image,
  handleImageUpload,
  promptText,
  setPromptText,
  error,
  processReceipt,
  handleLoadMock,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className={isDarkMode ? "dark" : ""}>
      <div className="min-h-[100dvh] bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 flex flex-col items-center justify-center p-4 pt-[calc(env(safe-area-inset-top)+1rem)] pb-[calc(env(safe-area-inset-bottom)+1rem)] font-sans text-gray-800 dark:text-gray-100 transition-colors duration-200">
        <button
          onClick={toggleDarkMode}
          className="hidden sm:block absolute top-6 right-6 p-2 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-colors text-gray-700 dark:text-white"
        >
          {isDarkMode ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
        </button>

        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden transition-colors duration-200">
          <div className="relative bg-blue-600 dark:bg-blue-700 p-6 text-center transition-colors duration-200">
            <button
              onClick={toggleDarkMode}
              className="sm:hidden absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors text-white"
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
              <PieChart className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">FairShare</h1>
            <p className="text-blue-100 text-sm">
              Snap a receipt, explain the split, done.
            </p>
          </div>

          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                1. Upload Receipt
              </label>
              <div
                className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl h-40 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-700/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-400 transition-colors cursor-pointer overflow-hidden relative"
                onClick={() => fileInputRef.current?.click()}
              >
                {image ? (
                  <Image
                    src={image}
                    alt="Receipt preview"
                    fill
                    sizes="(max-width: 640px) 100vw, 400px"
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <>
                    <Camera className="w-8 h-8 text-gray-400 dark:text-gray-500 mb-2" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Tap to upload photo
                    </p>
                  </>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                2. How are we splitting?
              </label>
              <textarea
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-3 text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white text-gray-800 placeholder-gray-500 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                rows={3}
                placeholder="e.g. 'Alice and Bob shared the apps. Alice had the burger. Add a 20% tip.'"
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
              ></textarea>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 p-3 rounded-lg text-sm flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                {error}
              </div>
            )}

            <button
              onClick={processReceipt}
              disabled={!image && !promptText}
              className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              Process Receipt{" "}
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            </button>

            <button
              onClick={handleLoadMock}
              className="w-full text-gray-400 dark:text-gray-500 text-xs font-medium hover:text-blue-600 dark:hover:text-blue-400 mt-2"
            >
              Use Example Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

