import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { Users, UserPlus, RefreshCw, LayoutDashboard } from 'lucide-react';
import toast from 'react-hot-toast';
import { Navigate } from 'react-router-dom';

type UserRole = 'admin' | 'marketing' | 'treasury' | 'basic'|'trade';

interface User {
  id: string;
  email: string;
  created_at: string;
  has_profile: boolean;
}

interface MarketingField {
  id: string;
  name: string;
  description: string;
}

export default function AdminUserManagement() {
  const { user } = useAuth();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingProfile, setIsCreatingProfile] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    role: 'basic' as UserRole,
    full_name: '',
    department: ''
  });
  
  // New state for marketing dashboard fields
  const [marketingFields, setMarketingFields] = useState<MarketingField[]>([]);
  const [newMarketingField, setNewMarketingField] = useState({
    name: '',
    description: ''
  });
  const [isAddingField, setIsAddingField] = useState(false);

  // Role options for the dropdown
  const roleOptions: UserRole[] = ['admin', 'marketing', 'treasury', 'trade'];
  // Department options for the dropdown
  const departmentOptions = ['Trade', 'Marketing', 'Treasury', 'IT', 'Other'];

  useEffect(() => {
    if (user?.id) {
      fetchCurrentUserRole();
      fetchUsers();
      fetchMarketingFields();
    }
  }, [user?.id]);

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
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchUsers() {
    try {
      // Step 1: Get all auth users (using Admin API)
      const { data: userList, error: userError } = await supabase.auth.admin.listUsers();
      
      if (userError) throw userError;
      
      const authUsers = userList?.users || [];
      
      // Step 2: Get all profiles from the profiles table
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id');
      
      if (profilesError) throw profilesError;
      
      // Step 3: Create a set of profile IDs for efficient lookup
      const profileIds = new Set(profiles?.map(p => p.id) || []);
      
      // Step 4: Map auth users to our User interface
      // A user has a profile if their ID exists in the profiles table
      const processedUsers = authUsers.map(user => ({
        id: user.id,
        email: user.email ?? '',
        created_at: user.created_at,
        has_profile: profileIds.has(user.id)
      }));
      
      setUsers(processedUsers);
      
      // If the currently selected user now has a profile, deselect them
      if (selectedUser && profileIds.has(selectedUser.id)) {
        setSelectedUser(null);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast?.error('Failed to fetch users');
    }
  }

  // New function to fetch marketing dashboard fields
  async function fetchMarketingFields() {
    try {
      const { data, error } = await supabase
        .from('marketing_dashboard_fields')
        .select('*');
      
      if (error) throw error;
      setMarketingFields(data || []);
    } catch (error) {
      console.error('Error fetching marketing fields:', error);
      toast.error('Failed to fetch marketing dashboard fields');
    }
  }

  async function handleCreateProfile(e: React.FormEvent) {
    e.preventDefault();
    
    if (!selectedUser) {
      toast.error('Please select a user');
      return;
    }

    try {
      setIsCreatingProfile(true);
      
      // Create a profile for the selected user
      const { error } = await supabase
        .from('profiles')
        .insert([{
          id: selectedUser.id,
          role: formData.role,
          full_name: formData.full_name,
          department: formData.department,
        }]);

      if (error) throw error;

      // Update local state to immediately reflect that this user now has a profile
      setUsers(prevUsers => 
        prevUsers.map(u => 
          u.id === selectedUser.id 
            ? { ...u, has_profile: true } 
            : u
        )
      );
      
      toast.success('Profile created successfully');
      setSelectedUser(null);
      setFormData({
        role: 'basic',
        full_name: '',
        department: ''
      });
      
      // Refresh the user list to ensure data is current
      await fetchUsers();
      
    } catch (error) {
      console.error('Error creating profile:', error);
      toast.error('Failed to create profile');
    } finally {
      setIsCreatingProfile(false);
    }
  }

  // New function to add marketing dashboard field
  async function handleAddMarketingField(e: React.FormEvent) {
    e.preventDefault();
    
    if (!newMarketingField.name.trim()) {
      toast.error('Field name is required');
      return;
    }

    try {
      setIsAddingField(true);
      
      const { data, error } = await supabase
        .from('marketing_dashboard_fields')
        .insert([{
          name: newMarketingField.name,
          description: newMarketingField.description
        }])
        .select();

      if (error) throw error;
      
      // Update local state with the new field
      if (data) {
        setMarketingFields(prev => [...prev, data[0]]);
      }
      
      toast.success('Marketing dashboard field added successfully');
      
      // Reset form
      setNewMarketingField({
        name: '',
        description: ''
      });
      
    } catch (error) {
      console.error('Error adding marketing field:', error);
      toast.error('Failed to add marketing dashboard field');
    } finally {
      setIsAddingField(false);
    }
  }

  // New function to delete marketing dashboard field
  async function handleDeleteMarketingField(id: string) {
    try {
      const { error } = await supabase
        .from('marketing_dashboard_fields')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      // Update local state by removing the deleted field
      setMarketingFields(prev => prev.filter(field => field.id !== id));
      toast.success('Field removed successfully');
      
    } catch (error) {
      console.error('Error deleting field:', error);
      toast.error('Failed to remove field');
    }
  }

  function handleSelectUser(user: User) {
    // Only allow selecting users without profiles
    if (!user.has_profile) {
      setSelectedUser(user);
    } else {
        toast("This user already has a profile", {
            icon: "ℹ️",
            style: {
              background: "#fef3c7",
              color: "#92400e",
            },
          });
    }
  }

  // If user is not admin, redirect them
  if (!isLoading && userRole !== 'admin') {
    return <Navigate to="/" replace />;
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
      </div>
    );
  }

  // Users without profiles are those where has_profile is false
  const usersWithoutProfiles = users.filter(user => !user.has_profile);

  return (
    <div className="container mx-auto px-4 py-8 bg-gray-50">
      {/* Header with Logo */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-200">
        <div className="flex items-center">
          <img 
            src="https://lpywaflkmzwuxzpqaxgg.supabase.co/storage/v1/object/sign/documents/logo.png?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InN0b3JhZ2UtdXJsLXNpZ25pbmcta2V5XzdkYjlmN2VlLWE2NGUtNDE3Ny04Y2U0LTY3YmFjZDU5MmYwZCJ9.eyJ1cmwiOiJkb2N1bWVudHMvbG9nby5wbmciLCJpYXQiOjE3NDY2MzI4MjgsImV4cCI6MTgzMzAzMjgyOH0.A4lhanGiT9JBdaWZSUYiCO7-Q7QJJQGzrC3NDYdEOlY" 
            alt="Company Logo" 
            className="h-12 mr-4"
          />
          <div>
            <h1 className="text-3xl font-bold text-red-800">User Management</h1>
            <p className="mt-1 text-red-600">Create and manage user profiles</p>
          </div>
        </div>
        <div className="bg-red-100 px-4 py-2 rounded-lg">
          <p className="text-red-800 font-medium">Admin Dashboard</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Users without profiles list */}
        <div className="bg-white shadow-md overflow-hidden rounded-lg border border-gray-200">
          <div className="px-4 py-5 sm:px-6 flex justify-between items-center bg-gray-100">
            <div>
              <h2 className="text-lg font-medium text-gray-800">Users Without Profiles</h2>
              <p className="mt-1 text-sm text-red-600">Select a user to create their profile</p>
            </div>
            <button 
              onClick={fetchUsers}
              className="inline-flex items-center p-2 border border-transparent rounded-full shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              title="Refresh user list"
            >
              <RefreshCw className="h-5 w-5" />
            </button>
          </div>
          <div className="border-t border-gray-200">
            <div className="overflow-y-auto max-h-96">
              <ul className="divide-y divide-gray-200">
                {usersWithoutProfiles.length > 0 ? (
                  usersWithoutProfiles.map(user => (
                    <li 
                      key={user.id} 
                      className={`px-4 py-4 hover:bg-gray-50 cursor-pointer ${selectedUser?.id === user.id ? 'bg-red-100' : ''}`}
                      onClick={() => handleSelectUser(user)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-900 truncate">{user.email}</div>
                        <div className="text-xs text-gray-500">
                          {new Date(user.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </li>
                  ))
                ) : (
                  <li className="px-4 py-4 text-center text-gray-500">
                    No users without profiles found
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>

        {/* Create profile form */}
        <div className="bg-white shadow-md overflow-hidden rounded-lg border border-gray-200">
          <div className="px-4 py-5 sm:px-6 bg-gray-100">
            <h2 className="text-lg font-medium text-gray-800">Create User Profile</h2>
            <p className="mt-1 text-sm text-red-600">
              {selectedUser 
                ? `Creating profile for: ${selectedUser.email}` 
                : 'Select a user from the list'}
            </p>
          </div>
          <div className="border-t border-gray-200">
            <form onSubmit={handleCreateProfile} className="px-4 py-5 sm:px-6 space-y-4">
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                  Role
                </label>
                <select
                  id="role"
                  name="role"
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm rounded-md"
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value as UserRole})}
                  required
                >
                  {roleOptions.map(role => (
                    <option key={role} value={role}>
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <input
                  type="text"
                  id="full_name"
                  name="full_name"
                  className="mt-1 focus:ring-red-500 focus:border-red-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  value={formData.full_name}
                  onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                  required
                />
              </div>
              
              <div>
                <label htmlFor="department" className="block text-sm font-medium text-gray-700">
                  Department
                </label>
                <select
                  id="department"
                  name="department"
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm rounded-md"
                  value={formData.department}
                  onChange={(e) => setFormData({...formData, department: e.target.value})}
                  required
                >
                  <option value="" disabled>Select a department</option>
                  {departmentOptions.map(dept => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={!selectedUser || isCreatingProfile}
                  className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                    selectedUser && !isCreatingProfile
                      ? 'bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500' 
                      : 'bg-gray-300 cursor-not-allowed'
                  }`}
                >
                  {isCreatingProfile ? (
                    <>
                      <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-5 w-5 mr-2" />
                      Create Profile
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Marketing Dashboard Fields Section - NEW */}
      <div className="mt-8 bg-white shadow-md overflow-hidden rounded-lg border border-gray-200">
        <div className="px-4 py-5 sm:px-6 bg-gray-100 flex justify-between items-center">
          <div className="flex items-center">
            <LayoutDashboard className="h-6 w-6 text-red-600 mr-2" />
            <div>
              <h2 className="text-lg font-medium text-gray-800">Marketing Dashboard Fields</h2>
              <p className="mt-1 text-sm text-red-600">Customize the fields displayed on the marketing dashboard</p>
            </div>
          </div>
          <div className="text-sm text-gray-500">
            <span className="font-medium">{marketingFields.length}</span> custom fields
          </div>
        </div>
        
        <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
          {/* Form to add new marketing dashboard field */}
          <form onSubmit={handleAddMarketingField} className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-1">
                <label htmlFor="field_name" className="block text-sm font-medium text-gray-700">
                  Field Name
                </label>
                <input
                  type="text"
                  id="field_name"
                  name="field_name"
                  className="mt-1 focus:ring-red-500 focus:border-red-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  value={newMarketingField.name}
                  onChange={(e) => setNewMarketingField({...newMarketingField, name: e.target.value})}
                  placeholder="E.g. Monthly Revenue"
                  required
                />
              </div>
              <div className="md:col-span-1">
                <label htmlFor="field_description" className="block text-sm font-medium text-gray-700">
                  Description (Optional)
                </label>
                <input
                  type="text"
                  id="field_description"
                  name="field_description"
                  className="mt-1 focus:ring-red-500 focus:border-red-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  value={newMarketingField.description}
                  onChange={(e) => setNewMarketingField({...newMarketingField, description: e.target.value})}
                  placeholder="E.g. Total monthly revenue from all sources"
                />
              </div>
              <div className="md:col-span-1 flex items-end">
                <button
                  type="submit"
                  disabled={isAddingField || !newMarketingField.name.trim()}
                  className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                    !isAddingField && newMarketingField.name.trim()
                      ? 'bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500' 
                      : 'bg-gray-300 cursor-not-allowed'
                  } w-full justify-center`}
                >
                  {isAddingField ? 'Adding...' : 'Add Field'}
                </button>
              </div>
            </div>
          </form>

          {/* List of existing marketing dashboard fields */}
          <div className="mt-4">
            <h3 className="text-md font-medium text-gray-700 mb-2">Current Fields</h3>
            
            {marketingFields.length > 0 ? (
              <div className="bg-gray-50 rounded-md overflow-hidden">
                <ul className="divide-y divide-gray-200">
                  {marketingFields.map((field) => (
                    <li key={field.id} className="px-4 py-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{field.name}</p>
                        {field.description && (
                          <p className="text-xs text-gray-500 mt-1">{field.description}</p>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeleteMarketingField(field.id)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium focus:outline-none"
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-sm text-gray-500 py-4 text-center bg-gray-50 rounded-md">
                No custom marketing dashboard fields have been added yet
              </p>
            )}
          </div>
        </div>
      </div>

      {/* List of all users with profiles */}
      <div className="mt-8 bg-white shadow-md overflow-hidden rounded-lg border border-gray-200">
        <div className="px-4 py-5 sm:px-6 bg-gray-100 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-medium text-gray-800">All Users</h2>
            <p className="mt-1 text-sm text-red-600">Complete list of users and their profile status</p>
          </div>
          <div className="text-sm text-gray-500">
            <span className="font-medium">{users.length}</span> total users | 
            <span className="font-medium text-green-600 ml-1">{users.filter(u => u.has_profile).length}</span> with profiles |
            <span className="font-medium text-red-600 ml-1">{users.filter(u => !u.has_profile).length}</span> without profiles
          </div>
        </div>
        <div className="border-t border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Email
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Created At
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Profile Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.has_profile ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Profile Created
                        </span>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                          No Profile
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      {/* Footer with Logo */}
      <div className="mt-12 pt-4 border-t border-gray-300 flex items-center justify-between">
        <div className="flex items-center">
          <img 
            src="https://lpywaflkmzwuxzpqaxgg.supabase.co/storage/v1/object/sign/documents/logo.png?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InN0b3JhZ2UtdXJsLXNpZ25pbmcta2V5XzdkYjlmN2VlLWE2NGUtNDE3Ny04Y2U0LTY3YmFjZDU5MmYwZCJ9.eyJ1cmwiOiJkb2N1bWVudHMvbG9nby5wbmciLCJpYXQiOjE3NDY2MzI4MjgsImV4cCI6MTgzMzAzMjgyOH0.A4lhanGiT9JBdaWZSUYiCO7-Q7QJJQGzrC3NDYdEOlY" 
            alt="Company Logo" 
            className="h-8 mr-3" 
          />
          <p className="text-sm text-gray-600">© 2025 Your Company. All rights reserved.</p>
        </div>
        {/* <p className="text-sm text-red-500">Admin Panel v1.0</p> */}
      </div>
    </div>
  );
}