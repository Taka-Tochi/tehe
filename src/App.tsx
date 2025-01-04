import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './Home'
import Table from './Table'
//const Home: React.FC = () => <h2>Home Page</h2>;
//const Table: React.FC = () => <h2>検索</h2>;

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/table" element={<Table />} />
      </Routes>
    </Router>
  );
};

export default App;