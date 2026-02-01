import React, { useRef, useEffect, useCallback } from 'react';
import { gsap } from 'gsap';

interface NumericKeyboardProps {
  onKeyPress: (digit: string) => void;
  onBackspace: () => void;
  onSubmit: () => void;
  isSubmitDisabled: boolean;
  isLoading: boolean;
}

const NumericKeyboard: React.FC<NumericKeyboardProps> = ({
  onKeyPress,
  onBackspace,
  onSubmit,
  isSubmitDisabled,
  isLoading,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const touchedRef = useRef<boolean>(false);

  // Layout das teclas numéricas (3x4)
  const numericKeys = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['', '0', ''],
  ];

  // Animação de entrada do teclado
  useEffect(() => {
    if (!containerRef.current) return;

    gsap.fromTo(
      containerRef.current,
      { y: '100%', opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5, ease: 'power3.out' }
    );
  }, []);

  // Reset touch flag after a short delay
  const resetTouchFlag = useCallback(() => {
    setTimeout(() => {
      touchedRef.current = false;
    }, 300);
  }, []);

  // Feedback visual - press down
  const animatePress = (target: HTMLElement, color: string) => {
    gsap.to(target, {
      scale: 0.95,
      backgroundColor: color,
      duration: 0.1,
    });
  };

  // Feedback visual - release
  const animateRelease = (target: HTMLElement) => {
    gsap.to(target, {
      scale: 1,
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      duration: 0.2,
    });
  };

  // Handle numeric key press
  const handleKeyPress = useCallback((key: string, target: HTMLElement, isTouch: boolean) => {
    if (key === '') return;

    // Prevent double firing on mobile
    if (isTouch) {
      touchedRef.current = true;
    } else if (touchedRef.current) {
      return; // Skip mouse event if touch just happened
    }

    animatePress(target, 'rgba(34, 197, 94, 0.3)');
    onKeyPress(key);
  }, [onKeyPress]);

  const handleKeyRelease = useCallback((target: HTMLElement) => {
    animateRelease(target);
    resetTouchFlag();
  }, [resetTouchFlag]);

  // Handle backspace
  const handleBackspacePress = useCallback((target: HTMLElement, isTouch: boolean) => {
    // Prevent double firing on mobile
    if (isTouch) {
      touchedRef.current = true;
    } else if (touchedRef.current) {
      return;
    }

    animatePress(target, 'rgba(239, 68, 68, 0.3)');
    onBackspace();
  }, [onBackspace]);

  const handleBackspaceRelease = useCallback((target: HTMLElement) => {
    animateRelease(target);
    resetTouchFlag();
  }, [resetTouchFlag]);

  // Handle submit
  const handleSubmitPress = useCallback((target: HTMLElement, isTouch: boolean) => {
    if (isSubmitDisabled || isLoading) return;

    // Prevent double firing on mobile
    if (isTouch) {
      touchedRef.current = true;
    } else if (touchedRef.current) {
      return;
    }

    gsap.to(target, { scale: 0.95, duration: 0.1 });
    onSubmit();
  }, [isSubmitDisabled, isLoading, onSubmit]);

  const handleSubmitRelease = useCallback((target: HTMLElement) => {
    gsap.to(target, { scale: 1, duration: 0.2 });
    resetTouchFlag();
  }, [resetTouchFlag]);

  return (
    <div
      ref={containerRef}
      className="fixed bottom-[10%] left-0 right-0 h-[40%] bg-black/95 backdrop-blur-lg border-t border-white/10 z-50"
      style={{ opacity: 0 }}
    >
      <div className="h-full grid grid-cols-4 gap-2 p-3">
        {/* Coluna de números (3 colunas) */}
        <div className="col-span-3 grid grid-cols-3 gap-2">
          {numericKeys.flat().map((key, index) => (
            <button
              key={index}
              onTouchStart={(e) => {
                e.preventDefault();
                if (key !== '') handleKeyPress(key, e.currentTarget, true);
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                handleKeyRelease(e.currentTarget);
              }}
              onMouseDown={(e) => {
                if (key !== '') handleKeyPress(key, e.currentTarget, false);
              }}
              onMouseUp={(e) => handleKeyRelease(e.currentTarget)}
              onMouseLeave={(e) => handleKeyRelease(e.currentTarget)}
              disabled={key === ''}
              className={`
                flex items-center justify-center rounded-xl text-5xl font-bold text-white
                transition-colors select-none touch-manipulation
                ${key === ''
                  ? 'bg-transparent cursor-default'
                  : 'bg-white/10 hover:bg-white/20 active:bg-green-500/30 cursor-pointer'
                }
              `}
            >
              {key}
            </button>
          ))}
        </div>

        {/* Coluna de ações (backspace e enviar) */}
        <div className="col-span-1 grid grid-rows-2 gap-2">
          {/* Backspace - ocupa metade superior */}
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              handleBackspacePress(e.currentTarget, true);
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              handleBackspaceRelease(e.currentTarget);
            }}
            onMouseDown={(e) => handleBackspacePress(e.currentTarget, false)}
            onMouseUp={(e) => handleBackspaceRelease(e.currentTarget)}
            onMouseLeave={(e) => handleBackspaceRelease(e.currentTarget)}
            className="flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 active:bg-red-500/30 text-white text-4xl transition-colors select-none touch-manipulation cursor-pointer"
          >
            <svg
              className="w-10 h-10"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414 6.414a2 2 0 001.414.586H19a2 2 0 002-2V7a2 2 0 00-2-2h-8.172a2 2 0 00-1.414.586L3 12z"
              />
            </svg>
          </button>

          {/* Enviar - ocupa metade inferior */}
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              handleSubmitPress(e.currentTarget, true);
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              handleSubmitRelease(e.currentTarget);
            }}
            onMouseDown={(e) => handleSubmitPress(e.currentTarget, false)}
            onMouseUp={(e) => handleSubmitRelease(e.currentTarget)}
            onMouseLeave={(e) => handleSubmitRelease(e.currentTarget)}
            disabled={isSubmitDisabled || isLoading}
            className={`
              flex items-center justify-center rounded-xl text-white text-lg font-bold uppercase tracking-wider
              transition-all select-none touch-manipulation
              ${isSubmitDisabled || isLoading
                ? 'bg-gray-600/50 cursor-not-allowed opacity-50'
                : 'bg-gradient-to-br from-green-500 to-green-600 hover:from-green-400 hover:to-green-500 shadow-lg shadow-green-500/30 cursor-pointer'
              }
            `}
          >
            {isLoading ? (
              <div className="w-8 h-8 border-3 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <div className="flex flex-col items-center gap-1">
                <svg
                  className="w-8 h-8"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                <span className="text-xs">ENVIAR</span>
              </div>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NumericKeyboard;
