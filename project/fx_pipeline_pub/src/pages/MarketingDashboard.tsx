import { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { PlusCircle, Upload, ArrowRightCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/client';

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
  uploaded_files: string[];
  status: 'pending' | 'approved' | 'denied';
  created_at: string;
  created_by: string;
  reviewed_by: string | null;
  approved_at: string | null;
}


export default function MarketingDashboard() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalTransactions, setTotalTransactions] = useState(0);
  
  const [newTransaction, setNewTransaction] = useState({
    amount: '',
    description: '',
    customer_name: '',
    customer_address: '',
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
    tenor: '2',
    purpose: ''
  });
  
  function navigateToTransactionDetails(transactionId: string) {
    navigate(`/transactions/${transactionId}`);
  }
  
  function navigateToTreasuryDashboard() {
    navigate('/treasury');
  }
  
  // Options for dropdown selectors
  const sectorOptions = ['BOND SALE', 'BOND COUPON', 'BOND MATURITY', 'COMMERCE', 'ENERGY', 'MANUFACTURING', 'FMCG','AGRICULTURE FORESTRY & FISHING', 'SERVICE', 'TRANSPORT', 'TELECOM', 'EDUCATION', 'CONSTRUCTION', 'DIVIDEND', 'MINING', 'AUTOMOBILE', 'PHARMACEUTICALS', 'MISCELLANEOUS'];
  const documentationTypes = ['Formal', 'Informal', 'Semi-Formal', 'None'];
  const fundingStatusOptions = ['Pending', 'Funded', 'Rejected', 'On Hold'];
  const tenorOptions = [2, 7]; // New options for tenor

  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    fetchTransactions();
  }, [currentPage]); // Re-fetch when page changes

const formatNumberInput = (value: string) => {
  const rawValue = value.replace(/,/g, ''); // Remove commas
  if (!isNaN(Number(rawValue)) || rawValue === '') {
    const parts = rawValue.split('.');
    const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    const decimalPart = parts[1] ? `.${parts[1]}` : '';
    return `${integerPart}${decimalPart}`;
  }
  return value;
};

  
  async function fetchTransactions() {
    try {
      setIsLoading(true);
      const response = await apiClient.get(`/transactions?page=${currentPage}&limit=${itemsPerPage}`);
      
      // Handle different response structures
      let transactionsData = [];
      let total = 0;
      
      if (Array.isArray(response.data)) {
        transactionsData = response.data;
        total = response.data.length;
      } else if (Array.isArray(response.data.data)) {
        transactionsData = response.data.data;
        total = response.data.total || response.data.data.length;
      } else if (response.data.transactions) {
        transactionsData = response.data.transactions;
        total = response.data.total || response.data.transactions.length;
      }
      
      setTransactions(transactionsData);
      setTotalTransactions(total);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast.error('Failed to load transactions');
      setTransactions([]); // Set to empty array on error
      setTotalTransactions(0);
    } finally {
      setIsLoading(false);
    }
  }
  function formatAmount(amount: number): string {
  return '$' + amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const formData = new FormData();
      
      // Append all transaction data
      Object.entries(newTransaction).forEach(([key, value]) => {
        formData.append(key, value);
      });
      
      // Append files
      files.forEach(file => {
        formData.append('uploaded_files', file);
      });

      const response = await apiClient.post('/transactions', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      toast.success('Transaction created successfully');
      
      // Reset form
      setNewTransaction({
        amount: '',
        description: '',
        customer_name: '',
        customer_address: '',
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
        tenor: '2',
        purpose: ''
      });
      setFiles([]);
      
      // Reset to first page and fetch transactions
      setCurrentPage(1);
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

  // Pagination calculations
  const totalPages = Math.ceil(totalTransactions / itemsPerPage);
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalTransactions);

  // Pagination handlers
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      let startPage = Math.max(1, currentPage - 2);
      let endPage = Math.min(totalPages, currentPage + 2);
      
      if (currentPage <= 3) {
        endPage = Math.min(totalPages, 5);
      } else if (currentPage >= totalPages - 2) {
        startPage = Math.max(1, totalPages - 4);
      }
      
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  };
// Create this handler function in your component
const handleNumberInput = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
  const inputValue = e.target.value;
  const rawValue = inputValue.replace(/,/g, '');
  
  if (!isNaN(Number(rawValue)) || rawValue === '') {
    setNewTransaction(prev => ({ ...prev, [field]: rawValue }));
  }
};
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
            src="https://lpywaflkmzwuxzpqaxgg.supabase.co/storage/v1/object/sign/documents/logo.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9hMGZmNzc1Yy1iZjY5LTRjNDYtOWYyMy04MjlkZGJhYzIyZDQiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJkb2N1bWVudHMvbG9nby5wbmciLCJpYXQiOjE3NTAwNjc2NDMsImV4cCI6MTc5MzI2NzY0M30.8vS6uWpEToikOsW6L9CMJa2SHqDvg7TL36S7FeT91SA" 
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
                  type="text"
                  required
                  value={formatNumberInput(newTransaction.amount)}
                  onChange={handleNumberInput('amount')}
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
                onChange={(e) => {
                  const input = e.target.value;
                  const capitalized = input.toUpperCase();
                  setNewTransaction(prev => ({
                    ...prev,
                    customer_name: capitalized
                  }));
                }}
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
                onChange={(e) => {
                  const input = e.target.value;
                  const capitalized = input.toUpperCase();
                  setNewTransaction(prev => ({ ...prev, customer_address: capitalized }))
              }}
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
                onChange={(e) => {
                  const input = e.target.value;
                  const capitalized = input.toUpperCase();
                  setNewTransaction(prev => ({ ...prev, nature_of_business: capitalized }))
                }}
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
                onChange={(e) => {
                  const input = e.target.value;
                  const capitalized = input.toUpperCase();
                  setNewTransaction(prev => ({ ...prev, contact_name: capitalized }))
                }}
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
                  type="text"
                  value={formatNumberInput(newTransaction.amount_requested)}
                  onChange={handleNumberInput('amount_requested')}
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
                  type="text"
                  value={formatNumberInput(newTransaction.cedi_balance)}
                  onChange={handleNumberInput('cedi_balance')}
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
                  type="text"
                  value={formatNumberInput(newTransaction.loan_limit)}
                  onChange={handleNumberInput('loan_limit')}
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
                  type="text"
                  value={formatNumberInput(newTransaction.loan_balance)}
                  onChange={handleNumberInput('loan_balance')}
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
              <input
                required
                type="number"
                value={newTransaction.tenor}
                onChange={(e) =>
                  setNewTransaction((prev) => ({ ...prev, tenor: e.target.value }))
                }
                list="tenorOptions"
                className="mt-1 focus:ring-red-500 focus:border-red-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md py-3"
                placeholder="Enter or select tenor"
              />
              <datalist id="tenorOptions">
                {tenorOptions.map((days) => (
                  <option key={days} value={days}>
                    {days}
                  </option>
                ))}
              </datalist>
            </div>
          </div>
          
          {/* Purpose - Full width */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Purpose</label>
            <textarea
              required
              value={newTransaction.purpose}
              onChange={(e) => {
                const input = e.target.value;
                const capitalized = input.toUpperCase();
                setNewTransaction(prev => ({ ...prev, purpose: capitalized }))}}
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
                <p className="text-xs text-gray-500">Any file up to 30MB</p>
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
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-100 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">Recent Transactions</h2>
          {totalTransactions > 0 && (
            <p className="text-sm text-gray-600">
              Showing {startItem}-{endItem} of {totalTransactions} transactions
            </p>
          )}
        </div>
        {isLoading ? (
          <div className="p-6 text-center text-gray-500">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-600 mx-auto mb-2"></div>
            Loading transactions...
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-6 text-center text-gray-500">No transactions found</div>
        ) : (
          <>
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
                        <div className="text-sm text-gray-900">Amount: ${Number(transaction.amount).toLocaleString("en-US", {
                                    minimumFractionDigits: 2,
                                  })}
                        </div>
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
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm text-gray-700">
                    <span>
                      Showing <span className="font-medium">{startItem}</span> to{' '}
                      <span className="font-medium">{endItem}</span> of{' '}
                      <span className="font-medium">{totalTransactions}</span> results
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {/* Previous button */}
                    <button
                      onClick={goToPreviousPage}
                      disabled={currentPage === 1}
                      className={`relative inline-flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                        currentPage === 1
                          ? 'text-gray-400 cursor-not-allowed'
                          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                      } border border-gray-300 bg-white`}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </button>
                    
                    {/* Page numbers */}
                    <div className="flex items-center space-x-1">
                      {getPageNumbers().map((pageNum) => (
                        <button
                          key={pageNum}
                          onClick={() => goToPage(pageNum)}
                          className={`relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                            currentPage === pageNum
                              ? 'bg-red-600 text-white border-red-600'
                              : 'text-gray-700 bg-white border-gray-300 hover:bg-gray-50 hover:text-gray-900'
                          } border`}
                        >
                          {pageNum}
                        </button>
                      ))}
                    </div>
                    
                    {/* Next button */}
                    <button
                      onClick={goToNextPage}
                      disabled={currentPage === totalPages}
                      className={`relative inline-flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                        currentPage === totalPages
                          ? 'text-gray-400 cursor-not-allowed'
                          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                      } border border-gray-300 bg-white`}
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </button>
                  </div>
                </div>
                
                {/* Items per page selector (optional) */}
                <div className="mt-4 flex items-center justify-center">
                  <label className="text-sm text-gray-700 mr-2">Items per page:</label>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      const newItemsPerPage = parseInt(e.target.value);
                      setCurrentPage(1); // Reset to first page
                      // You would need to make itemsPerPage a state variable to use this
                      // For now, it's commented out since itemsPerPage is const
                      setItemsPerPage(newItemsPerPage);
                    }}
                    className="text-sm border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
                    disabled // Remove this when you make itemsPerPage dynamic
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </div>
              </div>
            )}
          </>
        )}
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