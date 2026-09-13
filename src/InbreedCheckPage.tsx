// ============================================================
// InbreedCheckPage.tsx
// 実血統(named ancestor)ベースのインブリード判定ページ。
// 既存の系統(平/堅実/一発...)ベースの相性判定ページ(Table.tsx)とは
// 別ページとして用意する想定です。
//
// 画面構成:
//  ・種牡馬列 / 繁殖牝馬列 を常に両方表示（切り替えトグルなし）
//  ・各列は「個体を指定」または「候補馬全頭でランキング」のどちらかを選べる
//    （ランキング対象にできるのはどちらか片方のみ）
//  ・血統の指定は 4代グリッド（血統表）＋ 検索付き選択モーダル方式
//    （PedigreeGridSelector）。選択馬が多くても一覧性が落ちない。
//  ・組んだ自家生産馬は最大10頭までブラウザに保存でき（localStorage、
//    使えない環境ではCookie）、ブラウザを閉じた後でも血統表のどのマスからでも
//    「自家生産馬A」のような名前で呼び出せる。
//  ・両方「個体を指定」にした場合は 1対1 の詳細判定結果を表示し、
//    血統表上では相手側と重複する祖先（＝インブリードになる馬）をハイライトする
//  ・片方を「候補馬全頭でランキング」にした場合は、スコア代わりに★3メダル枚数と
//    系統相性・インブリードの複合条件で並んだランキング表を表示
//  ・自家生産馬は名前を入力しなくても、父・母が構造的に一致していれば
//    同一個体として重複（インブリード・NG判定）を検出する
//  ・「判定」ボタンを押した時点の内容でのみ再計算する（入力途中の値では
//    再計算しない、明示的な判定ボタン方式）
// ============================================================

import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container, Card, Form, Button, Row, Col,
  ToggleButton, ToggleButtonGroup, Table as BootstrapTable, Badge, Modal, Accordion,
} from "react-bootstrap";
import {
  HorseRecord, PedigreeNode, KeitouGrade, KeitouRecord, Sex, CandidateResult, PairJudgeResult, InbreedResult,
} from "./types";
import PedigreeGridSelector, { PedigreeReadonlyGrid, SavedOption } from "./PedigreeGridSelector";
import {
  rankCandidates, judgePair, resolveInheritedLine, flattenPedigree, getThreeStarMedalCount,
} from "./pedigreeUtils";
import {
  ALL_KEITOU_GRADES, KEITOU_GRADE_COLOR, KEITOU_GRADE_TEXT_COLOR, getAllKeitouNames,
} from "./keitouUtils";
import {
  MAX_SAVED_PEDIGREES, SavedPedigree, cloneNode as cloneNodeWith, describeNode,
  deserializeNode, loadSavedPedigrees, makeSavedId, persistSavedPedigrees,
  serializeNode, suggestSavedName,
} from "./savedPedigrees";
import { HomebredIssue, collectHomebredIssues } from "./homebredValidation";
import {
  PairJudgeSummary, StockConditionList, findStockRecordByName, hasNoObtainableStock,
  inbreedSortValue, keitouSortValue, nodeLabel,
} from "./pedigreeShared";
// 実プロジェクトでは下記を、実際のデータに差し替えてください。
// 例: import { HORSE_CATALOG } from "../data/horseCatalog";
import { HORSE_CATALOG } from "./horseCatalog.sample";
// 既存プロジェクトの実データ。既に TaneData.tsx がある場合はそちらを import してください。
import { HorseIDData } from "./TaneData";

type ColumnMode = "single" | "rankAll";
type SortKey = "name" | "keitou" | "inbreed" | "medal";
type SortDirection = "asc" | "desc";

// ------------------------------------------------------------
// 並び替え用の優先順位（値が小さいほど「良い」＝先に表示される）
// ※ 系統相性・インブリードの優先順位は pedigreeShared.tsx に共通化してある
// ------------------------------------------------------------

/** ★3メダル枚数: 多い方を先に表示する。データなしは最後に回す */
function medalSortValue(medalCount: number | null): number {
  return medalCount === null ? Infinity : -medalCount;
}

function nameCompare(a: HorseRecord, b: HorseRecord): number {
  return a.name.localeCompare(b.name, "ja");
}

/** デフォルト（列見出し未クリック時）の複合比較: 系統相性 → インブリード条件 → ★3枚数 → 名前 */
function compareCandidatesDefault(a: CandidateResult, b: CandidateResult): number {
  const k = keitouSortValue(a.keitouGrade) - keitouSortValue(b.keitouGrade);
  if (k !== 0) return k;
  const i = inbreedSortValue(a) - inbreedSortValue(b);
  if (i !== 0) return i;
  const m = medalSortValue(a.medalCount) - medalSortValue(b.medalCount);
  if (m !== 0) return m;
  return nameCompare(a.horse, b.horse);
}

const SORT_COMPARATORS: Record<SortKey, (a: CandidateResult, b: CandidateResult) => number> = {
  name: (a, b) => nameCompare(a.horse, b.horse),
  keitou: (a, b) => keitouSortValue(a.keitouGrade) - keitouSortValue(b.keitouGrade),
  inbreed: (a, b) => inbreedSortValue(a) - inbreedSortValue(b),
  medal: (a, b) => medalSortValue(a.medalCount) - medalSortValue(b.medalCount),
};

/**
 * 馬名クリック時に表示するポップアップ（種牡馬側・繁殖牝馬側 両方の血統表＋
 * インブリード判定＋株券入手条件）の対象。
 * ランキング表の候補馬をクリックした場合は「個体指定した側 × その候補馬」、
 * 1対1判定結果の馬名をクリックした場合は「判定した種牡馬 × 繁殖牝馬」になる。
 */
interface PairDetailTarget {
  sireNode: PedigreeNode;
  mareNode: PedigreeNode;
  inbreed: InbreedResult;
  effects: { name: string; bonuses: string[] }[];
  keitouGrade: KeitouGrade;
  sireMedalCount: number | null;
  mareMedalCount: number | null;
  /** 株券入手条件はクリックした馬の分だけ表示する */
  clickedLabel: string;
  clickedHorseType: "sire" | "mare";
  clickedNode: PedigreeNode;
}

function findStockRecord(node: PedigreeNode, label: string, horseType: "sire" | "mare") {
  const name = node.type === "catalog" ? node.horse.name : label;
  return findStockRecordByName(name, horseType);
}

/** ペア詳細モーダルの血統表で赤枠にする対象（実際にインブリードとして検出された祖先）のキー集合 */
function inbreedAncestorKeys(target: PairDetailTarget): Set<string> {
  return new Set(target.inbreed.pairs.map((p) => p.name));
}

const InbreedCheckPage: React.FC = () => {
  const navigate = useNavigate();
  const taneData = HorseIDData as KeitouRecord[];

  const [sireNode, setSireNode] = useState<PedigreeNode>({ type: "unknown" });
  const [mareNode, setMareNode] = useState<PedigreeNode>({ type: "unknown" });

  // ランキング対象にできるのはどちらか片方のみ。両方 single も可（1対1判定になる）
  const [sireMode, setSireMode] = useState<ColumnMode>("single");
  const [mareMode, setMareMode] = useState<ColumnMode>("rankAll");

  const setSireModeSafe = (mode: ColumnMode) => {
    setSireMode(mode);
    if (mode === "rankAll") setMareMode("single");
  };
  const setMareModeSafe = (mode: ColumnMode) => {
    setMareMode(mode);
    if (mode === "rankAll") setSireMode("single");
  };

  // ------------------------------------------------------------
  // 保存済み自家生産馬（localStorage / Cookie）
  // ------------------------------------------------------------
  const [saved, setSaved] = useState<SavedPedigree[]>(() => loadSavedPedigrees());
  useEffect(() => {
    persistSavedPedigrees(saved);
  }, [saved]);

  /** 保存データを実際の PedigreeNode に復元したもの（選択モーダルに渡す） */
  const savedOptions = useMemo<SavedOption[]>(
    () =>
      saved
        .map((s) => ({ id: s.id, name: s.name, sex: s.sex, node: deserializeNode(s.node, HORSE_CATALOG) }))
        .filter((s): s is SavedOption => s.node !== null),
    [saved]
  );

  const cloneNode = useMemo(() => (n: PedigreeNode) => cloneNodeWith(n, HORSE_CATALOG), []);

  // --- 保存モーダル ---
  const [saveTarget, setSaveTarget] = useState<PedigreeNode | null>(null);
  const [saveName, setSaveName] = useState("");
  // 保存先（種牡馬側/繁殖牝馬側）。列から保存した場合はその列の性別を初期値にするが、
  // ランキング等から作った組み合わせ（産駒）はどちら側でも使う可能性があるため変更できるようにする。
  const [saveSex, setSaveSex] = useState<Sex>("male");
  const [overwriteId, setOverwriteId] = useState<string>("");

  const openSaveModal = (node: PedigreeNode, sex: Sex) => {
    // 配合不可の自家生産馬を含む血統は保存させない
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

  // --- 管理モーダル ---
  const [showManage, setShowManage] = useState(false);
  const renameSaved = (id: string, name: string) =>
    setSaved((prev) => prev.map((s) => (s.id === id ? { ...s, name } : s)));
  const deleteSaved = (id: string) => setSaved((prev) => prev.filter((s) => s.id !== id));

  // ------------------------------------------------------------
  // 系統の自動継承（4代連続で自家生産馬が続き、カタログ馬に行き着けない場合は null）
  // ------------------------------------------------------------
  const autoSireLine = useMemo(() => resolveInheritedLine(sireNode, "male"), [sireNode]);
  const autoMareLine = useMemo(() => resolveInheritedLine(mareNode, "female"), [mareNode]);

  // 系統不明時のみ使う手動選択（自動判定できる場合はこの値は無視される＝グレーアウト）
  const [manualSireLine, setManualSireLine] = useState<string>("");
  const [manualMareLine, setManualMareLine] = useState<string>("");

  const effectiveSireLine = autoSireLine ?? (manualSireLine || null);
  const effectiveMareLine = autoMareLine ?? (manualMareLine || null);

  const sireLineOptions = useMemo(() => getAllKeitouNames(taneData, 1), [taneData]);
  const mareLineOptions = useMemo(() => getAllKeitouNames(taneData, 2), [taneData]);

  // ------------------------------------------------------------
  // 自家生産馬の成立チェック
  // 血統表に置かれた自家生産馬は、それ自身が「父×母」の配合で生まれた馬なので、
  // その父母の組み合わせが配合不可なら、その馬は本来存在しえない。
  // 該当する場合は保存・判定をブロックする（「候補馬全頭でランキング」側の列は
  // カタログ馬が対象なのでチェック不要）。
  // ------------------------------------------------------------
  const sireIssues = useMemo(
    () => (sireMode === "single" ? collectHomebredIssues(sireNode) : []),
    [sireNode, sireMode]
  );
  const mareIssues = useMemo(
    () => (mareMode === "single" ? collectHomebredIssues(mareNode) : []),
    [mareNode, mareMode]
  );
  const blockingIssues = useMemo(
    () => [
      ...sireIssues.map((i) => ({ column: "種牡馬", issue: i })),
      ...mareIssues.map((i) => ({ column: "繁殖牝馬", issue: i })),
    ],
    [sireIssues, mareIssues]
  );
  const hasBlockingIssue = blockingIssues.length > 0;

  // 両方「個体を指定」のときだけ、血統表上で重複祖先をライブにハイライトする
  const crossKeys = useMemo(() => {
    if (sireMode !== "single" || mareMode !== "single") return new Set<string>();
    const sireAncestors = flattenPedigree(sireNode, 1);
    const mareAncestors = flattenPedigree(mareNode, 1);
    const mareKeys = new Set(mareAncestors.map((a) => a.name));
    return new Set(sireAncestors.filter((a) => mareKeys.has(a.name)).map((a) => a.name));
  }, [sireNode, mareNode, sireMode, mareMode]);

  // 表示フィルタ（判定結果には影響せず、表示だけを絞り込む。ライブ反映）
  const [excludeInvalid, setExcludeInvalid] = useState(false);
  const [excludeUnobtainable, setExcludeUnobtainable] = useState(false);
  const [checkedGrades, setCheckedGrades] = useState<Record<string, boolean>>(
    Object.fromEntries(ALL_KEITOU_GRADES.map((g) => [g, true]))
  );

  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection } | null>(null);

  // --- 馬名クリックで開く「血統表＋インブリード判定＋株券入手条件」ポップアップ ---
  const [pairDetail, setPairDetail] = useState<PairDetailTarget | null>(null);
  const stockModalRecord = useMemo(
    () => (pairDetail ? findStockRecord(pairDetail.clickedNode, pairDetail.clickedLabel, pairDetail.clickedHorseType) : undefined),
    [pairDetail]
  );

  // --- 判定ボタンを押した時点の内容だけを保持する「確定済み」結果 ---
  const [hasJudged, setHasJudged] = useState(false);
  const [judgedIsRankingMode, setJudgedIsRankingMode] = useState(false);
  const [judgedRankResults, setJudgedRankResults] = useState<CandidateResult[]>([]);
  const [judgedPairResult, setJudgedPairResult] = useState<PairJudgeResult | null>(null);
  const [judgedSireLabel, setJudgedSireLabel] = useState("");
  const [judgedMareLabel, setJudgedMareLabel] = useState("");
  // 判定時点の血統ツリーのスナップショット（結果表示後に入力側を変更しても、
  // 血統表ポップアップには判定時点の内容を表示するため）
  const [judgedSireNode, setJudgedSireNode] = useState<PedigreeNode>({ type: "unknown" });
  const [judgedMareNode, setJudgedMareNode] = useState<PedigreeNode>({ type: "unknown" });
  // ランキングモードで「個体を指定」した側のスナップショット（候補馬クリック時のペア表示に使う）
  const [judgedRankSide, setJudgedRankSide] = useState<"sire" | "mare" | null>(null);
  const [judgedRankBaseNode, setJudgedRankBaseNode] = useState<PedigreeNode>({ type: "unknown" });

  const handleJudge = () => {
    if (hasBlockingIssue) return; // 生産できない自家生産馬が含まれている間は判定しない

    const rankSideNow: "sire" | "mare" | null =
      sireMode === "rankAll" ? "sire" : mareMode === "rankAll" ? "mare" : null;
    const isRankingModeNow = rankSideNow !== null;

    setSortConfig(null); // 判定のたびに並び替え状態をリセットし、デフォルト順から見せ直す
    setJudgedIsRankingMode(isRankingModeNow);

    if (isRankingModeNow) {
      const baseNodeNow = rankSideNow === "sire" ? mareNode : sireNode;
      const baseLineNow = (rankSideNow === "sire" ? effectiveMareLine : effectiveSireLine) ?? undefined;
      const candidatesNow = HORSE_CATALOG.filter((h) =>
        rankSideNow === "sire" ? h.horse_type === "sire" : h.horse_type === "mare"
      );
      // excludeInvalid はここでは適用しない（表示側でライブにフィルタするため、常に全件取得）
      const results = rankCandidates(baseNodeNow, candidatesNow, false, baseLineNow, taneData);
      setJudgedRankResults(results);
      setJudgedPairResult(null);
      setJudgedRankSide(rankSideNow);
      setJudgedRankBaseNode(baseNodeNow);
    } else {
      const result = judgePair(sireNode, mareNode, effectiveSireLine, effectiveMareLine, taneData);
      setJudgedPairResult(result);
      setJudgedRankResults([]);
      setJudgedSireLabel(sireNode.type === "catalog" ? sireNode.horse.name : describeNode(sireNode));
      setJudgedMareLabel(mareNode.type === "catalog" ? mareNode.horse.name : describeNode(mareNode));
      setJudgedSireNode(sireNode);
      setJudgedMareNode(mareNode);
    }
    setHasJudged(true);
  };

  /** ランキング表の候補馬をクリックした時: 「個体指定した側 × その候補馬」のペアを開く */
  const openPairDetailFromCandidate = (r: CandidateResult) => {
    if (!judgedRankSide) return;
    const candidateNode: PedigreeNode = { type: "catalog", horse: r.horse };
    const isCandidateSire = judgedRankSide === "sire";
    const baseMedal =
      judgedRankBaseNode.type === "catalog" ? getThreeStarMedalCount(judgedRankBaseNode.horse) : null;
    setPairDetail({
      sireNode: isCandidateSire ? candidateNode : judgedRankBaseNode,
      mareNode: isCandidateSire ? judgedRankBaseNode : candidateNode,
      inbreed: r.inbreed,
      effects: r.effects,
      keitouGrade: r.keitouGrade,
      sireMedalCount: isCandidateSire ? r.medalCount : baseMedal,
      mareMedalCount: isCandidateSire ? baseMedal : r.medalCount,
      clickedLabel: r.horse.name,
      clickedHorseType: r.horse.horse_type,
      clickedNode: candidateNode,
    });
  };

  /** 1対1判定結果の馬名をクリックした時: 判定済みの種牡馬×繁殖牝馬ペアを開く */
  const openPairDetailFromJudgedPair = (which: "sire" | "mare") => {
    if (!judgedPairResult) return;
    setPairDetail({
      sireNode: judgedSireNode,
      mareNode: judgedMareNode,
      inbreed: judgedPairResult.inbreed,
      effects: judgedPairResult.effects,
      keitouGrade: judgedPairResult.keitouGrade,
      sireMedalCount: judgedPairResult.sireMedalCount,
      mareMedalCount: judgedPairResult.mareMedalCount,
      clickedLabel: which === "sire" ? judgedSireLabel : judgedMareLabel,
      clickedHorseType: which,
      clickedNode: which === "sire" ? judgedSireNode : judgedMareNode,
    });
  };

  const backpage = () => navigate("/");

  // --- ランキングモードの表示用データ処理（フィルタ・並び替えはライブに反映） ---
  const filteredResults = useMemo(() => {
    return judgedRankResults.filter((r) => {
      if (excludeInvalid && !r.inbreed.isValid) return false;
      if (excludeUnobtainable && hasNoObtainableStock(r.horse)) return false;
      if (r.keitouGrade === null) return true;
      return checkedGrades[r.keitouGrade];
    });
  }, [judgedRankResults, excludeInvalid, excludeUnobtainable, checkedGrades]);

  // 「順位」バッジ用の固定順位（列ソートで表示順を変えても、この番号自体は変わらない）
  const rankMap = useMemo(() => {
    const valid = judgedRankResults.filter((r) => r.inbreed.isValid);
    const sorted = [...valid].sort(compareCandidatesDefault);
    const m = new Map<number, number>();
    sorted.forEach((r, i) => m.set(r.sourceIndex, i + 1));
    return m;
  }, [judgedRankResults]);

  const sortedResults = useMemo(() => {
    const valid = filteredResults.filter((r) => r.inbreed.isValid);
    const invalid = filteredResults.filter((r) => !r.inbreed.isValid);

    let validSorted: CandidateResult[];
    if (!sortConfig) {
      validSorted = [...valid].sort(compareCandidatesDefault);
    } else {
      const dir = sortConfig.direction === "asc" ? 1 : -1;
      const cmp = SORT_COMPARATORS[sortConfig.key];
      validSorted = [...valid].sort((a, b) => cmp(a, b) * dir);
    }
    // 配合不可は常に最下部（列ソートの対象外・馬名順で安定表示）
    const invalidSorted = [...invalid].sort((a, b) => nameCompare(a.horse, b.horse));
    return [...validSorted, ...invalidSorted];
  }, [filteredResults, sortConfig]);

  const handleSort = (key: SortKey) => {
    setSortConfig((prev): { key: SortKey; direction: SortDirection } | null => {
      if (prev && prev.key === key) {
        return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
      }
      return { key, direction: "asc" };
    });
  };
  const sortArrow = (key: SortKey) =>
    !sortConfig || sortConfig.key !== key ? "" : sortConfig.direction === "asc" ? " ▲" : " ▼";

  const isRankingMode = sireMode === "rankAll" || mareMode === "rankAll";

  const thStyle: React.CSSProperties = {
    backgroundColor: "#1565c0", color: "#fff", padding: "6px 4px",
    border: "none", cursor: "pointer", whiteSpace: "nowrap", fontSize: "11px",
  };

  const renderColumn = (
    label: string,
    sex: Sex,
    node: PedigreeNode,
    setNode: (n: PedigreeNode) => void,
    mode: ColumnMode,
    setMode: (m: ColumnMode) => void,
    autoLine: string | null,
    manualLine: string,
    setManualLine: (v: string) => void,
    lineOptions: string[],
    issues: HomebredIssue[]
  ) => (
    <Col xs={12} md={6} className="mb-3">
      <div className="p-3 shadow-sm" style={{ backgroundColor: "#fff", borderRadius: "12px", height: "100%" }}>
        <Form.Label className="fw-bold" style={{ color: "#0d47a1" }}>{label}</Form.Label>
        <ToggleButtonGroup
          type="radio"
          name={`mode-${label}`}
          value={mode}
          className="w-100 shadow-sm mb-3"
        >
          <ToggleButton
            id={`mode-single-${label}`} value="single"
            variant={mode === "single" ? "dark" : "outline-dark"}
            onClick={() => setMode("single")}
            className="fw-bold small"
          >
            個体を指定
          </ToggleButton>
          <ToggleButton
            id={`mode-rank-${label}`} value="rankAll"
            variant={mode === "rankAll" ? "dark" : "outline-dark"}
            onClick={() => setMode("rankAll")}
            className="fw-bold small"
          >
            候補馬全頭でランキング
          </ToggleButton>
        </ToggleButtonGroup>

        {mode === "single" ? (
          <>
            <PedigreeGridSelector
              columnLabel={label}
              requiredSex={sex}
              catalog={HORSE_CATALOG}
              value={node}
              onChange={setNode}
              savedOptions={savedOptions}
              highlightKeys={crossKeys}
              cloneNode={cloneNode}
            />

            <div className="d-flex gap-2 mt-2">
              <Button
                size="sm"
                variant="outline-danger"
                className="flex-fill fw-bold"
                onClick={() => openSaveModal(node, sex)}
                disabled={node.type !== "homebred" || issues.length > 0}
                title={
                  issues.length > 0
                    ? "配合不可の自家生産馬が含まれているため保存できません"
                    : node.type !== "homebred"
                    ? "自家生産馬（本馬を自家生産馬にした血統）のみ保存できます"
                    : undefined
                }
              >
                {issues.length > 0 ? "保存不可（配合不可）" : "この血統を保存"}
              </Button>
              <Button
                size="sm"
                variant="outline-secondary"
                className="fw-bold"
                onClick={() => setShowManage(true)}
              >
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
              <Form.Select
                value={manualLine}
                onChange={(e) => setManualLine(e.target.value)}
                className="shadow-sm"
              >
                <option value="">系統を選択してください</option>
                {lineOptions.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </Form.Select>
            )}
          </>
        ) : (
          <div className="text-muted small p-3 text-center" style={{ backgroundColor: "#f0f2f5", borderRadius: "8px" }}>
            この列は候補馬リストの全頭（{
              HORSE_CATALOG.filter((h) => (sex === "male" ? h.horse_type === "sire" : h.horse_type === "mare")).length
            }頭）が判定対象になります
          </div>
        )}
      </div>
    </Col>
  );

  return (
    <div style={{ backgroundColor: "#f0f2f5", minHeight: "100vh", paddingBottom: "50px" }}>
      <Container className="pt-4" style={{ maxWidth: "920px" }}>
        <Card className="shadow border-0 mb-4" style={{ borderRadius: "16px", overflow: "hidden" }}>
          <div style={{ height: "8px", backgroundColor: "#1565c0" }} />
          <Card.Body className="p-4">
            <h4 className="text-center mb-4" style={{ color: "#0d47a1", fontWeight: 900 }}>
              INBREED CHECK <span style={{ color: "#1565c0", fontSize: "0.8em" }}>| 実血統インブリード判定</span>
            </h4>

            <Row>
              {renderColumn(
                "種牡馬", "male", sireNode, setSireNode, sireMode, setSireModeSafe,
                autoSireLine, manualSireLine, setManualSireLine, sireLineOptions, sireIssues
              )}
              {renderColumn(
                "繁殖牝馬", "female", mareNode, setMareNode, mareMode, setMareModeSafe,
                autoMareLine, manualMareLine, setManualMareLine, mareLineOptions, mareIssues
              )}
            </Row>

            {savedOptions.length > 0 && (
              <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
                <span className="small fw-bold text-muted">保存済みの自家生産馬:</span>
                {savedOptions.map((s) => (
                  <Badge key={s.id} bg="light" text="dark" style={{ border: "1px solid #ced4da" }}>
                    {s.name}
                    <span className="text-muted ms-1" style={{ fontWeight: 400 }}>
                      （{s.sex === "male" ? "種牡馬側" : "繁殖牝馬側"}）
                    </span>
                  </Badge>
                ))}
                <span className="text-muted" style={{ fontSize: "10px" }}>
                  ※ 血統表のマスをクリック →「保存した馬」タブから呼び出せます
                </span>
              </div>
            )}

            {isRankingMode && (
              <>
                <Form.Label className="small fw-bold text-muted mt-3 d-block">
                  表示する系統相性（クリックで表示/非表示を指定）
                </Form.Label>
                <div className="d-flex flex-wrap gap-2 mb-2">
                  {ALL_KEITOU_GRADES.map((grade) => (
                    <ToggleButton
                      key={grade}
                      id={`grade-${grade}`}
                      type="checkbox"
                      value={grade}
                      checked={checkedGrades[grade]}
                      onChange={(e) => setCheckedGrades({ ...checkedGrades, [grade]: e.currentTarget.checked })}
                      className="fw-bold shadow-sm"
                      style={{
                        backgroundColor: checkedGrades[grade] ? KEITOU_GRADE_COLOR[grade] : "#e9ecef",
                        color: checkedGrades[grade] ? KEITOU_GRADE_TEXT_COLOR[grade] : "#6c757d",
                        border: "1px solid #ced4da",
                      }}
                    >
                      {grade}
                    </ToggleButton>
                  ))}
                </div>

                <Form.Check
                  type="switch"
                  id="exclude-invalid"
                  className="my-3"
                  label="配合不可の候補を表から除外する（OFFの場合は最下部にまとめて表示）"
                  checked={excludeInvalid}
                  onChange={(e) => setExcludeInvalid(e.currentTarget.checked)}
                />

                <Form.Check
                  type="switch"
                  id="exclude-unobtainable"
                  className="my-3"
                  label="株券入手条件が★〜★★★すべて「STARHORSE.NETにて獲得」または「？」の候補を除外する"
                  checked={excludeUnobtainable}
                  onChange={(e) => setExcludeUnobtainable(e.currentTarget.checked)}
                />
              </>
            )}

            {hasBlockingIssue && (
              <div className="alert alert-danger py-2 px-3 mb-3" style={{ fontSize: "12.5px" }}>
                <div className="fw-bold mb-1">
                  ⚠ 生産できない自家生産馬が含まれているため判定できません
                </div>
                {blockingIssues.map(({ column, issue }, i) => (
                  <div key={i}>
                    ・{column} / {issue.positionLabel}（{issue.horseLabel}）: {issue.reason}
                  </div>
                ))}
              </div>
            )}

            <Button
              className="w-100 border-0 shadow"
              style={{
                background: hasBlockingIssue
                  ? "linear-gradient(45deg, #b0a9a7 0%, #918a88 100%)"
                  : "linear-gradient(45deg, #1976d2 0%, #0d47a1 100%)",
                borderRadius: "10px", padding: "12px", fontWeight: "bold",
              }}
              onClick={handleJudge}
              disabled={hasBlockingIssue}
            >
              判定！
            </Button>
          </Card.Body>
        </Card>

        {/* --- ランキング表示 --- */}
        {hasJudged && !hasBlockingIssue && judgedIsRankingMode && (
          <div className="shadow-sm mb-4" style={{ borderRadius: "12px", overflow: "hidden", overflowX: "auto" }}>
            <BootstrapTable className="mb-0" style={{ fontSize: "11px" }}>
              <thead>
                <tr className="text-center">
                  <th style={{ ...thStyle, cursor: "default", width: "24px" }}>順位</th>
                  <th style={{ ...thStyle, whiteSpace: "nowrap" }} onClick={() => handleSort("name")}>
                    馬名{sortArrow("name")}
                  </th>
                  <th style={{ ...thStyle, width: "40px" }} onClick={() => handleSort("keitou")}>
                    系統<br />相性{sortArrow("keitou")}
                  </th>
                  <th style={thStyle} onClick={() => handleSort("inbreed")}>
                    インブリード / 効果{sortArrow("inbreed")}
                  </th>
                  <th style={{ ...thStyle, width: "36px" }} onClick={() => handleSort("medal")}>
                    ★3{sortArrow("medal")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedResults.map((r) => (
                  <tr key={r.sourceIndex} className="align-middle">
                    <td className="text-center fw-bold" style={{ backgroundColor: "#3b3b3b", color: "#fff", padding: "4px" }}>
                      {rankMap.get(r.sourceIndex) ?? "―"}
                    </td>
                    <td
                      style={{
                        backgroundColor: "#3b3b3b", color: "#fff", fontWeight: 600, whiteSpace: "nowrap",
                        padding: "4px 6px", cursor: "pointer", textDecoration: "underline",
                      }}
                      onClick={() => openPairDetailFromCandidate(r)}
                    >
                      {r.horse.name}
                    </td>
                    <td
                      className="text-center fw-bold"
                      style={{
                        backgroundColor: r.keitouGrade ? KEITOU_GRADE_COLOR[r.keitouGrade] : "#ffffff",
                        color: r.keitouGrade ? KEITOU_GRADE_TEXT_COLOR[r.keitouGrade] : "#999",
                        padding: "4px 2px",
                      }}
                    >
                      {r.keitouGrade ?? "―"}
                    </td>
                    <td style={{ backgroundColor: r.inbreed.isValid ? "#ffffff" : "#f5c6c6", padding: "4px 6px" }}>
                      {!r.inbreed.isValid && (
                        <div className="text-danger fw-bold">配合不可: {r.inbreed.invalidReason}</div>
                      )}
                      {r.inbreed.isValid && r.inbreed.pairs.length === 0 && (
                        <div className="text-muted">アウトブリード</div>
                      )}
                      {r.inbreed.pairs.map((p, i) => (
                        <span key={i} className="me-1">
                          <Badge bg="secondary">{p.notation}</Badge> {p.label}
                        </span>
                      ))}
                      {r.inbreed.isValid && r.inbreed.hasPreProductionWarning && (
                        <div className="text-warning fw-bold">※生産時コメント注意</div>
                      )}
                      {r.inbreed.isValid &&
                        r.effects.map((e, i) => (
                          <div key={i}>{e.name}: {e.bonuses.join(" / ")}</div>
                        ))}
                    </td>
                    <td className="text-center fw-bold" style={{ backgroundColor: "#ffff9e", padding: "4px 2px" }}>
                      {r.medalCount ?? "―"}
                    </td>
                  </tr>
                ))}
                {sortedResults.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center text-muted py-3" style={{ backgroundColor: "#fff" }}>
                      条件に一致する候補馬がありません（系統相性の指定をご確認ください）
                    </td>
                  </tr>
                )}
              </tbody>
            </BootstrapTable>
          </div>
        )}

        {/* --- 1対1判定表示（両方 個体を指定 のとき） --- */}
        {hasJudged && !hasBlockingIssue && !judgedIsRankingMode && judgedPairResult && (
          <div className="shadow-sm mb-4 p-4" style={{ borderRadius: "12px", backgroundColor: "#fff" }}>
            <div className="fw-bold mb-3" style={{ fontSize: "1.1em" }}>
              <span
                style={{ cursor: "pointer", textDecoration: "underline" }}
                onClick={() => openPairDetailFromJudgedPair("sire")}
              >
                {judgedSireLabel}
              </span>
              {" × "}
              <span
                style={{ cursor: "pointer", textDecoration: "underline" }}
                onClick={() => openPairDetailFromJudgedPair("mare")}
              >
                {judgedMareLabel}
              </span>
            </div>

            <PairJudgeSummary
              keitouGrade={judgedPairResult.keitouGrade}
              sireMedalCount={judgedPairResult.sireMedalCount}
              mareMedalCount={judgedPairResult.mareMedalCount}
              inbreed={judgedPairResult.inbreed}
              effects={judgedPairResult.effects}
            />
          </div>
        )}

        <Button variant="success" className="w-100 fw-bold py-2 shadow-sm" style={{ borderRadius: "10px" }} onClick={backpage}>
          戻る
        </Button>

        {/* --- 血統の保存モーダル --- */}
        <Modal show={saveTarget !== null} onHide={() => setSaveTarget(null)} centered>
          <Modal.Header closeButton style={{ backgroundColor: "#1565c0", color: "#fff" }}>
            <Modal.Title style={{ fontSize: "1.05em" }}>この血統を保存</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="text-muted small mb-2">
              {saveTarget && describeNode(saveTarget)}
            </div>
            <Form.Label className="small fw-bold text-muted">呼び出すときの名前</Form.Label>
            <Form.Control
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              placeholder="例: 自家生産馬A"
              className="mb-3 shadow-sm"
            />

            <Form.Label className="small fw-bold text-muted d-block">保存する側</Form.Label>
            <ToggleButtonGroup
              type="radio"
              name="save-sex"
              value={saveSex}
              className="w-100 shadow-sm mb-3"
            >
              <ToggleButton
                id="save-sex-male"
                value="male"
                variant={saveSex === "male" ? "dark" : "outline-dark"}
                onClick={() => setSaveSex("male")}
                className="fw-bold small"
              >
                種牡馬側
              </ToggleButton>
              <ToggleButton
                id="save-sex-female"
                value="female"
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
                    <option key={s.id} value={s.id}>
                      {s.name} を上書き
                    </option>
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
                    <option key={s.id} value={s.id}>
                      {s.name} を上書き
                    </option>
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
          <Modal.Header closeButton style={{ backgroundColor: "#1565c0", color: "#fff" }}>
            <Modal.Title style={{ fontSize: "1.05em" }}>
              保存した自家生産馬（{saved.length}/{MAX_SAVED_PEDIGREES}）
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {saved.length === 0 && (
              <div className="text-center text-muted py-4 small">
                まだ保存されていません。<br />
                本馬を「自家生産馬」にして血統を組んだあと、<br />
                「この血統を保存」から登録できます。
              </div>
            )}
            {saved.map((s) => (
              <div key={s.id} className="mb-3 pb-3" style={{ borderBottom: "1px solid #eee" }}>
                <div className="d-flex gap-2 align-items-center mb-1">
                  <Form.Control
                    size="sm"
                    value={s.name}
                    onChange={(e) => renameSaved(s.id, e.target.value)}
                  />
                  <Badge bg="secondary" className="flex-shrink-0">
                    {s.sex === "male" ? "種牡馬側" : "繁殖牝馬側"}
                  </Badge>
                  <Button
                    size="sm"
                    variant="outline-danger"
                    className="flex-shrink-0"
                    onClick={() => deleteSaved(s.id)}
                  >
                    削除
                  </Button>
                </div>
                <div className="text-muted small text-truncate">
                  {describeNode(deserializeNode(s.node, HORSE_CATALOG))}
                </div>
              </div>
            ))}
            <div className="text-muted" style={{ fontSize: "10px" }}>
              ※ この端末のブラウザに保存されます（localStorage、使用できない場合はCookie）。
              ブラウザの履歴・サイトデータを削除すると消えます。
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowManage(false)}>閉じる</Button>
          </Modal.Footer>
        </Modal>

        <Modal show={pairDetail !== null} onHide={() => setPairDetail(null)} centered size="xl" scrollable>
          <Modal.Header closeButton style={{ backgroundColor: "#1565c0", color: "#fff" }}>
            <Modal.Title style={{ fontSize: "1.1em" }}>
              {pairDetail && `${nodeLabel(pairDetail.sireNode)} × ${nodeLabel(pairDetail.mareNode)}`}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {pairDetail && (
              <>
                <style>{`
                  .pair-accordion .accordion-item {
                    border: 1px solid #dbe3ef;
                    border-radius: 10px;
                    overflow: hidden;
                  }
                  .pair-accordion .accordion-button {
                    font-size: 0.82rem;
                    font-weight: 700;
                    padding: 0.55rem 1rem;
                  }
                  .pair-accordion .accordion-button:not(.collapsed) {
                    color: #0d47a1;
                    background-color: #e6f0fa;
                    box-shadow: none;
                  }
                  .pair-accordion .accordion-button:focus {
                    box-shadow: none;
                  }
                `}</style>
                <Accordion
                  key={`${pairDetail.clickedHorseType}:${pairDetail.clickedLabel}:${nodeLabel(pairDetail.sireNode)}:${nodeLabel(pairDetail.mareNode)}`}
                  className="pair-accordion mb-4"
                >
                  <Accordion.Item eventKey="0">
                    <Accordion.Header>
                      血統表・インブリード判定{pairDetail.inbreed.pairs.length > 0 && "（インブリードあり）"}
                    </Accordion.Header>
                    <Accordion.Body>
                      <Row className="mb-3">
                        <Col xs={12} md={6} className="mb-3 mb-md-0">
                          <div className="fw-bold small text-muted mb-1">種牡馬側</div>
                          <PedigreeReadonlyGrid
                            node={pairDetail.sireNode}
                            requiredSex="male"
                            highlightKeys={inbreedAncestorKeys(pairDetail)}
                            highlightBorderColor="#d32f2f"
                            highlightBgColor="#f8d7da"
                          />
                        </Col>
                        <Col xs={12} md={6}>
                          <div className="fw-bold small text-muted mb-1">繁殖牝馬側</div>
                          <PedigreeReadonlyGrid
                            node={pairDetail.mareNode}
                            requiredSex="female"
                            highlightKeys={inbreedAncestorKeys(pairDetail)}
                            highlightBorderColor="#d32f2f"
                            highlightBgColor="#f8d7da"
                          />
                        </Col>
                      </Row>

                      <PairJudgeSummary
                        keitouGrade={pairDetail.keitouGrade}
                        sireMedalCount={pairDetail.sireMedalCount}
                        mareMedalCount={pairDetail.mareMedalCount}
                        inbreed={pairDetail.inbreed}
                        effects={pairDetail.effects}
                      />
                    </Accordion.Body>
                  </Accordion.Item>
                </Accordion>

                <div className="d-flex justify-content-end mb-4">
                  <Button
                    size="sm"
                    variant="outline-danger"
                    onClick={() =>
                      openSaveModal(
                        { type: "homebred", name: "", sire: pairDetail.sireNode, dam: pairDetail.mareNode },
                        "male"
                      )
                    }
                    disabled={!pairDetail.inbreed.isValid}
                    title={!pairDetail.inbreed.isValid ? "配合不可の組み合わせは保存できません" : undefined}
                  >
                    この組み合わせを保存
                  </Button>
                </div>
              </>
            )}

            <div className="fw-bold small text-muted mb-2">
              株券入手条件{pairDetail && `（${pairDetail.clickedLabel}）`}
            </div>
            <StockConditionList record={stockModalRecord} />
          </Modal.Body>
        </Modal>
      </Container>
    </div>
  );
};

export default InbreedCheckPage;
