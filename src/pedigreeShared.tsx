// ============================================================
// pedigreeShared.tsx
// 配合チェック系ページ（InbreedCheckPage / TwoGenCheckPage）で共通して使う
// 表示部品とユーティリティ。
// ============================================================

import React from "react";
import { Badge } from "react-bootstrap";
import { HorseRecord, InbreedResult, KeitouGrade, PedigreeNode } from "./types";
import { KEITOU_GRADE_COLOR, KEITOU_GRADE_TEXT_COLOR } from "./keitouUtils";
import { describeNode } from "./savedPedigrees";
import { STOCK_CATALOG } from "./stockCatalog.sample";
import { RARITY_COLOR, RARITY_TEXT_COLOR, StockRecord, rarityRank } from "./stockTypes";

// ------------------------------------------------------------
// 並び替え用の優先順位（値が小さいほど「良い」＝先に表示される）
// ------------------------------------------------------------

/** 系統相性: 鉄板 → 堅実 → 平均 → 一発 → 爆発 → データなし の順 */
const KEITOU_SORT_ORDER: Record<string, number> = {
  "鉄板": 1, "堅実": 2, "平均": 3, "一発": 4, "爆発": 5,
};

export function keitouSortValue(grade: KeitouGrade): number {
  if (!grade) return 6;
  return KEITOU_SORT_ORDER[grade] ?? 6;
}

/**
 * インブリード表示条件の優先順位:
 * ペア本数が多い順（3本→2本→1本）→ アウトブリード（0本）
 * ※ 配合不可はこの関数の対象外（別枠で常に最下部に配置する）
 * ※ 3×3や2×4がある場合は優先度をわずかに下げる
 */
export function inbreedSortValue(r: { inbreed: { pairs: unknown[]; hasPreProductionWarning?: boolean } }): number {
  if (r.inbreed.pairs.length === 0) return 999;
  let value = -r.inbreed.pairs.length;
  if (r.inbreed.hasPreProductionWarning) {
    value += 10;
  }
  return value;
}

// ------------------------------------------------------------
// ラベル / 株券データ
// ------------------------------------------------------------

/** 表示用のラベル（カタログ馬は馬名、それ以外は describeNode に委譲） */
export function nodeLabel(node: PedigreeNode): string {
  return node.type === "catalog" ? node.horse.name : describeNode(node);
}

/** 馬名と種別から株券レコードを引く */
export function findStockRecordByName(
  name: string,
  horseType: "sire" | "mare"
): StockRecord | undefined {
  return STOCK_CATALOG.find((s) => s.name === name && s.horse_type === horseType);
}

/**
 * その馬の株券入手条件が、★・★★・★★★のすべてで「STARHORSE.NETにて獲得」または
 * 「？」（データ未確定）しかなく、実質的に入手手段が無い（＝表から除外したい）かどうか。
 * 株券データ自体が無い馬も対象に含める。
 */
export function hasNoObtainableStock(horse: HorseRecord): boolean {
  const record = findStockRecordByName(horse.name, horse.horse_type);
  if (!record) return true;
  const starCards = record.cards.filter((c) => c.rarity === "★" || c.rarity === "★★" || c.rarity === "★★★");
  if (starCards.length === 0) return true;
  return starCards.every((c) => {
    const text = c.conditions.find((cond) => cond.label === "出現条件")?.text ?? "？";
    return text === "？" || text.includes("STARHORSE.NET");
  });
}

// ------------------------------------------------------------
// 表示部品
// ------------------------------------------------------------

/**
 * インブリード判定の結果表示（系統相性・★3枚数のバッジ、配合不可/体質リスクの
 * 注意書き、検出されたインブリード、該当する効果）。
 */
export interface PairJudgeSummaryProps {
  keitouGrade: KeitouGrade;
  sireMedalCount: number | null;
  mareMedalCount: number | null;
  inbreed: InbreedResult;
  effects: { name: string; bonuses: string[] }[];
  /** 系統相性バッジの見出し（2代配合ページでは「2代目の系統相性」等に差し替える） */
  keitouLabel?: string;
}

export const PairJudgeSummary: React.FC<PairJudgeSummaryProps> = ({
  keitouGrade, sireMedalCount, mareMedalCount, inbreed, effects, keitouLabel = "系統相性",
}) => (
  <>
    <div className="d-flex flex-wrap gap-2 mb-3">
      {keitouGrade && (
        <Badge
          style={{ backgroundColor: KEITOU_GRADE_COLOR[keitouGrade], color: KEITOU_GRADE_TEXT_COLOR[keitouGrade] }}
        >
          {keitouLabel}: {keitouGrade}
        </Badge>
      )}
      {sireMedalCount !== null && <Badge bg="warning" text="dark">種牡馬★3: {sireMedalCount}</Badge>}
      {mareMedalCount !== null && <Badge bg="warning" text="dark">繁殖牝馬★3: {mareMedalCount}</Badge>}
    </div>

    {!inbreed.isValid ? (
      <div className="alert alert-danger fw-bold mb-3">配合不可: {inbreed.invalidReason}</div>
    ) : (
      <>
        {inbreed.hasPreProductionWarning && (
          <div className="alert alert-warning fw-bold mb-3">
            ※ 生産時コメント注意
          </div>
        )}
        {inbreed.hasWeaknessRisk && (
          <div className="alert alert-warning fw-bold mb-3">
            ※ 3×3 のインブリードが含まれるため、体質が弱くなる可能性があります
          </div>
        )}
      </>
    )}

    <div className="mb-3">
      <div className="fw-bold small text-muted mb-1">検出されたインブリード</div>
      {inbreed.pairs.length === 0 && <div className="text-muted">アウトブリード（重複なし）</div>}
      {inbreed.pairs.map((p, i) => (
        <div key={i}>
          <Badge bg="secondary" className="me-1">{p.notation}</Badge>
          {p.label}
        </div>
      ))}
    </div>

    {inbreed.isValid && effects.length > 0 && (
      <div>
        <div className="fw-bold small text-muted mb-1">該当する効果</div>
        {effects.map((e, i) => (
          <div key={i} className="small">{e.name}: {e.bonuses.join(" / ")}</div>
        ))}
      </div>
    )}
  </>
);

/** 株券入手条件の一覧表示（RARE は対象外。レアリティ順に並べる） */
export const StockConditionList: React.FC<{ record: StockRecord | undefined }> = ({ record }) => {
  if (!record) {
    return <div className="text-center text-muted py-4" style={{ fontSize: "2.5em" }}>？</div>;
  }
  return (
    <>
      {[...record.cards]
        .filter((c) => c.rarity !== "RARE")
        .sort((a, b) => rarityRank(a.rarity) - rarityRank(b.rarity))
        .map((c, i) => (
          <div key={i} className="mb-3 pb-3" style={{ borderBottom: "1px solid #eee" }}>
            <div className="d-flex align-items-center gap-2 mb-2">
              <Badge style={{ backgroundColor: RARITY_COLOR[c.rarity], color: RARITY_TEXT_COLOR[c.rarity] }}>
                {c.rarity}
              </Badge>
              <span className="fw-bold">{c.sh_text}</span>
              {c.celeb && <Badge bg="warning" text="dark">{c.celeb}</Badge>}
            </div>
            {c.conditions.map((cond, j) => (
              <div key={j} className="small mb-1">
                <Badge bg="secondary" className="me-1">{cond.label}</Badge>
                {cond.text}
              </div>
            ))}
          </div>
        ))}
    </>
  );
};
