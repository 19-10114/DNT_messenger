'use client';

import { useEffect, useRef, useState } from 'react';

type LandingH1AnimatorProps = {
  fullText: string;
};

export default function LandingH1Animator({
  fullText,
}: LandingH1AnimatorProps) {
  const [displayText, setDisplayText] = useState('');
  const [hasStarted, setHasStarted] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isDone) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasStarted) {
          setHasStarted(true);
          let i = 0;

          const typeInterval = window.setInterval(() => {
            if (i <= fullText.length) {
              setDisplayText(fullText.substring(0, i));
              i += 1;
            } else {
              window.clearInterval(typeInterval);
              window.setTimeout(() => setIsDone(true), 300);
            }
          }, 60);
        }
      },
      { threshold: 0.5 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [fullText, hasStarted, isDone]);

  if (isDone) return null;

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="absolute inset-0 flex items-center justify-center pointer-events-none"
    >
      <h1
        className="text-secondary font-black text-5xl md:text-2xl lg:text-5xl tracking-tighter text-center transition-opacity duration-300"
        style={{ textShadow: '2px 2px 0 #000' }}
      >
        {displayText}
      </h1>
    </div>
  );
}
