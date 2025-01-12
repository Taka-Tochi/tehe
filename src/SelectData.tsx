//競争馬スタート
export const StartDebut = [
    {id:'0', start:'3歳'},
    {id:'1', start:'古馬'},
]

//2歳G1結果
export const PreRace = [
    {id:'0', start:'未出走'},
    {id:'1', start:'1着'},
    {id:'2', start:'2着'},
    {id:'3', start:'3着'},
    {id:'4', start:'4着以下'},
]

//2歳G1結果
export const PreRaceNinki = [
    {id:'1', start:'1人気'},
    {id:'2', start:'2人気'},
    {id:'3', start:'3人気'},
    {id:'4', start:'4人気以下'},
]

//初戦レースデータ
export const StartRaceData = [
    {id:'A1',racename:'400枚G1', grade:'400', pattern: "9", viewlist:"true"},
    {id:'A2',racename:'500枚G1', grade:'500', pattern: "9", viewlist:"true"},
    {id:'A3',racename:'700枚G1', grade:'700', pattern: "1", viewlist:"false"},
    {id:'A4',racename:'1000枚G1', grade:'1000A', pattern: "2", viewlist:"true"},
    {id:'A5',racename:'英ダービー', grade:'1000B', pattern: "2", viewlist:"false"},
    {id:'A6',racename:'160枚G2', grade:'160', pattern: "3", viewlist:"false"},
    {id:'A7',racename:'200枚G2', grade:'200', pattern: "3", viewlist:"false"},
    {id:'A8',racename:'1000枚混合G1', grade:'1000C', pattern: "2", viewlist:"false"},
]

//調子
export const Choshi = [
    {id:'1', start:'↑'},
    {id:'2', start:'↗'},
    {id:'3', start:'→'},
    {id:'4', start:'↘'},
    {id:'5', start:'↓'},
]

//馬名ID表
interface SoshitsuData{
    id: string;
    comm: string;
    win: number;
    win_r: number;
    win_rh: number;
    pre: string;
    grade: string;
}

//素質テーブル
export const SoshitsuData = [
    {id:'sss' ,comm:'SS', win:'1.7', win_r:'2.069', win_rh:'1.999', grade:'400',pre:"1" },
    {id:'khh' ,comm:'怪物上上', win:'1.8', win_r:'2.139', win_rh:'2.059', grade:'400', pre:"1" },
    {id:'khm' ,comm:'怪物上中', win:'1.9', win_r:'2.210', win_rh:'2.129', grade:'400', pre:"1" },
    {id:'khl' ,comm:'怪物上下', win:'1.9', win_r:'2.285', win_rh:'2.199', grade:'400', pre:"1" },
    {id:'kmh' ,comm:'怪物中上', win:'2.0', win_r:'2.361', win_rh:'2.279', grade:'400', pre:"1" },
    {id:'kmm' ,comm:'怪物中中', win:'2.1', win_r:'2.441', win_rh:'2.359', grade:'400', pre:"1" },
    {id:'kml' ,comm:'怪物中下', win:'2.1', win_r:'2.523', win_rh:'2.439', grade:'400', pre:"1" },
    {id:'klh' ,comm:'怪物下上', win:'2.2', win_r:'2.608', win_rh:'2.519', grade:'400', pre:"1" },
    {id:'klm' ,comm:'怪物下中', win:'2.3', win_r:'2.695', win_rh:'2.599', grade:'400', pre:"1" },
    {id:'kll' ,comm:'怪物下下', win:'2.4', win_r:'2.786', win_rh:'2.699', grade:'400', pre:"1" },
    {id:'sah' ,comm:'サラ上', win:'2.6', win_r:'3.076', win_rh:'2.849', grade:'400', pre:"1" },
    {id:'sam' ,comm:'サラ中', win:'2.9', win_r:'3.397', win_rh:'2.999', grade:'400', pre:"1" },
    {id:'sal' ,comm:'サラ下', win:'3.2', win_r:'3.751', win_rh:'3.199', grade:'400', pre:"1" },

    {id:'sss' ,comm:'SS', win:'1.9', win_r:'2.265', win_rh:'2.199', grade:'400',pre:"2" },
    {id:'khh' ,comm:'怪物上上', win:'2.0', win_r:'2.341', win_rh:'2.259', grade:'400', pre:"2" },
    {id:'khm' ,comm:'怪物上中', win:'2.0', win_r:'2.420', win_rh:'2.329', grade:'400', pre:"2" },
    {id:'khl' ,comm:'怪物上下', win:'2.1', win_r:'2.502', win_rh:'2.399', grade:'400', pre:"2" },
    {id:'kmh' ,comm:'怪物中上', win:'2.2', win_r:'2.587', win_rh:'2.479', grade:'400', pre:"2" },
    {id:'kmm' ,comm:'怪物中中', win:'2.3', win_r:'2.674', win_rh:'2.559', grade:'400', pre:"2" },
    {id:'kml' ,comm:'怪物中下', win:'2.3', win_r:'2.765', win_rh:'2.639', grade:'400', pre:"2" },
    {id:'klh' ,comm:'怪物下上', win:'2.4', win_r:'2.858', win_rh:'2.719', grade:'400', pre:"2" },
    {id:'klm' ,comm:'怪物下中', win:'2.5', win_r:'2.955', win_rh:'2.799', grade:'400', pre:"2" },
    {id:'kll' ,comm:'怪物下下', win:'2.6', win_r:'3.055', win_rh:'2.899', grade:'400', pre:"2" },
    {id:'sah' ,comm:'サラ上', win:'2.9', win_r:'3.375', win_rh:'3.049', grade:'400', pre:"2" },
    {id:'sam' ,comm:'サラ中', win:'3.2', win_r:'3.729', win_rh:'3.199', grade:'400', pre:"2" },
    {id:'sal' ,comm:'サラ下', win:'3.5', win_r:'4.120', win_rh:'3.399', grade:'400', pre:"2" },

    {id:'sss' ,comm:'SS', win:'2.1', win_r:'2.463', win_rh:'2.399', grade:'400',pre:"3" },
    {id:'khh' ,comm:'怪物上上', win:'2.2', win_r:'2.547', win_rh:'2.459', grade:'400', pre:"3" },
    {id:'khm' ,comm:'怪物上中', win:'2.2', win_r:'2.634', win_rh:'2.529', grade:'400', pre:"3" },
    {id:'khl' ,comm:'怪物上下', win:'2.3', win_r:'2.723', win_rh:'2.599', grade:'400', pre:"3" },
    {id:'kmh' ,comm:'怪物中上', win:'2.4', win_r:'2.816', win_rh:'2.679', grade:'400', pre:"3" },
    {id:'kmm' ,comm:'怪物中中', win:'2.5', win_r:'2.912', win_rh:'2.759', grade:'400', pre:"3" },
    {id:'kml' ,comm:'怪物中下', win:'2.6', win_r:'3.011', win_rh:'2.839', grade:'400', pre:"3" },
    {id:'klh' ,comm:'怪物下上', win:'2.6', win_r:'3.113', win_rh:'2.919', grade:'400', pre:"3" },
    {id:'klm' ,comm:'怪物下中', win:'2.7', win_r:'3.219', win_rh:'2.999', grade:'400', pre:"3" },
    {id:'kll' ,comm:'怪物下下', win:'2.8', win_r:'3.328', win_rh:'3.099', grade:'400', pre:"3" },
    {id:'sah' ,comm:'サラ上', win:'3.1', win_r:'3.679', win_rh:'3.249', grade:'400', pre:"3" },
    {id:'sam' ,comm:'サラ中', win:'3.5', win_r:'4.068', win_rh:'3.399', grade:'400', pre:"3" },
    {id:'sal' ,comm:'サラ下', win:'3.8', win_r:'4.497', win_rh:'3.599', grade:'400', pre:"3" },

    {id:'sss' ,comm:'SS', win:'2.5', win_r:'2.971', win_rh:'2.971', grade:'400',pre:"4" },
    {id:'khh' ,comm:'怪物上上', win:'2.6', win_r:'3.058', win_rh:'3.058', grade:'400', pre:"4" },
    {id:'khm' ,comm:'怪物上中', win:'2.7', win_r:'3.147', win_rh:'3.147', grade:'400', pre:"4" },
    {id:'khl' ,comm:'怪物上下', win:'2.8', win_r:'3.240', win_rh:'3.240', grade:'400', pre:"4" },
    {id:'kmh' ,comm:'怪物中上', win:'2.8', win_r:'3.335', win_rh:'3.335', grade:'400', pre:"4" },
    {id:'kmm' ,comm:'怪物中中', win:'2.9', win_r:'3.432', win_rh:'3.432', grade:'400', pre:"4" },
    {id:'kml' ,comm:'怪物中下', win:'3.0', win_r:'3.533', win_rh:'3.533', grade:'400', pre:"4" },
    {id:'klh' ,comm:'怪物下上', win:'3.1', win_r:'3.636', win_rh:'3.636', grade:'400', pre:"4" },
    {id:'klm' ,comm:'怪物下中', win:'3.2', win_r:'3.743', win_rh:'3.743', grade:'400', pre:"4" },
    {id:'kll' ,comm:'怪物下下', win:'3.3', win_r:'3.853', win_rh:'3.853', grade:'400', pre:"4" },
    {id:'sah' ,comm:'サラ上', win:'3.6', win_r:'4.201', win_rh:'4.201', grade:'400', pre:"4" },
    {id:'sam' ,comm:'サラ中', win:'3.9', win_r:'4.582', win_rh:'4.582', grade:'400', pre:"4" },
    {id:'sal' ,comm:'サラ下', win:'4.3', win_r:'4.996', win_rh:'4.996', grade:'400', pre:"4" },

    {id:'sss' ,comm:'SS', win:'1.8', win_r:'2.100', win_rh:'2.049', grade:'500',pre:"1" },
    {id:'khh' ,comm:'怪物上上', win:'1.8', win_r:'2.171', win_rh:'2.119', grade:'500', pre:"1" },
    {id:'khm' ,comm:'怪物上中', win:'1.9', win_r:'2.245', win_rh:'2.189', grade:'500', pre:"1" },
    {id:'khl' ,comm:'怪物上下', win:'2.0', win_r:'2.321', win_rh:'2.259', grade:'500', pre:"1" },
    {id:'kmh' ,comm:'怪物中上', win:'2.0', win_r:'2.399', win_rh:'2.339', grade:'500', pre:"1" },
    {id:'kmm' ,comm:'怪物中中', win:'2.1', win_r:'2.481', win_rh:'2.419', grade:'500', pre:"1" },
    {id:'kml' ,comm:'怪物中下', win:'2.2', win_r:'2.565', win_rh:'2.499', grade:'500', pre:"1" },
    {id:'klh' ,comm:'怪物下上', win:'2.2', win_r:'2.652', win_rh:'2.579', grade:'500', pre:"1" },
    {id:'klm' ,comm:'怪物下中', win:'2.3', win_r:'2.742', win_rh:'2.659', grade:'500', pre:"1" },
    {id:'kll' ,comm:'怪物下下', win:'2.4', win_r:'2.835', win_rh:'2.759', grade:'500', pre:"1" },
    {id:'sah' ,comm:'サラ上', win:'2.7', win_r:'3.133', win_rh:'2.909', grade:'500', pre:"1" },
    {id:'sam' ,comm:'サラ中', win:'2.9', win_r:'3.462', win_rh:'3.079', grade:'500', pre:"1" },
    {id:'sal' ,comm:'サラ下', win:'3.3', win_r:'3.826', win_rh:'3.299', grade:'500', pre:"1" },

    {id:'sss' ,comm:'SS', win:'1.9', win_r:'2.305', win_rh:'2.249', grade:'500',pre:"2" },
    {id:'khh' ,comm:'怪物上上', win:'2.0', win_r:'2.384', win_rh:'2.319', grade:'500', pre:"2" },
    {id:'khm' ,comm:'怪物上中', win:'2.1', win_r:'2.467', win_rh:'2.389', grade:'500', pre:"2" },
    {id:'khl' ,comm:'怪物上下', win:'2.2', win_r:'2.552', win_rh:'2.459', grade:'500', pre:"2" },
    {id:'kmh' ,comm:'怪物中上', win:'2.2', win_r:'2.640', win_rh:'2.539', grade:'500', pre:"2" },
    {id:'kmm' ,comm:'怪物中中', win:'2.3', win_r:'2.731', win_rh:'2.619', grade:'500', pre:"2" },
    {id:'kml' ,comm:'怪物中下', win:'2.4', win_r:'2.825', win_rh:'2.699', grade:'500', pre:"2" },
    {id:'klh' ,comm:'怪物下上', win:'2.5', win_r:'2.922', win_rh:'2.779', grade:'500', pre:"2" },
    {id:'klm' ,comm:'怪物下中', win:'2.6', win_r:'3.025', win_rh:'2.859', grade:'500', pre:"2" },
    {id:'kll' ,comm:'怪物下下', win:'2.7', win_r:'3.127', win_rh:'2.959', grade:'500', pre:"2" },
    {id:'sah' ,comm:'サラ上', win:'2.9', win_r:'3.462', win_rh:'3.109', grade:'500', pre:"2" },
    {id:'sam' ,comm:'サラ中', win:'3.3', win_r:'3.833', win_rh:'3.279', grade:'500', pre:"2" },
    {id:'sal' ,comm:'サラ下', win:'3.6', win_r:'4.244', win_rh:'3.499', grade:'500', pre:"2" },

    {id:'sss' ,comm:'SS', win:'2.1', win_r:'2.510', win_rh:'2.449', grade:'500',pre:"3" },
    {id:'khh' ,comm:'怪物上上', win:'2.2', win_r:'2.598', win_rh:'2.519', grade:'500', pre:"3" },
    {id:'khm' ,comm:'怪物上中', win:'2.3', win_r:'2.688', win_rh:'2.589', grade:'500', pre:"3" },
    {id:'khl' ,comm:'怪物上下', win:'2.4', win_r:'2.783', win_rh:'2.659', grade:'500', pre:"3" },
    {id:'kmh' ,comm:'怪物中上', win:'2.4', win_r:'2.880', win_rh:'2.739', grade:'500', pre:"3" },
    {id:'kmm' ,comm:'怪物中中', win:'2.5', win_r:'2.981', win_rh:'2.819', grade:'500', pre:"3" },
    {id:'kml' ,comm:'怪物中下', win:'2.6', win_r:'3.085', win_rh:'2.899', grade:'500', pre:"3" },
    {id:'klh' ,comm:'怪物下上', win:'2.7', win_r:'3.193', win_rh:'2.979', grade:'500', pre:"3" },
    {id:'klm' ,comm:'怪物下中', win:'2.8', win_r:'3.305', win_rh:'3.059', grade:'500', pre:"3" },
    {id:'kll' ,comm:'怪物下下', win:'2.9', win_r:'3.420', win_rh:'3.159', grade:'500', pre:"3" },
    {id:'sah' ,comm:'サラ上', win:'3.2', win_r:'3.792', win_rh:'3.309', grade:'500', pre:"3" },
    {id:'sam' ,comm:'サラ中', win:'3.6', win_r:'4.205', win_rh:'3.479', grade:'500', pre:"3" },
    {id:'sal' ,comm:'サラ下', win:'4.0', win_r:'4.662', win_rh:'3.699', grade:'500', pre:"3" },

    {id:'sss' ,comm:'SS', win:'2.6', win_r:'3.022', win_rh:'3.022', grade:'500',pre:"4" },
    {id:'khh' ,comm:'怪物上上', win:'2.7', win_r:'3.116', win_rh:'3.116', grade:'500', pre:"4" },
    {id:'khm' ,comm:'怪物上中', win:'2.7', win_r:'3.212', win_rh:'3.212', grade:'500', pre:"4" },
    {id:'khl' ,comm:'怪物上下', win:'2.8', win_r:'3.312', win_rh:'3.312', grade:'500', pre:"4" },
    {id:'kmh' ,comm:'怪物中上', win:'2.9', win_r:'3.415', win_rh:'3.415', grade:'500', pre:"4" },
    {id:'kmm' ,comm:'怪物中中', win:'3.0', win_r:'3.520', win_rh:'3.520', grade:'500', pre:"4" },
    {id:'kml' ,comm:'怪物中下', win:'3.1', win_r:'3.630', win_rh:'3.630', grade:'500', pre:"4" },
    {id:'klh' ,comm:'怪物下上', win:'3.2', win_r:'3.742', win_rh:'3.742', grade:'500', pre:"4" },
    {id:'klm' ,comm:'怪物下中', win:'3.3', win_r:'3.858', win_rh:'3.858', grade:'500', pre:"4" },
    {id:'kll' ,comm:'怪物下下', win:'3.4', win_r:'3.978', win_rh:'3.978', grade:'500', pre:"4" },
    {id:'sah' ,comm:'サラ上', win:'3.7', win_r:'4.359', win_rh:'4.359', grade:'500', pre:"4" },
    {id:'sam' ,comm:'サラ中', win:'4.1', win_r:'4.777', win_rh:'4.777', grade:'500', pre:"4" },
    {id:'sal' ,comm:'サラ下', win:'4.5', win_r:'5.236', win_rh:'5.236', grade:'500', pre:"4" },

    {id:'sss' ,comm:'SS', win:'1.9', win_r:'2.225', win_rh:'2.225', grade:'1000A',pre:"1" },
    {id:'khh' ,comm:'怪物上上', win:'2.0', win_r:'2.338', win_rh:'2.338', grade:'1000A', pre:"1" },
    {id:'khm' ,comm:'怪物上中', win:'2.1', win_r:'2.458', win_rh:'2.458', grade:'1000A', pre:"1" },
    {id:'khl' ,comm:'怪物上下', win:'2.2', win_r:'2.584', win_rh:'2.584', grade:'1000A', pre:"1" },
    {id:'kmh' ,comm:'怪物中上', win:'2.3', win_r:'2.716', win_rh:'2.716', grade:'1000A', pre:"1" },
    {id:'kmm' ,comm:'怪物中中', win:'2.4', win_r:'2.855', win_rh:'2.855', grade:'1000A', pre:"1" },
    {id:'kml' ,comm:'怪物中下', win:'2.5', win_r:'3.001', win_rh:'3.001', grade:'1000A', pre:"1" },
    {id:'klh' ,comm:'怪物下上', win:'2.7', win_r:'3.154', win_rh:'3.154', grade:'1000A', pre:"1" },
    {id:'klm' ,comm:'怪物下中', win:'2.8', win_r:'3.315', win_rh:'3.315', grade:'1000A', pre:"1" },
    {id:'kll' ,comm:'怪物下下', win:'2.9', win_r:'3.485', win_rh:'3.485', grade:'1000A', pre:"1" },
    {id:'sah' ,comm:'サラ上', win:'3.4', win_r:'4.047', win_rh:'4.047', grade:'1000A', pre:"1" },
    {id:'sam' ,comm:'サラ中', win:'4.0', win_r:'4.700', win_rh:'4.700', grade:'1000A', pre:"1" },
    {id:'sal' ,comm:'サラ下', win:'4.6', win_r:'5.459', win_rh:'5.459', grade:'1000A', pre:"1" },
]
