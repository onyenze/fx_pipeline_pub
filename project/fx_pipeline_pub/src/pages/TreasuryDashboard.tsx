import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { FileText, ArrowRightCircle } from 'lucide-react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import JSZip from 'jszip';
import apiClient from '../api/client';

import { useNavigate } from 'react-router-dom';

interface Transaction {
  id: string;
  amount: number;
  customer_name:string;
  description: string | null;
  status: 'pending' | 'approved' | 'denied';
  created_at: string;
  created_by: string;
  documentation_verified: boolean;
  sector:string;
}

export default function TreasuryDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'denied'>('all');

  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    fetchTransactions();
  }, []);

  async function fetchUserInfo(userId: string, setUser: React.Dispatch<React.SetStateAction<User | null>>) {
    try {
      const response = await apiClient.get(`/users/${userId}`);
      setUser(response.data.data || response.data);
    } catch (error) {
      console.error('Failed to fetch user info:', error);
    }
  }

  async function fetchTransactions() {
  try {
    const response = await apiClient.get('/transactions');
    
    // Handle different response structures
    let transactionsData = [];
    
    if (Array.isArray(response.data)) {
      transactionsData = response.data;
    } else if (Array.isArray(response.data.data)) {
      transactionsData = response.data.data;
    } else if (response.data.transactions) {
      transactionsData = response.data.transactions;
    }
    
    setTransactions(transactionsData);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    toast.error('Failed to load transactions');
    setTransactions([]); // Set to empty array on error
  } finally {
    setIsLoading(false);
  }
}



  function navigateToMarketingDashboard() {
    navigate('/marketing');
  }

  function navigateToTransactionDetails(transactionId: string) {
    navigate(`/transactions/${transactionId}`);
  }
  

 async function generateExcelReport() {
  try {
    const indicativeBuying = prompt('Enter INDICATIVE BUYING rate:');
    const indicativeSelling = prompt('Enter INDICATIVE SELLING rate:');

    if (!indicativeBuying || !indicativeSelling) {
      toast.error('You must enter both rates.');
      return;
    }

    toast.info('Requesting backend to generate report...');

    const response = await apiClient.post(
      '/generate-report',
      { indicativeBuying, indicativeSelling },
      { responseType: 'blob' } // ⬅️ important for binary ZIP response
    );

    const blob = new Blob([response.data], { type: 'application/zip' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `FX_Report_Package_${new Date().toISOString().slice(0, 10)}.zip`;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);

    toast.success('Report generated and downloaded successfully');
  } catch (error) {
    console.error('Error generating report:', error);
    toast.error('Failed to generate Excel report.');
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


  return (
    <div className="container mx-auto px-4 py-8 bg-gray-50">
      <div className="flex justify-between items-center mb-8 pb-4 border-b border-gray-200">
        <div className="flex items-center">
          <img 
            src="https://lpywaflkmzwuxzpqaxgg.supabase.co/storage/v1/object/sign/documents/logo.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9hMGZmNzc1Yy1iZjY5LTRjNDYtOWYyMy04MjlkZGJhYzIyZDQiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJkb2N1bWVudHMvbG9nby5wbmciLCJpYXQiOjE3NTAwNjc2NDMsImV4cCI6MTc5MzI2NzY0M30.8vS6uWpEToikOsW6L9CMJa2SHqDvg7TL36S7FeT91SA" 
            alt="Company Logo" 
            className="h-12 mr-4"
          />
          <div>
            <h1 className="text-3xl font-bold text-red-800">Treasury Dashboard</h1>
            <p className="mt-2 text-gray-600">Manage and approve marketing transactions</p>
          </div>
        </div>
        
        <div className="flex gap-4">
          <button
            onClick={navigateToMarketingDashboard}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            <ArrowRightCircle className="h-5 w-5 mr-2" />
            Go to Marketing Dashboard
          </button>
          <button
            onClick={generateExcelReport}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <FileText className="h-5 w-5 mr-2" />
            Generate Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500 hover:shadow-lg transition-all">
          <h3 className="text-lg font-medium mb-2 text-gray-800">Total Transactions</h3>
          <p className="text-3xl font-bold">{calculateTotalAmount()}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-yellow-500 hover:shadow-lg transition-all">
          <h3 className="text-lg font-medium mb-2 text-gray-800">Pending Approval</h3>
          <p className="text-3xl font-bold text-yellow-600">{calculateTotalAmount('pending')}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500 hover:shadow-lg transition-all">
          <h3 className="text-lg font-medium mb-2 text-gray-800">Approved Transactions</h3>
          <p className="text-3xl font-bold text-green-600">{calculateTotalAmount('approved')}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-100">
          <h2 className="text-xl font-semibold text-gray-800">Transaction Management</h2>
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
        </div>
        {isLoading ? (
          <div className="p-6 text-center text-gray-500">Loading transactions...</div>
        ) : transactions.length === 0 ? (
          <div className="p-6 text-center text-gray-500">No transactions found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
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
                        <div className="text-sm font-medium text-gray-900">{transaction.customer_name}</div>
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
                        transaction.status === 'denied' ? 'bg-red-100 text-red-800' :
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
                        <div className="text-sm font-medium text-gray-900">{transaction.sector}</div>
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
      <div className="mt-12 pt-4 border-t border-gray-300 flex items-center justify-between">
        <div className="flex items-center">
          <img 
            src="https://lpywaflkmzwuxzpqaxgg.supabase.co/storage/v1/object/sign/documents/logo.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9hMGZmNzc1Yy1iZjY5LTRjNDYtOWYyMy04MjlkZGJhYzIyZDQiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJkb2N1bWVudHMvbG9nby5wbmciLCJpYXQiOjE3NTAwNjc2NDMsImV4cCI6MTc5MzI2NzY0M30.8vS6uWpEToikOsW6L9CMJa2SHqDvg7TL36S7FeT91SA" 
            alt="Company Logo" 
            className="h-8 mr-3" 
          />
          <p className="text-sm text-gray-600">© 2025 Your Company. All rights reserved.</p>
        </div>
        <p className="text-sm text-red-500">Admin Panel v1.0</p>
      </div>
      <ToastContainer />
    </div>
  );
}