import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { FileText, ArrowRightCircle, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

interface Transaction {
  id: string;
  amount: number;
  description: string | null;
  status: 'pending' | 'approved' | 'denied';
  created_at: string;
  created_by: string;
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
    if (user?.id) {
      fetchUserRole();
    }
  }, [user?.id, filter]);

  async function fetchUserRole() {
    try {
      const { data, error } = await supabase
        .from('profiles') // Assuming you store user profiles in a table called 'profiles'
        .select('role')
        .eq('id', user?.id)
        .single();
        
      if (error) throw error;
      if (data) setUserRole(data.role);
    } catch (error) {
      console.error('Error fetching user role:', error);
    }
  }

  async function fetchTransactions() {
    try {
      setIsLoading(true);
      let query = supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (filter !== 'all') {
        query = query.eq('status', filter);
      }
      
      const { data, error } = await query;

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      toast.error('Failed to fetch transactions');
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function updateTransactionStatus(id: string, status: 'approved' | 'denied') {
    try {
      const { error } = await supabase
        .from('transactions')
        .update({ status })
        .eq('id', id);

      if (error) throw error;

      toast.success(`Transaction ${status}`);
      fetchTransactions();
    } catch (error) {
      toast.error(`Failed to ${status} transaction`);
      console.error('Error:', error);
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
      toast.success('Generating report...');

      const inputFileNames = ['Demand and Rate.xlsx', 'FX Demand Request Form.xlsx', 'FX Pipeline Demand.xlsx'];

      const res = await fetch('http://localhost:3001/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inputFileNames })
      });

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');

      toast.success('Report generated successfully');
    } catch (error) {
      toast.error('Failed to generate report');
      console.error(error);
    }
  }

  // Format amount with thousand separators
  function formatAmount(amount: number): string {
    return amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  function calculateTotalAmount(status?: 'pending' | 'approved' | 'denied') {
    const total = transactions
      .filter(t => !status || t.status === status)
      .reduce((sum, transaction) => sum + transaction.amount, 0);
    
    return formatAmount(total);
  }

  return (
    <div className="container mx-auto px-4 py-8 bg-gray-50">
      <div className="flex justify-between items-center mb-8 pb-4 border-b border-gray-200">
        <div className="flex items-center">
          <img 
            src="../../src/public/logo.png" 
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
          <p className="text-3xl font-bold">${calculateTotalAmount()}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-yellow-500 hover:shadow-lg transition-all">
          <h3 className="text-lg font-medium mb-2 text-gray-800">Pending Approval</h3>
          <p className="text-3xl font-bold text-yellow-600">${calculateTotalAmount('pending')}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500 hover:shadow-lg transition-all">
          <h3 className="text-lg font-medium mb-2 text-gray-800">Approved Transactions</h3>
          <p className="text-3xl font-bold text-green-600">${calculateTotalAmount('approved')}</p>
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
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
                      {transaction.description ? (
                        <div className="text-sm font-medium text-gray-900">{transaction.description}</div>
                      ) : (
                        <div className="text-sm text-gray-500">No description</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">${formatAmount(transaction.amount)}</div>
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
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {transaction.status === 'pending' && 
                      user?.id !== transaction.created_by && 
                      userRole !== "marketing" && (
                        <div className="flex space-x-2 justify-end">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateTransactionStatus(transaction.id, 'approved');
                            }}
                            className="text-green-600 hover:text-green-900"
                          >
                            <CheckCircle className="h-5 w-5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateTransactionStatus(transaction.id, 'denied');
                            }}
                            className="text-red-600 hover:text-red-900"
                          >
                            <XCircle className="h-5 w-5" />
                          </button>
                        </div>
                      )
                    }
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
            src="../../src/public/logo.png" 
            alt="Company Logo" 
            className="h-8 mr-3" 
          />
          <p className="text-sm text-gray-600">© 2025 Your Company. All rights reserved.</p>
        </div>
        <p className="text-sm text-red-500">Admin Panel v1.0</p>
      </div>
    </div>
  );
}