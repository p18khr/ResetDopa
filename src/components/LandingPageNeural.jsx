import React, { useEffect, useState } from 'react';

const LandingPageNeural = () => {
  const [moleculeRotation, setMoleculeRotation] = useState(0);
  const [orbitalProgress, setOrbitalProgress] = useState(0);

  useEffect(() => {
    // Dopamine molecule rotation animation
    const rotationInterval = setInterval(() => {
      setMoleculeRotation(prev => (prev + 1) % 360);
    }, 50);

    // Orbital progress simulation
    const progressInterval = setInterval(() => {
      setOrbitalProgress(prev => (prev + 0.5) % 100);
    }, 100);

    return () => {
      clearInterval(rotationInterval);
      clearInterval(progressInterval);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#0D0D2B] text-white overflow-hidden">
      {/* Font imports */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=JetBrains+Mono:wght@400;500;700&display=swap');
        
        .font-identity {
          font-family: 'Playfair Display', serif;
        }
        
        .font-data {
          font-family: 'JetBrains Mono', monospace;
        }

        /* Dopamine molecule orbital animation */
        @keyframes orbit-rotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes pulse-glow {
          0%, 100% { 
            filter: drop-shadow(0 0 8px rgba(124, 127, 255, 0.6));
            opacity: 0.8;
          }
          50% { 
            filter: drop-shadow(0 0 20px rgba(124, 127, 255, 1));
            opacity: 1;
          }
        }

        @keyframes neural-pulse {
          0%, 100% { 
            r: 4;
            opacity: 0.8;
          }
          50% { 
            r: 6;
            opacity: 1;
          }
        }

        @keyframes particle-flow {
          0% { offset-distance: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { offset-distance: 100%; opacity: 0; }
        }

        .glow-indigo {
          box-shadow: 0 0 20px rgba(124, 127, 255, 0.4), 0 0 40px rgba(124, 127, 255, 0.2);
        }

        .glow-indigo-intense {
          box-shadow: 0 0 30px rgba(124, 127, 255, 0.8), 0 0 60px rgba(124, 127, 255, 0.5), 0 0 90px rgba(124, 127, 255, 0.3);
        }

        .glow-gold {
          box-shadow: 0 0 15px rgba(212, 165, 116, 0.4);
        }

        .scan-line-neural {
          animation: pulse-glow 2s ease-in-out infinite;
        }
      `}</style>

      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 border-b border-[#35357A]">
        {/* Neural network background pattern */}
        <div className="absolute inset-0 opacity-5">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="neural-grid" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                <circle cx="50" cy="50" r="1" fill="#7C7FFF" />
                <line x1="50" y1="50" x2="100" y2="50" stroke="#7C7FFF" strokeWidth="0.5" opacity="0.3" />
                <line x1="50" y1="50" x2="75" y2="100" stroke="#7C7FFF" strokeWidth="0.5" opacity="0.3" />
                <line x1="50" y1="50" x2="25" y2="0" stroke="#7C7FFF" strokeWidth="0.5" opacity="0.3" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#neural-grid)" />
          </svg>
        </div>

        {/* Status Bar */}
        <div className="absolute top-0 left-0 right-0 border-b border-[#35357A] px-4 sm:px-8 py-4 flex justify-between items-center z-20">
          <div className="font-data text-[10px] sm:text-xs text-[#7C7FFF] flex items-center gap-2">
            {/* Custom brain icon SVG */}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 3C8.5 3 6 5.5 6 8C6 9 6.5 10 7 10.5C6 11 5 12 5 13.5C5 15.5 6.5 17 8.5 17C8.5 19 10 21 12 21C14 21 15.5 19 15.5 17C17.5 17 19 15.5 19 13.5C19 12 18 11 17 10.5C17.5 10 18 9 18 8C18 5.5 15.5 3 12 3Z" stroke="#7C7FFF" strokeWidth="2" fill="none"/>
              <circle cx="10" cy="9" r="1" fill="#7C7FFF" className="scan-line-neural"/>
              <circle cx="14" cy="9" r="1" fill="#7C7FFF" className="scan-line-neural"/>
            </svg>
            <span className="hidden sm:inline">NEURAL_SYSTEM:</span>
            <span className="scan-line-neural">ONLINE</span>
          </div>
          <div className="font-data text-[10px] sm:text-xs text-[#6B74A0]">
            LAB_v1.0
          </div>
        </div>

        {/* Main Content */}
        <div className="relative z-10 max-w-6xl mx-auto text-center">
          {/* Classification Tag */}
          <div className="inline-flex items-center gap-2 mb-6 sm:mb-8 border border-[#7C7FFF] px-3 sm:px-4 py-1 sm:py-2 glow-indigo">
            {/* Custom lock/shield icon */}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L3 7V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V7L12 2Z" stroke="#7C7FFF" strokeWidth="2" fill="none"/>
              <circle cx="12" cy="12" r="3" fill="#7C7FFF"/>
            </svg>
            <span className="font-data text-[10px] sm:text-xs text-[#7C7FFF] tracking-widest">
              NEUROSCIENCE PROTOCOL: ACTIVE
            </span>
          </div>

          {/* Hero Headline */}
          <h1 className="font-identity text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black mb-4 sm:mb-6 leading-none tracking-tight">
            NEUROCHEMICAL<br />
            <span className="text-[#7C7FFF]">RECALIBRATION</span>
          </h1>

          <p className="font-data text-xs sm:text-sm md:text-base text-[#A8B0D8] mb-8 sm:mb-12 max-w-2xl mx-auto leading-relaxed px-4">
            &gt; SYSTEMATIC DOPAMINE BASELINE RESTORATION<br />
            &gt; 30-DAY NEURAL REWIRING PROTOCOL<br />
            &gt; CLINICAL PRECISION. ZERO COMPROMISE.
          </p>

          {/* Dopamine Molecule Visualizer */}
          <div className="mb-10 sm:mb-16 px-4">
            <div className="inline-block">
              <div className="font-data text-[9px] sm:text-[10px] text-[#6B74A0] mb-3 text-left flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="3" stroke="#7C7FFF" strokeWidth="2"/>
                  <circle cx="6" cy="6" r="2" fill="#7C7FFF"/>
                  <circle cx="18" cy="6" r="2" fill="#7C7FFF"/>
                  <circle cx="6" cy="18" r="2" fill="#7C7FFF"/>
                  <circle cx="18" cy="18" r="2" fill="#7C7FFF"/>
                  <line x1="12" y1="12" x2="6" y2="6" stroke="#7C7FFF" strokeWidth="1"/>
                  <line x1="12" y1="12" x2="18" y2="6" stroke="#7C7FFF" strokeWidth="1"/>
                  <line x1="12" y1="12" x2="6" y2="18" stroke="#7C7FFF" strokeWidth="1"/>
                  <line x1="12" y1="12" x2="18" y2="18" stroke="#7C7FFF" strokeWidth="1"/>
                </svg>
                DOPAMINE_MOLECULE [C₈H₁₁NO₂] LIVE VISUALIZATION
              </div>
              
              {/* Custom Dopamine Molecule SVG */}
              <div className="relative h-32 sm:h-48 w-[300px] sm:w-[500px] md:w-[600px] bg-[#17173A] border border-[#35357A] overflow-hidden mx-auto rounded-sm">
                <svg 
                  className="absolute inset-0 w-full h-full" 
                  viewBox="0 0 600 200"
                  xmlns="http://www.w3.org/2000/svg"
                  style={{ transform: `rotate(${moleculeRotation * 0.5}deg)` }}
                >
                  {/* Dopamine molecule structure (simplified) */}
                  {/* Benzene ring */}
                  <g transform="translate(200, 100)">
                    <circle cx="0" cy="-30" r="8" fill="#7C7FFF" className="scan-line-neural"/>
                    <circle cx="26" cy="-15" r="8" fill="#7C7FFF" className="scan-line-neural"/>
                    <circle cx="26" cy="15" r="8" fill="#7C7FFF" className="scan-line-neural"/>
                    <circle cx="0" cy="30" r="8" fill="#7C7FFF" className="scan-line-neural"/>
                    <circle cx="-26" cy="15" r="8" fill="#7C7FFF" className="scan-line-neural"/>
                    <circle cx="-26" cy="-15" r="8" fill="#7C7FFF" className="scan-line-neural"/>
                    
                    {/* Bonds */}
                    <line x1="0" y1="-30" x2="26" y2="-15" stroke="#D4A574" strokeWidth="2"/>
                    <line x1="26" y1="-15" x2="26" y2="15" stroke="#D4A574" strokeWidth="2"/>
                    <line x1="26" y1="15" x2="0" y2="30" stroke="#D4A574" strokeWidth="2"/>
                    <line x1="0" y1="30" x2="-26" y2="15" stroke="#D4A574" strokeWidth="2"/>
                    <line x1="-26" y1="15" x2="-26" y2="-15" stroke="#D4A574" strokeWidth="2"/>
                    <line x1="-26" y1="-15" x2="0" y2="-30" stroke="#D4A574" strokeWidth="2"/>
                    
                    {/* OH groups (hydroxyl) */}
                    <circle cx="0" cy="-50" r="6" fill="#30D158" opacity="0.8"/>
                    <circle cx="0" cy="50" r="6" fill="#30D158" opacity="0.8"/>
                    <line x1="0" y1="-30" x2="0" y2="-50" stroke="#A8B0D8" strokeWidth="2"/>
                    <line x1="0" y1="30" x2="0" y2="50" stroke="#A8B0D8" strokeWidth="2"/>
                    
                    {/* Ethylamine chain */}
                    <circle cx="60" cy="0" r="8" fill="#7C7FFF" className="scan-line-neural"/>
                    <circle cx="90" cy="0" r="8" fill="#7C7FFF" className="scan-line-neural"/>
                    <circle cx="120" cy="0" r="10" fill="#FF9F0A" opacity="0.9">
                      <animate attributeName="r" values="8;12;8" dur="2s" repeatCount="indefinite"/>
                    </circle>
                    <line x1="26" y1="0" x2="60" y2="0" stroke="#D4A574" strokeWidth="2"/>
                    <line x1="60" y1="0" x2="90" y2="0" stroke="#D4A574" strokeWidth="2"/>
                    <line x1="90" y1="0" x2="120" y2="0" stroke="#D4A574" strokeWidth="2"/>
                    
                    {/* Hydrogen atoms on NH2 */}
                    <circle cx="130" cy="-15" r="4" fill="#A8B0D8" opacity="0.6"/>
                    <circle cx="130" cy="15" r="4" fill="#A8B0D8" opacity="0.6"/>
                  </g>
                  
                  {/* Orbital ring (logo-inspired) */}
                  <ellipse 
                    cx="300" 
                    cy="100" 
                    rx="280" 
                    ry="80" 
                    fill="none" 
                    stroke="#35357A" 
                    strokeWidth="1" 
                    opacity="0.5"
                    strokeDasharray="4 4"
                  />
                  
                  {/* Orbital particle */}
                  <circle 
                    cx={300 + 280 * Math.cos((orbitalProgress / 100) * Math.PI * 2)} 
                    cy={100 + 80 * Math.sin((orbitalProgress / 100) * Math.PI * 2)} 
                    r="3" 
                    fill="#7C7FFF"
                    className="glow-indigo"
                  />
                </svg>
                
                {/* Grid overlay */}
                <div className="absolute inset-0 opacity-10 pointer-events-none">
                  {[...Array(6)].map((_, i) => (
                    <div 
                      key={i} 
                      className="absolute w-full border-t border-[#35357A]" 
                      style={{ top: `${(i + 1) * 16.66}%` }}
                    />
                  ))}
                </div>
              </div>
              
              <div className="font-data text-[9px] sm:text-[10px] text-[#7C7FFF] mt-3 flex justify-between">
                <span>BASELINE_STATUS: CALIBRATING</span>
                <span className="text-[#6B74A0]">NEURAL_ACTIVITY: {Math.floor(50 + Math.sin(moleculeRotation * 0.1) * 10)}%</span>
              </div>
            </div>
          </div>

          {/* CTA Button */}
          <button className="group relative bg-[#7C7FFF] text-white px-6 sm:px-10 py-3 sm:py-4 font-data text-xs sm:text-sm font-bold tracking-wider hover:bg-[#9396FF] transition-all duration-300 glow-indigo hover:glow-indigo-intense border-2 border-[#7C7FFF]">
            <span className="flex items-center gap-2 sm:gap-3">
              BEGIN NEURAL RESET
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="group-hover:translate-x-1 transition-transform">
                <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </span>
          </button>

          <p className="font-data text-[10px] sm:text-xs text-[#6B74A0] mt-4">
            CLINICAL PROTOCOL. 30 DAYS. NEUROPLASTICITY GUARANTEED.
          </p>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 font-data text-xs text-[#6B74A0] flex flex-col items-center gap-2">
          <span className="scan-line-neural">↓</span>
          <span className="hidden sm:block">EXPLORE METHODOLOGY</span>
        </div>
      </section>

      {/* Brain Regions Features Section */}
      <section className="relative px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-32 border-b border-[#35357A]">
        <div className="max-w-5xl mx-auto">
          {/* Section Header */}
          <div className="mb-12 sm:mb-20">
            <div className="font-data text-[10px] sm:text-xs text-[#7C7FFF] mb-3 sm:mb-4 flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="3" width="7" height="7" stroke="#7C7FFF" strokeWidth="2" fill="none"/>
                <rect x="14" y="3" width="7" height="7" stroke="#7C7FFF" strokeWidth="2" fill="none"/>
                <rect x="3" y="14" width="7" height="7" stroke="#7C7FFF" strokeWidth="2" fill="none"/>
                <rect x="14" y="14" width="7" height="7" stroke="#7C7FFF" strokeWidth="2" fill="none"/>
              </svg>
              <span>NEURAL_INTERVENTION_MODULES</span>
            </div>
            <h2 className="font-identity text-3xl sm:text-5xl md:text-6xl font-black mb-4 sm:mb-6">
              TARGETED<br />BRAIN REGIONS
            </h2>
            <p className="font-data text-xs sm:text-sm text-[#A8B0D8] max-w-2xl">
              &gt; Five neurological intervention points. Evidence-based protocols. Measurable outcomes.
            </p>
          </div>

          {/* Brain Region Features */}
          <div className="space-y-0">
            {[
              {
                id: '01',
                region: 'PREFRONTAL_CORTEX',
                icon: (
                  <svg width="40" height="40" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                    {/* Stylized prefrontal cortex */}
                    <path d="M32 8C20 8 10 18 10 30C10 35 12 40 15 43" stroke="#7C7FFF" strokeWidth="2" fill="none"/>
                    <path d="M32 8C44 8 54 18 54 30C54 35 52 40 49 43" stroke="#7C7FFF" strokeWidth="2" fill="none"/>
                    <circle cx="25" cy="28" r="3" fill="#7C7FFF"/>
                    <circle cx="39" cy="28" r="3" fill="#7C7FFF"/>
                    <path d="M20 35C22 38 27 40 32 40C37 40 42 38 44 35" stroke="#D4A574" strokeWidth="2"/>
                    <rect x="28" y="12" width="8" height="12" fill="#7C7FFF" opacity="0.3"/>
                  </svg>
                ),
                title: 'Executive Control',
                description: 'Impulse regulation through systematic friction gates. Real-time urge logging with pattern recognition algorithms.',
                metric: 'IMPULSE_CONTROL: +67%'
              },
              {
                id: '02',
                region: 'REWARD_PATHWAY',
                icon: (
                  <svg width="40" height="40" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                    {/* Dopamine reward pathway */}
                    <path d="M32 10L32 54" stroke="#7C7FFF" strokeWidth="2"/>
                    <circle cx="32" cy="20" r="5" fill="#FF9F0A" opacity="0.8"/>
                    <circle cx="32" cy="32" r="6" fill="#7C7FFF"/>
                    <circle cx="32" cy="44" r="5" fill="#30D158" opacity="0.8"/>
                    <path d="M22 32L42 32" stroke="#D4A574" strokeWidth="2"/>
                    <circle cx="18" cy="32" r="3" fill="#7C7FFF" opacity="0.6"/>
                    <circle cx="46" cy="32" r="3" fill="#7C7FFF" opacity="0.6"/>
                  </svg>
                ),
                title: 'Dopamine Recalibration',
                description: 'Baseline restoration through graduated task difficulty. 30-day neuroplasticity induction with measurable receptor upregulation.',
                metric: 'BASELINE_RECOVERY: 30 DAYS'
              },
              {
                id: '03',
                region: 'HABIT_CIRCUITRY',
                icon: (
                  <svg width="40" height="40" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                    {/* Basal ganglia habit loop */}
                    <circle cx="32" cy="32" r="18" stroke="#7C7FFF" strokeWidth="2" fill="none"/>
                    <path d="M32 14C32 14 50 32 32 50C32 50 14 32 32 14Z" fill="#7C7FFF" opacity="0.2"/>
                    <circle cx="32" cy="32" r="8" fill="#7C7FFF"/>
                    <path d="M40 24C42 26 43 29 43 32" stroke="#D4A574" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M24 40C22 38 21 35 21 32" stroke="#D4A574" strokeWidth="2" strokeLinecap="round"/>
                    <circle cx="45" cy="32" r="2" fill="#30D158"/>
                  </svg>
                ),
                title: 'Behavioral Automation',
                description: 'Daily execution matrix across 7 life domains. Mood-adaptive task selection. Time-of-day optimization protocols.',
                metric: 'TASK_DOMAINS: 07'
              },
              {
                id: '04',
                region: 'STRESS_RESPONSE',
                icon: (
                  <svg width="40" height="40" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                    {/* Amygdala/stress circuit */}
                    <ellipse cx="32" cy="32" rx="16" ry="20" stroke="#7C7FFF" strokeWidth="2" fill="none"/>
                    <path d="M20 28C20 28 24 24 32 24C40 24 44 28 44 28" stroke="#7C7FFF" strokeWidth="2"/>
                    <circle cx="26" cy="36" r="4" fill="#FF9F0A" opacity="0.8"/>
                    <circle cx="38" cy="36" r="4" fill="#FF9F0A" opacity="0.8"/>
                    <path d="M32 44L32 52" stroke="#D4A574" strokeWidth="2"/>
                    <path d="M28 48L36 48" stroke="#D4A574" strokeWidth="2"/>
                  </svg>
                ),
                title: 'Calm Point Economy',
                description: 'Neurochemical balance tracking through point-based reward system. Milestone badges trigger endogenous dopamine release.',
                metric: 'BADGES_UNLOCKED: 14'
              },
              {
                id: '05',
                region: 'COGNITIVE_GUIDANCE',
                icon: (
                  <svg width="40" height="40" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                    {/* Neural network/AI integration */}
                    <circle cx="32" cy="16" r="4" fill="#7C7FFF"/>
                    <circle cx="20" cy="32" r="4" fill="#7C7FFF"/>
                    <circle cx="44" cy="32" r="4" fill="#7C7FFF"/>
                    <circle cx="26" cy="48" r="4" fill="#7C7FFF"/>
                    <circle cx="38" cy="48" r="4" fill="#7C7FFF"/>
                    <line x1="32" y1="16" x2="20" y2="32" stroke="#D4A574" strokeWidth="2"/>
                    <line x1="32" y1="16" x2="44" y2="32" stroke="#D4A574" strokeWidth="2"/>
                    <line x1="20" y1="32" x2="26" y2="48" stroke="#D4A574" strokeWidth="2"/>
                    <line x1="44" y1="32" x2="38" y2="48" stroke="#D4A574" strokeWidth="2"/>
                    <circle cx="32" cy="32" r="6" fill="#7C7FFF" opacity="0.4"/>
                  </svg>
                ),
                title: 'DopaGuide Intelligence',
                description: 'Local AI companion with context-aware intervention. Privacy-first architecture. Zero cloud dependency.',
                metric: 'AI_MODEL: LOCAL'
              }
            ].map((feature) => (
              <div 
                key={feature.id}
                className="group border-b border-[#35357A] hover:border-[#7C7FFF] transition-all duration-300 hover:bg-[#17173A]"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 p-4 sm:p-6 lg:p-8">
                  {/* ID & Custom Icon */}
                  <div className="flex items-center gap-4 sm:gap-6 w-full sm:w-auto">
                    <span className="font-data text-xs sm:text-sm text-[#6B74A0] group-hover:text-[#7C7FFF] transition-colors min-w-[24px]">
                      {feature.id}
                    </span>
                    <div className="w-12 h-12 sm:w-14 sm:h-14 border border-[#35357A] group-hover:border-[#7C7FFF] flex items-center justify-center transition-all group-hover:glow-indigo bg-[#17173A]">
                      <div className="group-hover:scale-110 transition-transform">
                        {feature.icon}
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 w-full">
                    <div className="font-data text-[10px] sm:text-xs text-[#7C7FFF] mb-1 sm:mb-2 opacity-80">
                      {feature.region}
                    </div>
                    <h3 className="font-identity text-lg sm:text-xl md:text-2xl font-bold mb-2 text-white">
                      {feature.title}
                    </h3>
                    <p className="font-data text-[10px] sm:text-xs text-[#A8B0D8] leading-relaxed mb-2">
                      {feature.description}
                    </p>
                    <div className="font-data text-[9px] sm:text-[10px] text-[#D4A574]">
                      {feature.metric}
                    </div>
                  </div>

                  {/* Status Indicator */}
                  <div className="font-data text-[9px] sm:text-[10px] text-[#7C7FFF] border border-[#35357A] group-hover:border-[#7C7FFF] px-2 sm:px-3 py-1 whitespace-nowrap self-start sm:self-center">
                    ACTIVE
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Before/After Brain States Section */}
      <section className="relative px-4 sm:px-6 lg:px-8 py-16 sm:py-24 border-b border-[#35357A]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-identity text-3xl sm:text-5xl md:text-6xl font-black mb-4">
              NEURAL<br />TRANSFORMATION
            </h2>
            <p className="font-data text-xs sm:text-sm text-[#A8B0D8]">
              &gt; Measurable dopamine pathway restoration
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12">
            {/* Before State */}
            <div className="border border-[#35357A] p-6 sm:p-8 bg-[#17173A]">
              <div className="font-data text-[10px] text-[#FF9F0A] mb-4 flex items-center gap-2">
                <span className="w-2 h-2 bg-[#FF9F0A] rounded-full"></span>
                DAY_00: DEPLETED
              </div>
              
              {/* Before brain visualization */}
              <div className="relative h-48 sm:h-64 mb-4">
                <svg className="w-full h-full" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                  {/* Depleted brain outline */}
                  <path d="M100 40C70 40 50 60 50 85C50 95 55 105 60 110C50 115 40 125 40 140C40 155 50 165 65 165C65 180 80 195 100 195C120 195 135 180 135 165C150 165 160 155 160 140C160 125 150 115 140 110C145 105 150 95 150 85C150 60 130 40 100 40Z" 
                        stroke="#6B74A0" 
                        strokeWidth="3" 
                        fill="none"
                        opacity="0.5"
                  />
                  
                  {/* Weak neural connections */}
                  <line x1="75" y1="80" x2="125" y2="80" stroke="#6B74A0" strokeWidth="1" opacity="0.3"/>
                  <line x1="70" y1="100" x2="130" y2="100" stroke="#6B74A0" strokeWidth="1" opacity="0.3"/>
                  <line x1="75" y1="120" x2="125" y2="120" stroke="#6B74A0" strokeWidth="1" opacity="0.3"/>
                  
                  {/* Dim nodes */}
                  <circle cx="80" cy="80" r="3" fill="#6B74A0" opacity="0.4"/>
                  <circle cx="120" cy="80" r="3" fill="#6B74A0" opacity="0.4"/>
                  <circle cx="80" cy="120" r="3" fill="#6B74A0" opacity="0.4"/>
                  <circle cx="120" cy="120" r="3" fill="#6B74A0" opacity="0.4"/>
                  <circle cx="100" cy="100" r="4" fill="#FF9F0A" opacity="0.5"/>
                </svg>
              </div>
              
              <div className="space-y-2 font-data text-[10px] text-[#A8B0D8]">
                <div className="flex justify-between">
                  <span>Baseline Dopamine:</span>
                  <span className="text-[#FF9F0A]">LOW</span>
                </div>
                <div className="flex justify-between">
                  <span>Neural Density:</span>
                  <span className="text-[#FF9F0A]">32%</span>
                </div>
                <div className="flex justify-between">
                  <span>Impulse Control:</span>
                  <span className="text-[#FF9F0A]">WEAK</span>
                </div>
              </div>
            </div>

            {/* After State */}
            <div className="border border-[#7C7FFF] p-6 sm:p-8 bg-[#17173A] glow-indigo">
              <div className="font-data text-[10px] text-[#30D158] mb-4 flex items-center gap-2">
                <span className="w-2 h-2 bg-[#30D158] rounded-full scan-line-neural"></span>
                DAY_30: RESTORED
              </div>
              
              {/* After brain visualization */}
              <div className="relative h-48 sm:h-64 mb-4">
                <svg className="w-full h-full" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                  {/* Restored brain outline */}
                  <path d="M100 40C70 40 50 60 50 85C50 95 55 105 60 110C50 115 40 125 40 140C40 155 50 165 65 165C65 180 80 195 100 195C120 195 135 180 135 165C150 165 160 155 160 140C160 125 150 115 140 110C145 105 150 95 150 85C150 60 130 40 100 40Z" 
                        stroke="#7C7FFF" 
                        strokeWidth="3" 
                        fill="none"
                        className="scan-line-neural"
                  />
                  
                  {/* Strong neural connections */}
                  <line x1="75" y1="80" x2="125" y2="80" stroke="#7C7FFF" strokeWidth="2" opacity="0.8"/>
                  <line x1="70" y1="100" x2="130" y2="100" stroke="#7C7FFF" strokeWidth="2" opacity="0.8"/>
                  <line x1="75" y1="120" x2="125" y2="120" stroke="#7C7FFF" strokeWidth="2" opacity="0.8"/>
                  <line x1="85" y1="90" x2="115" y2="90" stroke="#D4A574" strokeWidth="2" opacity="0.6"/>
                  <line x1="85" y1="110" x2="115" y2="110" stroke="#D4A574" strokeWidth="2" opacity="0.6"/>
                  
                  {/* Bright nodes */}
                  <circle cx="80" cy="80" r="4" fill="#7C7FFF" className="scan-line-neural"/>
                  <circle cx="120" cy="80" r="4" fill="#7C7FFF" className="scan-line-neural"/>
                  <circle cx="80" cy="120" r="4" fill="#7C7FFF" className="scan-line-neural"/>
                  <circle cx="120" cy="120" r="4" fill="#7C7FFF" className="scan-line-neural"/>
                  <circle cx="100" cy="100" r="6" fill="#30D158" className="scan-line-neural"/>
                </svg>
              </div>
              
              <div className="space-y-2 font-data text-[10px] text-[#A8B0D8]">
                <div className="flex justify-between">
                  <span>Baseline Dopamine:</span>
                  <span className="text-[#30D158]">OPTIMAL</span>
                </div>
                <div className="flex justify-between">
                  <span>Neural Density:</span>
                  <span className="text-[#30D158]">89%</span>
                </div>
                <div className="flex justify-between">
                  <span>Impulse Control:</span>
                  <span className="text-[#30D158]">STRONG</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Orbital Progress Stats */}
      <section className="relative px-4 sm:px-6 lg:px-8 py-16 sm:py-24 border-b border-[#35357A]">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-12">
            {[
              { label: 'PROTOCOL_DURATION', value: '30', unit: 'DAYS', color: '#7C7FFF' },
              { label: 'INTERVENTION_DOMAINS', value: '07', unit: 'SYSTEMS', color: '#D4A574' },
              { label: 'SUCCESS_THRESHOLD', value: '70', unit: 'PERCENT', color: '#30D158' }
            ].map((stat, index) => (
              <div key={index} className="border border-[#35357A] p-6 sm:p-8 hover:border-[#7C7FFF] transition-all duration-300 group bg-[#17173A] hover:glow-indigo">
                <div className="font-data text-[10px] text-[#6B74A0] mb-3 sm:mb-4">
                  {stat.label}
                </div>
                
                {/* Orbital ring progress indicator */}
                <div className="relative w-24 h-24 mx-auto mb-4">
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    <circle 
                      cx="50" 
                      cy="50" 
                      r="45" 
                      fill="none" 
                      stroke="#35357A" 
                      strokeWidth="2"
                    />
                    <circle 
                      cx="50" 
                      cy="50" 
                      r="45" 
                      fill="none" 
                      stroke={stat.color} 
                      strokeWidth="3" 
                      strokeDasharray={`${2 * Math.PI * 45 * (parseInt(stat.value) / 100)} ${2 * Math.PI * 45}`}
                      strokeLinecap="round"
                      transform="rotate(-90 50 50)"
                      className="group-hover:opacity-100 opacity-80 transition-opacity"
                    />
                    <circle 
                      cx="50" 
                      cy="5" 
                      r="3" 
                      fill={stat.color}
                      className="scan-line-neural"
                    />
                    <text 
                      x="50" 
                      y="50" 
                      textAnchor="middle" 
                      dy=".3em" 
                      className="font-identity text-2xl font-black"
                      fill={stat.color}
                    >
                      {stat.value}
                    </text>
                  </svg>
                </div>
                
                <div className="font-data text-xs text-[#A8B0D8] text-center">
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
          <div className="font-data text-[10px] sm:text-xs text-[#7C7FFF] mb-4 sm:mb-6 tracking-widest">
            LABORATORY_ACCESS: OPEN
          </div>
          <h2 className="font-identity text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black mb-6 sm:mb-8 leading-tight">
            INITIATE<br />
            <span className="text-[#7C7FFF]">PROTOCOL</span>
          </h2>
          <p className="font-data text-xs sm:text-sm text-[#A8B0D8] mb-10 sm:mb-12 max-w-2xl mx-auto px-4">
            &gt; Clinical-grade neurochemical intervention.<br />
            &gt; 30-day systematic dopamine baseline restoration.<br />
            &gt; Evidence-based. Measurable. Permanent.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center">
            <button className="w-full sm:w-auto group relative bg-[#7C7FFF] text-white px-8 sm:px-12 py-4 font-data text-xs sm:text-sm font-bold tracking-wider hover:bg-[#9396FF] transition-all duration-300 glow-indigo hover:glow-indigo-intense border-2 border-[#7C7FFF]">
              <span className="flex items-center justify-center gap-3">
                START NEURAL RESET
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="group-hover:translate-x-1 transition-transform">
                  <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </span>
            </button>
            
            <button className="w-full sm:w-auto group relative bg-transparent text-white px-8 sm:px-12 py-4 font-data text-xs sm:text-sm font-bold tracking-wider hover:text-[#7C7FFF] transition-all duration-300 border-2 border-[#35357A] hover:border-[#7C7FFF]">
              <span className="flex items-center justify-center gap-3">
                RESEARCH METHODOLOGY
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </span>
            </button>
          </div>

          <div className="font-data text-[10px] sm:text-xs text-[#6B74A0] mt-8 sm:mt-12 space-y-2">
            <p>&gt; REQUIRES: NEUROPLASTICITY.EXE</p>
            <p>&gt; COMPATIBLE: iOS | ANDROID</p>
            <p>&gt; DEPLOYMENT: IMMEDIATE</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#35357A] px-4 sm:px-8 py-6 sm:py-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="font-data text-[10px] text-[#6B74A0]">
            © 2026 ResetDopa™. NEUROSCIENCE LABORATORY.
          </div>
          <div className="flex gap-6 sm:gap-8 font-data text-[10px] text-[#6B74A0]">
            <a href="#" className="hover:text-[#7C7FFF] transition-colors">PROTOCOL</a>
            <a href="#" className="hover:text-[#7C7FFF] transition-colors">PRIVACY</a>
            <a href="#" className="hover:text-[#7C7FFF] transition-colors">RESEARCH</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPageNeural;
