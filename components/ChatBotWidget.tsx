import React, { useState } from "react";
import { FaComments } from "react-icons/fa";
import ChatBot from "./ChatBot";
import styles from "../styles/ChatSupport.module.css";

type ChatBotWidgetProps = {
  visible?: boolean;
};

export default function ChatBotWidget({ visible = true }: ChatBotWidgetProps) {
  const [open, setOpen] = useState(false);
  if (!visible) {
    return null;
  }
  return (
    <div
      className="fixed bottom-[46px] right-4 z-50 flex flex-col items-end sm:bottom-4"
      aria-hidden={!visible}
    >
      {open && (
        <div>
          {/* Mobile full-screen overlay */}
          <div className="fixed inset-0 bg-white z-50 flex flex-col sm:hidden">
            <ChatBot
              className={`${styles.mobileVariant} flex-1`}
              fullScreen
              onClose={() => setOpen(false)}
            />
          </div>
          {/* Desktop popup */}
          <div className="hidden sm:block relative mb-2 shadow-2xl">
            <ChatBot
              className={`${styles.desktopVariant} ${styles.chatPopup}`}
              onClose={() => setOpen(false)}
            />
          </div>
        </div>
      )}
      <button
        onClick={() => setOpen(!open)}
        className="bg-red-600 text-white p-2.5 sm:p-4 rounded-full shadow-xl hover:shadow-2xl transition"
      >
        <FaComments className="h-5 w-5 sm:h-8 sm:w-8" />
      </button>
    </div>
  );
}
