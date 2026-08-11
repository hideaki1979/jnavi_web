import FormSkeleton from "@/components/feedback/FormSkeleton";

/**
 * 店舗編集画面のローディングUI。
 *
 * 店舗情報とトッピング・コールのマスタを並行取得して待つため、
 * `/stores/loading.tsx`の汎用スピナーではなくフォームの形を出す。
 */
export default function StoreEditLoading() {
    return <FormSkeleton fields={6} />;
}
