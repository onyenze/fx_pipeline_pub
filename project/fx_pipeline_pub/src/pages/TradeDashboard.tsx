import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../lib/auth';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/client';

interface Transaction {
  id: string;
  amount: number;
  description: string | null;
  customer_name: string;
  status: 'pending' | 'approved' | 'denied';
  created_at: string;
  created_by: string;
  sector: string;
}

export default function TradeDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'denied'>('pending');
  const [totalAmount, setTotalAmount] = useState(0);
  const [pendingAmount, setPendingAmount] = useState(0);
  const [approvedAmount, setApprovedAmount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
const [totalPages, setTotalPages] = useState(1);
const [totalItems, setTotalItems] = useState(0); // optional
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'denied'>('all');
  const [page, setPage] = useState(1);


useEffect(() => {
    fetchTransactions();
  }, []);
  // Use useCallback to memoize the fetchTransactions function
    async function fetchTransactions(currentPage = 1) {
    try {
      setIsLoading(true);
  
      const response = await apiClient.get(`/transactions?page=${currentPage}&size=10`);
  
      const data = response.data.data || response.data;
  
      if (Array.isArray(data)) {
        setTransactions(data);
      } else if (Array.isArray(data.transactions)) {
        setTransactions(data.transactions);
        setTotalPages(data.totalPages || 1);
      } else {
        setTransactions([]);
      }
  
      setPage(currentPage);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast.error('Failed to load transactions');
      setTransactions([]);
    } finally {
      setIsLoading(false);
    }
  }

 // Format amount with thousand separators
  function formatAmount(amount: number): string {
  return '$' + amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function calculateTotalAmount(status?: 'pending' | 'approved' | 'denied') {
  const total = transactions
    .filter(t => !status || t.status === status)
    .reduce((sum, transaction) => sum + Number(transaction.amount), 0);
  
  return formatAmount(total);
}
  // Optional: If you want to add back the status update functionality using the API
  async function handleStatusUpdate(e: React.MouseEvent, transactionId: string, newStatus: 'approved' | 'denied') {
    // Prevent the click from propagating to the row and navigating
    e.stopPropagation();
    
    try {
      await apiClient.put(`/transactions/${transactionId}/status`, {
        status: newStatus,
        approved_by: user?.id
      });

      toast.success(`Transaction ${newStatus} successfully`);
      fetchTransactions();
    } catch (error) {
      console.error('Error updating transaction status:', error);
      toast.error(`Failed to ${newStatus} transaction`);
    }
  }
  
  function navigateToTransactionDetails(transactionId: string) {
    navigate(`/transactions/${transactionId}`);
  }


  // Type-safe onChange handler for the select
  const handleStatusFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as 'all' | 'pending' | 'approved' | 'denied';
    setStatusFilter(value);
  };

  return (
    <div className="container mx-auto px-4 py-8 bg-gray-50">
      <div className="flex items-center">
          <img 
            src="https://lpywaflkmzwuxzpqaxgg.supabase.co/storage/v1/object/sign/documents/logo.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9hMGZmNzc1Yy1iZjY5LTRjNDYtOWYyMy04MjlkZGJhYzIyZDQiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJkb2N1bWVudHMvbG9nby5wbmciLCJpYXQiOjE3NTAwNjc2NDMsImV4cCI6MTc5MzI2NzY0M30.8vS6uWpEToikOsW6L9CMJa2SHqDvg7TL36S7FeT91SA" 
            alt="Company Logo" 
            className="h-12 mr-4"
          />
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800">Trade Dashboard</h1>
            <p className="mt-2 text-gray-600">Review and manage transactions</p>
          </div>
      </div>
      
      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500 hover:shadow-lg transition-all">
          <h3 className="text-lg font-medium mb-2 text-gray-700">Total Transactions</h3>
          <p className="text-3xl font-bold text-blue-600">{calculateTotalAmount()}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-yellow-500 hover:shadow-lg transition-all">
          <h3 className="text-lg font-medium mb-2 text-gray-700">Pending Approval</h3>
          <p className="text-3xl font-bold text-yellow-600">{calculateTotalAmount('pending')}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500 hover:shadow-lg transition-all">
          <h3 className="text-lg font-medium mb-2 text-gray-700">Approved Transactions</h3>
          <p className="text-3xl font-bold text-green-600">{calculateTotalAmount('approved')}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="flex gap-2">
            <button 
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-md ${filter === 'all' ? 'bg-red-100 text-red-800' : 'bg-gray-200 text-gray-600'}`}
            >
              All
            </button>
            <button 
              onClick={() => setFilter('pending')}
              className={`px-3 py-1 rounded-md ${filter === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-200 text-gray-600'}`}
            >
              Pending
            </button>
            <button 
              onClick={() => setFilter('approved')}
              className={`px-3 py-1 rounded-md ${filter === 'approved' ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'}`}
            >
              Approved
            </button>
            <button 
              onClick={() => setFilter('denied')}
              className={`px-3 py-1 rounded-md ${filter === 'denied' ? 'bg-red-100 text-red-800' : 'bg-gray-200 text-gray-600'}`}
            >
              Denied
            </button>
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
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sector</th>
                  {/* Uncomment if you want to add action buttons */}
                  {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th> */}
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
                      {transaction.customer_name ? (
                        <div className="text-sm text-gray-900">{transaction.customer_name}</div>
                      ) : (
                        <div className="text-sm text-gray-500">N/A</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">${transaction.amount.toLocaleString('en-US')}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        transaction.status === 'approved' ? 'bg-green-100 text-green-800' :
                        transaction.status === 'denied' ? 'bg-red-200 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {transaction.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(transaction.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {transaction.sector ? (
                          <div className="text-sm text-gray-900">{transaction.sector}</div>
                        ) : (
                          <div className="text-sm text-gray-500">N/A</div>
                        )}
                    </td>
                    {/* Uncomment if you want to add action buttons */}
                    {/* 
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {transaction.status === 'pending' && (
                        <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={(e) => handleStatusUpdate(e, transaction.id, 'approved')}
                            className="text-green-600 hover:text-green-900 bg-green-100 hover:bg-green-200 px-2 py-1 rounded text-xs"
                          >
                            Approve
                          </button>
                          <button
                            onClick={(e) => handleStatusUpdate(e, transaction.id, 'denied')}
                            className="text-red-600 hover:text-red-900 bg-red-100 hover:bg-red-200 px-2 py-1 rounded text-xs"
                          >
                            Deny
                          </button>
                        </div>
                      )}
                    </td>
                    */}
                  </tr>
                ))}
              </tbody>
            </table>
            {/* Pagination Controls */}
            <div className="flex items-center justify-between mt-4 px-6">
              <button
                onClick={() => fetchTransactions(page - 1)}
                disabled={page <= 1}
                className="px-4 py-2 bg-gray-200 text-sm font-medium rounded disabled:opacity-50"
              >
                Previous
              </button>

              <span className="text-sm text-gray-600">
                Page {page} of {totalPages}
              </span>

              <button
                onClick={() => fetchTransactions(page + 1)}
                disabled={page >= totalPages}
                className="px-4 py-2 bg-gray-200 text-sm font-medium rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>

          </div>
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