import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black font-[Poppins] p-6">
      {/* Fun animated emoji or SVG */}
      <div className="animate-bounce text-7xl mb-4">💬</div>
      {/* BanterBox Logo and Text */}
      <div className="flex items-center gap-4 mb-2">
        {/* Fun SVG logo */}
        <span className="inline-block">
          <svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="28" cy="28" rx="26" ry="22" fill="#6366F1" />
            <ellipse cx="28" cy="28" rx="22" ry="18" fill="#A5B4FC" />
            <path d="M16 38c0-2.21 5.82-4 13-4s13 1.79 13 4v2c0 2.21-5.82 4-13 4s-13-1.79-13-4v-2z" fill="#6366F1" />
            <ellipse cx="22" cy="26" rx="2.5" ry="2.5" fill="#312E81" />
            <ellipse cx="34" cy="26" rx="2.5" ry="2.5" fill="#312E81" />
            <path d="M24 32c1.5 1 6.5 1 8 0" stroke="#312E81" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </span>
        <h1 className="text-5xl sm:text-6xl font-extrabold text-white drop-shadow tracking-tight">BanterBox</h1>
      </div>
      <p className="text-xl sm:text-2xl text-blue-200 mb-6 text-center max-w-xl">Where conversations come alive! Connect, chat, and banter with friends in real time.</p>
      {/* Chat page screenshot showcase: desktop and mobile overlapping */}
      <div className="relative w-full max-w-3xl h-[32rem] flex items-center justify-center mt-0 mb-12">
        <div className="absolute inset-0 rounded-3xl bg-white/10 border-2 border-blue-400/40 shadow-2xl blur-sm"></div>
        <div className="relative z-10 flex items-center justify-center w-full h-full">
          {/* Desktop screenshot */}
          <Image
            src="/pic.png"
            alt="Chat page desktop preview"
            width={520}
            height={320}
            className="rounded-2xl shadow-2xl bg-white/80 p-4"
            style={{ zIndex: 2 }}
          />
          {/* Mobile screenshot, overlapping */}
          <Image
            src="/NEW2.png"
            alt="Chat page mobile preview"
            width={200}
            height={400}
            className="rounded-2xl shadow-xl bg-white/80 p-2 absolute right-10 bottom-0 translate-y-8 translate-x-8 border-4 border-blue-400/40"
            style={{ zIndex: 3 }}
          />
        
        </div>
      </div>
      {/* Enticing call to action */}
      <a
        href="/register"
        className="mt-4 px-8 py-4 bg-gradient-to-br from-blue-600 to-purple-600 text-white text-xl font-bold rounded-2xl shadow-lg hover:scale-105 hover:from-purple-600 hover:to-blue-600 transition-all duration-200"
      >
        Join BanterBox Now!
      </a>
      <p className="mt-8 text-blue-200 text-center max-w-lg">
        BanterBox is the fun, modern way to chat with friends. Edit and delete your messages, get real-time notifications, and enjoy a beautiful, lively chat experience. <span className="font-bold text-white">Ready to banter?</span>
      </p>
    </div>
  );
}
