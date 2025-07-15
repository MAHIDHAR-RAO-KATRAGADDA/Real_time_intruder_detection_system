import React from 'react';
import { IntruderEvent } from '../types';

interface HistoryLogProps {
  events: IntruderEvent[];
  onClearHistory: () => void;
}

const HistoryLog: React.FC<HistoryLogProps> = ({ events, onClearHistory }) => {
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">Detection History</h2>
        {events.length > 0 && (
          <button
            onClick={onClearHistory}
            className="text-xs px-2 py-1 bg-red-500 hover:bg-red-600 text-white rounded transition-colors"
          >
            Clear All
          </button>
        )}
      </div>

      {events.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <p>No intrusions detected yet</p>
          <p className="text-sm mt-2">Detection events will appear here</p>
        </div>
      ) : (
        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
          {events.map((event) => (
            <div 
              key={event.id} 
              className="bg-gray-700 rounded-lg overflow-hidden transition-transform hover:scale-[1.02] shadow-md"
            >
              <div className="relative">
                <img 
                  src={event.imageData} 
                  alt="Intruder detection" 
                  className="w-full h-40 object-cover"
                  loading="lazy"
                />
                <div className="absolute top-0 right-0 bg-red-500 text-white text-xs px-2 py-1 m-2 rounded">
                  Intruder
                </div>
              </div>
              <div className="p-3">
                <div className="text-gray-300 text-sm font-medium">
                  {formatDate(event.timestamp)}
                </div>
                <div className="text-gray-400 text-xs mt-1">
                  ID: {event.id.slice(0, 8)}...
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HistoryLog;