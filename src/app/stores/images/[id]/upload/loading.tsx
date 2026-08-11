import FormSkeleton from "@/components/feedback/FormSkeleton";

/**
 * 画像アップロード画面のローディングUI。
 *
 * 店舗別トッピング・コール情報の取得を待ってから描画されるため、
 * `/stores/loading.tsx`の汎用スピナーではなくフォームの形を出す。
 */
export default function StoreImageUploadLoading() {
    return <FormSkeleton fields={4} />;
}
