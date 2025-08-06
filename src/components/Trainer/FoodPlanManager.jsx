// This is a wrapper for the admin FoodPlanManager component
// Trainers have the same food plan management capabilities as admins
import AdminFoodPlanManager from '../Admin/FoodPlanManager'

const FoodPlanManager = ({ clients, isTrainer = false }) => {
  return (
    <AdminFoodPlanManager 
      clients={clients} 
      isTrainer={isTrainer}
    />
  )
}

export default FoodPlanManager