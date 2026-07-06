"use client";

import { ReactNode, useLayoutEffect, useRef, useState } from 'react';

type FadeInOnVisibleProps = {
  children: ReactNode;
  threshold?: number;
  className?: string;
  delay?: number;
};

const intersectsViewport = (el: Element) => {
  const r = el.getBoundingClientRect();
  const vh = window.innerHeight || document.documentElement.clientHeight;
  const vw = window.innerWidth || document.documentElement.clientWidth;
  return r.bottom > 0 && r.top < vh && r.right > 0 && r.left < vw;
};

export const FadeInOnVisible = ({ children, threshold = 0, className = '' }: FadeInOnVisibleProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) {
      return;
    }

    let cancelled = false;
    let done = false;
    let raf1 = 0;
    let raf2 = 0;

    const applyDelays = (root: Element) => {
      root.querySelectorAll('.fade-in-up-target').forEach((el) => {
        const elementDelay = el.getAttribute('data-delay') || '500';
        (el as HTMLElement).style.setProperty('--delay', `${elementDelay}ms`);
      });
    };

    const activate = () => {
      if (done || cancelled) {
        return;
      }
      done = true;
      applyDelays(node);
      observer.disconnect();
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      setIsVisible(true);
    };

    const checkViewport = () => {
      if (done || cancelled || !node.isConnected) {
        return;
      }
      if (intersectsViewport(node)) {
        activate();
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.target === node) {
            activate();
          }
        });
      },
      { threshold, rootMargin: '0px 0px 160px 0px' },
    );

    observer.observe(node);

    for (const entry of observer.takeRecords()) {
      if (entry.isIntersecting && entry.target === node) {
        activate();
        break;
      }
    }

    if (!done) {
      checkViewport();
    }

    if (!done) {
      raf1 = requestAnimationFrame(() => {
        if (done) {
          return;
        }
        checkViewport();
        if (done) {
          return;
        }
        raf2 = requestAnimationFrame(() => {
          if (!done) {
            checkViewport();
          }
        });
      });
    }

    return () => {
      cancelled = true;
      observer.disconnect();
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [threshold]);

  const rootClassName = [className, isVisible ? 'fade-in-visible-root' : ''].filter(Boolean).join(' ');

  return (
    <div ref={ref} className={rootClassName}>
      {children}
    </div>
  );
};

export default FadeInOnVisible;
