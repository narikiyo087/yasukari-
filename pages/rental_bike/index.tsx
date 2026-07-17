import fs from 'fs'
import path from 'path'
import Head from 'next/head'
import Link from 'next/link'
import CalendarWidget, { CalendarPost } from '../../components/CalendarWidget'
import PostSearch from '../../components/PostSearch'

type PostMeta = {
  slug: string
  title: string
  date: string
  excerpt: string
  tags?: string
  eyecatch?: string | null
}

export async function getStaticProps() {
  const dir = path.join(process.cwd(), 'rental_bike')
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
    const tags = meta.tags
    const eyecatch = meta.eyecatch ?? null
    return { slug, title, date: dateMatch, excerpt, tags, eyecatch }
  })

  posts.sort((a, b) => b.date.localeCompare(a.date))

  const calendarPosts: CalendarPost[] = posts.map((p) => ({
    slug: p.slug,
    title: p.title,
    date: p.date,
  }))

  const tags = Array.from(
    new Set(
      posts.flatMap((p) =>
        p.tags ? p.tags.split(',').map((t) => t.trim()) : []
      )
    )
  )

  const initialDate = new Date().toISOString()

  return { props: { posts, calendarPosts, tags, initialDate } }
}

export default function BlogIndex({
  posts,
  calendarPosts,
  tags,
  initialDate,
}: {
  posts: PostMeta[]
  calendarPosts: CalendarPost[]
  tags: string[]
  initialDate: string
}) {
  return (
    <div className="max-w-6xl mx-auto p-4 flex flex-row flex-wrap gap-6">
      <Head>
        <title>新着ブログ・お知らせ - ヤスカリ</title>
      </Head>
      <div className="w-[70%]">
        <h1 className="text-xl font-bold mb-4">新着ブログ・お知らせ</h1>
        {tags.length > 0 && (
          <div className="mb-4 text-sm space-x-2">
            {tags.map((t) => (
              <Link
                key={t}
                href={`/rental_bike/tag/${encodeURIComponent(t)}`}
                className="text-blue-600 hover:underline"
              >
                #{t}
              </Link>
            ))}
          </div>
        )}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/rental_bike/${post.slug}`}
              className="block p-4 bg-white rounded shadow hover:bg-slate-50 hover-glow"
            >
              {post.eyecatch && (
                <img
                  src={post.eyecatch}
                  alt={post.title}
                  className="square-img rounded mb-2"
                />
              )}
              <h2 className="font-semibold">{post.title}</h2>
              {post.date && (
                <p className="text-slate-500 text-xs mb-1">{post.date}</p>
              )}
              {post.tags && (
                <p className="text-blue-600 text-xs mb-1">
                  {post.tags
                    .split(',')
                    .map((t) => `#${t.trim()}`)
                    .join(' ')}
                </p>
              )}
              {post.excerpt && <p>{post.excerpt}</p>}
            </Link>
          ))}
        </div>
      </div>
      <div className="w-[25%] space-y-4">
        <CalendarWidget posts={calendarPosts} initialDate={initialDate} />
        <PostSearch posts={posts} basePath="/rental_bike" />
      </div>
    </div>
  )
}
