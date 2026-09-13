// ============================================================
// pedigreeUtils.ts
// 血統ツリーの平坦化 / 同一個体判定 / インブリード検出 / 配合可否判定 /
// スコアリング / 系統相性付与
// ============================================================

import {
  PedigreeNode,
  PedigreeKey,
  FlatAncestor,
  InbreedPair,
  InbreedResult,
  CandidateResult,
  PairJudgeResult,
  HorseRecord,
  KeitouRecord,
  Sex,
} from "./types";
import { INBREED_EFFECT_MAP, MARK_WEIGHT } from "./inbreedEffects";
import { canonicalizeHorseName } from "./horseNameAliases";
import { getKeitouGrade } from "./keitouUtils";

/** 血統として考慮する最大世代（本馬=1, 父母=2, 祖父母=3, 曾祖父母=4） */
export const MAX_GEN = 4;

/** カタログ馬の pedigree キー → 本馬からの相対世代 */
const CATALOG_KEY_REL_GEN: Record<PedigreeKey, number> = {
  S: 1, D: 1,
  SS: 2, SD: 2, DS: 2, DD: 2,
  SSS: 3, SSD: 3, SDS: 3, SDD: 3, DSS: 3, DSD: 3, DDS: 3, DDD: 3,
};

/**
 * 「祖先不明」を表すプレースホルダー名。血統データが欠けている場合に
 * 実データ側でこのような文字列が入っていることがあるため、これらは
 * 実際の同一祖先とはみなさず、インブリード判定から除外する。
 * ゲーム内でも Unknown 同士はクロス判定の対象外。
 */
const UNKNOWN_ANCESTOR_NAMES = new Set(["unknown", "不明", "-", "―", ""]);

function isUnknownAncestorName(name: string | undefined | null): boolean {
  if (!name) return true;
  return UNKNOWN_ANCESTOR_NAMES.has(name.trim().toLowerCase());
}

// ------------------------------------------------------------
// 同一個体の識別（カタログ馬 / 自家生産馬）
// ------------------------------------------------------------

interface HorseIdentity {
  /** 判定用の内部キー。カタログ馬は馬名そのもの。自家生産馬は名前ではなく
   *  構造（父・母が誰か）から一意に導く。父母が同一なら同じ個体とみなす。 */
  key: string;
  /** 画面表示用のラベル */
  label: string;
}

/**
 * ノード1つの「個体としての同一性」を解決する。
 *
 * 優先順位:
 *  1. カタログ馬 → 馬名そのものをキーにする
 *  2. 自家生産馬で 父・母 双方の個体識別が可能 → 「父×母」の組み合わせを
 *     キーにする（同じ父×母の組み合わせは同一個体として扱う。これにより
 *     名前を入力していなくても、また別々に選択した自家生産馬でも、
 *     父母が一致すれば同一個体としてインブリード判定・NG判定の対象になる）
 *  3. 父母のどちらかが不明で構造的に識別できない場合のみ、ユーザーが
 *     入力した名前をキーとして使う（フォールバック）
 *  4. どちらも無い場合は識別不能（= 判定対象に含めない。誤検出防止のため
 *     安全側に倒す）
 */
export function resolveNodeIdentity(
  node: PedigreeNode | null | undefined
): HorseIdentity | null {
  if (!node) return null;

  if (node.type === "catalog") {
    if (isUnknownAncestorName(node.horse.name)) return null;
    return { key: canonicalizeHorseName(node.horse.name), label: node.horse.name };
  }

  if (node.type === "homebred") {
    const sireId = resolveNodeIdentity(node.sire);
    const damId = resolveNodeIdentity(node.dam);

    if (sireId && damId) {
      // 構造的な同一性（父×母が一致）を最優先で使う
      return {
        key: `【自家】${sireId.key}×${damId.key}`,
        label:
          node.name && !isUnknownAncestorName(node.name)
            ? node.name.trim()
            : `自家生産馬(${sireId.label}×${damId.label})`,
      };
    }

    // 父母どちらかが不明で構造的に識別できない場合は、入力名だけを頼りにする
    if (node.name && !isUnknownAncestorName(node.name)) {
      return { key: `【自家:${node.name.trim()}】`, label: node.name.trim() };
    }

    return null;
  }

  // "unknown" -> 識別不能
  return null;
}

/**
 * カタログ馬(HorseRecord)自身の pedigree を、baseGen を基準にした絶対世代へ
 * 変換して out 配列へ積む（本馬自身は含まない。呼び出し側で積むこと）。
 * 祖先名が「Unknown」等の不明プレースホルダーの場合は除外する。
 */
function pushCatalogAncestors(
  horse: HorseRecord,
  baseGen: number,
  basePath: string,
  out: FlatAncestor[]
) {
  const entries = Object.entries(horse.pedigree) as [PedigreeKey, { name: string } | undefined][];
  for (const [key, anc] of entries) {
    if (!anc || isUnknownAncestorName(anc.name)) continue;
    const relGen = CATALOG_KEY_REL_GEN[key];
    const gen = baseGen + relGen;
    if (gen > MAX_GEN) continue;
    // key（"S"/"D"の連結）自体がそのカタログ馬から見た相対パスなので、そのまま連結する
    out.push({ name: canonicalizeHorseName(anc.name), displayName: anc.name, gen, path: basePath + key });
  }
}

/**
 * 血統ツリー(PedigreeNode)を平坦化し、{name(識別キー), displayName, gen, path} の
 * リストにする。gen: このノード自体の世代（ルート呼び出しは通常 1）。
 * path: ルート個体からの絶対パス（"S"/"D"連結。ルート自身は ""）。
 *
 * 自家生産馬は resolveNodeIdentity() により、父母が一致すれば同一個体として
 * 同じキーで積まれるため、ツリー内の別々の場所に出てきても正しく重複検出される。
 */
export function flattenPedigree(
  node: PedigreeNode | null | undefined,
  gen: number,
  out: FlatAncestor[] = [],
  path: string = ""
): FlatAncestor[] {
  if (!node || gen > MAX_GEN) return out;

  const identity = resolveNodeIdentity(node);
  if (identity) {
    out.push({ name: identity.key, displayName: identity.label, gen, path });
  }

  if (node.type === "catalog") {
    pushCatalogAncestors(node.horse, gen, path, out);
    return out;
  }

  if (node.type === "homebred") {
    flattenPedigree(node.sire, gen + 1, out, path + "S");
    flattenPedigree(node.dam, gen + 1, out, path + "D");
    return out;
  }

  // "unknown" -> それ以上たどらない
  return out;
}

/** 便利関数: カタログ馬をそのままルート(gen=1)としてツリー化 */
export function catalogNode(horse: HorseRecord): PedigreeNode {
  return { type: "catalog", horse };
}

/**
 * HorseRecord.grade_conditions から「★★★」欄の medal（例:"85枚"）の数値部分を取得する。
 * 見つからない場合は null。
 */
export function getThreeStarMedalCount(horse: HorseRecord): number | null {
  const row = horse.grade_conditions?.find((g) => g.grade === "★★★");
  if (!row) return null;
  const match = row.medal.match(/\d+/);
  return match ? Number(match[0]) : null;
}

/**
 * ある個体(node)の「系統」を、直系（種牡馬なら父方＝父・父の父・父の父の父…、
 * 繁殖牝馬なら母方＝母・母の母・母の母の母…）を辿って解決する。
 *
 * ・カタログ馬に行き着いた時点で、そのカタログ馬の line を採用して確定する
 * ・4代目（本馬を含めて4代連続）まで辿ってもカタログ馬に行き着かず、
 *   自家生産馬が続いた場合は系統不明（null）を返す
 *   → この場合のみ、画面側で系統をカラムから手動指定できるようにする
 * ・直系の父（または母）が未設定/不明("unknown")の場合も、その時点で系統不明
 *
 * sex: "male" なら父方（sireを辿る）、"female" なら母方（damを辿る）
 */
export function resolveInheritedLine(
  node: PedigreeNode | null | undefined,
  sex: Sex
): string | null {
  let current: PedigreeNode | null | undefined = node;
  for (let gen = 1; gen <= MAX_GEN; gen++) {
    if (!current) return null;
    if (current.type === "catalog") return current.horse.line;
    if (current.type === "unknown") return null;
    // homebred: 同性側の親（種牡馬なら父、繁殖牝馬なら母）へ1代進める
    current = sex === "male" ? current.sire : current.dam;
  }
  // 4代連続で自家生産馬（カタログ馬に行き着かなかった）→ 系統不明
  return null;
}

/**
 * 2頭分（種牡馬側 / 繁殖牝馬側）の平坦化済み祖先リストから、
 * 「種牡馬側と繁殖牝馬側の両方に共通して現れる祖先」の重複ペア（n×m）を検出する。
 *
 * 重要: 片方の側（例えば候補馬自身の血統）の中だけで既に近親（2×3 や 3×3 など）が
 * 存在していても、それは「その馬が元々持っている既存のインブリード」であり、
 * 今回の配合によって新たに生じるものではないため、判定には含めない。
 * ここでは必ず sideA 側の出現世代 と sideB 側の出現世代 を1つずつ組み合わせて
 * ペアを作る（sideA同士・sideB同士の組み合わせは作らない）。
 *
 * また、ある共通祖先（例: 3代目のトニービン）が一致すると、その祖先自身の
 * さらに先の血統（4代目のカンパラ等）も両側で自動的に一致してしまうことがある
 * （同じ実在馬の記録なので当然そうなる）。これは新たな情報ではなく、浅い方の
 * 一致から機械的に派生した結果にすぎないため、より浅い一致の「先」（path が
 * その一致祖先のpathを両側とも延長したもの）にあたる深い一致は除外し、
 * 一番浅い一致だけを残す。
 */
export function detectInbreedPairs(
  sideA: FlatAncestor[],
  sideB: FlatAncestor[]
): InbreedPair[] {
  const byNameA = new Map<string, { occurrences: { gen: number; path: string }[]; label: string }>();
  for (const a of sideA) {
    if (!byNameA.has(a.name)) byNameA.set(a.name, { occurrences: [], label: a.displayName });
    byNameA.get(a.name)!.occurrences.push({ gen: a.gen, path: a.path });
  }

  const byNameB = new Map<string, { occurrences: { gen: number; path: string }[]; label: string }>();
  for (const b of sideB) {
    if (!byNameB.has(b.name)) byNameB.set(b.name, { occurrences: [], label: b.displayName });
    byNameB.get(b.name)!.occurrences.push({ gen: b.gen, path: b.path });
  }

  interface RawCandidate {
    name: string;
    label: string;
    gA: number;
    gB: number;
    pathA: string;
    pathB: string;
  }

  const candidates: RawCandidate[] = [];
  byNameA.forEach((entryA, name) => {
    const entryB = byNameB.get(name);
    if (!entryB) return;
    for (const occA of entryA.occurrences) {
      for (const occB of entryB.occurrences) {
        candidates.push({
          name, label: entryA.label, gA: occA.gen, gB: occB.gen, pathA: occA.path, pathB: occB.path,
        });
      }
    }
  });

  // 浅い一致（世代の小さい方→大きい方の順）から確定させ、以降はそれより深い一致だけを
  // 派生候補として調べる。
  candidates.sort(
    (x, y) => Math.min(x.gA, x.gB) - Math.min(y.gA, y.gB) || Math.max(x.gA, x.gB) - Math.max(y.gA, y.gB)
  );

  const kept: RawCandidate[] = [];
  for (const c of candidates) {
    const isImplied = kept.some(
      (k) =>
        c.pathA.length > k.pathA.length &&
        c.pathA.startsWith(k.pathA) &&
        c.pathB.length > k.pathB.length &&
        c.pathB.startsWith(k.pathB)
    );
    if (isImplied) continue;
    kept.push(c);
  }

  return kept.map((c) => {
    const genA = Math.min(c.gA, c.gB);
    const genB = Math.max(c.gA, c.gB);
    return { name: c.name, label: c.label, genA, genB, notation: `${genA}×${genB}` };
  });
}

/** 配合不可となる単発禁止パターン（1つでも含めばNG） */
const FORBIDDEN_SINGLE = new Set(["1×2", "1×3", "1×4", "2×2", "2×3"]);
/** 2つ以上含むとNGになるパターン（3×3 と 2×4 は合算でカウント） */
const FORBIDDEN_DOUBLE = new Set(["3×3", "2×4"]);

/**
 * 検出済みペアから配合可否と体質リスクを判定する。
 * ※ 自家生産馬同士が同一個体（父母一致）と判定された場合も、
 *   ここで使う notation は世代番号のみに基づくため、通常の祖先と同様に
 *   NG判定（1×2 等）の対象になる。
 */
export function judgeInbreed(pairs: InbreedPair[]): InbreedResult {
  const forbiddenHit = pairs.find((p) => FORBIDDEN_SINGLE.has(p.notation));
  if (forbiddenHit) {
    return {
      pairs,
      isValid: false,
      invalidReason: `「${forbiddenHit.notation}」（${forbiddenHit.label}）を含むため配合できません`,
      hasWeaknessRisk: false,
      hasPreProductionWarning: false,
    };
  }

  const doubleCount = pairs.filter((p) => FORBIDDEN_DOUBLE.has(p.notation)).length;
  if (doubleCount >= 2) {
    return {
      pairs,
      isValid: false,
      invalidReason: `「3×3」「2×4」を合わせて2つ以上含むため配合できません`,
      hasWeaknessRisk: false,
      hasPreProductionWarning: false,
    };
  }

  const hasSingle3x3 = doubleCount === 1 && pairs.some((p) => p.notation === "3×3");
  const hasSingle2x4 = doubleCount === 1 && pairs.some((p) => p.notation === "2×4");

  return {
    pairs,
    isValid: true,
    hasWeaknessRisk: hasSingle3x3,
    hasPreProductionWarning: hasSingle3x3 || hasSingle2x4,
  };
}

/**
 * 有効なインブリードペアから、効果一覧表を用いてスコアと該当効果を算出する。
 * 同じ祖先（同一個体）は複数ペアあっても1回だけカウントする。
 * 自家生産馬の識別キーは効果一覧表に載っていないため、自然にスコア0（該当なし）になる。
 */
export function scoreInbreed(pairs: InbreedPair[]): {
  score: number;
  effects: { name: string; bonuses: string[] }[];
} {
  const seenNames = new Set<string>();
  const effects: { name: string; bonuses: string[] }[] = [];
  let score = 0;

  for (const pair of pairs) {
    if (seenNames.has(pair.name)) continue;
    const row = INBREED_EFFECT_MAP[pair.label] ?? INBREED_EFFECT_MAP[pair.name];
    if (!row) continue;
    seenNames.add(pair.name);

    const bonuses: string[] = [];
    for (const [aptitude, mark] of Object.entries(row.aptitudes)) {
      bonuses.push(`${aptitude}${mark}`);
      score += MARK_WEIGHT[mark as string] ?? 0;
    }
    effects.push({ name: pair.label, bonuses });
  }

  return { score, effects };
}

/**
 * 血統ツリー2つ（種牡馬側 / 繁殖牝馬側）から、インブリード判定・スコア・
 * 系統相性までまとめて算出する。1対1判定（両方とも個体を指定した場合）に使う。
 *
 * sireLine / mareLine は呼び出し側で resolveInheritedLine() 等を使って
 * 解決した系統名を渡す（カタログ馬はそのまま、自家生産馬は自動継承 or
 * 手動指定の結果を渡すことを想定）。
 */
export function judgePair(
  sireNode: PedigreeNode,
  mareNode: PedigreeNode,
  sireLine?: string | null,
  mareLine?: string | null,
  taneData?: KeitouRecord[]
): PairJudgeResult {
  const sireAncestors = flattenPedigree(sireNode, 1);
  const mareAncestors = flattenPedigree(mareNode, 1);
  const pairs = detectInbreedPairs(sireAncestors, mareAncestors);
  const inbreed = judgeInbreed(pairs);
  const { score, effects } = inbreed.isValid
    ? scoreInbreed(pairs)
    : { score: -Infinity, effects: [] };

  const keitouGrade =
    sireLine && mareLine && taneData
      ? getKeitouGrade(sireLine, mareLine, taneData)
      : null;

  const sireMedalCount = sireNode.type === "catalog" ? getThreeStarMedalCount(sireNode.horse) : null;
  const mareMedalCount = mareNode.type === "catalog" ? getThreeStarMedalCount(mareNode.horse) : null;

  return { inbreed, score, effects, keitouGrade, sireMedalCount, mareMedalCount };
}

/**
 * 基準馬(baseNode) × 候補馬1頭 のインブリード判定をまとめて行う。
 * baseLine / taneData を渡すと、系統ベースの相性グレード(堅実/鉄板/平均/一発/爆発)も算出する。
 */
export function judgeOneCandidate(
  baseAncestors: FlatAncestor[],
  candidate: HorseRecord,
  sourceIndex: number,
  baseLine?: string,
  taneData?: KeitouRecord[]
): CandidateResult {
  const candAncestors = flattenPedigree(catalogNode(candidate), 1);

  const pairs = detectInbreedPairs(baseAncestors, candAncestors);
  const inbreed = judgeInbreed(pairs);
  const { score, effects } = inbreed.isValid
    ? scoreInbreed(pairs)
    : { score: -Infinity, effects: [] };

  const keitouGrade =
    baseLine && taneData
      ? getKeitouGrade(baseLine, candidate.line, taneData)
      : null;

  const medalCount = getThreeStarMedalCount(candidate);

  return { horse: candidate, inbreed, score, effects, keitouGrade, medalCount, sourceIndex };
}

/**
 * 基準馬 × 候補馬リスト全頭 を判定する。
 * excludeInvalid = true の場合、配合不可の候補は結果から除外する。
 * 並び順は呼び出し側（画面側）でソート・ランキング付けする前提のため、
 * ここでは馬名順に整えて返すだけの単純な実装にしている。
 *
 * baseLine / taneData を渡すと、各候補に系統ベースの相性グレードも付与される。
 */
export function rankCandidates(
  baseNode: PedigreeNode,
  candidates: HorseRecord[],
  excludeInvalid: boolean,
  baseLine?: string,
  taneData?: KeitouRecord[]
): CandidateResult[] {
  const baseAncestors = flattenPedigree(baseNode, 1);
  const results = candidates.map((c, idx) =>
    judgeOneCandidate(baseAncestors, c, idx, baseLine, taneData)
  );

  const filtered = excludeInvalid ? results.filter((r) => r.inbreed.isValid) : results;
  return [...filtered].sort((a, b) => a.horse.name.localeCompare(b.horse.name, "ja"));
}
