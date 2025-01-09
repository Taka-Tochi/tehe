import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './Home'
import Table from './Table'
import Navbar from './components/Navbar';  // Navbarコンポーネントをインポート

const App: React.FC = () => {
  return (
    <Router basename="/tehe">  {/* ここでbasenameを設定 */}
      <Routes>
        <Navbar />  {/* ナビゲーションバーを表示 */}
        <Route path="/table" element={<Table />} />
        <Route path="/" element={<Home />} />
      </Routes>
    </Router>
  );
};

export default App;