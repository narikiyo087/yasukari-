import Head from "next/head";
import ChatSupportPreview from "../components/ChatSupportPreview";

const mobileStates = [
  { state: "guest", title: "Mobile: 未ログイン初期状態" },
  { state: "loggedIn", title: "Mobile: ログイン済み（予約カードあり）" },
  { state: "chips", title: "Mobile: チップ選択中の状態" },
  { state: "loading", title: "Mobile: ローディング状態" },
  { state: "error", title: "Mobile: エラー状態（401）" },
] as const;

const desktopStates = [
  { state: "guest", title: "Desktop: 未ログイン初期状態" },
  { state: "loggedIn", title: "Desktop: ログイン済み（予約カードあり）" },
  { state: "chips", title: "Desktop: チップ選択中の状態" },
  { state: "loading", title: "Desktop: ローディング状態" },
  { state: "error", title: "Desktop: エラー状態（401）" },
] as const;

export default function ChatDesignPage() {
  return (
    <>
      <Head>
        <title>チャットUIデザイン | ヤスカリ</title>
      </Head>
      <main className="min-h-screen bg-white px-6 py-10 space-y-12">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold text-gray-900">チャットUI設計</h1>
          <p className="text-sm text-gray-600">
            余白感とタイポグラフィを重視した、カスタマーサポート向けのチャットUIプレビューです。
          </p>
        </header>

        <section className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-800">Mobile（iPhone標準）</h2>
          <div className="grid gap-10">
            {mobileStates.map((item) => (
              <ChatSupportPreview
                key={item.title}
                variant="mobile"
                state={item.state}
                title={item.title}
              />
            ))}
          </div>
        </section>

        <section className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-800">Desktop</h2>
          <div className="grid gap-10">
            {desktopStates.map((item) => (
              <ChatSupportPreview
                key={item.title}
                variant="desktop"
                state={item.state}
                title={item.title}
              />
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
