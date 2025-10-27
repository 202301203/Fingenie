import { useState, useRef } from 'react';

export default function CustomTiltCard({ children, rotateAmplitude = 20}) {
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const cardRef = useRef(null);

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotationX = ((y - centerY) / centerY) * rotateAmplitude;
    const rotationY = ((centerX - x) / centerX) * rotateAmplitude;

    setRotateX(rotationX);
    setRotateY(rotationY);
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        perspective: '50000px',
        transition: 'transform 0.2s ease-out',
        transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.05)`,
      }}
    >
      {children}
    </div>
  );
}