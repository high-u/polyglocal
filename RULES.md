# コンポーネント実装ルール

このドキュメントは、本プロジェクト（特に `twiq` ライブラリを使用する場合）におけるUIコンポーネントの実装ガイドラインと設計思想をまとめたものです。

## 基本思想 (Core Philosophy)

1.  **宣言的実装の徹底 (Declarative Over Imperative)**:
    -   DOMの直接操作（例: `setAttribute`, `classList.add`, `appendChild`）は可能な限り避けること。
    -   代わりに、状態（State）が変化した際にコンポーネント全体、またはその一部を**再描画（Re-mount）**することでUIを更新する。

2.  **純粋関数によるView生成 (Pure Functional Views)**:
    -   View生成ロジックは**純粋関数**として分離すること。
    -   純粋関数は、外部の状態やクロージャに依存してはならない。
    -   必要なデータやコールバック関数はすべて `props`（引数）として受け取る。
    -   戻り値は Twiq ノード（DOM要素）とする。

3.  **関心の分離 (Separation of Concerns)**:
    -   **View層**: `props` に基づいてDOM構造を作成する純粋関数。
    -   **Logic層（クロージャ/コントローラ）**: 状態（State）の保持、副作用（APIコール等）の定義、`mount` による描画、コールバック関数の提供を担当する。

## 実装ガイドライン

### 1. View関数
-   命名規則: `create[ComponentName]` (例: `createProgressBar`, `createControls`)。
-   **純粋関数**であること（入力 -> 出力）。
-   **イベントハンドリング**: コントローラ側のロジックをクリーンに保つため、View関数内でDOMイベントを薄くラップすることは許容される。
    -   *例*: `oninput: (e) => props.onInput((e.target as HTMLInputElement).value)` のように、値を取り出してから渡す処理はOK。
-   **スタイリング禁止**: 明示的な指示がない限り、独自のCSSクラスやスタイルを追加しないこと。まずは構造的なHTMLのみを作成する。

### 2. State と 副作用 (Side-Effects)
-   Stateは、コンポーネントのファクトリ関数（クロージャ）内で管理する。
-   UIの更新は `mount(container, viewFunction(props))` を呼び出して行う。
-   **部分更新（Granular updates）を推奨**: 再描画範囲を最小限にするため、セクションごとのコンテナ（例: `progressContainer`, `listContainer`）を作成し、変化があった部分だけを更新する。

### 3. 実装構成例

```typescript
// 純粋なView関数 (Pure View Function)
const createMyList = (props: { items: string[], onDelete: (id: string) => void }) => {
  return ul({}, ...props.items.map(item => 
    li({}, 
      span({}, item),
      button({ onclick: () => props.onDelete(item) }, 'Delete')
    )
  ));
};

// コンポーネントファクトリ (Component Factory / Closure)
export const createMyComponent = () => {
    // State
    const state = { items: [] };
    const listContainer = div({});

    // 副作用 / 更新ロジック
    const updateList = () => {
        mount(listContainer, createMyList({
            items: state.items,
            onDelete: (id) => {
                state.items = state.items.filter(i => i !== id);
                updateList(); // 宣言的に再描画する
            }
        }));
    };

    // 初回レンダリング
    return div({}, listContainer);
};
```

## アンチパターン (やってはいけないこと)

-   ❌ `button.setAttribute('disabled', 'true')` -> **`props` を更新して再描画（Re-render）する。**
-   ❌ `input.classList.add('hidden')` -> **View関数内で条件分岐するか、クラスを `props` で切り替える。**
-   ❌ 更新関数（`render`/`update`）の中で直接Viewの構造を定義する -> **純粋な `createX` 関数に切り出す。**
