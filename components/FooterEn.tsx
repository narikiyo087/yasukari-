import React from "react";
import Link from "next/link";
import {
  FaXTwitter,
  FaInstagram,
  FaYoutube,
  FaLine,
} from "react-icons/fa6";

export default function FooterEn() {
  return (
    <footer className="bg-gray-100 border-t border-gray-200 text-sm text-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          {/* Brand intro & contact */}
          <div>
            <h4 className="font-bold mb-2">ヤスカリ</h4>
            <p className="mb-3">
              We specialize in motorcycle rentals and subscriptions. From mopeds to large and EV bikes, we offer a wide lineup.
              Rentals are available from one day, with monthly plans and corporate services.
            </p>
            <div className="space-y-1">
              <Link href="/en" className="text-red-600 hover:underline block">
                Home
              </Link>
              <Link href="/en/contact" className="text-red-600 hover:underline block">
                Contact us
              </Link>
            </div>
          </div>

          {/* Site policy */}
          <div>
            <h4 className="font-bold mb-2">Site policy</h4>
            <ul className="space-y-1">
              <li>
                <Link href="/en/site-policy" className="hover:underline">
                  Site policy overview
                </Link>
              </li>
              <li>
                <Link href="/en/tokusyouhou" className="hover:underline">
                  Act on Specified Commercial Transactions
                </Link>
              </li>
              <li>
                <Link href="/en/terms" className="hover:underline">
                  Terms of use
                </Link>
              </li>
              <li>
                <Link href="/en/privacy" className="hover:underline">
                  Privacy policy
                </Link>
              </li>
              <li>
                <Link href="/en/external" className="hover:underline">
                  External data transmission
                </Link>
              </li>
              <li>
                <Link href="/en/company" className="hover:underline">
                  Company information
                </Link>
              </li>
              <li>
                <Link href="/en/support-policy" className="hover:underline">
                  Contact & support policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Service info + SNS */}
          <div>
            <h4 className="font-bold mb-2">Services</h4>
            <ul className="space-y-1 mb-4">
              <li>
                <Link href="/en/products" className="hover:underline">
                  Browse all vehicles
                </Link>
              </li>
              <li>
                <Link href="/blog_for_custmor" className="hover:underline">
                  Blog & News
                </Link>
              </li>
              <li>
                <Link href="/en/beginner" className="hover:underline">
                  Beginner's guide
                </Link>
              </li>
              <li>
                <Link href="/en/help" className="hover:underline">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/maintenance" className="hover:underline">
                  Maintenance
                </Link>
              </li>
              <li>
                <Link href="/stores" className="hover:underline">
                  Store list
                </Link>
              </li>
              <li>

                <Link href="/en/insurance" className="hover:underline">
                  Vehicle insurance
                </Link>
              </li>
            </ul>
            <h4 className="font-bold mb-2">SNS & Videos</h4>
            <ul className="space-y-2">
              <li className="flex items-center gap-2">
                <FaXTwitter /> <a href="https://x.com/yasukari_819" className="hover:underline">X (Twitter)</a>
              </li>
              <li className="flex items-center gap-2">
                <FaInstagram /> <a href="https://www.instagram.com/yasukari_819" className="hover:underline">Instagram</a>
              </li>
              <li className="flex items-center gap-2">
                <FaYoutube /> <a href="https://www.youtube.com/@yasukari_819" className="hover:underline">YouTube</a>
              </li>
              <li className="flex items-center gap-2">
                <FaLine /> <a href="https://line.me/R/ti/p/@yasukari_819" className="hover:underline">LINE Official</a>
              </li>
            </ul>
          </div>
        </div>

        {/* Logo & copyright */}
        <div className="border-t border-gray-300 mt-8 pt-6 text-center">
          <img
            src="https://yasukari-file.s3.ap-northeast-1.amazonaws.com/PhotoUploads/1769056104573-d731196a-700f-4cc2-948b-68cfdb40d14a-yasukari-logo.jpg"
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
