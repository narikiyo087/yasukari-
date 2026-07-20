import React, { useState } from 'react';
import Link from 'next/link';

const DESCRIPTIONS: Record<string, string> = {
  'README.md': 'プロジェクト概要',
  components: '再利用コンポーネント',
  data: 'サンプルデータ',
  'deploy.sh': 'デプロイスクリプト',
  lib: 'ユーティリティ',
  manual_for_system: '運用マニュアル',
  'next-env.d.ts': 'Next.js型定義',
  'next.config.js': 'Next.js設定',
  'package-lock.json': '依存固定',
  'package.json': 'npm設定',
  pages: 'ページ群',
  styles: 'スタイル',
  'tsconfig.json': 'TypeScript設定',
};

function getDesc(name: string) {
  return DESCRIPTIONS[name] ?? '';
}

export type DirNode = {
  name: string;
  path: string;
  isDir: boolean;
  children?: DirNode[];
};

function Node({ node, level = 0 }: { node: DirNode; level?: number }) {
  const [open, setOpen] = useState(false);

  if (node.isDir) {
    return (
      <li
        className={`mt-1 relative group ${
          level === 0 ? 'odd:bg-white even:bg-slate-50 p-1' : ''
        }`}
      >
        <button
          onClick={() => setOpen(!open)}
          className="text-left hover:underline flex items-center gap-1"
        >
          <span>{open ? '▼' : '▶'}</span>
          {node.name}
        </button>
        <span className="absolute left-full top-1/2 -translate-y-1/2 ml-2 bg-gray-700 text-white text-xs rounded px-1 py-0.5 hidden group-hover:block whitespace-nowrap z-10">
          {getDesc(node.name)}
        </span>
        {open && node.children && (
          <ul className="ml-4 list-none">
            {node.children.map((c) => (
              <Node key={c.path} node={c} level={level + 1} />
            ))}
          </ul>
        )}
      </li>
    );
  }

  return (
    <li
      className={`mt-1 relative group ${
        level === 0 ? 'odd:bg-white even:bg-slate-50 p-1' : ''
      }`}
    >
      <Link href={`/source/${node.path}`} className="hover:underline text-red-700">
        {node.name}
      </Link>
      <span className="absolute left-full top-1/2 -translate-y-1/2 ml-2 bg-gray-700 text-white text-xs rounded px-1 py-0.5 hidden group-hover:block whitespace-nowrap z-10">
        {getDesc(node.name)}
      </span>
    </li>
  );
}

export default function DirectoryTree({ tree }: { tree: DirNode[] }) {
  return (
    <div className="border rounded p-2 bg-white shadow text-sm">
      <h3 className="font-bold mb-2">ディレクトリ構成</h3>
      <ul className="ml-2 list-none">
        {tree.map((node) => (
          <Node key={node.path} node={node} level={0} />
        ))}
      </ul>
    </div>
  );
}
