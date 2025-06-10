import { redirect } from "next/navigation";

/**
 * トップページ
 *
 * このページは"/"にアクセスしたときに表示されます。
 * ただし、Next.jsのredirectによって、"/stores/map"にリダイレクトされます。
 *
 * 以下は、将来的にこのページを本格的に作成するためのサンプルです。
 * 
 */

export default function Home() {
  return redirect('/stores/map')

  // <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
  //   Home画面です。
  // </main>

}
