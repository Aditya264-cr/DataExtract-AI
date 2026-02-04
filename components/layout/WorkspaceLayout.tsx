
import React, { useState, useMemo, useEffect } from 'react';
import { LeftSidebar } from './LeftSidebar';
import { RightSidebar } from './RightSidebar';
import { CenterWorkspace } from './CenterWorkspace';
import type { ExtractedData, UploadedFile } from '../../types';
import { Modal } from '../ui/Modal';
import { DocumentHighlighter } from '../DocumentHighlighter';

interface WorkspaceLayoutProps {
    data: ExtractedData;
    files: UploadedFile[];
    onNewUpload: () => void;
    onReprocess: (editedData: ExtractedData) => void;
    onAddFiles: (files: File[]) => void;
    onRemoveFile: (fileId: string) => void;
    isLeftSidebarOpen: boolean;
    onToggleLeftSidebar: () => void;
    isRightSidebarOpen: boolean;
    onToggleRightSidebar: () => void;
}

export const WorkspaceLayout: React.FC<WorkspaceLayoutProps> = (props) => {
    const [selectedFileId, setSelectedFileId] = useState<string | null>(props.files.length > 0 ? props.files[0].id : null);
    
    // Preview Modal state
    const [previewFileId, setPreviewFileId] = useState<string | null>(null);
    const [heatmapVisible, setHeatmapVisible] = useState(false);

    useEffect(() => {
        if (!selectedFileId && props.files.length > 0) {
            setSelectedFileId(props.files[0].id);
        }
        if (selectedFileId && !props.files.find(f => f.id === selectedFileId)) {
            setSelectedFileId(props.files.length > 0 ? props.files[0].id : null);
        }
    }, [props.files, selectedFileId]);

    useEffect(() => {
        // When the sidebar collapses, also close any related overlays like the preview modal and reset heatmap.
        if (!props.isLeftSidebarOpen) {
            setPreviewFileId(null);
            setHeatmapVisible(false);
        }
    }, [props.isLeftSidebarOpen]);

    const selectedFile = useMemo(() => props.files.find(f => f.id === selectedFileId), [props.files, selectedFileId]);
    const previewFile = useMemo(() => props.files.find(f => f.id === previewFileId), [props.files, previewFileId]);

    const handlePreviewSource = (fileId: string, showHeatmap: boolean = false) => {
        setPreviewFileId(fileId);
        setHeatmapVisible(showHeatmap);
    };

    const handleClosePreview = () => {
        setPreviewFileId(null);
        setHeatmapVisible(false); // Reset to ensure next open defaults to false unless specified
    };

    return (
        <div className="relative w-full h-full flex gap-4 p-4 z-10">
            {/* Left Pane: Sources - Independent Surface */}
            <LeftSidebar
                files={props.files}
                onAddFiles={props.onAddFiles}
                onRemoveFile={props.onRemoveFile}
                isOpen={props.isLeftSidebarOpen}
                onToggle={props.onToggleLeftSidebar}
                selectedFileId={selectedFileId}
                onSelectFile={setSelectedFileId}
                onPreviewSource={handlePreviewSource}
            />

            {/* Center Pane: Main Content - Independent Surface */}
            <main className="flex-1 min-w-0 h-full flex flex-col bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm overflow-hidden transition-all duration-300">
                <CenterWorkspace
                    data={props.data}
                    file={selectedFile || props.files[0]}
                    onNewUpload={props.onNewUpload}
                    onReprocess={props.onReprocess}
                />
            </main>

            {/* Right Pane: Assistant - Independent Surface */}
            <RightSidebar
                extractedData={props.data}
                isOpen={props.isRightSidebarOpen}
                onToggle={props.onToggleRightSidebar}
            />

            {/* Source Preview Modal */}
            {previewFile && (
                <Modal 
                    isOpen={!!previewFileId} 
                    onClose={handleClosePreview} 
                    title={`Source: ${previewFile.file.name}`}
                    size="xl"
                >
                    <div className="aspect-[4/5] w-full bg-black/5 dark:bg-zinc-900 rounded-xl overflow-hidden border border-black/10 dark:border-white/10 relative group">
                         {previewFile.file.type.startsWith('image/') ? (
                            <DocumentHighlighter 
                                file={previewFile} 
                                highlights={props.data.highlights || []} 
                                hoveredField={null} 
                                onHoverField={() => {}} 
                                showHighlights={heatmapVisible} 
                            />
                        ) : (
                            <iframe src={previewFile.preview} className="w-full h-full border-0" title="PDF Preview"></iframe>
                        )}
                        {/* Toggle Heatmap Button inside Modal */}
                        {previewFile.file.type.startsWith('image/') && (
                             <div className="absolute top-4 right-4 z-30 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                    onClick={() => setHeatmapVisible(!heatmapVisible)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-bold shadow-lg backdrop-blur-md transition-all ${heatmapVisible ? 'bg-blue-500 text-white' : 'bg-black/60 text-white hover:bg-black/80'}`}
                                >
                                    {heatmapVisible ? 'Hide Heatmap' : 'Show Heatmap'}
                                </button>
                             </div>
                        )}
                    </div>
                    {heatmapVisible && (
                        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center gap-2 animate-fade-in">
                             <span className="text-xs font-semibold text-blue-700 dark:text-blue-400">Heatmap Mode Active</span>
                             <span className="text-xs text-blue-600/80 dark:text-blue-400/60">Confidence overlays are visible on identified fields.</span>
                        </div>
                    )}
                </Modal>
            )}
        </div>
    );
};
