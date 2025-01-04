//馬名ID表
interface HorseIDData{
    horseID: string;
    horseKeitou: string;
    sex: number;
    aisyo: string;
}

export const HorseIDData = [
    {horseID:'A01',horseKeitou:'不明',sex: 1, aisyo:""},
    {horseID:'A02',horseKeitou:'ダーレーアラビアン系',sex: 1, aisyo:""},
    {horseID:'A03',horseKeitou:'セントサイモン系',sex: 1, aisyo:""},
    {horseID:'A04',horseKeitou:'タッチストン系',sex: 1, aisyo:""},
    {horseID:'A05',horseKeitou:'バードキャッチャー系',sex: 1, aisyo:""},
    {horseID:'A06',horseKeitou:'レイズアネイティヴ系',sex: 1, aisyo:""},
    {horseID:'A07',horseKeitou:'ヘイルトゥリーズン系',sex: 1, aisyo:""},
    {horseID:'A08',horseKeitou:'サンデーサイレンス系',sex: 1, aisyo:""},
    {horseID:'A09',horseKeitou:'ナスルーラ系',sex: 1, aisyo:""},
    {horseID:'A10',horseKeitou:'グレイソブリン系',sex: 1, aisyo:""},
    {horseID:'A11',horseKeitou:'ノーザンダンサー系',sex: 1, aisyo:""},
    {horseID:'A12',horseKeitou:'サドラーズウェルズ系',sex: 1, aisyo:""},
    {horseID:'A13',horseKeitou:'ダンチヒ系',sex: 1, aisyo:""},
    {horseID:'A14',horseKeitou:'ニジンスキー系',sex: 1, aisyo:""},
    {horseID:'A15',horseKeitou:'ノーザンテースト系',sex: 1, aisyo:""},
    {horseID:'A16',horseKeitou:'リファール系',sex: 1, aisyo:""},
    {horseID:'A17',horseKeitou:'バイアリーターク系',sex: 1, aisyo:""},
    {horseID:'A18',horseKeitou:'バザード系',sex: 1, aisyo:""},
    {horseID:'A19',horseKeitou:'トウルビヨン系',sex: 1, aisyo:""},
    {horseID:'A20',horseKeitou:'ゴドルフィンバルブ系',sex: 1, aisyo:""},
    {horseID:'A21',horseKeitou:'マンノウォー系',sex: 1, aisyo:""},
    {horseID:'A22',horseKeitou:'オルコックアラビアン系',sex: 1, aisyo:""},
    {horseID:'A23',horseKeitou:'ダイオメド系',sex: 1, aisyo:""},
    {horseID:'B01',horseKeitou:'不明',sex: 2, aisyo:""},
    {horseID:'B02',horseKeitou:'プロミス族',sex: 2, aisyo:""},
    {horseID:'B03',horseKeitou:'ペネロペ族',sex: 2, aisyo:""},
    {horseID:'B04',horseKeitou:'プリンセス族',sex: 2, aisyo:""},
    {horseID:'B05',horseKeitou:'バートンバルブメア族',sex: 2, aisyo:""},
    {horseID:'B06',horseKeitou:'ボーズメア族',sex: 2, aisyo:""},
    {horseID:'B07',horseKeitou:'フローリスカップ族',sex: 2, aisyo:""},
    {horseID:'B08',horseKeitou:'レイトンバルブメア族',sex: 2, aisyo:""},
    {horseID:'B09',horseKeitou:'アンティシペイション族',sex: 2, aisyo:""},
    {horseID:'B10',horseKeitou:'エボニー族',sex: 2, aisyo:""},
    {horseID:'B11',horseKeitou:'オールドボールドペグ族',sex: 2, aisyo:""},
    {horseID:'B12',horseKeitou:'ピラ族',sex: 2, aisyo:""},
    {horseID:'B13',horseKeitou:'バストラーメア族',sex: 2, aisyo:""},
    {horseID:'B14',horseKeitou:'メイドオブマッサム族',sex: 2, aisyo:""},
    {horseID:'B15',horseKeitou:'ヴィントナーメア族',sex: 2, aisyo:""},
    {horseID:'B16',horseKeitou:'フェアヘレン族',sex: 2, aisyo:""},
    {horseID:'B17',horseKeitou:'カミラ族',sex: 2, aisyo:""},
    {horseID:'B18',horseKeitou:'グレイハウンドメア族',sex: 2, aisyo:""},
    {horseID:'B19',horseKeitou:'マザーウエスタン族',sex: 2, aisyo:""},
    {horseID:'B20',horseKeitou:'セドバリーロイヤルメア族',sex: 2, aisyo:""},
    {horseID:'B21',horseKeitou:'ブルネット族',sex: 2, aisyo:""},
    {horseID:'B22',horseKeitou:'ミスアグネス族',sex: 2, aisyo:""},
    {horseID:'B23',horseKeitou:'フェアウェル族',sex: 2, aisyo:""},
    {horseID:'B24',horseKeitou:'ビディ族',sex: 2, aisyo:""},
    {horseID:'B25',horseKeitou:'ミスウィンザー族',sex: 2, aisyo:""},
    {horseID:'B26',horseKeitou:'チューベローズ族',sex: 2, aisyo:""},
    {horseID:'B27',horseKeitou:'ケードメア族',sex: 2, aisyo:""},
    {horseID:'B28',horseKeitou:'ワグテイル族',sex: 2, aisyo:""},
    {horseID:'B29',horseKeitou:'カナリーバード族',sex: 2, aisyo:""},
    {horseID:'B30',horseKeitou:'ピピンペグズダム族',sex: 2, aisyo:""},
    {horseID:'B31',horseKeitou:'ミラ族',sex: 2, aisyo:""},
    {horseID:'B32',horseKeitou:'マイナーファミリーライン',sex: 2, aisyo:""},
  ];

//種牡馬組み合わせ表
interface BobaData {
    bobaId: string;
    name: string;
    Kumi: string;
/*    
    B01: number;
    B02: number;
    B03: number;
    B04: number;
    B05: number;
*/
  }

export const BobaData = [
    { bobaId: 'A01', name: '不明', kumi:'13212133212323112332111233131311'},
    { bobaId: 'A02', name: 'ダーレーアラビアン系', kumi:'32113231113331311122122111312133'},
    { bobaId: 'A03', name: 'セントサイモン系', kumi:'31331211323133212223122212112113'},
    { bobaId: 'A04', name: 'タッチストン系', kumi:'12213321323311131312322333121211'},
    { bobaId: 'A05', name: 'バードキャッチャー系', kumi:'23132331313132133311133322212332'},
    { bobaId: 'A06', name: 'レイズアネイティヴ系', kumi:'31213323112121132133233131113313'},
    { bobaId: 'A07', name: 'ヘイルトゥリーズン系', kumi:'32111323113212212233233131213133'},
    { bobaId: 'A08', name: 'サンデーサイレンス系', kumi:'31321311231212311132331222233213'},
    { bobaId: 'A09', name: 'ナスルーラ系', kumi:'13111333122313123223233131212131'},
    { bobaId: 'A10', name: 'グレイソブリン系', kumi:'12323132132312221131233112121331'},
    { bobaId: 'A11', name: 'ノーザンダンサー系', kumi:'23321321333223121331311312322132'},
    { bobaId: 'A12', name: 'サドラーズウェルズ系', kumi:'12312232213122221111133133131211'},
    { bobaId: 'A13', name: 'ダンチヒ系', kumi:'23131213113221131333122223321112'},
    { bobaId: 'A14', name: 'ニジンスキー系', kumi:'21132213133233321333133322221212'},
    { bobaId: 'A15', name: 'ノーザンテースト系', kumi:'13131111312123222131311112213111'},
    { bobaId: 'A16', name: 'リファール系', kumi:'11232111123222323312332112322331'},
    { bobaId: 'A17', name: 'バイアリーターク系', kumi:'21132231121332313312211213333232'},
    { bobaId: 'A18', name: 'バザード系', kumi:'32223113123323313133111213332333'},
    { bobaId: 'A19', name: 'トウルビヨン系', kumi:'23123313231122221321311333231212'},
    { bobaId: 'A20', name: 'ゴドルフィンバルブ系', kumi:'32213312231211332213311321232113'},
    { bobaId: 'A21', name: 'マンノウォー系', kumi:'31323132231232313111222221123313'},
    { bobaId: 'A22', name: 'オルコックアラビアン系', kumi:'11231211313333133333222312212131'},
    { bobaId: 'A23', name: 'ダイオメド系', kumi:'11131131133331311331333111313131'},
  ];

//繁殖牝馬組み合わせ表
interface HinbaData {
    hinbaId: string;
    name: string;
    Kumi: string;
/*    
    B01: number;
    B02: number;
    B03: number;
    B04: number;
    B05: number;
*/
  }

export const HinbaData = [
    { hinbaId: 'B01', name: '不明', Kumi:"13312333112122112323311" },
    { hinbaId: 'B02', name: 'プロミス族', Kumi:"32123121323231311232111" },
    { hinbaId: 'B03', name: 'ペネロペ族', Kumi:"21321213133311121212321" },
    { hinbaId: 'B04', name: 'プリンセス族', Kumi:"11313112122133333221233" },
    { hinbaId: 'B05', name: 'バートンバルブメア族', Kumi:"23132311131212122333311" },
    { hinbaId: 'B06', name: 'ボーズメア族', Kumi:"12233333313222112133121" },
    { hinbaId: 'B07', name: 'フローリスカップ族', Kumi:"33123221332311113111313" },
    { hinbaId: 'B08', name: 'レイトンバルブメア族', Kumi:"31111331321233111332211" },
    { hinbaId: 'B09', name: 'アンティシペイション族', Kumi:"21333112113211311122231" },
    { hinbaId: 'B10', name: 'エボニー族', Kumi:"11221113233113122233313" },
    { hinbaId: 'B11', name: 'オールドボールドペグ族', Kumi:"23333231223333231311133" },
    { hinbaId: 'B12', name: 'ピラ族', Kumi:"33131122332122123312233" },
    { hinbaId: 'B13', name: 'バストラーメア族', Kumi:"23313211112223223221333" },
    { hinbaId: 'B14', name: 'メイドオブマッサム族', Kumi:"31312122323213322321231" },
    { hinbaId: 'B15', name: 'ヴィントナーメア族', Kumi:"13211123121213233323313" },
    { hinbaId: 'B16', name: 'フェアヘレン族', Kumi:"11133311222232221123131" },
    { hinbaId: 'B17', name: 'カミラ族', Kumi:"21213221311111233312331" },
    { hinbaId: 'B18', name: 'グレイハウンドメア族', Kumi:"31233121213133133132133" },
    { hinbaId: 'B19', name: 'マザーウエスタン族', Kumi:"32211333233133311321133" },
    { hinbaId: 'B20', name: 'セドバリーロイヤルメア族', Kumi:"22321332311133122313131" },
    { hinbaId: 'B21', name: 'ブルネット族', Kumi:"11131223223111332133223" },
    { hinbaId: 'B22', name: 'ミスアグネス族', Kumi:"12223333331323131111223" },
    { hinbaId: 'B23', name: 'フェアウェル族', Kumi:"12223331331323121111223" },
    { hinbaId: 'B24', name: 'ビディ族', Kumi:"21233112113123112233231" },
    { hinbaId: 'B25', name: 'ミスウィンザー族', Kumi:"31132332311322111132211" },
    { hinbaId: 'B26', name: 'チューベローズ族', Kumi:"31232112122332223331121" },
    { hinbaId: 'B27', name: 'ケードメア族', Kumi:"13112122213132233322123" },
    { hinbaId: 'B28', name: 'ワグテイル族', Kumi:"31121113122322123333211" },
    { hinbaId: 'B29', name: 'カナリーバード族', Kumi:"12212333212111323212323" },
    { hinbaId: 'B30', name: 'ピピンペグズダム族', Kumi:"31123312131212132321311" },
    { hinbaId: 'B31', name: 'ミラ族', Kumi:"13113131333111133311133" },
    { hinbaId: 'B32', name: 'マイナーファミリーライン', Kumi:"13312333112122112323311" },
  ];  