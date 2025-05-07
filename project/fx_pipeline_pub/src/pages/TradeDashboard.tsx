import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

interface Transaction {
  id: string;
  amount: number;
  description: string | null;
  customer_name:string
  status: 'pending' | 'approved' | 'denied';
  created_at: string;
  created_by: string;
  sector:string;
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

  // Use useCallback to memoize the fetchTransactions function
  const fetchTransactions = useCallback(async () => {
    try {
      let query = supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setTransactions(data || []);
      
      // Calculate amounts for dashboard cards
      if (data) {
        const total = data.reduce((sum, t) => sum + t.amount, 0);
        setTotalAmount(total);
        
        const pending = data.filter(t => t.status === 'pending').reduce((sum, t) => sum + t.amount, 0);
        setPendingAmount(pending);
        
        const approved = data.filter(t => t.status === 'approved').reduce((sum, t) => sum + t.amount, 0);
        setApprovedAmount(approved);
      }
    } catch (error) {
      toast.error('Failed to fetch transactions');
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]); // Add statusFilter as a dependency

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]); // Now fetchTransactions includes statusFilter as a dependency

  // async function handleStatusUpdate(e: React.MouseEvent, transactionId: string, newStatus: 'approved' | 'denied') {
  //   // Prevent the click from propagating to the row and navigating
  //   e.stopPropagation();
    
  //   try {
  //     const { error } = await supabase
  //       .from('transactions')
  //       .update({
  //         status: newStatus,
  //         approved_by: user?.id
  //       })
  //       .eq('id', transactionId);

  //     if (error) throw error;

  //     toast.success(`Transaction ${newStatus} successfully`);
  //     fetchTransactions();
  //   } catch (error) {
  //     toast.error(`Failed to ${newStatus} transaction`);
  //     console.error('Error:', error);
  //   }
  // }
  
  function navigateToTransactionDetails(transactionId: string) {
    navigate(`/transactions/${transactionId}`);
  }

  // Format amount with thousand separators
  function formatAmount(amount: number): string {
    return amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
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
            src="https://lpywaflkmzwuxzpqaxgg.supabase.co/storage/v1/object/sign/documents/logo.png?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InN0b3JhZ2UtdXJsLXNpZ25pbmcta2V5XzdkYjlmN2VlLWE2NGUtNDE3Ny04Y2U0LTY3YmFjZDU5MmYwZCJ9.eyJ1cmwiOiJkb2N1bWVudHMvbG9nby5wbmciLCJpYXQiOjE3NDY2MzI4MjgsImV4cCI6MTgzMzAzMjgyOH0.A4lhanGiT9JBdaWZSUYiCO7-Q7QJJQGzrC3NDYdEOlY" 
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
          <p className="text-3xl font-bold text-blue-600">${formatAmount(totalAmount)}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-yellow-500 hover:shadow-lg transition-all">
          <h3 className="text-lg font-medium mb-2 text-gray-700">Pending Approval</h3>
          <p className="text-3xl font-bold text-yellow-600">${formatAmount(pendingAmount)}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500 hover:shadow-lg transition-all">
          <h3 className="text-lg font-medium mb-2 text-gray-700">Approved Transactions</h3>
          <p className="text-3xl font-bold text-green-600">${formatAmount(approvedAmount)}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-100">
          <h2 className="text-xl font-semibold text-gray-800">Transactions</h2>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={handleStatusFilterChange}
              className="rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="denied">Denied</option>
            </select>
          </div>
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
                      <div className="text-sm text-gray-900">${formatAmount(transaction.amount)}</div>
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