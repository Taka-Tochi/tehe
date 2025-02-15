import React, { useState } from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
import { Container, Form,Button,Row, Col } from 'react-bootstrap';
import { HorseIDData, BloodData } from './TaneData';


const Blood: React.FC = () => {
    //あれ
    const [bloodDataList, setBloodDataList] = useState(BloodData);
    // セレクトボックスの選択状態
    const [selectedHorseId, setSelectedHorseId] = useState<string>("B09"); //初期表示は牝馬のアンティシペイション族を出す
    // セレクトボックスの変更イベント
    const handleSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedHorseId(event.target.value);
    };
    // ラジオボタンの選択状態（"stallion" = 種牡馬, "mare" = 繁殖牝馬）
    const [category, setCategory] = useState<"stallion" | "mare">("mare");
    // ラジオボタンの変更イベント
    const handleCategoryChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setCategory(event.target.value as "stallion" | "mare");
        setSelectedHorseId(""); // カテゴリ変更時にセレクトをリセット
        category === "mare" ? setSelectedHorseId("A22") : setSelectedHorseId("B09"); //牡馬牝馬選択の初期値セット
    };
    // ソート状態を管理（キーと昇順/降順）
    type bdData = {
        kettoId: string;
        kettoName: string;
        name: string;
        memo1: string;
        memo2: string;
        memo3: string;
      };
    const [sortConfig, setSortConfig] = useState<{ key: keyof bdData; direction: "asc" | "desc" } | null>(null);
    // 並び替え処理
    const sortedData = [...bloodDataList].sort((a, b) => {
        if (!sortConfig) return 0; // ソート設定がない場合はそのまま
        const { key, direction } = sortConfig;
        const order = direction === "asc" ? 1 : -1;
        return a[key].localeCompare(b[key]) * order; // 文字列ソート
    });
    // ヘッダークリック時のソート変更
    const handleSort = (key: keyof bdData) => {
        setSortConfig((prev) => {
        if (prev && prev.key === key) {
            return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
        }
        return { key, direction: "asc" };
        });
    };


    //チェックボックスの情報
    const [checkedItems, setCheckedItems] = useState<{ [key: string]: boolean }>({
        "堅実": false,
        "平均": false,
        "一発": false
    });
    // チェックボックスの変更
    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCheckedItems({
            ...checkedItems,
            [e.target.name]: e.target.checked
        });
    };
    // フィルタリング（種牡馬・繁殖牝馬）
    const filteredDataA = HorseIDData
    .filter(a => category === "stallion" ? a.horseID.startsWith("A") : a.horseID.startsWith("B"))
    .sort((a, b) => a.horseKeitou.localeCompare(b.horseKeitou));  // ★ここで昇順ソート

    //検索ボタン押下
    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!checkedItems["堅実"] && !checkedItems["平均"] && !checkedItems["一発"]) {
            alert('1つ以上チェックしてください！');
            return;
        };
        const bdList = BloodData
        .filter(a => category === "stallion" ? a.kettoId.startsWith("B") : a.kettoId.startsWith("A"))

        //系統情報を取得
        const selectData = HorseIDData.filter(a => a.horseID === selectedHorseId)[0].aisyo.split('');

        //オプションを見て必要なものだけ取得する
        const tete = bdList
        .map((i, idx) => {
            var getHaigoId = Number(i.kettoId.replace("A", "").replace("B", ""));
            var haigoPln = selectData[getHaigoId - 1];

            if ((haigoPln === "1" && checkedItems["堅実"]) ||
                (haigoPln === "2" && checkedItems["平均"]) ||
                (haigoPln === "3" && checkedItems["一発"])) {
                    i.memo1 = "からあげ";
                    if (haigoPln === '1') i.memo1 = '堅実';
                    if (haigoPln === '2') i.memo1 = '平均';
                    if (haigoPln === '3') i.memo1 = '一発';
                return i;
            }
            return null; // 条件に合わない場合は null
        })
        .filter((i): i is { kettoId: string; kettoName: string; name: string; memo1: string; memo2: string; memo3: string; } => i !== null);
        
        //ここで格納
        setBloodDataList(tete);

    }

    return (
        <Container className="mt-6">
        <h2 className="text-center">血統チェック(仮)</h2>
        {/* ラジオボタン（種牡馬 / 繁殖牝馬） */}
        <Form onSubmit={handleSubmit}>
            <Row  className="mb-3">
                <Col xs={4} sm={12} className="d-flex align-items-center mt-2">
                    <Form.Label>選択</Form.Label>
                </Col>
                <Col xs={6} sm={12}>
                <Form.Check
                    type="radio"
                    label="種牡馬"
                    value="stallion"
                    checked={category === "stallion"}
                    onChange={handleCategoryChange}
                />
                <Form.Check
                    type="radio"
                    label="繁殖牝馬"
                    value="mare"
                    checked={category === "mare"}
                    onChange={handleCategoryChange}
                />
                </Col>
            </Row>
            {/* セレクトボックス */}
            <Row className='mb-3'>
                <Col xs={4} sm={12} className="d-flex align-items-center mt-2">
                    <Form.Label>系統を選択</Form.Label>
                </Col>
                <Col xs={8} sm={12}>
                    <Form.Select value={selectedHorseId} onChange={handleSelectChange}>
                        {filteredDataA.map((item) => (
                            <option key={item.horseID} value={item.horseID}>
                                {item.horseKeitou}
                            </option>
                        ))}
                    </Form.Select>
                </Col> 
            </Row>
            {/* チェックボックス */}
            <Row className='mb-3'>
            <Col xs={4} sm={12} className="d-flex align-items-center mt-2">
                    <Form.Label>表示オプション</Form.Label>
                </Col>
                <Col xs={6} sm={12}>
                    {["堅実", "平均", "一発"].map((label) => (
                        <Form.Check 
                            key={label}
                            type="checkbox"
                            label={label}
                            name={label}
                            checked={checkedItems[label]}
                            onChange={handleCheckboxChange}
                        />
                    ))}
                </Col> 
            </Row>

            <Button type="submit" variant="primary" className="w-100 mb-2">検索！</Button>
        </Form>
        {/* テーブル */}
        <table className="table table-bordered" style={{ fontSize: "9px" }}>
        <thead className="thead-light">
            <tr>
            <th onClick={() => handleSort("kettoName")} style={{ cursor: "pointer" }}>
                系統 {sortConfig?.key === "kettoName" ? (sortConfig.direction === "asc" ? "▲" : "▼") : ""}
            </th>
            <th onClick={() => handleSort("name")} style={{ cursor: "pointer" }}>
                馬名 {sortConfig?.key === "name" ? (sortConfig.direction === "asc" ? "▲" : "▼") : ""}
            </th>
            <th onClick={() => handleSort("memo1")} style={{ cursor: "pointer" }}>
                相性 {sortConfig?.key === "memo1" ? (sortConfig.direction === "asc" ? "▲" : "▼") : ""}
            </th>
            <th>備考</th>
            </tr>
        </thead>
        <tbody>
            {sortedData.map((data, index) => (
            <tr key={index}>
                <td>{data.kettoName}</td>
                <td>{data.name}</td>
                <td
                                style={{
                                    backgroundColor:
                                      data.memo1 === '堅実' ? '#add6ff' : data.memo1  === '平均' ? '#ffff9e' : data.memo1 === '一発' ? '#ff9e9e' : '#ffffff', // idによる色付け
                                  }}
                
                >{data.memo1}</td>
            </tr>
            ))}
        </tbody>
        </table>
    </Container>
    );
};
export default Blood;
