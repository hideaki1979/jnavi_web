/**
 * スモークテストの対象ルート定義。
 *
 * 対象は「認証なしで開ける公開ルート」に限定している。
 * `src/proxy.ts` の matcher 対象（`/stores/create`・`/stores/:id/edit`・
 * `/stores/images/:id/upload`・`/stores/images/:id/edit/:imageId`）は
 * セッションCookieが無いとログイン画面へリダイレクトされるため含めていない。
 * カバーするには Playwright の `storageState` とテスト用 Firebase アカウントが要るので、
 * 別issueとして切り出す想定（#67 参照）。
 *
 * 逆に `/stores/map` は保護ルートに見えるが matcher に含まれていないため、
 * 未認証でもアクセスできる。バックエンドAPIは実バックエンド
 * （`E2E_USE_MOCK_API=1` のときは e2e/mock-api のスタブ）が返すので対象に含む。
 */

export interface SmokeRoute {
    /** テスト名・スクリーンショット名に使う識別子 */
    name: string
    /** 遷移先のパス（クエリ文字列を含む） */
    path: string
    /**
     * 最終的に到達しているべきパス名。省略時は {@link path} のパス名。
     *
     * `page.goto()` はリダイレクトを追跡し、返すのは着地先のレスポンスなので、
     * 意図しないリダイレクトが起きてもステータスは 200 のままになる。
     * たとえば `src/proxy.ts` の matcher が広がってこれらが保護ルート扱いになると、
     * 全ルートが `/auth/login` に着地する。ログイン画面はコンソールにも何も出さないため、
     * 「ログイン画面を11回開いただけ」で全部緑になってしまう。
     *
     * クエリ文字列までは見ない。ここで捕まえたいのは着地先が変わったことであり、
     * リダイレクトは必ずパス名を変える（`redirectToLogin` も `/auth/login` へ送る）。
     */
    expectedPathname?: string
    /**
     * 描画が成立していると言える最小の目印。
     *
     * 省略可能にしていない。ルートを足すときに「何が見えていれば描画は生きているか」を
     * 必ず1つ決めさせるため（#101 で塞いだのは、まさにこれを決めていなかった穴）。
     */
    expectedContent: ExpectedContent
    /** そのルートを対象にしている理由・確認したい内容 */
    description: string
}

/**
 * 「これが見えていれば描画は生きている」と言える最小の要素。
 *
 * ページが開くことしか見ていないと、データの取得経路が壊れて中身が空になった状態が
 * 緑のまま通り抜ける（#101）。たとえば `GET /maps` が `{ data: [] }` を返しても、
 * HTTPステータスは200、着地先のパス名も変わらず、サーバーコンポーネントは例外を投げず、
 * コンソールにも何も出ない。結果、ピンが1本も無いマップを描いてテストが通る。
 *
 * E2Eの網羅には踏み込まないので、1ルートにつき1要素に留める。
 * 「その要素が無いならページとして成立していない」と言い切れるものだけを選ぶこと。
 */
export interface ExpectedContent {
    /**
     * 目印の場所（Playwright のセレクタ文字列）。
     *
     * ロールとアクセシブルネームで書けるものはそちらで書く
     * （`role=button[name="ログイン"]`）。`data-testid` を足さずに済むうえ、
     * アクセシブルネームが失われる退行も同時に拾えるため。
     * ロールを持たない要素（段落など）だけ `text=` を使う。
     *
     * 一致が複数あってもよく、判定は先頭の1件が見えているかで行う。
     * 確かめたいのは「1件以上描かれていること」なので、件数は固定しない
     * （固定するとDBの中身が変わるたびに落ちる）。
     */
    locator: string
    /** その要素が見えていれば何が確かめられるのか。失敗メッセージに出る */
    description: string
    /**
     * 目印を出すために先にクリックする要素。操作が要らないなら省略する。
     *
     * 閉じたセレクトの選択肢のように、操作しないとDOMに現れないものがあるため。
     * 券売機の店舗セレクト（MUI Autocomplete）がこれで、閉じたままでは
     * 選択肢が0件でも1件でも同じDOMになり、空を空と判別できない。
     */
    revealedBy?: string
}

/**
 * {@link SmokeRoute.path} の中で、実行時に店舗IDへ差し替える目印。
 *
 * 実バックエンドのDBに何が入っているかは環境によって違うため、
 * e2e/global-setup.ts が `GET /stores` の先頭の店舗IDを `E2E_STORE_ID` に入れる。
 * 決め打ちにすると「APIが404を返す状態」を検証してしまい、意味を成さない。
 *
 * ここで `process.env.E2E_STORE_ID` を直接読まないのは、このモジュールが
 * テスト一覧の作成時にも読み込まれるため。一覧の作成は globalSetup より先に走るので、
 * 読んだ時点ではまだ値が入っておらず、`npx playwright test --list` や
 * エディタのテスト一覧が「テスト0件」になってしまう（実際に踏んだ）。
 *
 * 差し替えは e2e/smoke.spec.ts がテスト実行時に行う。
 * 副産物として、テスト名が環境のDBの中身に左右されなくなる
 * （先頭の店舗が変わるたびにテスト名が変わると、`-g` での絞り込みや
 * レポートの履歴比較が効かなくなる）。
 */
export const STORE_ID_PLACEHOLDER = '{storeId}'

/**
 * マップに店舗のピンが描かれていること。
 *
 * `/` は `/stores/map` へリダイレクトするので、2ルートで同じものを見る。
 *
 * ## なぜタグ名で指定しているか
 *
 * `<AdvancedMarker>` は Google Maps の Web Component
 * `<gmp-advanced-marker>` として描かれ、`title` に渡した店舗名が
 * `role="button"` と `aria-label` になる（ヘッドレスでも同じ、実測）。
 * ただしアクセシブルネームは店舗名そのものなので、DBの中身に依存して書けない。
 * そこで「タグが在る」ことに加えて `[aria-label]` の有無だけを見る。
 * `StoreMap.tsx` が `title` を渡さなくなればアクセシブルネームが消えて落ちるので、
 * ピンの数だけでなくアクセシビリティ上の退行も拾える。
 *
 * ## 現在地について
 *
 * ビューポートの外にあるマーカーは、Google Maps が非表示側のスロットに移すため
 * `toBeVisible()` では捕まらない（DOMには在るが hidden、実測）。
 * このため e2e/smoke.spec.ts は現在地を実在店舗の座標に寄せてから開く。
 * 「近くの店舗がピンとして見えている」という利用者から見た状態をそのまま検証できる。
 */
const MAP_MARKER: ExpectedContent = {
    locator: 'gmp-advanced-marker[aria-label]',
    description: '店舗のピン（GET /maps の結果が地図に描かれている）'
}

/**
 * トッピングコールの選択UIが、取得完了後の状態まで進んでいること。
 *
 * 事前コールと着丼前コールは同じ構造で、`useStoreToppingCalls` が
 * 取得中・失敗のあいだは `LoadingErrorContainer` に差し替わり、
 * この2つのボタンは描かれない。つまりボタンが見えていれば
 * 「API呼び出しが成功して確定した」ところまで到達している。
 *
 * ラジオボタン（トッピングのオプション）を目印にしていないのは、
 * オプションが0件でも正常な店舗が実在するため。
 * 開発用バックエンドの店舗id=1は `call_timing=post_call` の
 * `formattedToppingOptions` が空で返ってくる（実測）。
 * これを失敗にすると、データとして正しい状態をアプリの退行として報告することになる。
 */
const CALL_OPTIONS_READY: ExpectedContent = {
    locator: 'role=button[name="コール有り"]',
    description: 'コール有りボタン（トッピングコール情報の取得が完了している）'
}

export const SMOKE_ROUTES: SmokeRoute[] = [
    {
        name: 'top',
        path: '/',
        // src/app/page.tsx が `redirect('/stores/map')` するので着地先は自分自身ではない
        expectedPathname: '/stores/map',
        expectedContent: MAP_MARKER,
        description: 'トップ。/stores/map へリダイレクトされる'
    },
    {
        name: 'stores-map',
        path: '/stores/map',
        expectedContent: MAP_MARKER,
        description: '店舗マップ。サーバー側で GET /maps を呼ぶ唯一のページ'
    },
    {
        name: 'auth-login',
        path: '/auth/login',
        expectedContent: {
            // フォーム本体は `next/dynamic`（ssr: false）で読み込まれる。
            // 送信ボタンが見えていれば、そのチャンクの取得と実行まで通っている
            locator: 'role=button[name="ログイン"]',
            description: 'ログインボタン（動的読み込みのAuthFormが描画されている）'
        },
        description: 'ログイン画面'
    },
    {
        name: 'auth-signup',
        path: '/auth/signup',
        expectedContent: {
            locator: 'role=button[name="アカウント作成"]',
            description: 'アカウント作成ボタン（動的読み込みのAuthFormが描画されている）'
        },
        description: '会員登録画面'
    },
    {
        name: 'simulation-ticket',
        path: '/stores/simulation/ticket',
        expectedContent: {
            // 選択肢はセレクトを開かないとDOMに現れない。
            // 開かずに見えるのは入力欄だけで、それは店舗が0件でも描かれる
            locator: 'role=option',
            description: '店舗の選択肢（GET /stores の結果がセレクトに入っている）',
            revealedBy: 'role=combobox[name="店舗を選択してください"]'
        },
        description: '券売機。react-query 経由で GET /stores を呼ぶ'
    },
    {
        // `?id=` が無いと `useStoreToppingCalls` の `enabled` が false になり
        // API を呼ばないまま空の選択UIになるため、店舗IDを与えて実際に叩かせる
        name: 'simulation-precall',
        path: `/stores/simulation/precall?id=${STORE_ID_PLACEHOLDER}`,
        expectedContent: CALL_OPTIONS_READY,
        description: '事前コール。GET /stores/{id}/toppingCalls?call_timing=pre_call を呼ぶ'
    },
    {
        name: 'simulation-precall-result',
        path: `/stores/simulation/precall-result?callText=%E3%83%A4%E3%82%B5%E3%82%A4%E3%83%9E%E3%82%B7&id=${STORE_ID_PLACEHOLDER}`,
        expectedContent: {
            // コール内容は段落で、ロールもアクセシブルネームも持たないため文字列で指定する。
            // `callText` はクエリ文字列で与えた値なのでDBの中身には依存しない。
            // `CallResultScreen` はマウント完了までスピナーに差し替わるので、
            // これが見えていれば音声合成フックの初期化まで通っている
            locator: 'text="ヤサイマシ"',
            description: 'コール内容の読み上げテキスト（callTextが画面に出ている）'
        },
        description: '事前コール結果。`callText` の表示と音声合成UIの初期表示'
    },
    {
        name: 'simulation-postcall',
        path: `/stores/simulation/postcall?id=${STORE_ID_PLACEHOLDER}`,
        expectedContent: CALL_OPTIONS_READY,
        description: '着丼前コール。GET /stores/{id}/toppingCalls?call_timing=post_call を呼ぶ'
    },
    {
        name: 'simulation-postcall-result',
        path: '/stores/simulation/postcall-result?callText=%E3%83%8B%E3%83%B3%E3%83%8B%E3%82%AF%E3%83%9E%E3%82%B7',
        expectedContent: {
            locator: 'text="ニンニクマシ"',
            description: 'コール内容の読み上げテキスト（callTextが画面に出ている）'
        },
        description: '着丼前コール結果'
    },
    {
        name: 'simulation-afterfinish',
        path: '/stores/simulation/afterfinish',
        expectedContent: {
            // 選択肢は静的だが、MUIのFormControlLabelとCheckboxが
            // 描画とラベル付けまで通っているかはここでしか分からない
            locator: 'role=checkbox[name="どんぶりをカウンターにあげる"]',
            description: 'クイズの選択肢（チェックボックスがラベル付きで描かれている）'
        },
        description: '完食後クイズ'
    },
    {
        name: 'simulation-answer',
        path: '/stores/simulation/answer?result=%E6%AD%A3%E8%A7%A3',
        expectedContent: {
            // 正誤の表示だけが Suspense 境界の内側。
            // 見えていれば `useSearchParams()` を読む側まで確定している
            locator: 'role=heading[name="正解"]',
            description: 'クイズの判定（?result= がSuspense境界の内側で描画されている）'
        },
        description: '食後クイズ回答。`useSearchParams` を Suspense 境界の内側で読む'
    }
]
