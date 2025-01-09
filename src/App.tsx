import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Home from './Home'
import Table from './Table'
//const Home: React.FC = () => <h2>Home Page</h2>;
//const Table: React.FC = () => <h2>検索</h2>;

const App: React.FC = () => {
  return (
    <BrowserRouter basename="/tehe">  {/* ここでbasenameを設定 */}
      <Routes>
        <Route path="/" element={<Table />} />
        <Route path="/table" element={<Home />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;