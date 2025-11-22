import React, { useEffect, useRef } from 'react';

interface Hexagon {
  x: number;
  y: number;
  size: number;
  life: number;
  color: string;
  rotation: number;
}

export const CursorTrail: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hexagonsRef = useRef<Hexagon[]>([]);
  const requestRef = useRef<number>(0);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
      
      // Spawn a new hexagon on move
      hexagonsRef.current.push({
        x: e.clientX,
        y: e.clientY,
        size: Math.random() * 15 + 10,
        life: 1.0,
        color: `hsl(${Math.random() * 60 + 180}, 70%, 60%)`, // Cyan/Blue hues
        rotation: Math.random() * Math.PI
      });
    };

    window.addEventListener('mousemove', handleMouseMove);

    const drawHexagon = (ctx: CanvasRenderingContext2D, x: number, y: number, r: number, rotation: number) => {
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = rotation + (i * Math.PI) / 3;
        const hx = x + r * Math.cos(angle);
        const hy = y + r * Math.sin(angle);
        if (i === 0) ctx.moveTo(hx, hy);
        else ctx.lineTo(hx, hy);
      }
      ctx.closePath();
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update and draw hexagons
      for (let i = hexagonsRef.current.length - 1; i >= 0; i--) {
        const hex = hexagonsRef.current[i];
        hex.life -= 0.02;
        hex.size += 0.2; // Expand slightly
        hex.rotation += 0.02;

        if (hex.life <= 0) {
          hexagonsRef.current.splice(i, 1);
          continue;
        }

        ctx.strokeStyle = hex.color.replace(')', `, ${hex.life})`).replace('hsl', 'hsla');
        ctx.lineWidth = 2;
        drawHexagon(ctx, hex.x, hex.y, hex.size, hex.rotation);
        ctx.stroke();
        
        // Optional fill
        ctx.fillStyle = hex.color.replace(')', `, ${hex.life * 0.1})`).replace('hsl', 'hsla');
        ctx.fill();
      }

      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(requestRef.current);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="fixed inset-0 pointer-events-none z-0"
    />
  );
};