import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './Home'
import Table from './Table'
import Test from './Test'
import Hantei from './Hantei'
import Blood from './Blood'
import Navbar from './components/Navbar';  // Navbarコンポーネントをインポート

const App: React.FC = () => {
  return (
    <Router basename="/tehe">  {/* ここでbasenameを設定 */}
      
      <Routes>
        <Route path="/table" element={<Table />} />
        <Route path="/hantei" element={<Hantei />} />
        <Route path="/test" element={<Test />} />
        <Route path="/blood" element={<Blood />} />
        <Route path="/" element={<Home />} />
      </Routes>
    </Router>
  );
};

export default App;