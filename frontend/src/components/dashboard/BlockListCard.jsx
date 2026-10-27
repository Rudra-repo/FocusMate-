import React, { useState } from 'react';
import { Plus, X as CloseIcon, ShieldCheck, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const BlockListCard = ({ blockedItems = [], onUpdateList }) => {
  const { updatePreferences } = useAuth();
  const [isAdding, setIsAdding] = useState(false);
  const [newItemName, setNewItemName] = useState('');

  const defaultItems = [
    { id: 'telegram', name: 'Telegram', category: 'Chat' },
    { id: 'instagram', name: 'Instagram', category: 'Social' },
    { id: 'x', name: 'X', category: 'Social' },
  ];

  const items = blockedItems && blockedItems.length > 0 ? blockedItems : defaultItems;

  const popularPresets = [
    { name: 'YouTube', category: 'Video' },
    { name: 'Reddit', category: 'Forum' },
    { name: 'Discord', category: 'Chat' },
    { name: 'Netflix', category: 'Video' },
    { name: 'TikTok', category: 'Social' },
  ];

  const handleRemove = async (idToRemove) => {
    const updated = items.filter((item) => (item.id || item._id) !== idToRemove);
    if (onUpdateList) onUpdateList(updated);
    await updatePreferences({ blockedItems: updated });
  };

  const handleAdd = async (nameToAdd) => {
    const name = (nameToAdd || newItemName).trim();
    if (!name) return;

    // Check if already blocked
    if (items.some((i) => i.name.toLowerCase() === name.toLowerCase())) {
      setIsAdding(false);
      return;
    }

    const newItem = {
      id: name.toLowerCase().replace(/\s+/g, '-'),
      name,
      category: 'Distraction',
    };

    const updated = [...items, newItem];
    if (onUpdateList) onUpdateList(updated);
    await updatePreferences({ blockedItems: updated });
    setNewItemName('');
    setIsAdding(false);
  };

  const renderAppIcon = (item) => {
    const key = (item.id || item.name || '').toLowerCase();

    if (key.includes('telegram')) {
      return (
        <div className="w-12 h-12 rounded-2xl bg-[#2AABEE] flex items-center justify-center text-white shadow-sm hover:scale-105 transition-transform">
          <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.75-.55 2.92-1.27 4.86-2.11 5.83-2.52 2.77-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .39z" />
          </svg>
        </div>
      );
    }

    if (key.includes('instagram')) {
      return (
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#F58529] via-[#DD2A7B] to-[#8134AF] flex items-center justify-center text-white shadow-sm hover:scale-105 transition-transform">
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
          </svg>
        </div>
      );
    }

    if (key.includes('x') || key.includes('twitter')) {
      return (
        <div className="w-12 h-12 rounded-2xl bg-black border border-gray-100 flex items-center justify-center text-white shadow-sm hover:scale-105 transition-transform">
          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
        </div>
      );
    }

    if (key.includes('youtube')) {
      return (
        <div className="w-12 h-12 rounded-2xl bg-[#FF0000] flex items-center justify-center text-white shadow-sm hover:scale-105 transition-transform">
          <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
          </svg>
        </div>
      );
    }

    return (
      <div className="w-12 h-12 rounded-2xl bg-peach-200 text-coral-dark font-bold text-sm flex items-center justify-center shadow-sm">
        {item.name.slice(0, 2).toUpperCase()}
      </div>
    );
  };

  return (
    <div className="bg-white/95 rounded-3xl p-5 shadow-soft-card border border-[#FFE2D3]/60 transition-all">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-sm md:text-base font-bold text-mainText font-display">
            Block List
          </h3>
          <span className="w-2 h-2 rounded-full bg-successGreen" title="Shield active"></span>
          <span className="text-[10px] text-mainText-muted font-medium hidden sm:inline">
            ({items.length} blocked)
          </span>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="w-7 h-7 rounded-full bg-[#EAFBF2] text-successGreen hover:bg-successGreen hover:text-white flex items-center justify-center transition-all shadow-sm"
          title="Add Blocked Site or App"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
        </button>
      </div>

      {/* Add New Distraction Input */}
      {isAdding && (
        <div className="mb-3.5 p-3 rounded-2xl bg-peach-50/80 border border-peach-200 animate-in fade-in duration-150">
          <form onSubmit={(e) => { e.preventDefault(); handleAdd(); }} className="flex items-center gap-2 mb-2">
            <input
              type="text"
              placeholder="e.g. Netflix, YouTube, Reddit, Discord..."
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              className="flex-1 text-xs px-3 py-1.5 rounded-xl border border-peach-300 focus:outline-none focus:border-coral bg-white"
              autoFocus
            />
            <button
              type="submit"
              className="text-xs px-3 py-1.5 rounded-xl bg-coral text-white font-semibold hover:bg-coral-dark shadow-sm"
            >
              Block
            </button>
          </form>

          {/* Preset 1-click pill additions */}
          <div className="flex items-center gap-1.5 flex-wrap pt-1">
            <span className="text-[10px] text-mainText-muted font-bold">Quick Add:</span>
            {popularPresets.map((p) => (
              <button
                key={p.name}
                type="button"
                onClick={() => handleAdd(p.name)}
                className="text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-white border border-peach-200 hover:border-coral text-mainText hover:text-coral transition-colors"
              >
                + {p.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* App Icons Row matching the reference image */}
      <div className="flex items-center gap-4 flex-wrap">
        {items.map((item) => (
          <div key={item.id || item._id} className="relative group">
            {renderAppIcon(item)}
            {/* Remove Cross Badge */}
            <button
              onClick={() => handleRemove(item.id || item._id)}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-white border border-gray-200 text-gray-500 hover:text-coral hover:border-coral shadow-sm flex items-center justify-center opacity-80 group-hover:opacity-100 transition-all"
              title={`Unblock ${item.name}`}
            >
              <CloseIcon className="w-3 h-3 stroke-[2.5]" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BlockListCard;
