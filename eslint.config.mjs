import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

const eslintConfig = [
  // Playwright が生成する成果物（HTMLレポート・トレース・スクリーンショット）は
  // 対象外にする。中身はバンドル済みのJSで、lint しても得るものが無いうえ
  // 実コードの指摘が埋もれる。
  // ESLint のフラット設定は .gitignore を参照しないため、ここに明示する必要がある。
  {
    ignores: [
      "test-results/**",
      "playwright-report/**",
      "blob-report/**",
      "playwright/.cache/**",
    ],
  },
  ...nextCoreWebVitals,
  ...nextTypeScript,
];

export default eslintConfig;
