import React from 'react';

interface ReportDownloadModalProps {
  demandUrl: string;
  pipelineUrl: string;
  onClose: () => void;
}

const ReportDownloadModal: React.FC<ReportDownloadModalProps> = ({ demandUrl, pipelineUrl, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
        <h2 className="text-lg font-bold mb-4">Your reports are ready</h2>
        <ul className="space-y-2 mb-4">
          <li>
            <a
              href={demandUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              Demand and Rate Report
            </a>
          </li>
          <li>
            <a
              href={pipelineUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              FX Pipeline Demand Report
            </a>
          </li>
        </ul>
        <div className="text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportDownloadModal;
