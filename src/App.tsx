import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import WalletList from './pages/WalletList'
import WalletDetail from './pages/WalletDetail'
import Leaderboard from './pages/Leaderboard'

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<WalletList />} />
        <Route path="/wallet/:address" element={<WalletDetail />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
      </Routes>
    </Layout>
  )
}

export default App
