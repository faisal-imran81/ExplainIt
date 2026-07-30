import { useEffect } from 'react';
import { Platform } from 'react-native';

export default function WebBackground() {
  if (Platform.OS !== 'web') return null;

  useEffect(() => {
    const styleId = 'elucid-bg-style';
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .elucid-bg {
        position: fixed;
        top: 0; left: 0; right: 0; bottom: 0;
        z-index: 999;
        overflow: hidden;
        pointer-events: none;
      }
      .blob {
        position: absolute;
        border-radius: 50%;
        filter: blur(80px);
        opacity: 0.18;
        animation-timing-function: ease-in-out;
        animation-iteration-count: infinite;
        animation-direction: alternate;
      }
      .blob-1 {
        width: 520px; height: 520px;
        background: radial-gradient(circle, #7C5CFC, #5B8DEF);
        top: -120px; left: -80px;
        animation: blobMove1 14s ease-in-out infinite alternate;
      }
      .blob-2 {
        width: 420px; height: 420px;
        background: radial-gradient(circle, #A855F7, #6366F1);
        bottom: -100px; right: -60px;
        animation: blobMove2 18s ease-in-out infinite alternate;
      }
      .blob-3 {
        width: 300px; height: 300px;
        background: radial-gradient(circle, #3B82F6, #8B5CF6);
        top: 40%; left: 30%;
        animation: blobMove3 22s ease-in-out infinite alternate;
      }
      .blob-4 {
        width: 200px; height: 200px;
        background: radial-gradient(circle, #6366F1, #A78BFA);
        top: 20%; right: 15%;
        animation: blobMove4 16s ease-in-out infinite alternate;
      }
      .blob-5 {
        width: 350px; height: 350px;
        background: radial-gradient(circle, #6366F1, #3B82F6);
        top: 60%; left: -60px;
        animation: blobMove1 20s ease-in-out infinite alternate;
      }
      .blob-6 {
        width: 250px; height: 250px;
        background: radial-gradient(circle, #A855F7, #7C5CFC);
        top: 10%; left: 40%;
        animation: blobMove3 25s ease-in-out infinite alternate;
      }
      @keyframes blobMove1 {
        0%   { transform: translate(0px, 0px) scale(1); }
        33%  { transform: translate(60px, 80px) scale(1.08); }
        66%  { transform: translate(30px, 120px) scale(0.95); }
        100% { transform: translate(80px, 40px) scale(1.05); }
      }
      @keyframes blobMove2 {
        0%   { transform: translate(0px, 0px) scale(1); }
        33%  { transform: translate(-80px, -60px) scale(1.1); }
        66%  { transform: translate(-40px, -100px) scale(0.92); }
        100% { transform: translate(-70px, -30px) scale(1.06); }
      }
      @keyframes blobMove3 {
        0%   { transform: translate(0px, 0px) scale(1); }
        50%  { transform: translate(-60px, 80px) scale(1.12); }
        100% { transform: translate(60px, -60px) scale(0.9); }
      }
      @keyframes blobMove4 {
        0%   { transform: translate(0px, 0px) scale(1); }
        50%  { transform: translate(40px, 60px) scale(1.15); }
        100% { transform: translate(-40px, -40px) scale(0.88); }
      }
      .particle {
        position: absolute;
        border-radius: 50%;
        opacity: 0;
        animation: particleFloat linear infinite;
      }
      @keyframes particleFloat {
        0%   { opacity: 0; transform: translateY(0px) scale(0.5); }
        10%  { opacity: 0.6; }
        90%  { opacity: 0.3; }
        100% { opacity: 0; transform: translateY(-420px) scale(1.2); }
      }
    `;
    document.head.appendChild(style);

    const bg = document.createElement('div');
    bg.className = 'elucid-bg';
    bg.id = 'elucid-bg';

    for (let i = 1; i <= 6; i++) {
      const blob = document.createElement('div');
      blob.className = `blob blob-${i}`;
      bg.appendChild(blob);
    }

    const particleColors = ['#7C5CFC', '#6366F1', '#A855F7', '#3B82F6', '#8B5CF6', '#A78BFA'];
    for (let i = 0; i < 40; i++) {
      const p = document.createElement('div');
      p.className = 'particle';
      const size = Math.random() * 4 + 2;
      p.style.cssText = `
        width: ${size}px;
        height: ${size}px;
        left: ${Math.random() * 100}%;
        bottom: ${Math.random() * 20}%;
        background: ${particleColors[Math.floor(Math.random() * particleColors.length)]};
        animation-duration: ${Math.random() * 12 + 8}s;
        animation-delay: ${Math.random() * 10}s;
      `;
      bg.appendChild(p);
    }

    document.body.insertBefore(bg, document.body.firstChild);

    return () => {
      document.getElementById('elucid-bg')?.remove();
      document.getElementById(styleId)?.remove();
    };
  }, []);

  return null;
}
