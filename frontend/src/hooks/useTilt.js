import { useState, useRef, useCallback } from 'react';

/**
 * Custom hook to calculate 3D tilt rotation based on mouse position.
 */
export const useTilt = (maxRotation = 10) => {
  const ref = useRef(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const onMouseMove = useCallback((e) => {
    if (!ref.current) return;
    
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const mouseX = e.clientX;
    const mouseY = e.clientY;

    const rotateY = ((mouseX - centerX) / (rect.width / 2)) * maxRotation;
    const rotateX = ((centerY - mouseY) / (rect.height / 2)) * maxRotation;

    setTilt({ x: rotateX, y: rotateY });
    setIsHovered(true);
  }, [maxRotation]);

  const onMouseLeave = useCallback(() => {
    setIsHovered(false);
    setTilt({ x: 0, y: 0 });
  }, []);

  const tiltStyle = {
    transform: isHovered 
      ? `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(1.02)` 
      : `rotateX(0deg) rotateY(0deg) scale(1)`,
    transition: isHovered ? 'transform 0.1s ease-out' : 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
    transformStyle: 'preserve-3d',
    perspective: '1000px'
  };

  return { ref, tiltStyle, onMouseMove, onMouseLeave };
};
