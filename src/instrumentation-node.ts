/**
 * 実行中の Node.js のバージョンをログに出す（`src/instrumentation.ts` から呼ぶ）。
 *
 * Vercel で指定できるのは Node のメジャーバージョン（プロジェクト設定と `engines`）だけで、
 * パッチは Vercel が自動で展開する。ところがビルドログにもデプロイの API にも
 * 実行時のパッチバージョンは出ないため、Node のセキュリティリリースが本番に
 * 反映されたかを確かめる手段がこのログしか無い（2026-10 のセキュリティリリースで確認）。
 *
 * Vercel のドキュメントは確認方法として「Build Command で `node -v`」と
 * 「`process.version` をログに出す」を並べているが、ビルド環境と実行環境が
 * 同じ版で動くとは書いていない。そのため両方を出す（ビルド側は package.json の `build`）。
 */
export function logNodeVersion() {
    console.info(`Node.js ${process.version}`)
}
