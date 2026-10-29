import { Outlet } from 'react-router-dom';
import bgPolibatam from '../assets/bg polibatam.jpg';

export function AuthLayout() {
  return (
    <div className="min-h-screen w-full relative flex items-center justify-center p-4 sm:p-6 lg:p-10 overflow-x-hidden">
      {/* Fullscreen Background: Politeknik Negeri Batam */}
      <div
        className="fixed inset-0 bg-cover bg-center transition-transform duration-1000 scale-100"
        style={{ backgroundImage: `url(${bgPolibatam})` }}
      />
      {/* Vignette Overlay so background image is clearly visible */}
      <div className="fixed inset-0 bg-slate-950/45 backdrop-blur-[1px]" />

      {/* Central Card Container */}
      <div className="relative z-10 w-full max-w-6xl my-auto animate-fadeIn">
        <Outlet />
      </div>
    </div>
  );
}
