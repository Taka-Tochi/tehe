import React, { useRef,useState,useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Form, Button, Container, Row, Col,Table } from 'react-bootstrap';
import { StartDebut, PreRace, PreRaceNinki,StartRaceData,Choshi,SoshitsuData } from './SelectData';
import { useNavigate } from "react-router-dom";

const Hantei: React.FC = () => {
  const navigate = useNavigate();
  const [soshitsuList, setSoshitsuList] = useState(SoshitsuData);
  const [viewBool, setviewBool] = useState(false)
  const [soshitsu, setSoshitsu] = useState<string>('');
  const [viewOdds, setviewOdds] = useState<string>('');
  const [formData, setFormData] = useState({
    odds: '',
    debut: '1',
    firstmatch: '',
    prerace: '',
    prerace_ninki: '',
    choshi:'',
    lostcnt:0,
    lostcnt_2:0,
    lostcnt_3:0,
    lostcnt_out:0,
    lostcnt_etc:0,
  });

    useEffect(() => {
        document.title = 'オッズ判定'; // タイトルを設定
      }, []);

    // 数値の増減処理（複数のカウントを扱う）
    const increment = (type: 'lostcnt_2' | 'lostcnt_3'| 'lostcnt_out'| 'lostcnt_etc') => {
        setFormData(prevData => {
            // それぞれのカウントに条件を付けて増加
            if ((type === 'lostcnt_2') && prevData.lostcnt_2 < 5) {
                return { ...prevData, lostcnt_2: prevData.lostcnt_2 + 1 };
            } else if (type === 'lostcnt_3' && prevData.lostcnt_3 < 5) {
                return { ...prevData, lostcnt_3: prevData.lostcnt_3 + 1 };
            } else if (type === 'lostcnt_out' && prevData.lostcnt_out < 5) {
                return { ...prevData, lostcnt_out: prevData.lostcnt_out + 1 };
            //条件操作のみ10まで許容
            } else if (type === 'lostcnt_etc' && prevData.lostcnt_etc < 10) {
                return { ...prevData, lostcnt_etc: prevData.lostcnt_etc + 0.5 };
            }
            return prevData;
        });
    };
    const decrement = (type: 'lostcnt_2' | 'lostcnt_3'| 'lostcnt_out'| 'lostcnt_etc') => {
        setFormData(prevData => {
            // それぞれのカウントに条件を付けて増加
            if ((type === 'lostcnt_2') && prevData.lostcnt_2 > 0) {
                return { ...prevData, lostcnt_2: prevData.lostcnt_2 - 1 };
            } else if (type === 'lostcnt_3' && prevData.lostcnt_3 > 0) {
                return { ...prevData, lostcnt_3: prevData.lostcnt_3 - 1 };
            } else if (type === 'lostcnt_out' && prevData.lostcnt_out > 0) {
                return { ...prevData, lostcnt_out: prevData.lostcnt_out - 1 };
            //条件操作のみ10まで許容
            } else if (type === 'lostcnt_etc' && prevData.lostcnt_etc > -10) {
                return { ...prevData, lostcnt_etc: prevData.lostcnt_etc - 0.5 };
            }
            return prevData;
        });
    };    

    // リセットボタンの処理
    const handleReset = () => {
        setFormData({
            ...formData,
            odds: '',
            debut: '1',
            firstmatch: '',
            prerace: '',
            prerace_ninki: '',
            choshi:'',
            lostcnt:0,
            lostcnt_2:0,
            lostcnt_3:0,
            lostcnt_out:0,
            lostcnt_etc:0,
        });
        console.log('Form Reset'); // フォームリセット時の処理
        setviewBool(false); // フラグの切り替え
    };

        // 戻るボタンの処理
        const backpage = () => {
            navigate("/");
        };
    
    // 入力値が変更されたときの処理
    const ataiChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        // 数字または小数点、そして小数点以下4桁までを許可
        if (/^\d*\.?\d{0,4}$/.test(value)) { // 小数点以下は最大4桁
            setFormData({ ...formData, lostcnt: parseFloat(value) });
        }
    };


  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setFormData({ ...formData, [name]: value });
  };

  // 2歳G1成績リセットしたら他リセットする
  const nisaiChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setFormData({ ...formData, debut: '1',
        firstmatch: '',
        prerace: '',
        prerace_ninki: '',
        choshi:'',
        lostcnt:0,
        lostcnt_2:0,
        lostcnt_3:0,
        lostcnt_out:0,
        lostcnt_etc:0,
        [name]: value });
    console.log('Form Reset'); // フォームリセット時の処理
  };

  //オッズ入力フォーム設定
  const oddsInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    // 数字または小数点、そして小数点以下3桁までを許可
    if (/^\d*\.?\d{0,3}$/.test(value)) { // 小数点以下は最大4桁
        setFormData({ ...formData, odds: value });
    }
  };

  //ボタン押下
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!formData.odds || !formData.firstmatch || !formData.prerace || !formData.choshi) {
      alert('全ての項目を入力してください。');
      return;
    }
    if (formData.prerace !== '0' && !formData.prerace_ninki) {
        alert('全ての項目を入力してください。');
        return;
    }
    
    setviewBool(true); // フラグの切り替え
    let odds:number = parseFloat(formData.odds);
    let yure:number = 0;
    //ゆれの計算
    if(formData.prerace_ninki === '2') yure = yure + 1;
    if(formData.prerace_ninki === '3') yure = yure + 2;
    if(formData.choshi === '3') yure = yure - 1;
    if(formData.choshi === '4') yure = yure - 1.5;
    if(formData.choshi === '5') yure = yure - 2;
    if(formData.lostcnt_2) yure = yure - (formData.lostcnt_2 * 0.5);
    if(formData.lostcnt_3) yure = yure - (formData.lostcnt_3 * 1);
    if(formData.lostcnt_out) yure = yure - (formData.lostcnt_out * 2);
    if(formData.lostcnt_etc) yure = yure + formData.lostcnt_etc;
    
    let hyoji = odds + odds*yure/100;
    setSoshitsu("サラ未満");
    setviewOdds(hyoji.toFixed(3).toString());

    //使用テーブルの決定
    let preSel = formData.prerace;
    if(formData.prerace === '0') preSel = '4';
    const SoshitsuList = SoshitsuData.filter(item => item.grade === formData.firstmatch && item.pre === preSel);
    setSoshitsuList(SoshitsuList);


    // forループを使って条件に合った場合に処理を抜ける
    for (let i = 0; i < soshitsuList.length; i++) {
        if (parseFloat(soshitsuList[i].win_rh) >= hyoji) {
            setSoshitsu(soshitsuList[i].comm);
            break;  // 条件に合った場合、ループを抜ける
        }
    }

  };

  return (
    <Container className="mt-6">
      <h2 className="text-center">素質チェック(単勝ライド用)</h2>
        <Form onSubmit={handleSubmit}>
                <Row  className="mb-3">
                    <Col xs={4} sm={12} className="d-flex align-items-center mt-2">
                        <Form.Label>初戦オッズ</Form.Label>
                    </Col>
                    <Col xs={6} sm={12}>
                    <Form.Control
                        type="text"
                        name="odds"
                        value={formData.odds}
                        onChange={oddsInputChange}
                    />
                    </Col>
                    <Col xs={2} className="d-flex mt-2"><Form.Label>倍</Form.Label></Col>
                </Row>
                <Row className='mb-3'>
                    <Col xs={4} sm={12} className="d-flex align-items-center mt-2">
                        <Form.Label>デビュー</Form.Label>
                    </Col>
                    <Col xs={6} sm={12}>
                        <Form.Select
                            name="debut"
                            value={formData.debut}
                            onChange={handleChange}
                        >
                        <option value="1">3歳馬</option>
                        </Form.Select>
                    </Col> 
                </Row>
                <Row className='mb-3'>
                    <Col xs={4} sm={12} className="d-flex align-items-center mt-2">
                        <Form.Label>2歳G1</Form.Label>
                    </Col>
                    <Col xs={6} sm={12}>
                        <Form.Select
                            name="prerace"
                            value={formData.prerace}
                            onChange={nisaiChange}
                        >
                        <option value="">選択してください</option>
                        {PreRace.map((item) => (
                            <option key={item.id} value={item.id}>
                                {item.start}
                            </option>
                        ))}
                        </Form.Select>
                    </Col> 
                </Row>
                {/* 2歳G1が未出走以外のときだけ表示 */}
                {(formData.prerace !== '' && formData.prerace !== '0') && (
                <Row className='mb-3'>
                    <Col xs={4} sm={12} className="d-flex align-items-center mt-2">
                        <Form.Label>2歳G1人気</Form.Label>
                    </Col>
                    <Col xs={6} sm={12}>
                        <Form.Select
                            name="prerace_ninki"
                            value={formData.prerace_ninki}
                            onChange={handleChange}
                        >
                        <option value="">選択してください</option>
                        {PreRaceNinki.map((item) => (
                        <option key={item.id} value={item.id}>
                            {item.start}
                        </option>
                        ))}
                        </Form.Select>
                    </Col> 
                </Row>
                )}

                {/* 2歳G1を選択したときだけ表示 */}
                {formData.prerace !== '' && (
                <Row className='mb-3'>
                    <Col xs={4} sm={12} className="d-flex align-items-center mt-2">
                        <Form.Label>初戦レース</Form.Label>
                    </Col>
                    <Col xs={6} sm={12}>
                        <Form.Select
                            name="firstmatch"
                            value={formData.firstmatch}
                            onChange={handleChange}
                        >
                            <option value="">選択してください</option>
                            {StartRaceData.filter((item) =>
                            item.viewlist === 'true' &&( 
                            item.pattern === '9' || 
                            (item.pattern === '2' && formData.prerace === '1')||
                            (item.pattern === '3' && formData.prerace === '0'))
                            ).map((item) => (
                            <option key={item.id} value={item.grade}>
                                {item.racename}
                            </option>
                            ))}
                        </Form.Select>
                    </Col> 
                </Row>
                )}

                {/* 2歳G1が未出走以外のときだけ表示 */}
                {formData.prerace !== '' && (
                <Row className='mb-3'>
                    <Col xs={4} sm={12} className="d-flex align-items-center mt-2">
                        <Form.Label>調子</Form.Label>
                    </Col>
                    <Col xs={6} sm={12}>
                        <Form.Select
                            name="choshi"
                            value={formData.choshi}
                            onChange={handleChange}
                        >
                        <option value="">選択してください</option>
                        {Choshi.map((item) => (
                        <option key={item.id} value={item.id}>
                            {item.start}
                        </option>
                        ))}
                        </Form.Select>
                    </Col> 
                </Row>
                )}
                {(formData.prerace !== '' && formData.prerace === '0') && (
                <Row>
                    <Col xs={4} sm={12} className="d-flex align-items-center mt-2">
                        <Form.Label>2着回数</Form.Label>
                    </Col>
                    <Col xs={4} sm={10} className="d-flex align-items-center justify-content-center">
                        <Form.Control
                            type="text"
                            name="lostcnt_2"
                            value={formData.lostcnt_2}
                            onChange={ataiChange}
                        />
                    </Col>
                    <Col xs={1} className="d-flex mt-2"><Form.Label>回</Form.Label></Col>
                    <Col xs={1} sm={1} className="d-flex align-items-center justify-content-center">
                        {/* 減算ボタン */}
                        <Button variant="secondary" onClick={() => decrement('lostcnt_2')}>-</Button>
                    </Col>
                    <Col xs={1} sm={1} className="d-flex align-items-center justify-content-center">
                        {/* 加算ボタン */}
                        <Button variant="secondary" onClick={() => increment('lostcnt_2')}>+</Button>
                    </Col>
                </Row>
                )}
                {(formData.prerace !== '' && formData.prerace === '0') && (
                <Row>
                    <Col xs={4} sm={12} className="d-flex align-items-center mt-2">
                        <Form.Label>3着回数</Form.Label>
                    </Col>
                    <Col xs={4} sm={10} className="d-flex align-items-center justify-content-center">
                        <Form.Control
                            type="text"
                            name="lostcnt_3"
                            value={formData.lostcnt_3}
                            onChange={ataiChange}
                        />
                    </Col>
                    <Col xs={1} className="d-flex mt-2"><Form.Label>回</Form.Label></Col>
                    <Col xs={1} sm={1} className="d-flex align-items-center justify-content-center">
                        {/* 減算ボタン */}
                        <Button variant="secondary" onClick={() => decrement('lostcnt_3')}>-</Button>
                    </Col>
                    <Col xs={1} sm={1} className="d-flex align-items-center justify-content-center">
                        {/* 加算ボタン */}
                        <Button variant="secondary" onClick={() => increment('lostcnt_3')}>+</Button>
                    </Col>
                </Row>
                )}
                {(formData.prerace !== '' && formData.prerace === '0') && (
                <Row>
                    <Col xs={4} sm={12} className="d-flex align-items-center mt-2">
                        <Form.Label>着外回数</Form.Label>
                    </Col>
                    <Col xs={4} sm={10} className="d-flex align-items-center justify-content-center">
                        <Form.Control
                            type="text"
                            name="lostcnt_out"
                            value={formData.lostcnt_out} // 小数点以下1桁まで表示
                            onChange={ataiChange}
                        />
                    </Col>
                    <Col xs={1} className="d-flex mt-2"><Form.Label>回</Form.Label></Col>
                    <Col xs={1} sm={1} className="d-flex align-items-center justify-content-center">
                        {/* 減算ボタン */}
                        <Button variant="secondary" onClick={() => decrement('lostcnt_out')}>-</Button>
                    </Col>
                    <Col xs={1} sm={1} className="d-flex align-items-center justify-content-center">
                        {/* 加算ボタン */}
                        <Button variant="secondary" onClick={() => increment('lostcnt_out')}>+</Button>
                    </Col>
                </Row>
                )}
                <Row>
                    <Col xs={4} sm={12} className="d-flex align-items-center mt-2">
                        <Form.Label>調整用</Form.Label>
                    </Col>
                    <Col xs={4} sm={10} className="d-flex align-items-center justify-content-center">
                        <Form.Control
                            type="text"
                            name="lostcnt_etc"
                            value={formData.lostcnt_etc} // 小数点以下1桁まで表示
                            onChange={ataiChange}
                        />
                    </Col>
                    <Col xs={1} className="mt-2"><Form.Label>%</Form.Label></Col>
                    <Col xs={1} sm={1} className="d-flex align-items-center justify-content-center">
                        {/* 減算ボタン */}
                        <Button variant="secondary" onClick={() => decrement('lostcnt_etc')}>-</Button>
                    </Col>
                    <Col xs={1} sm={1} className="d-flex align-items-center justify-content-center">
                        {/* 加算ボタン */}
                        <Button variant="secondary" onClick={() => increment('lostcnt_etc')}>+</Button>
                    </Col>
                </Row>
                <Row>
                    <Col style={{ fontSize: '12px' }}>距離適性400mズレ-1%,馬場適正 「○」-1% 「△」-2%<br/>馬体重6キロズレで-1%,以降2kgごとに-1%</Col>
                </Row>
                <br/>
                <Row className="text-center ms-1 me-1">
                    <Button type="submit" variant="primary" className="w-100 mb-2">素質チェック！</Button>
                    <Button type="reset" variant="secondary" className="w-100" onClick={handleReset}>リセット</Button>                    
                </Row>
        </Form>

        {/* テーブル部分 */}
        {viewBool &&(
        <Table>
            <thead>
                <tr>
                    <td>調整後オッズ</td>
                    <td>素質</td>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>{viewOdds}倍</td>
                    <td>{soshitsu}</td>
                </tr>
            </tbody>
        </Table>
        )}
        {viewBool &&(
        <Table striped bordered hover className="mt-3" style={{ fontSize: '12px' }}>
            <thead>
            <tr>
                <th>素質</th>
                <th>単勝オッズ</th>
                <th>サイトA単ラ</th>
                <th>サイトB単ラ</th>
            </tr>
            </thead>
            <tbody>
            {soshitsuList.map((data, index) => (
                <tr key={index}>
                    <td>{data.comm}</td>
                    <td>{data.win}</td>
                    <td
                        style={{/* backgroundColor:
                            parseFloat(data.win_r) === parseFloat(viewOdds) ? "#d8c640"
                          : parseFloat(data.win_r) > parseFloat(viewOdds) && parseFloat(soshitsuList[index-1]?.win_r) < parseFloat(viewOdds) ? "#d8c640"
                          :""
                        */}}
                    >{data.win_r}</td>
                    <td
                        style={{/* backgroundColor:
                            parseFloat(data.win_rh) === parseFloat(viewOdds) ? "#d8c640"
                          : parseFloat(data.win_rh) > parseFloat(viewOdds) && parseFloat(soshitsuList[index-1]?.win_rh) < parseFloat(viewOdds) ? "#d8c640"
                          :""
                        */}}
                    >{data.win_rh}</td>
                </tr>
            ))}
            </tbody>
        </Table>
        )}
        <br/>
        <Button type="reset" variant="success" className="w-100" onClick={backpage}>戻る</Button> 
    </Container>
  );
};

export default Hantei;