import React from 'react';

type StarBorderProps<T extends React.ElementType> = React.ComponentPropsWithoutRef<T> & {
  as?: T;
  className?: string;
  children?: React.ReactNode;
  color?: string;
  speed?: React.CSSProperties['animationDuration'];
  thickness?: number;
};

const StarBorder = <T extends React.ElementType = 'button'>({
  as,
  className = '',
  color = 'hsl(var(--primary))',
  speed = '6s',
  thickness = 1,
  children,
  ...rest
}: StarBorderProps<T>) => {
  const Component = as || 'button';

  return (
    <Component
      className={`relative inline-block overflow-hidden rounded-[20px] group ${className}`}
      {...(rest as any)}
      style={{
        padding: `${thickness}px 0`,
        ...(rest as any).style
      }}
    >
      <div
        className="absolute w-[300%] h-[50%] opacity-100 bottom-[-11px] right-[-250%] rounded-full animate-star-movement-bottom z-0"
        style={{
          background: `radial-gradient(circle, ${color}, transparent 30%)`,
          animationDuration: speed,
          filter: 'blur(20px)'
        }}
      ></div>
      <div
        className="absolute w-[300%] h-[50%] opacity-100 top-[-10px] left-[-250%] rounded-full animate-star-movement-top z-0"
        style={{
          background: `radial-gradient(circle, ${color}, transparent 30%)`,
          animationDuration: speed,
          filter: 'blur(20px)'
        }}
      ></div>
      <div 
        className="relative z-1 bg-background border-2 border-primary/40 text-foreground text-center text-[16px] py-[16px] px-[26px] rounded-[20px] group-hover:shadow-inner-sweep transition-all duration-700"
        style={{
          boxShadow: `inset 0 0 20px -5px ${color}, inset 0 0 40px -10px ${color}`
        }}
      >
        <div className="absolute inset-0 rounded-[20px] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none overflow-hidden">
          <div 
            className="absolute inset-0 translate-y-full group-hover:translate-y-[-100%] transition-transform duration-700 ease-out"
            style={{
              background: `linear-gradient(to top, ${color}40, transparent 80%)`,
              boxShadow: `inset 0 -20px 40px -10px ${color}`
            }}
          />
        </div>
        <span className="relative z-10">{children}</span>
      </div>
    </Component>
  );
};

export default StarBorder;

// tailwind.config.js
// module.exports = {
//   theme: {
//     extend: {
//       animation: {
//         'star-movement-bottom': 'star-movement-bottom linear infinite alternate',
//         'star-movement-top': 'star-movement-top linear infinite alternate',
//       },
//       keyframes: {
//         'star-movement-bottom': {
//           '0%': { transform: 'translate(0%, 0%)', opacity: '1' },
//           '100%': { transform: 'translate(-100%, 0%)', opacity: '0' },
//         },
//         'star-movement-top': {
//           '0%': { transform: 'translate(0%, 0%)', opacity: '1' },
//           '100%': { transform: 'translate(100%, 0%)', opacity: '0' },
//         },
//       },
//     },
//   }
// }
