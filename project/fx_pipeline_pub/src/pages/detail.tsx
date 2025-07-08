import { useState } from 'react';
import TransactionEditModal from '../components/TransactionEditModal';
import { useAuth } from '../lib/auth';

const TransactionDetails = ({ transaction }: { transaction: any }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const { user } = useAuth();

  const isTreasury = user?.role?.toLowerCase() === 'treasury';

  return (
    <div className="p-4">
      <h1 className="text-2xl font-semibold">Transaction Details</h1>

      {/* Transaction Info */}
      <pre className="mt-4 bg-gray-100 p-4 rounded">{JSON.stringify(transaction, null, 2)}</pre>

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
    </div>
  );
};

export default TransactionDetails;
