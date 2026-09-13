// ============================================================
// TwoGenCheckPage.tsx
// 2代（子・孫）先まで見据えた配合シミュレーションページ。
//
// 既存の InbreedCheckPage（1代分＝子までの判定）との違い:
//  ・片側だけ個体を指定し、「子の相手」と「孫の相手」の両方を候補馬から探す
//  ・一覧に出すのは 孫にインブリードが発生する組み合わせだけ
//  ・系統相性は「1代目の配合（子）」と「2代目の配合（孫）」で分けて指定・表示する
//  ・子が牡馬だった場合／牝馬だった場合で、継承する系統（父系/母系）と
//    2代目の相手の性別（繁殖牝馬/種牡馬）が変わるため、それぞれ別の行として出す
//
// 保存した自家生産馬は既存ページと同じ localStorage を使うため共有される。
// ============================================================

import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container, Card, Form, Button, Row, Col, Spinner,
  ToggleButton, ToggleButtonGroup, Table as BootstrapTable, Badge, Modal, Accordion,
} from "react-bootstrap";
import {
  FlatAncestor, HorseRecord, InbreedResult, KeitouGrade, KeitouRecord, PedigreeNode, Sex,
} from "./types";
import PedigreeGridSelector, { PedigreeReadonlyGrid, SavedOption } from "./PedigreeGridSelector";
import {
  catalogNode, detectInbreedPairs, flattenPedigree, getThreeStarMedalCount, judgeInbreed,
  resolveInheritedLine, scoreInbreed,
} from "./pedigreeUtils";
import {
  ALL_KEITOU_GRADES, KEITOU_GRADE_COLOR, KEITOU_GRADE_TEXT_COLOR, getAllKeitouNames, getKeitouGrade,
} from "./keitouUtils";
import {
  MAX_SAVED_PEDIGREES, SavedPedigree, cloneNode as cloneNodeWith, describeNode,
  deserializeNode, loadSavedPedigrees, makeSavedId, persistSavedPedigrees,
  serializeNode, suggestSavedName,
} from "./savedPedigrees";
import { collectHomebredIssues } from "./homebredValidation";
import {
  PairJudgeSummary, StockConditionList, findStockRecordByName, hasNoObtainableStock,
  keitouSortValue, nodeLabel,
} from "./pedigreeShared";
import { HORSE_CATALOG } from "./horseCatalog.sample";
import { HorseIDData } from "./TaneData";

/** 個体を指定する側 */
type BaseSide = "sire" | "mare";
/** 子の性別の想定 */
type ChildSexMode = "male" | "female" | "both";
type SortKey = "partner1" | "grade1" | "childSex" | "partner2" | "grade2" | "inbreed";
type SortDirection = "asc" | "desc";

/** 一覧に出す1行（＝子の相手 × 孫の相手 の1組み合わせ） */
interface TwoGenRow {
  /** 子の相手（1代目の配合相手） */
  partner1: HorseRecord;
  /** 子の性別の想定 */
  childSex: Sex;
  /** 孫の相手（2代目の配合相手） */
  partner2: HorseRecord;
  /** 1代目（種牡馬×繁殖牝馬→子）の系統相性 */
  grade1: KeitouGrade;
  /** 2代目（子×孫の相手→孫）の系統相性 */
  grade2: KeitouGrade;
  /** 孫のインブリード判定 */
  inbreed: InbreedResult;
  /** 子の段階（基準馬×子の相手）で3×3等による体質弱化リスクがあるか */
  childHasWeaknessRisk: boolean;
  /** 子の段階（基準馬×子の相手）で2×4または3×3による生産前コメント注意があるか */
  childHasPreProductionWarning: boolean;
}

/** 表示する最大件数（並び替え後の上位のみ描画する） */
const DISPLAY_LIMIT = 300;

/** 馬名で重複を除去する（同名はカタログ上複数あるが血統は同じなので1頭だけ使う） */
function uniqueByName(horses: HorseRecord[]): HorseRecord[] {
  const seen = new Set<string>();
  return horses.filter((h) => {
    if (seen.has(h.name)) return false;
    seen.add(h.name);
    return true;
  });
}

function nameCompare(a: HorseRecord, b: HorseRecord): number {
  return a.name.localeCompare(b.name, "ja");
}

/** インブリードの本数（多いほど先に表示するので降順で比較する） */
function inbreedCountCompare(a: TwoGenRow, b: TwoGenRow): number {
  return b.inbreed.pairs.length - a.inbreed.pairs.length;
}

/** 既定の並び順: インブリード本数が多い順 → 1代目相性 → 2代目相性 → 子の相手名 → 孫の相手名 */
function compareRowsDefault(a: TwoGenRow, b: TwoGenRow): number {
  const n = inbreedCountCompare(a, b);
  if (n !== 0) return n;
  const g1 = keitouSortValue(a.grade1) - keitouSortValue(b.grade1);
  if (g1 !== 0) return g1;
  const g2 = keitouSortValue(a.grade2) - keitouSortValue(b.grade2);
  if (g2 !== 0) return g2;
  const p1 = nameCompare(a.partner1, b.partner1);
  if (p1 !== 0) return p1;
  return nameCompare(a.partner2, b.partner2);
}

const SORT_COMPARATORS: Record<SortKey, (a: TwoGenRow, b: TwoGenRow) => number> = {
  partner1: (a, b) => nameCompare(a.partner1, b.partner1),
  grade1: (a, b) => keitouSortValue(a.grade1) - keitouSortValue(b.grade1),
  childSex: (a, b) => (a.childSex === b.childSex ? 0 : a.childSex === "male" ? -1 : 1),
  partner2: (a, b) => nameCompare(a.partner2, b.partner2),
  grade2: (a, b) => keitouSortValue(a.grade2) - keitouSortValue(b.grade2),
  inbreed: inbreedCountCompare,
};

const CHILD_SEX_LABEL: Record<Sex, string> = { male: "牡", female: "牝" };

const TwoGenCheckPage: React.FC = () => {
  const navigate = useNavigate();
  const taneData = HorseIDData as KeitouRecord[];

  // ------------------------------------------------------------
  // 入力（基準にする側と、その血統）
  // ------------------------------------------------------------
  const [baseSide, setBaseSide] = useState<BaseSide>("sire");
  const [baseNode, setBaseNode] = useState<PedigreeNode>({ type: "unknown" });
  const [manualLine, setManualLine] = useState<string>("");

  const baseSex: Sex = baseSide === "sire" ? "male" : "female";
  const autoLine = useMemo(() => resolveInheritedLine(baseNode, baseSex), [baseNode, baseSex]);
  const effectiveBaseLine = autoLine ?? (manualLine || null);
  const lineOptions = useMemo(
    () => getAllKeitouNames(taneData, baseSide === "sire" ? 1 : 2),
    [taneData, baseSide]
  );

  // 基準馬に「生産できない自家生産馬」が含まれていないか
  const baseIssues = useMemo(() => collectHomebredIssues(baseNode), [baseNode]);
  const hasBlockingIssue = baseIssues.length > 0;

  // ------------------------------------------------------------
  // 検索条件
  // ------------------------------------------------------------
  const [childSexMode, setChildSexMode] = useState<ChildSexMode>("both");
  const [grades1, setGrades1] = useState<Record<string, boolean>>(
    Object.fromEntries(ALL_KEITOU_GRADES.map((g) => [g, true]))
  );
  const [grades2, setGrades2] = useState<Record<string, boolean>>(
    Object.fromEntries(ALL_KEITOU_GRADES.map((g) => [g, true]))
  );
  const [excludeUnobtainable, setExcludeUnobtainable] = useState(false);
  /** 3×3 を含み体質が弱くなる可能性がある組み合わせを表から除外するか（表示だけのフィルタ） */
  const [excludeWeakness, setExcludeWeakness] = useState(false);

  // ------------------------------------------------------------
  // 保存済み自家生産馬（既存ページと共有）
  // ------------------------------------------------------------
  const [saved, setSaved] = useState<SavedPedigree[]>(() => loadSavedPedigrees());
  useEffect(() => {
    persistSavedPedigrees(saved);
  }, [saved]);

  const savedOptions = useMemo<SavedOption[]>(
    () =>
      saved
        .map((s) => ({ id: s.id, name: s.name, sex: s.sex, node: deserializeNode(s.node, HORSE_CATALOG) }))
        .filter((s): s is SavedOption => s.node !== null),
    [saved]
  );

  const cloneNode = useMemo(() => (n: PedigreeNode) => cloneNodeWith(n, HORSE_CATALOG), []);

  const [saveTarget, setSaveTarget] = useState<PedigreeNode | null>(null);
  const [saveName, setSaveName] = useState("");
  const [saveSex, setSaveSex] = useState<Sex>("male");
  const [overwriteId, setOverwriteId] = useState<string>("");
  const [showManage, setShowManage] = useState(false);

  const openSaveModal = (node: PedigreeNode, sex: Sex) => {
    if (collectHomebredIssues(node).length > 0) return;
    const defaultName =
      node.type === "homebred" && node.name?.trim()
        ? node.name.trim()
        : node.type === "catalog"
        ? node.horse.name
        : suggestSavedName(saved);
    setSaveName(defaultName);
    setSaveSex(sex);
    setOverwriteId(saved.length >= MAX_SAVED_PEDIGREES ? saved[0]?.id ?? "" : "");
    setSaveTarget(node);
  };

  const handleSave = () => {
    if (!saveTarget) return;
    const name = saveName.trim() || suggestSavedName(saved);
    const entry: SavedPedigree = {
      id: overwriteId || makeSavedId(),
      name,
      sex: saveSex,
      updatedAt: Date.now(),
      node: serializeNode(saveTarget, HORSE_CATALOG),
    };
    setSaved((prev) => {
      const exists = prev.some((s) => s.id === entry.id);
      const next = exists ? prev.map((s) => (s.id === entry.id ? entry : s)) : [...prev, entry];
      return next.slice(0, MAX_SAVED_PEDIGREES);
    });
    setSaveTarget(null);
  };

  const renameSaved = (id: string, name: string) =>
    setSaved((prev) => prev.map((s) => (s.id === id ? { ...s, name } : s)));
  const deleteSaved = (id: string) => setSaved((prev) => prev.filter((s) => s.id !== id));

  // ------------------------------------------------------------
  // 判定（「判定！」を押した時点の内容だけで計算する）
  // ------------------------------------------------------------
  const [computing, setComputing] = useState(false);
  const [hasJudged, setHasJudged] = useState(false);
  const [rows, setRows] = useState<TwoGenRow[]>([]);
  const [judgedBaseNode, setJudgedBaseNode] = useState<PedigreeNode>({ type: "unknown" });
  const [judgedBaseSide, setJudgedBaseSide] = useState<BaseSide>("sire");
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection } | null>(null);

  /** 実際の総当たり計算。判定ボタンからのみ呼ぶ */
  const computeRows = (): TwoGenRow[] => {
    // 系統相性はメモ化する（TaneData の線形探索が組み合わせ数だけ走るのを防ぐ）
    const gradeMemo = new Map<string, KeitouGrade>();
    const grade = (sireLine: string | null, mareLine: string | null): KeitouGrade => {
      if (!sireLine || !mareLine) return null;
      const key = `${sireLine}|${mareLine}`;
      const hit = gradeMemo.get(key);
      if (hit !== undefined) return hit;
      const g = getKeitouGrade(sireLine, mareLine, taneData);
      gradeMemo.set(key, g);
      return g;
    };

    const allSires = uniqueByName(HORSE_CATALOG.filter((h) => h.horse_type === "sire"));
    const allMares = uniqueByName(HORSE_CATALOG.filter((h) => h.horse_type === "mare"));
    const pickable = (list: HorseRecord[]) =>
      excludeUnobtainable ? list.filter((h) => !hasNoObtainableStock(h)) : list;

    // 候補馬の血統は使い回すので、平坦化と祖先名リストは1頭につき1回だけ作る
    const flatCache = new Map<HorseRecord, FlatAncestor[]>();
    const nameCache = new Map<HorseRecord, string[]>();
    const flatOf = (h: HorseRecord): FlatAncestor[] => {
      let f = flatCache.get(h);
      if (!f) {
        f = flattenPedigree(catalogNode(h), 1);
        flatCache.set(h, f);
        nameCache.set(h, f.map((a) => a.name));
      }
      return f;
    };
    const namesOf = (h: HorseRecord): string[] => {
      if (!nameCache.has(h)) flatOf(h);
      return nameCache.get(h)!;
    };

    const sexes: Sex[] = childSexMode === "both" ? ["male", "female"] : [childSexMode];
    // 子が牡なら孫の相手は繁殖牝馬、牝なら種牡馬
    const partner2BySex: Record<Sex, HorseRecord[]> = {
      male: pickable(allMares),
      female: pickable(allSires),
    };

    const candidates1 = pickable(baseSide === "sire" ? allMares : allSires);
    const baseFlat = flattenPedigree(baseNode, 1);
    const out: TwoGenRow[] = [];

    for (const p1 of candidates1) {
      // --- 1代目: 基準馬 × p1 → 子 ---
      const grade1 =
        baseSide === "sire" ? grade(effectiveBaseLine, p1.line) : grade(p1.line, effectiveBaseLine);
      if (grade1 !== null && !grades1[grade1]) continue;

      // 生産できない子（配合不可）はその先も存在しえないので除外する
      const childPairs = detectInbreedPairs(baseFlat, flatOf(p1));
      const childInbreedResult = judgeInbreed(childPairs);
      if (!childInbreedResult.isValid) continue;
      const childHasWeaknessRisk = childInbreedResult.hasWeaknessRisk;
      const childHasPreProductionWarning = childInbreedResult.hasPreProductionWarning;

      const child: PedigreeNode =
        baseSide === "sire"
          ? { type: "homebred", name: "", sire: baseNode, dam: catalogNode(p1) }
          : { type: "homebred", name: "", sire: catalogNode(p1), dam: baseNode };
      const childFlat = flattenPedigree(child, 1);
      const childNames = new Set(childFlat.map((a) => a.name));

      for (const childSex of sexes) {
        // 子の系統は父系（牡）/母系（牝）を継承する。基準馬側が辿れない場合は手動指定を使う
        const childLine = resolveInheritedLine(child, childSex) ?? (manualLine || null);

        for (const p2 of partner2BySex[childSex]) {
          // --- 2代目: 子 × p2 → 孫 ---
          const grade2 =
            childSex === "male" ? grade(childLine, p2.line) : grade(p2.line, childLine);
          if (grade2 !== null && !grades2[grade2]) continue;

          // 共通の祖先が1頭も無ければインブリードは発生しない（重い判定の前に弾く）
          const p2Names = namesOf(p2);
          let shares = false;
          for (let k = 0; k < p2Names.length; k++) {
            if (childNames.has(p2Names[k])) {
              shares = true;
              break;
            }
          }
          if (!shares) continue;

          const pairs =
            childSex === "male"
              ? detectInbreedPairs(childFlat, flatOf(p2))
              : detectInbreedPairs(flatOf(p2), childFlat);
          if (pairs.length === 0) continue;
          const inbreed = judgeInbreed(pairs);
          if (!inbreed.isValid) continue; // 生産できない孫は出さない

          out.push({ partner1: p1, childSex, partner2: p2, grade1, grade2, inbreed, childHasWeaknessRisk, childHasPreProductionWarning });
        }
      }
    }

    out.sort(compareRowsDefault);
    return out;
  };

  const handleJudge = () => {
    if (hasBlockingIssue || computing) return;
    setComputing(true);
    setSortConfig(null);
    // スピナーを先に描画させてから重い計算に入る
    setTimeout(() => {
      const result = computeRows();
      setRows(result);
      setJudgedBaseNode(baseNode);
      setJudgedBaseSide(baseSide);
      setHasJudged(true);
      setComputing(false);
    }, 0);
  };

  // ------------------------------------------------------------
  // 表示用（フィルタ → 並び替え → 上位のみ描画。効果は表示する行だけ算出する）
  // ※ 判定結果そのものには影響せず、トグルの操作にライブで反応する
  // ------------------------------------------------------------
  const filteredRows = useMemo(
    () =>
      excludeWeakness
        ? rows.filter((r) => !r.inbreed.hasWeaknessRisk && !r.childHasWeaknessRisk && !r.inbreed.hasPreProductionWarning && !r.childHasPreProductionWarning)
        : rows,
    [rows, excludeWeakness]
  );

  const sortedRows = useMemo(() => {
    if (!sortConfig) return filteredRows;
    const dir = sortConfig.direction === "asc" ? 1 : -1;
    const cmp = SORT_COMPARATORS[sortConfig.key];
    return [...filteredRows].sort((a, b) => cmp(a, b) * dir);
  }, [filteredRows, sortConfig]);

  const visibleRows = useMemo(
    () =>
      sortedRows.slice(0, DISPLAY_LIMIT).map((row) => ({
        row,
        effects: scoreInbreed(row.inbreed.pairs).effects,
      })),
    [sortedRows]
  );

  const handleSort = (key: SortKey) => {
    setSortConfig((prev) =>
      prev && prev.key === key
        ? { key, direction: prev.direction === "asc" ? "desc" : "asc" }
        : { key, direction: "asc" }
    );
  };
  const sortArrow = (key: SortKey) =>
    !sortConfig || sortConfig.key !== key ? "" : sortConfig.direction === "asc" ? " ▲" : " ▼";

  // ------------------------------------------------------------
  // 行クリックで開く詳細モーダル
  // ------------------------------------------------------------
  const [detailRow, setDetailRow] = useState<TwoGenRow | null>(null);

  /** 判定時点の基準馬から、その行の子・孫のツリーを組み立て直す */
  const detail = useMemo(() => {
    if (!detailRow) return null;
    const child: PedigreeNode =
      judgedBaseSide === "sire"
        ? { type: "homebred", name: "", sire: judgedBaseNode, dam: catalogNode(detailRow.partner1) }
        : { type: "homebred", name: "", sire: catalogNode(detailRow.partner1), dam: judgedBaseNode };

    const partner2Node = catalogNode(detailRow.partner2);
    const gcSireNode = detailRow.childSex === "male" ? child : partner2Node;
    const gcDamNode = detailRow.childSex === "male" ? partner2Node : child;

    // 子（1代目）の判定内容も見られるようにしておく
    const childPairs = detectInbreedPairs(
      flattenPedigree(child.type === "homebred" ? child.sire : null, 1),
      flattenPedigree(child.type === "homebred" ? child.dam : null, 1)
    );
    const childInbreed = judgeInbreed(childPairs);

    const grandchild: PedigreeNode = { type: "homebred", name: "", sire: gcSireNode, dam: gcDamNode };

    return {
      child,
      grandchild,
      gcSireNode,
      gcDamNode,
      childInbreed,
      childEffects: scoreInbreed(childPairs).effects,
      effects: scoreInbreed(detailRow.inbreed.pairs).effects,
      highlightKeys: new Set(detailRow.inbreed.pairs.map((p) => p.name)),
      childHighlightKeys: new Set(childPairs.map((p) => p.name)),
      partner1Stock: findStockRecordByName(detailRow.partner1.name, detailRow.partner1.horse_type),
      partner2Stock: findStockRecordByName(detailRow.partner2.name, detailRow.partner2.horse_type),
    };
  }, [detailRow, judgedBaseNode, judgedBaseSide]);

  const backpage = () => navigate("/");

  const thStyle: React.CSSProperties = {
    backgroundColor: "#00695c", color: "#fff", padding: "6px 4px",
    border: "none", cursor: "pointer", whiteSpace: "nowrap", fontSize: "11px",
  };

  const gradeBadge = (grade: KeitouGrade) => (
    <span
      className="fw-bold"
      style={{
        display: "inline-block",
        minWidth: "34px",
        padding: "1px 4px",
        borderRadius: "4px",
        textAlign: "center",
        backgroundColor: grade ? KEITOU_GRADE_COLOR[grade] : "#ffffff",
        color: grade ? KEITOU_GRADE_TEXT_COLOR[grade] : "#999",
      }}
    >
      {grade ?? "―"}
    </span>
  );

  const gradeToggles = (
    checked: Record<string, boolean>,
    setChecked: (next: Record<string, boolean>) => void,
    idPrefix: string
  ) => (
    <div className="d-flex flex-wrap gap-2 mb-2">
      {ALL_KEITOU_GRADES.map((grade) => (
        <ToggleButton
          key={grade}
          id={`${idPrefix}-${grade}`}
          type="checkbox"
          value={grade}
          checked={checked[grade]}
          onChange={(e) => setChecked({ ...checked, [grade]: e.currentTarget.checked })}
          className="fw-bold shadow-sm"
          style={{
            backgroundColor: checked[grade] ? KEITOU_GRADE_COLOR[grade] : "#e9ecef",
            color: checked[grade] ? KEITOU_GRADE_TEXT_COLOR[grade] : "#6c757d",
            border: "1px solid #ced4da",
          }}
        >
          {grade}
        </ToggleButton>
      ))}
    </div>
  );

  return (
    <div style={{ backgroundColor: "#f0f2f5", minHeight: "100vh", paddingBottom: "50px" }}>
      <Container className="pt-4" style={{ maxWidth: "980px" }}>
        <Card className="shadow border-0 mb-4" style={{ borderRadius: "16px", overflow: "hidden" }}>
          <div style={{ height: "8px", backgroundColor: "#00695c" }} />
          <Card.Body className="p-4">
            <h4 className="text-center mb-1" style={{ color: "#004d40", fontWeight: 900 }}>
              2GEN BREEDING <span style={{ color: "#00695c", fontSize: "0.8em" }}>| 2代配合シミュレーション</span>
            </h4>
            <p className="text-center text-muted small mb-4">
              基準馬 × 子の相手 → 子、さらに 子 × 孫の相手 → 孫。孫にインブリードが発生する組み合わせだけを出します。
            </p>

            {/* --- 基準にする側 --- */}
            <Form.Label className="fw-bold" style={{ color: "#004d40" }}>基準にする馬（個体を指定する側）</Form.Label>
            <ToggleButtonGroup type="radio" name="base-side" value={baseSide} className="w-100 shadow-sm mb-3">
              <ToggleButton
                id="base-side-sire"
                value="sire"
                variant={baseSide === "sire" ? "dark" : "outline-dark"}
                onClick={() => setBaseSide("sire")}
                className="fw-bold small"
              >
                種牡馬を指定（子の相手＝繁殖牝馬を検索）
              </ToggleButton>
              <ToggleButton
                id="base-side-mare"
                value="mare"
                variant={baseSide === "mare" ? "dark" : "outline-dark"}
                onClick={() => setBaseSide("mare")}
                className="fw-bold small"
              >
                繁殖牝馬を指定（子の相手＝種牡馬を検索）
              </ToggleButton>
            </ToggleButtonGroup>

            <div className="p-3 shadow-sm mb-3" style={{ backgroundColor: "#fff", borderRadius: "12px" }}>
              <PedigreeGridSelector
                columnLabel={baseSide === "sire" ? "種牡馬" : "繁殖牝馬"}
                requiredSex={baseSex}
                catalog={HORSE_CATALOG}
                value={baseNode}
                onChange={setBaseNode}
                savedOptions={savedOptions}
                cloneNode={cloneNode}
              />

              <div className="d-flex gap-2 mt-2">
                <Button
                  size="sm"
                  variant="outline-danger"
                  className="flex-fill fw-bold"
                  onClick={() => openSaveModal(baseNode, baseSex)}
                  disabled={baseNode.type !== "homebred" || hasBlockingIssue}
                  title={
                    hasBlockingIssue
                      ? "配合不可の自家生産馬が含まれているため保存できません"
                      : baseNode.type !== "homebred"
                      ? "自家生産馬（本馬を自家生産馬にした血統）のみ保存できます"
                      : undefined
                  }
                >
                  この血統を保存
                </Button>
                <Button size="sm" variant="outline-secondary" className="fw-bold" onClick={() => setShowManage(true)}>
                  保存馬の管理（{saved.length}/{MAX_SAVED_PEDIGREES}）
                </Button>
              </div>

              <Form.Label className="small fw-bold text-muted mt-3 d-block">
                系統{autoLine === null && "（自動判定できないため手動指定が必要です）"}
              </Form.Label>
              {autoLine !== null ? (
                <Form.Select disabled value={autoLine} className="shadow-sm" style={{ backgroundColor: "#e9ecef", color: "#495057" }}>
                  <option>{autoLine}</option>
                </Form.Select>
              ) : (
                <Form.Select value={manualLine} onChange={(e) => setManualLine(e.target.value)} className="shadow-sm">
                  <option value="">系統を選択してください</option>
                  {lineOptions.map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </Form.Select>
              )}
            </div>

            {/* --- 子の性別 --- */}
            <Form.Label className="small fw-bold text-muted d-block">
              子の性別（継承する系統と、孫の相手の性別が変わります）
            </Form.Label>
            <ToggleButtonGroup type="radio" name="child-sex" value={childSexMode} className="w-100 shadow-sm mb-3">
              <ToggleButton
                id="child-sex-male" value="male"
                variant={childSexMode === "male" ? "dark" : "outline-dark"}
                onClick={() => setChildSexMode("male")}
                className="fw-bold small"
              >
                牡馬（父系を継承）
              </ToggleButton>
              <ToggleButton
                id="child-sex-female" value="female"
                variant={childSexMode === "female" ? "dark" : "outline-dark"}
                onClick={() => setChildSexMode("female")}
                className="fw-bold small"
              >
                牝馬（母系を継承）
              </ToggleButton>
              <ToggleButton
                id="child-sex-both" value="both"
                variant={childSexMode === "both" ? "dark" : "outline-dark"}
                onClick={() => setChildSexMode("both")}
                className="fw-bold small"
              >
                両方
              </ToggleButton>
            </ToggleButtonGroup>

            {/* --- 系統相性の絞り込み --- */}
            <Form.Label className="small fw-bold text-muted d-block">
              1代目の系統相性（基準馬 × 子の相手）
            </Form.Label>
            {gradeToggles(grades1, setGrades1, "grade1")}

            <Form.Label className="small fw-bold text-muted d-block mt-2">
              2代目の系統相性（子 × 孫の相手）
            </Form.Label>
            {gradeToggles(grades2, setGrades2, "grade2")}

            <Form.Check
              type="switch"
              id="twogen-exclude-unobtainable"
              className="my-3"
              label="株券入手条件が★〜★★★すべて「STARHORSE.NETにて獲得」または「？」の候補を除外する"
              checked={excludeUnobtainable}
              onChange={(e) => setExcludeUnobtainable(e.currentTarget.checked)}
            />

            <Form.Check
              type="switch"
              id="twogen-exclude-weakness"
              className="my-3"
              label="体質が弱くなる可能性がある組み合わせ（子・孫いずれかの3×3を含む）を表から除外する"
              checked={excludeWeakness}
              onChange={(e) => setExcludeWeakness(e.currentTarget.checked)}
            />

            {hasBlockingIssue && (
              <div className="alert alert-danger py-2 px-3 mb-3" style={{ fontSize: "12.5px" }}>
                <div className="fw-bold mb-1">⚠ 生産できない自家生産馬が含まれているため判定できません</div>
                {baseIssues.map((issue, i) => (
                  <div key={i}>・{issue.positionLabel}（{issue.horseLabel}）: {issue.reason}</div>
                ))}
              </div>
            )}

            <Button
              className="w-100 border-0 shadow"
              style={{
                background: hasBlockingIssue
                  ? "linear-gradient(45deg, #b0a9a7 0%, #918a88 100%)"
                  : "linear-gradient(45deg, #00897b 0%, #004d40 100%)",
                borderRadius: "10px", padding: "12px", fontWeight: "bold",
              }}
              onClick={handleJudge}
              disabled={hasBlockingIssue || computing}
            >
              {computing ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  計算中…（組み合わせが多いと数秒かかります）
                </>
              ) : (
                "判定！"
              )}
            </Button>
          </Card.Body>
        </Card>

        {/* --- 結果一覧 --- */}
        {hasJudged && !computing && (
          <>
            <div className="d-flex justify-content-between align-items-center mb-2 px-1">
              <span className="fw-bold" style={{ color: "#004d40" }}>
                孫にインブリードが出る組み合わせ: {filteredRows.length.toLocaleString()} 件
                {excludeWeakness && rows.length !== filteredRows.length && (
                  <span className="text-muted fw-normal small ms-2">
                    （体質弱化 {(rows.length - filteredRows.length).toLocaleString()} 件を除外中）
                  </span>
                )}
              </span>
              {filteredRows.length > DISPLAY_LIMIT && (
                <span className="small text-muted">上位 {DISPLAY_LIMIT} 件を表示</span>
              )}
            </div>

            <div className="shadow-sm mb-4" style={{ borderRadius: "12px", overflow: "hidden", overflowX: "auto" }}>
              <BootstrapTable className="mb-0" style={{ fontSize: "11px" }}>
                <thead>
                  <tr className="text-center">
                    <th style={{ ...thStyle, whiteSpace: "nowrap" }} onClick={() => handleSort("partner1")}>
                      子の相手{sortArrow("partner1")}
                    </th>
                    <th style={{ ...thStyle, width: "44px" }} onClick={() => handleSort("grade1")}>
                      1代目<br />相性{sortArrow("grade1")}
                    </th>
                    <th style={{ ...thStyle, width: "34px" }} onClick={() => handleSort("childSex")}>
                      子{sortArrow("childSex")}
                    </th>
                    <th style={{ ...thStyle, whiteSpace: "nowrap" }} onClick={() => handleSort("partner2")}>
                      孫の相手{sortArrow("partner2")}
                    </th>
                    <th style={{ ...thStyle, width: "44px" }} onClick={() => handleSort("grade2")}>
                      2代目<br />相性{sortArrow("grade2")}
                    </th>
                    <th style={thStyle} onClick={() => handleSort("inbreed")}>
                      孫のインブリード / 効果{sortArrow("inbreed")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {visibleRows.map(({ row, effects }, i) => (
                    <tr
                      key={`${row.partner1.name}-${row.childSex}-${row.partner2.name}-${i}`}
                      className="align-middle"
                      style={{ cursor: "pointer" }}
                      onClick={() => setDetailRow(row)}
                    >
                      <td style={{ backgroundColor: "#3b3b3b", color: "#fff", fontWeight: 600, whiteSpace: "nowrap", padding: "4px 6px", textDecoration: "underline" }}>
                        {row.partner1.name}
                      </td>
                      <td className="text-center" style={{ padding: "4px 2px" }}>{gradeBadge(row.grade1)}</td>
                      <td className="text-center fw-bold" style={{ padding: "4px 2px", backgroundColor: row.childSex === "male" ? "#e3f2fd" : "#fce4ec" }}>
                        {CHILD_SEX_LABEL[row.childSex]}
                      </td>
                      <td style={{ backgroundColor: "#3b3b3b", color: "#fff", fontWeight: 600, whiteSpace: "nowrap", padding: "4px 6px", textDecoration: "underline" }}>
                        {row.partner2.name}
                      </td>
                      <td className="text-center" style={{ padding: "4px 2px" }}>{gradeBadge(row.grade2)}</td>
                      <td style={{ backgroundColor: "#ffffff", padding: "4px 6px" }}>
                        {row.inbreed.pairs.map((p, j) => (
                          <span key={j} className="me-1">
                            <Badge bg="secondary">{p.notation}</Badge> {p.label}
                          </span>
                        ))}
                        {row.inbreed.hasPreProductionWarning && (
                          <div className="text-warning fw-bold">※孫で生産時コメント注意</div>
                        )}
                        {row.childHasPreProductionWarning && (
                          <div className="text-warning fw-bold">※子で生産時コメント注意</div>
                        )}
                        {effects.map((e, j) => (
                          <div key={j}>{e.name}: {e.bonuses.join(" / ")}</div>
                        ))}
                      </td>
                    </tr>
                  ))}
                  {visibleRows.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center text-muted py-3" style={{ backgroundColor: "#fff" }}>
                        条件に一致する組み合わせがありません（系統相性の指定や基準馬の血統をご確認ください）
                      </td>
                    </tr>
                  )}
                </tbody>
              </BootstrapTable>
            </div>
          </>
        )}

        <Button variant="success" className="w-100 fw-bold py-2 shadow-sm" style={{ borderRadius: "10px" }} onClick={backpage}>
          戻る
        </Button>

        {/* --- 詳細モーダル --- */}
        <Modal show={detailRow !== null} onHide={() => setDetailRow(null)} centered size="xl" scrollable>
          <Modal.Header closeButton style={{ backgroundColor: "#00695c", color: "#fff" }}>
            <Modal.Title style={{ fontSize: "1.05em" }}>
              {detailRow && detail &&
                `${nodeLabel(detail.child)} の子（${CHILD_SEX_LABEL[detailRow.childSex]}） × ${detailRow.partner2.name}`}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {detailRow && detail && (
              <>
                <style>{`
                  .twogen-accordion .accordion-item {
                    border: 1px solid #cfe0dc;
                    border-radius: 10px;
                    overflow: hidden;
                  }
                  .twogen-accordion .accordion-button {
                    font-size: 0.82rem;
                    font-weight: 700;
                    padding: 0.55rem 1rem;
                  }
                  .twogen-accordion .accordion-button:not(.collapsed) {
                    color: #004d40;
                    background-color: #e0f2f1;
                    box-shadow: none;
                  }
                  .twogen-accordion .accordion-button:focus { box-shadow: none; }
                `}</style>

                <Accordion
                  key={`${detailRow.partner1.name}:${detailRow.childSex}:${detailRow.partner2.name}`}
                  className="twogen-accordion mb-3"
                >
                  <Accordion.Item eventKey="gc">
                    <Accordion.Header>
                      孫の血統表・インブリード判定（2代目）
                    </Accordion.Header>
                    <Accordion.Body>
                      <Row className="mb-3">
                        <Col xs={12} md={6} className="mb-3 mb-md-0">
                          <div className="fw-bold small text-muted mb-1">
                            種牡馬側{detailRow.childSex === "male" && "（＝子）"}
                          </div>
                          <PedigreeReadonlyGrid
                            node={detail.gcSireNode}
                            requiredSex="male"
                            highlightKeys={detail.highlightKeys}
                            highlightBorderColor="#d32f2f"
                            highlightBgColor="#f8d7da"
                          />
                        </Col>
                        <Col xs={12} md={6}>
                          <div className="fw-bold small text-muted mb-1">
                            繁殖牝馬側{detailRow.childSex === "female" && "（＝子）"}
                          </div>
                          <PedigreeReadonlyGrid
                            node={detail.gcDamNode}
                            requiredSex="female"
                            highlightKeys={detail.highlightKeys}
                            highlightBorderColor="#d32f2f"
                            highlightBgColor="#f8d7da"
                          />
                        </Col>
                      </Row>

                      <PairJudgeSummary
                        keitouLabel="2代目の系統相性"
                        keitouGrade={detailRow.grade2}
                        sireMedalCount={
                          detailRow.childSex === "male" ? null : getThreeStarMedalCount(detailRow.partner2)
                        }
                        mareMedalCount={
                          detailRow.childSex === "male" ? getThreeStarMedalCount(detailRow.partner2) : null
                        }
                        inbreed={detailRow.inbreed}
                        effects={detail.effects}
                      />
                    </Accordion.Body>
                  </Accordion.Item>

                  <Accordion.Item eventKey="child">
                    <Accordion.Header>子の血統表・インブリード判定（1代目）</Accordion.Header>
                    <Accordion.Body>
                      <Row className="mb-3">
                        <Col xs={12} md={6} className="mb-3 mb-md-0">
                          <div className="fw-bold small text-muted mb-1">種牡馬側</div>
                          <PedigreeReadonlyGrid
                            node={detail.child.type === "homebred" ? detail.child.sire ?? { type: "unknown" } : { type: "unknown" }}
                            requiredSex="male"
                            highlightKeys={detail.childHighlightKeys}
                            highlightBorderColor="#d32f2f"
                            highlightBgColor="#f8d7da"
                          />
                        </Col>
                        <Col xs={12} md={6}>
                          <div className="fw-bold small text-muted mb-1">繁殖牝馬側</div>
                          <PedigreeReadonlyGrid
                            node={detail.child.type === "homebred" ? detail.child.dam ?? { type: "unknown" } : { type: "unknown" }}
                            requiredSex="female"
                            highlightKeys={detail.childHighlightKeys}
                            highlightBorderColor="#d32f2f"
                            highlightBgColor="#f8d7da"
                          />
                        </Col>
                      </Row>

                      <PairJudgeSummary
                        keitouLabel="1代目の系統相性"
                        keitouGrade={detailRow.grade1}
                        sireMedalCount={
                          judgedBaseSide === "sire" ? null : getThreeStarMedalCount(detailRow.partner1)
                        }
                        mareMedalCount={
                          judgedBaseSide === "sire" ? getThreeStarMedalCount(detailRow.partner1) : null
                        }
                        inbreed={detail.childInbreed}
                        effects={detail.childEffects}
                      />
                    </Accordion.Body>
                  </Accordion.Item>
                </Accordion>

                <div className="d-flex justify-content-end gap-2 mb-4">
                  <Button
                    size="sm"
                    variant="outline-secondary"
                    onClick={() => openSaveModal(detail.child, detailRow.childSex)}
                  >
                    子の血統を保存
                  </Button>
                  <Button
                    size="sm"
                    variant="outline-danger"
                    onClick={() => openSaveModal(detail.grandchild, "male")}
                  >
                    孫の血統を保存
                  </Button>
                </div>

                <div className="fw-bold small text-muted mb-2">
                  株券入手条件（子の相手: {detailRow.partner1.name}）
                </div>
                <StockConditionList record={detail.partner1Stock} />

                <div className="fw-bold small text-muted mb-2 mt-3">
                  株券入手条件（孫の相手: {detailRow.partner2.name}）
                </div>
                <StockConditionList record={detail.partner2Stock} />
              </>
            )}
          </Modal.Body>
        </Modal>

        {/* --- 血統の保存モーダル --- */}
        <Modal show={saveTarget !== null} onHide={() => setSaveTarget(null)} centered>
          <Modal.Header closeButton style={{ backgroundColor: "#00695c", color: "#fff" }}>
            <Modal.Title style={{ fontSize: "1.05em" }}>この血統を保存</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="text-muted small mb-2">{saveTarget && describeNode(saveTarget)}</div>
            <Form.Label className="small fw-bold text-muted">呼び出すときの名前</Form.Label>
            <Form.Control
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              placeholder="例: 自家生産馬A"
              className="mb-3 shadow-sm"
            />

            <Form.Label className="small fw-bold text-muted d-block">保存する側</Form.Label>
            <ToggleButtonGroup type="radio" name="twogen-save-sex" value={saveSex} className="w-100 shadow-sm mb-3">
              <ToggleButton
                id="twogen-save-sex-male" value="male"
                variant={saveSex === "male" ? "dark" : "outline-dark"}
                onClick={() => setSaveSex("male")}
                className="fw-bold small"
              >
                種牡馬側
              </ToggleButton>
              <ToggleButton
                id="twogen-save-sex-female" value="female"
                variant={saveSex === "female" ? "dark" : "outline-dark"}
                onClick={() => setSaveSex("female")}
                className="fw-bold small"
              >
                繁殖牝馬側
              </ToggleButton>
            </ToggleButtonGroup>

            {saved.length >= MAX_SAVED_PEDIGREES && (
              <>
                <div className="alert alert-warning small py-2">
                  保存できるのは{MAX_SAVED_PEDIGREES}頭までです。上書きする馬を選んでください。
                </div>
                <Form.Select value={overwriteId} onChange={(e) => setOverwriteId(e.target.value)}>
                  {saved.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} を上書き</option>
                  ))}
                </Form.Select>
              </>
            )}

            {saved.length < MAX_SAVED_PEDIGREES && saved.length > 0 && (
              <>
                <Form.Label className="small fw-bold text-muted">保存先</Form.Label>
                <Form.Select value={overwriteId} onChange={(e) => setOverwriteId(e.target.value)}>
                  <option value="">新規に追加（{saved.length + 1}/{MAX_SAVED_PEDIGREES}）</option>
                  {saved.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} を上書き</option>
                  ))}
                </Form.Select>
              </>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setSaveTarget(null)}>キャンセル</Button>
            <Button variant="danger" className="fw-bold" onClick={handleSave}>保存する</Button>
          </Modal.Footer>
        </Modal>

        {/* --- 保存馬の管理モーダル --- */}
        <Modal show={showManage} onHide={() => setShowManage(false)} centered>
          <Modal.Header closeButton style={{ backgroundColor: "#00695c", color: "#fff" }}>
            <Modal.Title style={{ fontSize: "1.05em" }}>
              保存した自家生産馬（{saved.length}/{MAX_SAVED_PEDIGREES}）
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {saved.length === 0 && (
              <div className="text-center text-muted py-4 small">
                まだ保存されていません。<br />
                判定結果の行を開いて「子の血統を保存」「孫の血統を保存」から登録できます。
              </div>
            )}
            {saved.map((s) => (
              <div key={s.id} className="mb-3 pb-3" style={{ borderBottom: "1px solid #eee" }}>
                <div className="d-flex gap-2 align-items-center mb-1">
                  <Form.Control size="sm" value={s.name} onChange={(e) => renameSaved(s.id, e.target.value)} />
                  <Badge bg="secondary" className="flex-shrink-0">
                    {s.sex === "male" ? "種牡馬側" : "繁殖牝馬側"}
                  </Badge>
                  <Button size="sm" variant="outline-danger" className="flex-shrink-0" onClick={() => deleteSaved(s.id)}>
                    削除
                  </Button>
                </div>
                <div className="text-muted small text-truncate">
                  {describeNode(deserializeNode(s.node, HORSE_CATALOG))}
                </div>
              </div>
            ))}
            <div className="text-muted" style={{ fontSize: "10px" }}>
              ※ この端末のブラウザに保存されます（配合チェックページと共有）。
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowManage(false)}>閉じる</Button>
          </Modal.Footer>
        </Modal>
      </Container>
    </div>
  );
};

export default TwoGenCheckPage;
