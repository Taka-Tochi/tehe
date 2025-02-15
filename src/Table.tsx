import React, { useState, useEffect } from 'react';
import { HorseIDData, BobaData, HinbaData } from './TaneData';

const Table: React.FC = () => {
  const [selectBoba, setSelectBoba] = useState<string>('');
  const [selectHinba, setSelectHinba] = useState<string>('');
  const [horseList, setHorselist] = useState(HorseIDData);

  // Boba選択肢を並び替え（例: 名前順）
  const sortedBobaData = [...BobaData].sort((a, b) => a.name.localeCompare(b.name));

  // Hinba選択肢を並び替え（例: 名前順）
  const sortedHinbaData = [...HinbaData].sort((a, b) => a.name.localeCompare(b.name));

  const fetchBobaData = async (val: string) => {
    try {
      setSelectBoba(val);
      const selectedItem = BobaData.find(item => item.bobaId === val);
      if (!selectedItem?.kumi) return;

      const splitData = selectedItem.kumi.split('');
      const HinbaIchiran = HorseIDData.filter(item => item.sex === 2);

      let forCnt = 0;
      splitData.forEach(el => {
        if (el === '1') HinbaIchiran[forCnt].aisyo = '堅実';
        if (el === '2') HinbaIchiran[forCnt].aisyo = '平均';
        if (el === '3') HinbaIchiran[forCnt].aisyo = '一発';
        forCnt++;
      });
      setHorselist(HinbaIchiran);

      const sortedData = [...HinbaIchiran].sort((a, b) => a.horseKeitou.localeCompare(b.horseKeitou));
      setHorselist(sortedData);
    } catch {
      console.error('Error fetching Boba data');
    }
  };

  const bobaChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectHinba("B00");
    setHorselist([]);
    fetchBobaData(event.target.value);
  };

  useEffect(() => {

    document.title = '血統検索'; // タイトルを設定
    if (selectBoba) {
      fetchBobaData(selectBoba);
    }
  }, [selectBoba]);

  const fetchHinbaData = async (val: string) => {
    try {
      setSelectHinba(val);
      const selectedHinItem = HinbaData.find(item => item.hinbaId === val);
      if (!selectedHinItem?.Kumi) return;

      const splitData = selectedHinItem.Kumi.split('');
      const BobaIchiran = HorseIDData.filter(item => item.sex === 1);

      let forCnt = 0;
      splitData.forEach(el => {
        if (el === '1') BobaIchiran[forCnt].aisyo = '堅実';
        if (el === '2') BobaIchiran[forCnt].aisyo = '平均';
        if (el === '3') BobaIchiran[forCnt].aisyo = '一発';
        forCnt++;
      });
      setHorselist(BobaIchiran);

      const sortedData = [...BobaIchiran].sort((a, b) => a.horseKeitou.localeCompare(b.horseKeitou));
      setHorselist(sortedData);
    } catch {
      console.error('Error fetching Hinba data');
    }
  };

  const hinbaChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectBoba("A00");
    setHorselist([]);
    fetchHinbaData(event.target.value);
  };

  return (
    <div className="">
      <h1>血統表</h1>
      <label>牡馬血統：
        <select name="boba" value={selectBoba} onChange={bobaChange}>
          <option value="A00">-----選択-----</option>
          {sortedBobaData.map((item) => (
            <option key={item.bobaId} value={item.bobaId}>{item.name}</option>
          ))}
        </select>
      </label>
      <br />
      <label>牝馬血統：
        <select name="hinba" value={selectHinba} onChange={hinbaChange}>
        <option value="B00">-----選択-----</option>
          {sortedHinbaData.map((item) => (
            <option key={item.hinbaId} value={item.hinbaId}>{item.name}</option>
          ))}
        </select>
      </label>
      <br />
      <label>結果：</label>
      <div className="">
        <table>
          <thead>
            <tr>
              <th style={{ border: '1px solid black', padding: '8px' }}>馬名</th>
              <th style={{ border: '1px solid black', padding: '8px' }}>相性</th>
            </tr>
          </thead>
          <tbody>
            {horseList.map((row) => (
              <tr
                key={row.horseID}
                style={{
                  backgroundColor:
                    row.aisyo === '堅実' ? '#add6ff' : row.aisyo === '平均' ? '#ffff9e' : row.aisyo === '一発' ? '#ff9e9e' : '#ffffff', // idによる色付け
                }}
              >
                <td style={{ border: '1px solid black', padding: '8px' }}>{row.horseKeitou}</td>
                <td style={{ border: '1px solid black', padding: '8px' }}>{row.aisyo}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Table;