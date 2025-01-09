import React, { useState, useEffect } from 'react';
import { HorseIDData, BobaData, HinbaData } from './TaneData';

const Table: React.FC = () => {
  const [selectBoba, setSelectBoba] = useState<string>('');
  const [selectHinba, setSelectHinba] = useState<string>('');
  const [horseList, setHorselist] = useState(HorseIDData);

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
          <option value="A01">不明</option>
          <option value="A02">ダーレーアラビアン系</option>
          <option value="A03">セントサイモン系</option>
          <option value="A04">タッチストン系</option>
          <option value="A05">バードキャッチャー系</option>
          <option value="A06">レイズアネイティヴ系</option>
          <option value="A07">ヘイルトゥリーズン系</option>
          <option value="A08">サンデーサイレンス系</option>
          <option value="A09">ナスルーラ系</option>
          <option value="A10">グレイソブリン系</option>
          <option value="A11">ノーザンダンサー系</option>
          <option value="A12">サドラーズウェルズ系</option>
          <option value="A13">ダンチヒ系</option>
          <option value="A14">ニジンスキー系</option>
          <option value="A15">ノーザンテースト系</option>
          <option value="A16">リファール系</option>
          <option value="A17">バイアリーターク系</option>
          <option value="A18">バザード系</option>
          <option value="A19">トウルビヨン系</option>
          <option value="A20">ゴドルフィンバルブ系</option>
          <option value="A21">マンノウォー系</option>
          <option value="A22">オルコックアラビアン系</option>
          <option value="A23">ダイオメド系</option>
        </select>
      </label>
      <br />
      <label>牝馬血統：
        <select name="hinba" value={selectHinba} onChange={hinbaChange}>
          <option value="B00">-----選択-----</option>
          <option value="B01">不明</option>
          <option value="B02">プロミス族</option>
          <option value="B03">ペネロペ族</option>
          <option value="B04">プリンセス族</option>
          <option value="B05">バートンバルブメア族</option>
          <option value="B06">ボーズメア族</option>
          <option value="B07">フローリスカップ族</option>
          <option value="B08">レイトンバルブメア族</option>
          <option value="B09">アンティシペイション族</option>
          <option value="B10">エボニー族</option>
          <option value="B11">オールドボールドペグ族</option>
          <option value="B12">ピラ族</option>
          <option value="B13">バストラーメア族</option>
          <option value="B14">メイドオブマッサム族</option>
          <option value="B15">ヴィントナーメア族</option>
          <option value="B16">フェアヘレン族</option>
          <option value="B17">カミラ族</option>
          <option value="B18">グレイハウンドメア族</option>
          <option value="B19">マザーウエスタン族</option>
          <option value="B20">セドバリーロイヤルメア族</option>
          <option value="B21">ブルネット族</option>
          <option value="B22">ミスアグネス族</option>
          <option value="B23">フェアウェル族</option>
          <option value="B24">ビディ族</option>
          <option value="B25">ミスウィンザー族</option>
          <option value="B26">チューベローズ族</option>
          <option value="B27">ケードメア族</option>
          <option value="B28">ワグテイル族</option>
          <option value="B29">カナリーバード族</option>
          <option value="B30">ピピンペグズダム族</option>
          <option value="B31">ミラ族</option>
          <option value="B32">マイナーファミリーライン</option>
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