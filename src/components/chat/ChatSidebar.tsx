import React, { useState } from 'react';
import { ChatSession } from '../../types';
import {
  Plus,
  MessageSquare,
  Trash2,
  Edit2,
  Check,
  X,
  Moon,
  Sun,
  Volume2,
  VolumeX,
  Code2,
  Download,
  Search,
  Sparkles,
  PanelLeftClose,
  PanelLeft,
} from 'lucide-react';

interface ChatSidebarProps {
  sessions: ChatSession[];
  activeSessionId: string;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
  onDeleteSession: (id: string) => void;
  onRenameSession: (id: string, newTitle: string) => void;
  onClearAllSessions: () => void;
  onExportSession: () => void;
  onOpenSetupModal: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  isOpen: boolean;
  onToggleOpen: () => void;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewSession,
  onDeleteSession,
  onRenameSession,
  onClearAllSessions,
  onExportSession,
  onOpenSetupModal,
  isDark,
  onToggleTheme,
  soundEnabled,
  onToggleSound,
  isOpen,
  onToggleOpen,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const filteredSessions = sessions.filter((s) =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const startEditing = (s: ChatSession, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(s.id);
    setEditTitle(s.title);
  };

  const saveEditing = (id: string, e: React.MouseEvent | React.FormEvent) => {
    e.stopPropagation();
    if (editTitle.trim()) {
      onRenameSession(id, editTitle.trim());
    }
    setEditingId(null);
  };

  const cancelEditing = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onToggleOpen}
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs md:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 w-72 flex flex-col border-r transition-transform duration-300 ease-in-out shrink-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } ${
          isDark
            ? 'bg-slate-950 border-slate-800/80 text-slate-200'
            : 'bg-white border-slate-200 text-slate-800'
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight">AeroPulse AI</h2>
              <p className="text-[10px] text-slate-500 font-mono">Conversational v2.0</p>
            </div>
          </div>

          <button
            onClick={onToggleOpen}
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <PanelLeftClose className="w-5 h-5" />
          </button>
        </div>

        {/* Action: New Chat */}
        <div className="p-3">
          <button
            onClick={onNewSession}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Conversation</span>
          </button>
        </div>

        {/* Search Chats */}
        {sessions.length > 2 && (
          <div className="px-3 pb-2">
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs ${
                isDark
                  ? 'bg-slate-900 border-slate-800 text-slate-300'
                  : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}
            >
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search history..."
                className="w-full bg-transparent focus:outline-hidden text-xs"
              />
            </div>
          </div>
        )}

        {/* Chat Sessions List */}
        <div className="flex-1 overflow-y-auto px-2 space-y-1 py-1">
          <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Sessions History ({sessions.length})
          </div>

          {filteredSessions.map((session) => {
            const isActive = session.id === activeSessionId;
            const isEditing = editingId === session.id;

            return (
              <div
                key={session.id}
                onClick={() => onSelectSession(session.id)}
                className={`group relative flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all cursor-pointer ${
                  isActive
                    ? isDark
                      ? 'bg-sky-950/40 text-sky-300 border border-sky-800/80 font-semibold'
                      : 'bg-sky-50 text-sky-900 border border-sky-200 font-semibold'
                    : isDark
                    ? 'hover:bg-slate-900 text-slate-400 hover:text-slate-200'
                    : 'hover:bg-slate-100 text-slate-600 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
                  <MessageSquare
                    className={`w-3.5 h-3.5 shrink-0 ${
                      isActive ? 'text-sky-500' : 'text-slate-400'
                    }`}
                  />

                  {isEditing ? (
                    <form
                      onSubmit={(e) => saveEditing(session.id, e)}
                      className="flex items-center gap-1 flex-1 min-w-0"
                    >
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        autoFocus
                        className="w-full bg-slate-800 text-slate-100 px-1.5 py-0.5 rounded text-xs focus:outline-hidden"
                      />
                      <button
                        type="button"
                        onClick={(e) => saveEditing(session.id, e)}
                        className="p-1 hover:text-emerald-400"
                      >
                        <Check className="w-3 h-3 text-emerald-500" />
                      </button>
                      <button
                        type="button"
                        onClick={cancelEditing}
                        className="p-1 hover:text-rose-400"
                      >
                        <X className="w-3 h-3 text-rose-500" />
                      </button>
                    </form>
                  ) : (
                    <span className="truncate text-xs">{session.title}</span>
                  )}
                </div>

                {!isEditing && (
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                    <button
                      onClick={(e) => startEditing(session, e)}
                      title="Rename"
                      className="p-1 text-slate-400 hover:text-slate-200"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    {sessions.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteSession(session.id);
                        }}
                        title="Delete chat"
                        className="p-1 text-slate-400 hover:text-rose-400"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer Settings & Utilities */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 space-y-1">
          {/* Deliverables / Setup Modal Trigger */}
          <button
            onClick={onOpenSetupModal}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors ${
              isDark
                ? 'hover:bg-slate-900 text-slate-300'
                : 'hover:bg-slate-100 text-slate-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <Code2 className="w-3.5 h-3.5 text-sky-500" />
              <span>Local Code & Setup (Python/Node)</span>
            </div>
            <span className="px-1.5 py-0.5 rounded text-[10px] bg-sky-500/10 text-sky-500 font-mono font-bold">
              Docs
            </span>
          </button>

          {/* Export Chat */}
          <button
            onClick={onExportSession}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs transition-colors ${
              isDark
                ? 'hover:bg-slate-900 text-slate-300'
                : 'hover:bg-slate-100 text-slate-700'
            }`}
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>Export Active Chat (.md)</span>
          </button>

          {/* Theme & Sound Toggles */}
          <div className="pt-2 flex items-center justify-between px-2 text-xs">
            <button
              onClick={onToggleTheme}
              title="Toggle Theme"
              className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            >
              {isDark ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-[11px]">Light Mode</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-indigo-500" />
                  <span className="text-[11px]">Dark Mode</span>
                </>
              )}
            </button>

            <button
              onClick={onToggleSound}
              title={soundEnabled ? 'Mute Sound FX' : 'Enable Sound FX'}
              className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            >
              {soundEnabled ? (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-[11px]">Audio On</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-[11px]">Audio Muted</span>
                </>
              )}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
