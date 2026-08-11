import FormSkeleton from "@/components/feedback/FormSkeleton";

/**
 * 店舗登録画面のローディングUI。
 *
 * このページはトッピング・コールのマスタ取得を待ってから描画されるため、
 * `/stores/loading.tsx`の汎用スピナーではなくフォームの形を出す。
 */
export default function CreateStoreLoading() {
    return <FormSkeleton fields={6} />;
}
