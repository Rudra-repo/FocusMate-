import React, { useState, useEffect } from 'react';
import {
  X,
  FileText,
  Folder,
  Image,
  ExternalLink,
  Plus,
  Trash2,
  Save,
  Check,
  Eye,
  BookOpen,
  ChevronDown,
  Layers,
  Sparkles,
} from 'lucide-react';
import api from '../../services/api';

export const FocusNotesDrawer = ({
  isOpen,
  onClose,
  initialTopicId = null,
  subjectId = null,
  subjectName = '',
  timeFormatted = '25:00',
  onOpenStudyResource = () => {},
}) => {
  const [topics, setTopics] = useState([]);
  const [selectedTopicId, setSelectedTopicId] = useState(initialTopicId || '');
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [activeTab, setActiveTab] = useState('notes'); // 'notes' | 'materials'
  const [notesText, setNotesText] = useState('');
  const [resources, setResources] = useState([]);
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [notesSavedToast, setNotesSavedToast] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  // New resource form state
  const [isAddingResource, setIsAddingResource] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newType, setNewType] = useState('drive');
  const [loading, setLoading] = useState(false);

  // Fetch topics
  useEffect(() => {
    if (!isOpen) return;

    const fetchTopics = async () => {
      try {
        setLoading(true);
        const params = {};
        if (subjectId) params.subjectId = subjectId;
        const res = await api.get('/topics', { params });
        if (res.data.success && res.data.topics) {
          setTopics(res.data.topics);
          // If initialTopicId exists in list, choose it, else choose first
          const found = res.data.topics.find((t) => t._id === (selectedTopicId || initialTopicId));
          if (found) {
            setSelectedTopicId(found._id);
            setSelectedTopic(found);
            setNotesText(found.notes || '');
            setResources(found.resources || []);
          } else if (res.data.topics.length > 0) {
            setSelectedTopicId(res.data.topics[0]._id);
            setSelectedTopic(res.data.topics[0]);
            setNotesText(res.data.topics[0].notes || '');
            setResources(res.data.topics[0].resources || []);
          }
        }
      } catch (err) {
        console.error('Failed to load topics in focus drawer:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTopics();
  }, [isOpen, subjectId, initialTopicId]);

  // Handle changing topic from dropdown
  const handleSelectTopicChange = (topicId) => {
    setSelectedTopicId(topicId);
    const found = topics.find((t) => t._id === topicId);
    if (found) {
      setSelectedTopic(found);
      setNotesText(found.notes || '');
      setResources(found.resources || []);
      setNotesSavedToast(false);
    }
  };

  // Save notes to database
  const handleSaveNotes = async () => {
    if (!selectedTopic) return;
    try {
      setIsSavingNotes(true);
      const res = await api.patch(`/topics/${selectedTopic._id}`, {
        notes: notesText,
      });
      if (res.data.success && res.data.topic) {
        setSelectedTopic(res.data.topic);
        setNotesSavedToast(true);
        setTimeout(() => setNotesSavedToast(false), 3000);
      }
    } catch (err) {
      console.error('Failed to save focus notes:', err);
    } finally {
      setIsSavingNotes(false);
    }
  };

  // Add study material (Drive link, PDF, diagram photo)
  const handleAddResource = async (e) => {
    e.preventDefault();
    if (!selectedTopic || !newTitle.trim() || !newUrl.trim()) return;

    const item = {
      title: newTitle.trim(),
      url: newUrl.trim(),
      resourceType: newType,
    };

    const updated = [...resources, item];

    try {
      const res = await api.patch(`/topics/${selectedTopic._id}`, {
        resources: updated,
      });
      if (res.data.success && res.data.topic) {
        setSelectedTopic(res.data.topic);
        setResources(res.data.topic.resources || updated);
        setNewTitle('');
        setNewUrl('');
        setIsAddingResource(false);
      }
    } catch (err) {
      console.error('Failed to add resource in focus drawer:', err);
    }
  };

  // Delete a study material
  const handleDeleteResource = async (idxToDelete) => {
    if (!selectedTopic) return;
    const updated = resources.filter((_, idx) => idx !== idxToDelete);
    try {
      const res = await api.patch(`/topics/${selectedTopic._id}`, {
        resources: updated,
      });
      if (res.data.success && res.data.topic) {
        setSelectedTopic(res.data.topic);
        setResources(res.data.topic.resources || updated);
      }
    } catch (err) {
      console.error('Failed to remove resource in focus drawer:', err);
    }
  };

  const getResourceIcon = (type) => {
    switch (type) {
      case 'drive':
        return (
          <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center justify-center shrink-0">
            <Folder className="w-3.5 h-3.5" />
          </div>
        );
      case 'pdf':
        return (
          <div className="w-7 h-7 rounded-lg bg-red-500/20 text-red-300 border border-red-500/30 flex items-center justify-center shrink-0">
            <FileText className="w-3.5 h-3.5" />
          </div>
        );
      case 'image':
        return (
          <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center justify-center shrink-0">
            <Image className="w-3.5 h-3.5" />
          </div>
        );
      default:
        return (
          <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center justify-center shrink-0">
            <ExternalLink className="w-3.5 h-3.5" />
          </div>
        );
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[480px] bg-[#1A1513]/95 backdrop-blur-xl border-l border-white/10 shadow-2xl flex flex-col text-white animate-in slide-in-from-right duration-300">
        {/* Header Bar */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-coral/20 border border-coral text-coral flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-coral">
                  Focus Notes & Materials
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/90 font-mono font-bold">
                  ⏱️ {timeFormatted}
                </span>
              </div>
              <h4 className="text-sm font-bold text-white/90 truncate max-w-[240px]">
                {subjectName || 'Study Materials'}
              </h4>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white flex items-center justify-center transition-colors"
            title="Close Drawer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Topic Selector Switcher */}
        <div className="px-5 py-3 bg-white/5 border-b border-white/10 shrink-0">
          <label className="text-[10px] font-bold uppercase tracking-wider text-white/50 block mb-1">
            Current Syllabus Topic
          </label>
          <div className="relative">
            <select
              value={selectedTopicId}
              onChange={(e) => handleSelectTopicChange(e.target.value)}
              className="w-full text-xs font-semibold px-3 py-2 rounded-xl bg-[#251E1C] border border-white/15 text-white focus:outline-none focus:border-coral appearance-none pr-8 cursor-pointer"
            >
              {topics.map((t) => (
                <option key={t._id} value={t._id} className="bg-[#251E1C] text-white">
                  {t.name} {t.subjectId?.name ? `(${t.subjectId.name})` : ''}
                </option>
              ))}
              {topics.length === 0 && (
                <option value="">No topics created yet</option>
              )}
            </select>
            <ChevronDown className="w-4 h-4 text-white/50 absolute right-2.5 top-2.5 pointer-events-none" />
          </div>
        </div>

        {/* Tab switch: Notes vs Materials */}
        <div className="px-5 pt-3 pb-2 border-b border-white/10 flex items-center gap-2 shrink-0">
          <button
            onClick={() => setActiveTab('notes')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'notes'
                ? 'bg-coral text-white shadow-sm'
                : 'bg-white/5 text-white/60 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Topic Notes</span>
          </button>

          <button
            onClick={() => setActiveTab('materials')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'materials'
                ? 'bg-coral text-white shadow-sm'
                : 'bg-white/5 text-white/60 hover:text-white'
            }`}
          >
            <Folder className="w-3.5 h-3.5" />
            <span>Materials ({resources.length})</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* TAB 1: NOTES */}
          {activeTab === 'notes' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white/80">
                  Revision Cheat Sheet
                </span>

                <div className="flex items-center gap-2">
                  {notesSavedToast && (
                    <span className="text-[11px] font-bold text-successGreen flex items-center gap-1 animate-in fade-in">
                      <Check className="w-3.5 h-3.5" /> Saved
                    </span>
                  )}
                  <button
                    onClick={handleSaveNotes}
                    disabled={isSavingNotes || !selectedTopic}
                    className="px-3 py-1 rounded-xl bg-coral hover:bg-coral-dark text-white text-xs font-bold transition-all flex items-center gap-1 disabled:opacity-50"
                  >
                    <Save className="w-3 h-3" />
                    <span>{isSavingNotes ? 'Saving...' : 'Save Notes'}</span>
                  </button>
                </div>
              </div>

              <textarea
                rows="14"
                placeholder="Study notes, key formulas, algorithm steps, or questions to review... Type here while studying, and hit 'Save Notes' to store permanently!"
                value={notesText}
                onChange={(e) => setNotesText(e.target.value)}
                className="w-full text-xs leading-relaxed p-3.5 rounded-2xl bg-[#251E1C] border border-white/15 text-white placeholder-white/40 focus:outline-none focus:border-coral font-mono resize-none"
              />

              <p className="text-[11px] text-white/50 leading-normal">
                💡 <strong className="text-white/80">Tip:</strong> These notes are stored directly on your topic so you can review them before assessments or mock tests.
              </p>
            </div>
          )}

          {/* TAB 2: MATERIALS (DRIVE, PDF, PHOTOS, LINKS) */}
          {activeTab === 'materials' && (
            <div className="space-y-4">
              {/* Add Material Toggle Button */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white/80">
                  Attached Study Links & Drive
                </span>

                <button
                  type="button"
                  onClick={() => setIsAddingResource(!isAddingResource)}
                  className="px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all flex items-center gap-1"
                >
                  <Plus className="w-3 h-3 stroke-[3]" />
                  <span>{isAddingResource ? 'Cancel' : 'Add Link'}</span>
                </button>
              </div>

              {/* Quick Add Form inside Focus Mode */}
              {isAddingResource && (
                <form
                  onSubmit={handleAddResource}
                  className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2.5 animate-in fade-in duration-150"
                >
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-white/60 block mb-1">Title *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Unit 3 Drive"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        className="w-full text-xs px-2.5 py-1.5 rounded-xl bg-[#251E1C] border border-white/15 text-white focus:outline-none focus:border-coral"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-white/60 block mb-1">Type</label>
                      <select
                        value={newType}
                        onChange={(e) => setNewType(e.target.value)}
                        className="w-full text-xs px-2.5 py-1.5 rounded-xl bg-[#251E1C] border border-white/15 text-white focus:outline-none focus:border-coral"
                      >
                        <option value="drive">📁 Drive Link</option>
                        <option value="pdf">📄 PDF Document</option>
                        <option value="image">🖼️ Photo / Diagram</option>
                        <option value="link">🔗 Web Reference</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-white/60 block mb-1">URL / Link *</label>
                    <input
                      type="url"
                      required
                      placeholder="https://drive.google.com/..."
                      value={newUrl}
                      onChange={(e) => setNewUrl(e.target.value)}
                      className="w-full text-xs px-2.5 py-1.5 rounded-xl bg-[#251E1C] border border-white/15 text-white focus:outline-none focus:border-coral"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-1.5 rounded-xl bg-coral hover:bg-coral-dark text-white text-xs font-bold shadow-sm transition-all"
                  >
                    Save to Topic
                  </button>
                </form>
              )}

              {/* List of Materials */}
              <div className="space-y-2">
                {resources.length === 0 ? (
                  <div className="py-8 text-center text-xs text-white/40 bg-white/5 rounded-2xl border border-white/10">
                    No materials attached to this topic yet.
                  </div>
                ) : (
                  resources.map((res, index) => (
                    <div
                      key={index}
                      className="p-3 rounded-2xl bg-white/5 border border-white/10 hover:border-coral/40 transition-all flex items-center justify-between gap-2.5 group"
                    >
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        {getResourceIcon(res.resourceType)}
                        <div className="overflow-hidden">
                          <h5 className="text-xs font-bold text-white/90 truncate">
                            {res.title}
                          </h5>
                          <span className="text-[10px] text-white/50 truncate block max-w-[200px]">
                            {res.url}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Diagram photo preview */}
                        {res.resourceType === 'image' && (
                          <button
                            type="button"
                            onClick={() => setPreviewImage(res.url)}
                            className="p-1 rounded-lg bg-white/10 text-white/80 hover:text-white"
                            title="Preview Diagram"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Open external link (safe with whitelist notification) */}
                        <a
                          href={res.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => onOpenStudyResource(res)}
                          className="px-2.5 py-1 rounded-xl bg-coral hover:bg-coral-dark text-white text-[11px] font-bold transition-all flex items-center gap-1"
                        >
                          <span>Open</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>

                        <button
                          type="button"
                          onClick={() => handleDeleteResource(index)}
                          className="p-1 rounded-lg text-white/40 hover:text-red-400 hover:bg-white/10 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* In-Focus Diagram Lightbox */}
      {previewImage && (
        <div
          className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="bg-[#1C1715] rounded-3xl p-4 max-w-2xl max-h-[85vh] overflow-hidden shadow-2xl relative border border-white/20 flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full flex items-center justify-between pb-2 border-b border-white/10 mb-2">
              <span className="text-xs font-bold text-white/90">Diagram Preview</span>
              <button
                onClick={() => setPreviewImage(null)}
                className="w-7 h-7 rounded-full bg-white/10 text-white/80 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <img
              src={previewImage}
              alt="Study Diagram"
              className="max-h-[70vh] object-contain rounded-xl"
              onError={(e) => {
                e.target.src = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800';
              }}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default FocusNotesDrawer;
