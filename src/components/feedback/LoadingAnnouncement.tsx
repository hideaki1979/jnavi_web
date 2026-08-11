import { Box } from "@mui/material";

/**
 * 視覚的にのみ隠すスタイル。
 *
 * `display:none`や`visibility:hidden`と違い、アクセシビリティツリーには残るため
 * スクリーンリーダーは読み上げる。MUIの`@mui/utils`にも同名の定義があるが、
 * `@mui/utils`はpackage.jsonに無い推移的依存なので、参照せずここで定義する
 * （MUIの内部構成が変わると壊れるため）。
 */
const visuallyHidden = {
    border: 0,
    clip: "rect(0 0 0 0)",
    height: "1px",
    margin: "-1px",
    overflow: "hidden",
    padding: 0,
    position: "absolute",
    whiteSpace: "nowrap",
    width: "1px",
} as const;

interface LoadingAnnouncementProps {
    /** 読み上げさせる文言 */
    label?: string;
}

/**
 * `role="status"`のリージョン内に置く、視覚的に隠した読み込み中テキスト。
 *
 * スケルトンやスピナーだけのフォールバックは、リージョンにテキストコンテンツが
 * 無い状態になる。`aria-label`だけでラベル付けする方法もあるが、
 * ライブリージョンが読み上げるのは「名前」ではなく「内容」であり、
 * 内容が空のリージョンをどう扱うかはスクリーンリーダーによって差がある。
 * 実テキストを置くことで読み上げを確実にする。
 *
 * 呼び出し側の`role="status"`と対で使い、`aria-label`は併用しない
 * （名前と内容の二重読み上げを避けるため）。
 *
 * @param label 読み上げさせる文言（既定値: 読み込み中）
 */
export default function LoadingAnnouncement({ label = "読み込み中" }: LoadingAnnouncementProps) {
    return (
        <Box component="span" sx={visuallyHidden}>
            {label}
        </Box>
    );
}
