import { useEffect, useRef } from 'react';

interface UsePullToRefreshOptions {
  onRefresh: () => void;
  threshold?: number;
  resistance?: number;
}

export function usePullToRefresh({ 
  onRefresh, 
  threshold = 80, 
  resistance = 0.5 
}: UsePullToRefreshOptions) {
  const startY = useRef(0);
  const currentY = useRef(0);
  const isPulling = useRef(false);
  const element = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if (window.scrollY === 0) {
        startY.current = e.touches[0].clientY;
        isPulling.current = true;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isPulling.current) return;

      currentY.current = e.touches[0].clientY;
      const pullDistance = currentY.current - startY.current;

      if (pullDistance > 0) {
        e.preventDefault();
        const pullProgress = Math.min(pullDistance * resistance, threshold);
        
        if (element.current) {
          element.current.style.transform = `translateY(${pullProgress}px)`;
        }
      }
    };

    const handleTouchEnd = () => {
      if (!isPulling.current) return;

      const pullDistance = currentY.current - startY.current;
      
      if (pullDistance > threshold) {
        onRefresh();
      }

      if (element.current) {
        element.current.style.transform = 'translateY(0)';
      }

      isPulling.current = false;
    };

    const targetElement = document.body;
    element.current = targetElement;

    targetElement.addEventListener('touchstart', handleTouchStart, { passive: false });
    targetElement.addEventListener('touchmove', handleTouchMove, { passive: false });
    targetElement.addEventListener('touchend', handleTouchEnd);

    return () => {
      targetElement.removeEventListener('touchstart', handleTouchStart);
      targetElement.removeEventListener('touchmove', handleTouchMove);
      targetElement.removeEventListener('touchend', handleTouchEnd);
    };
  }, [onRefresh, threshold, resistance]);
}
