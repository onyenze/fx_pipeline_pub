import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { PlusCircle, Upload, ArrowRightCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

interface Transaction {
  id: string;
  amount: number;
  description: string | null;
  customer_name: string;
  customer_address: string; // New field
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
  tenor: number; // New field
  uploaded_files: string[];
  status: 'pending' | 'approved' | 'denied';
  created_at: string;
  created_by: string;
  reviewed_by: string | null;
  approved_at: string | null;
}

export default function MarketingDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [newTransaction, setNewTransaction] = useState({
    amount: '',
    description: '',
    customer_name: '',
    customer_address: '', // New field
    sector: '',
    nature_of_business: '',
    contact_name: '',
    contact_number: '',
    amount_requested: '',
    cedi_balance: '',
    loan_limit: '',
    loan_balance: '',
    documentation_type: '',
    funding_status: '',
    tenor: '2', // New field with default value
    purpose: ''
  });
  
  function navigateToTransactionDetails(transactionId: string) {
    navigate(`/transactions/${transactionId}`);
  }
  
  function navigateToTreasuryDashboard() {
    navigate('/treasury');
  }
  
  // Options for dropdown selectors
  const sectorOptions = ['Agriculture', 'Manufacturing', 'Services', 'Technology', 'Retail', 'Construction', 'Other'];
  const documentationTypes = ['Formal', 'Informal', 'Semi-Formal', 'None'];
  const fundingStatusOptions = ['Pending', 'Funded', 'Rejected', 'On Hold'];
  const tenorOptions = [2, 7]; // New options for tenor

  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    fetchTransactions();
    if (user?.id) {
      fetchUserRole();
    }
  }, [fetchUserRole, user?.id]);
  
  async function fetchTransactions() {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false });
  
      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      toast.error('Failed to fetch transactions');
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  }
  
  async function fetchUserRole() {
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

  async function uploadFiles() {
    const uploadedFilePaths = [];
    
    for (const file of files) {
      const filePath = `${Date.now()}_${file.name}`;
      
      const { error: uploadError } = await supabase
        .storage
        .from('documents')
        .upload(filePath, file);
        
      if (uploadError) {
        throw uploadError;
      }
      
      uploadedFilePaths.push(filePath);
    }
    
    return uploadedFilePaths;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // First upload files if any
      let uploadedFilePaths: string[] = [];
      if (files.length > 0) {
        uploadedFilePaths = await uploadFiles();
      }
      
      // Then create transaction record
      const { error } = await supabase
        .from('transactions')
        .insert([{
          amount: parseFloat(newTransaction.amount),
          description: newTransaction.description,
          customer_name: newTransaction.customer_name,
          customer_address: newTransaction.customer_address, // New field
          sector: newTransaction.sector,
          nature_of_business: newTransaction.nature_of_business,
          contact_name: newTransaction.contact_name,
          contact_number: newTransaction.contact_number,
          amount_requested: parseFloat(newTransaction.amount_requested),
          cedi_balance: parseFloat(newTransaction.cedi_balance),
          loan_limit: parseFloat(newTransaction.loan_limit),
          loan_balance: parseFloat(newTransaction.loan_balance),
          documentation_type: newTransaction.documentation_type,
          funding_status: newTransaction.funding_status,
          tenor: parseInt(newTransaction.tenor), // New field
          purpose: newTransaction.purpose,
          uploaded_files: uploadedFilePaths,
          status: 'pending',
          created_by: user?.id,
          created_at: new Date().toISOString(),
        }]);

      if (error) throw error;

      toast.success('Transaction created successfully');
      // Reset form
      setNewTransaction({
        amount: '',
        description: '',
        customer_name: '',
        customer_address: '', // New field
        sector: '',
        nature_of_business: '',
        contact_name: '',
        contact_number: '',
        amount_requested: '',
        cedi_balance: '',
        loan_limit: '',
        loan_balance: '',
        documentation_type: '',
        funding_status: '',
        tenor: '2', // New field reset
        purpose: ''
      });
      setFiles([]);
      fetchTransactions();
    } catch (error) {
      toast.error('Failed to create transaction');
      console.error('Error:', error);
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      const fileList = Array.from(e.target.files);
      setFiles(prevFiles => [...prevFiles, ...fileList]);
    }
  }

  function removeFile(index: number) {
    setFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
  }

  // Format number with commas for thousands
  const formatNumber = (value: number | string) => {
    if (!value) return "0.00";
    
    // Convert to number if it's a string
    const num = typeof value === 'string' ? parseFloat(value) : value;
    
    // Format with commas and two decimal places
    return num.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 bg-gray-50">
      <div className="mb-8 flex justify-between items-center">
        
        <div className="flex items-center">
          <img 
            src="https://lpywaflkmzwuxzpqaxgg.supabase.co/storage/v1/object/sign/documents/logo.png?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InN0b3JhZ2UtdXJsLXNpZ25pbmcta2V5XzdkYjlmN2VlLWE2NGUtNDE3Ny04Y2U0LTY3YmFjZDU5MmYwZCJ9.eyJ1cmwiOiJkb2N1bWVudHMvbG9nby5wbmciLCJpYXQiOjE3NDY2MzI4MjgsImV4cCI6MTgzMzAzMjgyOH0.A4lhanGiT9JBdaWZSUYiCO7-Q7QJJQGzrC3NDYdEOlY" 
            alt="Company Logo" 
            className="h-12 mr-4"
          />
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Marketing Dashboard</h1>
            <p className="mt-2 text-gray-600">Create and manage loan transactions</p>
          </div>
        </div>
        
        {/* Treasury Dashboard Button */}
        {userRole !== "marketing" && (
        <button
          onClick={navigateToTreasuryDashboard}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          <ArrowRightCircle className="h-5 w-5 mr-2" />
          Go to Treasury Dashboard
        </button>
      )}
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-8 border-t-4 border-red-500">
        <h2 className="text-xl font-semibold mb-6 text-gray-800">New Transaction</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Amount field */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">$</span>
                </div>
                <input
                  type="number"
                  required
                  step="0.01"
                  value={newTransaction.amount}
                  onChange={(e) => setNewTransaction(prev => ({ ...prev, amount: e.target.value }))}
                  className="focus:ring-red-500 focus:border-red-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md py-3"
                  placeholder="0.00"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
              <input
                type="text"
                required
                value={newTransaction.customer_name}
                onChange={(e) => setNewTransaction(prev => ({ ...prev, customer_name: e.target.value }))}
                className="mt-1 focus:ring-red-500 focus:border-red-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md py-3"
                placeholder="Enter customer name"
              />
            </div>
            
            {/* New Customer Address field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer Address</label>
              <input
                type="text"
                required
                value={newTransaction.customer_address}
                onChange={(e) => setNewTransaction(prev => ({ ...prev, customer_address: e.target.value }))}
                className="mt-1 focus:ring-red-500 focus:border-red-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md py-3"
                placeholder="Enter customer address"
              />
            </div>
            
            {/* Business Information */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sector</label>
              <select
                required
                value={newTransaction.sector}
                onChange={(e) => setNewTransaction(prev => ({ ...prev, sector: e.target.value }))}
                className="mt-1 focus:ring-red-500 focus:border-red-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md py-3"
              >
                <option value="">Select a sector</option>
                {sectorOptions.map((sector) => (
                  <option key={sector} value={sector}>{sector}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nature of Business</label>
              <input
                type="text"
                required
                value={newTransaction.nature_of_business}
                onChange={(e) => setNewTransaction(prev => ({ ...prev, nature_of_business: e.target.value }))}
                className="mt-1 focus:ring-red-500 focus:border-red-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md py-3"
                placeholder="Describe business nature"
              />
            </div>
            
            {/* Contact Information */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Name</label>
              <input
                type="text"
                required
                value={newTransaction.contact_name}
                onChange={(e) => setNewTransaction(prev => ({ ...prev, contact_name: e.target.value }))}
                className="mt-1 focus:ring-red-500 focus:border-red-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md py-3"
                placeholder="Primary contact name"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
              <input
                type="text"
                required
                value={newTransaction.contact_number}
                onChange={(e) => setNewTransaction(prev => ({ ...prev, contact_number: e.target.value }))}
                className="mt-1 focus:ring-red-500 focus:border-red-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md py-3"
                placeholder="Phone number"
              />
            </div>
            
            {/* Financial Information */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount Requested</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">$</span>
                </div>
                <input
                  type="number"
                  required
                  step="0.01"
                  value={newTransaction.amount_requested}
                  onChange={(e) => setNewTransaction(prev => ({ ...prev, amount_requested: e.target.value }))}
                  className="focus:ring-red-500 focus:border-red-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md py-3"
                  placeholder="0.00"
                />
              </div>
            </div>
            
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">Cedi Balance</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">₵</span>
                </div>
                <input
                  type="number"
                  required
                  step="0.01"
                  value={newTransaction.cedi_balance}
                  onChange={(e) => setNewTransaction(prev => ({ ...prev, cedi_balance: e.target.value }))}
                  className="focus:ring-red-500 focus:border-red-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md py-3"
                  placeholder="0.00"
                />
              </div>
            </div>
            
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">Loan Limit</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">$</span>
                </div>
                <input
                  type="number"
                  required
                  step="0.01"
                  value={newTransaction.loan_limit}
                  onChange={(e) => setNewTransaction(prev => ({ ...prev, loan_limit: e.target.value }))}
                  className="focus:ring-red-500 focus:border-red-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md py-3"
                  placeholder="0.00"
                />
              </div>
            </div>
            
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">Loan Balance</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">$</span>
                </div>
                <input
                  type="number"
                  required
                  step="0.01"
                  value={newTransaction.loan_balance}
                  onChange={(e) => setNewTransaction(prev => ({ ...prev, loan_balance: e.target.value }))}
                  className="focus:ring-red-500 focus:border-red-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md py-3"
                  placeholder="0.00"
                />
              </div>
            </div>
            
            {/* Documentation and Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Documentation Type</label>
              <select
                required
                value={newTransaction.documentation_type}
                onChange={(e) => setNewTransaction(prev => ({ ...prev, documentation_type: e.target.value }))}
                className="mt-1 focus:ring-red-500 focus:border-red-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md py-3"
              >
                <option value="">Select documentation type</option>
                {documentationTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Funding Status</label>
              <select
                required
                value={newTransaction.funding_status}
                onChange={(e) => setNewTransaction(prev => ({ ...prev, funding_status: e.target.value }))}
                className="mt-1 focus:ring-red-500 focus:border-red-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md py-3"
              >
                <option value="">Select funding status</option>
                {fundingStatusOptions.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>

            {/* New tenor field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tenor (Days)</label>
              <select
                required
                value={newTransaction.tenor}
                onChange={(e) => setNewTransaction(prev => ({ ...prev, tenor: e.target.value }))}
                className="mt-1 focus:ring-red-500 focus:border-red-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md py-3"
              >
                {tenorOptions.map((days) => (
                  <option key={days} value={days}>{days} days</option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Purpose - Full width */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Purpose</label>
            <textarea
              required
              value={newTransaction.purpose}
              onChange={(e) => setNewTransaction(prev => ({ ...prev, purpose: e.target.value }))}
              className="mt-1 focus:ring-red-500 focus:border-red-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
              rows={3}
              placeholder="Describe the purpose of this transaction"
            />
          </div>
          
          {/* Description - Full width */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Additional Description</label>
            <textarea
              value={newTransaction.description}
              onChange={(e) => setNewTransaction(prev => ({ ...prev, description: e.target.value }))}
              className="mt-1 focus:ring-red-500 focus:border-red-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
              rows={3}
              placeholder="Any additional notes or details"
            />
          </div>
          
          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Upload Documents</label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-red-400 transition-colors">
              <div className="space-y-1 text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="flex text-sm text-gray-600">
                  <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-red-600 hover:text-red-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-red-500">
                    <span>Upload files</span>
                    <input 
                      id="file-upload" 
                      name="file-upload" 
                      type="file" 
                      multiple 
                      className="sr-only" 
                      onChange={handleFileChange} 
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">Any file up to 10MB</p>
              </div>
            </div>
            
            {/* Display selected files */}
            {files.length > 0 && (
              <div className="mt-2">
                <h4 className="text-sm font-medium text-gray-700">Selected files:</h4>
                <ul className="mt-1 space-y-1">
                  {files.map((file, index) => (
                    <li key={index} className="flex items-center justify-between py-2 px-3 text-sm text-gray-600 bg-gray-50 rounded-md">
                      <span className="truncate">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="ml-2 flex-shrink-0 text-red-500 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          
          <div className="pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:bg-red-300 transition-colors w-full md:w-auto justify-center"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : (
                <>
                  <PlusCircle className="h-5 w-5 mr-2" />
                  Create Transaction
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden border-t-4 border-gray-500">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-100">
          <h2 className="text-xl font-semibold text-gray-800">Recent Transactions</h2>
        </div>
        {isLoading ? (
          <div className="p-6 text-center text-gray-500">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-600 mx-auto mb-2"></div>
            Loading transactions...
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-6 text-center text-gray-500">No transactions found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Customer Details</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Loan Information</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Created</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.map((transaction) => (
                  <tr 
                    key={transaction.id} 
                    onClick={() => navigateToTransactionDetails(transaction.id)}
                    className="cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{transaction.customer_name}</div>
                      <div className="text-sm text-gray-500">{transaction.contact_name}</div>
                      <div className="text-sm text-gray-500">{transaction.contact_number}</div>
                      {/* Display customer address if available */}
                      {transaction.customer_address && (
                        <div className="text-sm text-gray-500">{transaction.customer_address}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">Amount: ${formatNumber(transaction.amount)}</div>
                      <div className="text-sm text-gray-500">Purpose: {transaction.purpose}</div>
                      <div className="text-sm text-gray-500">Sector: {transaction.sector}</div>
                      {/* Display tenor if available */}
                      {transaction.tenor && (
                        <div className="text-sm text-gray-500">tenor: {transaction.tenor} days</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        transaction.status === 'approved' ? 'bg-green-100 text-green-800' :
                        transaction.status === 'denied' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {transaction.status}
                      </span>
                      <div className="text-xs text-gray-500 mt-1">
                        Funding: {transaction.funding_status}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(transaction.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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