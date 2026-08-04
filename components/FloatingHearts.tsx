'use client';

import React, { useEffect, useState } from 'react';

interface FloatingHeart {
  id: number;
  left: number;
  top: number;
  delay: number;
  duration: number;
  size: number;
  direction: 'up' | 'down' | 'left' | 'right' | 'diagonal-up-left' | 'diagonal-up-right' | 'diagonal-down-left' | 'diagonal-down-right';
}

const FloatingHearts: React.FC = () => {
  const [hearts, setHearts] = useState<FloatingHeart[]>([]);

  useEffect(() => {
    // Generate random hearts on mount
    const generateHearts = () => {
      const directions: FloatingHeart['direction'][] = [
        'up',
        'down',
        'left',
        'right',
        'diagonal-up-left',
        'diagonal-up-right',
        'diagonal-down-left',
        'diagonal-down-right',
      ];

      const newHearts: FloatingHeart[] = Array.from({ length: 8 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 100,
        delay: Math.random() * 2,
        duration: 15 + Math.random() * 10,
        size: 20 + Math.random() * 40, // 20px to 60px
        direction: directions[Math.floor(Math.random() * directions.length)],
      }));
      setHearts(newHearts);
    };

    generateHearts();
  }, []);

  const getAnimation = (direction: FloatingHeart['direction']) => {
    switch (direction) {
      case 'up':
        return 'float-up';
      case 'down':
        return 'float-down';
      case 'left':
        return 'float-left';
      case 'right':
        return 'float-right';
      case 'diagonal-up-left':
        return 'float-diagonal-up-left';
      case 'diagonal-up-right':
        return 'float-diagonal-up-right';
      case 'diagonal-down-left':
        return 'float-diagonal-down-left';
      case 'diagonal-down-right':
        return 'float-diagonal-down-right';
      default:
        return 'float-up';
    }
  };

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {hearts.map((heart) => (
        <div
          key={heart.id}
          className="absolute"
          style={{
            left: `${heart.left}%`,
            top: `${heart.top}%`,
            opacity: 0.18,
            animation: `${getAnimation(heart.direction)} ${heart.duration}s linear ${heart.delay}s infinite`,
            fontSize: `${heart.size}px`,
            pointerEvents: 'none',
          }}
        >
          💙
        </div>
      ))}

      <style>{`
        @keyframes float-up {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 0.18;
          }
          90% {
            opacity: 0.18;
          }
          100% {
            transform: translateY(-100vh) rotate(360deg);
            opacity: 0;
          }
        }

        @keyframes float-down {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 0.18;
          }
          90% {
            opacity: 0.18;
          }
          100% {
            transform: translateY(100vh) rotate(360deg);
            opacity: 0;
          }
        }

        @keyframes float-left {
          0% {
            transform: translateX(0) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 0.18;
          }
          90% {
            opacity: 0.18;
          }
          100% {
            transform: translateX(-100vw) rotate(360deg);
            opacity: 0;
          }
        }

        @keyframes float-right {
          0% {
            transform: translateX(0) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 0.18;
          }
          90% {
            opacity: 0.18;
          }
          100% {
            transform: translateX(100vw) rotate(360deg);
            opacity: 0;
          }
        }

        @keyframes float-diagonal-up-left {
          0% {
            transform: translate(0, 0) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 0.18;
          }
          90% {
            opacity: 0.18;
          }
          100% {
            transform: translate(-100vw, -100vh) rotate(360deg);
            opacity: 0;
          }
        }

        @keyframes float-diagonal-up-right {
          0% {
            transform: translate(0, 0) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 0.18;
          }
          90% {
            opacity: 0.18;
          }
          100% {
            transform: translate(100vw, -100vh) rotate(360deg);
            opacity: 0;
          }
        }

        @keyframes float-diagonal-down-left {
          0% {
            transform: translate(0, 0) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 0.18;
          }
          90% {
            opacity: 0.18;
          }
          100% {
            transform: translate(-100vw, 100vh) rotate(360deg);
            opacity: 0;
          }
        }

        @keyframes float-diagonal-down-right {
          0% {
            transform: translate(0, 0) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 0.18;
          }
          90% {
            opacity: 0.18;
          }
          100% {
            transform: translate(100vw, 100vh) rotate(360deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default FloatingHearts;
