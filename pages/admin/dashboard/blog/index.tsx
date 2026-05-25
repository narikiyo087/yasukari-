import Head from "next/head";
import Link from "next/link";
import { useEffect, useState } from "react";
import DashboardLayout from "../../../../components/dashboard/DashboardLayout";
import { CustomerBlogMeta } from "../../../../lib/dashboard/customerBlog";
import formStyles from "../../../../styles/AdminForm.module.css";
import tableStyles from "../../../../styles/AdminTable.module.css";

export default function CustomerBlogListPage() {
  const [posts, setPosts] = useState<CustomerBlogMeta[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    const loadPosts = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("/api/customer-blog");
        if (!response.ok) {
          throw new Error("ブログ記事の取得に失敗しました。");
        }
        const data: CustomerBlogMeta[] = await response.json();
        setPosts(data);
        setError(null);
      } catch (loadError) {
        console.error(loadError);
        setError("ブログ記事の取得に失敗しました。");
      } finally {
        setIsLoading(false);
      }
    };

    void loadPosts();
  }, []);

  const handleDelete = async (slug: string) => {
    if (!confirm(`「${slug}」を削除しますか？`)) return;

    setDeleting(slug);
    try {
      const response = await fetch(`/api/customer-blog/${slug}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("削除に失敗しました");
      }

      setPosts((current) => current.filter((post) => post.slug !== slug));
    } catch (deleteError) {
      console.error(deleteError);
      setError("記事の削除に失敗しました。");
    } finally {
      setDeleting(null);
    }
  };

  const renderPublicLink = (post: CustomerBlogMeta, locale: "ja" | "en") => {
    const shouldShow = locale === "ja" ? post.showJa !== false : post.showEn === true;
    const href =
      locale === "ja"
        ? `/blog_for_custmor/${post.slug}`
        : `/en/blog_for_custmor/${post.slug}`;
    const label = locale === "ja" ? "日本語ページ" : "英語ページ";

    if (!shouldShow) {
      return (
        <span className={tableStyles.disabledAction} aria-disabled="true">
          {label}
        </span>
      );
    }

    return (
      <Link href={href} className={tableStyles.link}>
        {label}
      </Link>
    );
  };

  return (
    <>
      <Head>
        <title>ブログ管理</title>
      </Head>
      <DashboardLayout
        title="ブログ管理"
        description="お客様向けブログ記事の一覧を確認し、編集・削除ができます。"
        actions={[
          {
            label: "＋ 新規記事を追加",
            href: "/admin/dashboard/blog/new",
          },
        ]}
      >
        <div className={formStyles.cardStack}>
          <div className={formStyles.card}>
            <div className={formStyles.header}>
              <h2 className={formStyles.title}>記事一覧</h2>
              <p className={formStyles.description}>
                markdown ファイルとして保存されているブログ記事を管理できます。
              </p>
            </div>

            {error && <div className={formStyles.error}>{error}</div>}

            <div className={`${tableStyles.wrapper} ${tableStyles.tableWrapper}`}>
              <table className={`${tableStyles.table} ${tableStyles.dataTable}`}>
                <thead>
                  <tr>
                    <th>タイトル</th>
                    <th>スラッグ</th>
                    <th>公開日</th>
                    <th>タグ</th>
                    <th aria-label="actions" />
                  </tr>
                </thead>
                <tbody>
                  {posts.map((post) => (
                    <tr key={post.slug}>
                      <td>
                        <Link
                          href={`/admin/dashboard/blog/${post.slug}`}
                          className={tableStyles.link}
                        >
                          {post.title}
                        </Link>
                      </td>
                      <td className={tableStyles.monospace}>
                        <Link
                          href={`/admin/dashboard/blog/${post.slug}`}
                          className={tableStyles.link}
                        >
                          {post.slug}
                        </Link>
                      </td>
                      <td>{post.date ?? "-"}</td>
                      <td>{post.tags ?? "-"}</td>
                      <td className={tableStyles.actions}>
                        {renderPublicLink(post, "ja")}
                        {renderPublicLink(post, "en")}
                        <Link
                          href={`/admin/dashboard/blog/${post.slug}`}
                          className={tableStyles.link}
                        >
                          編集
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDelete(post.slug)}
                          className={tableStyles.dangerButton}
                          disabled={deleting === post.slug}
                        >
                          {deleting === post.slug ? "削除中" : "削除"}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {posts.length === 0 && !isLoading && (
                    <tr>
                      <td colSpan={5} className={tableStyles.emptyRow}>
                        記事がまだありません。
                      </td>
                    </tr>
                  )}
                  {isLoading && (
                    <tr>
                      <td colSpan={5} className={tableStyles.emptyRow}>
                        読み込み中です…
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </>
  );
}
