import React from "react";
import { Users, X } from "lucide-react";
import { BillData } from "../../../types";

interface ParticipantsListProps {
  participants: BillData["participants"];
  onUpdateName: (id: string, name: string) => void;
  onAddParticipant: () => void;
  onDeleteParticipant: (id: string) => void;
}

export const ParticipantsList: React.FC<ParticipantsListProps> = ({
  participants,
  onUpdateName,
  onAddParticipant,
  onDeleteParticipant,
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 transition-colors duration-200">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
          <Users className="w-4 h-4" /> Participants
        </h2>
        <button
          onClick={onAddParticipant}
          className="text-blue-600 dark:text-blue-400 text-xs font-medium hover:bg-blue-50 dark:hover:bg-blue-900/30 px-2 py-1 rounded"
        >
          + Add Person
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {participants.map((p) => (
          <div
            key={p.id}
            className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700/50 border dark:border-gray-600 rounded-lg px-2 py-1.5"
          >
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-[10px] font-bold shadow-sm">
              {p.name.charAt(0)}
            </div>
            <input
              value={p.name}
              onChange={(e) => onUpdateName(p.id, e.target.value)}
              className="bg-transparent border-none text-base font-medium text-gray-700 dark:text-gray-200 focus:ring-0 w-20 p-0 placeholder-gray-400 outline-none"
            />
            <button
              onClick={() => onDeleteParticipant(p.id)}
              className="text-gray-400 hover:text-red-500 p-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              aria-label="Remove participant"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

