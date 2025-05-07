import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import toast from 'react-hot-toast';
import { Lock } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signIn } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await signIn(email, password);
      toast.success('Successfully logged in!');
      navigate('/marketing');
    } catch (error) {
      toast.error('Failed to log in. Please check your credentials.');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
        <div className="flex flex-col items-center">
          {/* Company Logo */}
          <img 
            src="https://lpywaflkmzwuxzpqaxgg.supabase.co/storage/v1/object/sign/documents/logo.png?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InN0b3JhZ2UtdXJsLXNpZ25pbmcta2V5XzdkYjlmN2VlLWE2NGUtNDE3Ny04Y2U0LTY3YmFjZDU5MmYwZCJ9.eyJ1cmwiOiJkb2N1bWVudHMvbG9nby5wbmciLCJpYXQiOjE3NDY2MzI4MjgsImV4cCI6MTgzMzAzMjgyOH0.A4lhanGiT9JBdaWZSUYiCO7-Q7QJJQGzrC3NDYdEOlY" 
            alt="Company Logo" 
            className="h-16 mb-4"
          />
          <h2 className="mt-2 text-center text-3xl font-extrabold text-gray-800">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Welcome back to FX Pipeline Dashboard
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email-address" className="sr-only">
                Email address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-red-500 focus:border-red-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-red-500 focus:border-red-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                <Lock className="h-5 w-5 text-red-400 group-hover:text-red-300" />
              </span>
              Sign in
            </button>
          </div>

          <div className="text-sm text-center">
            <Link
              to="/signup"
              className="font-medium text-red-600 hover:text-red-500"
            >
              Request Access
            </Link>
          </div>
        </form>
        
        {/* Footer with logo */}
        <div className="pt-6 mt-6 border-t border-gray-200">
          <div className="flex justify-center items-center text-gray-500 text-sm">
            <img 
              src="https://lpywaflkmzwuxzpqaxgg.supabase.co/storage/v1/object/sign/documents/logo.png?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InN0b3JhZ2UtdXJsLXNpZ25pbmcta2V5XzdkYjlmN2VlLWE2NGUtNDE3Ny04Y2U0LTY3YmFjZDU5MmYwZCJ9.eyJ1cmwiOiJkb2N1bWVudHMvbG9nby5wbmciLCJpYXQiOjE3NDY2MzI4MjgsImV4cCI6MTgzMzAzMjgyOH0.A4lhanGiT9JBdaWZSUYiCO7-Q7QJJQGzrC3NDYdEOlY" 
              alt="Company Logo" 
              className="h-4 mr-2" 
            />
            <p>© 2025 Your Company. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
}