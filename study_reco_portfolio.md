# StudyReco - アプリ詳細ドキュメント（ポートフォリオ・面接用）

---

## 1. 課題

### 誰が・どんな状況で・何に困っていたか

**対象ユーザー：** 毎日の学習を継続したいが、記録の習慣が定着しない学習者（学生・資格取得者など）

**具体的な課題：**

- 既存の学習記録アプリ（手動入力型）では「記録すること自体が作業・義務」になってしまい、継続の阻害要因になっていた
- 「学習を終えた後、日付・科目・時間をいちいち入力する」という3ステップの操作コストが高く、面倒になってそのまま記録しないことが多かった
- 記録したとしても「ただ数字が並ぶだけ」でフィードバックがなく、達成感・モチベーションにつながらなかった
- スマホ利用中（机上での長時間学習）に画面スリープでタイマーが止まるという実用上の問題があった

### 既存手段の不足点

- **アナログ手帳**：記録は残るが、統計・可視化ができない
- **一般的な学習アプリ**：入力フローが複数ステップあり、「記録するために操作する」ことが目的になりやすい
- **タイマーアプリ単体**：時間は計れるが、科目別の記録・集計・フィードバックがない

---

## 2. 解決アプローチ

### コンセプト：「行動と記録を直結させる」

**「記録する」ではなく「学習する行動そのものが記録になる」** 体験設計を軸に開発。

### コア機能・バリュープロポジション

1. **タイマー計測型記録** — 科目を選んで▶ボタンを押すだけで計測開始。停止ボタンで自動的に学習時間が確定。手入力ゼロ。
2. **保存直後のAIフィードバック** — 記録保存をトリガーにGemini AIが即座にコメント。「行動→報酬」の間隔を最小化し継続を促進。
3. **月次カレンダー×週次リストの連動** — カレンダーをタップするだけで対象週のデータが表示され、過去の振り返りを直感的に行える。

### なぜこのアプローチにしたか

行動心理学的に「行動と報酬の距離が近いほど継続率が上がる」という知見をもとに設計。
一般的なアプリは「入力という作業」を挟むが、本アプリでは学習行動自体がトリガーになることで、「記録したくなる」ではなく「記録されてしまう」状態を目指した。

---

## 3. 技術選定理由

### 技術スタック一覧

| カテゴリ | 技術・ライブラリ | バージョン |
|---|---|---|
| UIフレームワーク | React | 19.2.0 |
| 言語 | TypeScript | 5.9.3 |
| ビルドツール | Vite | 7.2.4 |
| スタイリング | CSS Modules | - |
| 認証 | Firebase Authentication（Googleログイン） | 12.8.0 |
| DB | Firebase Firestore | 12.8.0 |
| アナリティクス | Firebase Analytics | 12.8.0 |
| ホスティング | Firebase Hosting | - |
| グラフ | ApexCharts / react-apexcharts | 5.3.6 / 1.9.0 |
| AIアドバイス | Gemini 2.5 Flash API（REST） | - |
| アイコン | lucide-react | 0.563.0 |
| Web API | Screen Wake Lock API | ブラウザ標準 |

### 主要な選定理由

#### React + TypeScript + Vite
- **React**：コンポーネント分割・状態管理（useState/useEffect）によって「状態の単一情報源」設計を実現しやすいため採用
- **TypeScript**：`StudyRecord`型など、データ構造の型安全性を保証。コンパイル時に `duration` の型不一致（文字列/数値）を防ぐことができ、NaN問題の再発防止に効果的
- **Vite**：個人開発での高速な開発サイクル（HMR）と、`import.meta.env` によるAPIキーの環境変数管理が容易なため採用。CRAと比較してビルド速度が大幅に優れる

#### Firebase（Auth + Firestore + Hosting）
- **BaaSとして採用した理由**：個人開発においてバックエンドサーバーを構築・運用するコストを省略するため。認証・DB・ホスティングをFirebase一本で完結させることでインフラ管理の負担をゼロにした
- **Firestore**：リアルタイム同期は不要なため `getDocs`（一回読み込み）を採用。`where("uid", "==", user.uid)` によりユーザー単位のデータ分離を実現
- **Firebase Hosting**：`dist/` フォルダをそのままデプロイ可能。`firebase.json` の `rewrites` 設定でSPAのルーティング（全パスを `index.html` へ）も容易に対応できる
- **トレードオフ**：Firestoreは無料枠内で十分に動作するが、クエリの柔軟性に制限あり（複合インデックスが必要になるケース）。個人利用スケールでは問題なし

#### Gemini 2.5 Flash API
- **選定理由**：Google AI Studioで無料枠が十分にあり、個人開発コストゼロで高品質なテキスト生成が可能。Flashモデルはレイテンシが低く、保存直後の即座フィードバックに適している
- **Anthropic Claude APIとの比較**：どちらも高品質だが、Googleアカウントとの親和性（Firebase連携）からGeminiを採用
- **直接REST呼び出し採用の理由**：SDKをインストールするコストを避け、`fetch` APIで直接 `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent` を呼ぶ方式とした（`src/services/gemini.ts`）

#### CSS Modules
- **選定理由**：スコープ付きCSSによりコンポーネント間のスタイル衝突を防ぐ。Tailwindなどのユーティリティファーストと比べ、カスタムデザインの自由度が高く、個人開発では学習コストも低い

---

## 4. 設計

### 4-1. アーキテクチャ概要

```
┌─────────────────────────────────────────────────────────────┐
│                     ブラウザ（Firebase Hosting）              │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                    App.tsx（Root）                    │   │
│  │  - 全体の state 管理（records, user, currentDate）    │   │
│  │  - Firebase Auth / Firestore の CRUD                 │   │
│  │  - AI呼び出し (fetchAiComment)                       │   │
│  │  - フィルタリング（月次 / 週次）                      │   │
│  └──────────────┬───────────────────────────────────────┘   │
│                 │ Props（データ + コールバック）              │
│     ┌───────────┼──────────────────────────────────┐        │
│     ▼           ▼                    ▼              ▼        │
│  HeaderWithForm  Monthly          Ranking        AIComment  │
│  ├─ Header       ├─ カレンダー     ├─ 科目別       └─ ロボ   │
│  └─ StudyForm    └─ 月次統計       └─ 集計ランキング          │
│     └─ Timer                                                │
│                  BarChart         StudyList                 │
│                  └─ 週次棒グラフ   └─ StudyItem（編集/削除）  │
│                                                             │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP / Firebase SDK
        ┌──────────────────┼─────────────────┐
        ▼                  ▼                 ▼
  Firebase Auth      Firestore          Gemini API
  (Google OAuth)   (records コレクション)  (REST)
        │
  localStorage
  (タイマー永続化)
```

**フロントエンドのみ（BaaS構成）**：独自バックエンドサーバーは存在しない。
Firestore・Firebase Auth・Gemini APIに直接アクセスするクライアントサイド完結型アーキテクチャ。

---

### 4-2. データモデル設計

#### Firestore コレクション：`records`

```
records/
  └── {documentId} (auto-generated)
       ├── uid: string        // Firebase AuthのユーザーID（データ分離に使用）
       ├── date: string       // "YYYY-MM-DD" 形式
       ├── subject: string    // "英語" | "数学" | "国語" | "理科" | "社会"
       ├── duration: number   // 学習時間（秒・整数）
       └── createdAt: Date    // 保存日時
```

#### TypeScript型定義（`src/types/study.ts`）

```typescript
export type StudyRecord = {
  id: string       // Firestoreのdocument ID
  date: string
  subject: string
  duration: number // 秒単位（整数）
  comment?: string // 将来の拡張用（現在未使用）
}
```

#### 設計上の工夫

- **`duration` を秒単位（Integer）に統一**：v1.1.1 の設計刷新で「分（Float）」から「秒（Integer）」へ変更。変換誤差（NaN・端数）を根本的に排除。保存・集計・フィルタリングは全て秒で処理し、**表示直前でのみ** `HH:MM:SS` や `○時間○分` にフォーマット変換する（`src/types/timeFormatter.ts`）
- **uid によるデータ分離**：Firestore クエリに `where("uid", "==", user.uid)` を付与することで、他ユーザーのデータが混入しない設計。セキュリティルールとの二重防御（※Firestoreセキュリティルール側の設定は要確認）
- **科目マスタの定数管理**：`src/types/subject.ts` で `SUBJECTS` を `as const` で定義。コンポーネント間の科目名の一貫性を型レベルで保証

---

### 4-3. API / インターフェース設計

#### 画面遷移フロー

```
未ログイン画面
  └── Googleでログインボタン
        │ signInWithPopup
        ▼
メイン画面（シングルページ）
  ├── HeaderWithForm（ヘッダー + 記録フォーム）
  │    ├── 科目選択（セレクトボックス）
  │    ├── タイマー（▶/⏸ → 計測）
  │    └── 記録ボタン（停止後に出現）→ Firestore保存 → Gemini AI起動
  ├── MONTHLY セクション
  │    ├── カレンダー（月切替・日付クリック）
  │    ├── 月次統計（合計・平均）
  │    ├── 科目ランキング
  │    └── BarChart（週次棒グラフ）
  └── RECORD セクション
       └── 週次リスト（編集・削除）
```

#### Firestore CRUD操作（`App.tsx`）

| 操作 | 関数名 | 処理 |
|---|---|---|
| 取得 | `fetchRecords()` | `getDocs(query(..., where("uid", "==", user.uid)))` |
| 追加 | `addRecord(secondsFromTimer)` | `addDoc(collection(db, "records"), {...})` |
| 更新 | `updateRecord(updated)` | `updateDoc(doc(db, "records", id), {...})` |
| 削除 | `deleteRecord(id)` | `deleteDoc(doc(db, "records", id))` |

#### Gemini API呼び出し（`src/services/gemini.ts`）

- **エンドポイント**：`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`
- **APIキー管理**：`import.meta.env.VITE_GEMINI_API_KEY`（環境変数）
- **入力データ**：今回の科目・学習時間（分）、直近10件の学習履歴サマリ
- **出力**：200文字以内の日本語アドバイス（語尾「〜だロボ」）
- **エラー時のフォールバック**：`"今日も一歩前進だロボ！"` を返し、UI表示が途切れない設計

---

### 4-4. 状態管理・データフロー

#### 状態管理の設計（Reduxなし、React標準 useState のみ）

`App.tsx` が全体のルート状態を一元管理する **State Lifting Up パターン** を採用。

```
App.tsx（Single Source of Truth）
  ├── records: StudyRecord[]    // 全学習記録（Firebase同期済み）
  ├── user: User | null         // Firebase認証状態
  ├── currentDate: Date         // カレンダー表示・週次連動の基準日
  ├── subject: string           // 選択中の科目（localStorage復元対応）
  ├── date: string              // 今日の日付（固定値）
  ├── aiMsg: string             // AIコメント表示内容
  ├── isAiOpen: boolean         // AIポップオーバーの開閉状態
  └── loading: boolean          // 認証状態確認中のローディング
```

#### データフロー（記録保存時）

```
1. ユーザーが▶ボタンをタップ
       ↓
2. HeaderWithForm.tsx でタイマー開始
   - isActive = true
   - localStorage に startTime 保存（ページリロード対策）
   - Screen Wake Lock API でスリープ防止
       ↓
3. setInterval で1秒ごとに Date.now() - startTime を計算
   → seconds state を更新（HH:MM:SS 表示）
       ↓
4. ⏸ボタンでタイマー停止
   - accumulatedTime を localStorage に保存
   - 「記録」ボタンが出現
       ↓
5. 「記録」ボタン押下 → App.tsx の addRecord(seconds) 呼び出し
       ↓
6. Firestore に addDoc → ローカル state 更新
       ↓
7. fetchAiComment(subject, minutes, updatedRecords) を呼び出し
       ↓
8. Gemini API からレスポンス受信 → aiMsg 更新、isAiOpen = true
       ↓
9. AIComment コンポーネントがポップオーバー表示
```

#### フィルタリング設計

`App.tsx` 内で `currentDate` を基準に2種類のフィルタを計算：

- **`monthlyRecords`**：同年同月のレコードのみ（`Monthly`・`Ranking`・`BarChart` に渡す）
- **`weeklyRecords`**：`currentDate` を含む週（月〜日）のレコードのみ（`StudyList` に渡す）

---

### 4-5. 認証・認可設計

#### 認証方式：Firebase Authentication（Google Sign-In）

```typescript
// firebase.ts
export const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence);  // ブラウザ再起動後もログイン維持
export const googleProvider = new GoogleAuthProvider();

// App.tsx
await signInWithPopup(auth, googleProvider);  // ポップアップウィンドウでOAuth
```

#### セッション管理

- **`browserLocalPersistence`** を明示的に設定。ブラウザを閉じても再ログイン不要（localStorageにトークン保存）
- `onAuthStateChanged` でアプリ起動時に認証状態を復元。ローディング中は `<div>Loading...</div>` を表示し、未認証時はログイン画面のみレンダリング（メイン画面は表示されない）
- Firebase IDトークンはSDK内部で自動管理・自動更新（有効期限1時間）

#### データ認可

- Firestore のクエリレベルで `where("uid", "==", user.uid)` によるユーザーデータ分離を実装
- ※ Firestoreセキュリティルール（Firebase Console側）の内容はコードから確認できないため「要確認」

---

### 4-6. インフラ・デプロイ構成

#### ホスティング：Firebase Hosting

```json
// firebase.json
{
  "hosting": {
    "public": "dist",
    "rewrites": [{ "source": "**", "destination": "/index.html" }]
  }
}
```

- `vite build` → `dist/` → `firebase deploy` の3コマンドでデプロイ完了
- SPA対応のため全パスを `index.html` にリダイレクト（`rewrites` 設定）

#### ビルド設定（vite.config.ts）

```typescript
export default defineConfig({
  base: "./",  // 相対パスでアセット参照（Firebase Hosting互換）
  plugins: [react()],
})
```

#### 環境変数管理

- `VITE_GEMINI_API_KEY`：Viteの環境変数として管理（`.env` ファイル）
- Firebase設定値（apiKey等）は `src/firebase.ts` にハードコード（※Firebase APIキーはフロントエンドに公開前提の設計。セキュリティはFirebaseセキュリティルール側で担保）

#### コスト最適化

- Firebase Spark（無料）プランで運用。Firestore読み書き・Hosting帯域ともに個人利用スケールでは無料枠内に収まる
- Gemini APIも無料枠利用（Google AI Studio経由）
- バックエンドサーバーゼロ構成のため月額ランニングコスト実質0円

---

## 5. 実装の工夫

### パフォーマンス改善

#### `useMemo` による不要な再計算の防止（`src/components/BarChart.tsx`）

```typescript
// 週の範囲計算：weekOffset が変わった時だけ再計算
const range = useMemo(() => { ... }, [weekOffset])

// 集計ロジック：records または range が変わった時だけ再計算
const series = useMemo(() => { ... }, [records, range])

// チャート設定：初回のみ生成
const options: ApexOptions = useMemo(() => ({ ... }), [])
```

`BarChart` の集計処理は全レコードをループするため計算コストが高い。`useMemo` で依存関係を明示し、不要な再レンダリングでの再計算を回避。

#### localStorage を使ったタイマー永続化（`src/components/HeaderWithForm.tsx`）

```typescript
// 開始時刻をlocalStorageに保存（ページリロード・画面外遷移対策）
localStorage.setItem("studyStartTime", startTime.toString());

// 復元時：Date.now() から開始時刻を引いて経過秒を即時計算
const currentSeconds = Math.floor((Date.now() - start) / 1000);
```

ページをリロードしてもタイマーが継続する。科目選択状態も `localStorage.setItem("studySelectedSubject", val)` で保存し、再訪問時に復元（`App.tsx:22-29`）。

---

### UX向上のための実装

#### Screen Wake Lock API による画面スリープ防止（`HeaderWithForm.tsx:32-50`）

```typescript
const requestWakeLock = async () => {
  if ('wakeLock' in navigator) {
    wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
  }
};
```

スマホを机に置いて長時間学習しても画面が消えずタイマーが止まらない。`useRef` で WakeLock インスタンスを管理し、タイマー停止・保存時に `release()` する。

#### `Date.now()` 差分方式によるタイマー精度向上（`HeaderWithForm.tsx:86-89`）

```typescript
interval = setInterval(() => {
  const nextSeconds = Math.floor((Date.now() - startTime) / 1000);
  setSeconds(nextSeconds);
}, 1000);
```

従来の「1秒ずつ加算する方式」では、バックグラウンド処理でJavaScriptの実行が間引かれた際にズレが発生していた。開始時刻との差分計算方式に変更することで、スマホ切り替え・一時停止からの復帰後でも正確な経過時間を保証。

#### カレンダーとリストのスムーズスクロール連動（`App.tsx:192-196`）

```typescript
const handleDateSelect = (newDate: Date) => {
  setCurrentDate(newDate);
  const section = document.querySelector('.sectionTitle2');
  if (section) section.scrollIntoView({ behavior: 'smooth' });
};
```

カレンダーの日付をクリックすると、その日を含む週のリストセクションまで自動スクロール。ユーザーが手動でスクロールする手間を省く。

#### 選択日のハイライト表示（`StudyList.tsx:63`）

```typescript
<li className={`${styles.dayRow} ${isSelected ? styles.highlight : ''}`}>
```

カレンダーでクリックした日付が週次リスト内でハイライト表示され、編集対象を瞬時に特定できる。

#### AIコメントのフォールバック設計（`gemini.ts:50-53`）

```typescript
return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "今日もナイスだロボ！";
// catch: return "今日も一歩前進だロボ！";
```

Gemini APIが失敗・タイムアウトしても、フォールバック文字列を返すことでUIが壊れない。`?.` チェーンでAPIレスポンス構造の変化にも耐性を持たせている。

---

### コード品質・保守性への取り組み

#### データ層と表示層の責務分離

- **データ層**：全処理を秒（Integer）で統一。`duration` フィールドは常に秒数
- **表示層**：`src/types/timeFormatter.ts` の `formatToHMS()` / `formatToHM()` を各コンポーネントで呼び出すことで、変換ロジックを一箇所に集約

```typescript
// timeFormatter.ts
export const formatToHMS = (totalSeconds: number): string => {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${String(h).padStart(2, '0')} : ${String(m).padStart(2, '0')} : ${String(s).padStart(2, '0')}`;
};
```

#### 型安全性の徹底

- `StudyRecord` 型で `duration: number`（秒単位）を明示。string/number の混在を型レベルで防止
- `SUBJECTS` を `as const` で定義し、科目名の typo をコンパイル時に検出
- `AiState` インターフェース（`src/types/index.ts`）で AI 状態の構造を型定義

#### Gemini API のサービス分離

AI呼び出しロジックを `src/services/gemini.ts` に切り出し、`App.tsx` との責務を分離。API仕様変更時の修正範囲を限定し、テスタビリティも向上。

---

## 6. 運用ログ（改善の記録）

### バージョン履歴サマリー

| バージョン | 日付 | 主な変更 | カテゴリ |
|---|---|---|---|
| 1.0.0 | 2026-01-28 | 初回リリース、Firebase Hosting デプロイ | リリース |
| 1.0.1 | 2026-01-29 | Firebase CRUD・Analytics 追加 | 機能追加 |
| 1.0.2 | 2026-02-03 | Firebase Authentication 追加 | 機能追加 |
| 1.0.3 | 2026-02-04 | Safari 日付入力 UI 修正 | バグ修正 |
| 1.0.4 | 2026-02-04 | 月間統計・ランキング連動 + React フック順序修正 | 機能改善・バグ修正 |
| 1.0.5 | 2026-02-06 | 日付自動表示（手入力廃止） | UX改善 |
| 1.1.1 | 2026-02-08 | タイマー計測方式・秒単位データ管理・HH:MM:SS対応 | アーキテクチャ刷新 |
| 1.1.2 | 2026-02-11 | Screen Wake Lock・差分計算方式 | バグ修正・信頼性向上 |
| 1.1.3 | 2026-02-14 | カレンダー×週次リスト連動・ハイライト | 機能追加・UX改善 |
| 1.2.0 | 2026-02-19 | AI学習アドバイザー（Gemini連携）追加 | 機能追加 |

---

### 注目すべき改善ストーリー（面接で話せる粒度）

#### ① NaN問題の根本解消（v1.1.1 - データ管理の再設計）

**問題発見：** タイマー計測値を分（Float）で管理していたため、秒数との変換過程で `3.5 * 60 = 210.0000000001` のような浮動小数点誤差が発生。統計コンポーネントで `NaN` が表示されるバグが頻発。

**原因分析：** データ保存時は分（Float）、タイマーは秒（Integer）という二重管理がバグの温床だった。

**解決策：** アプリ全体のデータを「秒（Integer）」で統一する設計刷新を実施。
- `duration` を秒（number）で統一
- Firestore保存値も秒に変更
- 表示変換は `timeFormatter.ts` に集約
- 結果：NaNエラー完全解消、タイマー・記録リスト・統計間の整合性100%担保

**学習した設計原則：** 「データ層は1種類の単位に統一し、表示変換はUI層にのみ行う」

---

#### ② スマホスリープ問題の解決（v1.1.2 - Screen Wake Lock + 差分計算）

**問題発見：** 実際にスマホを机に置いて30分学習したところ、画面がスリープしてJavaScriptの `setInterval` が間引かれ、タイマーが実際の経過時間より少なく計測されるバグを発見。

**解決策1 - Screen Wake Lock API：** タイマー計測中に `navigator.wakeLock.request('screen')` を呼び出し、画面の自動消灯を防ぐ。タイマー停止・保存時に `release()` で解除。

**解決策2 - 差分計算方式への移行：** `setInterval` で1秒加算する方式から、`Date.now() - startTime` の差分を毎秒計算する方式に変更。これにより、一時停止や画面復帰後でも正確な経過時間が即時反映される。

**LocalStorage活用：** `startTime` を LocalStorage に保存することで、ページリロード後も計測を継続できる。

**結果：** 長時間学習（1時間以上）でも計測精度が保証され、実用性が大幅向上。

---

#### ③ 状態の不整合問題（v1.0.4 - State Lifting Up）

**問題発見：** 月カレンダーで「2月」に切り替えても、ランキング・グラフが全期間合計を表示し続けるバグ。「今月のランキング」と表示しているにもかかわらず、過去の記録も含まれてしまっていた。

**原因分析：** `viewDate`（表示月）の状態が各コンポーネントにバラバラに存在し、カレンダーの月変更が他コンポーネントに伝わっていなかった。

**解決策：** 状態リフトアップ（State Lifting Up）パターンを適用。`viewDate` を `App.tsx` の `currentDate` state として一元管理し、各子コンポーネントに Props として渡す設計に刷新。`monthlyRecords` のフィルタリングも `App.tsx` 側で行い、全コンポーネントが同一の基準日を参照するように変更。

**学習した設計原則：** 「複数コンポーネントが参照する状態は、共通の親にリフトアップする（Single Source of Truth）」

---

#### ④ Reactフック呼び出し順序バグ（v1.0.4 - バグ修正）

**問題：** ログイン状態判定（早期リターン）より前に `useState` を定義していなかったため、「Hooks called in different order」という React エラーが発生。

**解決：** Reactのフックルール（条件分岐より前にフックを宣言する）に従い、全 `useState` 定義を条件分岐より上に移動。

---

### カテゴリ別分類

**バグ修正：**
- v1.0.3：Safari での `input[type="date"]` の視認性問題
- v1.0.4：Reactフック呼び出し順序エラー
- v1.1.1：NaN・時間計算精度問題
- v1.1.2：スマホスリープによるタイマー停止問題
- v1.1.3：過去データのフィルタリング不整合

**機能追加：**
- v1.0.1：Firebase CRUD・Analytics
- v1.0.2：認証（Googleログイン）
- v1.1.3：カレンダー×週次リスト連動・ハイライト
- v1.2.0：Gemini AI アドバイザー

**アーキテクチャ改善：**
- v1.0.4：State Lifting Up（viewDate の一元管理）
- v1.0.5：日付自動表示（手入力廃止）
- v1.1.1：秒単位データ管理・タイマー計測方式への全面移行

---

## 7. 今後の課題

### 優先度：高

#### 1. Firestoreセキュリティルールの確認・強化
- **課題：** `src/firebase.ts` 側では `where("uid", "==", user.uid)` でデータ分離しているが、Firestoreコンソール側のセキュリティルールが適切に設定されているか未確認（要確認）
- **対策案：** `allow read, write: if request.auth.uid == resource.data.uid;` などのルールを設定し、不正アクセスをサーバーサイドでも防御する

#### 2. Gemini APIキーのクライアントサイド露出
- **課題：** `VITE_GEMINI_API_KEY` は `import.meta.env` 経由でクライアントサイドのJSバンドルに含まれてしまう。本番環境でのAPIキー漏洩リスクがある
- **対策案：** Firebase Cloud Functions を経由してサーバーサイドでGemini APIを呼び出す構成に移行し、APIキーをサーバー側の環境変数に移動する

#### 3. エラーハンドリングの改善
- **課題：** Firestoreエラー時に `console.error` + `alert("保存に失敗しました。")` のみで、ユーザーに適切な情報が伝わらない
- **対策案：** トースト通知コンポーネントを導入し、エラー内容・リトライ操作を提供する

---

### 優先度：中

#### 4. 科目マスタの動的管理
- **課題：** `src/types/subject.ts` の `SUBJECTS` 配列がハードコードされており、ユーザーが独自の科目を追加できない
- **対策案：** Firestore にユーザーごとの科目マスタコレクションを作成し、追加・編集・削除を可能にする

#### 5. PWA対応（オフライン利用）
- **課題：** ネットワーク切断時にアプリが使えない
- **対策案：** `vite-plugin-pwa` を使い Service Worker を導入。オフライン時はローカルに記録を保存し、オンライン復帰時に Firestore に同期するキューイング機構を実装する

#### 6. BarChart の独立した週次フィルタ問題
- **課題：** `BarChart.tsx` の `weekOffset` state は `App.tsx` の `currentDate` と独立して管理されている。Monthly カレンダーで別の月を表示中でも、BarChart の週切替は `Date.now()` 基準で動作するため、表示データの文脈が一致しないケースがある
- **対策案：** `weekOffset` の基準日を `currentDate` ベースに変更し、カレンダーと同期させる

---

### 優先度：低（将来の拡張）

#### 7. テストの整備
- **課題：** 現在テストコードが一切存在しない（`package.json` にもテストフレームワークなし）
- **対策案：** Vitest + Testing Library を導入。特にタイマーロジック（`Date.now()` 差分計算）、秒変換ロジック（`timeFormatter.ts`）、週次・月次フィルタリング（`App.tsx`）はユニットテストを優先的に整備する

#### 8. 学習習慣スコアの可視化
- 連続記録日数（ストリーク）、週次目標達成率などのスコアリング機能
- 「n日連続達成」などのバッジ・実績システム

#### 9. 通知機能
- 毎日の学習リマインド通知（Web Push API または PWA Push Notification）

#### 10. パフォーマンス最適化
- **課題：** `fetchRecords()` で全レコードを一括取得している。長期利用でレコード数が増加するとFirestoreの読み取りコスト増加・転送量増加が懸念される
- **対策案：** `startAfter` / `limit` を使ったページネーション、または表示中の月・年のみをクエリするフィルタリングをFirestoreクエリ側に移す

---

*このドキュメントは `src/` 配下の実コードおよび `CHANGELOG.md` を根拠に作成しています。*
*最終更新：2026-03-19*
