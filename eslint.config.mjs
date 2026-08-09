import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypeScript,
  {
    rules: {
      // eslint-config-next@16 が同梱する eslint-plugin-react-hooks v7 で追加された新ルール。
      // 既存コードに8件該当するが、いずれも useEffect 内でのフォーム初期値反映や
      // 外部APIの購読であり、Next.js 16 移行とは独立した課題のため一時的に warn へ降格する。
      // 恒久対応は #62 で行い、完了後にこのブロックごと削除する。
      "react-hooks/set-state-in-effect": "warn",
    },
  },
];

export default eslintConfig;
