import { useEffect, useState } from 'react';

export function RoseIntro() {
  const [phase, setPhase] = useState<'in' | 'out' | 'gone'>('in');

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const hold = reduce ? 1200 : 2600;
    let outTimer: number | undefined;
    const leave = (delay: number) => {
      setPhase('out');
      outTimer = window.setTimeout(() => setPhase('gone'), delay);
    };
    const t1 = window.setTimeout(() => leave(900), hold);
    const skip = () => { window.clearTimeout(t1); leave(600); };
    window.addEventListener('pointerdown', skip, { once: true });
    window.addEventListener('keydown', skip, { once: true });
    return () => {
      window.clearTimeout(t1);
      if (outTimer) window.clearTimeout(outTimer);
      window.removeEventListener('pointerdown', skip);
      window.removeEventListener('keydown', skip);
    };
  }, []);

  if (phase === 'gone') return null;

  return (
    <div className={phase === 'out' ? 'rose-intro rose-intro--out' : 'rose-intro'} aria-hidden="true">
      <img src="/rose-dark.webp" alt="" className="rose-intro__bloom rose-intro__bloom--left" />
      <img src="/rose-pink.webp" alt="" className="rose-intro__bloom rose-intro__bloom--right" />
      <div className="rose-intro__words">
        <p className="rose-intro__name">Rose.AI</p>
        <p className="rose-intro__line">a softer place to land</p>
      </div>
    </div>
  );
}
