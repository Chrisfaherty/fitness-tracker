// This is a wrapper for the admin ClientManagement component
// Trainers have the same client management capabilities as admins
import AdminClientManagement from '../Admin/ClientManagement'

const ClientManagement = ({ clients, onClientsUpdate, isTrainer = false }) => {
  return (
    <AdminClientManagement 
      clients={clients} 
      onClientsUpdate={onClientsUpdate}
      isTrainer={isTrainer}
    />
  )
}

export default ClientManagement