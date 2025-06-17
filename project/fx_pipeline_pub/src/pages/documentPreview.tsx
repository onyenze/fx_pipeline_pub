import { useState, useEffect } from 'react';
import { X, Download, FileText, File, RefreshCw } from 'lucide-react';

interface DocumentPreviewProps {
  filePath: string; // this should now be a full Cloudinary URL
  onClose: () => void;
}

export default function DocumentPreview({ filePath, onClose }: DocumentPreviewProps) {
  const [fileType, setFileType] = useState<string>('other');

  useEffect(() => {
    const extension = filePath.split('.').pop()?.toLowerCase() || '';

    if (['pdf'].includes(extension)) {
      setFileType('pdf');
    } else if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) {
      setFileType('image');
    } else if (['mp4', 'webm', 'mov'].includes(extension)) {
      setFileType('video');
    } else if (['mp3', 'wav', 'ogg'].includes(extension)) {
      setFileType('audio');
    } else if (['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt'].includes(extension)) {
      setFileType('document');
    }
  }, [filePath]);

  const fileName = decodeURIComponent(filePath.split('/').pop() || 'Document');

  // Add click outside handler
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4"
      style={{ zIndex: 9999 }}
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[95vh] flex flex-col">
        <div className="flex justify-between items-center border-b p-4">
          <div className="flex items-center">
            <FileText className="h-5 w-5 text-red-500 mr-2" />
            <h3 className="text-lg font-medium text-gray-800 truncate">{fileName}</h3>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => window.open(filePath, '_blank')}
              className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <Download className="h-4 w-4 mr-1 text-red-500" />
              Download
            </button>
            <button
              onClick={onClose}
              className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="flex-1 p-4 overflow-auto h-full">
          <div className="flex items-center justify-center h-full">
            {fileType === 'pdf' && (
              <iframe 
                src={`${filePath}#toolbar=0`} 
                className="w-full h-full border-0"
                title={fileName}
              />
            )}
            {fileType === 'image' && (
              <img 
                src={filePath}
                alt={fileName}
                className="max-w-full max-h-full object-contain"
              />
            )}
            {fileType === 'video' && (
              <video controls className="max-w-full max-h-full">
                <source src={filePath} type={`video/${filePath.split('.').pop()}`} />
              </video>
            )}
            {fileType === 'audio' && (
              <audio controls className="w-full">
                <source src={filePath} type={`audio/${filePath.split('.').pop()}`} />
              </audio>
            )}
            {(fileType === 'document' || fileType === 'other') && (
              <div className="flex flex-col items-center justify-center h-full text-center p-6">
                <File className="h-16 w-16 text-gray-400 mb-4" />
                <p className="text-gray-800 font-medium mb-2">Preview not available</p>
                <p className="text-gray-600 mb-4">This file type cannot be previewed directly.</p>
                <a
                  href={filePath}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <Download className="h-5 w-5 mr-2" />
                  Download instead
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}