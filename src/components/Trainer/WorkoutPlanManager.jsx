// This is a wrapper for the admin WorkoutPlanManager component
// Trainers have the same workout plan management capabilities as admins
import AdminWorkoutPlanManager from '../Admin/WorkoutPlanManager'

const WorkoutPlanManager = ({ clients, isTrainer = false }) => {
  return (
    <AdminWorkoutPlanManager 
      clients={clients} 
      isTrainer={isTrainer}
    />
  )
}

export default WorkoutPlanManager