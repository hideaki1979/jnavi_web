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
 * 未認証でもアクセスできる。バックエンドAPIはスタブ（e2e/mock-api）が返すので対象に含む。
 */

export interface SmokeRoute {
    /** テスト名・スクリーンショット名に使う識別子 */
    name: string
    /** 遷移先のパス（クエリ文字列を含む） */
    path: string
    /** そのルートを対象にしている理由・確認したい内容 */
    description: string
}

export const SMOKE_ROUTES: SmokeRoute[] = [
    {
        name: 'top',
        path: '/',
        description: 'トップ。/stores/map へリダイレクトされる'
    },
    {
        name: 'stores-map',
        path: '/stores/map',
        description: '店舗マップ。サーバー側で GET /maps を呼ぶ唯一のページ'
    },
    {
        name: 'auth-login',
        path: '/auth/login',
        description: 'ログイン画面'
    },
    {
        name: 'auth-signup',
        path: '/auth/signup',
        description: '会員登録画面'
    },
    {
        name: 'simulation-ticket',
        path: '/stores/simulation/ticket',
        description: '券売機。react-query 経由で GET /stores を呼ぶ'
    },
    {
        // `?id=` が無いと `useStoreToppingCalls` の `enabled` が false になり
        // API を呼ばないまま空の選択UIになるため、店舗IDを与えて実際に叩かせる
        name: 'simulation-precall',
        path: '/stores/simulation/precall?id=1',
        description: '事前コール。GET /stores/1/toppingCalls?call_timing=pre_call を呼ぶ'
    },
    {
        name: 'simulation-precall-result',
        path: '/stores/simulation/precall-result?callText=%E3%83%A4%E3%82%B5%E3%82%A4%E3%83%9E%E3%82%B7&id=1',
        description: '事前コール結果。`callText` の表示と音声合成UIの初期表示'
    },
    {
        name: 'simulation-postcall',
        path: '/stores/simulation/postcall?id=1',
        description: '着丼前コール。GET /stores/1/toppingCalls?call_timing=post_call を呼ぶ'
    },
    {
        name: 'simulation-postcall-result',
        path: '/stores/simulation/postcall-result?callText=%E3%83%8B%E3%83%B3%E3%83%8B%E3%82%AF%E3%83%9E%E3%82%B7',
        description: '着丼前コール結果'
    },
    {
        name: 'simulation-afterfinish',
        path: '/stores/simulation/afterfinish',
        description: '完食後クイズ'
    },
    {
        name: 'simulation-answer',
        path: '/stores/simulation/answer?result=%E6%AD%A3%E8%A7%A3',
        description: '食後クイズ回答。`useSearchParams` を Suspense 境界の内側で読む'
    }
]
