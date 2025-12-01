
import React, { useState, useEffect } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from './utils/firebase';
import GameRunner from './components/GameRunner';
import AuthButton from './components/AuthButton';
import { GameState } from './types';
import { Settings, X } from 'lucide-react';
import { saveScoreToFirestore, getUserHighScore } from './utils/scoreManager';

// Helper component for letter-by-letter animation
const AnimatedText: React.FC<{ text: string; className?: string }> = ({ text, className = '' }) => {
  return (
    <span className={`text-clip-slide ${className}`}>
      {text.split('').map((letter, index) => (
        <span key={index} className="letter">
          {letter === ' ' ? '\u00A0' : letter}
        </span>
      ))}
    </span>
  );
};

// Marquee component for logos
const LogoMarquee: React.FC = () => {
  const logos = [
    { src: '/gorbage_truck_images/gorbagio_1071.png', alt: 'Gorbagio #1071' },
    { src: '/gorbage_truck_images/gorbagio_3340.png', alt: 'Gorbagio #3340' },
    { src: '/gorbage_truck_images/gorbagio_3494.png', alt: 'Gorbagio #3494' },
    { src: '/gorbage_truck_images/gorbagio_4103.png', alt: 'Gorbagio #4103' },
  ];

  return (
    <div className="marquee-container marquee-mask marquee-slow py-8">
      <div className="marquee-content">
        {/* Duplicate logos for seamless loop */}
        {[...logos, ...logos].map((logo, index) => (
          <div key={index} className="marquee-item">
            <img 
              src={logo.src} 
              alt={logo.alt} 
              className="h-20 w-20 object-cover rounded-xl opacity-70 hover:opacity-100 transition-all hover:scale-110 border-2 border-lime-500/20 hover:border-lime-500/60"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [multiplier, setMultiplier] = useState(1);
  const [highScore, setHighScore] = useState(0);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Settings State
  const [musicVolume, setMusicVolume] = useState(0.5);
  const [sfxVolume, setSfxVolume] = useState(0.5);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Listen for authentication state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Fetch user's high score from Firestore
        const userHighScore = await getUserHighScore();
        setHighScore(userHighScore);
      } else {
        // Fallback to localStorage if not authenticated
        const stored = localStorage.getItem('recycleRushHighScore');
        if (stored) setHighScore(parseInt(stored, 10));
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleGameOver = async (finalScore: number) => {
    if (finalScore > highScore) {
      setHighScore(finalScore);
      
      // Save to Firestore if authenticated
      if (user) {
        const saved = await saveScoreToFirestore(finalScore);
        if (saved) {
          console.log('Score saved to Firestore');
        }
      } else {
        // Fallback to localStorage if not authenticated
        localStorage.setItem('recycleRushHighScore', finalScore.toString());
      }
    }
  };

  const handleStart = () => {
    if (!user) {
      // Show a message or prompt the user to sign in
      alert('Please sign in with X to save your scores!');
      return;
    }
    setGameState(GameState.PLAYING);
    setScore(0);
    setLives(3);
    setMultiplier(1);
    setIsSettingsOpen(false);
  };

  const handleAuthStateChange = (newUser: User | null) => {
    setUser(newUser);
  };

  return (
    <div className="relative w-full h-[100dvh] bg-black overflow-hidden font-sans select-none flex justify-center items-center">
      
      {/* Game Container */}
      <div className="relative w-full h-full max-w-lg aspect-[2/3] bg-gray-900 shadow-2xl overflow-hidden border-0 md:border-2 border-[#14F195]/20 rounded-none md:rounded-3xl">
        <GameRunner 
          gameState={gameState}
          setGameState={setGameState}
          setScore={setScore}
          setLives={setLives}
          setMultiplier={setMultiplier}
          onGameOver={handleGameOver}
          musicVolume={musicVolume}
          sfxVolume={sfxVolume}
        />

        {/* --- HUD --- */}
        {gameState === GameState.PLAYING && (
          <div className="absolute inset-0 pointer-events-none flex flex-col justify-between z-20">
            {/* Top Bar */}
            <div className="flex justify-between items-start p-4 sm:p-6 safe-top bg-gradient-to-b from-black/80 to-transparent">
              {/* Score & Multiplier */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 sm:gap-3 bg-gray-900/80 backdrop-blur-md px-3 sm:px-4 py-2 rounded-full border border-lime-500/30 shadow-lg shadow-lime-500/10">
                  <span className="text-lg sm:text-xl">♻️</span>
                  <span className="text-h3 font-black font-sans tracking-wide text-lime-400">{score}</span>
                </div>
                {multiplier > 1 && (
                  <div className="self-start px-2 sm:px-3 py-1 bg-orange-500 text-white text-label font-bold rounded-full uppercase tracking-widest shadow-lg shadow-orange-500/40 animate-pulse">
                    Combo x{multiplier}
                  </div>
                )}
              </div>
              
              {/* Lives */}
              <div className="flex flex-col items-end gap-2 sm:gap-3">
                <div className="flex gap-1 sm:gap-1.5">
                  {[...Array(3)].map((_, i) => (
                    <svg 
                      key={i}
                      xmlns="http://www.w3.org/2000/svg" 
                      width="24" 
                      height="24"
                      className="sm:w-7 sm:h-7"
                      viewBox="0 0 24 24" 
                      fill={i < lives ? "#ef4444" : "none"} 
                      stroke={i < lives ? "#ef4444" : "#4b5563"}
                      strokeWidth="2.5" 
                      style={{ filter: 'drop-shadow(0 1px 2px rgb(0 0 0 / 0.3))', transition: 'all 0.3s' }}
                    >
                      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
                    </svg>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Controls */}
            <div className="pb-6 sm:pb-10 px-4 sm:px-8 safe-bottom flex justify-between w-full pointer-events-auto">
              <button 
                className="min-w-touch min-h-touch w-20 h-20 sm:w-24 sm:h-24 bg-white/5 backdrop-blur-md rounded-full border border-white/10 flex items-center justify-center active:bg-[#14F195]/20 active:border-[#14F195] transition-all active:scale-95 touch-manipulation shadow-xl"
                onPointerDown={() => (window as any).gameMoveLeft && (window as any).gameMoveLeft()}
                aria-label="Move Left"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 sm:w-10 sm:h-10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
              </button>
              <button 
                className="min-w-touch min-h-touch w-20 h-20 sm:w-24 sm:h-24 bg-white/5 backdrop-blur-md rounded-full border border-white/10 flex items-center justify-center active:bg-[#14F195]/20 active:border-[#14F195] transition-all active:scale-95 touch-manipulation shadow-xl"
                onPointerDown={() => (window as any).gameMoveRight && (window as any).gameMoveRight()}
                aria-label="Move Right"
              >
                 <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 sm:w-10 sm:h-10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
              </button>
            </div>
            
            {/* Instructional Text */}
            <div className="absolute bottom-28 sm:bottom-36 w-full text-center pointer-events-none">
              <span className="text-lime-400 text-label font-bold uppercase tracking-[0.2em] animate-pulse opacity-80">Swipe to Move</span>
            </div>
          </div>
        )}

        {/* --- Menus --- */}
        {(gameState === GameState.MENU || gameState === GameState.GAME_OVER) && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md text-white p-4 sm:p-6 safe-area-inset">
            
            {/* Intro Screen Background Pattern with Clip Animation */}
            <div 
              className="absolute inset-0 z-[-1] opacity-40 bg-clip-reveal"
              style={{
                backgroundImage: 'url("assets/intro_bg_new.png")',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
              }}
            ></div>

            {/* Intro Screen */}
            {gameState === GameState.MENU && !isSettingsOpen && (
              <div className="flex flex-col items-center justify-center w-full h-full max-w-md relative px-6">

                 {/* High Score - Top Left */}
                 <div className="absolute top-6 left-6 flex items-center gap-2 scroll-fade-in scroll-delay-1 z-20">
                   <div className="flex items-center gap-2 bg-gradient-to-br from-lime-500/20 to-green-500/20 backdrop-blur-md px-3 py-1.5 rounded-full border-2 border-lime-500/50 shadow-[0_0_25px_rgba(132,204,22,0.4)]">
                     <span className="text-base">🏆</span>
                     <div className="flex flex-col">
                       <span className="text-[9px] text-lime-400/70 uppercase font-black tracking-widest leading-none">Best</span>
                       <span className="text-body-sm font-black text-lime-400 leading-none mt-0.5">{highScore}</span>
                     </div>
                   </div>
                 </div>

                 {/* Settings Button */}
                 <button 
                   onClick={() => setIsSettingsOpen(true)}
                   className="absolute top-6 right-6 min-w-touch min-h-touch p-2.5 bg-white/5 backdrop-blur-sm rounded-full border border-white/10 text-white/70 hover:text-lime-400 hover:border-lime-400/50 transition-all hover:scale-110 scroll-fade-in scroll-delay-1 z-20"
                   aria-label="Settings"
                 >
                   <Settings className="w-5 h-5" />
                 </button>

                 {/* Main Content - Title Section */}
                 <div className="flex flex-col items-center w-full">
                   {/* Title Section */}
                   <div className="relative scroll-blur-in scroll-delay-2 -mt-[20rem]">
                      <div className="absolute -inset-10 bg-gradient-to-r from-lime-500 via-orange-500 to-lime-500 opacity-30 blur-3xl rounded-full animate-pulse"></div>
                      <h1 className="relative text-center">
                        {/* Main Title: GORBAGE */}
                        <span className="block text-[4.5rem] sm:text-[5.5rem] md:text-[6.5rem] font-black tracking-tight leading-none text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.5)] animate-float" style={{
                          textShadow: '0 0 40px rgba(132, 204, 22, 0.8), 0 0 80px rgba(249, 115, 22, 0.6)',
                        }}>
                          <AnimatedText text="GORBAGE" />
                        </span>
                        
                        {/* Subtitle: TRUCK GAME */}
                        <span className="block text-[2rem] sm:text-[2.5rem] md:text-[3rem] font-black leading-none text-lime-400 -mt-1" style={{
                          filter: 'drop-shadow(0 0 20px rgba(132, 204, 22, 0.9))',
                          letterSpacing: '0.35em',
                          paddingLeft: '0.35em'
                        }}>
                          <AnimatedText text="TRUCK GAME" />
                        </span>
                      </h1>
                      
                      {/* Tagline */}
                      <p className="text-gray-400 text-sm sm:text-base md:text-lg font-bold uppercase tracking-[0.3em] text-center mt-5 scroll-fade-in scroll-delay-4 drop-shadow-lg">
                        Collect • Dodge • Survive
                      </p>
                   </div>
                 </div>

                 {/* Auth Button - Positioned Above Play Button */}
                 <div className="absolute bottom-48 sm:bottom-52 left-0 right-0 w-full flex flex-col items-center px-6 scroll-fade-in scroll-delay-4">
                   {loading ? (
                     <div className="text-gray-400 text-sm font-semibold">Loading...</div>
                   ) : (
                     <AuthButton user={user} onAuthStateChange={handleAuthStateChange} />
                   )}
                 </div>

                 {/* Play Button & Description - Positioned Above Marquee */}
                 <div className="absolute bottom-32 sm:bottom-36 left-0 right-0 w-full flex flex-col items-center space-y-4 px-6 scroll-fade-in scroll-delay-5">
                   {/* Play Button */}
                   <button 
                      onClick={handleStart}
                      disabled={!user}
                      className="w-full max-w-[300px] min-h-touch py-4 sm:py-5 bg-gradient-to-r from-lime-500 via-green-500 to-lime-500 text-black text-lg sm:text-xl md:text-2xl font-black rounded-2xl shadow-[0_0_60px_rgba(132,204,22,0.6)] hover:shadow-[0_0_90px_rgba(132,204,22,0.8)] transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-3 uppercase tracking-wider relative overflow-hidden group pill-button btn-beam disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 sm:w-7 sm:h-7 relative z-10" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                        <path d="M5 3l14 9-14 9V3z"/>
                      </svg>
                      <span className="relative z-10">Play Now</span>
                    </button>

                    {/* Description */}
                    <p className="text-gray-400 text-base sm:text-lg md:text-xl font-semibold text-center max-w-sm leading-relaxed px-4">
                      {user ? 'Drive the gorbage truck & collect trash!' : 'Sign in with X to play and save your scores!'}
                    </p>
                 </div>

                 {/* Logo Marquee - Positioned at Bottom */}
                 <div className="absolute bottom-0 left-0 right-0 w-full scroll-fade-in scroll-delay-7">
                   <LogoMarquee />
                 </div>
              </div>
            )}

            {/* Settings Overlay */}
            {isSettingsOpen && (
               <div className="absolute inset-0 z-40 bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center p-4 sm:p-8 safe-area-inset animate-in fade-in duration-300">
                  <div className="w-full max-w-sm bg-gray-900 border border-white/10 rounded-3xl p-5 sm:p-6 shadow-2xl relative">
                     <button 
                        onClick={() => setIsSettingsOpen(false)}
                        className="absolute top-3 right-3 sm:top-4 sm:right-4 min-w-touch min-h-touch p-2 text-gray-400 hover:text-white transition-colors"
                        aria-label="Close"
                     >
                       <X className="w-5 h-5 sm:w-6 sm:h-6" />
                     </button>
                     
                     <h2 className="text-h2 font-black text-center mb-6 sm:mb-8 bg-clip-text text-transparent bg-gradient-to-r from-lime-400 to-orange-400">
                        SETTINGS
                     </h2>

                     <div className="space-y-6 sm:space-y-8">
                        {/* Music Slider */}
                        <div className="space-y-2 sm:space-y-3">
                           <div className="flex justify-between text-caption font-bold uppercase tracking-wider text-gray-400">
                              <span>Music</span>
                              <span>{Math.round(musicVolume * 100)}%</span>
                           </div>
                           <input 
                              type="range" 
                              min="0" max="1" step="0.05"
                              value={musicVolume}
                              onChange={(e) => setMusicVolume(parseFloat(e.target.value))}
                              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
                           />
                        </div>

                        {/* SFX Slider */}
                        <div className="space-y-2 sm:space-y-3">
                           <div className="flex justify-between text-caption font-bold uppercase tracking-wider text-gray-400">
                              <span>SFX</span>
                              <span>{Math.round(sfxVolume * 100)}%</span>
                           </div>
                           <input 
                              type="range" 
                              min="0" max="1" step="0.05"
                              value={sfxVolume}
                              onChange={(e) => setSfxVolume(parseFloat(e.target.value))}
                              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-lime-500"
                           />
                        </div>
                     </div>

                     <button 
                        onClick={() => setIsSettingsOpen(false)}
                        className="w-full min-h-touch mt-8 sm:mt-10 py-3 bg-white/10 hover:bg-white/20 text-white text-body font-bold rounded-xl transition-colors"
                     >
                        CLOSE
                     </button>
                  </div>
               </div>
            )}

            {/* Game Over Screen */}
            {gameState === GameState.GAME_OVER && (
               <div className="relative w-full h-full flex items-center justify-center safe-area-inset">
                  {/* Sticker Background */}
                  <div 
                    className="absolute inset-0 z-0"
                    style={{
                      backgroundImage: 'url("/game-assets/sticker.webp")',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      backgroundRepeat: 'no-repeat',
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/80 to-black/90"></div>
                  </div>

                  <div className="relative z-10 animate-in fade-in zoom-in duration-500 flex flex-col items-center w-full max-w-sm px-4 sm:px-6">
                    {/* Game Over Title with Oscar Behind */}
                    <div className="mb-10 sm:mb-12 text-center relative">
                      {/* Oscar Image (Behind) */}
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-0 pointer-events-none">
                        <img 
                          src="/game-assets/oscar-game-narrator.png" 
                          alt="Oscar"
                          className="w-44 h-44 sm:w-56 sm:h-56 md:w-64 md:h-64 object-contain opacity-25 drop-shadow-2xl"
                        />
                      </div>
                      
                      {/* Text (In Front) */}
                      <div className="relative z-10">
                        {/* Main Title: GAME OVER */}
                        <h2 className="text-[3.5rem] sm:text-[4.5rem] md:text-[5rem] font-black mb-2 bg-clip-text text-transparent bg-gradient-to-br from-red-400 via-orange-500 to-red-600 drop-shadow-[0_0_45px_rgba(239,68,68,0.7)] tracking-tight leading-none">
                          GAME OVER
                        </h2>
                        
                        {/* Subtitle */}
                        <p className="text-gray-400 text-sm sm:text-base font-bold uppercase tracking-[0.25em] mt-3 drop-shadow-lg">
                          Your Final Stats
                        </p>
                      </div>
                    </div>
                    
                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 gap-3 sm:gap-4 w-full mb-8 sm:mb-10">
                      <div 
                        className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 backdrop-blur-md p-5 sm:p-7 rounded-2xl border-2 border-gray-700/50 flex flex-col items-center justify-center shadow-2xl shadow-black/50 transform hover:scale-105 transition-all duration-300 flashlight-card"
                        onMouseMove={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          const x = ((e.clientX - rect.left) / rect.width) * 100;
                          const y = ((e.clientY - rect.top) / rect.height) * 100;
                          e.currentTarget.style.setProperty('--mouse-x', `${x}%`);
                          e.currentTarget.style.setProperty('--mouse-y', `${y}%`);
                        }}
                      >
                          <div className="text-3xl sm:text-4xl mb-2 drop-shadow-lg">🎯</div>
                          <span className="text-xs sm:text-sm text-gray-400 uppercase font-black tracking-[0.2em] mb-2">Score</span>
                          <span className="text-4xl sm:text-5xl font-black text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.3)]">{score}</span>
                      </div>
                      <div 
                        className="bg-gradient-to-br from-lime-500/15 to-green-500/15 backdrop-blur-md p-5 sm:p-7 rounded-2xl border-2 border-lime-500/50 flex flex-col items-center justify-center shadow-[0_0_40px_rgba(132,204,22,0.25)] relative overflow-hidden transform hover:scale-105 hover:shadow-[0_0_60px_rgba(132,204,22,0.4)] transition-all duration-300 flashlight-card"
                        onMouseMove={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          const x = ((e.clientX - rect.left) / rect.width) * 100;
                          const y = ((e.clientY - rect.top) / rect.height) * 100;
                          e.currentTarget.style.setProperty('--mouse-x', `${x}%`);
                          e.currentTarget.style.setProperty('--mouse-y', `${y}%`);
                        }}
                      >
                          <div className="absolute top-2 right-2 z-10">
                            <div className="w-2 h-2 bg-lime-400 rounded-full animate-ping"></div>
                          </div>
                          <div className="text-3xl sm:text-4xl mb-2 drop-shadow-lg">🏆</div>
                          <span className="text-xs sm:text-sm text-lime-400 uppercase font-black tracking-[0.2em] mb-2">Best</span>
                          <span className="text-4xl sm:text-5xl font-black text-lime-400 drop-shadow-[0_0_20px_rgba(132,204,22,0.9)]">{highScore}</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="w-full space-y-3">
                      <button 
                        onClick={handleStart}
                        className="w-full min-h-touch py-5 sm:py-6 bg-gradient-to-r from-lime-500 via-green-500 to-lime-500 text-black text-h2 font-black rounded-2xl shadow-[0_0_50px_rgba(132,204,22,0.5)] hover:shadow-[0_0_80px_rgba(132,204,22,0.7)] transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2 sm:gap-3 uppercase tracking-wider relative overflow-hidden group pill-button btn-beam"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 sm:w-7 sm:h-7 relative z-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 21h5v-5"/></svg>
                        <span className="relative z-10">Play Again</span>
                      </button>
                      
                      <button 
                        onClick={() => setGameState(GameState.MENU)}
                        className="w-full min-h-touch py-4 bg-gray-800/50 hover:bg-gray-700/60 backdrop-blur-sm border-2 border-gray-600/40 hover:border-gray-500/60 text-gray-300 hover:text-white text-body-sm font-bold rounded-2xl transition-all transform hover:scale-105 active:scale-95 uppercase tracking-[0.15em] shadow-lg"
                      >
                        Main Menu
                      </button>
                    </div>
                  </div>
               </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
