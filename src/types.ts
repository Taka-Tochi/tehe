// ============================================================
// types.ts
// スターホース3 インブリード判定機能 - 型定義
// ============================================================

/** 性別 */
export type Sex = "male" | "female";

/** JSONカタログ馬の血統表キー（本馬から見た相対位置） */
export type PedigreeKey =
  | "S" | "D"
  | "SS" | "SD" | "DS" | "DD"
  | "SSS" | "SSD" | "SDS" | "SDD" | "DSS" | "DSD" | "DDS" | "DDD";

/** カタログ馬の血統表の1マス */
export interface PedigreeAncestor {
  name: string;
  sex: Sex;
}

/** カタログ馬（JSONデータに実在する種牡馬・繁殖牝馬） */
export interface HorseRecord {
  name: string;
  line: string; // 系統名（例: "ヘイルトゥリーズン系"）
  emblem_src?: string;
  card_src?: string;
  grade_conditions?: { grade: string; condition: string; medal: string }[];
  comment?: string;
  child_note?: string | null;
  aptitude?: Record<string, string>;
  pedigree: Partial<Record<PedigreeKey, PedigreeAncestor>>;
  horse_type: "sire" | "mare";
}

/**
 * 血統ツリーのノード。
 * - catalog   : JSONカタログに実在する馬（そこから先の祖先は自動でぶら下がる）
 * - homebred  : 自家生産馬。名前は任意入力で、父・母はプレイヤーが手動で選択する
 * - unknown   : 不明／未設定（その先の系譜は考慮しない）
 */
export type PedigreeNode =
  | { type: "catalog"; horse: HorseRecord }
  | { type: "homebred"; name: string; sire: PedigreeNode | null; dam: PedigreeNode | null }
  | { type: "unknown" };

/** ツリーを平坦化した際の1エントリ */
export interface FlatAncestor {
  /** 同一個体判定に使う内部キー。カタログ馬は馬名そのもの、自家生産馬は構造的に生成した識別子 */
  name: string;
  /** 画面表示用のラベル（カタログ馬は馬名、自家生産馬は入力名 or "自家生産馬(父×母)"） */
  displayName: string;
  gen: number; // 1=本馬（対象馬 or 相手馬）, 2=父母, 3=祖父母, 4=曾祖父母
  /**
   * ルート個体からの絶対パス（S=父方/D=母方を連結した文字列、例:"SD"）。
   * ある祖先の一致が「別の、より浅い一致祖先自身の先の血統」かどうかを
   * 判定するために使う（同じ枝上で prefix になっているかを見る）。
   */
  path: string;
}

/** 同一祖先が重複した際の1組 */
export interface InbreedPair {
  /** 内部キー（効果表の検索や同一性の比較に使用） */
  name: string;
  /** 画面表示用ラベル */
  label: string;
  genA: number;
  genB: number;
  notation: string; // "n×m" 形式（n<=m）
}

/** インブリード判定結果 */
export interface InbreedResult {
  pairs: InbreedPair[];       // 検出された全ての重複ペア
  isValid: boolean;           // 配合可能かどうか
  invalidReason?: string;     // 配合不可の理由
  hasWeaknessRisk: boolean;   // 3×3が1つだけ含まれる場合の体質リスク注意
  hasPreProductionWarning: boolean; // 2×4または3×3が1つ含まれる場合の生産前注意
}

/** 候補馬1頭分のランキング結果 */
export interface CandidateResult {
  horse: HorseRecord;
  inbreed: InbreedResult;
  score: number;              // 効果一覧表に基づくスコア（現在はUI上未使用。互換のため残置）
  effects: { name: string; bonuses: string[] }[]; // 該当した祖先とその効果
  keitouGrade: KeitouGrade;   // 系統ベースの相性（堅実/鉄板/平均/一発/爆発/データなし）
  medalCount: number | null;  // grade_conditions の "★★★" 取得に必要なメダル枚数
  /**
   * candidates配列内での元のインデックス。HORSE_CATALOGには同名の馬が複数存在しうる
   * （実データで36件・72頭が重複）ため、horse.name は一覧表示のReact keyや
   * 順位マップのキーとして使えない（重複キーによりDOM更新が壊れる）。
   * その代わりに使う一意な識別子。
   */
  sourceIndex: number;
}

/** 種牡馬・繁殖牝馬 両方を個体指定した場合の 1対1 判定結果 */
export interface PairJudgeResult {
  inbreed: InbreedResult;
  score: number;
  effects: { name: string; bonuses: string[] }[];
  keitouGrade: KeitouGrade;
  sireMedalCount: number | null;
  mareMedalCount: number | null;
}

// ------------------------------------------------------------
// 系統(ライン)ベースの相性判定（既存 TaneData 由来）
// ------------------------------------------------------------

/**
 * 既存の TaneData.tsx が持つ1系統分のレコード想定。
 * フィールド名が実際のプロジェクトと異なる場合は合わせて調整してください。
 *   horseID    : 系統を識別するID（例: "A22", "B09"）
 *   horseKeitou: 系統名（例: "ヘイルトゥリーズン" ※末尾「系」なしの場合あり）
 *   aisyo      : 相手側の並び順に対応した相性グレード文字列（"1"=堅実 "2"=平均 "3"=一発 その他=データなし）
 *   memo1      : "堅実"→"鉄板" に格上げされる相手 horseID のカンマ区切りリスト
 *   memo3      : "一発"→"爆発" に格上げされる相手 horseID のカンマ区切りリスト
 */
export interface KeitouRecord {
  horseID: string;
  horseKeitou: string;
  aisyo: string;
  memo1: string;
  memo3: string;
  /** 1 = 種牡馬側, 2 = 繁殖牝馬側（実データに存在するフィールド。無くても動作する） */
  sex?: number;
}

export type KeitouGrade = "堅実" | "鉄板" | "平均" | "一発" | "爆発" | null;
