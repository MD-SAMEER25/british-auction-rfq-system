import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import CreateRFQ from './pages/CreateRFQ'
import AuctionList from './pages/AuctionList'
import AuctionDetail from './pages/AuctionDetail'

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<AuctionList />} />
        <Route path="/create" element={<CreateRFQ />} />
        <Route path="/auction/:id" element={<AuctionDetail />} />
      </Routes>
    </BrowserRouter>
  )
}