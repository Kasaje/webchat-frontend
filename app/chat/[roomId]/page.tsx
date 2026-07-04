"use client";
import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";

// ชี้เป้าไปหาหลังบ้าน (Local ใช้ 3001 พอ deploy จริงจะดึงค่าจาก env บน Vercel อัตโนมัติ)
const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";

interface MessageObject {
  sender: "me" | "other" | "system";
  text: string;
}

export default function ChatRoom() {
  const { roomId } = useParams();
  const router = useRouter();

  const [messages, setMessages] = useState<MessageObject[]>([]);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState("Connecting...");
  const [isJoined, setIsJoined] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Auto Scroll ลื่น ๆ ไปล่างสุดเมื่อมีข้อความใหม่
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!roomId) return;

    const socket = io(SOCKET_URL);
    socketRef.current = socket;

    socket.emit("join_private_room", roomId);

    socket.on("join_success", () => {
      setIsJoined(true);
    });

    socket.on("system_notice", (noticeText: string) => {
      setMessages((prev) => [...prev, { sender: "system", text: noticeText }]);

      if (noticeText.includes("active") || noticeText.includes("joined")) {
        setStatus("Peer connected. Secure.");
      } else if (
        noticeText.includes("left") ||
        noticeText.includes("Waiting")
      ) {
        setStatus("Waiting for peer...");
      }
    });

    socket.on("room_full", (data: { message: string }) => {
      alert(data.message);
      router.push("/");
    });

    socket.on("receive_private_message", (msg: string) => {
      setMessages((prev) => [...prev, { sender: "other", text: msg }]);
    });

    return () => {
      socket.disconnect();
    };
  }, [roomId, router]);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !socketRef.current) return;

    socketRef.current.emit("send_private_message", { roomId, message: input });
    setMessages((prev) => [...prev, { sender: "me", text: input }]);
    setInput("");
  };

  if (!isJoined) {
    return (
      <div className="flex items-center justify-center h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-400 font-mono text-xs tracking-widest animate-pulse p-4 text-center">
        CONNECTING TO ROOM...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans antialiased selection:bg-zinc-200 dark:selection:bg-zinc-800">
      {/* 📱 Minimal Header: Responsive padding & text size */}
      <header className="flex items-center justify-between px-4 py-3.5 md:px-6 md:py-4 border-b border-zinc-200/60 dark:border-zinc-800/60 bg-zinc-50/80 dark:bg-zinc-950/80 backdrop-blur-md sticky top-0 z-10 w-full">
        <div className="flex items-center gap-2 max-w-[60%] sm:max-w-full">
          <div
            className={`w-1.5 h-1.5 rounded-full shrink-0 ${status.includes("Secure") ? "bg-emerald-500" : "bg-amber-400 animate-pulse"}`}
          />
          <span className="text-[11px] md:text-xs font-mono tracking-tight text-zinc-400 dark:text-zinc-500 truncate">
            {status}
          </span>
        </div>
        <button
          onClick={() => {
            navigator.clipboard.writeText(window.location.href);
            alert("Room link copied!");
          }}
          className="text-[11px] md:text-xs font-mono text-zinc-400 hover:text-zinc-900 dark:text-zinc-500 dark:hover:text-zinc-100 transition-colors shrink-0"
        >
          [ Copy Link ]
        </button>
      </header>

      {/* 📱 Chat Canvas Area: จำกัดความกว้างบนจอใหญ่ ปล่อยเต็มความกว้างบนจอมือถือ */}
      <main className="flex-1 overflow-y-auto px-4 py-6 md:px-6 md:py-8 space-y-4 md:space-y-6 max-w-2xl w-full mx-auto">
        {messages.map((msg, index) => {
          if (msg.sender === "system") {
            return (
              <div
                key={index}
                className="flex justify-center my-3 px-2 text-center"
              >
                <span className="text-[10px] md:text-[11px] font-mono tracking-tight text-zinc-400 dark:text-zinc-500 bg-zinc-100 dark:bg-zinc-900/60 px-3 py-1 rounded-full border border-zinc-200/30 dark:border-zinc-800/30 max-w-full break-words">
                  {msg.text}
                </span>
              </div>
            );
          }

          return (
            <div
              key={index}
              className={`flex w-full ${msg.sender === "me" ? "justify-end" : "justify-start"}`}
            >
              {/* 🛠️ แก้ไขภาพ image_762963.png: บังคับด้วย max-w-[85%] บนมือถือ และ break-all ไม่ให้ตัวหนังสือล้นขอบ */}
              <div
                className={`max-w-[85%] sm:max-w-[75%] break-all px-3.5 py-2 md:px-4 md:py-2.5 rounded-2xl text-[13px] md:text-[14px] leading-relaxed shadow-sm tracking-wide ${
                  msg.sender === "me"
                    ? "bg-zinc-900 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900 rounded-br-sm"
                    : "bg-zinc-200/60 text-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 rounded-bl-sm"
                }`}
              >
                {msg.text}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </main>

      {/* 📱 Floating Input Controller: ปรับระยะห่างให้พอดีนิ้วกดบนมือถือ */}
      <footer className="p-4 md:p-6 max-w-2xl w-full mx-auto bg-gradient-to-t from-zinc-50 via-zinc-50 to-transparent dark:from-zinc-950 dark:via-zinc-950 sticky bottom-0">
        <form
          onSubmit={sendMessage}
          className="relative flex items-center bg-zinc-100 dark:bg-zinc-900 rounded-full px-4 py-3 md:px-5 md:py-3.5 shadow-inner border border-transparent focus-within:border-zinc-300 dark:focus-within:border-zinc-700 transition-all w-full"
        >
          <input
            type="text"
            value={input}
            onChange={(e) =>
              e.target.value.length <= 500 && setInput(e.target.value)
            }
            placeholder="Type a message..."
            className="flex-1 bg-transparent text-xs md:text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none pr-10"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="absolute right-2.5 md:right-3 p-1.5 md:p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 disabled:opacity-30 disabled:hover:text-zinc-400 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
              stroke="currentColor"
              className="w-3.5 h-3.5 md:w-4 md:h-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18"
              />
            </svg>
          </button>
        </form>
      </footer>
    </div>
  );
}
