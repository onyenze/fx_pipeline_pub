import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { FileText, ArrowLeft, CheckCircle, XCircle, Download, Eye, FileCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import DocumentPreview from '../pages/documentPreview';

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
  tenure: string;
  uploaded_files: string[];
  status: 'pending' | 'approved' | 'denied';
  created_at: string;
  created_by: string;
  reviewed_by: string | null;
  approved_by: string | null;
  approved_at: string | null;
  // New field for documentation verification
  documentation_verified: boolean;
  verified_by: string | null;
  verified_at: string | null;
}

interface User {
  id: string;
  full_name?: string;
  email?: string;
}

export default function TransactionDetails() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [creator, setCreator] = useState<User | null>(null);
  const [approver, setApprover] = useState<User | null>(null);
  const [verifier, setVerifier] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  
  // State for document preview
  const [previewFile, setPreviewFile] = useState<string | null>(null);
  
  useEffect(() => {
    if (id) {
      fetchTransactionDetails(id);
    }
    if (user?.id) {
      fetchCurrentUserRole();
    }
  }, [id, user?.id]);
  
  // Format number with commas for thousands and 2 decimal places
  const formatCurrency = (value: number | null | undefined): string => {
    if (value === null || value === undefined) return '0.00';
    return value.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };
  
  async function fetchCurrentUserRole() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user?.id)
        .single();
        
      if (error) throw error;
      if (data) setUserRole(data.role);
    } catch (error) {
      console.error('Error fetching user role:', error);
    }
  }

  async function fetchTransactionDetails(transactionId: string) {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', transactionId)
        .single();

      if (error) throw error;
      
      setTransaction(data);
      
      // Fetch creator user info
      if (data.created_by) {
        fetchUserInfo(data.created_by, 'creator');
      }
      
      // Fetch approver user info if exists
      if (data.approved_by) {
        fetchUserInfo(data.approved_by, 'approver');
      }
      
      // Fetch verifier user info if exists
      if (data.verified_by) {
        fetchUserInfo(data.verified_by, 'verifier');
      }
    } catch (error) {
      toast.error('Failed to fetch transaction details');
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchUserInfo(userId: string, userType: 'creator' | 'approver' | 'verifier') {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('id', userId)
        .single();

      if (error) throw error;
      
      if (userType === 'creator') {
        setCreator(data);
      } else if (userType === 'approver') {
        setApprover(data);
      } else if (userType === 'verifier') {
        setVerifier(data);
      }
    } catch (error) {
      console.error(`Failed to fetch ${userType} info:`, error);
    }
  }

  async function updateTransactionStatus(status: 'approved' | 'denied') {
    try {
      const { error } = await supabase
        .from('transactions')
        .update({ 
          status,
          approved_by: user?.id,
          approved_at: new Date().toISOString()
        })
        .eq('id', transaction?.id);

      if (error) throw error;

      toast.success(`Transaction ${status} successfully`);
      fetchTransactionDetails(transaction?.id as string);
    } catch (error) {
      toast.error(`Failed to ${status} transaction`);
      console.error('Error:', error);
    }
  }
  
  async function verifyDocumentation() {
    try {
      const { error } = await supabase
        .from('transactions')
        .update({ 
          documentation_verified: true,
          verified_by: user?.id,
          verified_at: new Date().toISOString()
        })
        .eq('id', transaction?.id);

      if (error) throw error;

      toast.success('Documentation verified successfully');
      fetchTransactionDetails(transaction?.id as string);
    } catch (error) {
      toast.error('Failed to verify documentation');
      console.error('Error:', error);
    }
  }

  async function downloadFile(filePath: string) {
    const bucketName = 'documents';
    const cleanFilePath = filePath.startsWith('/') ? filePath.slice(1) : filePath;
    console.log(cleanFilePath);
  
    try {
      // Step 1: Detect if bucket is public or private
      const { data: bucket, error: bucketError } = await supabase.storage.getBucket(bucketName);
      console.log(bucket);
      
      if (bucketError || !bucket) {
        toast.error('Bucket not found or could not be retrieved');
        return;
      }
  
      const isPublic = bucket.public;
      console.log(`Bucket visibility: ${isPublic ? 'Public' : 'Private'}`);
  
      // Step 2: Handle public buckets
      if (isPublic) {
        const { data: publicUrlData } = supabase.storage.from(bucketName).getPublicUrl(cleanFilePath);
        if (publicUrlData?.publicUrl) {
          window.open(publicUrlData.publicUrl, '_blank');
          return;
        } else {
          toast.error('Failed to get public URL');
          return;
        }
      }
  
      // Step 3: Handle private bucket — try signed URL first
      const { data: signedData, error: signedError } = await supabase.storage
        .from(bucketName)
        .createSignedUrl(cleanFilePath, 60);
        console.log(cleanFilePath);
        
  
      if (signedData?.signedUrl) {
        window.open(signedData.signedUrl, '_blank');
        return;
      }
  
      console.warn('Signed URL failed, attempting fallback download via blob:', signedError);
  
      // Step 4: Fallback — download file as blob
      const { data: blobData, error: blobError } = await supabase.storage
        .from(bucketName)
        .download(cleanFilePath);
  
      if (blobError || !blobData) {
        toast.error('Fallback download failed: ' + (blobError?.message || 'File not found'));
        return;
      }
  
      // Create a download link from the blob
      const blobUrl = URL.createObjectURL(blobData);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = cleanFilePath.split('/').pop() || 'download';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
  
      toast.success('File downloaded via fallback method');
    } catch (err) {
      console.error('Unexpected error during download:', err);
      toast.error('Unexpected error occurred during download');
    }
  }
  
  // Function to preview a file
  function openFilePreview(filePath: string) {
    setPreviewFile(filePath);
  }
  
  // Function to close the preview
  function closeFilePreview() {
    setPreviewFile(null);
  }

  function goBack() {
    navigate(-1);
  }

  // Check if the current user is a treasury user
  const isTreasuryUser = userRole === 'treasury';
  
  // Check if the current user is a trade user
  const isTradeUser = userRole === 'trade';

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
        {transaction.status === 'pending' && !transaction.documentation_verified && isTreasuryUser && (
          <div className="flex space-x-3">
            <button
              onClick={verifyDocumentation}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <FileCheck className="h-5 w-5 mr-2" />
              Verify Documentation
            </button>
          </div>
        )}
        
        {/* Trade user approval buttons - only visible if documentation is verified */}
        {transaction.status === 'pending' && 
          transaction.documentation_verified && 
          isTradeUser && 
          user?.id !== transaction.created_by && (
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
              {transaction.documentation_verified && (
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-200 text-blue-800 mr-2">
                  Verified Documentation
                </span>
              )}
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
                  <p className="text-sm font-medium text-gray-500">Tenure</p>
                  <p className="text-base font-semibold">{transaction.tenure || 'N/A'}</p>
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
                    <p className="text-base font-semibold">{creator?.full_name || 'N/A'}</p>
                  </div>
                  <div className="flex flex-col">
                    <p className="text-sm font-medium text-gray-500">Created At</p>
                    <p className="text-base font-semibold">{new Date(transaction.created_at).toLocaleString() || 'N/A'}</p>
                  </div>
                  {transaction.documentation_verified && (
                    <>
                      <div className="flex flex-col">
                        <p className="text-sm font-medium text-gray-500">Verified By</p>
                        <p className="text-base font-semibold">{verifier?.email || 'N/A'}</p>
                      </div>
                      <div className="flex flex-col">
                        <p className="text-sm font-medium text-gray-500">Verified At</p>
                        <p className="text-base font-semibold">{transaction.verified_at ? new Date(transaction.verified_at).toLocaleString() : 'N/A'}</p>
                      </div>
                    </>
                  )}
                  {transaction.approved_by && (
                    <>
                      <div className="flex flex-col">
                        <p className="text-sm font-medium text-gray-500">Approved/Denied By</p>
                        <p className="text-base font-semibold">{approver?.full_name || 'N/A'}</p>
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
          
          {transaction.uploaded_files && transaction.uploaded_files.length > 0 && (
            <div className="mt-8">
              <div className="bg-white shadow-md rounded-lg p-5 border-l-4 border-yellow-500">
                <h3 className="text-lg font-medium text-yellow-700 mb-4 border-b pb-2">Uploaded Documents</h3>
                <div className="mt-4">
                  <ul className="divide-y divide-gray-200">
                    {transaction.uploaded_files.map((file, index) => {
                      const fileName = file.split('/').pop() || `Document ${index + 1}`;
                      return (
                        <li key={index} className="py-3 flex justify-between items-center hover:bg-gray-50 rounded-md px-2">
                          <div className="flex items-center">
                            <FileText className="h-5 w-5 text-red-500 mr-3" />
                            <p className="text-sm font-medium text-gray-800">{fileName}</p>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => openFilePreview(file)}
                              className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                            >
                              <Eye className="h-4 w-4 mr-1 text-red-500" />
                              Preview
                            </button>
                            <button
                              onClick={() => downloadFile(file)}
                              className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                            >
                              <Download className="h-4 w-4 mr-1 text-red-500" />
                              Download
                            </button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
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
                      {verifier && ` by ${verifier.email}`}
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
                      {approver && ` by ${approver.full_name}`}
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
            src="https://lpywaflkmzwuxzpqaxgg.supabase.co/storage/v1/object/sign/documents/logo.png?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InN0b3JhZ2UtdXJsLXNpZ25pbmcta2V5XzdkYjlmN2VlLWE2NGUtNDE3Ny04Y2U0LTY3YmFjZDU5MmYwZCJ9.eyJ1cmwiOiJkb2N1bWVudHMvbG9nby5wbmciLCJpYXQiOjE3NDY2MzI4MjgsImV4cCI6MTgzMzAzMjgyOH0.A4lhanGiT9JBdaWZSUYiCO7-Q7QJJQGzrC3NDYdEOlY" 
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