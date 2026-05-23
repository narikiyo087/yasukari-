import Head from "next/head";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/router";
import DashboardLayout from "../../../../components/dashboard/DashboardLayout";
import formStyles from "../../../../styles/AdminForm.module.css";

export default function EditCustomerBlogPage() {
  const router = useRouter();
  const { slug } = router.query;
  const slugString = Array.isArray(slug) ? slug[0] : slug;

  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [tags, setTags] = useState("");
  const [eyecatch, setEyecatch] = useState("");
  const [content, setContent] = useState("");
  const [showJa, setShowJa] = useState(true);
  const [showEn, setShowEn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slugString) return;

    const loadPost = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/customer-blog/${slugString}`);
        if (!response.ok) {
          throw new Error("記事の取得に失敗しました");
        }
        const data: {
          title: string;
          date?: string;
          tags?: string;
          eyecatch?: string;
          showJa?: boolean;
          showEn?: boolean;
          content: string;
        } = await response.json();

        setTitle(data.title ?? "");
        setDate(data.date ?? "");
        setTags(data.tags ?? "");
        setEyecatch(data.eyecatch ?? "");
        setShowJa(data.showJa ?? true);
        setShowEn(data.showEn ?? false);
        setContent(data.content ?? "");
        setError(null);
      } catch (loadError) {
        console.error(loadError);
        setError("記事の読み込みに失敗しました。");
      } finally {
        setIsLoading(false);
      }
    };

    void loadPost();
  }, [slugString]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!slugString) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/customer-blog/${slugString}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, date, tags, eyecatch, showJa, showEn, content }),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "更新に失敗しました");
      }

      await router.push("/admin/dashboard/blog");
    } catch (submitError) {
      console.error(submitError);
      setError(
        submitError instanceof Error
          ? submitError.message
          : "更新に失敗しました"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Head>
        <title>ブログ記事の編集</title>
      </Head>
      <DashboardLayout
        title="ブログ記事の編集"
        description="既存の記事の内容を更新します。スラッグは変更できません。"
        actions={[
          { label: "一覧に戻る", href: "/admin/dashboard/blog" },
          { label: "新規作成", href: "/admin/dashboard/blog/new" },
        ]}
      >
        <form onSubmit={handleSubmit} className={formStyles.cardStack}>
          <div className={formStyles.card}>
            <div className={formStyles.header}>
              <h2 className={formStyles.title}>記事情報</h2>
              {slugString && (
                <p className={formStyles.description}>スラッグ: {slugString}</p>
              )}
            </div>

            {error && <div className={formStyles.error}>{error}</div>}

            {isLoading ? (
              <p>読み込み中です…</p>
            ) : (
              <div className={formStyles.body}>
                <div className={formStyles.grid}>
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
                    rows={14}
                  />
                  <p className={formStyles.hint}>
                    frontmatter は保存時に自動で更新されます。
                  </p>
                </div>
              </div>
            )}

            <div className={formStyles.actions}>
              <button
                type="submit"
                className={formStyles.primaryButton}
                disabled={isSubmitting || isLoading}
              >
                {isSubmitting ? "更新中..." : "更新する"}
              </button>
            </div>
          </div>
        </form>
      </DashboardLayout>
    </>
  );
}
