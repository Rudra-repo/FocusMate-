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
  Sparkles,
  Lock,
  Play,
  Layers,
  BookOpen,
  Eye,
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export const TopicStudyMaterialsModal = ({
  isOpen,
  onClose,
  topic,
  subject,
  onTopicUpdated,
  onOpenAiQuiz,
}) => {
  const { startFullFocusMode } = useAuth();

  const [activeTab, setActiveTab] = useState('notes'); // 'notes' or 'materials'
  const [notesText, setNotesText] = useState('');
  const [resources, setResources] = useState([]);
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [notesSaveSuccess, setNotesSaveSuccess] = useState(false);

  // New resource form state
  const [newResourceTitle, setNewResourceTitle] = useState('');
  const [newResourceUrl, setNewResourceUrl] = useState('');
  const [newResourceType, setNewResourceType] = useState('drive'); // 'drive', 'pdf', 'image', 'link'
  const [isAddingResource, setIsAddingResource] = useState(false);
  const [resourceFilter, setResourceFilter] = useState('all');
  const [previewImage, setPreviewImage] = useState(null);

  useEffect(() => {
    if (topic && isOpen) {
      setNotesText(topic.notes || '');
      setResources(topic.resources || []);
      setNotesSaveSuccess(false);
      setNewResourceTitle('');
      setNewResourceUrl('');
    }
  }, [topic, isOpen]);

  if (!isOpen || !topic) return null;

  // Save study notes to DB
  const handleSaveNotes = async () => {
    try {
      setIsSavingNotes(true);
      const res = await api.patch(`/topics/${topic._id}`, {
        notes: notesText,
      });

      if (res.data.success && res.data.topic) {
        setNotesSaveSuccess(true);
        if (onTopicUpdated) onTopicUpdated(res.data.topic);
        setTimeout(() => setNotesSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Failed to save notes:', err);
    } finally {
      setIsSavingNotes(false);
    }
  };

  // Add new study material (Drive link, PDF, photo, etc.)
  const handleAddResource = async (e) => {
    e.preventDefault();
    if (!newResourceTitle.trim() || !newResourceUrl.trim()) return;

    const resourceItem = {
      title: newResourceTitle.trim(),
      url: newResourceUrl.trim(),
      resourceType: newResourceType,
    };

    const updatedResources = [...resources, resourceItem];

    try {
      setIsAddingResource(true);
      const res = await api.patch(`/topics/${topic._id}`, {
        resources: updatedResources,
      });

      if (res.data.success && res.data.topic) {
        setResources(res.data.topic.resources || updatedResources);
        setNewResourceTitle('');
        setNewResourceUrl('');
        if (onTopicUpdated) onTopicUpdated(res.data.topic);
      }
    } catch (err) {
      console.error('Failed to add study material:', err);
    } finally {
      setIsAddingResource(false);
    }
  };

  // Delete a study material
  const handleDeleteResource = async (indexToDelete) => {
    const updatedResources = resources.filter((_, idx) => idx !== indexToDelete);

    try {
      const res = await api.patch(`/topics/${topic._id}`, {
        resources: updatedResources,
      });

      if (res.data.success && res.data.topic) {
        setResources(res.data.topic.resources || updatedResources);
        if (onTopicUpdated) onTopicUpdated(res.data.topic);
      }
    } catch (err) {
      console.error('Failed to remove resource:', err);
    }
  };

  // Launch Focus Mode with this topic's notes & study materials
  const handleStartTopicFocus = () => {
    onClose();
    startFullFocusMode({
      targetMinutes: 25,
      topicId: topic._id,
      topicName: topic.name,
      subjectId: subject?._id || topic.subjectId?._id || null,
      subjectName: subject?.name || topic.subjectId?.name || 'Academic Study',
      notes: notesText,
      resources,
    });
  };

  const getResourceIcon = (type) => {
    switch (type) {
      case 'drive':
        return (
          <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center shrink-0">
            <Folder className="w-4 h-4 fill-amber-500/20" />
          </div>
        );
      case 'pdf':
        return (
          <div className="w-8 h-8 rounded-xl bg-red-50 text-red-600 border border-red-200 flex items-center justify-center shrink-0">
            <FileText className="w-4 h-4" />
          </div>
        );
      case 'image':
        return (
          <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 border border-purple-200 flex items-center justify-center shrink-0">
            <Image className="w-4 h-4" />
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center shrink-0">
            <ExternalLink className="w-4 h-4" />
          </div>
        );
    }
  };

  const filteredResources = resources.filter((res) => {
    if (resourceFilter === 'all') return true;
    return res.resourceType === resourceFilter;
  });

  return (
    <>
      <div className="fixed inset-0 z-50 bg-[#342D2B]/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
        <div className="bg-white rounded-3xl p-6 md:p-8 max-w-3xl w-full shadow-2xl border border-peach-200 my-8 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
          {/* Header Bar */}
          <div className="flex items-start justify-between pb-4 border-b border-peach-100 shrink-0">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="px-2.5 py-0.5 rounded-full text-[10px] font-bold text-white shadow-sm"
                  style={{ backgroundColor: subject?.color || '#FF8B76' }}
                >
                  {subject?.name || 'Subject'}
                </span>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-peach-100 text-coral">
                  Topic Hub
                </span>
              </div>
              <h3 className="text-xl md:text-2xl font-bold font-display text-mainText">
                {topic.name}
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleStartTopicFocus}
                className="px-3.5 py-2 rounded-2xl bg-coral hover:bg-coral-dark text-white font-bold text-xs shadow-soft-peach flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95"
                title="Launch distraction-free Pomodoro session with this topic's notes preloaded"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Focus (25m)</span>
              </button>

              <button
                onClick={() => {
                  onClose();
                  if (onOpenAiQuiz) onOpenAiQuiz(topic.name, subject?._id);
                }}
                className="px-3.5 py-2 rounded-2xl bg-peach-100 hover:bg-peach-200 text-coral font-bold text-xs flex items-center gap-1.5 transition-colors"
                title="Generate AI diagnostic quiz for this topic"
              >
                <Sparkles className="w-3.5 h-3.5 fill-coral" />
                <span>AI Quiz</span>
              </button>

              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-peach-50 text-mainText-muted hover:text-coral flex items-center justify-center transition-colors ml-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 mt-4 pb-3 border-b border-peach-100 shrink-0">
            <button
              onClick={() => setActiveTab('notes')}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'notes'
                  ? 'bg-coral text-white shadow-soft-peach'
                  : 'bg-peach-50/60 hover:bg-peach-100 text-mainText-muted'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Study Notes & Formulas</span>
            </button>

            <button
              onClick={() => setActiveTab('materials')}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'materials'
                  ? 'bg-coral text-white shadow-soft-peach'
                  : 'bg-peach-50/60 hover:bg-peach-100 text-mainText-muted'
              }`}
            >
              <Folder className="w-3.5 h-3.5" />
              <span>Drive Links, PDFs & Photos ({resources.length})</span>
            </button>
          </div>

          {/* Tab Content Body (Scrollable) */}
          <div className="flex-1 overflow-y-auto py-4 pr-1">
            {/* TAB 1: NOTES */}
            {activeTab === 'notes' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-mainText">
                    Personal Topic Notes & Cheat Sheet
                  </span>
                  <div className="flex items-center gap-2">
                    {notesSaveSuccess && (
                      <span className="text-xs font-bold text-successGreen-dark flex items-center gap-1 animate-in fade-in">
                        <Check className="w-3.5 h-3.5" /> Notes Saved
                      </span>
                    )}
                    <button
                      onClick={handleSaveNotes}
                      disabled={isSavingNotes}
                      className="px-4 py-1.5 rounded-xl bg-coral hover:bg-coral-dark text-white text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{isSavingNotes ? 'Saving...' : 'Save Notes'}</span>
                    </button>
                  </div>
                </div>

                <div className="bg-peach-50/40 p-3 rounded-2xl border border-peach-200/80">
                  <textarea
                    rows="12"
                    placeholder="Write key equations, formulas, algorithmic steps, mnemonics, or revision points here... These notes will be readily accessible inside Focus Mode while the timer is running!"
                    value={notesText}
                    onChange={(e) => setNotesText(e.target.value)}
                    className="w-full text-xs md:text-sm p-3 rounded-xl border border-peach-200 focus:outline-none focus:border-coral bg-white text-mainText leading-relaxed font-sans"
                  />
                </div>

                <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200 text-[11px] text-amber-800 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    <strong>Pro-Tip:</strong> When you start a Pomodoro session on this topic, your notes will open automatically in the focus drawer so you don't need any other tabs open.
                  </span>
                </div>
              </div>
            )}

            {/* TAB 2: STUDY MATERIALS (DRIVE, PDF, PHOTOS, LINKS) */}
            {activeTab === 'materials' && (
              <div className="space-y-6">
                {/* Add Material Form */}
                <form
                  onSubmit={handleAddResource}
                  className="bg-peach-50/50 p-4 rounded-2xl border border-peach-200 space-y-3"
                >
                  <span className="text-xs font-bold text-mainText block">
                    Attach New Study Material
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                    <div className="sm:col-span-5">
                      <label className="text-[11px] font-bold text-mainText-muted block mb-1">
                        Title or Label *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Unit 3 Midterm Drive Folder"
                        value={newResourceTitle}
                        onChange={(e) => setNewResourceTitle(e.target.value)}
                        className="w-full text-xs px-3 py-2 rounded-xl border border-peach-200 focus:outline-none focus:border-coral bg-white"
                      />
                    </div>

                    <div className="sm:col-span-4">
                      <label className="text-[11px] font-bold text-mainText-muted block mb-1">
                        Resource Type
                      </label>
                      <select
                        value={newResourceType}
                        onChange={(e) => setNewResourceType(e.target.value)}
                        className="w-full text-xs px-3 py-2 rounded-xl border border-peach-200 focus:outline-none focus:border-coral bg-white"
                      >
                        <option value="drive">📁 Google Drive</option>
                        <option value="pdf">📄 PDF Document</option>
                        <option value="image">🖼️ Photo / Diagram</option>
                        <option value="link">🔗 Web Reference</option>
                      </select>
                    </div>

                    <div className="sm:col-span-3 flex items-end">
                      <button
                        type="submit"
                        disabled={isAddingResource || !newResourceTitle.trim() || !newResourceUrl.trim()}
                        className="w-full py-2 rounded-xl bg-coral hover:bg-coral-dark text-white text-xs font-bold shadow-soft-peach flex items-center justify-center gap-1.5 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                      >
                        <Plus className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Add</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-mainText-muted block mb-1">
                      Resource URL / Google Drive Link / Image Link *
                    </label>
                    <input
                      type="url"
                      required
                      placeholder="https://drive.google.com/... or https://example.com/notes.pdf"
                      value={newResourceUrl}
                      onChange={(e) => setNewResourceUrl(e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-peach-200 focus:outline-none focus:border-coral bg-white"
                    />
                  </div>
                </form>

                {/* Filter Pills */}
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {[
                      { id: 'all', label: 'All' },
                      { id: 'drive', label: '📁 Google Drive' },
                      { id: 'pdf', label: '📄 PDFs' },
                      { id: 'image', label: '🖼️ Photos & Diagrams' },
                      { id: 'link', label: '🔗 Web Links' },
                    ].map((filt) => (
                      <button
                        key={filt.id}
                        type="button"
                        onClick={() => setResourceFilter(filt.id)}
                        className={`text-[11px] px-2.5 py-1 rounded-xl border transition-all ${
                          resourceFilter === filt.id
                            ? 'bg-coral text-white border-coral font-bold shadow-sm'
                            : 'bg-white hover:bg-peach-50 border-peach-200 text-mainText-muted'
                        }`}
                      >
                        {filt.label}
                      </button>
                    ))}
                  </div>

                  <span className="text-[11px] text-mainText-muted">
                    {filteredResources.length} items
                  </span>
                </div>

                {/* Resources List */}
                <div className="space-y-2.5">
                  {filteredResources.length === 0 ? (
                    <div className="py-8 text-center text-xs text-mainText-muted bg-peach-50/30 rounded-2xl border border-peach-100">
                      No study materials attached yet. Paste your Google Drive links, lecture PDFs, or diagram photos above!
                    </div>
                  ) : (
                    filteredResources.map((res, index) => {
                      const actualIdx = resources.findIndex(
                        (r) => r.title === res.title && r.url === res.url
                      );

                      return (
                        <div
                          key={index}
                          className="p-3.5 rounded-2xl bg-white border border-peach-200/80 hover:border-coral/50 shadow-sm transition-all flex items-center justify-between gap-3 group"
                        >
                          <div className="flex items-center gap-3 overflow-hidden">
                            {getResourceIcon(res.resourceType)}

                            <div className="overflow-hidden">
                              <h5 className="text-xs md:text-sm font-bold text-mainText truncate">
                                {res.title}
                              </h5>
                              <a
                                href={res.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[11px] text-coral hover:underline truncate block max-w-xs sm:max-w-md"
                              >
                                {res.url}
                              </a>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {/* If image, offer preview button */}
                            {res.resourceType === 'image' && (
                              <button
                                type="button"
                                onClick={() => setPreviewImage(res.url)}
                                className="p-1.5 rounded-xl bg-peach-50 text-coral hover:bg-coral hover:text-white transition-colors"
                                title="View Diagram Photo"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            )}

                            <a
                              href={res.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 rounded-xl bg-peach-50 hover:bg-coral hover:text-white text-coral text-xs font-bold transition-all flex items-center gap-1"
                            >
                              <span>Open</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>

                            <button
                              type="button"
                              onClick={() => handleDeleteResource(actualIdx >= 0 ? actualIdx : index)}
                              className="p-1.5 rounded-xl text-mainText-muted hover:bg-red-50 hover:text-red-500 transition-colors"
                              title="Delete Material"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Diagram Photo Lightbox Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-60 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="bg-white rounded-3xl p-4 max-w-2xl max-h-[85vh] overflow-hidden shadow-2xl relative flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full flex items-center justify-between pb-2 border-b border-peach-100 mb-2">
              <span className="text-xs font-bold text-mainText">Study Diagram Preview</span>
              <button
                onClick={() => setPreviewImage(null)}
                className="w-7 h-7 rounded-full bg-peach-50 text-mainText hover:text-coral flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <img
              src={previewImage}
              alt="Study material"
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

export default TopicStudyMaterialsModal;
