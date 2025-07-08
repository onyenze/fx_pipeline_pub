import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import apiClient from '../api/client';
import toast from 'react-hot-toast';
import { FileText, ArrowLeft, CheckCircle, XCircle, Download, Eye, FileCheck } from 'lucide-react';
import TransactionEditModal from './transactionEditModal';

interface Transaction {
  id: string;
  amount: number;
  description: string | null;
  customer_name: string;
  customer_address: string;
  sector: string;
  nature_of_business: string;
  contact_name: string;
  contact_number: string;
  amount_requested: number;
  cedi_balance: number;
  loan_limit: number;
  loan_balance: number;
  documentation_type: string;
  funding_status: string;
  purpose: string;
  tenor: number;
  uploaded_files: Array<{
    url: string;
    public_id: string;
    format: string;
    resource_type: string;
    bytes: number;
  }>; 
  status: 'pending' | 'approved' | 'denied';
  created_at: string;
  created_by: string;
  reviewed_by: string | null;
  approved_by: string | null;
  approved_at: string | null;
  documentation_verified: boolean;
  verified_by: string | null;
  verified_at: string | null;
}

interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
}

// Add DocumentPreview component (you'll need to create this or import it)
interface DocumentPreviewProps {
  filePath: string;
  onClose: () => void;
}

const DocumentPreview: React.FC<DocumentPreviewProps> = ({ filePath, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl max-h-[80vh] overflow-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Document Preview</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <XCircle className="h-6 w-6" />
          </button>
        </div>
        <iframe
          src={filePath}
          className="w-full h-96 border rounded"
          title="Document Preview"
        />
      </div>
    </div>
  );
};

export default function TransactionDetails() {
  const [modalOpen, setModalOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [creator, setCreator] = useState<User | null>(null);
  const [approver, setApprover] = useState<User | null>(null);
  const [verifier, setVerifier] = useState<User | null>(null);
  
  // Add missing state variables
  const [previewFile, setPreviewFile] = useState<string | null>(null);
  
  // Add role checks
  const isTreasury = user?.role?.toLowerCase() === 'treasury';
  const isTreasuryUser = user?.role === 'treasury' || user?.role === 'admin';
  const isTradeUser = user?.role === 'trade' || user?.role === 'admin';
  
  useEffect(() => {
    if (id) {
      fetchTransactionDetails(id);
    }
  }, [id]);

  const formatCurrency = (value: number | null | undefined): string => {
    if (value === null || value === undefined) return '0.00';
    return value.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  async function fetchTransactionDetails(transactionId: string) {
    try {
      setIsLoading(true);
      const response = await apiClient.get(`/transactions/${transactionId}`);
      const transactionData = response.data.data || response.data;
      
      setTransaction(transactionData);
      
      // Fetch creator info
      if (transactionData.created_by) {
        fetchUserInfo(transactionData.created_by, setCreator);
      }
      
      // Fetch approver info if exists
      if (transactionData.approved_by) {
        fetchUserInfo(transactionData.approved_by, setApprover);
      }
  
      // Fetch verifier info if exists
      if (transactionData.verified_by) {
        fetchUserInfo(transactionData.verified_by, setVerifier);
      }
    } catch (error) {
      toast.error('Failed to fetch transaction details');
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchUserInfo(userId: string, setUser: React.Dispatch<React.SetStateAction<User | null>>) {
    try {
      const response = await apiClient.get(`/users/${userId}`);
      setUser(response.data.data || response.data);
    } catch (error) {
      console.error('Failed to fetch user info:', error);
    }
  }

  async function updateTransactionStatus(status: 'approved' | 'denied') {
    if (!transaction?.id) {
      toast.error('Transaction ID is missing');
      return;
    }

    try {
      await apiClient.patch(`/transactions/${transaction.id}/status`, {
        status,
        reviewed_by: user?.id
      });

      toast.success(`Transaction ${status} successfully`);
      fetchTransactionDetails(transaction.id);
    } catch (error) {
      toast.error(`Failed to ${status} transaction`);
      console.error('Error:', error);
    }
  }
  
  async function verifyDocumentation() {
    if (!transaction?.id) {
      toast.error('Transaction ID is missing');
      return;
    }

    try {
      await apiClient.patch(`/transactions/${transaction.id}/verify`, {
        verified_by: user?.id
      });

      toast.success('Documentation verified successfully');
      fetchTransactionDetails(transaction.id);
    } catch (error) {
      toast.error('Failed to verify documentation');
      console.error('Error:', error);
    }
  }

  async function rejectDocumentation() {
    if (!transaction?.id) {
      toast.error('Transaction ID is missing');
      return;
    }

    try {
      await apiClient.patch(`/transactions/${transaction.id}/reject`, {
        verified_by: user?.id
      });

      toast.success('Documentation Rejected successfully');
      fetchTransactionDetails(transaction.id);
    } catch (error) {
      toast.error('Failed to verify documentation');
      console.error('Error:', error);
    }
  }

  // Add missing functions
  function openFilePreview(fileObj: { url: string; format: string }) {
  setPreviewFile(fileObj.url);
}

function closeFilePreview() {
  setPreviewFile(null);
}

function downloadFile(fileObj: { url: string; format: string }) {
  const link = document.createElement('a');
  link.href = fileObj.url;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.download = `document.${fileObj.format}`; // Optional: set filename
  link.click();
}

  function goBack() {
    navigate(-1);
  }

  // Add early return for missing ID
  if (!id) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-2">Invalid Transaction</h2>
          <p className="text-gray-600 mb-6">No transaction ID provided.</p>
          <button
            onClick={goBack}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12 flex justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading transaction details...</p>
        </div>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-2">Transaction Not Found</h2>
          <p className="text-gray-600 mb-6">The transaction you're looking for doesn't exist or you don't have permission to view it.</p>
          <button
            onClick={goBack}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 bg-gray-50">
      {/* Preview modal */}
      {previewFile && (
        <DocumentPreview 
          filePath={previewFile} 
          onClose={closeFilePreview} 
        />
      )}
      
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <button
            onClick={goBack}
            className="mr-4 p-2 rounded-full hover:bg-gray-200"
          >
            <ArrowLeft className="h-5 w-5 text-red-600" />
          </button>
          <h1 className="text-3xl font-bold text-gray-800">Transaction Details</h1>
        </div>
        
        {/* Treasury user verification button */}
        {/* <div className="flex justify-end space-x-3">
          {transaction.status === 'pending' && transaction.documentation_verified === null && isTreasuryUser && (
            <button
              onClick={verifyDocumentation}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <FileCheck className="h-5 w-5 mr-2" />
              Verify Documentation
            </button>
          )}
          {transaction.status === 'pending' && transaction.documentation_verified === null && isTreasuryUser && (
            <button
              onClick={rejectDocumentation}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-700 hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <FileCheck className="h-5 w-5 mr-2" />
              Reject Documentation
            </button>
          )}
        </div> */}
        
        {/* Trade user approval buttons - only visible if documentation is verified */}
        {transaction.status === 'pending' && 
          transaction.documentation_verified === null && 
          isTradeUser && 
          user?.email !== transaction.created_by && (
            <div className="flex space-x-3">
              <button
                onClick={() => updateTransactionStatus('approved')}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-800 hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <CheckCircle className="h-5 w-5 mr-2" />
                Approve Transaction
              </button>
              <button
                onClick={() => updateTransactionStatus('denied')}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-700 hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <XCircle className="h-5 w-5 mr-2" />
                Deny Transaction
              </button>
            </div>
          )
        }
      </div>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-red-700 to-red-600">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-white">
              {transaction.customer_name}
            </h2>
            <div className="flex items-center space-x-2">
              {/* Documentation Verification Badge */}
              {/* Show only to treasury */}
                    {isTreasury && (
                      <button
                        onClick={() => setModalOpen(true)}
                        className="mt-4 px-4 py-2 bg-green-600 text-white rounded"
                      >
                        Edit Transaction
                      </button>
                    )}
              
                    <TransactionEditModal
                      isOpen={modalOpen}
                      onClose={() => setModalOpen(false)}
                      transaction={transaction}
                      onSuccess={() => {
                        // You could refetch or update local state here
                        window.location.reload(); 
                      }}
                    />
              {/* Status Badge */}
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                transaction.status === 'approved' ? 'bg-green-200 text-green-800' :
                transaction.status === 'denied' ? 'bg-red-200 text-red-800' :
                'bg-yellow-200 text-yellow-800'
              }`}>
                {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
              </span>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white shadow-md rounded-lg p-5 border-l-4 border-red-500">
              <h3 className="text-lg font-medium text-red-700 mb-4 border-b pb-2">Customer Information</h3>
              <div className="space-y-4">
                <div className="flex flex-col">
                  <p className="text-sm font-medium text-gray-500">Customer Name</p>
                  <p className="text-base font-semibold">{transaction.customer_name || 'N/A'}</p>
                </div>
                <div className="flex flex-col">
                  <p className="text-sm font-medium text-gray-500">Customer Address</p>
                  <p className="text-base font-semibold">{transaction.customer_address || 'N/A'}</p>
                </div>
                <div className="flex flex-col">
                  <p className="text-sm font-medium text-gray-500">Sector</p>
                  <p className="text-base font-semibold">{transaction.sector || 'N/A'}</p>
                </div>
                <div className="flex flex-col">
                  <p className="text-sm font-medium text-gray-500">Nature of Business</p>
                  <p className="text-base font-semibold">{transaction.nature_of_business || 'N/A'}</p>
                </div>
                <div className="flex flex-col">
                  <p className="text-sm font-medium text-gray-500">Contact Name</p>
                  <p className="text-base font-semibold">{transaction.contact_name || 'N/A'}</p>
                </div>
                <div className="flex flex-col">
                  <p className="text-sm font-medium text-gray-500">Contact Number</p>
                  <p className="text-base font-semibold">{transaction.contact_number || 'N/A'}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white shadow-md rounded-lg p-5 border-l-4 border-green-500">
              <h3 className="text-lg font-medium text-green-700 mb-4 border-b pb-2">Financial Information</h3>
              <div className="space-y-4">
                <div className="flex flex-col">
                  <p className="text-sm font-medium text-gray-500">Amount Requested</p>
                  <p className="text-base font-semibold">${formatCurrency(transaction.amount_requested)}</p>
                </div>
                <div className="flex flex-col">
                  <p className="text-sm font-medium text-gray-500">Amount</p>
                  <p className="text-base font-semibold">${formatCurrency(transaction.amount)}</p>
                </div>
                <div className="flex flex-col">
                  <p className="text-sm font-medium text-gray-500">Cedi Balance</p>
                  <p className="text-base font-semibold">${formatCurrency(transaction.cedi_balance)}</p>
                </div>
                <div className="flex flex-col">
                  <p className="text-sm font-medium text-gray-500">Loan Limit</p>
                  <p className="text-base font-semibold">${formatCurrency(transaction.loan_limit)}</p>
                </div>
                <div className="flex flex-col">
                  <p className="text-sm font-medium text-gray-500">Loan Balance</p>
                  <p className="text-base font-semibold">${formatCurrency(transaction.loan_balance)}</p>
                </div>
                <div className="flex flex-col">
                  <p className="text-sm font-medium text-gray-500">Tenor</p>
                  <p className="text-base font-semibold">{transaction.tenor || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white shadow-md rounded-lg p-5 border-l-4 border-blue-500">
                <h3 className="text-lg font-medium text-blue-700 mb-4 border-b pb-2">Transaction Details</h3>
                <div className="space-y-4">
                  <div className="flex flex-col">
                    <p className="text-sm font-medium text-gray-500">Purpose</p>
                    <p className="text-base font-semibold">{transaction.purpose || 'N/A'}</p>
                  </div>
                  <div className="flex flex-col">
                    <p className="text-sm font-medium text-gray-500">Description</p>
                    <p className="text-base font-semibold">{transaction.description || 'N/A'}</p>
                  </div>
                  <div className="flex flex-col">
                    <p className="text-sm font-medium text-gray-500">Documentation Type</p>
                    <p className="text-base font-semibold">{transaction.documentation_type || 'N/A'}</p>
                  </div>
                  <div className="flex flex-col">
                    <p className="text-sm font-medium text-gray-500">Funding Status</p>
                    <p className="text-base font-semibold">{transaction.funding_status || 'N/A'}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white shadow-md rounded-lg p-5 border-l-4 border-purple-500">
                <h3 className="text-lg font-medium text-purple-700 mb-4 border-b pb-2">Processing Information</h3>
                <div className="space-y-4">
                  <div className="flex flex-col">
                    <p className="text-sm font-medium text-gray-500">Created By</p>
                    <p className="text-base font-semibold">{creator?.email || transaction.created_by || 'N/A'}</p>
                  </div>
                  <div className="flex flex-col">
                    <p className="text-sm font-medium text-gray-500">Created At</p>
                    <p className="text-base font-semibold">{new Date(transaction.created_at).toLocaleString() || 'N/A'}</p>
                  </div>
                  {transaction.reviewed_by && (
                    <>
                      <div className="flex flex-col">
                        <p className="text-sm font-medium text-gray-500">Approved/Denied By</p>
                        <p className="text-base font-semibold">{approver?.email || transaction.reviewed_by || 'N/A'}</p>
                      </div>
                      <div className="flex flex-col">
                        <p className="text-sm font-medium text-gray-500">Approved/Denied At</p>
                        <p className="text-base font-semibold">{transaction.approved_at ? new Date(transaction.approved_at).toLocaleString() : 'N/A'}</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Update your file rendering section */}
          {transaction.uploaded_files && transaction.uploaded_files.length > 0 && (
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Uploaded Documents</h3>
              <div className="grid grid-cols-1 gap-3">
                {transaction.uploaded_files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-5 w-5 text-blue-500" />
                      <span className="text-sm font-medium text-gray-900">
                        Document {index + 1} ({file.format?.toUpperCase()})
                      </span>
                      <span className="text-xs text-gray-500">
                        {(file.bytes / 1024 / 1024).toFixed(2)} MB
                      </span>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openFilePreview(file)}
                        className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Preview
                      </button>
                      <button
                        onClick={() => downloadFile(file)}
                        className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Status information section - now includes Verification Status */}
          {(transaction.documentation_verified || transaction.status !== 'pending') && (
            <div className="mt-8">
              <div className={`bg-white shadow-md rounded-lg p-5 border-l-4 ${
                transaction.status === 'approved' ? 'border-green-500' : 
                transaction.status === 'denied' ? 'border-red-500' : 
                'border-blue-500'
              }`}>
                <h3 className="text-lg font-medium text-gray-800 mb-4 border-b pb-2">Status Information</h3>
                
                {/* Documentation Verification Status */}
                {transaction.documentation_verified && (
                  <div className="flex items-center p-2 rounded-md bg-gray-50 mb-3">
                    <FileCheck className="h-6 w-6 text-blue-600 mr-3" />
                    <p className="text-base">
                      Documentation was <span className="font-bold">verified</span>
                      {transaction.verified_by && ` by ${verifier?.email || transaction.verified_by}`}
                      {transaction.verified_at && ` on ${new Date(transaction.verified_at).toLocaleDateString()}`}
                    </p>
                  </div>
                )}
                
                {/* Transaction Status */}
                {transaction.status !== 'pending' && (
                  <div className="flex items-center p-2 rounded-md bg-gray-50">
                    {transaction.status === 'approved' ? (
                      <CheckCircle className="h-6 w-6 text-green-600 mr-3" />
                    ) : (
                      <XCircle className="h-6 w-6 text-red-600 mr-3" />
                    )}
                    <p className="text-base">
                      This transaction was <span className="font-bold">{transaction.status}</span>
                      {transaction.approved_by && ` by ${approver?.email || transaction.approved_by}`}
                      {transaction.approved_at && ` on ${new Date(transaction.approved_at).toLocaleDateString()}`}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer with Logo */}
      <div className="mt-12 pt-4 border-t border-red-200 flex items-center justify-between">
        <div className="flex items-center">
          <img 
            src="https://lpywaflkmzwuxzpqaxgg.supabase.co/storage/v1/object/sign/documents/logo.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9hMGZmNzc1Yy1iZjY5LTRjNDYtOWYyMy04MjlkZGJhYzIyZDQiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJkb2N1bWVudHMvbG9nby5wbmciLCJpYXQiOjE3NTAwNjc2NDMsImV4cCI6MTc5MzI2NzY0M30.8vS6uWpEToikOsW6L9CMJa2SHqDvg7TL36S7FeT91SA" 
            alt="Company Logo" 
            className="h-8 mr-3" 
          />
          <p className="text-sm text-red-600">© 2025 Your Company. All rights reserved.</p>
        </div>
        <p className="text-sm text-gray-600">Admin Panel v1.0</p>
      </div>
    </div>
  );
}