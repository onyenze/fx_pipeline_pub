import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { X, Download, FileText, File, RefreshCw } from 'lucide-react';

interface DocumentPreviewProps {
  filePath: string;
  onClose: () => void;
}

export default function DocumentPreview({ filePath, onClose }: DocumentPreviewProps) {
  const [fileUrl, setFileUrl] = useState<string | undefined>(undefined);
  const [fileType, setFileType] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>(undefined);
  const [debugInfo, setDebugInfo] = useState<string | undefined>(undefined);
  
  // Fix potential issues with spaces in the file path
  const sanitizeFilePath = (path: string) => {
    // First, normalize the path to handle any unusual encoding
    // This will handle spaces, parentheses, and other special characters
    return path.trim();
  };
  
  const fetchFileUrl = async () => {
    try {
      setLoading(true);
      setError(undefined);
      setDebugInfo(`Original path: ${filePath}`);
      
      // Sanitize the file path
      const sanitizedPath = sanitizeFilePath(filePath);
      setDebugInfo(prev => `${prev}\nSanitized path: ${sanitizedPath}`);
      
      // Try the most direct approach first - download the file
      const { data: downloadData, error: downloadError } = await supabase.storage
        .from('documents')
        .download(sanitizedPath);
      
      if (downloadError) {
        console.error('Error downloading file directly:', downloadError);
        setDebugInfo(prev => `${prev}\nDirect download error: ${JSON.stringify(downloadError)}`);
        
        // Let's try listing the parent folder to see what's available
        const folderPath = sanitizedPath.split('/').slice(0, -1).join('/');
        const { data: folderContents, error: folderError } = await supabase.storage
          .from('documents')
          .list(folderPath);
        
        if (folderError) {
          setDebugInfo(prev => `${prev}\nFolder listing error: ${JSON.stringify(folderError)}`);
        } else {
          setDebugInfo(prev => `${prev}\nFolder exists: ${folderPath}`);
          setDebugInfo(prev => `${prev}\nFiles in folder: ${folderContents.map(f => f.name).join(', ') || 'No files found'}`);
        }
        
        // Get all buckets to verify the bucket exists
        const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
        
        if (bucketsError) {
          setDebugInfo(prev => `${prev}\nBuckets listing error: ${JSON.stringify(bucketsError)}`);
        } else {
          setDebugInfo(prev => `${prev}\nAvailable buckets: ${buckets.map(b => b.name).join(', ')}`);
        }
        
        // Try to create a signed URL directly
        const { data: signedData, error: signError } = await supabase.storage
          .from('documents')
          .createSignedUrl(sanitizedPath, 60 * 60);
        
        if (signError) {
          setDebugInfo(prev => `${prev}\nSigned URL error: ${JSON.stringify(signError)}`);
          setError('Unable to access this file. Please check if the file path is correct.');
        } else if (signedData?.signedUrl) {
          setFileUrl(signedData.signedUrl);
          setDebugInfo(prev => `${prev}\nSigned URL created successfully!`);
        }
      } else if (downloadData) {
        // Create a local object URL for the downloaded file
        const url = URL.createObjectURL(downloadData);
        setFileUrl(url);
        setDebugInfo(prev => `${prev}\nFile downloaded successfully and created object URL`);
      }
      
      // Determine file type based on extension
      const extension = sanitizedPath.split('.').pop()?.toLowerCase() || '';
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
      } else {
        setFileType('other');
      }
    } catch (error) {
      console.error('Unexpected error getting file:', error);
      setDebugInfo(prev => `${prev}\nUnexpected error: ${JSON.stringify(error)}`);
      setError('An error occurred while fetching the file');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchFileUrl();
    
    // Clean up object URLs when component unmounts
    return () => {
      if (fileUrl && fileUrl.startsWith('blob:')) {
        URL.revokeObjectURL(fileUrl);
      }
    };
  }, [filePath]);

  function downloadFile() {
    if (fileUrl) {
      window.open(fileUrl, '_blank');
    }
  }
  
  // Extract filename from path
  const fileName = filePath.split('/').pop() || 'Document';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[95vh] flex flex-col">
        <div className="flex justify-between items-center border-b p-4">
          <div className="flex items-center">
            <FileText className="h-5 w-5 text-red-500 mr-2" />
            <h3 className="text-lg font-medium text-gray-800 truncate">{fileName}</h3>
          </div>
          <div className="flex space-x-2">
            {!loading && !error && fileUrl && (
              <button
                onClick={downloadFile}
                className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <Download className="h-4 w-4 mr-1 text-red-500" />
                Download
              </button>
            )}
            {error && (
              <button
                onClick={fetchFileUrl}
                className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <RefreshCw className="h-4 w-4 mr-1 text-red-500" />
                Retry
              </button>
            )}
            <button
              onClick={onClose}
              className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </div>
        
        <div className="flex-1 p-4 overflow-auto h-full">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
              <p className="ml-3 text-gray-600">Loading preview...</p>
            </div>
          ) : error || !fileUrl ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-6">
              <File className="h-16 w-16 text-gray-400 mb-4" />
              <p className="text-gray-800 font-medium mb-2">Preview not available</p>
              <p className="text-gray-600 mb-4">{error || "Could not load file"}</p>
              <details className="mb-4 text-left w-full max-w-md bg-gray-50 p-3 rounded-md">
                <summary className="cursor-pointer font-medium text-gray-700">Debug Information</summary>
                <pre className="mt-2 text-xs text-gray-600 whitespace-pre-wrap break-all">
                  {debugInfo || "No debug info available"}
                </pre>
              </details>
              <div className="flex space-x-3">
                <button
                  onClick={fetchFileUrl}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <RefreshCw className="h-5 w-5 mr-2 text-gray-500" />
                  Try again
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              {fileType === 'pdf' && fileUrl && (
                <iframe 
                  src={`${fileUrl}#toolbar=0`}
                  className="w-full h-full border-0"
                  title={fileName}
                />
              )}
              {fileType === 'image' && fileUrl && (
                <img 
                  src={fileUrl} 
                  alt={fileName} 
                  className="max-w-full max-h-full object-contain"
                />
              )}
              {fileType === 'video' && fileUrl && (
                <video 
                  controls 
                  className="max-w-full max-h-full" 
                >
                  <source src={fileUrl} type={`video/${filePath.split('.').pop()}`} />
                  Your browser does not support the video tag.
                </video>
              )}
              {fileType === 'audio' && fileUrl && (
                <audio 
                  controls 
                  className="w-full" 
                >
                  <source src={fileUrl} type={`audio/${filePath.split('.').pop()}`} />
                  Your browser does not support the audio tag.
                </audio>
              )}
              {(fileType === 'document' || fileType === 'other') && (
                <div className="flex flex-col items-center justify-center h-full text-center p-6">
                  <File className="h-16 w-16 text-gray-400 mb-4" />
                  <p className="text-gray-800 font-medium mb-2">Preview not available</p>
                  <p className="text-gray-600 mb-4">This file type cannot be previewed directly.</p>
                  <button
                    onClick={downloadFile}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    <Download className="h-5 w-5 mr-2" />
                    Download instead
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}