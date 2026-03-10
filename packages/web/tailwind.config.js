/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  safelist: [
    'translate-x-0',
    '-translate-x-full',
    'hidden',
    'lg:block',
    'lg:hidden',
    'xl:block',
    'xl:hidden',
    // Theme classes
    'theme-light',
    'theme-dark',
    'theme-tech',
  ],
  theme: {
    extend: {
      /* ========================================
         Font Families - 字体系统
         使用 CSS 变量支持主题切换
         ======================================== */
      fontFamily: {
        sans: ['var(--font-outfit)', 'system-ui', 'sans-serif'],
        display: ['var(--font-fraunces)', 'Georgia', 'serif'],
        mono: ['var(--font-jetbrains)', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },

      /* ========================================
         Colors - 颜色系统
         使用 CSS 变量，映射到 OKLCH tokens
         ======================================== */
      colors: {
        // 背景层级
        'bg': {
          DEFAULT: 'var(--bg-base)',
          base: 'var(--bg-base)',
          raised: 'var(--bg-raised)',
          surface: 'var(--bg-surface)',
          embedded: 'var(--bg-embedded)',
        },
        
        // 文本层级
        'text': {
          DEFAULT: 'var(--text-primary)',
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          tertiary: 'var(--text-tertiary)',
        },
        
        // 强调色
        accent: {
          DEFAULT: 'var(--accent)',
          hover: 'var(--accent-hover)',
          muted: 'var(--accent-muted)',
          foreground: 'var(--accent-foreground)',
        },
        
        // 次要色
        secondary: {
          DEFAULT: 'var(--secondary)',
          hover: 'var(--secondary-hover)',
          muted: 'var(--secondary-muted)',
        },
        
        // 语义色
        success: {
          DEFAULT: 'var(--success)',
          bg: 'var(--success-bg)',
        },
        error: {
          DEFAULT: 'var(--error)',
          bg: 'var(--error-bg)',
        },
        warning: {
          DEFAULT: 'var(--warning)',
          bg: 'var(--warning-bg)',
        },
        info: {
          DEFAULT: 'var(--info)',
          bg: 'var(--info-bg)',
        },
        
        // 边框
        border: {
          DEFAULT: 'var(--border)',
          strong: 'var(--border-strong)',
        },
        
        // 交互状态
        hover: 'var(--hover)',
        active: 'var(--active)',
        focus: 'var(--focus)',
      },

      /* ========================================
         Spacing - 间距系统
         基于 4px 网格
         ======================================== */
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '70': '17.5rem',
        '84': '21rem',
        '88': '22rem',
        '100': '25rem',
        '120': '30rem',
      },

      /* ========================================
         Border Radius - 圆角系统
         ======================================== */
      borderRadius: {
        'sm': 'var(--radius-sm)',
        'md': 'var(--radius-md)',
        'lg': 'var(--radius-lg)',
        'xl': 'var(--radius-xl)',
      },

      /* ========================================
         Shadows - 阴影系统
         ======================================== */
      boxShadow: {
        'sm': 'var(--shadow-sm)',
        'md': 'var(--shadow-md)',
        'lg': 'var(--shadow-lg)',
      },

      /* ========================================
         Animation - 动画
         ======================================== */
      animation: {
        'slide-in': 'slide-in 0.3s ease-out forwards',
        'fade-in': 'fade-in 0.25s ease-out forwards',
        'scale-in': 'scale-in 0.2s ease-out forwards',
      },
      keyframes: {
        'slide-in': {
          from: { transform: 'translateX(100%)', opacity: '0' },
          to: { transform: 'translateX(0)', opacity: '1' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'scale-in': {
          from: { transform: 'scale(0.95)', opacity: '0' },
          to: { transform: 'scale(1)', opacity: '1' },
        },
      },

      /* ========================================
         Transition Duration - 过渡时长
         ======================================== */
      transitionDuration: {
        'fast': 'var(--duration-fast)',
        'normal': 'var(--duration-normal)',
        'slow': 'var(--duration-slow)',
      },

      /* ========================================
         Screens - 响应式断点
         移动优先设计
         ======================================== */
      screens: {
        // sm: 640px+   - Large phones
        // md: 768px+   - Tablets portrait
        // lg: 1024px+  - Tablets landscape / Small laptops
        // xl: 1280px+  - Desktops
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
      },

      /* ========================================
         Min Height/Width - 触摸友好
         WCAG 要求最小 44px 触摸目标
         ======================================== */
      minHeight: {
        'touch': '44px',
      },
      minWidth: {
        'touch': '44px',
      },

      /* ========================================
         Typography - 字体排版
         ======================================== */
      fontSize: {
        'fluid-sm': 'clamp(0.75rem, 0.6875rem + 0.3125vw, 0.875rem)',
        'fluid-base': 'clamp(0.875rem, 0.8125rem + 0.3125vw, 1rem)',
        'fluid-lg': 'clamp(1rem, 0.9375rem + 0.3125vw, 1.125rem)',
        'fluid-xl': 'clamp(1.125rem, 1rem + 0.625vw, 1.25rem)',
        'fluid-2xl': 'clamp(1.25rem, 1.125rem + 0.625vw, 1.5rem)',
        'fluid-3xl': 'clamp(1.5rem, 1.25rem + 1.25vw, 2rem)',
        'fluid-4xl': 'clamp(1.75rem, 1.5rem + 1.25vw, 2.5rem)',
      },
    },
  },
  plugins: [],
};
