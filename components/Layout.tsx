import React from "react";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800">
      <div className="layout-shell mx-auto flex w-full max-w-screen-xl flex-col gap-16 px-4 pb-20 pt-10 sm:px-6 lg:px-10">
        {children}
      </div>
    </div>
  );
}
