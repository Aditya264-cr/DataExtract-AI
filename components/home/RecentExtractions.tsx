
import React from 'react';
import { DocumentIcon } from '../icons/DocumentIcon';
import { ChevronRightIcon } from '../icons/ChevronRightIcon';
import { TrashIcon } from '../icons/TrashIcon';
import { Tooltip } from '../ui/Tooltip';

interface RecentExtractionsProps {
  history: any[];
  onSelectItem: (item: any) => void;
  onClearHistory: () => void;
}

export const RecentExtractions: React.FC<RecentExtractionsProps> = ({ history, onSelectItem, onClearHistory }) => {
  const getRelativeTime = (isoString: string) => {
    const now = new Date();
    const past = new Date(isoString);
    const diffInMs = now.getTime() - past.getTime();
    const diffInMins = Math.floor(diffInMs / (1000 * 60));
    if (diffInMins < 1) return 'Just now';
    if (diffInMins < 60) return `${diffInMins}m ago`;
    const diffInHours = Math.floor(diffInMins / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  return (
    <section className="w-full max-w-4xl mx-auto mt-8 mb-12 animate-slide-in" style={{ animationDelay: '0.4s' }}>
      <div className="flex items-end justify-between px-4 mb-6">
        <div>
            <h3 className="text-xl font-bold tracking-tight text-[#1d1d1f] dark:text-white font-display">
                Recent Activity
            </h3>
        </div>
        {history.length > 0 && (
            <Tooltip text="Delete all history">
                <button 
                    onClick={onClearHistory}
                    className="p-2 text-red-500 hover:bg-red-500/10 rounded-full transition-colors active:scale-95"
                    aria-label="Clear History"
                >
                    <TrashIcon className="w-4 h-4" />
                </button>
            </Tooltip>
        )}
      </div>

      <div className="space-y-3">
        {history.length === 0 ? (
          <div className="w-full py-16 flex flex-col items-center justify-center glass-card rounded-[2rem]">
            <div className="w-16 h-16 bg-white/50 dark:bg-white/5 rounded-2xl flex items-center justify-center mb-4 shadow-sm backdrop-blur-md">
              <DocumentIcon className="w-8 h-8 text-gray-400 dark:text-gray-500" />
            </div>
            <p className="font-bold text-[#1d1d1f] dark:text-gray-300">No extractions yet</p>
            <p className="text-sm text-[#86868b] dark:text-gray-400 mt-1">Your recent activity will appear here.</p>
          </div>
        ) : (
            history.map((item) => (
              <button
                key={item.id}
                onClick={() => onSelectItem(item)}
                className="w-full text-left p-3 pr-4 glass-card rounded-[1.25rem] flex items-center justify-between hover:bg-white/60 dark:hover:bg-white/10 hover:shadow-lg hover:scale-[1.01] transition-all duration-300 group"
              >
                <div className="flex items-center gap-4 overflow-hidden">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-md`}>
                    <DocumentIcon className="w-6 h-6" />
                  </div>
                  <div className="truncate flex-1 min-w-0">
                    <p className="font-bold text-[#1d1d1f] dark:text-white text-[15px] truncate tracking-tight">{item.fileNames.join(', ')}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] font-bold text-[#007AFF] dark:text-blue-300 uppercase tracking-wider">{item.docType}</span>
                      <span className="w-0.5 h-0.5 rounded-full bg-gray-400"></span>
                      <span className="text-[11px] text-[#86868b] dark:text-gray-400 font-medium">{getRelativeTime(item.timestamp)}