import { useSyncExternalStore } from "react";

// 値が変化しない外部ストアなので購読は不要（解除関数だけ返す）
const subscribe = () => () => { }
const getSnapshot = () => true
const getServerSnapshot = () => false

/**
 * ハイドレーションが完了したかどうかを返すフック。
 *
 * サーバーレンダリングおよびハイドレーション中は `false`、
 * ハイドレーション完了後のクライアントレンダリングでは `true` を返します。
 * `useState` + `useEffect` によるマウント判定と同じ用途ですが、
 * エフェクト内での同期 setState（react-hooks/set-state-in-effect）を伴いません。
 *
 * @returns {boolean} ハイドレーション済みなら true
 */
export function useIsHydrated(): boolean {
    return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
