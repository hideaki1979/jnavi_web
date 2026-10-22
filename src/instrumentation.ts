/**
 * サーバーの起動時に1回だけ呼ばれる初期化処理（Next.js の instrumentation）。
 *
 * `register` はすべてのランタイム向けにコンパイルされるため、Node.js 専用の API を
 * 使うコードは別ファイルに分け、Node.js ランタイムのときだけ読み込む。
 * 関数内で `NEXT_RUNTIME` を見て return するだけだと、Edge 向けのビルドで
 * 「Edge Runtime では使えない Node.js API」として警告される。
 */
export async function register() {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        const { logNodeVersion } = await import('./instrumentation-node')
        logNodeVersion()
    }
}
