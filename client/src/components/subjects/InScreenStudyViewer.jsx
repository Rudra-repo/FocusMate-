import React, { useState } from 'react';
import { X, ExternalLink, Maximize2, Minimize2, FileText, Folder, Image, Link2, AlertCircle } from 'lucide-react';

export const InScreenStudyViewer = ({
  isOpen,
  onClose,
  resource,
  onOpenExternal = () => {},
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [iframeError, setIframeError] = useState(false);

  if (!isOpen || !resource) return null;

  // Transform Google Drive links to embeddable /preview links
  const getEmbeddableUrl = (url, type) => {
    if (!url) return '';

    // Handle Google Drive file view links
    if (url.includes('drive.google.com/file/d/')) {
      return url.replace(/\/view(\?.*)?$/, '/preview');
    }

    // Handle Google Docs / Sheets / Slides preview
    if (url.includes('docs.google.com/')) {
      return url.replace(/\/edit(\?.*)?$/, '/preview');
    }

    // For uploaded PDFs or relative URLs
    if (url.startsWith('/uploads/')) {
      return `http://localhost:5001${url}`;
    }

    return url;
  };

  const embedUrl = getEmbeddableUrl(resource.url, resource.resourceType);

  const getBadgeIcon = (type) => {
    switch (type) {
      case 'drive':
        return <Folder className="w-4 h-4 text-amber-500" />;
      case 'pdf':
        return <FileText className="w-4 h-4 text-red-500" />;
      case 'image':
        return <Image className="w-4 h-4 text-purple-500" />;
      default:
        return <Link2 className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-60 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-6 animate-in fade-in duration-200">
      <div
        className={`bg-[#181413] rounded-3xl border border-white/20 shadow-2xl flex flex-col overflow-hidden text-white transition-all duration-200 ${
          isFullscreen
            ? 'w-full h-full rounded-none sm:rounded-2xl'
            : 'max-w-5xl w-full h-[88vh]'
        }`}
      >
        {/* Header Bar */}
        <div className="px-5 py-3.5 bg-white/5 border-b border-white/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 overflow-hidden pr-2">
            <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
              {getBadgeIcon(resource.resourceType)}
            </div>
            <div className="overflow-hidden">
              <h4 className="text-sm font-bold text-white truncate">
                {resource.title || 'Study Material'}
              </h4>
              <span className="text-[10px] text-white/50 block truncate max-w-sm">
                In-Screen Focus Reader • {resource.resourceType?.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Direct Open in New Tab (whitelisted from distraction warnings) */}
            <a
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => onOpenExternal(resource)}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all flex items-center gap-1.5"
              title="Open in new browser tab (Authorized Academic Link)"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">New Tab</span>
            </a>

            {/* Toggle Fullscreen Modal */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white flex items-center justify-center transition-colors"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Reader'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-red-500/30 hover:text-red-300 text-white flex items-center justify-center transition-colors ml-1"
              title="Close Study Viewer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-black/40 overflow-auto flex items-center justify-center p-2 relative">
          {/* 1. PHOTO / DIAGRAM */}
          {resource.resourceType === 'image' && (
            <div className="w-full h-full flex items-center justify-center p-4">
              <img
                src={embedUrl}
                alt={resource.title}
                className="max-w-full max-h-full object-contain rounded-xl shadow-lg select-none"
                onError={(e) => {
                  e.target.src = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800';
                }}
              />
            </div>
          )}

          {/* 2. PDF DOCUMENT */}
          {resource.resourceType === 'pdf' && (
            <div className="w-full h-full">
              <iframe
                src={embedUrl}
                className="w-full h-full rounded-2xl bg-white border-0"
                title={resource.title}
              />
            </div>
          )}

          {/* 3. GOOGLE DRIVE OR WEB LINK */}
          {(resource.resourceType === 'drive' || resource.resourceType === 'link') && (
            <div className="w-full h-full flex flex-col">
              {iframeError ? (
                <div className="m-auto text-center p-8 bg-white/5 rounded-3xl border border-white/10 max-w-md">
                  <AlertCircle className="w-10 h-10 text-amber-400 mx-auto mb-3" />
                  <h5 className="text-base font-bold text-white mb-2">
                    Security Restriction from Source
                  </h5>
                  <p className="text-xs text-white/60 mb-5 leading-relaxed">
                    This website does not allow embedding inside frames. You can safely open it in a new tab—FocusMate has whitelisted this academic link so no distraction warning will trigger.
                  </p>
                  <a
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => onOpenExternal(resource)}
                    className="px-5 py-2.5 rounded-2xl bg-coral hover:bg-coral-dark text-white font-bold text-xs shadow-soft-peach inline-flex items-center gap-2"
                  >
                    <span>Open in Whitelisted Tab</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              ) : (
                <iframe
                  src={embedUrl}
                  className="w-full h-full rounded-2xl bg-white border-0"
                  title={resource.title}
                  onError={() => setIframeError(true)}
                  allow="autoplay; encrypted-media; fullscreen"
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InScreenStudyViewer;
