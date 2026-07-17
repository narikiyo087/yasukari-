import fs from 'fs'
import path from 'path'
import Head from 'next/head'
import Link from 'next/link'

interface PostMeta {
  slug: string
  title: string
  date: string
  excerpt: string
  tags?: string | null
}

export async function getStaticProps() {
  const dir = path.join(process.cwd(), 'blog_for_custmor')
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.md'))
  const posts: PostMeta[] = files.map((file) => {
    const slug = file.replace(/\.md$/, '')
    const md = fs.readFileSync(path.join(dir, file), 'utf8')
    const lines = md.split(/\r?\n/)
    let idx = 0
    const meta: Record<string, string> = {}
    if (lines[idx] === '---') {
      idx++
      while (idx < lines.length && lines[idx] !== '---') {
        const [k, ...v] = lines[idx].split(':')
        if (k) meta[k.trim()] = v.join(':').trim().replace(/^"|"$/g, '')
        idx++
      }
      idx++
    }
    const heading = lines.find((l) => l.startsWith('# '))
    const title = meta.title || (heading ? heading.replace(/^#\s*/, '') : slug)
    const dateMatch = meta.date || slug.match(/^\d{4}-\d{2}-\d{2}/)?.[0] || ''
    const excerptLine = lines.slice(idx).find((l) => l.trim() && !l.startsWith('#')) || ''
    const excerpt = excerptLine.replace(/\*/g, '').slice(0, 80)
    const tags = meta.tags ?? null
    return { slug, title, date: dateMatch, excerpt, tags }
  })

  posts.sort((a, b) => b.date.localeCompare(a.date))

  return { props: { posts }, revalidate: 60 }
}

export default function CustomerBlogPage({ posts }: { posts: PostMeta[] }) {
  return (
    <div className="max-w-3xl mx-auto p-6 text-sm leading-relaxed">
      <Head>
        <title>店舗ブログ - ヤスカリ</title>
      </Head>
      <h1 className="text-xl font-bold mb-4 text-center">店舗ブログ</h1>
      <div className="space-y-4">
        {posts.map((post) => (
          <Link
            key={post.slug}
            href={`/blog_for_custmor/${post.slug}`}
            className="block p-4 bg-white rounded shadow hover:bg-slate-50"
          >
            <h2 className="font-semibold">{post.title}</h2>
            {post.date && <p className="text-slate-500 text-xs mb-1">{post.date}</p>}
            {post.tags && (
              <p className="text-blue-600 text-xs mb-1">
                {post.tags.split(',').map((t) => `#${t.trim()}`).join(' ')}
              </p>
            )}
            {post.excerpt && <p>{post.excerpt}</p>}
          </Link>
        ))}
      </div>
    </div>
  )
}
