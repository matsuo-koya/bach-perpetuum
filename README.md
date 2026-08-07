# 無限バッハ機関 — BACH PERPETUUM MOBILE

機能和声グラマーによってバッハ様式の音楽を永久に生成し続けるブラウザアプリです。撥弦物理モデル(Karplus-Strong拡張)によるチェンバロと倍音加算式パイプオルガンを実時間で合成し、生成中の和声・対位法をリアルタイムの楽典解説付きで表示します。

A browser app that perpetually generates Bach-style music from a functional-harmony grammar. A physically modeled (extended Karplus-Strong) harpsichord and an additive-synthesis pipe organ are rendered in real time, alongside live music-theory commentary on the harmony and counterpoint as it's generated.

## 特徴 / Features

- **永久生成**: 終わりのない機能和声(T–S–D–T)にもとづく生成。ハ長調から始めても五度圏を巡り、転調を重ねながら鳴り続けます。
- **様式**: トッカータとフーガ、コラール前奏曲、パッサカリア(オスティナート変奏)、アリア型、プレリュード型、インヴェンション型、リュート組曲のブーレ
- **時代様式**: ヴァイマル期(1708-17・オルガン)/ ケーテン期(1717-23)/ ライプツィヒ期(1723-50・円熟和声)
- **音律**: ヴェルクマイスターIII(1691)/ 十二平均律、基準音高 a′=415Hz(バロック・ピッチ)/ 440Hz
- **物理モデル音源**: 撥弦点コムフィルタ+周波数依存減衰+2弦デチューンのチェンバロ、ガット弦・複弦コースのリュート、レジストレーション可変のパイプオルガン
- **指板表示**: リュート様式では鍵盤に代えて11コースのバロック・リュートの指板を表示。フランス式タブラチュアの音位記号(a=開放、b=第1フレット…)で押さえる場所が光り、ディアパゾン(第7〜11コース)は転調に合わせて張り替わります
- **ブーレ(BWV 996)**: ホ短調リュート組曲のブーレを種とする2分の2拍子・弱起の舞曲。旋律と低音の10度平行の間に開放弦の保続音を挟む書法 — 少年のマッカートニーとハリスンがギターで覚え、Blackbirdの序奏に流れ込んだ手触りです
- **楽典実況**: 生成される和声・対位法上の技法(掛留、ゼクエンツ、ストレッタ等)を日本語/英語で解説
- **書き出し**: 演奏のMIDIエクスポート(SMF format 1)、録画のMP4保存

## 開発 / Development

```bash
npm install
npm run dev
```

ブラウザで表示されたURLを開き、「機関始動」を押してください。

```bash
npm run build   # 本番ビルド
npm run preview # ビルド結果のプレビュー
```

## 構成 / Structure

- `src/App.jsx` — アプリ本体(生成グラマー、音源合成、UI)
- `src/main.jsx` — エントリポイント
- `bach-perpetuum-mobile.jsx` — 単体コンポーネント版(このリポジトリの正本と同一。他プロジェクトへの組み込みや単体プレビュー用途)

## License

MIT — see [LICENSE](./LICENSE).

Soli Deo Gloria.
