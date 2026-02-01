import React, { useCallback, useRef, useState, useEffect } from 'react';
import './index.css';
import { motion, AnimatePresence } from 'framer-motion';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { useAppStore } from './store';
import { ScreenState, TeamId, ImageSize } from './types';
import { TEAMS, IDOLS, TEAM_TRIVIAS } from './constants';
import { generateFanImage } from './services/geminiService';
import {
  createSession,
  updateSession,
  completeSession,
  saveCapturedImage,
  saveGeneratedImage,
  saveWhatsAppShare,
  updateWhatsAppShareStatus
} from './services/supabaseService';
import {
  triggerWebhook,
  isWebhookConfigured,
  WebhookPayload
} from './services/webhookService';
import Button from './components/Button';
import NumericKeyboard from './components/NumericKeyboard';

// Shutter Sound - usando Web Audio API para gerar um som de clique simples
const playShutterSound = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
  } catch (e) {
    // Se Web Audio API não estiver disponível, ignora silenciosamente
    console.log('Audio não disponível');
  }
};

// Fullscreen helper functions
const enterFullscreen = async () => {
  try {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      await elem.requestFullscreen();
    } else if ((elem as any).webkitRequestFullscreen) {
      await (elem as any).webkitRequestFullscreen();
    } else if ((elem as any).mozRequestFullScreen) {
      await (elem as any).mozRequestFullScreen();
    } else if ((elem as any).msRequestFullscreen) {
      await (elem as any).msRequestFullscreen();
    }
  } catch (err) {
    console.log('Fullscreen not available');
  }
};

const useFullscreen = () => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  return isFullscreen;
};

const WelcomeScreen = () => {
  const { setScreen, setSessionId } = useAppStore();
  const [isStarting, setIsStarting] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const coverImageRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const logosRef = useRef<HTMLDivElement>(null);
  const fullscreenBtnRef = useRef<HTMLButtonElement>(null);
  const isFullscreen = useFullscreen();

  const handleStart = async () => {
    if (isStarting) return;
    setIsStarting(true);
    try {
      // Criar sessão no Supabase
      const sessionId = await createSession();
      setSessionId(sessionId);
      console.log('📱 Nova sessão iniciada:', sessionId);
      setScreen(ScreenState.TEAM_SELECTION);
    } catch (error) {
      console.error('Erro ao criar sessão:', error);
      // Continua mesmo sem sessão (fallback)
      setScreen(ScreenState.TEAM_SELECTION);
    } finally {
      setIsStarting(false);
    }
  };

  // GSAP Animations
  useGSAP(() => {
    if (!containerRef.current) return;

    // Set initial states
    gsap.set(coverImageRef.current, { opacity: 0, scale: 1.15 });
    gsap.set(subtitleRef.current, { opacity: 0, y: 30 });
    gsap.set(buttonRef.current, { opacity: 0, y: 50, scale: 0.8 });
    gsap.set(titleRef.current, { opacity: 0, y: 40 });
    gsap.set(lineRef.current, { scaleX: 0, opacity: 0 });
    gsap.set(logosRef.current, { opacity: 0, y: 20 });
    if (fullscreenBtnRef.current) {
      gsap.set(fullscreenBtnRef.current, { opacity: 0, scale: 0.8 });
    }

    // Main timeline
    const tl = gsap.timeline({
      defaults: { ease: 'power3.out' },
      delay: 0.2
    });

    // Background gradient animation
    tl.from(bgRef.current, {
      scale: 1.3,
      opacity: 0,
      duration: 2,
      ease: 'power2.out',
    }, 0);

    // Cover image - cinematic reveal with Ken Burns effect
    tl.to(coverImageRef.current, {
      opacity: 1,
      scale: 1,
      duration: 2.5,
      ease: 'power2.out',
    }, 0.3);

    // Subtitle entrance
    tl.to(subtitleRef.current, {
      opacity: 1,
      y: 0,
      duration: 1,
      ease: 'power2.out',
    }, 1.2);

    // Button entrance with bounce
    tl.to(buttonRef.current, {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: 1.2,
      ease: 'back.out(1.4)',
    }, 1.5);

    // Title entrance
    tl.to(titleRef.current, {
      opacity: 1,
      y: 0,
      duration: 1,
      ease: 'power2.out',
    }, 1.8);

    // Line animation
    tl.to(lineRef.current, {
      scaleX: 1,
      opacity: 1,
      duration: 0.8,
      ease: 'power2.out',
    }, 2.0);

    // Logos animation
    tl.to(logosRef.current, {
      opacity: 1,
      y: 0,
      duration: 0.8,
      ease: 'power2.out',
    }, 2.2);

    // Fullscreen button animation
    if (fullscreenBtnRef.current) {
      tl.to(fullscreenBtnRef.current, {
        opacity: 1,
        scale: 1,
        duration: 0.6,
        ease: 'back.out(1.5)',
      }, 2.4);
    }

    // Continuous animations (start after main timeline)
    tl.add(() => {
      // Cover image subtle Ken Burns floating
      gsap.to(coverImageRef.current, {
        y: -15,
        scale: 1.02,
        duration: 6,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });

      // Title glow pulse
      gsap.to(titleRef.current, {
        textShadow: '0 0 30px rgba(234, 179, 8, 0.6), 0 0 60px rgba(234, 179, 8, 0.3)',
        duration: 2.5,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });

      // Button pulse
      gsap.to(buttonRef.current, {
        scale: 1.02,
        duration: 1.5,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });
    });

    // Background gradient rotation
    const bgGradients = bgRef.current?.querySelectorAll('.bg-gradient');
    bgGradients?.forEach((grad, i) => {
      gsap.to(grad, {
        rotation: i === 0 ? 15 : -15,
        duration: 20,
        repeat: -1,
        yoyo: true,
        ease: 'none',
      });
    });

  }, { scope: containerRef });

  return (
    <div ref={containerRef} className="relative h-full w-full flex flex-col items-center justify-end pb-16 overflow-hidden">

      {/* Fullscreen Button - Top Right */}
      {!isFullscreen && (
        <button
          ref={fullscreenBtnRef}
          onClick={enterFullscreen}
          className="absolute top-6 right-6 z-50 fullscreen-btn bg-gradient-to-r from-yellow-500/90 to-yellow-600/90 backdrop-blur-sm px-5 py-3 rounded-full flex items-center gap-2 text-black font-bold text-sm hover:scale-105 active:scale-95 transition-transform border border-yellow-400/50"
          style={{ opacity: 0 }}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
          Tela Cheia
        </button>
      )}

      {/* Dynamic Split Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-red-900 via-black to-gray-900 opacity-80" />
        <div className="absolute top-[-20%] left-[-20%] w-[150%] h-[80%] bg-gradient-to-r from-red-600/20 to-transparent rotate-12 blur-3xl" />
        <div className="absolute top-[-20%] right-[-20%] w-[150%] h-[80%] bg-gradient-to-l from-white/10 to-transparent -rotate-12 blur-3xl" />
      </div>

      {/* Cover Image - Zico e Socrates */}
      <div className="absolute top-0 inset-x-0 h-3/5 z-0 pointer-events-none overflow-hidden">
        <div
            ref={coverImageRef}
            className="relative w-full h-full flex items-center justify-center"
            style={{ opacity: 0, transform: 'scale(1.15)' }}
        >
            <img
                src="/assets/cover.png"
                alt="Zico e Socrates - Supercopa Rei"
                className="w-full h-full object-cover object-top"
                style={{ maskImage: 'linear-gradient(to bottom, black 60%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to bottom, black 60%, transparent 100%)' }}
            />
        </div>
      </div>

      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent z-10 pointer-events-none" />

      {/* Main Content */}
      <div className="relative z-20 flex flex-col items-center text-center space-y-8 w-full px-6 -mt-[25vh]">
        <p
            ref={subtitleRef}
            className="text-2xl text-gray-200 font-light"
            style={{ opacity: 0 }}
        >
            Tire sua foto com <span className="font-bold text-white">seu Ídolo!</span>
        </p>

        <button
            ref={buttonRef}
            onClick={handleStart}
            disabled={isStarting}
            className="group relative cursor-pointer disabled:opacity-70"
            style={{ opacity: 0 }}
        >
            <div className="absolute inset-0 bg-yellow-500 rounded-full blur-xl opacity-40 animate-pulse"></div>
            <div className="relative bg-gradient-to-r from-yellow-500 to-yellow-600 text-black font-black text-xl px-12 py-6 rounded-full uppercase tracking-widest shadow-[0_0_30px_rgba(234,179,8,0.4)] border-2 border-yellow-400/50 flex items-center gap-3 hover:scale-105 active:scale-95 transition-transform">
                {isStarting ? 'Iniciando...' : 'Toque para começar'}
                <span className="text-2xl group-hover:translate-x-1 transition-transform">→</span>
            </div>
        </button>

        <div className="space-y-2">
            <h1
                ref={titleRef}
                className="text-6xl font-serif font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 via-yellow-500 to-yellow-700 drop-shadow-sm"
                style={{ opacity: 0 }}
            >
            SUPERCOPA REI
            </h1>
            <div ref={lineRef} className="h-1 w-24 bg-yellow-500 mx-auto rounded-full origin-center" style={{ opacity: 0 }} />
        </div>

        {/* Logos Hit Labz e Holding inPacto */}
        <div
          ref={logosRef}
          className="flex items-center justify-center gap-8 mt-6"
          style={{ opacity: 0 }}
        >
          <img
            src="/assets/logo-hitlabz.svg"
            alt="Hit Labz"
            className="h-9 w-auto opacity-70 hover:opacity-100 transition-opacity"
          />
          <div className="w-px h-7 bg-white/30" />
          <img
            src="/assets/logo-inpacto.svg"
            alt="Holding inPacto"
            className="h-9 w-auto opacity-70 hover:opacity-100 transition-opacity"
          />
        </div>
      </div>
    </div>
  );
};

const TeamSelectionScreen = () => {
  const { setScreen, selectTeam, sessionId } = useAppStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const flaCardRef = useRef<HTMLButtonElement>(null);
  const corCardRef = useRef<HTMLButtonElement>(null);
  const flaLogoRef = useRef<HTMLImageElement>(null);
  const corLogoRef = useRef<HTMLImageElement>(null);
  const vsRef = useRef<HTMLDivElement>(null);
  const backBtnRef = useRef<HTMLButtonElement>(null);
  const [hoveredTeam, setHoveredTeam] = useState<TeamId | null>(null);

  const handleSelect = (team: TeamId) => {
    // Atualizar sessão no Supabase
    if (sessionId) {
      updateSession(sessionId, {
        team_id: team,
        current_screen: ScreenState.IDOL_SELECTION
      }).catch(console.error);
    }

    // Exit animation before navigation
    const tl = gsap.timeline({
      onComplete: () => {
        selectTeam(team);
        setScreen(ScreenState.IDOL_SELECTION);
      }
    });

    if (team === TeamId.FLAMENGO) {
      tl.to(corCardRef.current, { x: 100, opacity: 0, duration: 0.4, ease: 'power2.in' }, 0);
      tl.to(flaCardRef.current, { scale: 1.1, duration: 0.3 }, 0);
      tl.to(flaLogoRef.current, { scale: 1.5, rotation: 360, duration: 0.5, ease: 'power2.in' }, 0.1);
    } else {
      tl.to(flaCardRef.current, { x: -100, opacity: 0, duration: 0.4, ease: 'power2.in' }, 0);
      tl.to(corCardRef.current, { scale: 1.1, duration: 0.3 }, 0);
      tl.to(corLogoRef.current, { scale: 1.5, rotation: 360, duration: 0.5, ease: 'power2.in' }, 0.1);
    }
    tl.to(containerRef.current, { opacity: 0, duration: 0.3 }, 0.3);
  };

  // GSAP Animations
  useGSAP(() => {
    if (!containerRef.current) return;

    // Set initial states
    gsap.set([titleRef.current, subtitleRef.current], { opacity: 0, y: -30 });
    gsap.set(flaCardRef.current, { opacity: 0, x: -100, rotationY: -15 });
    gsap.set(corCardRef.current, { opacity: 0, x: 100, rotationY: 15 });
    gsap.set(vsRef.current, { opacity: 0, scale: 0, rotation: -180 });
    gsap.set(backBtnRef.current, { opacity: 0, y: 30 });

    // Main timeline
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' }, delay: 0.2 });

    // Title entrance
    tl.to(titleRef.current, {
      opacity: 1,
      y: 0,
      duration: 0.8,
    }, 0);

    tl.to(subtitleRef.current, {
      opacity: 1,
      y: 0,
      duration: 0.8,
    }, 0.2);

    // Cards entrance with 3D effect
    tl.to(flaCardRef.current, {
      opacity: 1,
      x: 0,
      rotationY: 0,
      duration: 1,
      ease: 'back.out(1.2)',
    }, 0.4);

    tl.to(corCardRef.current, {
      opacity: 1,
      x: 0,
      rotationY: 0,
      duration: 1,
      ease: 'back.out(1.2)',
    }, 0.5);

    // VS badge entrance
    tl.to(vsRef.current, {
      opacity: 1,
      scale: 1,
      rotation: 0,
      duration: 0.8,
      ease: 'back.out(2)',
    }, 0.8);

    // Back button
    tl.to(backBtnRef.current, {
      opacity: 1,
      y: 0,
      duration: 0.6,
    }, 1);

    // Continuous animations
    tl.add(() => {
      // Logos floating
      gsap.to(flaLogoRef.current, {
        y: -8,
        rotation: 3,
        duration: 2.5,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });

      gsap.to(corLogoRef.current, {
        y: -8,
        rotation: -3,
        duration: 3,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });

      // VS pulse
      gsap.to(vsRef.current, {
        scale: 1.1,
        duration: 1,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });
    });

  }, { scope: containerRef });

  // Hover effects
  useEffect(() => {
    if (hoveredTeam === TeamId.FLAMENGO) {
      gsap.to(flaCardRef.current, { scale: 1.02, duration: 0.3 });
      gsap.to(flaLogoRef.current, { scale: 1.15, duration: 0.3 });
      gsap.to(corCardRef.current, { scale: 0.98, opacity: 0.7, duration: 0.3 });
    } else if (hoveredTeam === TeamId.CORINTHIANS) {
      gsap.to(corCardRef.current, { scale: 1.02, duration: 0.3 });
      gsap.to(corLogoRef.current, { scale: 1.15, duration: 0.3 });
      gsap.to(flaCardRef.current, { scale: 0.98, opacity: 0.7, duration: 0.3 });
    } else {
      gsap.to([flaCardRef.current, corCardRef.current], { scale: 1, opacity: 1, duration: 0.3 });
      gsap.to([flaLogoRef.current, corLogoRef.current], { scale: 1, duration: 0.3 });
    }
  }, [hoveredTeam]);

  return (
    <div ref={containerRef} className="relative flex flex-col h-full w-full overflow-hidden">

      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-gray-900 via-black to-gray-900" />
        {/* Flamengo side glow */}
        <div className={`absolute top-0 left-0 w-1/2 h-full bg-gradient-to-r from-red-600/30 to-transparent transition-opacity duration-500 ${hoveredTeam === TeamId.FLAMENGO ? 'opacity-100' : 'opacity-30'}`} />
        {/* Corinthians side glow */}
        <div className={`absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-white/20 to-transparent transition-opacity duration-500 ${hoveredTeam === TeamId.CORINTHIANS ? 'opacity-100' : 'opacity-30'}`} />
        {/* Center line */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-px h-1/2 bg-gradient-to-b from-transparent via-yellow-500/50 to-transparent" />
      </div>

      {/* Header */}
      <div className="relative z-10 pt-12 pb-6 text-center">
        <h2
          ref={titleRef}
          className="text-4xl font-serif font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-yellow-500 to-white"
          style={{ opacity: 0 }}
        >
          ESCOLHA SEU TIME
        </h2>
        <p
          ref={subtitleRef}
          className="text-gray-400 mt-2 text-lg"
          style={{ opacity: 0 }}
        >
          Qual é a sua paixão?
        </p>
      </div>

      {/* Team Cards Container */}
      <div className="relative z-10 flex-1 flex flex-col justify-center gap-6 px-6 pb-6">

        {/* Flamengo Card */}
        <button
          ref={flaCardRef}
          onClick={() => handleSelect(TeamId.FLAMENGO)}
          onMouseEnter={() => setHoveredTeam(TeamId.FLAMENGO)}
          onMouseLeave={() => setHoveredTeam(null)}
          className="relative h-[35vh] rounded-3xl overflow-hidden cursor-pointer group"
          style={{ opacity: 0, perspective: '1000px' }}
        >
          {/* Card Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-red-900 via-red-800 to-black" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,100,100,0.3),transparent_60%)]" />

          {/* Animated stripes */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute inset-0 bg-[repeating-linear-gradient(90deg,transparent,transparent_40px,rgba(0,0,0,0.3)_40px,rgba(0,0,0,0.3)_80px)]" />
          </div>

          {/* Content */}
          <div className="relative h-full flex items-center justify-between px-8">
            <span className="text-7xl font-black text-white tracking-tighter drop-shadow-lg">
              MENGÃO
            </span>
            <img
              ref={flaLogoRef}
              src="/assets/flamengo.svg"
              alt="Flamengo"
              className="h-40 w-40 object-contain drop-shadow-[0_0_30px_rgba(255,0,0,0.5)]"
            />
          </div>

          {/* Hover glow effect */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-t from-red-500/20 to-transparent" />

          {/* Border glow */}
          <div className="absolute inset-0 rounded-3xl border-2 border-red-500/30 group-hover:border-red-400/60 transition-colors duration-300" />
        </button>

        {/* VS Badge - Between cards */}
        <div
          ref={vsRef}
          className="relative z-20 flex justify-center -my-5"
          style={{ opacity: 0 }}
        >
          <div className="relative">
            <div className="absolute inset-0 bg-yellow-500 rounded-full blur-xl opacity-60" />
            <div className="relative w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(234,179,8,0.5)] border-2 border-yellow-300">
              <span className="text-black font-black text-xl">VS</span>
            </div>
          </div>
        </div>

        {/* Corinthians Card */}
        <button
          ref={corCardRef}
          onClick={() => handleSelect(TeamId.CORINTHIANS)}
          onMouseEnter={() => setHoveredTeam(TeamId.CORINTHIANS)}
          onMouseLeave={() => setHoveredTeam(null)}
          className="relative h-[35vh] rounded-3xl overflow-hidden cursor-pointer group"
          style={{ opacity: 0, perspective: '1000px' }}
        >
          {/* Card Background - White */}
          <div className="absolute inset-0 bg-gradient-to-br from-white via-gray-100 to-gray-200" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(0,0,0,0.05),transparent_60%)]" />

          {/* Animated pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_20px,rgba(0,0,0,0.03)_20px,rgba(0,0,0,0.03)_40px)]" />
          </div>

          {/* Content */}
          <div className="relative h-full flex items-center justify-between px-8">
            <img
              ref={corLogoRef}
              src="/assets/corinthians.svg"
              alt="Corinthians"
              className="h-40 w-40 object-contain drop-shadow-[0_0_20px_rgba(0,0,0,0.3)]"
            />
            <span className="text-7xl font-black text-black tracking-tighter drop-shadow-[0_2px_4px_rgba(0,0,0,0.1)]">
              TIMÃO
            </span>
          </div>

          {/* Hover glow effect */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-t from-black/10 to-transparent" />

          {/* Border glow */}
          <div className="absolute inset-0 rounded-3xl border-2 border-black/10 group-hover:border-black/30 transition-colors duration-300" />
        </button>
      </div>

      {/* Back Button */}
      <div className="relative z-10 px-6 pb-8">
        <button
          ref={backBtnRef}
          onClick={() => setScreen(ScreenState.WELCOME)}
          className="w-full py-4 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white font-medium hover:bg-white/20 transition-all"
          style={{ opacity: 0 }}
        >
          ← Voltar
        </button>
      </div>
    </div>
  );
};

const IdolSelectionScreen = () => {
  const { setScreen, selectIdol, selectedTeam, sessionId } = useAppStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const backBtnRef = useRef<HTMLButtonElement>(null);
  const logoRef = useRef<HTMLImageElement>(null);

  if (!selectedTeam) return null;
  const teamIdols = IDOLS.filter(idol => idol.teamId === selectedTeam);

  const isFlamengo = selectedTeam === TeamId.FLAMENGO;
  const teamName = isFlamengo ? 'MENGÃO' : 'TIMÃO';
  const teamLogo = isFlamengo ? '/assets/flamengo.svg' : '/assets/corinthians.svg';

  const handleSelect = (idol: typeof IDOLS[0]) => {
    // Atualizar sessão no Supabase
    if (sessionId) {
      updateSession(sessionId, {
        idol_id: idol.id,
        current_screen: ScreenState.CAMERA
      }).catch(console.error);
    }

    // Exit animation
    const tl = gsap.timeline({
      onComplete: () => {
        selectIdol(idol);
        setScreen(ScreenState.CAMERA);
      }
    });

    tl.to(cardsRef.current?.children || [], {
      y: 50,
      opacity: 0,
      stagger: 0.05,
      duration: 0.3,
      ease: 'power2.in'
    }, 0);
    tl.to(containerRef.current, { opacity: 0, duration: 0.3 }, 0.2);
  };

  // GSAP Animations
  useGSAP(() => {
    if (!containerRef.current) return;

    // Set initial states
    gsap.set(titleRef.current, { opacity: 0, y: -30 });
    gsap.set(subtitleRef.current, { opacity: 0, y: -20 });
    gsap.set(logoRef.current, { opacity: 0, scale: 0.5, rotation: -180 });
    gsap.set(backBtnRef.current, { opacity: 0, y: 30 });

    // Main timeline
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' }, delay: 0.2 });

    // Logo entrance
    tl.to(logoRef.current, {
      opacity: 0.9,
      scale: 1,
      rotation: 0,
      duration: 1.2,
      ease: 'back.out(1.5)',
    }, 0);

    // Title entrance
    tl.to(titleRef.current, {
      opacity: 1,
      y: 0,
      duration: 0.8,
    }, 0.2);

    tl.to(subtitleRef.current, {
      opacity: 1,
      y: 0,
      duration: 0.8,
    }, 0.4);

    // Cards entrance
    if (cardsRef.current) {
      gsap.set(cardsRef.current.children, { opacity: 0, x: -50, scale: 0.95 });
      tl.to(cardsRef.current.children, {
        opacity: 1,
        x: 0,
        scale: 1,
        duration: 0.6,
        stagger: 0.15,
        ease: 'back.out(1.2)',
      }, 0.5);
    }

    // Back button
    tl.to(backBtnRef.current, {
      opacity: 1,
      y: 0,
      duration: 0.6,
    }, 0.8);

    // Continuous logo animation
    tl.add(() => {
      gsap.to(logoRef.current, {
        rotation: 5,
        scale: 1.02,
        duration: 4,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });
    });

  }, { scope: containerRef, dependencies: [selectedTeam] });

  return (
    <div ref={containerRef} className="relative flex flex-col h-full w-full overflow-hidden">

      {/* Dynamic Background based on team */}
      <div className="absolute inset-0 z-0">
        {isFlamengo ? (
          <>
            <div className="absolute inset-0 bg-gradient-to-b from-red-950 via-black to-black" />
            <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-red-600/20 to-transparent" />
          </>
        ) : (
          <>
            <div className="absolute inset-0 bg-gradient-to-b from-gray-200 via-gray-100 to-white" />
            <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-black/10 to-transparent" />
          </>
        )}
      </div>

      {/* Background Logo - Left side */}
      <img
        ref={logoRef}
        src={teamLogo}
        alt={teamName}
        className="absolute top-1/2 -left-[35%] -translate-y-1/2 w-[90%] h-auto object-contain pointer-events-none"
        style={{ opacity: 0 }}
      />

      {/* Header */}
      <div className="relative z-10 pt-10 pb-4 text-center">
        <h2
          ref={titleRef}
          className={`text-4xl font-serif font-black ${isFlamengo ? 'text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-yellow-500 to-red-400' : 'text-black'}`}
          style={{ opacity: 0 }}
        >
          ESCOLHA SEU ÍDOLO
        </h2>
        <p
          ref={subtitleRef}
          className={`mt-2 text-lg ${isFlamengo ? 'text-red-300' : 'text-gray-600'}`}
          style={{ opacity: 0 }}
        >
          Lendas do {teamName}
        </p>
      </div>

      {/* Idol Cards - Full width over logo */}
      <div
        ref={cardsRef}
        className="relative z-10 flex-1 overflow-hidden px-6 pb-4 space-y-4 flex flex-col justify-center"
      >
        {teamIdols.map((idol) => (
          <button
            key={idol.id}
            onClick={() => handleSelect(idol)}
            className={`w-full relative rounded-2xl overflow-hidden cursor-pointer group transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] backdrop-blur-sm ${
              isFlamengo
                ? 'bg-gradient-to-r from-red-900/90 via-red-800/80 to-black/90 border border-red-500/30 hover:border-red-400/60'
                : 'bg-black/70 border border-white/20 hover:border-white/40 hover:bg-black/80'
            }`}
          >
            {/* Card glow effect */}
            <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
              isFlamengo ? 'bg-gradient-to-r from-red-500/20 to-transparent' : 'bg-gradient-to-r from-white/10 to-transparent'
            }`} />

            <div className="relative flex items-center p-4 gap-4">
              {/* Idol Image */}
              <div className={`relative w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 ${
                isFlamengo ? 'ring-2 ring-red-500/50 group-hover:ring-red-400' : 'ring-2 ring-white/30 group-hover:ring-white/60'
              } transition-all`}>
                <img
                  src={idol.imageUrl}
                  alt={idol.name}
                  className="w-full h-full object-cover object-top group-hover:scale-110 transition-transform duration-500"
                />
                {/* Image overlay */}
                <div className={`absolute inset-0 ${isFlamengo ? 'bg-gradient-to-t from-red-900/50 to-transparent' : 'bg-gradient-to-t from-black/50 to-transparent'}`} />
              </div>

              {/* Idol Info */}
              <div className="flex-1 text-left min-w-0">
                <h3 className="text-2xl font-black tracking-tight truncate text-white">
                  {idol.name}
                </h3>
                <p className={`text-lg font-medium ${isFlamengo ? 'text-yellow-400' : 'text-gray-300'}`}>
                  {idol.nickname}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    isFlamengo ? 'bg-red-500/30 text-red-200' : 'bg-white/20 text-white/80'
                  }`}>
                    {idol.position}
                  </span>
                  <span className={`text-xs ${isFlamengo ? 'text-gray-400' : 'text-gray-400'}`}>
                    {idol.era}
                  </span>
                </div>
              </div>

              {/* Arrow indicator */}
              <div className={`text-2xl transition-transform group-hover:translate-x-2 ${isFlamengo ? 'text-red-400' : 'text-white/60'}`}>
                →
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Back Button */}
      <div className="relative z-10 px-6 pb-8 pt-4">
        <button
          ref={backBtnRef}
          onClick={() => setScreen(ScreenState.TEAM_SELECTION)}
          className={`w-full py-4 rounded-full font-medium transition-all ${
            isFlamengo
              ? 'bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20'
              : 'bg-black/10 backdrop-blur-sm border border-black/20 text-black hover:bg-black/20'
          }`}
          style={{ opacity: 0 }}
        >
          ← Voltar
        </button>
      </div>
    </div>
  );
};

const InstructionScreen = () => {
  const { setScreen, selectedIdol, selectedTeam } = useAppStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const isFlamengo = selectedTeam === TeamId.FLAMENGO;
  const videoSrc = isFlamengo ? '/assets/video-flamengo.mp4' : '/assets/video-corinthians.mp4';

  // Auto-advance when video ends
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      const handleEnded = () => {
        setScreen(ScreenState.CAMERA);
      };
      video.addEventListener('ended', handleEnded);
      return () => video.removeEventListener('ended', handleEnded);
    }
  }, [setScreen]);

  // Fallback timer if video doesn't load
  useEffect(() => {
    const timer = setTimeout(() => {
      setScreen(ScreenState.CAMERA);
    }, 15000);
    return () => clearTimeout(timer);
  }, [setScreen]);

  // GSAP Animations
  useGSAP(() => {
    if (!containerRef.current) return;

    gsap.set(titleRef.current, { opacity: 0, y: -20 });
    gsap.set(subtitleRef.current, { opacity: 0, y: 20 });
    gsap.set(buttonRef.current, { opacity: 0, y: 30 });
    gsap.set(videoRef.current, { opacity: 0, scale: 0.95 });

    const tl = gsap.timeline({ defaults: { ease: 'power3.out' }, delay: 0.2 });

    tl.to(titleRef.current, { opacity: 1, y: 0, duration: 0.8 }, 0);
    tl.to(videoRef.current, { opacity: 1, scale: 1, duration: 1 }, 0.2);
    tl.to(subtitleRef.current, { opacity: 1, y: 0, duration: 0.8 }, 0.5);
    tl.to(buttonRef.current, { opacity: 1, y: 0, duration: 0.8 }, 0.7);

  }, { scope: containerRef });

  return (
    <div ref={containerRef} className="relative flex flex-col h-full w-full overflow-hidden">

      {/* Background */}
      <div className="absolute inset-0 z-0">
        {isFlamengo ? (
          <div className="absolute inset-0 bg-gradient-to-b from-red-950 via-black to-black" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-b from-gray-900 via-black to-black" />
        )}
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full p-6">

        {/* Header */}
        <div className="text-center py-6">
          <h2
            ref={titleRef}
            className={`text-4xl font-serif font-black ${isFlamengo ? 'text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-yellow-500 to-red-400' : 'text-white'}`}
            style={{ opacity: 0 }}
          >
            PREPARE-SE!
          </h2>
        </div>

        {/* Video */}
        <div className="flex-1 flex items-center justify-center">
          <video
            ref={videoRef}
            src={videoSrc}
            autoPlay
            muted
            playsInline
            className={`w-full max-h-[60vh] rounded-2xl object-contain border-2 ${isFlamengo ? 'border-red-500/50' : 'border-white/30'}`}
            style={{ opacity: 0 }}
          />
        </div>

        {/* Footer */}
        <div className="text-center py-6 space-y-4">
          <p
            ref={subtitleRef}
            className={`text-xl ${isFlamengo ? 'text-red-300' : 'text-gray-300'}`}
            style={{ opacity: 0 }}
          >
            Deixe um espaço ao seu lado para o <span className="font-bold text-yellow-400">{selectedIdol?.nickname}</span>
          </p>

          <button
            ref={buttonRef}
            onClick={() => setScreen(ScreenState.CAMERA)}
            className={`px-8 py-3 rounded-full font-bold transition-all ${
              isFlamengo
                ? 'bg-red-600 hover:bg-red-500 text-white'
                : 'bg-white hover:bg-gray-200 text-black'
            }`}
            style={{ opacity: 0 }}
          >
            Pular →
          </button>
        </div>
      </div>
    </div>
  );
};

// Replaced react-webcam with native video implementation to fix load error
const CameraScreen = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const countdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const { setScreen, setCapturedImage, selectedTeam, selectedIdol, sessionId } = useAppStore();
  const [countdown, setCountdown] = useState<number | null>(null);
  const [showFlash, setShowFlash] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const isFlamengo = selectedTeam === TeamId.FLAMENGO;

  useEffect(() => {
    // Initialize Camera
    async function setupCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: 'user',
                width: { ideal: 1080 },
                height: { ideal: 1920 }
            },
            audio: false
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => setIsReady(true);
        }
      } catch (err) {
        console.error("Camera Error:", err);
        setStreamError("Erro ao acessar câmera. Verifique permissões.");
      }
    }

    setupCamera();

    // Cleanup stream on unmount
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // GSAP Animations
  useGSAP(() => {
    if (!containerRef.current || !isReady) return;

    gsap.set(frameRef.current, { opacity: 0, scale: 1.1 });
    gsap.set(buttonRef.current, { opacity: 0, y: 50, scale: 0.8 });

    const tl = gsap.timeline({ defaults: { ease: 'power3.out' }, delay: 0.3 });

    tl.to(frameRef.current, { opacity: 1, scale: 1, duration: 0.8 }, 0);
    tl.to(buttonRef.current, { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: 'back.out(1.5)' }, 0.4);

  }, { scope: containerRef, dependencies: [isReady] });

  // Countdown animation
  useEffect(() => {
    if (countdown !== null && countdown > 0 && countdownRef.current) {
      gsap.fromTo(countdownRef.current,
        { scale: 2, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.4, ease: 'back.out(2)' }
      );
    }
  }, [countdown]);

  const startCapture = () => {
    setCountdown(3);
  };

  useEffect(() => {
    if (countdown === null) return;

    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown((c: number | null) => (c ? c - 1 : 0)), 1000);
      return () => clearTimeout(timer);
    } else {
      // Countdown finished
      playShutterSound();
      setShowFlash(true);

      // Capture Image using Canvas
      if (videoRef.current && canvasRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const imageSrc = canvas.toDataURL('image/jpeg', 0.9);

            // Salvar no Supabase Storage
            const saveAndNavigate = async () => {
              setIsSaving(true);
              try {
                if (sessionId) {
                  const { url } = await saveCapturedImage(sessionId, imageSrc);
                  setCapturedImage(imageSrc, url);
                  console.log('📸 Foto salva no storage:', url);
                } else {
                  setCapturedImage(imageSrc);
                }
              } catch (error) {
                console.error('Erro ao salvar foto:', error);
                setCapturedImage(imageSrc);
              } finally {
                setIsSaving(false);
                setScreen(ScreenState.GENERATION);
                setShowFlash(false);
              }
            };

            const finishTimer = setTimeout(saveAndNavigate, 400);
            return () => clearTimeout(finishTimer);
        }
      }
    }
  }, [countdown, setCapturedImage, setScreen, sessionId]);

  return (
    <div ref={containerRef} className="relative h-full w-full bg-black overflow-hidden">

      {/* Flash Effect */}
      <div
        className={`absolute inset-0 bg-white z-50 pointer-events-none transition-opacity duration-200 ease-out ${showFlash ? 'opacity-100' : 'opacity-0'}`}
      />

      {/* Camera Frame */}
      <div
        ref={frameRef}
        className="absolute inset-0"
        style={{ opacity: 0 }}
      >
        {streamError ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-4">
            <div className={`text-6xl ${isFlamengo ? 'text-red-500' : 'text-white'}`}>📷</div>
            <p className="text-red-400 text-lg">{streamError}</p>
            <button
              onClick={() => setScreen(ScreenState.IDOL_SELECTION)}
              className="px-6 py-3 rounded-full bg-white/10 text-white"
            >
              ← Voltar
            </button>
          </div>
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="h-full w-full object-cover transform scale-x-[-1]"
          />
        )}

        {/* Frame Overlay */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Corner guides */}
          <div className={`absolute top-8 left-8 w-16 h-16 border-l-4 border-t-4 ${isFlamengo ? 'border-red-500' : 'border-white'} rounded-tl-2xl`} />
          <div className={`absolute top-8 right-8 w-16 h-16 border-r-4 border-t-4 ${isFlamengo ? 'border-red-500' : 'border-white'} rounded-tr-2xl`} />
          <div className={`absolute bottom-32 left-8 w-16 h-16 border-l-4 border-b-4 ${isFlamengo ? 'border-red-500' : 'border-white'} rounded-bl-2xl`} />
          <div className={`absolute bottom-32 right-8 w-16 h-16 border-r-4 border-b-4 ${isFlamengo ? 'border-red-500' : 'border-white'} rounded-br-2xl`} />
        </div>

        {/* Top gradient for text readability */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />

        {/* Bottom gradient */}
        <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-black via-black/80 to-transparent pointer-events-none" />
      </div>

      {/* Hidden Canvas for Capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Header */}
      {countdown === null && !streamError && (
        <div className="absolute top-0 left-0 right-0 z-20 p-6 flex items-center justify-between">
          <button
            onClick={() => setScreen(ScreenState.IDOL_SELECTION)}
            className={`px-4 py-2 rounded-full backdrop-blur-md transition-all ${
              isFlamengo ? 'bg-red-900/50 hover:bg-red-800/60 text-white' : 'bg-white/20 hover:bg-white/30 text-white'
            }`}
          >
            ← Voltar
          </button>
          <div className={`px-4 py-2 rounded-full backdrop-blur-md ${isFlamengo ? 'bg-red-900/50' : 'bg-white/20'}`}>
            <span className="text-white text-sm font-medium">Foto com {selectedIdol?.nickname}</span>
          </div>
        </div>
      )}

      {/* Countdown Overlay */}
      {countdown !== null && countdown > 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm z-30">
          <div
            ref={countdownRef}
            className={`w-40 h-40 rounded-full flex items-center justify-center ${
              isFlamengo ? 'bg-red-600' : 'bg-white'
            } shadow-[0_0_60px_rgba(255,255,255,0.3)]`}
          >
            <span className={`text-8xl font-black ${isFlamengo ? 'text-white' : 'text-black'}`}>
              {countdown}
            </span>
          </div>
          <p className="text-white text-2xl mt-8 font-medium">Prepare seu melhor sorriso!</p>
        </div>
      )}

      {/* Capture Button */}
      {countdown === null && !streamError && isReady && (
        <div className="absolute bottom-8 left-0 right-0 flex flex-col items-center z-20 space-y-4">
          <p className="text-white/80 text-sm">Toque para fotografar</p>
          <button
            ref={buttonRef}
            onClick={startCapture}
            className={`w-24 h-24 rounded-full shadow-2xl active:scale-90 transition-all flex items-center justify-center ${
              isFlamengo
                ? 'bg-gradient-to-br from-red-500 to-red-700 ring-4 ring-red-400/50'
                : 'bg-gradient-to-br from-white to-gray-200 ring-4 ring-white/50'
            }`}
            style={{ opacity: 0 }}
          >
            <div className={`w-20 h-20 rounded-full border-4 ${isFlamengo ? 'border-white/30' : 'border-black/10'} flex items-center justify-center`}>
              <div className={`w-8 h-8 rounded-full ${isFlamengo ? 'bg-white' : 'bg-red-500'}`} />
            </div>
          </button>
        </div>
      )}
    </div>
  );
};

const GenerationScreen = () => {
  const {
    capturedImage,
    selectedIdol,
    selectedTeam,
    setGeneratedImage,
    setScreen,
    imageSize,
    sessionId
  } = useAppStore();

  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [stageText, setStageText] = useState("Analisando Foto...");
  const [currentTrivia, setCurrentTrivia] = useState(0);
  const generationStartTime = useRef<number>(0);

  // Rotacionar trivias a cada 5 segundos durante a geração
  useEffect(() => {
    if (!isGenerating || !selectedTeam) return;

    const trivias = TEAM_TRIVIAS[selectedTeam];
    setCurrentTrivia(Math.floor(Math.random() * trivias.length));

    const interval = setInterval(() => {
      setCurrentTrivia(prev => (prev + 1) % trivias.length);
    }, 7000);

    return () => clearInterval(interval);
  }, [isGenerating, selectedTeam]);

  useEffect(() => {
    let interval: any;
    if (isGenerating) {
        setProgress(0);
        interval = setInterval(() => {
            setProgress((old: number) => {
                if (old >= 90) return 90;
                // Progresso mais lento e gradual
                // Quanto mais perto de 90%, mais devagar
                const remaining = 90 - old;
                const increment = Math.max(0.3, remaining * 0.02);
                return old + increment;
            });
        }, 500); // Intervalo maior para progresso mais realista
    }
    return () => clearInterval(interval);
  }, [isGenerating]);

  useEffect(() => {
    if (!isGenerating) return;
    if (progress < 25) setStageText("Analisando Foto...");
    else if (progress < 50) setStageText("Compondo Cena...");
    else if (progress < 80) setStageText("Renderizando Detalhes...");
    else setStageText("Finalizando...");
  }, [progress, isGenerating]);


  const handleGenerate = async () => {
    if (!capturedImage || !selectedIdol || !selectedTeam) return;

    setIsGenerating(true);
    setError(null);
    generationStartTime.current = Date.now();

    try {
      // Gerar prompt para logging
      const prompt = `Fan photo with ${selectedIdol.name} from ${TEAMS[selectedTeam].name}`;

      const result = await generateFanImage(
        capturedImage,
        selectedIdol.name,
        TEAMS[selectedTeam].name,
        imageSize
      );

      const generationTimeMs = Date.now() - generationStartTime.current;
      setProgress(95);
      setStageText("Salvando...");

      // Salvar no Supabase Storage e banco de dados
      let imageUrl = '';
      let imageId = '';

      if (sessionId) {
        try {
          const savedImage = await saveGeneratedImage(
            sessionId,
            result,
            selectedTeam,
            selectedIdol.id,
            imageSize,
            prompt,
            generationTimeMs
          );
          imageUrl = savedImage.url;
          imageId = savedImage.id;
          console.log('🎨 Imagem gerada salva:', savedImage.url);
        } catch (saveError) {
          console.error('Erro ao salvar imagem gerada:', saveError);
        }
      }

      setProgress(100);
      setStageText("Concluído!");

      setTimeout(() => {
        setGeneratedImage(result, imageUrl, imageId);
        setScreen(ScreenState.RESULT);
      }, 500);

    } catch (e: any) {
      console.error('❌ Erro ao gerar imagem:', e);
      console.error('Detalhes:', JSON.stringify(e, null, 2));
      const errorMessage = e?.message || e?.error?.message || "Não foi possível gerar a magia agora. Tente novamente.";
      setError(errorMessage);
      setIsGenerating(false);
      setProgress(0);
    }
  };

  if (!capturedImage) return <div className="p-10 text-center">Nenhuma foto capturada.</div>;

  return (
    <div className="flex flex-col h-full p-6 space-y-6 overflow-hidden">
      <h2 className="text-3xl font-serif text-center flex-shrink-0">{isGenerating ? 'Criando a Mágica...' : 'Configurar Foto'}</h2>
      
      <div className="flex-1 relative rounded-2xl overflow-hidden liquid-glass border-0 transition-all duration-500">
        <AnimatePresence>
        {isGenerating && (
           <motion.div
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
             className="absolute inset-0 flex flex-col items-center justify-between bg-black/90 z-20 p-8 backdrop-blur-md"
           >

             {/* Trivias no topo */}
             {selectedTeam && (
               <div className="px-4 max-w-md min-h-[80px] flex items-center">
                 <AnimatePresence mode="wait">
                   <motion.p
                     key={currentTrivia}
                     initial={{ opacity: 0, y: 20 }}
                     animate={{ opacity: 1, y: 0 }}
                     exit={{ opacity: 0, y: -20 }}
                     transition={{ duration: 0.5 }}
                     className="text-white text-base text-center leading-relaxed font-medium"
                   >
                     {TEAM_TRIVIAS[selectedTeam][currentTrivia]}
                   </motion.p>
                 </AnimatePresence>
               </div>
             )}

             <div className="relative w-56 h-56 flex items-center justify-center">
                <motion.div 
                  className="absolute inset-0 border-4 border-transparent border-t-yellow-500/60 rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                />
                <motion.div 
                  className="absolute inset-4 border-2 border-transparent border-b-white/30 rounded-full"
                  animate={{ rotate: -360 }}
                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                />
                <motion.div 
                  className="absolute inset-0 rounded-full border border-yellow-500/10"
                  animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.3, 0.1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-yellow-500/20 relative shadow-[0_0_40px_rgba(234,179,8,0.2)] z-10">
                   <img src={selectedIdol?.imageUrl} className="w-full h-full object-cover opacity-90 grayscale-[30%]" alt="Idol" />
                   <motion.div 
                     className="absolute inset-0 bg-gradient-to-b from-transparent via-yellow-500/20 to-transparent"
                     animate={{ top: ['-100%', '100%'] }}
                     transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                   />
                </div>
             </div>

             <div className="h-20 flex flex-col items-center justify-center w-full z-10">
                <AnimatePresence mode="wait">
                 <motion.h3
                   key={stageText}
                   initial={{ y: 15, opacity: 0, scale: 0.95 }}
                   animate={{ y: 0, opacity: 1, scale: 1 }}
                   exit={{ y: -15, opacity: 0, scale: 0.95 }}
                   transition={{ duration: 0.4, ease: "easeOut" }}
                   className="text-2xl font-serif text-yellow-400 font-bold text-center tracking-wide"
                 >
                   {stageText}
                 </motion.h3>
               </AnimatePresence>
               
               <p className="text-gray-500 text-xs mt-2 font-mono tracking-[0.2em] uppercase">
                 Processing {Math.round(progress)}%
               </p>
             </div>

             {/* Barra de progresso e aviso */}
             <div className="flex flex-col items-center gap-4 pb-4">
               <div className="w-64 h-1 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-yellow-600 via-yellow-400 to-yellow-600"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ type: "spring", stiffness: 50, damping: 20 }}
                  />
               </div>

               {/* Aviso de tempo */}
               <p className="text-white/50 text-xs text-center">
                 ⏱️ A revelação da foto leva em média 30 a 40 segundos
               </p>
             </div>

           </motion.div>
        )}
        </AnimatePresence>

        <img src={capturedImage} alt="Captured" className={`w-full h-full object-cover transition-all duration-700 ${isGenerating ? 'scale-105 blur-md opacity-30' : ''}`} />
      </div>

      {!isGenerating && (
        <div className="space-y-4 animate-slide-up flex-shrink-0">
          <Button fullWidth onClick={handleGenerate} disabled={isGenerating}>
            GERAR FOTO COM ÍDOLO
          </Button>

          <Button variant="secondary" fullWidth onClick={() => setScreen(ScreenState.CAMERA)} disabled={isGenerating}>
            Tirar Outra Foto
          </Button>
        </div>
      )}
       {error && <p className="text-red-500 text-center bg-red-900/20 p-2 rounded">{error}</p>}
    </div>
  );
};

// Frases variadas para o resultado
const RESULT_PHRASES = {
  [TeamId.FLAMENGO]: [
    "Isso sim é Mengão!",
    "A Nação aprova!",
    "Rubro-Negro até o fim!",
    "É pra isso que a gente vive!",
    "Que foto, meu Mengão!",
    "Isso é Flamengo, pai!",
    "Uma vez Flamengo, sempre Flamengo!",
    "A Nação é gigante!",
    "É campeão, pô!",
    "Maior do Brasil!",
    "Que registro histórico!",
    "Momentão Rubro-Negro!",
    "O Mengão é demais!",
    "Flamengo no coração!",
    "Essa foto é um golaço!"
  ],
  [TeamId.CORINTHIANS]: [
    "Isso é Corinthians!",
    "A Fiel aprova!",
    "Vai, Corinthians!",
    "Todo Poderoso Timão!",
    "Preto no Branco!",
    "Eternamente Fiel!",
    "O Timão é gigante!",
    "Aqui é Corinthians!",
    "Fiel até morrer!",
    "Que registro, Fiel!",
    "É o Bando de Loucos!",
    "Corinthians, minha vida!",
    "O povo do Corinthians!",
    "Alvinegro de coração!",
    "Essa foto é um golaço!"
  ]
};

const ResultScreen = () => {
  const { generatedImage, setScreen, resetSession, selectedTeam, selectedIdol } = useAppStore();
  const [phrase] = useState(() => {
    if (!selectedTeam) return "Ficou Incrível!";
    const phrases = RESULT_PHRASES[selectedTeam];
    return phrases[Math.floor(Math.random() * phrases.length)];
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const buttonsRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);

  const isFlamengo = selectedTeam === TeamId.FLAMENGO;

  // GSAP Animations
  useGSAP(() => {
    if (!containerRef.current || !generatedImage) return;

    gsap.set(titleRef.current, { opacity: 0, y: -30, scale: 0.9 });
    gsap.set(imageRef.current, { opacity: 0, scale: 0.95, y: 20 });
    gsap.set(buttonsRef.current, { opacity: 0, y: 40 });
    gsap.set(badgeRef.current, { opacity: 0, scale: 0 });

    const tl = gsap.timeline({ defaults: { ease: 'power3.out' }, delay: 0.2 });

    // Title entrance with celebration effect
    tl.to(titleRef.current, {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: 0.8,
      ease: 'back.out(1.5)'
    }, 0);

    // Image entrance
    tl.to(imageRef.current, {
      opacity: 1,
      scale: 1,
      y: 0,
      duration: 1,
      ease: 'power2.out'
    }, 0.2);

    // Badge pop
    tl.to(badgeRef.current, {
      opacity: 1,
      scale: 1,
      duration: 0.6,
      ease: 'back.out(2)'
    }, 0.6);

    // Buttons entrance
    tl.to(buttonsRef.current, {
      opacity: 1,
      y: 0,
      duration: 0.8
    }, 0.5);

    // Continuous title glow
    tl.add(() => {
      gsap.to(titleRef.current, {
        textShadow: isFlamengo
          ? '0 0 30px rgba(239, 68, 68, 0.8), 0 0 60px rgba(239, 68, 68, 0.4)'
          : '0 0 30px rgba(255, 255, 255, 0.8), 0 0 60px rgba(255, 255, 255, 0.4)',
        duration: 1.5,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut'
      });
    });

  }, { scope: containerRef, dependencies: [generatedImage] });

  if (!generatedImage) return null;

  return (
    <div ref={containerRef} className="relative flex flex-col h-full w-full overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        {isFlamengo ? (
          <>
            <div className="absolute inset-0 bg-gradient-to-b from-red-950 via-black to-black" />
            <div className="absolute top-0 left-0 w-full h-1/3 bg-gradient-to-b from-red-600/30 to-transparent" />
          </>
        ) : (
          <>
            <div className="absolute inset-0 bg-gradient-to-b from-gray-900 via-black to-black" />
            <div className="absolute top-0 left-0 w-full h-1/3 bg-gradient-to-b from-white/20 to-transparent" />
          </>
        )}
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full p-6 space-y-6">
        <h2
          ref={titleRef}
          className={`text-4xl font-serif text-center font-black drop-shadow-lg ${
            isFlamengo ? 'text-red-400' : 'text-white'
          }`}
          style={{ opacity: 0 }}
        >
          {phrase}
        </h2>
      
        <div
          ref={imageRef}
          className={`flex-1 rounded-2xl overflow-hidden relative ${
            isFlamengo
              ? 'border-2 border-red-500/50 shadow-2xl shadow-red-500/20'
              : 'border-2 border-white/30 shadow-2xl shadow-white/10'
          }`}
          style={{ opacity: 0 }}
        >
          <img src={generatedImage} alt="Final Result" className="w-full h-full object-cover" />

          {/* Logos */}
          <div
            ref={badgeRef}
            className="absolute bottom-4 left-0 right-0 flex justify-center items-center gap-6"
            style={{ opacity: 0 }}
          >
            <img src="/assets/logo-hitlabz.svg" alt="Hit Labz" className="h-8" />
            <img src="/assets/logo-inpacto.svg" alt="Inpacto" className="h-8" />
          </div>
        </div>

        <div ref={buttonsRef} className="space-y-4" style={{ opacity: 0 }}>
          <Button fullWidth onClick={() => setScreen(ScreenState.WHATSAPP)}>
            ENVIAR PARA WHATSAPP
          </Button>
          <Button variant="secondary" fullWidth onClick={resetSession}>
            Novo Torcedor
          </Button>
        </div>
      </div>
    </div>
  );
};

const WhatsAppScreen = () => {
    const { resetSession, sessionId, generatedImageId, generatedImageUrl, selectedTeam, selectedIdol, imageSize } = useAppStore();
    const [phone, setPhone] = useState('');
    const [sent, setSent] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [webhookStatus, setWebhookStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
    const containerRef = useRef<HTMLDivElement>(null);
    const logosRef = useRef<HTMLDivElement>(null);
    const titleRef = useRef<HTMLHeadingElement>(null);
    const inputRef = useRef<HTMLDivElement>(null);
    const cancelRef = useRef<HTMLButtonElement>(null);
    const successRef = useRef<HTMLDivElement>(null);

    // Formatar número de telefone para padrão brasileiro
    const formatPhoneNumber = (value: string): string => {
      // Remove tudo que não é número
      const numbers = value.replace(/\D/g, '');

      // Limita a 11 dígitos (DDD + 9 dígitos)
      const limited = numbers.slice(0, 11);

      // Formata conforme digita
      if (limited.length <= 2) {
        return limited;
      } else if (limited.length <= 7) {
        return `(${limited.slice(0, 2)}) ${limited.slice(2)}`;
      } else {
        return `(${limited.slice(0, 2)}) ${limited.slice(2, 7)}-${limited.slice(7)}`;
      }
    };

    // Validar número de telefone
    const isValidPhone = (value: string): boolean => {
      const numbers = value.replace(/\D/g, '');
      // Deve ter 10 ou 11 dígitos (com ou sem o 9)
      return numbers.length >= 10 && numbers.length <= 11;
    };

    // Extrair apenas números do telefone
    const getPhoneNumbers = (value: string): string => {
      return value.replace(/\D/g, '');
    };

    // Handler para adicionar dígito via teclado virtual
    const handleKeyPress = (digit: string) => {
      const numbers = phone.replace(/\D/g, '');
      if (numbers.length < 11) {
        setPhone(formatPhoneNumber(numbers + digit));
      }
    };

    // Handler para backspace via teclado virtual
    const handleBackspace = () => {
      const numbers = phone.replace(/\D/g, '');
      const newNumbers = numbers.slice(0, -1);
      setPhone(formatPhoneNumber(newNumbers));
    };

    const handleSend = async () => {
        if (isSending || !isValidPhone(phone)) return;
        setIsSending(true);
        setWebhookStatus('sending');

        const phoneNumbers = getPhoneNumbers(phone);
        let shareId = '';

        try {
          // 1. Registrar compartilhamento no Supabase
          if (sessionId && generatedImageId) {
            shareId = await saveWhatsAppShare(sessionId, generatedImageId, phoneNumbers);
            console.log('📤 Compartilhamento registrado:', shareId);

            // 2. Disparar webhook N8N para envio real via WhatsApp
            if (isWebhookConfigured()) {
              console.log('🚀 Disparando webhook N8N...');

              const webhookPayload: WebhookPayload = {
                // Identificadores
                sessionId: sessionId,
                generatedImageId: generatedImageId,
                shareId: shareId,

                // Dados do usuário
                phoneNumber: phoneNumbers,

                // Dados da imagem
                imageUrl: generatedImageUrl || '',

                // Contexto da sessão
                teamId: selectedTeam || '',
                teamName: selectedTeam ? TEAMS[selectedTeam].name : '',
                idolId: selectedIdol?.id || '',
                idolName: selectedIdol?.name || '',
                idolNickname: selectedIdol?.nickname || '',

                // Metadados
                timestamp: new Date().toISOString(),
                imageSize: imageSize,
              };

              const webhookResult = await triggerWebhook(webhookPayload);

              if (webhookResult.success) {
                console.log('✅ Webhook N8N executado com sucesso');
                setWebhookStatus('success');
                // Atualizar status para 'sent' após webhook bem sucedido
                await updateWhatsAppShareStatus(shareId, 'sent');
              } else {
                console.error('❌ Erro no webhook N8N:', webhookResult.error);
                setWebhookStatus('error');
                // Marcar como 'pending' para retry posterior
                await updateWhatsAppShareStatus(shareId, 'failed', webhookResult.error);
              }
            } else {
              // Webhook não configurado - apenas registrar no banco
              console.warn('⚠️ Webhook N8N não configurado. Apenas registrando no banco.');
              await updateWhatsAppShareStatus(shareId, 'sent');
            }

            // 3. Marcar sessão como completa
            await completeSession(sessionId);
          }

          setSent(true);
          setTimeout(() => {
            resetSession();
          }, 3000);
        } catch (error) {
          console.error('Erro ao processar envio:', error);
          setWebhookStatus('error');

          // Tentar atualizar status como falha
          if (shareId) {
            await updateWhatsAppShareStatus(shareId, 'failed', String(error)).catch(console.error);
          }

          // Continua com o fluxo mesmo com erro
          setSent(true);
          setTimeout(() => {
            resetSession();
          }, 3000);
        } finally {
          setIsSending(false);
        }
    };

    // GSAP Animations for form
    useGSAP(() => {
        if (!containerRef.current || sent) return;

        gsap.set(logosRef.current, { opacity: 0, y: -20 });
        gsap.set(titleRef.current, { opacity: 0, y: 20 });
        gsap.set(inputRef.current, { opacity: 0, scale: 0.95 });
        gsap.set(cancelRef.current, { opacity: 0, y: 20 });

        const tl = gsap.timeline({ defaults: { ease: 'power3.out' }, delay: 0.2 });

        tl.to(logosRef.current, { opacity: 1, y: 0, duration: 0.8 }, 0);
        tl.to(titleRef.current, { opacity: 1, y: 0, duration: 0.8 }, 0.2);
        tl.to(inputRef.current, { opacity: 1, scale: 1, duration: 0.6 }, 0.4);
        tl.to(cancelRef.current, { opacity: 1, y: 0, duration: 0.6 }, 0.6);

    }, { scope: containerRef, dependencies: [sent] });

    // GSAP Animation for success
    useGSAP(() => {
        if (!sent || !successRef.current) return;

        gsap.set(successRef.current, { opacity: 0, scale: 0.8 });

        const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

        tl.to(successRef.current, { opacity: 1, scale: 1, duration: 0.8, ease: 'back.out(1.5)' });

        // Check icon pop
        const checkIcon = successRef.current.querySelector('.check-icon');
        if (checkIcon) {
            gsap.fromTo(checkIcon,
                { scale: 0, rotation: -180 },
                { scale: 1, rotation: 0, duration: 0.6, ease: 'back.out(2)', delay: 0.3 }
            );
        }

    }, { dependencies: [sent] });

    if (sent) {
        return (
            <div ref={successRef} className="flex flex-col items-center justify-center h-full text-center space-y-6" style={{ opacity: 0 }}>
                <div className="check-icon w-28 h-28 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-5xl shadow-[0_0_40px_rgba(34,197,94,0.5)]">
                    ✓
                </div>
                <h2 className="text-4xl font-bold text-green-400">Enviado!</h2>
                <p className="text-xl text-gray-300">Verifique seu WhatsApp.</p>
                <p className="text-sm text-gray-500">Reiniciando...</p>
            </div>
        )
    }

    return (
        <div ref={containerRef} className="relative flex flex-col h-full w-full overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-gradient-to-b from-gray-900 via-black to-black" />
                <div className="absolute top-0 left-0 w-full h-1/3 bg-gradient-to-b from-green-900/20 to-transparent" />
            </div>

            {/* Logos no topo */}
            <div
                ref={logosRef}
                className="relative z-10 flex items-center justify-center gap-8 pt-8 pb-4"
                style={{ opacity: 0 }}
            >
                <img
                    src="/assets/logo-hitlabz.svg"
                    alt="Hit Labz"
                    className="h-7 w-auto opacity-70"
                />
                <div className="w-px h-5 bg-white/30" />
                <img
                    src="/assets/logo-inpacto.svg"
                    alt="Holding inPacto"
                    className="h-7 w-auto opacity-70"
                />
            </div>

            {/* Content - ajustado para ocupar apenas a metade superior (até 50% da altura) */}
            <div className="relative z-10 flex flex-col justify-center px-8 space-y-6" style={{ height: '40%' }}>
                <h2
                    ref={titleRef}
                    className="text-3xl font-serif text-center text-white"
                    style={{ opacity: 0 }}
                >
                    Digite seu WhatsApp
                </h2>

                {/* Input visual (readonly, atualizado pelo teclado virtual) */}
                <div
                    ref={inputRef}
                    className={`w-full p-5 text-3xl text-center bg-white/10 border-2 rounded-2xl text-white transition-colors ${
                      phone.length > 0 && !isValidPhone(phone)
                        ? 'border-red-500/50'
                        : isValidPhone(phone)
                          ? 'border-green-500/60'
                          : 'border-green-500/30'
                    }`}
                    style={{ opacity: 0 }}
                >
                    {phone || <span className="text-gray-500">(11) 99999-9999</span>}
                </div>

                <button
                    ref={cancelRef}
                    onClick={async () => {
                      // Marcar sessão como completa mesmo ao cancelar
                      if (sessionId) {
                        await completeSession(sessionId).catch(console.error);
                      }
                      resetSession();
                    }}
                    className="w-full py-3 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white font-medium hover:bg-white/20 transition-all"
                    style={{ opacity: 0 }}
                >
                    ← Cancelar
                </button>
            </div>

            {/* Teclado Virtual Numérico */}
            <NumericKeyboard
                onKeyPress={handleKeyPress}
                onBackspace={handleBackspace}
                onSubmit={handleSend}
                isSubmitDisabled={!isValidPhone(phone)}
                isLoading={isSending}
            />
        </div>
    )
}

// Main App Component
const App = () => {
  const { currentScreen, selectedTeam } = useAppStore();

  const getBackgroundGradient = () => {
    if (!selectedTeam) return 'bg-gradient-to-br from-gray-900 to-black';
    return selectedTeam === TeamId.FLAMENGO 
      ? 'bg-gradient-to-br from-red-900 via-black to-red-950'
      : 'bg-gradient-to-br from-gray-800 via-black to-gray-900';
  };

  return (
    <div className="w-full h-full bg-black flex items-center justify-center overflow-hidden">
      {/* 9:16 Aspect Ratio Container - Height-based */}
      <div
        className={`totem-container ${getBackgroundGradient()} text-white transition-colors duration-700`}
      >
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-yellow-600/10 rounded-full blur-[100px]" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[100px]" />
        </div>

        <div className="relative z-10 w-full h-full flex flex-col bg-black/20 backdrop-blur-sm shadow-2xl overflow-hidden">
          <main className="flex-1 overflow-hidden relative">
            {currentScreen === ScreenState.WELCOME && <WelcomeScreen />}
            {currentScreen === ScreenState.TEAM_SELECTION && <TeamSelectionScreen />}
            {currentScreen === ScreenState.IDOL_SELECTION && <IdolSelectionScreen />}
            {/* InstructionScreen removida - vai direto para câmera */}
            {currentScreen === ScreenState.CAMERA && <CameraScreen />}
            {currentScreen === ScreenState.GENERATION && <GenerationScreen />}
            {currentScreen === ScreenState.RESULT && <ResultScreen />}
            {currentScreen === ScreenState.WHATSAPP && <WhatsAppScreen />}
          </main>
        </div>
      </div>
    </div>
  );
};

export default App;