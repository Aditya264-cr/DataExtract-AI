
import React from 'react';

const steps = [
  {
    number: '01',
    title: 'Diverse File Support',
    description: 'Seamless integration: comprehensive support for multiple file types (doc, docx, pdf, jpeg) to handle any input source.',
  },
  {
    number: '02',
    title: '99.5+% Labeling Accuracy',
    description: 'Achieve 99.5+% accuracy with Quick Slash logic—drop your files and pick them up, no additional work required.',
  },
  {
    number: '03',
    title: 'Enterprise Integration',
    description: 'Push your data to/from any enterprise IT system with automated API-driven dataflow for zero R&D overhead.',
  },
];

export const HowItWorks: React.FC = () => {
  return (
    <section className="w-full max-w-6xl mx-auto mt-24 text-center animate-slide-in relative z-10" style={{ animationDelay: '0.1s' }}>
      <h4 className="text-xs font-bold text-[#86868b] dark:text-gray-500 uppercase tracking-widest mb-4 font-body">
        The Platform
      </h4>
      <h3 className="text-4xl font-extrabold tracking-tight text-[#1d1d1f] dark:text-white font-display">
        Effortless AI Integration
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12 text-left">
        {steps.map((step, index) => (
          <div
            key={step.title}
            className="glass-card p-10 rounded-[2.5rem] animate-slide-in group hover:shadow-glow-blue-strong transition-all duration-500"
            style={{ animationDelay: `${0.2 + index * 0.1}s` }}
          >
            <span className="text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-blue-500/20 to-purple-500/20 font-display tracking-tighter group-hover:from-blue-500/40 group-hover:to-purple-500/40 transition-all">{step.number}</span>
            <h4 className="mt-6 text-xl font-bold text-[#1d1d1f] dark:text-white font-display tracking-tight">{step.title}</h4>
            <p className="mt-3 text-base text-[#86868b] dark:text-gray-400 leading-relaxed font-medium">{step.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
};
