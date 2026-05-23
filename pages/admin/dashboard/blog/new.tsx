import Head from "next/head";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/router";
import DashboardLayout from "../../../../components/dashboard/DashboardLayout";
import formStyles from "../../../../styles/AdminForm.module.css";

export default function CreateCustomerBlogPage() {
  const router = useRouter();
  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [tags, setTags] = useState("");
  const [eyecatch, setEyecatch] = useState("");
  const [content, setContent] = useState("");
  const [showJa, setShowJa] = useState(true);
  const [showEn, setShowEn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/customer-blog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, title, date, tags, eyecatch, showJa, showEn, content }),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "作成に失敗しました");
      }

      await router.push("/admin/dashboard/blog");
    } catch (submitError) {
      console.error(submitError);
      setError(
        submitError instanceof Error
          ? submitError.message
          : "作成に失敗しました"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Head>
        <title>ブログ記事の新規作成</title>
      </Head>
      <DashboardLayout
        title="ブログ記事の新規作成"
        description="公開用のブログ記事を作成します。スラッグはファイル名に使用されます。"
        actions={[{ label: "一覧に戻る", href: "/admin/dashboard/blog" }]}
      >
        <form onSubmit={handleSubmit} className={formStyles.cardStack}>
          <div className={formStyles.card}>
            <div className={formStyles.header}>
              <h2 className={formStyles.title}>記事情報</h2>
              <p className={formStyles.description}>
                スラッグ、タイトル、本文を入力してください。タグはカンマ区切りで指定できます。
              </p>
            </div>

            {error && <div className={formStyles.error}>{error}</div>}

            <div className={formStyles.body}>
              <div className={formStyles.grid}>
                <div className={formStyles.field}>
                  <label htmlFor="slug">スラッグ*</label>
                  <input
                    id="slug"
                    name="slug"
                    required
                    value={slug}
                    onChange={(event) => setSlug(event.target.value)}
                    placeholder="2025-09-01-minowa-procedures"
                  />
                  <p className={formStyles.hint}>
                    半角英数字、ハイフン、アンダースコアのみ。ファイル名になります。
                  </p>
                </div>
                <div className={formStyles.field}>
                  <label htmlFor="title">タイトル*</label>
                  <input
                    id="title"
                    name="title"
                    required
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                  />
                </div>
                <div className={formStyles.field}>
                  <label htmlFor="date">公開日</label>
                  <input
                    id="date"
                    name="date"
                    type="date"
                    value={date}
                    onChange={(event) => setDate(event.target.value)}
                  />
                </div>
                <div className={formStyles.field}>
                  <label htmlFor="tags">タグ</label>
                  <input
                    id="tags"
                    name="tags"
                    value={tags}
                    onChange={(event) => setTags(event.target.value)}
                    placeholder="店舗情報, 新商品"
                  />
                  <p className={formStyles.hint}>カンマ区切りで複数指定できます。</p>
                </div>
                <div className={formStyles.field}>
                  <label htmlFor="eyecatch">アイキャッチ画像URL</label>
                  <input
                    id="eyecatch"
                    name="eyecatch"
                    value={eyecatch}
                    onChange={(event) => setEyecatch(event.target.value)}
                    placeholder="https://example.com/eyecatch.jpg"
                  />
                </div>
                <div className={formStyles.field}>
                  <label className="inline-flex items-center gap-2">
                    <input type="checkbox" checked={showJa} onChange={(event) => setShowJa(event.target.checked)} />
                    日本語ページで表示する
                  </label>
                </div>
                <div className={formStyles.field}>
                  <label className="inline-flex items-center gap-2">
                    <input type="checkbox" checked={showEn} onChange={(event) => setShowEn(event.target.checked)} />
                    英語ページ（/en）で表示する
                  </label>
                </div>
              </div>

              <div className={formStyles.field}>
                <label htmlFor="content">本文*</label>
                <textarea
                  id="content"
                  name="content"
                  required
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                  rows={12}
                  placeholder="本文をここに入力してください。"
                />
                <p className={formStyles.hint}>
                  Markdown形式で入力してください。frontmatter は保存時に自動生成されます。
                </p>
              </div>
            </div>

            <div className={formStyles.actions}>
              <button
                type="submit"
                className={formStyles.primaryButton}
                disabled={isSubmitting}
              >
                {isSubmitting ? "作成中..." : "記事を作成"}
              </button>
            </div>
          </div>
        </form>
        <div className={formStyles.cardStack}>
          <div className={formStyles.card}>
            <p className={formStyles.description}>
              既存の記事を編集する場合は
              <Link href="/admin/dashboard/blog" className="text-blue-600">
                一覧ページ
              </Link>
              から選択してください。
            </p>
          </div>
        </div>
      </DashboardLayout>
    </>
  );
}
