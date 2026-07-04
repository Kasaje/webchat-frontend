"use client";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";

export default function Home() {
  const router = useRouter();

  const createPrivateRoom = () => {
    const uniqueRoomId = uuidv4(); // สุ่มไอดีห้องเฉพาะตัวด้วย UUID
    router.push(`/chat/${uniqueRoomId}`); // ดีดไปหน้าห้องแชตลับนั้นทันที
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans antialiased">
      <div className="text-center p-8 max-w-sm w-full">
        <h1 className="text-2xl font-semibold tracking-tight mb-2">
          1:1 Private Chat
        </h1>
        <p className="text-sm text-zinc-400 dark:text-zinc-500 mb-8 font-mono leading-relaxed">
          No database. No login. Instant real-time communication.
        </p>
        <button
          onClick={createPrivateRoom}
          className="w-full py-3.5 bg-zinc-900 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-90 active:scale-[0.99] transition-all rounded-full font-medium text-sm tracking-wide shadow-sm"
        >
          Create Secure Room
        </button>
      </div>
    </div>
  );
}
