import { useState } from 'react'
import Dashboard from "./pages/dashboard.tsx";


function App() {
  const [count, setCount] = useState(false)

  return (
      <div>
          <Dashboard />

      </div>
  )
}
export default App
