const fs = require('fs');
const path = require('path');

const directoryPath = path.join('c:', 'Users', 'anjal', 'Desktop', 'sem_6', 'AWT', 'final project', 'inward-outward', 'app');

const replacements = {
  // Global utility classes
  'pastel-card': 'glass-card',
  'pastel-input': 'neon-input',
  'pastel-button': 'glow-button',
  
  // Text colors
  'text-slate-900': 'text-white',
  'text-slate-800': 'text-white',
  'text-slate-700': 'text-slate-200',
  'text-slate-600': 'text-slate-300',
  'text-slate-500': 'text-slate-400',
  
  // Backgrounds & Borders
  'bg-white': 'bg-slate-900/40 backdrop-blur-sm',
  'border-\\[var\\(--border\\)\\]': 'border-white/10',
  'border-slate-100': 'border-white/10',
  'border-slate-200': 'border-white/10',
  'border-slate-50': 'border-white/5',
  'bg-slate-50/50': 'bg-white/5',
  'bg-slate-50/30': 'bg-white/[0.02]',
  'bg-slate-50': 'bg-white/5',
  
  // Specific thematic changes for Dashboard (Blue -> Cyan, Orange -> Violet)
  'bg-blue-50/50': 'bg-cyan-500/10',
  'bg-blue-50': 'bg-cyan-500/20',
  'border-blue-100': 'border-cyan-500/30 text-cyan-100',
  'text-blue-900': 'text-cyan-300',
  'text-blue-600': 'text-cyan-400',
  'bg-blue-500': 'bg-cyan-500',
  'bg-blue-100': 'bg-cyan-500/30',
  
  'bg-orange-50/50': 'bg-violet-500/10',
  'bg-orange-50': 'bg-violet-500/20',
  'border-orange-100': 'border-violet-500/30 text-violet-100',
  'text-orange-900': 'text-violet-300',
  'text-orange-600': 'text-violet-400',
  'bg-orange-500': 'bg-violet-500',
  'bg-orange-100': 'bg-violet-500/30',
  
  'bg-emerald-50': 'bg-emerald-500/20',
  'border-emerald-100': 'border-emerald-500/30',
  
  'bg-rose-50': 'bg-rose-500/20',
  'border-rose-100': 'border-rose-500/30'
};

function processDirectory(dir) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.tsx') && !fullPath.includes('layout.tsx') && !fullPath.includes('Sidebar.tsx') && !fullPath.includes('Avatar.tsx') && !fullPath.includes('LayoutWrapper.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let originalContent = content;

      for (const [search, replace] of Object.entries(replacements)) {
        const regex = new RegExp(search, 'g');
        content = content.replace(regex, replace);
      }
      
      // Also catch explicit chart props replacing hex colors
      content = content.replace(/stroke="#f1f5f9"/g, 'stroke="#334155"');

      if (content !== originalContent) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated: ${fullPath}`);
      }
    }
  }
}

processDirectory(directoryPath);
console.log('Done replacing classes.');
