import React, { useEffect, useState } from 'react';
import { 
  Activity, 
  Zap, 
  Brain, 
  Shield, 
  Target, 
  Terminal,
  ChevronRight,
  Lock
} from 'lucide-react';

const LandingPage = () => {
  const [pulseActive, setPulseActive] = useState(false);

  useEffect(() => {
    setPulseActive(true);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Custom Fonts - Add to your index.html or globals.css */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=JetBrains+Mono:wght@400;500;700&display=swap');
        
        .font-identity {
          font-family: 'Playfair Display', serif;
        }
        
        .font-data {
          font-family: 'JetBrains Mono', monospace;
        }

        @keyframes ekg-pulse {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }

        @keyframes line-scan {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }

        .ekg-line {
          animation: ekg-pulse 3s linear infinite;
        }

        .scan-line {
          animation: line-scan 2s ease-in-out infinite;
        }

        .glow-green {
          box-shadow: 0 0 10px rgba(0, 255, 65, 0.5), 0 0 20px rgba(0, 255, 65, 0.3);
        }

        .glow-green-intense {
          box-shadow: 0 0 15px rgba(0, 255, 65, 0.8), 0 0 30px rgba(0, 255, 65, 0.5), 0 0 45px rgba(0, 255, 65, 0.3);
        }
      `}</style>

      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 border-b border-gray-900">
        {/* Background Grid Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'linear-gradient(#00FF41 1px, transparent 1px), linear-gradient(90deg, #00FF41 1px, transparent 1px)',
            backgroundSize: '50px 50px'
          }}></div>
        </div>

        {/* Status Bar */}
        <div className="absolute top-0 left-0 right-0 border-b border-gray-900 px-4 sm:px-8 py-4 flex justify-between items-center">
          <div className="font-data text-[10px] sm:text-xs text-[#00FF41] flex items-center gap-2">
            <Terminal size={14} />
            <span className="hidden sm:inline">SYSTEM_STATUS:</span>
            <span className="scan-line">ACTIVE</span>
          </div>
          <div className="font-data text-[10px] sm:text-xs text-gray-500">
            v1.0.0
          </div>
        </div>

        {/* Main Content */}
        <div className="relative z-10 max-w-6xl mx-auto text-center">
          {/* Classification Tag */}
          <div className="inline-flex items-center gap-2 mb-6 sm:mb-8 border border-[#00FF41] px-3 sm:px-4 py-1 sm:py-2">
            <Lock size={14} className="text-[#00FF41]" />
            <span className="font-data text-[10px] sm:text-xs text-[#00FF41] tracking-widest">
              CLASSIFIED: PREMIUM PROTOCOL
            </span>
          </div>

          {/* Hero Headline */}
          <h1 className="font-identity text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black mb-4 sm:mb-6 leading-none tracking-tight">
            RESET<br />
            <span className="text-[#00FF41]">DOPAMINE</span>
          </h1>

          <p className="font-data text-xs sm:text-sm md:text-base text-gray-400 mb-8 sm:mb-12 max-w-2xl mx-auto leading-relaxed px-4">
            &gt; 30-DAY NEUROCHEMICAL RECALIBRATION PROTOCOL<br />
            &gt; ELIMINATE FRICTION. REBUILD BASELINE. EXECUTE.
          </p>

          {/* Dopamine Baseline Visualizer */}
          <div className="mb-10 sm:mb-16 px-4">
            <div className="inline-block">
              <div className="font-data text-[9px] sm:text-[10px] text-gray-500 mb-2 text-left flex items-center gap-2">
                <Activity size={12} className="text-[#00FF41]" />
                DOPAMINE_BASELINE [LIVE]
              </div>
              <div className="relative h-20 sm:h-32 w-[280px] sm:w-[500px] md:w-[600px] bg-black border border-gray-900 overflow-hidden">
                {/* EKG Line Path */}
                <svg 
                  className="absolute inset-0 w-[200%]" 
                  viewBox="0 0 1200 100" 
                  preserveAspectRatio="none"
                >
                  <path
                    className="ekg-line"
                    d="M0,50 L200,50 L220,30 L240,70 L260,50 L400,50 L420,20 L440,80 L460,50 L600,50 L620,30 L640,70 L660,50 L800,50 L820,20 L840,80 L860,50 L1000,50 L1020,30 L1040,70 L1060,50 L1200,50"
                    fill="none"
                    stroke="#00FF41"
                    strokeWidth="2"
                    opacity="0.8"
                  />
                  {/* Duplicate for seamless loop */}
                  <path
                    className="ekg-line"
                    d="M0,50 L200,50 L220,30 L240,70 L260,50 L400,50 L420,20 L440,80 L460,50 L600,50 L620,30 L640,70 L660,50 L800,50 L820,20 L840,80 L860,50 L1000,50 L1020,30 L1040,70 L1060,50 L1200,50"
                    fill="none"
                    stroke="#00FF41"
                    strokeWidth="2"
                    opacity="0.8"
                    transform="translate(600, 0)"
                  />
                </svg>
                
                {/* Grid Lines */}
                <div className="absolute inset-0 opacity-20">
                  {[...Array(8)].map((_, i) => (
                    <div 
                      key={i} 
                      className="absolute w-full border-t border-gray-800" 
                      style={{ top: `${(i + 1) * 12.5}%` }}
                    />
                  ))}
                </div>
              </div>
              <div className="font-data text-[9px] sm:text-[10px] text-[#00FF41] mt-2 flex justify-between">
                <span>STATUS: STABLE</span>
                <span className="text-gray-600">BPM: 72</span>
              </div>
            </div>
          </div>

          {/* CTA Button */}
          <button className="group relative bg-[#00FF41] text-black px-6 sm:px-10 py-3 sm:py-4 font-data text-xs sm:text-sm font-bold tracking-wider hover:bg-white transition-all duration-300 glow-green hover:glow-green-intense border-2 border-[#00FF41]">
            <span className="flex items-center gap-2 sm:gap-3">
              INITIATE PROTOCOL
              <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </span>
          </button>

          <p className="font-data text-[10px] sm:text-xs text-gray-600 mt-4">
            NO TRIAL. NO COMPROMISE. 30 DAYS OR FAILURE.
          </p>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 font-data text-xs text-gray-700 flex flex-col items-center gap-2">
          <span className="scan-line">↓</span>
          <span className="hidden sm:block">SCROLL TO EXECUTE</span>
        </div>
      </section>

      {/* Features Section - Command Log Style */}
      <section className="relative px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-32 border-b border-gray-900">
        <div className="max-w-5xl mx-auto">
          {/* Section Header */}
          <div className="mb-12 sm:mb-20">
            <div className="font-data text-[10px] sm:text-xs text-[#00FF41] mb-3 sm:mb-4 flex items-center gap-2">
              <Terminal size={14} />
              <span>SYSTEM_MODULES</span>
            </div>
            <h2 className="font-identity text-3xl sm:text-5xl md:text-6xl font-black mb-4 sm:mb-6">
              EXECUTION<br />FRAMEWORK
            </h2>
            <p className="font-data text-xs sm:text-sm text-gray-500 max-w-2xl">
              &gt; Seven friction gates. Zero negotiation. Built for operators who execute.
            </p>
          </div>

          {/* Command Log Features */}
          <div className="space-y-0">
            {[
              {
                id: '01',
                command: 'EXECUTE: FRICTION_GATE',
                icon: Shield,
                title: 'Behavioral Locks',
                description: 'Engineered resistance protocols. Every urge logged. Every trigger mapped. Real-time pattern recognition.',
                status: 'ACTIVE'
              },
              {
                id: '02',
                command: 'EXECUTE: STREAK_ENGINE',
                icon: Zap,
                title: 'Performance Continuity',
                description: '30-day neural rewiring sequence. Grace-based recovery system. Zero room for negotiation after commitment.',
                status: 'ACTIVE'
              },
              {
                id: '03',
                command: 'EXECUTE: TASK_PROTOCOL',
                icon: Target,
                title: 'Daily Execution Matrix',
                description: 'Personalized task bundles across 7 domains. Mood-aware selection. Time-of-day optimization. No guesswork.',
                status: 'ACTIVE'
              },
              {
                id: '04',
                command: 'EXECUTE: BIOMETRIC_SYNC',
                icon: Activity,
                title: 'Neurochemical Tracking',
                description: 'Calm Points economy. Badge milestone system. Dopamine baseline reconstruction through measured wins.',
                status: 'ACTIVE'
              },
              {
                id: '05',
                command: 'EXECUTE: AI_COMPANION',
                icon: Brain,
                title: 'DopaGuide Intelligence',
                description: 'Local AI companion. Context-aware guidance. Privacy-first architecture. No cloud dependency.',
                status: 'ACTIVE'
              }
            ].map((feature, index) => (
              <div 
                key={feature.id}
                className="group border-b border-gray-900 hover:border-[#00FF41] transition-all duration-300 hover:bg-gray-950"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 p-4 sm:p-6 lg:p-8">
                  {/* ID & Icon */}
                  <div className="flex items-center gap-4 sm:gap-6 w-full sm:w-auto">
                    <span className="font-data text-xs sm:text-sm text-gray-700 group-hover:text-[#00FF41] transition-colors min-w-[24px]">
                      {feature.id}
                    </span>
                    <div className="w-8 h-8 sm:w-10 sm:h-10 border border-gray-800 group-hover:border-[#00FF41] flex items-center justify-center transition-all group-hover:glow-green">
                      <feature.icon size={16} className="text-gray-600 group-hover:text-[#00FF41] transition-colors sm:w-5 sm:h-5" />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 w-full">
                    <div className="font-data text-[10px] sm:text-xs text-[#00FF41] mb-1 sm:mb-2 opacity-80">
                      {feature.command}
                    </div>
                    <h3 className="font-identity text-lg sm:text-xl md:text-2xl font-bold mb-2">
                      {feature.title}
                    </h3>
                    <p className="font-data text-[10px] sm:text-xs text-gray-500 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>

                  {/* Status */}
                  <div className="font-data text-[9px] sm:text-[10px] text-[#00FF41] border border-gray-800 group-hover:border-[#00FF41] px-2 sm:px-3 py-1 whitespace-nowrap self-start sm:self-center">
                    {feature.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative px-4 sm:px-6 lg:px-8 py-16 sm:py-24 border-b border-gray-900">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-12">
            {[
              { label: 'PROTOCOL_DURATION', value: '30', unit: 'DAYS' },
              { label: 'TASK_CATEGORIES', value: '07', unit: 'DOMAINS' },
              { label: 'SUCCESS_THRESHOLD', value: '70', unit: 'PERCENT' }
            ].map((stat, index) => (
              <div key={index} className="border border-gray-900 p-6 sm:p-8 hover:border-[#00FF41] transition-all duration-300 group">
                <div className="font-data text-[10px] text-gray-600 mb-3 sm:mb-4">
                  {stat.label}
                </div>
                <div className="font-identity text-4xl sm:text-5xl md:text-6xl font-black text-[#00FF41] mb-2">
                  {stat.value}
                </div>
                <div className="font-data text-xs text-gray-500">
                  {stat.unit}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="relative px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-32">
        <div className="max-w-4xl mx-auto text-center">
          <div className="font-data text-[10px] sm:text-xs text-[#00FF41] mb-4 sm:mb-6 tracking-widest">
            DEPLOYMENT_READY
          </div>
          <h2 className="font-identity text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black mb-6 sm:mb-8 leading-tight">
            BEGIN<br />
            RECALIBRATION
          </h2>
          <p className="font-data text-xs sm:text-sm text-gray-500 mb-10 sm:mb-12 max-w-2xl mx-auto px-4">
            &gt; This is not a self-help app. This is a systematic neurochemical reset.<br />
            &gt; 30 days. No extensions. No excuses.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center">
            <button className="w-full sm:w-auto group relative bg-[#00FF41] text-black px-8 sm:px-12 py-4 font-data text-xs sm:text-sm font-bold tracking-wider hover:bg-white transition-all duration-300 glow-green hover:glow-green-intense border-2 border-[#00FF41]">
              <span className="flex items-center justify-center gap-3">
                START PROTOCOL
                <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </span>
            </button>
            
            <button className="w-full sm:w-auto group relative bg-transparent text-white px-8 sm:px-12 py-4 font-data text-xs sm:text-sm font-bold tracking-wider hover:text-[#00FF41] transition-all duration-300 border-2 border-gray-800 hover:border-[#00FF41]">
              <span className="flex items-center justify-center gap-3">
                VIEW DOCUMENTATION
                <Terminal size={16} />
              </span>
            </button>
          </div>

          <div className="font-data text-[10px] sm:text-xs text-gray-700 mt-8 sm:mt-12 space-y-2">
            <p>&gt; REQUIRES: COMMITMENT.EXE</p>
            <p>&gt; COMPATIBLE: iOS | ANDROID</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-900 px-4 sm:px-8 py-6 sm:py-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="font-data text-[10px] text-gray-700">
            © 2026 ResetDopa. CLASSIFIED PROTOCOL.
          </div>
          <div className="flex gap-6 sm:gap-8 font-data text-[10px] text-gray-600">
            <a href="#" className="hover:text-[#00FF41] transition-colors">TERMS</a>
            <a href="#" className="hover:text-[#00FF41] transition-colors">PRIVACY</a>
            <a href="#" className="hover:text-[#00FF41] transition-colors">SECURITY</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
