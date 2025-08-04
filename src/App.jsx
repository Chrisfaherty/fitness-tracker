import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from './components/common/Layout'
import Dashboard from './components/Dashboard/Dashboard'
import Nutrition from './components/Nutrition/Nutrition'
import Activity from './components/Activity/Activity'
import Wellness from './components/Wellness/Wellness'
import Body from './components/Body/Body'
import CameraTest from './components/common/CameraTest'

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/nutrition" element={<Nutrition />} />
            <Route path="/activity" element={<Activity />} />
            <Route path="/wellness" element={<Wellness />} />
            <Route path="/body" element={<Body />} />
            <Route path="/camera-test" element={<CameraTest />} />
          </Routes>
        </Layout>
      </div>
    </Router>
  )
}

export default App