import React, { useState, useRef, useEffect, useCallback } from "react";
import * as Tone from "tone";

/* ============================================================
   BACH PERPETUUM MOBILE — 無限バッハ機関
   チェンバロ再現音源(8'×2+4'ランク/リュートストップ)
   ヴェルクマイスターIII音律/a'=415Hz対応
   機能和声グラマーによる無限生成+リアルタイム楽典解説
   ============================================================ */

/* ---------- 音律 ---------- */
const TEMPS = {
  werck3: {
    name: "ヴェルクマイスターIII", nameEn: "Werckmeister III",
    cents: [0, 90.225, 192.18, 294.135, 390.225, 498.045, 588.27, 696.09, 792.18, 888.27, 996.09, 1092.18],
  },
  equal: {
    name: "十二平均律", nameEn: "Equal temperament",
    cents: [0, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100],
  },
};
const pcOf = (m) => ((m % 12) + 12) % 12;
function midiToFreq(midi, tempId, aFreq) {
  const cents = TEMPS[tempId].cents;
  const c4 = aFreq / Math.pow(2, cents[9] / 1200);
  return c4 * Math.pow(2, Math.floor(midi / 12) - 5) * Math.pow(2, cents[pcOf(midi)] / 1200);
}

/* ---------- 調名 ---------- */
const MAJ_NAMES = { 0: "ハ長調", 1: "変ニ長調", 2: "ニ長調", 3: "変ホ長調", 4: "ホ長調", 5: "ヘ長調", 6: "嬰ヘ長調", 7: "ト長調", 8: "変イ長調", 9: "イ長調", 10: "変ロ長調", 11: "ロ長調" };
const MIN_NAMES = { 0: "ハ短調", 1: "嬰ハ短調", 2: "ニ短調", 3: "変ホ短調", 4: "ホ短調", 5: "ヘ短調", 6: "嬰ヘ短調", 7: "ト短調", 8: "嬰ト短調", 9: "イ短調", 10: "変ロ短調", 11: "ロ短調" };
const MAJ_EN = { 0: "C major", 1: "D♭ major", 2: "D major", 3: "E♭ major", 4: "E major", 5: "F major", 6: "F♯ major", 7: "G major", 8: "A♭ major", 9: "A major", 10: "B♭ major", 11: "B major" };
const MIN_EN = { 0: "C minor", 1: "C♯ minor", 2: "D minor", 3: "E♭ minor", 4: "E minor", 5: "F minor", 6: "F♯ minor", 7: "G minor", 8: "G♯ minor", 9: "A minor", 10: "B♭ minor", 11: "B minor" };
const LANG = { v: "ja" };
const isJa = () => LANG.v === "ja";
const keyName = (k) =>
  isJa() ? (k.mode === "major" ? MAJ_NAMES[k.tonic] : MIN_NAMES[k.tonic]) : (k.mode === "major" ? MAJ_EN[k.tonic] : MIN_EN[k.tonic]);
const barStr = (n) => (isJa() ? `第${n}小節` : `Bar ${n}`);
const tempName = (id) => (isJa() ? TEMPS[id].name : TEMPS[id].nameEn);
/* 技法チップ・ラベル訳(表示時変換) */
const TR_EN = {
  "終止準備": "Cadence prep", "掛留4-3": "4-3 suspension", "トリル": "Trill", "ピカルディの3度": "Picardy third",
  "完全正格終止": "Perfect authentic cadence", "完全正格終止(PAC)": "PAC", "転調準備": "Modulation prep",
  "共通和音(ピボット)": "Pivot chord", "新調のドミナント": "New-key dominant", "新調の主和音": "New tonic",
  "偽終止": "Deceptive cadence", "終止定型": "Cadential formula", "カデンツ・トリル": "Cadential trill",
  "機能和声T-S-D-T": "T–S–D–T functions", "五度圏ゼクエンツ": "Circle-of-fifths sequence", "七の和音の連鎖": "Chain of sevenths",
  "下行5-6ゼクエンツ": "Descending 5-6 sequence", "ラメント・バス": "Lament bass", "フリギア終止(半終止)": "Phrygian half cadence",
  "フリギア終止": "Phrygian cadence", "ドミナント・ペダル": "Dominant pedal", "属和音の解放": "Dominant release", "解決": "Resolution",
  "副属七の連鎖": "Applied-dominant chain", "ドミナント": "Dominant", "半音階的ラメント・バス": "Chromatic lament bass",
  "ナポリの六": "Neapolitan sixth", "転回対位法": "Invertible counterpoint", "転回対位法(声部交換)": "Invertible counterpoint",
  "モルデント": "Mordent", "走句(第II鍵盤)": "Run (Manual II)", "エコー(鍵盤交替・第I鍵盤)": "Echo (Manual I)",
  "プラルトリラー": "Inverted mordent", "回音(グルペット)": "Turn (gruppetto)", "オクターヴ上の主音から": "From the octave tonic",
  "第3音からの開始": "Entry from the third", "同音反復の打鍵": "Repeated-note attack",
  "減七の分散和音": "Diminished-7th arpeggio", "オルゲルプンクト": "Pedal point", "フェルマータ": "Fermata",
  "逆オルゲルプンクト(上声保続)": "Inverted pedal point", "ゼクエンツ": "Sequence", "主題(ズビェクト)": "Subject",
  "属調の応答": "Answer at the fifth", "対唱": "Countersubject", "頭部動機のゼクエンツ": "Head-motif sequence",
  "ペダル(足鍵盤)の主題": "Subject in the pedal", "平行長調の主題": "Subject in relative major", "嬉遊部": "Episode",
  "ストレッタ": "Stretto", "掛留": "Suspension", "ゲネラルパウゼ(全休止)": "General pause", "終止": "Final cadence",
  "定旋律(カントゥス・フィルムス)": "Cantus firmus", "動機の統一": "Unified motif",
  "シュトレン(半終止)": "Stollen (half cadence)", "シュトレン変奏反復": "Stollen, varied repeat", "アプゲザング(全終止)": "Abgesang (full cadence)",
  "主題提示(グラウンド・バス)": "Ground bass statement", "和声付け": "Harmonization", "八分音符の変奏": "Eighth-note variation",
  "十六分音符の走句": "Sixteenth-note runs", "掛留(シンコペーション)": "Syncopated suspensions", "主題の上声移行": "Theme in the soprano",
  "トゥッティ": "Tutti", "オスティナート": "Ostinato",
  "弱起(アウフタクト)": "Upbeat (anacrusis)", "10度平行": "Parallel tenths", "保続音(開放弦)": "Open-string pedal",
  "ドゥーブル(装飾反復)": "Double (ornamented repeat)", "平行長調へ": "To the relative major", "主調で終止": "Cadence in the tonic",
  "(上拍)": "(upbeat)", "(上拍・後半)": "(upbeat, 2nd strain)",
  "即興句(高声)": "Improvisatory flourish (high)", "即興句(低声)": "Improvisatory flourish (low)", "走句": "Run",
  "フーガ:主唱": "Fugue: Dux", "答唱(V)": "Comes (V)", "主唱(バス)": "Dux (bass)", "主題(III度調)": "Subject (rel. major)",
  "ストレッタ/V保続": "Stretto / dominant pedal", "I(ピカルディ)": "I (Picardy)", "N6(ナポリ)": "N6 (Neapolitan)", "IV6(ドリア)": "IV6 (Dorian)",
  "順次進行型": "stepwise", "分散和音型": "arpeggiated", "回音(ターン)型": "turn-figure", "下行応答型": "descending-answer",
};
const tr = (s) => (isJa() ? s : TR_EN[s] ?? s);
/* UI文字列辞書 */
const UI = {
  ja: {
    h1: "無限バッハ機関", subtitle: "BACH PERPETUUM MOBILE — 撥弦物理モデル・チェンバロ&倍音加算パイプオルガン / 機能和声グラマーによる永久生成 / 楽典実況付き",
    analysis: "現在の解析 — ANALYSIS", idleMain: "機関停止中 — 「機関始動」で永久生成をはじめます",
    console: "操作 — CONSOLE", hide: "設定を隠す ▲", show: "設定を表示 ▼",
    start: "▶ 機関始動", tuning: "♯♭ 調律中… ", stop: "■ 即時停止", endGo: "𝄐 終止して閉じる", endIng: "終止へ向かっています…",
    recStart: "● 録画開始(MP4)", recStop: "■ 録画停止して保存", midi: "♪ MIDI書き出し",
    avsync: "録画A/V補正(音声を遅らせる)", avsyncNote: " — ずれが残る場合はここで追い込む",
    recPrev: "● 録画中プレビュー — この映像がそのまま保存されます",
    era: "時代", eraW: "ヴァイマル期(1708-17)・オルガン", eraK: "ケーテン期(1717-23)", eraL: "ライプツィヒ期(1723-50)・円熟和声",
    style: "様式", mToc: "トッカータとフーガ", mCho: "コラール前奏曲", mPas: "パッサカリア(変奏曲)",
    mAria: "アリア型(旋律+伴奏)", mPre: "プレリュード型(分散和音)", mInv: "インヴェンション型(二声対位法)",
    mBour: "リュート組曲のブーレ(BWV 996)",
    startKey: "開始調", nextStart: "(次回始動時)", temperament: "音律", retune: "(停止して再調律)",
    tempW: "ヴェルクマイスターIII(1691)", tempE: "十二平均律", pitch: "基準音高",
    p415: "a′=415Hz(バロック・ピッチ)", p440: "a′=440Hz(現代ピッチ)",
    tempo: "テンポ", volume: "音量", air: "空気感(室内残響)",
    orgStops: "レジストレーション — ORGAN STOPS", cembStops: "レジスター(ストップ)— REGISTERS",
    st8a: "8′ 前列", st8b: "8′ 後列", st4: "4′ 上鍵盤", stLute: "リュート(バフ)",
    lutStops: "コース(弦の張り方)— COURSES",
    luMain: "主弦", luCourse: "複弦コース", luOct: "低音のオクターヴ弦",
    oP8: "プリンシパル8′", oO4: "オクターヴ4′", oMix: "ミクスチュア", oPed: "ペダル16′",
    comm: "楽典実況 — COMMENTARIUS", logIdle: "生成がはじまると、ここに解説が流れます",
    footer: "Soli Deo Gloria — 弦・響板・空気・和声・対位法、すべて実時間演算",
    funcT: "T(主機能)", funcS: "S(下属機能)", funcD: "D(属機能)",
  },
  en: {
    h1: "BACH PERPETUUM MOBILE", subtitle: "Physically modeled harpsichord & additive pipe organ · perpetual generation via a functional-harmony grammar · live music-theory commentary",
    analysis: "CURRENT ANALYSIS", idleMain: "Engine idle — press “Start Engine” to begin perpetual generation",
    console: "CONSOLE", hide: "Hide settings ▲", show: "Show settings ▼",
    start: "▶ Start Engine", tuning: "♯♭ Tuning… ", stop: "■ Stop", endGo: "𝄐 Cadence & close", endIng: "Heading to the final cadence…",
    recStart: "● Record (MP4)", recStop: "■ Stop & save", midi: "♪ Export MIDI",
    avsync: "Recording A/V offset (delays audio)", avsyncNote: " — fine-tune here if drift remains",
    recPrev: "● Recording preview — exactly what gets saved",
    era: "Era", eraW: "Weimar (1708-17) · Organ", eraK: "Köthen (1717-23)", eraL: "Leipzig (1723-50) · Mature harmony",
    style: "Style", mToc: "Toccata & Fugue", mCho: "Chorale prelude", mPas: "Passacaglia (variations)",
    mAria: "Aria (melody + accompaniment)", mPre: "Prelude (arpeggiated)", mInv: "Invention (two-part counterpoint)",
    mBour: "Bourrée from the lute suite (BWV 996)",
    startKey: "Starting key", nextStart: " (applies next start)", temperament: "Temperament", retune: " (stop to retune)",
    tempW: "Werckmeister III (1691)", tempE: "Equal temperament", pitch: "Reference pitch",
    p415: "a′=415 Hz (Baroque pitch)", p440: "a′=440 Hz (modern)",
    tempo: "Tempo", volume: "Volume", air: "Room air (reverb)",
    orgStops: "REGISTRATION — ORGAN STOPS", cembStops: "REGISTERS",
    st8a: "8′ front", st8b: "8′ back", st4: "4′ upper", stLute: "Lute (buff)",
    lutStops: "COURSES",
    luMain: "Main string", luCourse: "Double course", luOct: "Octave string (bass)",
    oP8: "Principal 8′", oO4: "Octave 4′", oMix: "Mixture", oPed: "Pedal 16′",
    comm: "LIVE THEORY COMMENTARY", logIdle: "Commentary streams here once generation starts",
    footer: "Soli Deo Gloria — strings, soundboard, air, harmony & counterpoint, all computed in real time",
    funcT: "T (tonic)", funcS: "S (subdominant)", funcD: "D (dominant)",
  },
};
const tUI = (k) => (UI[LANG.v] || UI.ja)[k] ?? UI.ja[k];

/* ---------- 和音テーブル ---------- */
const CH_MAJ = {
  I: { iv: [0, 4, 7], b: 0, f: "T" }, I6: { iv: [0, 4, 7], b: 4, f: "T" }, I64: { iv: [0, 4, 7], b: 7, f: "D" },
  ii: { iv: [2, 5, 9], b: 2, f: "S" }, ii6: { iv: [2, 5, 9], b: 5, f: "S" }, ii7: { iv: [2, 5, 9, 0], b: 2, f: "S" },
  iii: { iv: [4, 7, 11], b: 4, f: "T" }, iii6: { iv: [4, 7, 11], b: 7, f: "T" }, iii7: { iv: [4, 7, 11, 2], b: 4, f: "T" },
  IV: { iv: [5, 9, 0], b: 5, f: "S" }, IV6: { iv: [5, 9, 0], b: 9, f: "S" },
  V: { iv: [7, 11, 2], b: 7, f: "D" }, V6: { iv: [7, 11, 2], b: 11, f: "D" }, V7: { iv: [7, 11, 2, 5], b: 7, f: "D" },
  vi: { iv: [9, 0, 4], b: 9, f: "T" }, vi7: { iv: [9, 0, 4, 7], b: 9, f: "T" },
  viio6: { iv: [11, 2, 5], b: 2, f: "D" },
};
const CH_MIN = {
  i: { iv: [0, 3, 7], b: 0, f: "T" }, i6: { iv: [0, 3, 7], b: 3, f: "T" }, i64: { iv: [0, 3, 7], b: 7, f: "D" },
  iio6: { iv: [2, 5, 8], b: 5, f: "S" }, "iiø7": { iv: [2, 5, 8, 0], b: 2, f: "S" },
  III: { iv: [3, 7, 10], b: 3, f: "T" },
  iv: { iv: [5, 8, 0], b: 5, f: "S" }, iv6: { iv: [5, 8, 0], b: 8, f: "S" },
  v6: { iv: [7, 10, 2], b: 10, f: "D" },
  V: { iv: [7, 11, 2], b: 7, f: "D" }, V7: { iv: [7, 11, 2, 5], b: 7, f: "D" },
  VI: { iv: [8, 0, 3], b: 8, f: "T" }, VII: { iv: [10, 2, 5], b: 10, f: "S" },
  "I#": { iv: [0, 4, 7], b: 0, f: "T" },
};
function mk(key, roman) {
  const tbl = key.mode === "major" ? CH_MAJ : CH_MIN;
  const c = tbl[roman];
  return {
    roman: roman === "I#" ? "I(ピカルディ)" : roman,
    pcs: c.iv.map((x) => pcOf(x + key.tonic)),
    bassPc: pcOf(c.b + key.tonic),
    f: c.f,
    key: { ...key },
  };
}

/* ---------- 主題(インヴェンション用) ---------- */
const SUBJECTS = [
  { name: "順次進行型", steps: [0, 1, 2, 4, 2, 1, 0, -1] },
  { name: "分散和音型", steps: [0, 2, 4, 7, 4, 2, 1, 0] },
  { name: "回音(ターン)型", steps: [0, -1, 0, 2, 1, 2, 4, 2] },
  { name: "下行応答型", steps: [4, 2, 0, 1, 2, 0, -1, 0] },
];
const COUNTER_STEPS = [0, 4, 2, 0];

/* ---------- アリア様式:旋律生成 ---------- */
const ARIA_PATTERNS = [[4, 4], [2, 2, 4], [4, 2, 2], [2, 2, 2, 2], [6, 2], [3, 1, 4], [2, 1, 1, 4], [8], [1, 1, 2, 2, 2]];
const ARIA_W = [3, 3, 3, 2, 2, 2, 1.5, 1, 1];
function pickPattern() {
  const tot = ARIA_W.reduce((a, b) => a + b, 0);
  let r = Math.random() * tot;
  for (let i = 0; i < ARIA_W.length; i++) { r -= ARIA_W[i]; if (r <= 0) return ARIA_PATTERNS[i]; }
  return ARIA_PATTERNS[0];
}
function scaleStepsBetween(a, b, scale) {
  while (!scale.includes(pcOf(b))) b += 1;
  if (a === b) return 0;
  const dir = b > a ? 1 : -1;
  let m = a, c = 0, guard = 0;
  while (m !== b && guard++ < 60) { m += dir; if (scale.includes(pcOf(m))) c += dir; }
  return c;
}
// 強拍aから出発し、次の強拍bへ順次進行(経過音)・刺繍音・限定的な跳躍で近づく旋律セル
function melodicCell(a, b, count, scale) {
  const out = [a];
  let cur = a;
  for (let i = 1; i < count; i++) {
    const left = count - i;
    const d = scaleStepsBetween(cur, b, scale);
    let move;
    if (d === 0) move = i % 2 === 1 ? 1 : -1; // 刺繍音
    else if (Math.abs(d) <= left) move = Math.sign(d); // 経過音
    else move = Math.sign(d) * Math.min(3, Math.ceil(Math.abs(d) / left)); // 跳躍(3度まで)
    cur = stepFrom(cur, move, scale);
    out.push(cur);
  }
  return out;
}
function nearestChordTone(ch, ref) {
  let best = null;
  ch.pcs.forEach((pc) => {
    const c = nearestPcMidi(pc, ref);
    if (best === null || Math.abs(c - ref) < Math.abs(best - ref)) best = c;
  });
  return best;
}

/* ---------- 音階ユーティリティ ---------- */
function scaleOf(chord) {
  const k = chord.key;
  let base;
  if (k.mode === "major") base = [0, 2, 4, 5, 7, 9, 11];
  else if (/^(V|viio|I\()/.test(chord.roman)) base = [0, 2, 3, 5, 7, 8, 11]; // 和声的短音階
  else base = [0, 2, 3, 5, 7, 8, 10];
  const abs = base.map((x) => pcOf(x + k.tonic));
  chord.pcs.forEach((p) => { if (!abs.includes(p)) abs.push(p); }); // 借用・半音階和音の構成音を許容
  return abs;
}
function stepFrom(midi, steps, scale) {
  let m = midi;
  while (!scale.includes(pcOf(m))) m += 1;
  if (steps === 0) return m;
  const dir = steps > 0 ? 1 : -1;
  let count = 0;
  while (count < Math.abs(steps)) {
    m += dir;
    if (scale.includes(pcOf(m))) count++;
  }
  return m;
}
function nearestPcMidi(pc, ref) {
  let best = null;
  for (let m = ref - 11; m <= ref + 11; m++) {
    if (pcOf(m) === pc && (best === null || Math.abs(m - ref) < Math.abs(best - ref))) best = m;
  }
  return best;
}

/* ============================================================
   物理モデル音源(Karplus-Strong拡張)
   弦:撥弦点コムフィルタ+周波数依存減衰+2弦デチューン
   響板:モード共鳴IR/室内:初期反射+拡散残響IR(畳み込み)
   ============================================================ */
/* 弦の高域減衰。実弦の損失は「時間あたり」で効くが、ループは1周ごとに効くため、
   固定係数だと1周の短い高音弦ばかりが急速に丸くなる。秒あたりの損失が揃うよう周波数で補正する */
const KS_HF_LOSS = 250; // 高域(ナイキスト付近)の目標減衰 dB/s。金属弦(チェンバロ)
const KS_HF_LOSS_GUT = 900; // ガット弦(リュート)は高域が早く失われ、指の腹で弾くぶんさらに丸い
const ksBright = (f, hfLoss) => Math.min(0.95, (1 + Math.pow(10, -hfLoss / (20 * f))) / 2);
function ksString(out, sr, f, t60, len, seed, pluckPos, hfLoss = KS_HF_LOSS) {
  const b = ksBright(f, hfLoss);
  const w = (2 * Math.PI * f) / sr;
  // ループフィルタの位相遅れ(サンプル)を差し引いた残りが弦長
  const lagLP = Math.atan2((1 - b) * Math.sin(w), b + (1 - b) * Math.cos(w)) / w;
  const N = sr / f - lagLP;
  const L = Math.max(4, Math.floor(N) - 1);
  // 端数は全域通過フィルタが受け持つ。線形補間と違い振幅を減らさないので減衰はループフィルタだけで決まる
  const d = N - L; // 1〜2サンプル(係数が安定する範囲)
  const c = -Math.sin(((d - 1) * w) / 2) / Math.sin(((d + 1) * w) / 2); // その周波数で位相遅れが厳密にd
  let rng = seed >>> 0;
  const rand = () => {
    rng = (rng * 1664525 + 1013904223) >>> 0;
    return rng / 2147483648 - 1;
  };
  const dl = new Float32Array(L);
  for (let i = 0; i < L; i++) dl[i] = rand();
  // 撥弦点コム:ナット近くを爪で弾く鼻にかかった倍音構造
  const pp = Math.max(1, Math.round(N * pluckPos));
  for (let i = L - 1; i >= pp; i--) dl[i] -= 0.92 * dl[i - pp];
  // 励起の整形もループの明るさに合わせる(高音弦では鈍らせない)
  for (let i = 1; i < L; i++) dl[i] = b * dl[i] + (1 - b) * dl[i - 1];
  // ループフィルタが基音にも与える損失を打ち消し、指定したT60を実際に鳴らす
  const hMag = Math.sqrt(b * b + (1 - b) * (1 - b) + 2 * b * (1 - b) * Math.cos(w));
  const g = Math.min(0.9999, Math.pow(10, -3 / (t60 * f)) / hMag);
  let idx = 0, prev = 0, apX = 0, apY = 0;
  for (let n = 0; n < len; n++) {
    const s = dl[idx];
    const lo = b * s + (1 - b) * prev; // 高次倍音ほど速く減衰
    prev = s;
    const y = c * lo + apX - c * apY;
    apX = lo;
    apY = y;
    dl[idx] = g * y;
    out[n] += y;
    idx = (idx + 1) % L;
  }
}
function renderNote(ctx, sr, f, midi, inst = "cembalo") {
  const isLute = inst === "lute";
  // 実機同様、低音弦ほど長く鳴る。ガット弦は金属弦より総じて短い
  const t60 = isLute
    ? midi < 46 ? 3.0 : midi < 58 ? 2.4 : midi < 70 ? 1.7 : midi < 80 ? 1.2 : 0.85
    : midi < 46 ? 4.6 : midi < 58 ? 3.6 : midi < 70 ? 2.4 : midi < 80 ? 1.7 : 1.15;
  const dur = Math.min(t60 + 0.4, 5.2);
  const len = Math.floor(sr * dur);
  const out = new Float32Array(len);
  const hf = isLute ? KS_HF_LOSS_GUT : KS_HF_LOSS;
  // 爪はナット寄り、指はより中央寄りを弾く。撥弦点が中央に寄るほど倍音が減って丸くなる
  const pp = isLute ? 0.15 + ((midi * 7) % 10) * 0.006 : 0.055 + ((midi * 7) % 10) * 0.004;
  // リュートは複弦(コース)。同度2本の張りの差はチェンバロの2弦より大きい
  const det = isLute ? [-3.2, 4.1] : [-1.4, 1.8];
  ksString(out, sr, f * Math.pow(2, det[0] / 1200), t60, len, 1234 + midi * 7919, pp, hf);
  ksString(out, sr, f * Math.pow(2, det[1] / 1200), t60 * 0.9, len, 913 + midi * 104729, pp * 1.15, hf);
  if (isLute) {
    // 指の腹が弦を離れる音。爪のクリックより鈍く、長い
    let pr = 0, lo = 0;
    const cl = Math.floor(sr * 0.012);
    for (let i = 0; i < cl; i++) {
      const r = Math.random() * 2 - 1;
      lo += 0.22 * (r - lo);
      out[i] += (lo - pr) * Math.exp(-i / (sr * 0.003)) * 0.35;
      pr = lo;
    }
  } else {
    // 爪(プレクトラム)が弦を離れる瞬間のクリック
    let pr = 0;
    const cl = Math.floor(sr * 0.005);
    for (let i = 0; i < cl; i++) {
      const r = Math.random() * 2 - 1;
      out[i] += (r - pr) * Math.exp(-i / (sr * 0.0009)) * 0.5;
      pr = r;
    }
  }
  let peak = 1e-6;
  for (let i = 0; i < len; i++) { const a = Math.abs(out[i]); if (a > peak) peak = a; }
  const sc = 0.7 / peak;
  for (let i = 0; i < len; i++) out[i] *= sc;
  const buf = ctx.createBuffer(1, len, sr);
  buf.copyToChannel(out, 0);
  return buf;
}
function makeBodyIR(ctx, sr, inst = "cembalo") {
  // 響板と箱の木質共鳴(ダイレクト成分+モード)
  const isLute = inst === "lute";
  const dur = isLute ? 0.11 : 0.14, len = Math.floor(sr * dur);
  const buf = ctx.createBuffer(1, len, sr);
  const d = buf.getChannelData(0);
  d[0] = 1;
  // リュートは丸い胴と響孔(ローズ)による低いヘルムホルツ共鳴が強い
  const modes = isLute
    ? [[118, 0.085], [212, 0.055], [331, 0.032], [486, 0.018], [702, 0.01]]
    : [[168, 0.05], [219, 0.045], [317, 0.035], [451, 0.028], [694, 0.02]];
  modes.forEach(([f, a], mi) => {
    const dec = (isLute ? 0.034 : 0.028) + mi * 0.004;
    for (let i = 0; i < len; i++) {
      const t = i / sr;
      d[i] += a * Math.sin(2 * Math.PI * f * t + mi) * Math.exp(-t / dec);
    }
  });
  let lp = 0;
  for (let i = 1; i < len; i++) {
    const t = i / sr;
    const n = (Math.random() * 2 - 1) * Math.exp(-t / 0.02) * 0.05;
    lp += 0.3 * (n - lp);
    d[i] += lp;
  }
  return buf;
}
function makeRoomIR(ctx, sr, dur = 1.9, preT = 0.013, dampRate = 1.2) {
  // 空間の空気:プリディレイ+初期反射+暗くなっていく拡散残響
  const len = Math.floor(sr * dur);
  const buf = ctx.createBuffer(2, len, sr);
  for (let c = 0; c < 2; c++) {
    const d = buf.getChannelData(c);
    const pre = Math.floor(sr * preT);
    const taps = [[0.019, 0.32], [0.027, 0.26], [0.036, 0.21], [0.048, 0.17], [0.061, 0.13], [0.079, 0.1]];
    taps.forEach(([t, a], i) => {
      const p = pre + Math.floor(sr * t * (c ? 1.06 : 1));
      if (p < len) d[p] += a * ((i + c) % 2 ? 1 : -1);
    });
    let lp = 0;
    for (let i = pre; i < len; i++) {
      const t = (i - pre) / sr;
      const n = (Math.random() * 2 - 1) * Math.exp(-3.1 * t / dur);
      const alpha = 0.55 * Math.exp(-t * dampRate) + 0.06; // 高域から先に空気に吸われる
      lp += alpha * (n - lp);
      d[i] += lp * 0.8;
    }
  }
  return buf;
}

/* ---------- ライプツィヒ期:拡張和声 ---------- */
function chordLit(key, roman, pcsRel, bassRel, f) {
  return { roman, pcs: pcsRel.map((x) => pcOf(x + key.tonic)), bassPc: pcOf(bassRel + key.tonic), f, key: { ...key } };
}
function preDominantChord(k, isMaj, era) {
  if (era === "leipzig") {
    return isMaj
      ? { c: chordLit(k, "viiº7/V", [6, 9, 0, 3], 6, "D"), log: GLOSS.viiV(), tech: "viiº7/V" }
      : { c: chordLit(k, "N6(ナポリ)", [1, 5, 8], 5, "S"), log: GLOSS.napoli(), tech: "ナポリの六" };
  }
  return { c: mk(k, isMaj ? "ii6" : "iio6"), log: null, tech: "終止定型" };
}
function appliedPhrase(k) {
  const ap = (d, label) => chordLit(k, `V7/${label}`, [d + 7, d + 11, d + 2, d + 5], d + 7, "D");
  return [
    { chords: [ap(9, "vi")], techs: ["副属七の連鎖"], log: GLOSS.applied() },
    { chords: [mk(k, "vi")], techs: ["副属七の連鎖"] },
    { chords: [ap(2, "ii")], techs: ["副属七の連鎖"] },
    { chords: [mk(k, "ii")], techs: ["副属七の連鎖"] },
    { chords: [ap(7, "V")], techs: ["副属七の連鎖"] },
    { chords: [mk(k, "V")], techs: ["副属七の連鎖"] },
    { chords: [mk(k, "V7")], techs: ["ドミナント"] },
    { chords: [mk(k, "I")], techs: ["解決"] },
  ];
}
function chromPhrase(k) {
  return [
    { chords: [mk(k, "i"), chordLit(k, "V6", [7, 11, 2], 11, "D")], techs: ["半音階的ラメント・バス"], log: GLOSS.chrom() },
    { chords: [mk(k, "v6"), chordLit(k, "IV6(ドリア)", [5, 9, 0], 9, "S")], techs: ["半音階的ラメント・バス"] },
    { chords: [mk(k, "iv6"), mk(k, "V")], techs: ["フリギア終止"] },
  ];
}

/* 様式ごとの楽器。オルガン / チェンバロ / リュートの3系統 */
const ORGAN_MODES = ["toccata", "chorale", "passacaglia"];
const isOrganMode = (gm) => ORGAN_MODES.includes(gm);
const isLuteMode = (gm) => gm === "bourree";

/* ============================================================
   トッカータとフーガ(ヴァイマル期・オルガン)生成器
   ============================================================ */
/* フーガ主題の自動生成:リズム細胞の連結+山型輪郭 */
function genSubject() {
  const cells = [[2, 1, 1], [1, 1, 2], [2, 2], [1, 1, 1, 1], [3, 1]];
  const durs = [];
  while (durs.reduce((a, b) => a + b, 0) < 16) durs.push(...cells[Math.floor(Math.random() * cells.length)]);
  const n = durs.length;
  const peak = Math.max(2, Math.round(n * 0.55));
  const steps = [0];
  let cur = 0;
  for (let i = 1; i < n; i++) {
    const mv = i < peak ? [1, 1, 2, -1][Math.floor(Math.random() * 4)] : [-1, -1, -2, 1][Math.floor(Math.random() * 4)];
    cur = Math.max(-3, Math.min(6, cur + mv));
    steps.push(cur);
  }
  steps[n - 1] = steps[n - 2] > 1 ? 2 : 0; // 和声音で終止
  return durs.map((d, i) => [steps[i], d]);
}
/* 対唱:8分音符の反行気味の歩み */
function genCounter() {
  const out = [];
  let cur = -3 + Math.floor(Math.random() * 2);
  for (let i = 0; i < 8; i++) {
    out.push([cur, 2]);
    cur = Math.max(-6, Math.min(0, cur + [-1, 1, -1, -2, 1][Math.floor(Math.random() * 5)]));
  }
  return out;
}
/* 主題の頭部動機(指定単位まで) */
function headOf(sub, units) {
  const out = [];
  let acc = 0;
  for (const [s, d] of sub) {
    if (acc + d > units) break;
    out.push([s, d]);
    acc += d;
  }
  return out.length ? out : sub.slice(0, 2);
}
function lineEv(events, pairs, root, scale, startOff, vel, ped, man) {
  let off = startOff;
  pairs.forEach(([s, d]) => {
    if (off < 16) events.push({ off, m: stepFrom(root, s, scale), d: Math.min(d, 16 - off), v: vel, ped, man });
    off += d;
  });
}
/* トッカータ冒頭の頭部動機。第1周は BWV 565 の原型、以後は変奏に切り替わる。
   deg=主音からの音度、fig=[頭部音からの音度, 長さ]。合計は必ず6単位(走句の開始位置を揃えるため) */
const TOC_HEADS = [
  { tech: "モルデント", deg: 4, fig: [[0, 1], [-1, 1], [0, 4]] }, // 原型:5̂-4̂-5̂
  { tech: "プラルトリラー", deg: 4, fig: [[0, 1], [1, 1], [0, 4]] }, // 上方転回:5̂-6̂-5̂
  { tech: "回音(グルペット)", deg: 4, fig: [[0, 1], [1, 1], [0, 1], [-1, 1], [0, 2]] },
  { tech: "オクターヴ上の主音から", deg: 7, fig: [[0, 1], [-1, 1], [0, 4]] }, // 8̂-7̂-8̂
  { tech: "第3音からの開始", deg: 2, fig: [[0, 2], [-1, 1], [0, 1], [1, 1], [0, 1]] },
  { tech: "同音反復の打鍵", deg: 4, fig: [[0, 1], [0, 1], [-1, 1], [0, 3]] },
];
function buildToccataFugue(st) {
  if (st.key.mode === "major") st.key = { tonic: pcOf(st.key.tonic + 9), mode: "minor" }; // 平行短調へ
  st.tocCycle = st.tocCycle || 0;
  // 第1周は本歌取り(原型)、2周目以降は頭部動機を変奏する
  st.tocHead = st.tocCycle === 0 ? 0 : 1 + Math.floor(Math.random() * (TOC_HEADS.length - 1));
  let firstLog = null;
  if (st.tocCycle > 0) {
    st.key = { tonic: pcOf(st.key.tonic + 7), mode: "minor" };
    firstLog = GLOSS.modReturn();
  }
  st.tocCycle++;
  const k = st.key, tn = k.tonic;
  const sH = [0, 2, 3, 5, 7, 8, 11].map((x) => pcOf(x + tn));
  const sN = [0, 2, 3, 5, 7, 8, 10].map((x) => pcOf(x + tn));
  const D = (label, f) => ({ label, f: f || "T", key: { ...k } });
  const ms = [];
  const M = (events, techs, log, label, f) => ms.push({ events, techs: techs || [], log: log || null, disp: D(label, f) });

  // 終止要求:ピカルディの大和音で閉じる
  if (st.endRequested && !st.finalMade) {
    st.finalMade = true;
    const ev = [{ off: 0, m: nearestPcMidi(tn, 26), d: 15, v: 0.95, ped: true }];
    [[0, 50], [7, 55], [0, 62], [4, 66], [7, 69], [0, 74]].forEach(([p, r]) => ev.push({ off: 0, m: nearestPcMidi(pcOf(p + tn), r), d: 15, v: 0.7 }));
    ms.push({ events: ev, techs: ["ピカルディの3度", "終止"], log: GLOSS.picardy(), disp: D("I(ピカルディ)", "T"), finalOrgan: true });
    st.queue.push(...ms);
    return;
  }

  const octT = nearestPcMidi(tn, 74);
  const head = TOC_HEADS[st.tocHead];
  const five = stepFrom(octT, head.deg, sH);
  // 頭部動機を任意の起点音・強さ・鍵盤で並べる
  const headEv = (ev, root, vel, man) => {
    let o = 0;
    head.fig.forEach(([s, d]) => { ev.push({ off: o, m: stepFrom(root, s, sH), d, v: vel, man }); o += d; });
  };
  // T1 冒頭:頭部動機と下行走句
  {
    const ev = [];
    headEv(ev, five, 0.95, 2);
    let r = stepFrom(five, -1, sN);
    const rl = 6 + Math.floor(Math.random() * 3);
    for (let i = 0; i < rl; i++) { ev.push({ off: 6 + i, m: r, d: 1, v: 0.9, man: 2 }); r = stepFrom(r, Math.random() < 0.85 ? -1 : -2, sN); }
    M(ev, [head.tech, "走句(第II鍵盤)"], firstLog || GLOSS.toccata(), "即興句(高声)", "D");
  }
  // T2 オクターヴ下のエコー
  {
    const f2 = stepFrom(five, -7, sH);
    const ev = [];
    headEv(ev, f2, 0.92, undefined);
    let r = stepFrom(f2, -1, sN);
    const rl2 = 6 + Math.floor(Math.random() * 3);
    for (let i = 0; i < rl2; i++) { ev.push({ off: 6 + i, m: r, d: 1, v: 0.88 }); r = stepFrom(r, Math.random() < 0.85 ? -1 : -2, sN); }
    M(ev, ["エコー(鍵盤交替・第I鍵盤)"], st.tocHead ? GLOSS.tocVar() : null, "即興句(低声)", "D");
  }
  // T3 減七の上行分散+ペダル
  {
    const ev = [{ off: 0, m: nearestPcMidi(tn, 38), d: 16, v: 0.95, ped: true }];
    const d0 = nearestPcMidi(pcOf(tn + 11), 52);
    for (let i = 0; i < 12; i++) ev.push({ off: i, m: d0 + 3 * i, d: 1, v: 0.85 });
    ev.push({ off: 12, m: d0 + 36, d: 4, v: 0.9 });
    M(ev, ["減七の分散和音", "オルゲルプンクト"], null, "viiº7", "D");
  }
  // T4 属七の大和音(フェルマータ)
  {
    const ev = [{ off: 0, m: nearestPcMidi(pcOf(tn + 7), 40), d: 16, v: 0.95, ped: true }];
    [[7, 58], [11, 63], [2, 66], [5, 70], [7, 74]].forEach(([p, r]) => ev.push({ off: 0, m: nearestPcMidi(pcOf(p + tn), r), d: 16, v: 0.68 }));
    M(ev, ["フェルマータ"], null, "V7", "D");
  }
  // T5 解決
  {
    const ev = [{ off: 0, m: nearestPcMidi(tn, 38), d: 16, v: 0.95, ped: true }];
    [[0, 58], [3, 63], [7, 67], [0, 72]].forEach(([p, r]) => ev.push({ off: 0, m: nearestPcMidi(pcOf(p + tn), r), d: 16, v: 0.68 }));
    M(ev, ["解決"], null, "i", "T");
  }
  // T6-7 逆オルゲルプンクト音型
  const topT = nearestPcMidi(tn, 81);
  [[[0, 3, 7], [5, 8, 0]], [[7, 11, 2], [0, 3, 7]]].forEach((pair, mi) => {
    const ev = [{ off: 0, m: nearestPcMidi(tn, 33), d: 16, v: 0.85, ped: true }];
    pair.forEach((pcsRel, hi) => {
      const bots = pcsRel.map((p, i) => nearestPcMidi(pcOf(p + tn), [60, 64, 67][i]));
      [topT, bots[0], topT, bots[1], topT, bots[2], topT, bots[1]].forEach((n, i) => ev.push({ off: hi * 8 + i, m: n, d: 1, v: 0.72 }));
    });
    M(ev, ["逆オルゲルプンクト(上声保続)"], mi === 0 ? GLOSS.pedal() : null, mi === 0 ? "i – iv6" : "V7 – i", "D");
  });
  // T8 下行ゼクエンツ走句
  {
    const ev = [{ off: 0, m: nearestPcMidi(tn, 33), d: 16, v: 0.8, ped: true }];
    for (let c = 0; c < 4; c++) for (let i = 0; i < 4; i++) ev.push({ off: c * 4 + i, m: stepFrom(octT, 7 - 2 * c - i, sN), d: 1, v: 0.85 });
    M(ev, ["ゼクエンツ"], null, "走句", "D");
  }
  // T9 フリギア終止
  {
    const ev = [{ off: 0, m: nearestPcMidi(pcOf(tn + 8), 40), d: 8, v: 0.9, ped: true }];
    [[5, 60], [8, 65], [0, 69]].forEach(([p, r]) => ev.push({ off: 0, m: nearestPcMidi(pcOf(p + tn), r), d: 8, v: 0.7 }));
    ev.push({ off: 8, m: nearestPcMidi(pcOf(tn + 7), 40), d: 8, v: 0.95, ped: true });
    [[7, 59], [11, 64], [2, 67], [7, 71]].forEach(([p, r]) => ev.push({ off: 8, m: nearestPcMidi(pcOf(p + tn), r), d: 8, v: 0.7 }));
    M(ev, ["フリギア終止(半終止)"], GLOSS.lament(), "iv6 – V", "D");
  }
  // ---- フーガ ----
  const sS = nearestPcMidi(tn, 76), aA = nearestPcMidi(tn, 67), bB = nearestPcMidi(tn, 45);
  const dom = pcOf(tn + 7);
  // この演奏・この周回のためだけの主題と対唱を生成
  const SUBJ = genSubject();
  const CSUB = genCounter();
  const HEADF = headOf(SUBJ, 6);
  // F1 主唱
  { const ev = []; lineEv(ev, SUBJ, sS, sH, 0, 0.85); M(ev, ["主題(ズビェクト)"], GLOSS.dux(), "フーガ:主唱", "T"); }
  // F2 答唱+対唱
  { const ev = []; lineEv(ev, SUBJ, nearestPcMidi(dom, aA), sH, 0, 0.82); lineEv(ev, CSUB, sS, sN, 0, 0.76, false, 2); M(ev, ["属調の応答", "対唱"], GLOSS.comes(), "答唱(V)", "D"); }
  // F3 嬉遊部
  {
    const ev = [];
    lineEv(ev, HEADF, sS, sN, 0, 0.82);
    lineEv(ev, HEADF, stepFrom(sS, -1, sN), sN, 6, 0.82);
    [[0, 4], [-2, 4], [-3, 4], [-4, 4]].forEach(([s, d], i) => ev.push({ off: i * 4, m: stepFrom(aA, s, sN), d, v: 0.7 }));
    for (let i = 0; i < 4; i++) ev.push({ off: 12 + i, m: stepFrom(sS, -2 - i, sN), d: 1, v: 0.8 });
    M(ev, ["頭部動機のゼクエンツ"], GLOSS.episode(), "嬉遊部", "S");
  }
  // F4 ペダルに主題
  {
    const ev = [];
    lineEv(ev, SUBJ, bB, sH, 0, 0.9, true);
    lineEv(ev, CSUB, stepFrom(sS, 2, sN), sN, 0, 0.74, false, 2);
    [[0, 8], [-2, 8]].forEach(([s, d], i) => ev.push({ off: i * 8, m: stepFrom(aA, s, sN), d, v: 0.66 }));
    M(ev, ["ペダル(足鍵盤)の主題"], null, "主唱(バス)", "T");
  }
  // F5-6 五度圏の嬉遊部
  [[5, 10], [3, 8]].forEach((roots, mi) => {
    const ev = [
      { off: 0, m: nearestPcMidi(pcOf(tn + roots[0]), 36), d: 8, v: 0.85, ped: true },
      { off: 8, m: nearestPcMidi(pcOf(tn + roots[1]), 36), d: 8, v: 0.85, ped: true },
    ];
    roots.forEach((rp, hi) => lineEv(ev, HEADF, nearestPcMidi(pcOf(tn + rp), aA), sN, hi * 8, 0.78));
    for (let i = 0; i < 8; i++) ev.push({ off: i * 2, m: stepFrom(stepFrom(sS, 3 - mi, sN), -i, sN), d: 2, v: 0.7 });
    M(ev, ["五度圏ゼクエンツ"], mi === 0 ? GLOSS.circle() : null, mi === 0 ? "iv – VII" : "III – VI", "S");
  });
  // F7 平行長調での主題
  {
    const k3 = { tonic: pcOf(tn + 3), mode: "major" };
    const s3 = [0, 2, 4, 5, 7, 9, 11].map((x) => pcOf(x + k3.tonic));
    const ev = [
      { off: 0, m: nearestPcMidi(k3.tonic, 36), d: 8, v: 0.85, ped: true },
      { off: 8, m: nearestPcMidi(pcOf(k3.tonic + 7), 36), d: 8, v: 0.85, ped: true },
    ];
    lineEv(ev, SUBJ, nearestPcMidi(k3.tonic, aA + 3), s3, 0, 0.85);
    lineEv(ev, CSUB, nearestPcMidi(k3.tonic, sS), s3, 0, 0.74, false, 2);
    ms.push({ events: ev, techs: ["平行長調の主題"], log: GLOSS.middleEntry(), disp: { label: "主題(III度調)", f: "T", key: k3 } });
  }
  // F8 帰路の嬉遊部
  {
    const ev = [];
    lineEv(ev, HEADF, stepFrom(sS, 1, sN), sN, 0, 0.8);
    lineEv(ev, HEADF, sS, sN, 6, 0.8);
    for (let i = 0; i < 4; i++) ev.push({ off: 12 + i, m: stepFrom(sS, -1 - i, sN), d: 1, v: 0.8 });
    [[2, 8], [1, 8]].forEach(([s, d], i) => ev.push({ off: i * 8, m: stepFrom(aA, s, sN), d, v: 0.66 }));
    M(ev, ["嬉遊部"], null, "嬉遊部", "S");
  }
  // F9 ストレッタ+属音保続
  {
    const ev = [{ off: 0, m: nearestPcMidi(dom, 31), d: 16, v: 0.92, ped: true }];
    lineEv(ev, SUBJ, sS, sH, 0, 0.85);
    lineEv(ev, SUBJ.slice(0, 6), nearestPcMidi(tn, aA), sH, 8, 0.85);
    M(ev, ["ストレッタ", "オルゲルプンクト"], GLOSS.stretto(), "ストレッタ/V保続", "D");
  }
  // F10 終止トリル
  {
    const ev = [{ off: 0, m: nearestPcMidi(dom, 31), d: 16, v: 0.92, ped: true }];
    const tt = nearestPcMidi(pcOf(tn + 11), 78);
    const u = stepFrom(tt, 1, sH), l = stepFrom(tt, -1, sH);
    for (let i = 0; i < 14; i++) ev.push({ off: i, m: i % 2 === 0 ? u : tt, d: 1, v: 0.85, man: 2 });
    ev.push({ off: 14, m: l, d: 1, v: 0.85, man: 2 }, { off: 15, m: tt, d: 1, v: 0.85, man: 2 });
    [[0, 3, 7], [7, 11, 2]].forEach((pcsRel, hi) => pcsRel.forEach((p, i) => ev.push({ off: hi * 8, m: nearestPcMidi(pcOf(p + tn), [62, 66, 69][i]), d: 8, v: 0.64 })));
    M(ev, ["カデンツ・トリル", "掛留"], GLOSS.trill(), "i64 – V7", "D");
  }
  // F11 ピカルディの大和音(鳴り止まず、次の調へ)
  {
    const ev = [{ off: 0, m: nearestPcMidi(tn, 26), d: 16, v: 0.95, ped: true }];
    [[0, 50], [7, 55], [0, 62], [4, 66], [7, 69], [0, 74]].forEach(([p, r]) => ev.push({ off: 0, m: nearestPcMidi(pcOf(p + tn), r), d: 14, v: 0.7 }));
    M(ev, ["ピカルディの3度"], GLOSS.picardy(), "I(ピカルディ)", "T");
  }
  // F12 ゲネラルパウゼ
  M([], ["ゲネラルパウゼ(全休止)"], null, "—", "T");

  st.queue.push(...ms);
}

/* ---------- オルガン様式:共通終止 ---------- */
function pushOrganFinal(st) {
  const tn = st.key.tonic;
  const wasMinor = st.key.mode === "minor";
  const ev = [{ off: 0, m: nearestPcMidi(tn, 26), d: 15, v: 0.95, ped: true }];
  [[0, 50], [7, 55], [0, 62], [4, 66], [7, 69], [0, 74]].forEach(([p, r]) => ev.push({ off: 0, m: nearestPcMidi(pcOf(p + tn), r), d: 15, v: 0.7 }));
  st.queue.push({
    events: ev,
    techs: wasMinor ? ["ピカルディの3度", "終止"] : ["終止"],
    log: wasMinor ? GLOSS.picardy() : GLOSS.final(),
    disp: { label: wasMinor ? "I(ピカルディ)" : "I", f: "T", key: { ...st.key } },
    finalOrgan: true,
  });
}

/* ============================================================
   コラール前奏曲(オルゲルビュヒライン様式)生成器
   ============================================================ */
function buildChorale(st) {
  if (st.endRequested && !st.finalMade) { st.finalMade = true; pushOrganFinal(st); return; }
  st.chCycle = st.chCycle || 0;
  const firstLog = st.chCycle === 0 ? GLOSS.chorale() : GLOSS.modReturn();
  if (st.chCycle > 0) st.key = { tonic: pcOf(st.key.tonic + 7), mode: st.key.mode };
  st.chCycle++;
  const kk = st.key;
  const isMaj = kk.mode === "major";
  const romansA = isMaj ? [["I", "V6"], ["vi", "iii6"], ["ii6", "V"]] : [["i", "V6"], ["VI", "iv6"], ["iio6", "V"]];
  const romansB = isMaj ? [["IV", "I6"], ["ii6", "I64"], ["V7", "I"]] : [["iv", "i6"], ["iio6", "i64"], ["V7", "i"]];
  // 周回ごとに内声の統一動機を選び直す
  const MOTIVES = [[0, 1, 0, -1], [0, -1, -2, 0], [0, 1, -1, 0], [0, 2, 1, 0]];
  const motive = MOTIVES[Math.floor(Math.random() * MOTIVES.length)];
  const mkPhrase = (set, endTech, log) => {
    const chords = [];
    set.forEach((pair) => pair.forEach((rm) => chords.push(mk(kk, rm))));
    // 第1パス:各和音の強拍音を確率的に選ぶ=呼ぶたびに異なる定旋律が生まれる
    let prev = nearestPcMidi(kk.tonic, 74);
    let dir = Math.random() < 0.5 ? 1 : -1;
    const strongs = chords.map((ch) => {
      if (prev > 80) dir = -1;
      else if (prev < 67) dir = 1;
      else if (Math.random() < 0.25) dir *= -1;
      let best = prev, bs = 1e9;
      ch.pcs.forEach((pc) => {
        const base = nearestPcMidi(pc, prev);
        [base, base + 12, base - 12].forEach((c) => {
          if (c < 65 || c > 83) return;
          const s = Math.abs(c - prev) - 0.7 * Math.sign(c - prev || 1) * dir + (c === prev ? 2 : 0) + Math.random() * 1.4;
          if (s < bs) { bs = s; best = c; }
        });
      });
      prev = best;
      return best;
    });
    let prevPed = nearestPcMidi(kk.tonic, 40);
    return set.map((pair, mi) => {
      const ev = [];
      const isLastM = mi === set.length - 1;
      pair.forEach((rm, hi) => {
        const ci = mi * 2 + hi;
        const ch = chords[ci];
        const sc = scaleOf(ch);
        const held = isLastM && hi === 1; // フェルマータ
        // 定旋律:保持/経過音/回音を確率で選び、次の強拍音へ向かって歌う
        const from = strongs[ci];
        const to = strongs[ci + 1] ?? nearestPcMidi(kk.tonic, from);
        if (held) ev.push({ off: 8, m: from, d: 8, v: 0.92, man: 2 });
        else {
          const r = Math.random();
          let pat, cell;
          if (r < 0.35) { pat = [8]; cell = [from]; }
          else if (r < 0.72) { pat = [4, 4]; cell = melodicCell(from, to, 2, sc); }
          else { pat = [4, 2, 2]; cell = melodicCell(from, to, 3, sc); }
          let acc = 0;
          cell.forEach((n, i2) => { ev.push({ off: hi * 8 + acc, m: n, d: pat[i2], v: 0.92, man: 2 }); acc += pat[i2]; });
        }
        // 足鍵盤:歩行
        const root = nearestPcMidi(ch.bassPc, prevPed);
        prevPed = root;
        if (held) ev.push({ off: 8, m: root, d: 8, v: 0.9, ped: true });
        else {
          ev.push({ off: hi * 8, m: root, d: 4, v: 0.85, ped: true });
          ev.push({ off: hi * 8 + 4, m: stepFrom(root, 2, sc), d: 4, v: 0.8, ped: true });
        }
        // 内声:統一動機(アルト)+保続(テノール)
        const third = nearestPcMidi(ch.pcs[1], 62);
        const ten = nearestPcMidi(ch.pcs[2] ?? ch.pcs[0], 57);
        if (held) {
          ev.push({ off: 8, m: third, d: 8, v: 0.58 });
          ev.push({ off: 8, m: ten, d: 8, v: 0.52 });
        } else {
          motive.forEach((s2, i2) => ev.push({ off: hi * 8 + i2 * 2, m: stepFrom(third, s2, sc), d: 2, v: 0.58 }));
          ev.push({ off: hi * 8, m: ten, d: 8, v: 0.48 });
        }
      });
      return {
        events: ev,
        techs: isLastM ? [endTech, "フェルマータ"] : ["定旋律(カントゥス・フィルムス)", "動機の統一"],
        log: mi === 0 ? log : null,
        disp: { label: pair.join(" – "), f: isLastM ? "D" : "T", key: { ...kk } },
      };
    });
  };
  st.queue.push(
    ...mkPhrase(romansA, "シュトレン(半終止)", firstLog),
    ...mkPhrase(romansA, "シュトレン変奏反復", isJa() ? {
      title: "シュトレン変奏反復(パルティータ風)",
      body: "バール形式のA節を、同じ和声骨格の上でまったく新しい装飾の定旋律として歌い直します。コラール・パルティータの流儀です。",
    } : {
      title: "Stollen, varied repeat (partita manner)",
      body: "The A phrase of the Bar form is sung again over the same harmonic skeleton, with an entirely new ornamented melody — the way of the chorale partita.",
    }),
    ...mkPhrase(romansB, "アプゲザング(全終止)", null)
  );
}

/* ============================================================
   パッサカリア(オスティナート変奏)生成器 — 1呼び出し=1変奏(4小節)
   ============================================================ */
function buildPassacaglia(st) {
  if (st.endRequested && !st.finalMade) { st.finalMade = true; pushOrganFinal(st); return; }
  if (st.key.mode === "major") st.key = { tonic: pcOf(st.key.tonic + 9), mode: "minor" };
  const tn = st.key.tonic;
  const sH = [0, 2, 3, 5, 7, 8, 11].map((x) => pcOf(x + tn));
  st.pasVar = st.pasVar ?? -1;
  st.pasVar++;
  const g0 = nearestPcMidi(tn, 41);
  const ground = [0, -1, -2, -3, -4, -5, -6, -3].map((s) => stepFrom(g0, s, sH)); // 1̂-7̂-♭6̂-5̂-4̂-♭3̂-2̂-5̂
  const H = [[0, 3, 7], [7, 11, 2], [5, 8, 0], [7, 11, 2], [5, 8, 0], [3, 7, 10], [2, 5, 8], [7, 11, 2, 5]];
  const NAMES = ["主題提示(グラウンド・バス)", "和声付け", "八分音符の変奏", "十六分音符の走句", "掛留(シンコペーション)", "主題の上声移行", "トゥッティ"];
  const NAMES_EN = ["Ground bass statement", "Harmonization", "Eighth-note variation", "Sixteenth-note runs", "Syncopated suspensions", "Theme in the soprano", "Tutti"];
  let type;
  if (st.pasVar === 0) type = 0;
  else if (st.pasVar === 1) type = 1;
  else { do { type = 2 + Math.floor(Math.random() * 5); } while (type === st.pasLast); }
  st.pasLast = type;
  const log =
    st.pasVar === 0 ? GLOSS.passacaglia()
    : type === 5 ? GLOSS.ostTop()
    : isJa()
      ? { title: `第${st.pasVar}変奏:${NAMES[type]}`, body: "同一の低音主題の上で、音型・声部数・密度を変えながら建築的に積み上げていきます。" }
      : { title: `Variation ${st.pasVar}: ${NAMES_EN[type]}`, body: "Over the same ground bass, figuration, voice count and density are rebuilt, variation upon variation." };
  const ms = [];
  for (let m = 0; m < 4; m++) {
    const ev = [];
    for (let h = 0; h < 2; h++) {
      const gi = m * 2 + h;
      const gNote = ground[gi];
      const pcs = H[gi].map((x) => pcOf(x + tn));
      const voiced = pcs.map((p, i) => nearestPcMidi(p, [63, 67, 71, 74][i] ?? 74));
      if (type === 5) {
        ev.push({ off: h * 8, m: gNote + 24, d: 8, v: 0.92, man: 2 }); // 主題を最上声へ、足鍵盤は沈黙
        pcs.slice(0, 3).forEach((p, i) => ev.push({ off: h * 8, m: nearestPcMidi(p, [52, 56, 59][i]), d: 8, v: 0.55 }));
      } else {
        ev.push({ off: h * 8, m: gNote, d: 8, v: 0.9, ped: true });
      }
      if (type === 1 || type === 6) voiced.slice(0, 3).forEach((n) => ev.push({ off: h * 8, m: n, d: 8, v: 0.55 }));
      if (type === 2) {
        const p2 = [[0, 1, 2, 1], [2, 1, 0, 1], [0, 2, 1, 2], [1, 2, 1, 0]][Math.floor(Math.random() * 4)];
        p2.forEach((ix, i) => ev.push({ off: h * 8 + i * 2, m: voiced[ix % voiced.length], d: 2, v: 0.72 }));
      }
      if (type === 3 || type === 6) {
        const dir = (gi + (Math.random() < 0.3 ? 1 : 0)) % 2 ? 1 : -1;
        let r = voiced[2];
        for (let i = 0; i < 8; i++) { ev.push({ off: h * 8 + i, m: r, d: 1, v: 0.78 }); r = stepFrom(r, dir, sH); }
      }
      if (type === 4) {
        ev.push({ off: h * 8, m: voiced[2], d: 8, v: 0.68 });
        ev.push({ off: h * 8 + 2, m: voiced[1], d: 6, v: 0.6 }); // 遅れて入る=掛留の摩擦
      }
    }
    ms.push({
      events: ev,
      techs: [NAMES[type], "オスティナート"],
      log: m === 0 ? log : null,
      disp: { label: `${isJa() ? "変奏" : "Var. "}${st.pasVar} (${m + 1}/4)`, f: "T", key: { ...st.key } },
    });
  }
  st.queue.push(...ms);
}

/* ============================================================
   リュート組曲のブーレ生成器 — BWV 996(ホ短調)の楽想を種とする
   2/2・弱起・二部形式(AABB)。旋律と低音を10度平行で動かし、その間に
   開放弦の保続音を挟む書法。マッカートニーがBlackbirdの序奏に持ち込んだのはこの手触り
   ============================================================ */
/* ブーレのリズム細胞(16分単位・合計8=2分音符ひとつ分) */
const BOU_CELLS = [
  [4, 4], [4, 2, 2], [2, 2, 4], [2, 2, 2, 2], [6, 2], [4, 4],
];
/* 各段の和音根音を音階度で。A段は平行長調(III)へ、B段は主調へ帰る */
const BOU_A = [0, 3, 4, 0, 2, 5, 6, 2];
const BOU_B = [2, 6, 2, 5, 0, 3, 4, 0, 3, 4, 4, 0];
function buildBourree(st) {
  if (st.key.mode === "major") st.key = { tonic: pcOf(st.key.tonic + 9), mode: "minor" };
  st.bouSec = st.bouSec || 0; // 0:A 1:A' 2:B 3:B'
  const k = st.key, tn = k.tonic;
  const sH = [0, 2, 3, 5, 7, 8, 11].map((x) => pcOf(x + tn)); // 和声的短音階
  const sN = [0, 2, 3, 5, 7, 8, 10].map((x) => pcOf(x + tn));
  const ms = [];
  const M = (events, techs, log, label, f) =>
    ms.push({ events, techs: techs || [], log: log || null, disp: { label, f: f || "T", key: { ...k } } });

  if (st.endRequested && !st.finalMade) {
    st.finalMade = true;
    const ev = [{ off: 0, m: nearestPcMidi(tn, 40), d: 16, v: 0.95 }];
    [[7, 52], [0, 59], [4, 64], [7, 67], [0, 72]].forEach(([p, r]) =>
      ev.push({ off: 0, m: nearestPcMidi(pcOf(p + tn), r), d: 16, v: 0.72 })
    );
    ms.push({ events: ev, techs: ["ピカルディの3度", "終止"], log: GLOSS.picardy(), disp: { label: "I(ピカルディ)", f: "T", key: { ...k } }, finalOrgan: true });
    st.queue.push(...ms);
    return;
  }

  const sec = st.bouSec % 4;
  const plan = sec < 2 ? BOU_A : BOU_B;
  const isRepeat = sec === 1 || sec === 3; // 反復はドゥーブル(装飾変奏)で返す
  const scale = sN;
  const topRef = 76, bassRef = 45;
  // 開放弦の保続音(ホ短調なら第5音=ロ)。旋律と低音の間で鳴り続ける
  const pedal = nearestPcMidi(pcOf(tn + 7), 64);
  // リュートの歌う音域。はみ出したらオクターヴで折り返す(音階の所属は変わらない)
  const loM = 62, hiM = 81;
  const fit = (m) => { while (m > hiM) m -= 12; while (m < loM) m += 12; return m; };
  let prevTop = null;

  // 弱起:段のはじめに4単位の上拍を置く
  if (sec === 0 || sec === 2) {
    const up = fit(stepFrom(nearestPcMidi(tn, topRef), sec === 0 ? 4 : 2, scale));
    prevTop = up;
    M(
      [{ off: 12, m: up, d: 4, v: 0.82 }],
      ["弱起(アウフタクト)"],
      st.bouSec === 0 ? GLOSS.bourree() : null,
      sec === 0 ? "(上拍)" : "(上拍・後半)",
      "D"
    );
  }

  plan.forEach((deg, bi) => {
    const ev = [];
    const isLast = bi === plan.length - 1;
    // 属和音だけ和声的短音階(導音を上げてVを長三和音に)。III・VI・VIIは自然短音階のまま
    const chS = deg === 4 ? sH : sN;
    const bassRoot = stepFrom(nearestPcMidi(tn, bassRef), deg, chS);
    const triad = [0, 2, 4].map((s) => stepFrom(bassRoot, s, chS)); // 当該和音の構成音
    const techs = [];
    const tenths = bi % 4 === 2 && !isLast; // 10度平行で降りる小節

    // --- 低音
    const bassLine = [];
    if (isLast) {
      bassLine.push([0, bassRoot, 16]);
    } else if (tenths) {
      let b = bassRoot;
      for (let q = 0; q < 4; q++) { bassLine.push([q * 4, b, 4]); b = stepFrom(b, -1, sN); }
    } else {
      // 次の根音へ順次で橋渡し(歩く低音)
      const nextRoot = stepFrom(nearestPcMidi(tn, bassRef), plan[(bi + 1) % plan.length], sN);
      const mid = stepFrom(bassRoot, nextRoot > bassRoot ? 1 : -1, sN);
      bassLine.push([0, bassRoot, 8], [8, mid, 8]);
    }
    bassLine.forEach(([o, m, d], i) => ev.push({ off: o, m, d, v: i ? 0.78 : 0.86 }));

    // --- 旋律
    let cur = prevTop == null ? fit(nearestPcMidi(pcOf(triad[2]), topRef)) : prevTop;
    if (tenths) {
      // 低音の各音の10度上(オクターヴ+3度=音階で9度)を保って並行下行
      // 折り返しは4音まとめて決める。同じオクターヴ差で降ろさないと平行が崩れる
      const raw = bassLine.map(([, bm]) => stepFrom(bm, 9, sN));
      let shift = 0;
      while (Math.min(...raw) + shift < loM) shift += 12;
      while (Math.max(...raw) + shift > hiM) shift -= 12;
      bassLine.forEach(([o], i) => {
        const m = raw[i] + shift;
        ev.push({ off: o, m, d: 4, v: 0.84 });
        cur = m;
      });
    } else {
      let off = 0;
      let dir = Math.random() < 0.5 ? 1 : -1;
      for (let h = 0; h < 2; h++) {
        const cell = BOU_CELLS[Math.floor(Math.random() * BOU_CELLS.length)];
        cell.forEach((d, ci) => {
          let m;
          if (ci === 0) {
            // 拍頭は和声音。いまの位置から近いものを、動きのあるほうへ選ぶ
            const cand = triad
              .map((t) => nearestPcMidi(pcOf(t), cur))
              .filter((x) => x !== cur && Math.abs(x - cur) <= 7);
            m = cand.length ? cand[Math.floor(Math.random() * cand.length)] : stepFrom(cur, dir, chS);
          } else {
            // 経過音・刺繍音。音階はその小節の和音に従う(III・VIの小節に導音を混ぜない)
            const step = Math.random() < 0.78 ? 1 : 2;
            m = stepFrom(cur, dir * step, chS);
          }
          if (m > hiM) dir = -1;
          if (m < loM) dir = 1;
          m = fit(m);
          if (Math.random() < 0.22) dir = -dir;
          // 段の締めくくりは和声音に置く
          if (isLast && off + d >= 16) m = fit(nearestPcMidi(pcOf(triad[Math.random() < 0.6 ? 0 : 2]), cur));
          // ドゥーブル:反復時は4分音符を8分に割って装飾する
          if (isRepeat && d >= 4 && Math.random() < 0.6) {
            const orn = fit(stepFrom(m, 1, chS));
            ev.push({ off, m, d: d / 2, v: 0.8 });
            ev.push({ off: off + d / 2, m: orn, d: d / 2, v: 0.72 });
          } else {
            ev.push({ off, m, d, v: 0.84 });
          }
          cur = m;
          off += d;
        });
      }
    }
    prevTop = cur;

    // --- 保続音:開放弦を8分の裏で打つ(A段の前半とB段の終盤)
    const usePedal = (sec < 2 && bi < 4) || (sec >= 2 && bi >= plan.length - 4);
    if (usePedal) {
      for (let i = 1; i < 8; i += 2) ev.push({ off: i * 2, m: pedal, d: 2, v: 0.5 });
      techs.push("保続音(開放弦)");
    }
    if (tenths) techs.push("10度平行");
    if (isRepeat) techs.push("ドゥーブル(装飾反復)");
    if (isLast) techs.push(sec < 2 ? "平行長調へ" : "主調で終止");

    const F = deg === 0 || deg === 5 ? "T" : deg === 4 || deg === 6 ? "D" : "S";
    const ROM = ["i", "ii°", "III", "iv", "V", "VI", "VII"];
    M(ev, techs, bi === 0 && sec === 2 && st.bouSec === 2 ? GLOSS.bourreeB() : null, ROM[deg], F);
  });

  st.bouSec++;
  // AABB を終えたら調をめぐって続ける
  if (st.bouSec % 4 === 0) {
    st.key = { tonic: pcOf(tn + (Math.random() < 0.5 ? 7 : 5)), mode: "minor" };
    if (ms.length) ms[ms.length - 1].log2 = GLOSS.modReturn();
  }
  st.queue.push(...ms);
}

/* ============================================================
   MIDI書き出し(SMF format 1)/録画フレーム描画/ダウンロード
   ============================================================ */
function exportMidi(events) {
  const PPQ = 480;
  const spt = 0.5 / PPQ; // 120bpm相当:実演奏の秒をそのままティックへ(リタルダンドも保存される)
  const toTicks = (s) => Math.max(0, Math.round(s / spt));
  const byCh = [[], [], []];
  events.forEach((e) => {
    const ch = Math.min(2, Math.max(0, e.ch));
    const v = Math.min(127, Math.max(1, Math.round(e.v * 110)));
    const m = Math.min(127, Math.max(0, Math.round(e.m)));
    byCh[ch].push({ tick: toTicks(e.t), on: 1, m, v });
    byCh[ch].push({ tick: toTicks(e.t + e.d), on: 0, m, v: 0 });
  });
  const vlq = (n) => { const b = [n & 0x7f]; n >>= 7; while (n > 0) { b.unshift((n & 0x7f) | 0x80); n >>= 7; } return b; };
  const chunks = [];
  chunks.push([0, 0xff, 0x51, 3, 0x07, 0xa1, 0x20, 0, 0xff, 0x58, 4, 4, 2, 24, 8, 0, 0xff, 0x2f, 0]);
  const progs = [6, 19, 19]; // チェンバロ/教会オルガン(手鍵盤)/同(足鍵盤)
  byCh.forEach((evs, ch) => {
    if (!evs.length) return;
    evs.sort((a, b) => a.tick - b.tick || a.on - b.on);
    const data = [0, 0xc0 | ch, progs[ch]];
    let last = 0;
    evs.forEach((e) => {
      data.push(...vlq(e.tick - last), (e.on ? 0x90 : 0x80) | ch, e.m, e.on ? e.v : 0);
      last = e.tick;
    });
    data.push(0, 0xff, 0x2f, 0);
    chunks.push(data);
  });
  const out = [];
  const str = (s) => { for (const c of s) out.push(c.charCodeAt(0)); };
  const u32 = (n) => out.push((n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255);
  const u16 = (n) => out.push((n >>> 8) & 255, n & 255);
  str("MThd"); u32(6); u16(1); u16(chunks.length); u16(PPQ);
  chunks.forEach((d) => { str("MTrk"); u32(d.length); for (const b of d) out.push(b); });
  return new Uint8Array(out);
}
function dlBlob(blob, name) {
  const u = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = u;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(u); a.remove(); }, 500);
}
function drawRecFrame(cv, an, act, log, organ) {
  const g = cv.getContext("2d");
  g.fillStyle = "#14100b";
  g.fillRect(0, 0, 1280, 720);
  g.textAlign = "center";
  g.fillStyle = "#8a744d";
  g.font = "20px Georgia, serif";
  g.fillText(isJa() ? "BACH PERPETUUM MOBILE — 無限バッハ機関" : "BACH PERPETUUM MOBILE", 640, 46);
  if (an) {
    g.fillStyle = "#e9dcc0";
    g.font = "italic 46px Georgia, serif";
    g.fillText(an.romans, 640, 118);
    g.fillStyle = "#c8a24a";
    g.font = "24px Georgia, serif";
    g.fillText(`${barStr(an.no)} · ${an.keyN}`, 640, 158);
    g.fillStyle = "#cdb98a";
    g.font = "20px Georgia, serif";
    g.fillText((an.techs || []).map(tr).join(" / "), 640, 192);
  }
  // 詳細解説(直近の楽典実況)
  if (log) {
    g.textAlign = "left";
    g.fillStyle = "#c8a24a";
    g.font = "26px Georgia, serif";
    g.fillText(`◆ ${log.title}`, 90, 244);
    g.fillStyle = "#cbbd9c";
    g.font = "21px Georgia, serif";
    const maxW = 1100;
    const lines = [];
    let cur = "";
    for (const ch of log.body || "") {
      if (g.measureText(cur + ch).width > maxW) { lines.push(cur); cur = ch; } else cur += ch;
      if (lines.length >= 3) break;
    }
    if (cur && lines.length < 3) lines.push(cur);
    if (lines.length === 3 && g.measureText(lines[2]).width > maxW - 30) lines[2] = lines[2] + "…";
    lines.forEach((ln, i) => g.fillText(ln, 90, 282 + i * 32));
    g.textAlign = "center";
  }
  const wPcs = [0, 2, 4, 5, 7, 9, 11];
  const items = (act || []).map((a) => (typeof a === "number" ? { m: a, man: 1 } : a));
  const isOrg = !!organ;
  const setFor = (man) => new Set(items.filter((i) => (i.man ?? 1) === man).map((i) => i.m));
  const drawManual = (x0, y0, ww, h, actSet, lightNat) => {
    let x = x0;
    const blacks = [];
    for (let m = 36; m <= 96; m++) {
      if (wPcs.includes(pcOf(m))) {
        g.fillStyle = actSet.has(m) ? "#c8a24a" : lightNat ? "#e6dcc4" : "#2a2016";
        g.fillRect(x, y0, ww - 1.5, h);
        g.strokeStyle = "#4a3826";
        g.strokeRect(x, y0, ww - 1.5, h);
        x += ww;
      } else blacks.push([x - ww * 0.32, m]);
    }
    blacks.forEach(([bx, m]) => {
      g.fillStyle = actSet.has(m) ? "#e0b854" : lightNat ? "#241a12" : "#d9cdb0";
      g.fillRect(bx, y0, ww * 0.62, h * 0.6);
    });
  };
  if (isOrg) {
    const ww = 1140 / 36;
    g.textAlign = "left";
    g.fillStyle = "#8a744d";
    g.font = "17px Georgia, serif";
    g.fillText("II", 28, 428);
    drawManual(76, 404, ww, 74, setFor(2), true);
    g.fillText("I", 28, 520);
    drawManual(60, 494, ww, 74, setFor(1), true);
    g.fillText("Ped", 12, 630);
    const sp = setFor(0);
    const n = 32, pw = 1140 / n;
    for (let i = 0; i < n; i++) {
      const m = 24 + i, sharp = !wPcs.includes(pcOf(m));
      g.fillStyle = sp.has(m) ? "#c8a24a" : sharp ? "#241a12" : "#7a6647";
      g.fillRect(60 + i * pw, sharp ? 588 : 596, pw - 2, sharp ? 40 : 64);
    }
    g.textAlign = "center";
  } else {
    const ww = 1180 / 36;
    drawManual(50, 420, ww, 220, new Set(items.map((i) => i.m)), false);
  }
  g.fillStyle = "#6b573a";
  g.font = "17px Georgia, serif";
  g.textAlign = "center";
  g.fillText("Soli Deo Gloria", 640, 702);
}

/* ---------- 楽典解説テキスト ---------- */
const GLOSS_JA = {
  establish: (k) => ({
    title: `調性の確立:${keyName(k)}`,
    body: "T(トニカ)→S(サブドミナント)→D(ドミナント)→Tの機能循環。冒頭やセクション頭で調の中心を聴き手に刻印する、通奏低音時代の定石です。",
  }),
  circle: () => ({
    title: "五度圏ゼクエンツ(反復進行)",
    body: "根音が完全5度ずつ下行する連鎖進行。各和音に七度を付加して不協和→解決を数珠つなぎにするのがバッハの推進力の源泉です。",
  }),
  circleFull: () => ({
    title: "五度圏の完全循環(ロマネスカ的連鎖)",
    body: "iv→VII→III→VI→ii°→V→iと、短調の全ダイアトニック和音を五度下行で一巡。ヴィヴァルディからバッハが学んだ様式です。",
  }),
  desc56: () => ({
    title: "下行5-6ゼクエンツ",
    body: "バスが音階を下行しながら5度と6度の音程を交替させる声部進行の定型。平行5度を回避しつつ滑らかに下降します。",
  }),
  lament: () => ({
    title: "ラメント・バス(下行テトラコルド)",
    body: "主音から属音へ1̂-♭7̂-♭6̂-5̂と下行するバス定型。嘆きの情念(パトス)の象徴で、終わりのiv6→Vはフリギア終止と呼ばれる半終止です。",
  }),
  pedal: () => ({
    title: "ドミナント・ペダルポイント(保続低音)",
    body: "バスが属音を保持したまま上声だけがI64とV7を交替。オルガン奏者バッハの十八番で、解決への期待を極限まで高めます。",
  }),
  cadence: () => ({
    title: "完全正格終止(PAC)+掛留4-3",
    body: "ii(またはiv)→I64→V7→I。属和音上で前の和音の音を保持して4度の不協和(掛留音)を作り、2度下行して3度へ解決します。",
  }),
  deceptive: () => ({
    title: "偽終止(V7→VI)",
    body: "属七が主和音でなく六度の和音へ「裏切り」解決。終止感を回避して楽曲を先へ先へと繰り延べる、無限機関の必須装置です。",
  }),
  modulate: (o, n, p0, p1) => ({
    title: `転調:${o}→${n}`,
    body: `旧調の${p0}=新調の${p1}という共通和音(ピボット)を蝶番にして滑らかに移行する「共通和音転調」。近親調への旅は調的建築の柱です。`,
  }),
  applied: () => ({
    title: "副属七(セカンダリー・ドミナント)の連鎖",
    body: "各和音の直前にその和音の属七(V7/x)を挿入し、五度進行を半音階的に強化。ライプツィヒ期の和声の推進力です。",
  }),
  chrom: () => ({
    title: "半音階的ラメント(クルツィフィクスス型)",
    body: "バスが1̂-7̂-♭7̂-6̂-♭6̂-5̂と半音階で下行する受難の修辞。ロ短調ミサ曲のCrucifixusで頂点に達した書法です。",
  }),
  napoli: () => ({
    title: "ナポリの六(♭II6)",
    body: "短調の♭II度の三和音を第一転回で用いる劇的な下属機能。終止直前に置かれる哀切な陰影で、円熟期に多用されます。",
  }),
  viiV: () => ({
    title: "属和音の減七(viiº7/V)",
    body: "副次導音上の減七和音でドミナントを二重に予告する半音階的和声の要。上声に増4度・減7度の緊張が走ります。",
  }),
  chorale: () => ({
    title: "コラール前奏曲(オルゲルビュヒライン様式)",
    body: "賛美歌の定旋律(カントゥス・フィルムス)を上声の長い音価で歌わせ、内声は単一の動機を貫き、足鍵盤が土台を歩みます。ヴァイマル期『オルガン小曲集』の書法です。",
  }),
  barform: () => ({
    title: "バール形式(AAB)",
    body: "同じ楽節(シュトレン)を2度歌い、対句(アプゲザング)で締めくくる、ルター派コラールの基本形式です。",
  }),
  passacaglia: () => ({
    title: "パッサカリア(オスティナート変奏)",
    body: "4小節の低音主題(グラウンド・バス)を執拗に反復し、その上に変奏を積み上げる形式。ハ短調BWV582で頂点に達しました。",
  }),
  ostTop: () => ({
    title: "主題の上声移行",
    body: "オスティナート主題がバスを離れて最上声へ。足鍵盤は沈黙し、主題が光の中に浮かびます。BWV582でも用いられた劇的な転換です。",
  }),
  organum: () => ({
    title: "パイプオルガンと北ドイツ様式",
    body: "各音を基音+上方部分音(8′・4′・クイント・ミクスチュア)のパイプ群として加算合成。発音時のチフ(風切り)、送風のゆらぎ、石造聖堂の長い残響を再現。コンソールは第I鍵盤(ハウプトヴェルク)・第II鍵盤(オーバーヴェルク)・足鍵盤の3段構成で、声部の受け持ちが光で示されます。",
  }),
  toccata: () => ({
    title: "トッカータ:ストゥルス・ファンタスティクス",
    body: "「触れる(toccare)」に由来する即興的楽曲。モルデント、疾走する走句、減七の分散、劇的休止とフェルマータを自由に連ねる北ドイツの幻想様式です。",
  }),
  tocVar: () => ({
    title: "冒頭動機の変奏",
    body: "最初の一撃はBWV 565の原型(5̂-4̂-5̂のモルデント)を本歌取りしますが、機関が一巡するごとに頭部動機を変奏します。プラルトリラー、回音、オクターヴ上の主音、第3音からの開始——即興を旨とする幻想様式では、奏者は同じ音型を二度と同じには弾きません。",
  }),
  dux: () => ({
    title: "フーガ開始:主唱(ドゥクス)",
    body: "単声で主題を提示。この主題は今この瞬間、この演奏のためだけに生成されたものです。以後のフーガの全素材がここから導かれます。",
  }),
  comes: () => ({
    title: "答唱(コメス)+対唱",
    body: "第2声が主題を完全5度上(属調)で応答。先行声部は対唱(カウンターサブジェクト)を奏で、以後つねに主題と組み合わされます。",
  }),
  episode: () => ({
    title: "嬉遊部(エピソード)",
    body: "主題の頭部動機をゼクエンツで展開し、次の主題再現へ橋を架ける経過区。",
  }),
  middleEntry: () => ({
    title: "関係調での主題再現",
    body: "平行長調に転じて主題が再現。フーガの中間部は近親調を巡礼します。",
  }),
  stretto: () => ({
    title: "ストレッタ(密接進行)",
    body: "前声部の主題が終わらぬうちに次声部が主題を開始する追い上げ。終結前の緊張を最高潮へ導く円熟の技法です。",
  }),
  modReturn: () => ({
    title: "新しい調で再開",
    body: "終止のあと属調へ移り、機関は回りつづけます。",
  }),
  aria: () => ({
    title: "アリア(カンタービレ)様式",
    body: "旋律・内声・通奏低音の三層書法。旋律は強拍で和声音を取り、弱拍を経過音・刺繍音・前打音(アポジャトゥーラ)などの非和声音で満たして歌います。「G線上のアリア」に代表される織り方です。",
  }),
  bourree: () => ({
    title: "リュート組曲のブーレ",
    body: "ホ短調リュート組曲BWV 996のブーレを種にした2分の2拍子・弱起の舞曲。旋律と低音が10度平行で降り、その間で開放弦の保続音が鳴りつづけます。少年のマッカートニーとハリスンがギターで覚えたのがこの曲で、Blackbirdの序奏はここから来た手触りです。",
  }),
  bourreeB: () => ({
    title: "後半(B段)へ",
    body: "二部形式の後半。平行長調から出発し、近親調をめぐって主調へ帰ります。前半・後半ともに反復し、反復ではドゥーブル(装飾変奏)として4分音符を8分に割って飾ります。",
  }),
  lute: () => ({
    title: "リュートの音源",
    body: "ガット弦は金属弦より高域が早く失われ、指の腹で弦の中央寄りを弾くため倍音が減ります。同度2本を張った複弦(コース)のわずかな張力差がうねりを生み、丸い胴と響孔(ローズ)の低いヘルムホルツ共鳴が全体を包みます。",
  }),
  imitation: (s) => ({
    title: `主題提示と模倣:${s}`,
    body: "上声が単独で主題(ズビェクト)を提示した後、下声が同じ主題をオクターヴ下で追いかけます。インヴェンションの開始定型です。",
  }),
  invert: () => ({
    title: "転回対位法(声部交換)",
    body: "上下の声部を入れ替えても対位法的に成立するよう書かれた書法。主題が低声へ、対旋律が高声へ移ります。",
  }),
  trill: () => ({
    title: "カデンツ・トリル",
    body: "終止の属和音上で導音と主音を急速交替させる装飾音。バロックのトリルは原則として上方補助音から開始します。",
  }),
  picardy: () => ({
    title: "ピカルディの3度",
    body: "短調の最終和音の第3音を半音上げて長三和音で閉じる終止法。バッハの短調作品の大半がこの光の中に着地します。",
  }),
  tuning415: () => ({
    title: "音律と音高について",
    body: "ヴェルクマイスターIII(1691年)は調ごとに異なる響きの色彩を持つウェル・テンペラメント。基準音高a'=415Hzは現代より約半音低いバロック・ピッチです。",
  }),
  final: () => ({
    title: "終止:アルペッジョ和音",
    body: "チェンバロは音量変化ができないため、終止和音は下から順に素早くばらして弾く(アルペジャンド)のが奏法の慣習です。",
  }),
};

const GLOSS_EN = {
  applied: () => ({ title: "Chain of applied dominants", body: "Each chord is preceded by its own dominant seventh (V7/x), chromatically reinforcing the fifth-progression. The harmonic engine of Bach's Leipzig years." }),
  chrom: () => ({ title: "Chromatic lament (Crucifixus type)", body: "The bass descends chromatically 1̂-7̂-♭7̂-6̂-♭6̂-5̂ — the rhetoric of the Passion, culminating in the Crucifixus of the B-minor Mass." }),
  napoli: () => ({ title: "Neapolitan sixth (♭II6)", body: "The ♭II triad in first inversion — a dramatic subdominant shading placed just before the cadence, favored in the mature works." }),
  viiV: () => ({ title: "Diminished seventh of V (viiº7/V)", body: "A secondary leading-tone diminished seventh that doubly announces the dominant — a cornerstone of chromatic harmony." }),
  chorale: () => ({ title: "Chorale prelude (Orgelbüchlein style)", body: "The hymn tune (cantus firmus) sings in long values in the soprano, the inner voice carries a single unifying motif, and the pedal walks beneath — the manner of Bach's Weimar Little Organ Book." }),
  barform: () => ({ title: "Bar form (AAB)", body: "The same phrase (Stollen) is sung twice, then closed by a counter-phrase (Abgesang) — the basic form of the Lutheran chorale." }),
  passacaglia: () => ({ title: "Passacaglia (ostinato variations)", body: "A four-bar ground bass repeats obstinately while variations pile up above it — the form that peaked in BWV 582 in C minor." }),
  ostTop: () => ({ title: "Theme moves to the soprano", body: "The ostinato leaves the bass and floats to the top voice; the pedal falls silent. A dramatic turn also used in BWV 582." }),
  organum: () => ({ title: "The pipe organ and the North German style", body: "Each note is additively synthesized as a chorus of pipes (8′, 4′, quint, mixture) with speech chiff, wind unsteadiness and long stone-church reverb. The console shows Manual I (Hauptwerk), Manual II (Oberwerk) and pedals, with each voice's assignment lit." }),
  toccata: () => ({ title: "Toccata: stylus phantasticus", body: "From toccare, 'to touch' — an improvisatory genre of mordents, rushing runs, diminished-seventh arpeggios, dramatic pauses and fermatas, in the North German fantastic style." }),
  tocVar: () => ({ title: "The opening motif, varied", body: "The first stroke quotes the archetype of BWV 565 (the 5̂–4̂–5̂ mordent), but every time the engine comes round again the head-motif is varied: an inverted mordent, a turn, the octave tonic, an entry from the third. In the fantastic style, which is improvisation by definition, no player ever plays the same figure twice." }),
  dux: () => ({ title: "Fugue begins: the subject (dux)", body: "A single voice states the subject — generated at this very moment, for this performance alone. All material of the fugue derives from it." }),
  comes: () => ({ title: "Answer (comes) + countersubject", body: "The second voice answers the subject a fifth higher (in the dominant), while the first spins the countersubject that will accompany every later entry." }),
  episode: () => ({ title: "Episode", body: "The head-motif of the subject is spun into sequences, bridging to the next entry." }),
  middleEntry: () => ({ title: "Entry in a related key", body: "The subject returns in the relative major; a fugue's middle section makes a pilgrimage through the near keys." }),
  stretto: () => ({ title: "Stretto", body: "The next voice begins the subject before the previous one has finished — the overlapping chase that drives the tension to its peak." }),
  modReturn: () => ({ title: "Restarting in a new key", body: "After the cadence, the engine moves to the dominant and keeps turning." }),
  aria: () => ({ title: "Aria (cantabile) style", body: "Three layers — melody, inner voices, continuo. The melody takes chord tones on strong beats and fills weak beats with passing tones, neighbors and appoggiaturas, in the manner of the Air on the G string." }),
  bourree: () => ({ title: "Bourrée from the lute suite", body: "A cut-time dance with an upbeat, seeded from the Bourrée of the E minor lute suite BWV 996. Melody and bass descend in parallel tenths while an open-string pedal tone rings between them. This is the piece the teenage McCartney and Harrison learned on guitar — the feel the intro of Blackbird came from." }),
  bourreeB: () => ({ title: "Into the second strain", body: "The B section of the binary form: it sets out from the relative major and travels the near keys back to the tonic. Both strains repeat, and on the repeat they return as a double — quarter notes split into eighths and ornamented." }),
  lute: () => ({ title: "The lute voice", body: "Gut strings lose their highs faster than metal, and the flesh of the finger plucks nearer the middle of the string, thinning the upper partials. Courses of two unison strings beat gently against each other, and the low Helmholtz resonance of the round body and its rose wraps the whole." }),
  imitation: (s) => ({ title: `Subject and imitation: ${tr(s)}`, body: "The upper voice states the subject alone; the lower voice then follows an octave below. The standard opening of an invention." }),
  invert: () => ({ title: "Invertible counterpoint", body: "The voices are written so they still work when exchanged: the subject moves to the bass, the counter-melody to the top." }),
  trill: () => ({ title: "Cadential trill", body: "A rapid alternation of leading tone and tonic over the dominant. A Baroque trill begins, as a rule, from the upper auxiliary." }),
  picardy: () => ({ title: "Picardy third", body: "The final chord of a minor-key piece is brightened by raising its third — the light in which most of Bach's minor works come to rest." }),
  tuning415: () => ({ title: "On temperament and pitch", body: "Werckmeister III (1691) is a well temperament in which every key has its own color. The reference pitch a′=415 Hz is Baroque pitch, roughly a semitone below modern." }),
  final: () => ({ title: "Final chord: arpeggiando", body: "Since the harpsichord cannot vary loudness, the closing chord is customarily rolled quickly from the bottom." }),
  establish: (k) => ({ title: `Establishing the key: ${keyName(k)}`, body: "The functional cycle T→S→D→T stamps the tonal center on the listener's ear — the standard opening of the continuo age." }),
  circle: () => ({ title: "Circle-of-fifths sequence", body: "Roots fall by perfect fifths, each chord carrying a seventh so that dissonance and resolution chain together — the engine of Bach's forward drive." }),
  circleFull: () => ({ title: "Full circle of fifths", body: "iv→VII→III→VI→iiº→V→i — the complete diatonic circuit in minor, a manner Bach learned from Vivaldi." }),
  desc56: () => ({ title: "Descending 5-6 sequence", body: "The bass walks down the scale while the upper voices alternate fifths and sixths, gliding downward without parallel fifths." }),
  lament: () => ({ title: "Lament bass (descending tetrachord)", body: "The bass descends 1̂-♭7̂-♭6̂-5̂, the emblem of grief; the closing iv6→V is the Phrygian half cadence." }),
  pedal: () => ({ title: "Dominant pedal point", body: "The bass holds the dominant while the upper voices alternate I64 and V7 — organist Bach's specialty, stretching the expectation of resolution to its limit." }),
  cadence: () => ({ title: "Perfect authentic cadence + 4-3 suspension", body: "ii (or iv) → I64 → V7 → I. Over the dominant, a held note forms a dissonant fourth that resolves down by step to the third." }),
  deceptive: () => ({ title: "Deceptive cadence (V7→VI)", body: "The dominant seventh resolves not to the tonic but to the sixth degree — the essential device that keeps a perpetual machine turning." }),
  modulate: (o, n, p0, p1) => ({ title: `Modulation: ${o} → ${n}`, body: `A chord shared by both keys (${p0} in the old = ${p1} in the new) serves as the hinge — the common-chord modulation that frames tonal architecture.` }),
};
const GLOSS = Object.fromEntries(Object.keys(GLOSS_JA).map((k) => [k, (...a) => (isJa() ? GLOSS_JA : GLOSS_EN)[k](...a)]));

/* ============================================================
   コンポーネント
   ============================================================ */
export default function BachPerpetuumMobile() {
  const [playing, setPlaying] = useState(false);
  const [ending, setEnding] = useState(false);
  const [settings, setSettings] = useState({
    genMode: "toccata", // toccata | chorale | passacaglia | aria | prelude | invention
    tempId: "werck3",
    aFreq: 415,
    bpm: 66,
    startKey: "2:minor",
    stop8a: true,
    stop8b: true,
    stop4: false,
    lute: false,
    air: 0.55,
    era: "weimar", // weimar | koethen | leipzig
    vol: 1.0,
    orgP8: true,
    orgO4: true,
    orgMix: true,
    orgPed: true,
    recDelay: 1.16, // 録画A/V補正(実測値)
    lang: "ja", // 表示言語 ja | en
  });
  const [analysis, setAnalysis] = useState(null);
  const [logs, setLogs] = useState([]);
  const [active, setActive] = useState([]);
  const [tuning, setTuning] = useState(null); // null | 0..1(調律=波形レンダリング進捗)
  const [recState, setRecState] = useState(false);
  const [showConsole, setShowConsole] = useState(true);

  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  LANG.v = settings.lang;
  const audioRef = useRef(null);
  const stRef = useRef(null);
  const repeatIdRef = useRef(null);
  const midiRef = useRef([]);
  const baseRef = useRef(0);
  const recRef = useRef(null);
  const canvasRef = useRef(null);
  const activeRef = useRef([]);
  const analysisRef = useRef(null);
  const latestLogRef = useRef(null);
  const vizQueueRef = useRef([]);
  const wakeRef = useRef(null);
  const silentRef = useRef(null);
  const playingRef = useRef(false);
  playingRef.current = playing;

  /* ---------- 音源:物理モデル再生系 ---------- */
  const ensureAudio = useCallback(() => {
    if (audioRef.current) return audioRef.current;
    const ctx = Tone.getContext().rawContext;
    const sr = ctx.sampleRate;
    const master = new Tone.Limiter(-1);
    master.connect(Tone.Destination);
    const vol = new Tone.Gain(settingsRef.current.vol);
    vol.connect(master);
    // --- チェンバロ系(サロン) ---
    const dry = new Tone.Gain(1.0).connect(vol);
    const room = new Tone.Convolver(makeRoomIR(ctx, sr, 1.9, 0.013, 1.2));
    const roomGain = new Tone.Gain(settingsRef.current.air * 0.7);
    room.connect(roomGain);
    roomGain.connect(vol);
    const body = new Tone.Convolver(makeBodyIR(ctx, sr));
    body.connect(dry);
    body.connect(room);
    // リュートの胴。2つの筐体を並列に置き、ゲインで持ち替える(再接続の切れ目を作らない)
    const bodyL = new Tone.Convolver(makeBodyIR(ctx, sr, "lute"));
    bodyL.connect(dry);
    bodyL.connect(room);
    const bodyCG = new Tone.Gain(1);
    const bodyLG = new Tone.Gain(0);
    bodyCG.connect(body);
    bodyLG.connect(bodyL);
    const lp = new Tone.Filter(8500, "lowpass"); // 爪の当たりを残す
    const inGain = new Tone.Gain(1.15);
    lp.connect(bodyCG);
    lp.connect(bodyLG);
    inGain.connect(lp);
    // 楽器の幅:低音弦は左、高音弦は右(奏者視点)にゾーン配置
    const zones = [];
    for (let i = 0; i < 9; i++) {
      const p = new Tone.Panner(-0.45 + i * 0.1125);
      p.connect(inGain);
      zones.push(p);
    }
    // --- パイプオルガン系(石造聖堂) ---
    const cath = new Tone.Convolver(makeRoomIR(ctx, sr, 3.8, 0.028, 0.5));
    const cathGain = new Tone.Gain(0.4 + settingsRef.current.air * 0.7);
    cath.connect(cathGain);
    cathGain.connect(vol);
    const orgDry = new Tone.Gain(0.55).connect(vol);
    const wind = new Tone.Gain(1);
    wind.connect(orgDry);
    wind.connect(cath);
    const windLfo = new Tone.LFO(0.33, 0.982, 1.0); // 送風のゆらぎ
    windLfo.connect(wind.gain);
    windLfo.start();
    const orgIn = ctx.createGain();
    Tone.connect(orgIn, wind);
    audioRef.current = { zones, lp, bodyCG, bodyLG, roomGain, vol, cathGain, orgIn, master, buffers: null, cacheKey: "" };
    return audioRef.current;
  }, []);

  const buildBuffers = useCallback(async () => {
    const a = ensureAudio();
    const s = settingsRef.current;
    const inst = isLuteMode(s.genMode) ? "lute" : "cembalo";
    const ck = `${s.tempId}:${s.aFreq}:${inst}`;
    // 胴の持ち替えは弦のレンダリングを待たずに済ませる
    a.bodyCG.gain.rampTo(inst === "lute" ? 0 : 1, 0.05);
    a.bodyLG.gain.rampTo(inst === "lute" ? 1 : 0, 0.05);
    if (a.cacheKey === ck && a.buffers) return;
    setTuning(0);
    const ctx = Tone.getContext().rawContext;
    const sr = ctx.sampleRate;
    const map = new Map();
    for (let m = 30; m <= 94; m++) {
      map.set(m, renderNote(ctx, sr, midiToFreq(m, s.tempId, s.aFreq), m, inst));
      if ((m - 30) % 6 === 5) {
        setTuning((m - 30) / 64);
        await new Promise((r) => setTimeout(r, 0));
      }
    }
    a.buffers = map;
    a.cacheKey = ck;
    setTuning(null);
  }, []); // eslint-disable-line

  const applyLute = useCallback((on) => {
    const a = audioRef.current;
    if (!a) return;
    a.lp.frequency.rampTo(on ? 2400 : 8500, 0.08);
  }, []);

  const midiCap = (m, d, t, v, ch) => {
    const arr = midiRef.current;
    if (arr.length < 30000) arr.push({ t: Math.max(0, t - baseRef.current), m, d, v, ch });
  };

  const trigger = useCallback((midi, dur, time, vel = 0.95) => {
    const a = audioRef.current;
    if (!a || !a.buffers) return;
    const s = settingsRef.current;
    midiCap(midi, dur, time, vel, 0);
    const onLute = isLuteMode(s.genMode);
    const play = (m, rate, g) => {
      const buf = a.buffers.get(m);
      if (!buf) return;
      const src = new Tone.ToneBufferSource(buf);
      src.playbackRate.value = rate;
      src.fadeIn = 0.001;
      src.fadeOut = s.lute ? 0.035 : 0.1; // ダンパー(キー離鍵)の消音
      const gn = new Tone.Gain(g);
      src.connect(gn);
      const zi = Math.max(0, Math.min(8, Math.floor((m - 33) / 7)));
      gn.connect(a.zones[zi]);
      const t = Math.max(time + (Math.random() - 0.5) * 0.005, Tone.now()); // 微小な人間的ゆらぎ
      // リュートにダンパーはない。指で止めるまで鳴り続ける
      const stopAt = t + (s.lute ? Math.min(dur, 0.2) : onLute ? Math.max(dur * 1.6, 0.9) : Math.max(dur * 1.1, 0.38));
      src.start(t);
      src.stop(stopAt);
      src.onended = () => { try { src.dispose(); gn.dispose(); } catch (e) {} };
    };
    if (s.stop8a) play(midi, 1, vel * 0.95);
    if (s.stop8b) play(midi, 1.00185, vel * (onLute ? 0.62 : 0.5)); // 後列8′/複弦は僅かに異なる速度=うなり
    // リュートのオクターヴ弦は低音コースだけに張る
    if (s.stop4 && (!onLute || midi < 55)) play(midi + 12, 1, vel * (onLute ? 0.26 : 0.32));
  }, []);

  /* ---------- パイプオルガン:倍音加算合成 ---------- */
  const organTrigger = useCallback((midi, dur, time, vel = 0.8, ped = false) => {
    const a = audioRef.current;
    if (!a || midi < 21 || midi > 100) return;
    const s = settingsRef.current;
    midiCap(midi, dur, time, vel, ped ? 2 : 1);
    const ctx = Tone.getContext().rawContext;
    const f = midiToFreq(midi, s.tempId, s.aFreq);
    const parts = [];
    if (ped && s.orgPed) parts.push([0.5, 1.0]); // 16′(足鍵盤)
    if (s.orgP8) parts.push([1, 1.0]); // プリンシパル8′
    if (s.orgO4) parts.push([2, 0.5]); // オクターヴ4′
    if (s.orgMix) parts.push([3, 0.2], [4, 0.26], [6, 0.11], [8, 0.06]); // クイント+ミクスチュア
    if (parts.length === 0) parts.push([1, 1.0]);
    const t = Math.max(time, Tone.now());
    const end = t + Math.max(dur, 0.08);
    const ng = ctx.createGain();
    ng.gain.value = 0;
    ng.connect(a.orgIn);
    const lv = vel * 0.24;
    ng.gain.setValueAtTime(0, t);
    ng.gain.linearRampToValueAtTime(lv * 1.15, t + 0.035); // 発音の頭の張り出し
    ng.gain.linearRampToValueAtTime(lv, t + 0.09);
    ng.gain.setValueAtTime(lv, end);
    ng.gain.linearRampToValueAtTime(0, end + 0.14);
    let last = null;
    parts.forEach(([r, g0]) => {
      const o = ctx.createOscillator();
      o.type = "sine";
      o.frequency.value = f * r * Math.pow(2, (Math.random() * 6 - 3) / 1200); // パイプごとの調律差
      const pg = ctx.createGain();
      pg.gain.value = g0;
      o.connect(pg);
      pg.connect(ng);
      o.start(t);
      o.stop(end + 0.2);
      last = o;
    });
    // チフ(発音時の風切り)
    const co = ctx.createOscillator();
    co.type = "triangle";
    co.frequency.value = f * 2.02;
    const cg = ctx.createGain();
    cg.gain.setValueAtTime(vel * 0.12, t);
    cg.gain.exponentialRampToValueAtTime(0.0005, t + 0.06);
    co.connect(cg);
    cg.connect(ng);
    co.start(t);
    co.stop(t + 0.1);
    if (last) last.onended = () => { try { ng.disconnect(); } catch (e) {} };
  }, []);

  const drawTick = useCallback((midis, time) => {
    // オーディオ時刻付きの共有タイムライン。ライブ表示と録画がそれぞれ独自の基準時刻で走査する
    const list = vizQueueRef.current;
    list.push({ t: time, notes: midis });
    if (list.length > 600) list.splice(0, 300);
  }, []);

  const pushLog = useCallback((entry, measureNo, kName) => {
    latestLogRef.current = { title: entry.title, body: entry.body, no: measureNo, keyN: kName };
    setLogs((l) => [{ ...entry, no: measureNo, keyN: kName, id: Math.random() }, ...l].slice(0, 60));
  }, []);

  /* ---------- フレーズ生成 ---------- */
  function measuresOf(key, romansList, techs, log) {
    return romansList.map((romans, i) => ({
      chords: romans.map((r) => (typeof r === "string" ? mk(key, r) : r)),
      techs: techs || [],
      log: i === 0 ? log : null,
    }));
  }
  function genNextPhrase(st) {
    const gm = settingsRef.current.genMode;
    if (gm === "toccata") { buildToccataFugue(st); return; }
    if (gm === "chorale") { buildChorale(st); return; }
    if (gm === "passacaglia") { buildPassacaglia(st); return; }
    if (gm === "bourree") { buildBourree(st); return; }
    const k = st.key;
    const isMaj = k.mode === "major";
    const era = settingsRef.current.era;
    let ms;

    if (st.endRequested && !st.finalMade) {
      st.finalMade = true;
      const picardy = !isMaj;
      const v7 = { ...mk(k, "V7"), sus: true, trill: true };
      const pd = preDominantChord(k, isMaj, era);
      ms = [
        { chords: [mk(k, isMaj ? "IV" : "iv")], techs: ["終止準備"], log: GLOSS.cadence(), rall: true },
        { chords: [pd.c], techs: [pd.tech], log: pd.log },
        { chords: [mk(k, isMaj ? "I64" : "i64"), v7], techs: ["掛留4-3", "トリル"] },
        {
          chords: [mk(k, picardy ? "I#" : isMaj ? "I" : "i")],
          techs: picardy ? ["ピカルディの3度"] : ["完全正格終止"],
          log: picardy ? GLOSS.picardy() : GLOSS.final(),
          finalChord: true,
        },
      ];
      st.queue.push(...ms);
      return;
    }

    if (st.sinceMod >= st.modAfter) {
      // 転調
      const targets = isMaj
        ? [
            { t: pcOf(k.tonic + 7), m: "major", piv: ["I", "IV"] },
            { t: pcOf(k.tonic + 9), m: "minor", piv: ["IV", "VI"] },
            { t: pcOf(k.tonic + 5), m: "major", piv: ["I", "V"] },
          ]
        : [
            { t: pcOf(k.tonic + 3), m: "major", piv: ["i", "vi"] },
            { t: pcOf(k.tonic + 7), m: "minor", piv: ["i", "iv"] },
          ];
      const tg = targets[Math.floor(Math.random() * targets.length)];
      const oldName = keyName(k);
      const pivot = { ...mk(k, tg.piv[0]), roman: isJa() ? `${tg.piv[0]}(旧)=${tg.piv[1]}(新)` : `${tg.piv[0]} (old) = ${tg.piv[1]} (new)` };
      const newKey = { tonic: tg.t, mode: tg.m };
      const newName = keyName(newKey);
      ms = [
        { chords: [mk(k, isMaj ? "I" : "i")], techs: ["転調準備"], log: GLOSS.modulate(oldName, newName, tg.piv[0], tg.piv[1]) },
        { chords: [pivot], techs: ["共通和音(ピボット)"] },
        { chords: [mk(newKey, "V7")], techs: ["新調のドミナント"] },
        { chords: [mk(newKey, newKey.mode === "major" ? "I" : "i")], techs: ["新調の主和音"] },
      ];
      st.key = newKey;
      st.sinceMod = 0;
      st.modAfter = 6 + Math.floor(Math.random() * 4);
      st.sincePAC = 1;
      st.sectionNew = true;
      if (Math.random() < 0.6) st.subjectIdx = Math.floor(Math.random() * SUBJECTS.length);
    } else if (st.sincePAC >= 3) {
      if (!st.deceived && Math.random() < 0.45) {
        st.deceived = true;
        ms = measuresOf(k, [[isMaj ? "ii6" : "iio6"], ["V7"], [isMaj ? "vi" : "VI"], [isMaj ? "IV" : "iv"]], ["偽終止"], GLOSS.deceptive());
      } else {
        st.deceived = false;
        st.sincePAC = 0;
        const v7 = { ...mk(k, "V7"), sus: true, trill: true };
        const pd = preDominantChord(k, isMaj, era);
        ms = [
          { chords: [mk(k, isMaj ? "IV" : "iv")], techs: ["終止定型"], log: GLOSS.cadence() },
          { chords: [pd.c], techs: [pd.tech], log: pd.log },
          { chords: [mk(k, isMaj ? "I64" : "i64"), v7], techs: ["掛留4-3", "カデンツ・トリル"] },
          { chords: [mk(k, isMaj ? "I" : "i")], techs: ["完全正格終止(PAC)"] },
        ];
      }
    } else if (era === "leipzig" && Math.random() < 0.38) {
      ms = isMaj ? appliedPhrase(k) : chromPhrase(k);
    } else {
      const roll = Math.random();
      if (roll < 0.28) {
        ms = measuresOf(k, isMaj ? [["I"], ["IV6"], ["V7"], ["I"]] : [["i"], ["iv6"], ["V7"], ["i"]], ["機能和声T-S-D-T"], GLOSS.establish(k));
      } else if (roll < 0.55) {
        ms = isMaj
          ? measuresOf(k, [["vi7"], ["ii7"], ["V7"], ["I"]], ["五度圏ゼクエンツ", "七の和音の連鎖"], GLOSS.circle())
          : measuresOf(k, [["iv"], ["VII"], ["III"], ["VI"], ["iiø7"], ["V7"], ["i"]], ["五度圏ゼクエンツ"], GLOSS.circleFull());
      } else if (roll < 0.8) {
        ms = isMaj
          ? measuresOf(k, [["I", "V6"], ["vi", "iii6"], ["IV", "I6"], ["ii6", "V7"], ["I"]], ["下行5-6ゼクエンツ"], GLOSS.desc56())
          : measuresOf(k, [["i"], ["v6"], ["iv6"], ["V"]], ["ラメント・バス", "フリギア終止(半終止)"], GLOSS.lament());
      } else {
        const dom = pcOf(k.tonic + 7);
        const c64 = { ...mk(k, isMaj ? "I64" : "i64"), bassPc: dom, roman: (isMaj ? "I64" : "i64") + "/V" };
        const cV7 = { ...mk(k, "V7"), bassPc: dom };
        ms = [
          { chords: [c64, cV7], techs: ["ドミナント・ペダル"], log: GLOSS.pedal() },
          { chords: [{ ...c64 }, { ...cV7 }], techs: ["ドミナント・ペダル"] },
          { chords: [mk(k, "V7")], techs: ["属和音の解放"] },
          { chords: [mk(k, isMaj ? "I" : "i")], techs: ["解決"] },
        ];
      }
    }

    // インヴェンション:模倣・声部交換の指示
    if (st.sectionNew) {
      st.sectionNew = false;
      if (ms[0]) ms[0].imitRole = "solo";
      if (ms[1]) ms[1].imitRole = "answer";
      if (settingsRef.current.genMode === "invention" && ms[0]) {
        ms[0].log2 = GLOSS.imitation(SUBJECTS[st.subjectIdx].name);
      }
    } else if (settingsRef.current.genMode === "invention" && Math.random() < 0.3) {
      st.swap = !st.swap;
      if (ms[0]) {
        ms[0].techs = [...ms[0].techs, "転回対位法"];
        ms[0].log2 = GLOSS.invert();
      }
    }

    st.sincePAC++;
    st.sinceMod++;
    st.queue.push(...ms);
  }

  /* ---------- ヴォイシング ---------- */
  function voiceChord(ch, st) {
    let bass = nearestPcMidi(ch.bassPc, st.prevBass ?? 45);
    while (bass < 34) bass += 12;
    while (bass > 53) bass -= 12;
    const upPcs = ch.pcs.length === 4 ? [...ch.pcs] : [ch.pcs[0], ch.pcs[1], ch.pcs[2], ch.pcs[0]];
    const prev = st.prevUppers ?? [58, 62, 65, 70];
    const remaining = [...upPcs];
    const ups = [];
    prev.forEach((p) => {
      let bi = 0, bm = null, bd = 1e9;
      remaining.forEach((pc, idx) => {
        const m = nearestPcMidi(pc, p);
        const d = Math.abs(m - p);
        if (d < bd) { bd = d; bm = m; bi = idx; }
      });
      ups.push(bm);
      remaining.splice(bi, 1);
    });
    ups.sort((a, b) => a - b);
    for (let i = 0; i < ups.length; i++) {
      while (ups[i] < bass + 7) ups[i] += 12;
      while (ups[i] > 86) ups[i] -= 12;
    }
    ups.sort((a, b) => a - b);
    for (let i = 1; i < ups.length; i++) if (ups[i] <= ups[i - 1]) ups[i] += 12;
    ups.sort((a, b) => a - b);
    st.prevBass = bass;
    st.prevUppers = ups;
    return { bass, ups };
  }

  /* ---------- 音形:プレリュード ---------- */
  function playPreludeHalf(ch, vv, t0, six) {
    const { bass, ups } = vv;
    const seqN = [bass, ups[0], ups[1], ups[2], ups[3], ups[1], ups[2], ups[3]];
    let seqS = seqN;
    if (ch.sus) {
      const lt = pcOf(ch.key.tonic + 11);
      const idx = ups.findIndex((u) => pcOf(u) === lt);
      if (idx >= 0) {
        const u2 = [...ups];
        u2[idx] = ups[idx] + 1;
        seqS = [bass, u2[0], u2[1], u2[2], u2[3], u2[1], u2[2], u2[3]];
      }
    }
    for (let i = 0; i < 8; i++) {
      const n = (ch.sus && i < 5 ? seqS : seqN)[i];
      trigger(n, six * 0.95, t0 + i * six, 0.82 + Math.random() * 0.06);
      drawTick([n], t0 + i * six);
    }
  }

  /* ---------- 音形:インヴェンション ---------- */
  function playInventionHalf(ch, vv, t0, six, meas, st) {
    const scale = scaleOf(ch);
    const subj = SUBJECTS[st.subjectIdx].steps;
    const leadIsRH = !st.swap;

    const motifRootHi = (() => {
      let r = nearestPcMidi(ch.pcs[0], st.prevRH ?? 72);
      while (r < 64) r += 12;
      while (r > 81) r -= 12;
      st.prevRH = r;
      return r;
    })();
    const motifRootLo = (() => {
      let r = nearestPcMidi(ch.pcs[0], st.prevLH ?? 50);
      while (r < 43) r += 12;
      while (r > 58) r -= 12;
      st.prevLH = r;
      return r;
    })();

    const motifNotes = (root) => {
      if (ch.trill) {
        const ltPc = pcOf(ch.key.tonic + 11);
        let t = nearestPcMidi(ltPc, root + 2);
        const u = stepFrom(t, 1, scale);
        const l = stepFrom(t, -1, scale);
        return [u, t, u, t, u, t, l, t];
      }
      return subj.map((s) => stepFrom(root, s, scale));
    };
    const counterNotes = (root) => COUNTER_STEPS.map((s) => stepFrom(root, s, scale));

    const role = meas.imitRole;
    let hiLine = null, loLine = null; // {notes, step}
    if (role === "solo") {
      if (leadIsRH) hiLine = { notes: motifNotes(motifRootHi), step: six };
      else loLine = { notes: motifNotes(motifRootLo), step: six };
    } else if (role === "answer") {
      if (leadIsRH) {
        loLine = { notes: motifNotes(motifRootLo), step: six };
        hiLine = { notes: counterNotes(motifRootHi), step: six * 2 };
      } else {
        hiLine = { notes: motifNotes(motifRootHi), step: six };
        loLine = { notes: counterNotes(motifRootLo), step: six * 2 };
      }
    } else {
      if (leadIsRH) {
        hiLine = { notes: motifNotes(motifRootHi), step: six };
        loLine = { notes: counterNotes(vv.bass), step: six * 2 };
      } else {
        loLine = { notes: motifNotes(motifRootLo), step: six };
        hiLine = { notes: counterNotes(motifRootHi), step: six * 2 };
      }
    }

    const tickMap = {};
    [hiLine, loLine].forEach((line) => {
      if (!line) return;
      line.notes.forEach((n, i) => {
        const t = t0 + i * line.step;
        trigger(n, line.step * 0.92, t, 0.82 + Math.random() * 0.06);
        const key = Math.round((i * line.step) / six);
        tickMap[key] = [...(tickMap[key] || []), n];
      });
    });
    Object.keys(tickMap).forEach((k) => drawTick(tickMap[k], t0 + k * six));
  }

  /* ---------- 音形:アリア(旋律+内声+通奏低音) ---------- */
  function pickMelodyTone(ch, prev, melDir) {
    let best = null, bs = 1e9;
    ch.pcs.forEach((pc) => {
      const base = nearestPcMidi(pc, prev);
      [base, base + 12, base - 12].forEach((c) => {
        if (c < 65 || c > 84) return;
        // 近い音を好みつつ、旋律弧の方向へ緩やかにバイアス。同音連打は避ける
        const sc = Math.abs(c - prev) - 0.9 * Math.sign(c - prev || 1) * melDir + (c === prev ? 2.2 : 0);
        if (sc < bs) { bs = sc; best = c; }
      });
    });
    return best ?? Math.min(84, Math.max(65, prev));
  }

  function playAriaMeasure(meas, time, measureSec, st, nextMeas) {
    const six = measureSec / 16;
    const halves = meas.chords.length === 1 ? [meas.chords[0], meas.chords[0]] : meas.chords;
    // 旋律の弧(アーチ)の方向を更新:高すぎれば下降へ、低すぎれば上昇へ
    if (st.prevMel == null) st.prevMel = 74;
    if (st.melDir == null) st.melDir = 1;
    if (st.prevMel > 81) st.melDir = -1;
    else if (st.prevMel < 68) st.melDir = 1;
    else if (Math.random() < 0.15) st.melDir *= -1;

    let prev = st.prevMel;
    const strongs = halves.map((ch) => {
      const t = pickMelodyTone(ch, prev, st.melDir);
      prev = t;
      return t;
    });
    const nextChord = nextMeas && nextMeas.chords ? nextMeas.chords[0] : halves[0];
    const nextStrong = pickMelodyTone(nextChord, prev, st.melDir); // 次の小節頭へ向かって歌う

    const tickMap = {};
    const tick = (n, off) => { const k = Math.round(off); tickMap[k] = [...(tickMap[k] || []), n]; };

    halves.forEach((ch, hi) => {
      const t0 = time + (hi * measureSec) / 2;
      const sameChord = hi === 1 && meas.chords.length === 1;
      const vv = sameChord && st.lastVoicing ? st.lastVoicing : voiceChord(ch, st);
      st.lastVoicing = vv;
      const scale = scaleOf(ch);
      // 通奏低音:四分音符
      const b2 = nearestChordTone(ch, vv.bass + 7) ?? vv.bass;
      [[vv.bass, 0], [b2, 4]].forEach(([n, off]) => {
        trigger(n, (measureSec / 4) * 0.95, t0 + off * six, 0.85);
        tick(n, hi * 8 + off);
      });
      // 内声:二分音符で薄く(セクション頭の独唱では休む)
      if (meas.imitRole !== "solo") {
        trigger(vv.ups[0], (measureSec / 2) * 0.9, t0, 0.42);
        trigger(vv.ups[1], (measureSec / 2) * 0.9, t0, 0.42);
      }
      // 旋律
      const from = strongs[hi];
      const to = hi === 0 ? strongs[1] : nextStrong;
      let pat, cell;
      if (ch.trill) {
        // 終止では書き出しトリル
        const ltPc = pcOf(ch.key.tonic + 11);
        let tt = nearestPcMidi(ltPc, from);
        if (tt < 65) tt += 12;
        if (tt > 84) tt -= 12;
        const u = stepFrom(tt, 1, scale), l = stepFrom(tt, -1, scale);
        pat = [1, 1, 1, 1, 1, 1, 1, 1];
        cell = [u, tt, u, tt, u, tt, l, tt];
      } else {
        pat = [...pickPattern()];
        cell = melodicCell(from, to, pat.length, scale);
        // 前打音(アポジャトゥーラ):強拍を上隣接音で飾って解決
        if (hi === 0 && pat[0] === 4 && Math.random() < 0.25) {
          pat = [2, 2, ...pat.slice(1)];
          cell = [stepFrom(from, 1, scale), from, ...cell.slice(1)];
        }
      }
      let acc = 0;
      cell.forEach((n, i) => {
        trigger(n, pat[i] * six * 0.96, t0 + acc * six, 1.0);
        tick(n, hi * 8 + acc);
        acc += pat[i];
      });
    });
    st.prevMel = strongs[1];
    Object.keys(tickMap).forEach((k) => drawTick(tickMap[k], time + k * six));
  }

  /* ---------- 小節スケジューラ ---------- */
  const onMeasure = useCallback((time) => {
    const st = stRef.current;
    if (!st || st.stopped) return;
    if (st.queue.length === 0) genNextPhrase(st);
    const meas = st.queue.shift();
    st.measureNo++;
    const measureSec = Tone.Time("1m").toSeconds();
    const six = measureSec / 16;

    // 次小節を先読み(終止後は生成しない)
    if (st.queue.length === 0 && !st.finalMade) genNextPhrase(st);
    const nextMeas = st.queue[0] || null;
    // 解説の先出し:次小節の解説を今の小節頭で表示(読む時間を1小節ぶん確保)
    if (nextMeas) {
      const kNn = keyName(nextMeas.disp ? nextMeas.disp.key : nextMeas.chords[0].key);
      if (nextMeas.log && !nextMeas.logShown) {
        nextMeas.logShown = true;
        const lg = nextMeas.log;
        Tone.Draw.schedule(() => pushLog(lg, st.measureNo + 1, kNn), time);
      }
      if (nextMeas.log2 && !nextMeas.log2Shown) {
        nextMeas.log2Shown = true;
        const lg2 = nextMeas.log2;
        Tone.Draw.schedule(() => pushLog(lg2, st.measureNo + 1, kNn), time);
      }
    }

    if (meas.rall) {
      const cur = Tone.Transport.bpm.value;
      Tone.Transport.bpm.rampTo(cur * 0.72, measureSec * 3.2);
    }

    // イベント小節(オルガンの各様式、およびリュートのブーレ)
    if (meas.events) {
      Tone.Draw.schedule(() => {
        const an = { no: st.measureNo, keyN: keyName(meas.disp.key), romans: meas.disp.label, f: meas.disp.f, techs: meas.techs };
        analysisRef.current = an;
        setAnalysis(an);
        if (meas.log && !meas.logShown) pushLog(meas.log, st.measureNo, keyName(meas.disp.key));
        if (meas.log2 && !meas.log2Shown) pushLog(meas.log2, st.measureNo, keyName(meas.disp.key));
      }, time);
      const onLute = isLuteMode(settingsRef.current.genMode);
      const tickMap = {};
      meas.events.forEach((ev) => {
        const dur = Math.max(ev.d, 1) * six * 0.98;
        if (onLute) trigger(ev.m, dur, time + ev.off * six, ev.v ?? 0.8);
        else organTrigger(ev.m, dur, time + ev.off * six, ev.v ?? 0.8, !!ev.ped);
        tickMap[ev.off] = [...(tickMap[ev.off] || []), { m: ev.m, man: ev.ped ? 0 : ev.man ?? 1 }];
      });
      Object.keys(tickMap).forEach((kk) => drawTick(tickMap[kk], time + kk * six));
      if (meas.finalOrgan) {
        Tone.Transport.scheduleOnce((t2) => { Tone.Draw.schedule(() => stopAll(), t2); }, time + measureSec * 2.2);
      }
      return;
    }

    const kN = keyName(meas.chords[0].key);
    const romans = meas.chords.map((c) => c.roman).join(" – ");
    Tone.Draw.schedule(() => {
      const an = { no: st.measureNo, keyN: kN, romans, f: meas.chords[0].f, techs: meas.techs };
      analysisRef.current = an;
      setAnalysis(an);
      if (meas.log && !meas.logShown) pushLog(meas.log, st.measureNo, kN);
      if (meas.log2 && !meas.log2Shown) pushLog(meas.log2, st.measureNo, kN);
    }, time);

    if (meas.finalChord) {
      const vv = voiceChord(meas.chords[0], st);
      const notes = [vv.bass - 12, vv.bass, ...vv.ups];
      notes.forEach((n, i) => trigger(n, measureSec * 2.2, time + i * 0.055, 0.95));
      drawTick(notes, time + 0.3);
      Tone.Transport.scheduleOnce((t) => {
        Tone.Draw.schedule(() => stopAll(), t);
      }, time + measureSec * 2.4);
      return;
    }

    const mode = settingsRef.current.genMode;
    if (mode === "aria") {
      playAriaMeasure(meas, time, measureSec, st, nextMeas && nextMeas.chords ? nextMeas : null);
      return;
    }
    const halves = meas.chords.length === 1 ? [meas.chords[0], meas.chords[0]] : meas.chords;
    halves.forEach((ch, hi) => {
      const t0 = time + hi * (measureSec / 2);
      const sameChord = hi === 1 && meas.chords.length === 1;
      const vv = sameChord && st.lastVoicing ? st.lastVoicing : voiceChord(ch, st);
      st.lastVoicing = vv;
      if (mode === "prelude") playPreludeHalf(ch, vv, t0, six);
      else playInventionHalf(ch, vv, t0, six, meas, st);
    });
  }, []); // eslint-disable-line

  /* ---------- 開始/停止 ---------- */
  const startAll = async () => {
    await Tone.start();
    // iOSサイレントスイッチ対策:無音メディアを併走させて再生カテゴリをメディアに固定
    try {
      if (!silentRef.current) silentRef.current = silentAudioEl();
      silentRef.current.play().catch(() => {});
    } catch (e) {}
    // 画面スリープ抑止(対応環境のみ)
    if (navigator.wakeLock && !wakeRef.current) {
      try {
        wakeRef.current = await navigator.wakeLock.request("screen");
        wakeRef.current.addEventListener("release", () => { wakeRef.current = null; });
      } catch (e) {}
    }
    ensureAudio();
    await buildBuffers(); // 全弦をKarplus-Strongでレンダリング(調律)
    applyLute(settingsRef.current.lute);
    const [tonicStr, mode] = settingsRef.current.startKey.split(":");
    stRef.current = {
      key: { tonic: parseInt(tonicStr, 10), mode },
      queue: [],
      measureNo: 0,
      sincePAC: 0,
      sinceMod: 0,
      modAfter: 7,
      deceived: false,
      sectionNew: true,
      subjectIdx: Math.floor(Math.random() * SUBJECTS.length),
      swap: false,
      prevBass: null,
      prevUppers: null,
      prevRH: null,
      prevLH: null,
      endRequested: false,
      finalMade: false,
      stopped: false,
    };
    setLogs([]);
    setEnding(false);
    midiRef.current = [];
    baseRef.current = Tone.now() + 0.1;
    const isOrgan = isOrganMode(settingsRef.current.genMode);
    pushLog(GLOSS.tuning415(), 0, keyName(stRef.current.key));
    if (settingsRef.current.genMode === "aria") pushLog(GLOSS.aria(), 0, keyName(stRef.current.key));
    if (isOrgan) pushLog(GLOSS.organum(), 0, keyName(stRef.current.key));
    if (isLuteMode(settingsRef.current.genMode)) pushLog(GLOSS.lute(), 0, keyName(stRef.current.key));
    Tone.Transport.timeSignature = 4;
    Tone.Transport.bpm.value = settingsRef.current.bpm;
    repeatIdRef.current = Tone.Transport.scheduleRepeat(onMeasure, "1m", 0);
    Tone.Transport.start("+0.1");
    setPlaying(true);
  };

  const stopAll = () => {
    if (stRef.current) stRef.current.stopped = true;
    if (repeatIdRef.current !== null) Tone.Transport.clear(repeatIdRef.current);
    Tone.Transport.stop();
    Tone.Transport.cancel();
    Tone.Transport.bpm.value = settingsRef.current.bpm;
    vizQueueRef.current = [{ t: 0, notes: [] }]; // 全消灯
    try { if (silentRef.current) silentRef.current.pause(); } catch (e) {}
    try { if (wakeRef.current) { wakeRef.current.release(); wakeRef.current = null; } } catch (e) {}
    setPlaying(false);
    setEnding(false);
    setActive([]);
  };

  const requestEnd = () => {
    if (stRef.current) {
      stRef.current.endRequested = true;
      if (isOrganMode(settingsRef.current.genMode)) stRef.current.queue = [];
      setEnding(true);
    }
  };

  /* ---------- 録画(キャンバス映像+マスター音声) ---------- */
  const startRecording = async () => {
    if (!window.MediaRecorder) {
      pushLog(isJa() ? { title: "録画未対応", body: "このブラウザはMediaRecorderに対応していません。" } : { title: "Recording unsupported", body: "This browser does not support MediaRecorder." }, 0, "—");
      return;
    }
    await Tone.start();
    const a = ensureAudio();
    const ctx = Tone.getContext().rawContext;
    // 音声トラックは録画のたびに新規作成:古いトラックの使い回しはA/Vの基準時刻ずれを生む
    const recDest = ctx.createMediaStreamDestination();
    // MediaRecorderのマルチプレクサ偏移(映像が遅れて記録される)を、音声側の固定ディレイで相殺する
    const avDelay = ctx.createDelay(2.5);
    avDelay.delayTime.value = settingsRef.current.recDelay;
    Tone.connect(a.master, avDelay);
    avDelay.connect(recDest);
    const canvas = canvasRef.current;
    if (!canvas.captureStream) {
      pushLog(isJa() ? { title: "録画未対応", body: "このブラウザはcanvas.captureStreamに対応していません。" } : { title: "Recording unsupported", body: "This browser does not support canvas.captureStream." }, 0, "—");
      return;
    }
    const isOrganNow = () => isOrganMode(settingsRef.current.genMode);
    // 録画は録画専用の点灯走査:出力レイテンシ補正なし(ファイル内の音声は無遅延のため)
    const recNotes = () => latestVizNotes(vizQueueRef.current, Tone.getContext().rawContext.currentTime) || [];
    drawRecFrame(canvas, analysisRef.current, recNotes(), latestLogRef.current, isOrganNow());
    const stream = canvas.captureStream(); // コンポジタ駆動:表示中のcanvasは画面合成と同時にフレームが確定する
    const vTrack = stream.getVideoTracks()[0];
    recDest.stream.getAudioTracks().forEach((t) => stream.addTrack(t));
    // MP4を最優先で試行(Safari/Chrome126+/Edge対応)。不可の場合のみWebMへ
    const mimes = [
      "video/mp4;codecs=avc1.64001F,mp4a.40.2",
      "video/mp4;codecs=avc1.42E01E,mp4a.40.2",
      "video/mp4;codecs=avc1,mp4a.40.2",
      "video/mp4",
      "video/webm;codecs=vp9,opus",
      "video/webm",
    ];
    const mime = mimes.find((m) => MediaRecorder.isTypeSupported(m)) || "";
    const isMp4 = mime.startsWith("video/mp4");
    pushLog(
      isMp4
        ? (isJa()
          ? { title: "録画開始(MP4)", body: `コンテナ:MP4/コーデック:${mime.includes("avc1") ? "H.264+AAC" : "ブラウザ既定"}。A/V補正${Math.round(settingsRef.current.recDelay * 1000)}msを音声側に適用中。停止すると.mp4として保存されます。` }
          : { title: "Recording (MP4)", body: `Container: MP4 / codec: ${mime.includes("avc1") ? "H.264+AAC" : "browser default"}. A/V offset ${Math.round(settingsRef.current.recDelay * 1000)} ms applied to audio. Saved as .mp4 on stop.` })
        : (isJa()
          ? { title: "録画開始(WebM)", body: "このブラウザはMediaRecorderのMP4出力に未対応のためWebMで保存します。MP4が必要な場合はSafariまたはChrome 126以降をご利用ください。" }
          : { title: "Recording (WebM)", body: "This browser cannot record MP4 via MediaRecorder, so WebM will be saved. For MP4, use Safari or Chrome 126+." }),
      stRef.current?.measureNo ?? 0,
      "—"
    );
    const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
    const chunks = [];
    rec.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
    rec.onstop = () => {
      const ext = isMp4 ? "mp4" : "webm";
      dlBlob(new Blob(chunks, { type: mime || "video/webm" }), `bach-perpetuum-${Date.now()}.${ext}`);
      if (recRef.current) cancelAnimationFrame(recRef.current.raf);
      recRef.current = null;
      try { a.master.disconnect(avDelay); avDelay.disconnect(recDest); } catch (e) {}
    };
    rec.start(1000);
    recRef.current = { rec, raf: 0, delay: avDelay };
    setRecState(true);
    const loop = () => {
      if (!recRef.current) return;
      drawRecFrame(canvas, analysisRef.current, recNotes(), latestLogRef.current, isOrganNow());
      if (vTrack && vTrack.requestFrame) vTrack.requestFrame(); // 描画のたびに現在時刻でフレームを明示発行
      recRef.current.raf = requestAnimationFrame(loop);
    };
    loop();
  };
  const stopRecording = () => {
    if (recRef.current) recRef.current.rec.stop();
    setRecState(false);
  };

  const doExportMidi = () => {
    const evs = midiRef.current;
    if (!evs.length) {
      pushLog(isJa() ? { title: "MIDI書き出し", body: "まだ演奏イベントがありません。機関を始動してから書き出してください。" } : { title: "Export MIDI", body: "No performance events yet — start the engine first." }, 0, "—");
      return;
    }
    dlBlob(new Blob([exportMidi(evs)], { type: "audio/midi" }), `bach-perpetuum-${Date.now()}.mid`);
    pushLog(isJa() ? { title: "MIDI書き出し完了", body: `${evs.length}音符をSMF format 1(Ch.1チェンバロ/Ch.2オルガン手鍵盤/Ch.3足鍵盤)として保存しました。リタルダンドを含む実演奏タイミングをそのまま保持しています。` } : { title: "MIDI exported", body: `${evs.length} notes saved as SMF format 1 (Ch.1 harpsichord / Ch.2 organ manuals / Ch.3 pedals), preserving real performance timing including the ritardando.` }, stRef.current?.measureNo ?? 0, "—");
  };

  useEffect(() => () => { try { stopAll(); } catch (e) {} }, []); // eslint-disable-line

  // モバイル:バックグラウンド復帰時にオーディオを再開し、画面スリープ抑止を取り直す
  useEffect(() => {
    const onVis = async () => {
      if (document.visibilityState !== "visible") return;
      try { const c = Tone.getContext().rawContext; if (c.state === "suspended") await c.resume(); } catch (e) {}
      if (playingRef.current && navigator.wakeLock && !wakeRef.current) {
        try {
          wakeRef.current = await navigator.wakeLock.request("screen");
          wakeRef.current.addEventListener("release", () => { wakeRef.current = null; });
        } catch (e) {}
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  /* ---------- UI ---------- */
  const S = styles;
  const funcColor = { T: "#c8a24a", S: "#5b7f6e", D: "#a4432f" };
  const funcLabel = { T: tUI("funcT"), S: tUI("funcS"), D: tUI("funcD") };

  const setS = (patch) => setSettings((s) => ({ ...s, ...patch }));

  return (
    <div style={S.page}>
      <div style={S.frame}>
        <header style={S.header}>
          <div style={S.eyebrow}>MACHINA PERPETUA · ANNO MMXXVI</div>
          <h1 style={S.title}>{tUI("h1")}</h1>
          <div style={S.subtitle}>{tUI("subtitle")}</div>
        </header>

        {/* 現在の解析 */}
        <section style={S.panel}>
          <div style={S.panelLabel}>{tUI("analysis")}</div>
          {analysis ? (
            <div>
              <div style={S.analysisRow}>
                <div style={S.romanBig}>{analysis.romans}</div>
                <div style={{ ...S.funcBadge, borderColor: funcColor[analysis.f], color: funcColor[analysis.f] }}>
                  {funcLabel[analysis.f]}
                </div>
              </div>
              <div style={S.analysisMeta}>
                {barStr(analysis.no)} · {analysis.keyN} · {tempName(settings.tempId)} · a′={settings.aFreq}Hz
              </div>
              <div style={S.chipRow}>
                {analysis.techs.map((t, i) => (
                  <span key={i} style={S.chip}>{tr(t)}</span>
                ))}
              </div>
            </div>
          ) : (
            <div style={S.idle}>{tUI("idleMain")}</div>
          )}
        </section>

        {/* 鍵盤 */}
        <section style={{ ...S.panel, padding: "10px 12px 6px" }}>
          <KeyboardViz
            organ={isOrganMode(settings.genMode)}
            queueRef={vizQueueRef}
            activeRef={activeRef}
          />
        </section>

        {/* 操作 */}
        <section style={S.panel}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <div style={S.panelLabel}>{tUI("console")}</div>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              {["ja", "en"].map((lg) => (
                <button key={lg} style={{ ...S.miniBtn, ...(settings.lang === lg ? { color: "#e9dcc0", borderColor: "#c8a24a" } : {}) }} onClick={() => setS({ lang: lg })}>
                  {lg === "ja" ? "日本語" : "EN"}
                </button>
              ))}
              <button style={S.miniBtn} onClick={() => setShowConsole((v) => !v)}>
                {showConsole ? tUI("hide") : tUI("show")}
              </button>
            </div>
          </div>
          <div style={S.btnRow}>
            {!playing ? (
              <button style={{ ...S.btnMain, opacity: tuning !== null ? 0.6 : 1 }} onClick={startAll} disabled={tuning !== null}>
                {tuning !== null ? `${tUI("tuning")}${Math.round(tuning * 100)}%` : tUI("start")}
              </button>
            ) : (
              <>
                <button style={{ ...S.btnMain, background: "#3a2b1c" }} onClick={stopAll}>{tUI("stop")}</button>
                <button style={{ ...S.btnGold, opacity: ending ? 0.5 : 1 }} onClick={requestEnd} disabled={ending}>
                  {ending ? tUI("endIng") : tUI("endGo")}
                </button>
              </>
            )}
          </div>

          <div style={S.btnRow}>
            {!recState ? (
              <button style={S.btnGold} onClick={startRecording}>{tUI("recStart")}</button>
            ) : (
              <button style={{ ...S.btnGold, borderColor: "#a4432f", color: "#e08070" }} onClick={stopRecording}>{tUI("recStop")}</button>
            )}
            <button style={S.btnGold} onClick={doExportMidi}>{tUI("midi")}</button>
          </div>

          <label style={{ ...S.ctrl, marginBottom: 12 }}>
            <span style={S.ctrlLabel}>{tUI("avsync")}={Math.round(settings.recDelay * 1000)}ms{tUI("avsyncNote")}</span>
            <input
              type="range" min={0} max={2000} step={10} value={Math.round(settings.recDelay * 1000)}
              style={S.slider}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10) / 1000;
                setS({ recDelay: v });
                if (recRef.current && recRef.current.delay) recRef.current.delay.delayTime.value = v;
              }}
            />
          </label>

          {recState && (
            <div style={{ fontSize: 11, color: "#a08c62", margin: "0 0 6px", letterSpacing: "0.05em" }}>
              {tUI("recPrev")}
            </div>
          )}
          <canvas
            ref={canvasRef}
            width={1280}
            height={720}
            style={
              recState
                ? { width: "100%", height: "auto", display: "block", border: "1px solid #3a2b1c", borderRadius: 6, marginBottom: 12, background: "#14100b" }
                : { display: "none" }
            }
          />

          {showConsole && (<>
          <div style={S.ctrlGrid}>
            <label style={S.ctrl}>
              <span style={S.ctrlLabel}>{tUI("era")}</span>
              <select
                style={S.select}
                value={settings.era}
                onChange={(e) => {
                  const v = e.target.value;
                  const wasOrgan = isOrganMode(settings.genMode);
                  const gm = v === "weimar" ? (wasOrgan ? settings.genMode : "toccata") : wasOrgan ? "aria" : settings.genMode;
                  setS({ era: v, genMode: gm });
                  if (stRef.current) stRef.current.queue = [];
                  if (isOrganMode(gm) && playing && stRef.current) pushLog(GLOSS.organum(), stRef.current.measureNo, keyName(stRef.current.key));
                }}
              >
                <option value="weimar">{tUI("eraW")}</option>
                <option value="koethen">{tUI("eraK")}</option>
                <option value="leipzig">{tUI("eraL")}</option>
              </select>
            </label>
            <label style={S.ctrl}>
              <span style={S.ctrlLabel}>{tUI("style")}</span>
              <select
                style={S.select}
                value={settings.genMode}
                onChange={(e) => {
                  const v = e.target.value;
                  const swapInst = isLuteMode(v) !== isLuteMode(settings.genMode);
                  setS({ genMode: v });
                  if (stRef.current) stRef.current.queue = [];
                  if (v === "aria" && playing && stRef.current) pushLog(GLOSS.aria(), stRef.current.measureNo, keyName(stRef.current.key));
                  // チェンバロ↔リュートは弦そのものが違うので張り替える
                  if (swapInst && playing) {
                    buildBuffers();
                    if (stRef.current) pushLog(isLuteMode(v) ? GLOSS.lute() : GLOSS.tuning415(), stRef.current.measureNo, keyName(stRef.current.key));
                  }
                }}
              >
                {settings.era === "weimar" ? (
                  <>
                    <option value="toccata">{tUI("mToc")}</option>
                    <option value="chorale">{tUI("mCho")}</option>
                    <option value="passacaglia">{tUI("mPas")}</option>
                  </>
                ) : (
                  <>
                    <option value="aria">{tUI("mAria")}</option>
                    <option value="prelude">{tUI("mPre")}</option>
                    <option value="invention">{tUI("mInv")}</option>
                    <option value="bourree">{tUI("mBour")}</option>
                  </>
                )}
              </select>
            </label>
            <label style={S.ctrl}>
              <span style={S.ctrlLabel}>{tUI("startKey")}{playing ? tUI("nextStart") : ""}</span>
              <select style={S.select} value={settings.startKey} onChange={(e) => setS({ startKey: e.target.value })}>
                {[0, 7, 2, 9, 5, 10].map((t) => (
                  <option key={"M" + t} value={`${t}:major`}>{keyName({ tonic: t, mode: "major" })}</option>
                ))}
                {[9, 4, 2, 7, 0, 11].map((t) => (
                  <option key={"m" + t} value={`${t}:minor`}>{keyName({ tonic: t, mode: "minor" })}</option>
                ))}
              </select>
            </label>
            <label style={S.ctrl}>
              <span style={S.ctrlLabel}>{tUI("temperament")}{playing ? tUI("retune") : ""}</span>
              <select style={{ ...S.select, opacity: playing ? 0.5 : 1 }} disabled={playing} value={settings.tempId} onChange={(e) => setS({ tempId: e.target.value })}>
                <option value="werck3">{tUI("tempW")}</option>
                <option value="equal">{tUI("tempE")}</option>
              </select>
            </label>
            <label style={S.ctrl}>
              <span style={S.ctrlLabel}>{tUI("pitch")}{playing ? tUI("retune") : ""}</span>
              <select style={{ ...S.select, opacity: playing ? 0.5 : 1 }} disabled={playing} value={settings.aFreq} onChange={(e) => setS({ aFreq: parseInt(e.target.value, 10) })}>
                <option value={415}>{tUI("p415")}</option>
                <option value={440}>{tUI("p440")}</option>
              </select>
            </label>
            <label style={{ ...S.ctrl, gridColumn: "1 / -1" }}>
              <span style={S.ctrlLabel}>{tUI("tempo")} ♩={settings.bpm}</span>
              <input
                type="range" min={44} max={104} value={settings.bpm}
                style={S.slider}
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10);
                  setS({ bpm: v });
                  if (playing) Tone.Transport.bpm.value = v;
                }}
              />
            </label>
            <label style={{ ...S.ctrl, gridColumn: "1 / -1" }}>
              <span style={S.ctrlLabel}>{tUI("volume")}={Math.round(settings.vol * 100)}%</span>
              <input
                type="range" min={40} max={160} value={Math.round(settings.vol * 100)}
                style={S.slider}
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10) / 100;
                  setS({ vol: v });
                  if (audioRef.current) audioRef.current.vol.gain.rampTo(v, 0.1);
                }}
              />
            </label>
            <label style={{ ...S.ctrl, gridColumn: "1 / -1" }}>
              <span style={S.ctrlLabel}>{tUI("air")}={Math.round(settings.air * 100)}%</span>
              <input
                type="range" min={0} max={100} value={Math.round(settings.air * 100)}
                style={S.slider}
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10) / 100;
                  setS({ air: v });
                  if (audioRef.current) {
                    audioRef.current.roomGain.gain.rampTo(v * 0.7, 0.2);
                    audioRef.current.cathGain.gain.rampTo(0.4 + v * 0.7, 0.2);
                  }
                }}
              />
            </label>
          </div>

          <div style={S.panelLabel}>{isOrganMode(settings.genMode) ? tUI("orgStops") : isLuteMode(settings.genMode) ? tUI("lutStops") : tUI("cembStops")}</div>
          <div style={S.stopRow}>
            {(isOrganMode(settings.genMode)
              ? [
                  ["orgP8", tUI("oP8")],
                  ["orgO4", tUI("oO4")],
                  ["orgMix", tUI("oMix")],
                  ["orgPed", tUI("oPed")],
                ]
              : isLuteMode(settings.genMode)
              ? [
                  ["stop8a", tUI("luMain")],
                  ["stop8b", tUI("luCourse")],
                  ["stop4", tUI("luOct")],
                ]
              : [
                  ["stop8a", tUI("st8a")],
                  ["stop8b", tUI("st8b")],
                  ["stop4", tUI("st4")],
                  ["lute", tUI("stLute")],
                ]
            ).map(([key, label]) => {
              const on = settings[key];
              return (
                <button
                  key={key}
                  style={{ ...S.stopKnob, ...(on ? S.stopOn : {}) }}
                  onClick={() => {
                    const patch = { [key]: !on };
                    setS(patch);
                    if (key === "lute") applyLute(!on);
                  }}
                >
                  <span style={{ ...S.knobDot, background: on ? "#c8a24a" : "#3a2b1c" }} />
                  {label}
                </button>
              );
            })}
          </div>
          </>)}
        </section>

        {/* 解説ログ */}
        <section style={S.panel}>
          <div style={S.panelLabel}>{tUI("comm")}</div>
          <div style={S.logBox}>
            {logs.length === 0 && <div style={S.idle}>{tUI("logIdle")}</div>}
            {logs.map((l) => (
              <div key={l.id} style={S.logEntry}>
                <div style={S.logHead}>
                  <span style={S.logNo}>{barStr(l.no)}</span>
                  <span style={S.logKey}>{l.keyN}</span>
                </div>
                <div style={S.logTitle}>{l.title}</div>
                <div style={S.logBody}>{l.body}</div>
              </div>
            ))}
          </div>
        </section>

        <footer style={S.footer}>{tUI("footer")}</footer>
      </div>
    </div>
  );
}

/* iOSのサイレントスイッチでWebAudioが消音されるのを防ぐための無音メディア要素 */
function silentAudioEl() {
  const sr = 8000, n = 800;
  const bytes = new Uint8Array(44 + n * 2);
  const dv = new DataView(bytes.buffer);
  const w = (o, s) => { for (let i = 0; i < s.length; i++) bytes[o + i] = s.charCodeAt(i); };
  w(0, "RIFF"); dv.setUint32(4, 36 + n * 2, true); w(8, "WAVE"); w(12, "fmt ");
  dv.setUint32(16, 16, true); dv.setUint16(20, 1, true); dv.setUint16(22, 1, true);
  dv.setUint32(24, sr, true); dv.setUint32(28, sr * 2, true); dv.setUint16(32, 2, true); dv.setUint16(34, 16, true);
  w(36, "data"); dv.setUint32(40, n * 2, true);
  const au = new Audio(URL.createObjectURL(new Blob([bytes], { type: "audio/wav" })));
  au.loop = true;
  return au;
}

/* ---------- 鍵盤canvas描画(SVG/Reactを経由しない低遅延パス) ---------- */
function drawKeysCanvas(cv, act, organ) {
  const g = cv.getContext("2d");
  g.clearRect(0, 0, cv.width, cv.height);
  const wPcs = [0, 2, 4, 5, 7, 9, 11];
  const items = (act || []).map((a) => (typeof a === "number" ? { m: a, man: 1 } : a));
  const setFor = (man) => new Set(items.filter((i) => (i.man ?? 1) === man).map((i) => i.m));
  const manual = (x0, y0, ww, h, actSet, light) => {
    let x = x0;
    const blacks = [];
    for (let m = 36; m <= 96; m++) {
      if (wPcs.includes(pcOf(m))) {
        g.fillStyle = actSet.has(m) ? "#c8a24a" : light ? "#e6dcc4" : "#2a2016";
        g.fillRect(x, y0, ww - 1.4, h);
        g.strokeStyle = "#4a3826";
        g.strokeRect(x, y0, ww - 1.4, h);
        x += ww;
      } else blacks.push([x - ww * 0.34, m]);
    }
    blacks.forEach(([bx, m]) => {
      g.fillStyle = actSet.has(m) ? "#e0b854" : light ? "#241a12" : "#d9cdb0";
      g.fillRect(bx, y0, ww * 0.62, h * 0.62);
    });
  };
  if (organ) {
    const ww = 940 / 36;
    g.fillStyle = "#8a744d";
    g.font = "15px Georgia, serif";
    g.textAlign = "left";
    g.fillText("II", 6, 40);
    manual(64, 6, ww, 62, setFor(2), true);
    g.fillText("I", 6, 118);
    manual(40, 84, ww, 62, setFor(1), true);
    g.fillText("Ped", 2, 205);
    const sp = setFor(0);
    const n = 32, pw = 940 / n;
    for (let i = 0; i < n; i++) {
      const m = 24 + i, sharp = !wPcs.includes(pcOf(m));
      g.fillStyle = sp.has(m) ? "#c8a24a" : sharp ? "#241a12" : "#7a6647";
      g.fillRect(40 + i * pw, sharp ? 168 : 176, pw - 1.6, sharp ? 40 : 70);
    }
  } else {
    const ww = 970 / 36;
    manual(20, 4, ww, 108, new Set(items.map((i) => i.m)), false);
  }
}

/* タイムラインから基準時刻以前の最新の点灯状態を取得(非破壊) */
function latestVizNotes(list, deadline) {
  for (let i = list.length - 1; i >= 0; i--) {
    if (list[i].t <= deadline) return list[i].notes;
  }
  return null;
}

/* オーディオクロック直結の鍵盤表示:出力レイテンシも補正して耳と同期させる */
function KeyboardViz({ organ, queueRef, activeRef }) {
  const ref = useRef(null);
  useEffect(() => {
    const cv = ref.current;
    cv.width = 1010;
    cv.height = organ ? 252 : 118;
    drawKeysCanvas(cv, activeRef.current, organ);
    let raf;
    let last = null;
    const loop = () => {
      const ctx = Tone.getContext().rawContext;
      const lat = ctx.outputLatency || ctx.baseLatency || 0;
      // 耳に届く時刻に合わせる:スケジュール時刻tの音が聞こえるのはt+lat
      const notes = latestVizNotes(queueRef.current, ctx.currentTime - lat);
      if (notes !== null && notes !== last) {
        last = notes;
        activeRef.current = notes;
        drawKeysCanvas(cv, notes, organ);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [organ]); // eslint-disable-line
  return <canvas ref={ref} style={{ width: "100%", display: "block" }} />;
}

/* ---------- 鍵盤(チェンバロ配色:白鍵が黒/黒鍵が白) ---------- */
function Keyboard({ active }) {
  const lo = 36, hi = 96;
  const whitePcs = [0, 2, 4, 5, 7, 9, 11];
  const whites = [], blacks = [];
  let wx = 0;
  for (let m = lo; m <= hi; m++) {
    const p = pcOf(m);
    if (whitePcs.includes(p)) {
      whites.push({ m, x: wx });
      wx += 14;
    } else {
      blacks.push({ m, x: wx - 5 });
    }
  }
  const act = new Set((active || []).map((a) => (typeof a === "number" ? a : a.m)));
  return (
    <svg viewBox={`0 0 ${wx} 58`} style={{ width: "100%", display: "block" }}>
      {whites.map((k) => (
        <rect key={k.m} x={k.x} y={0} width={13} height={56} rx={1.5}
          fill={act.has(k.m) ? "#c8a24a" : "#2a2016"} stroke="#4a3826" strokeWidth={0.6} />
      ))}
      {blacks.map((k) => (
        <rect key={k.m} x={k.x} y={0} width={9} height={34} rx={1}
          fill={act.has(k.m) ? "#e0b854" : "#d9cdb0"} stroke="#4a3826" strokeWidth={0.5} />
      ))}
    </svg>
  );
}

/* ---------- オルガンコンソール:2段手鍵盤+足鍵盤 ---------- */
function OrganConsole({ active }) {
  const items = (active || []).map((a) => (typeof a === "number" ? { m: a, man: 1 } : a));
  const setFor = (man) => new Set(items.filter((i) => (i.man ?? 1) === man).map((i) => i.m));
  const s2 = setFor(2), s1 = setFor(1), sp = setFor(0);
  const lo = 36, hi = 96, wPcs = [0, 2, 4, 5, 7, 9, 11];
  const manual = (yTop, hh, actSet, xoff, key) => {
    const els = [];
    let x = xoff;
    const blacks = [];
    for (let m = lo; m <= hi; m++) {
      if (wPcs.includes(pcOf(m))) {
        els.push(<rect key={key + m} x={x} y={yTop} width={10.4} height={hh} rx={1} fill={actSet.has(m) ? "#c8a24a" : "#e6dcc4"} stroke="#4a3826" strokeWidth={0.5} />);
        x += 11;
      } else blacks.push([x - 3.8, m]);
    }
    blacks.forEach(([bx, m]) => els.push(<rect key={key + "b" + m} x={bx} y={yTop} width={7} height={hh * 0.6} rx={0.8} fill={actSet.has(m) ? "#e0b854" : "#241a12"} stroke="#4a3826" strokeWidth={0.4} />));
    return els;
  };
  const pedal = (yTop, hh) => {
    const els = [];
    const n = 32, w = (36 * 11) / n;
    for (let i = 0; i < n; i++) {
      const m = 24 + i;
      const sharp = !wPcs.includes(pcOf(m));
      els.push(
        <rect key={"p" + m} x={24 + i * w} y={sharp ? yTop : yTop + 6} width={w - 1.2} height={sharp ? hh * 0.55 : hh - 6} rx={1}
          fill={sp.has(m) ? "#c8a24a" : sharp ? "#241a12" : "#7a6647"} stroke="#3a2b1c" strokeWidth={0.5} />
      );
    }
    return els;
  };
  const W = 36 * 11 + 44;
  return (
    <svg viewBox={`0 0 ${W} 124`} style={{ width: "100%", display: "block" }}>
      <text x={2} y={20} fontSize={9} fill="#8a744d">II</text>
      {manual(0, 32, s2, 28, "m2")}
      <text x={2} y={60} fontSize={9} fill="#8a744d">I</text>
      {manual(40, 32, s1, 16, "m1")}
      <text x={2} y={102} fontSize={9} fill="#8a744d">Ped</text>
      {pedal(84, 38)}
    </svg>
  );
}

/* ---------- スタイル ---------- */
const serif = '"Shippori Mincho", "Hiragino Mincho ProN", "Yu Mincho", "Noto Serif JP", Georgia, serif';
const styles = {
  page: {
    minHeight: "100vh",
    touchAction: "manipulation",
    WebkitTapHighlightColor: "transparent",
    background: "radial-gradient(ellipse at 50% -10%, #241a12 0%, #14100b 60%, #0d0a07 100%)",
    color: "#e9dcc0",
    fontFamily: serif,
    padding: "14px 10px 30px",
  },
  frame: {
    maxWidth: 760, margin: "0 auto",
    border: "1px solid #4a3826", borderRadius: 8, padding: "18px 14px 14px",
    background: "linear-gradient(180deg, #1c150e 0%, #171109 100%)",
    boxShadow: "0 0 0 4px #0d0a07, 0 0 0 5px #4a3826, 0 18px 50px rgba(0,0,0,0.6)",
  },
  header: { textAlign: "center", marginBottom: 14 },
  eyebrow: { fontSize: 10, letterSpacing: "0.35em", color: "#8a744d", marginBottom: 8 },
  title: { fontSize: 30, margin: 0, fontWeight: 600, letterSpacing: "0.12em", color: "#e9dcc0" },
  subtitle: { fontSize: 11, color: "#a08c62", marginTop: 8, letterSpacing: "0.06em", lineHeight: 1.7 },
  panel: {
    border: "1px solid #3a2b1c", borderRadius: 6, padding: "12px 14px",
    background: "rgba(233,220,192,0.03)", marginBottom: 12,
  },
  panelLabel: { fontSize: 10, letterSpacing: "0.3em", color: "#8a744d", marginBottom: 10 },
  miniBtn: {
    fontFamily: serif, fontSize: 11, letterSpacing: "0.08em",
    background: "transparent", color: "#a08c62", border: "1px solid #4a3826",
    borderRadius: 999, padding: "4px 12px", cursor: "pointer",
  },
  analysisRow: { display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" },
  romanBig: { fontSize: 32, fontStyle: "italic", color: "#e9dcc0", lineHeight: 1.1 },
  funcBadge: { border: "1px solid", borderRadius: 3, padding: "3px 9px", fontSize: 12, letterSpacing: "0.1em" },
  analysisMeta: { fontSize: 12, color: "#a08c62", marginTop: 8 },
  chipRow: { display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 },
  chip: {
    fontSize: 11, border: "1px solid #5a4630", borderRadius: 999, padding: "2px 10px",
    color: "#cdb98a", background: "rgba(200,162,74,0.07)",
  },
  idle: { fontSize: 13, color: "#8a744d", padding: "6px 0" },
  btnRow: { display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 },
  btnMain: {
    fontFamily: serif, fontSize: 15, letterSpacing: "0.15em",
    background: "#5c1f14", color: "#e9dcc0", border: "1px solid #7a3a24",
    borderRadius: 4, padding: "12px 22px", cursor: "pointer", flex: "1 1 auto",
  },
  btnGold: {
    fontFamily: serif, fontSize: 15, letterSpacing: "0.1em",
    background: "rgba(200,162,74,0.12)", color: "#c8a24a", border: "1px solid #c8a24a",
    borderRadius: 4, padding: "12px 22px", cursor: "pointer", flex: "1 1 auto",
  },
  ctrlGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 10, marginBottom: 14 },
  ctrl: { display: "flex", flexDirection: "column", gap: 5 },
  ctrlLabel: { fontSize: 11, color: "#a08c62", letterSpacing: "0.08em" },
  select: {
    fontFamily: serif, fontSize: 13, background: "#241a12", color: "#e9dcc0",
    border: "1px solid #4a3826", borderRadius: 4, padding: "8px 10px",
  },
  slider: { width: "100%", accentColor: "#c8a24a" },
  stopRow: { display: "flex", flexWrap: "wrap", gap: 8 },
  stopKnob: {
    fontFamily: serif, fontSize: 12, letterSpacing: "0.05em",
    display: "flex", alignItems: "center", gap: 8,
    background: "#241a12", color: "#a08c62", border: "1px solid #4a3826",
    borderRadius: 999, padding: "8px 14px", cursor: "pointer",
  },
  stopOn: { color: "#e9dcc0", borderColor: "#c8a24a", background: "rgba(200,162,74,0.1)" },
  knobDot: { width: 9, height: 9, borderRadius: "50%", display: "inline-block", boxShadow: "inset 0 0 2px rgba(0,0,0,0.6)" },
  logBox: { maxHeight: 320, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10 },
  logEntry: { borderLeft: "2px solid #5a4630", padding: "2px 0 2px 12px" },
  logHead: { display: "flex", gap: 10, fontSize: 10, color: "#8a744d", letterSpacing: "0.1em", marginBottom: 2 },
  logNo: {}, logKey: {},
  logTitle: { fontSize: 14, color: "#c8a24a", marginBottom: 3 },
  logBody: { fontSize: 12.5, color: "#cbbd9c", lineHeight: 1.8 },
  footer: { textAlign: "center", fontSize: 10, color: "#6b573a", letterSpacing: "0.2em", marginTop: 6 },
};
