import React from "react";
import Link from "next/link";
import { FaInstagram } from "react-icons/fa6";

export default function Footer() {
  return (
    <footer className="bg-gray-100 border-t border-gray-200 text-sm text-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          {/* ブランド紹介と問い合わせ */}
          <div>
            <h4 className="font-bold mb-2">ヤスカリ</h4>
            <p className="mb-3">
              バイクのレンタル・サブスク専門サイトです。原付から大型・EVバイクまで豊富なラインナップをご用意。
            </p>
            <div className="space-y-1">
              <Link href="/" className="text-red-600 hover:underline block">
                ホーム
              </Link>
              <Link href="/contact" className="text-red-600 hover:underline block">
                お問い合わせはこちら
              </Link>
            </div>
          </div>

          {/* サイトポリシー */}
          <div>
            <h4 className="font-bold mb-2">サイトポリシー</h4>
            <ul className="space-y-1">
              <li>
                <Link href="/tokusyouhou" className="hover:underline">
                  特定商取引法に基づく表記
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:underline">
                  利用規約
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:underline">
                  プライバシーポリシー
                </Link>
              </li>
              <li>
                <Link href="/external" className="hover:underline">
                  情報の外部送信について
                </Link>
              </li>
              <li>
                <Link href="/company" className="hover:underline">
                  運営会社情報
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:underline">
                  お問い合わせ・サポートポリシー
                </Link>
              </li>
            </ul>
          </div>

          {/* サービス案内 + SNS */}
          <div>
            <h4 className="font-bold mb-2">サービス案内</h4>
            <ul className="space-y-1 mb-4">
              <li>
                <Link href="/products" className="hover:underline">
                  全ての車両一覧
                </Link>
              </li>
              <li>
                <Link href="/blog_for_custmor" className="hover:underline">
                  新着ブログ・お知らせ
                </Link>
              </li>
              <li>
                <Link href="/beginner" className="hover:underline">
                  はじめての方へ（ガイド）
                </Link>
              </li>
              <li>
                <Link href="/help" className="hover:underline">
                  よくある質問（FAQ）
                </Link>
              </li>
              <li>
                <Link href="/stores" className="hover:underline">
                  店舗一覧
                </Link>
              </li>
              <li>

                <Link href="/insurance" className="hover:underline">
                  車両保険の内容について
                </Link>
              </li>
            </ul>
            <h4 className="font-bold mb-2">SNS・動画</h4>
            <ul className="space-y-2">
              <li className="flex items-center gap-2">
                <FaInstagram /> <a href="https://www.instagram.com/yasukari_819" className="hover:underline">Instagram</a>
              </li>
            </ul>
          </div>
        </div>

        {/* ロゴとコピーライト */}
        <div className="border-t border-gray-300 mt-8 pt-6 text-center">
          <img
            src="https://yasukari.com/static/images/logo/250x50.png"
            alt="ヤスカリ ロゴ"
            width={120}
            className="mx-auto mb-2"
          />
          <p className="text-gray-400">© 2025 ヤスカリ Inc.</p>
        </div>
      </div>
    </footer>
  );
}
