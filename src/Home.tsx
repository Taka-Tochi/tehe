import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Container } from 'react-bootstrap';
 
const Home: React.FC = () => {
	const navigate = useNavigate();
  
	useEffect(() => {
		document.title = 'MainPage'; // タイトルを設定
	  }, []);

	return (
		<Container className="text-center mt-5">
		<h2 className="mb-4">なにかのページ</h2>
		<div className="d-flex flex-column align-items-center gap-3">
		  <Button variant="primary" onClick={() => navigate('/table')} className="w-50">
			血統組み合わせ表
		  </Button>
		  <Button variant="primary" onClick={() => navigate('/blood')} className="w-50">
			配合相手チェック
		  </Button>
		  <Button variant="primary" onClick={() => navigate('/hantei')} className="w-50">
			オッズ判定
		  </Button>
		</div>
	  </Container>
	);
  };
 
export default Home;