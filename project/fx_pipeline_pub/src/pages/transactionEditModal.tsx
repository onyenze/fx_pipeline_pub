import { useState } from 'react';
import Modal from 'react-modal';
import { toast } from 'react-hot-toast';
import apiClient from '../api/client';


interface Props {
  isOpen: boolean;
  onClose: () => void;
  transaction: {
    id: string;
    amount: number;
    amount_requested: number;
    loan_limit: number;
    loan_balance: number;
    cedi_balance: number;
  };
  onSuccess: () => void;
}

const customStyles = {
  content: {
    top: '50%', left: '50%',
    right: 'auto', bottom: 'auto',
    marginRight: '-50%',
    transform: 'translate(-50%, -50%)',
    width: '90%', maxWidth: '500px',
  },
};

const TransactionEditModal = ({ isOpen, onClose, transaction, onSuccess }: Props) => {
  const [form, setForm] = useState({ ...transaction });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const { id, ...fields } = form;

      await apiClient.patch(`/transactions/${id}/change`, fields);
      toast.success('Transaction updated');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error(error);
      toast.error('Failed to update transaction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onRequestClose={onClose} style={customStyles} ariaHideApp={false}>
      <h2 className="text-xl font-semibold mb-4">Edit Transaction</h2>
      <div className="grid gap-3">
        {['amount', 'amount_requested', 'loan_limit', 'loan_balance', 'cedi_balance'].map((field) => (
          <div key={field}>
            <label className="block text-sm font-medium text-gray-700 capitalize">{field.replace('_', ' ')}</label>
            <input
              type="number"
              name={field}
              value={form[field as keyof typeof form]}
              onChange={handleChange}
              className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring focus:ring-blue-200"
            />
          </div>
        ))}
        <div className="flex justify-end mt-4">
          <button onClick={onClose} className="mr-2 px-4 py-2 bg-gray-200 rounded">Cancel</button>
          <button onClick={handleSubmit} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded">
            {loading ? 'Updating...' : 'Update'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default TransactionEditModal;
