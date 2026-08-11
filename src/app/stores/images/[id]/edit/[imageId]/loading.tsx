import FormSkeleton from "@/components/feedback/FormSkeleton";

/**
 * 画像編集画面のローディングUI。
 *
 * 画像情報と店舗別トッピング・コール情報を並行取得して待つため、
 * `/stores/loading.tsx`の汎用スピナーではなくフォームの形を出す。
 */
export default function StoreImageEditLoading() {
    return <FormSkeleton fields={4} />;
}
