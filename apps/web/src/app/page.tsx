import { SearchBox } from '@/components/features/search/SearchBox';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden px-4">
      {/* Background decoration - Subtle and deep */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-indigo-900/10 rounded-full blur-[100px] -z-10 pointer-events-none"></div>

      <div className="w-full max-w-md mx-auto text-center space-y-6 relative z-10">

        {/* Title */}
        <div className="space-y-2 animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-white/40 opacity-90 select-none">
            Corpus
          </h1>
          <p className="text-xs md:text-sm text-white/40 font-mono tracking-widest uppercase">
            Linguistic Search Engine
          </p>
        </div>

        {/* Search */}
        <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <SearchBox />
        </div>

        {/* Footer / Stats - Extremely minimal */}
        <div className="absolute bottom-10 left-0 w-full text-center opacity-20 text-xs font-mono tracking-widest uppercase animate-fade-in" style={{ animationDelay: '0.5s' }}>
          v1.0.0 • Turkish Web Corpus • Online
        </div>
      </div>
    </main>
  );
}
