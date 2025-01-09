import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './Home'
import Table from './Table'

const App: React.FC = () => {
  return (
    <Router basename="/tehe">  {/* ここでbasenameを設定 */}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/table" element={<Table />} />
      </Routes>
    </Router>
  );
};

export default App;