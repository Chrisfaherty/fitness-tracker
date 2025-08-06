import { useState, useEffect } from 'react'
import { Search, Plus, Edit, Eye, UserX, UserCheck, Filter, Download, Mail } from 'lucide-react'
import authService from '../../services/auth/authService'
import ClientModal from './ClientModal'
import ClientProgressModal from './ClientProgressModal'

const ClientManagement = ({ clients, onClientsUpdate }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedClient, setSelectedClient] = useState(null)
  const [showClientModal, setShowClientModal] = useState(false)
  const [showProgressModal, setShowProgressModal] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  const filteredClients = clients.filter(client => {
    const matchesSearch = 
      client.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesFilter = 
      filterStatus === 'all' || 
      (filterStatus === 'active' && client.isActive) ||
      (filterStatus === 'inactive' && !client.isActive)
    
    return matchesSearch && matchesFilter
  })

  const handleCreateClient = () => {
    setSelectedClient(null)
    setIsEditing(false)
    setShowClientModal(true)
  }

  const handleEditClient = (client) => {
    setSelectedClient(client)
    setIsEditing(true)
    setShowClientModal(true)
  }

  const handleViewProgress = (client) => {
    setSelectedClient(client)
    setShowProgressModal(true)
  }

  const handleToggleClientStatus = async (client) => {
    try {
      const updatedClient = {
        ...client,
        isActive: !client.isActive
      }
      
      await authService.saveUser(updatedClient)
      onClientsUpdate()
      
      console.log(`Client ${client.firstName} ${client.lastName} ${updatedClient.isActive ? 'activated' : 'deactivated'}`)
    } catch (error) {
      console.error('Error updating client status:', error)
    }
  }

  const handleExportClients = () => {
    const csvData = filteredClients.map(client => ({
      Name: `${client.firstName} ${client.lastName}`,
      Email: client.email,
      Status: client.isActive ? 'Active' : 'Inactive',
      'Created Date': new Date(client.createdAt).toLocaleDateString(),
      'Last Login': client.lastLogin ? new Date(client.lastLogin).toLocaleDateString() : 'Never',
      'Fitness Level': client.profile?.fitnessLevel || 'Not set',
      Phone: client.profile?.phone || 'Not provided'
    }))

    const csv = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `clients-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Client Management
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Manage client accounts and track their progress
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleExportClients}
            className="btn-secondary flex items-center space-x-2"
          >
            <Download size={16} />
            <span>Export</span>
          </button>
          <button
            onClick={handleCreateClient}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus size={16} />
            <span>Add Client</span>
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search clients by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <Filter size={16} className="text-gray-400" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="all">All Clients</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Clients Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Fitness Level
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Last Login
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <div className="text-gray-500 dark:text-gray-400">
                      <Search size={48} className="mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium mb-2">No clients found</p>
                      <p className="text-sm">
                        {searchTerm || filterStatus !== 'all' 
                          ? 'Try adjusting your search or filter criteria'
                          : 'Get started by adding your first client'
                        }
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredClients.map((client) => (
                  <tr key={client.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                            <span className="text-sm font-medium text-primary-700 dark:text-primary-300">
                              {client.firstName[0]}{client.lastName[0]}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {client.firstName} {client.lastName}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            Member since {new Date(client.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {client.email}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {client.profile?.phone || 'No phone'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        client.isActive
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}>
                        {client.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      <span className="capitalize">
                        {client.profile?.fitnessLevel || 'Not set'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {client.lastLogin
                        ? new Date(client.lastLogin).toLocaleDateString()
                        : 'Never'
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleViewProgress(client)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                          title="View Progress"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => handleEditClient(client)}
                          className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                          title="Edit Client"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleToggleClientStatus(client)}
                          className={`${
                            client.isActive
                              ? 'text-red-600 hover:text-red-900 dark:text-red-400'
                              : 'text-green-600 hover:text-green-900 dark:text-green-400'
                          }`}
                          title={client.isActive ? 'Deactivate' : 'Activate'}
                        >
                          {client.isActive ? <UserX size={16} /> : <UserCheck size={16} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Results Summary */}
      {filteredClients.length > 0 && (
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Showing {filteredClients.length} of {clients.length} clients
        </div>
      )}

      {/* Modals */}
      {showClientModal && (
        <ClientModal
          client={selectedClient}
          isEditing={isEditing}
          onClose={() => setShowClientModal(false)}
          onSave={onClientsUpdate}
        />
      )}

      {showProgressModal && selectedClient && (
        <ClientProgressModal
          client={selectedClient}
          onClose={() => setShowProgressModal(false)}
        />
      )}
    </div>
  )
}

export default ClientManagement