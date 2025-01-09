import React from 'react';
import { Link } from 'react-router-dom';  // Linkをインポート

const Navbar: React.FC = () => {
  return (
    <nav>
      <ul>
        <li>
          <Link to="/">Home</Link>  {/* ホームページへのリンク */}
        </li>
        <li>
          <Link to="/table">Table</Link>  {/* テーブルページへのリンク */}
        </li>
      </ul>
    </nav>
  );
};

export default Navbar;