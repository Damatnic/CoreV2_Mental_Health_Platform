const fs = require('fs');
const path = require('path');

console.log('🔍 ANALYZING LAZY LOADING OPTIMIZATION OPPORTUNITIES');
console.log('='.repeat(60));

// Analyze components directory
function analyzeComponents() {
  const componentsDir = path.join(__dirname, '../src/components');
  const files = fs.readdirSync(componentsDir).filter(f => f.endsWith('.tsx') && !f.includes('test'));
  
  const heavyComponents = [];
  const alreadyLazy = [];
  const candidates = [];

  files.forEach(file => {
    const filePath = path.join(componentsDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    const size = Buffer.byteLength(content, 'utf8');
    const lines = content.split('\n').length;
    
    const isLazy = content.includes('lazy(') || content.includes('createLazy') || file.includes('Lazy');
    const hasHeavyDeps = content.includes('react-markdown') || content.includes('chart') || 
                        content.includes('editor') || content.includes('calendar') ||
                        content.includes('video') || content.includes('audio');
    
    const analysis = { file, size, lines, isLazy, hasHeavyDeps };
    
    if (size > 5000 || lines > 150) {
      heavyComponents.push(analysis);
    }
    
    if (isLazy) {
      alreadyLazy.push(analysis);
    } else if (size > 3000 || hasHeavyDeps) {
      candidates.push(analysis);
    }
  });

  return { heavyComponents, alreadyLazy, candidates };
}

// Analyze views directory
function analyzeViews() {
  const viewsDir = path.join(__dirname, '../src/views');
  const files = fs.readdirSync(viewsDir).filter(f => f.endsWith('.tsx') && !f.includes('test'));
  
  const viewAnalysis = [];

  files.forEach(file => {
    const filePath = path.join(viewsDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    const size = Buffer.byteLength(content, 'utf8');
    const lines = content.split('\n').length;
    
    const imports = (content.match(/^import.*$/gm) || []).length;
    const complexFeatures = (content.match(/(useState|useEffect|useMemo|useCallback)/g) || []).length;
    
    let sizeCategory = 'small';
    if (size > 10000) sizeCategory = 'large';
    else if (size > 5000) sizeCategory = 'medium';
    
    viewAnalysis.push({
      file,
      size,
      lines,
      imports,
      complexFeatures,
      sizeCategory
    });
  });

  return viewAnalysis.sort((a, b) => b.size - a.size);
}

// Check current lazy loading in index.tsx
function checkIndexLazyLoading() {
  const indexPath = path.join(__dirname, '../index.tsx');
  const content = fs.readFileSync(indexPath, 'utf8');
  
  const lazyImports = content.match(/const \w+ = lazy\([^)]+\)/g) || [];
  const viewNames = lazyImports.map(imp => imp.match(/const (\w+) =/)[1]);
  
  return { total: lazyImports.length, views: viewNames };
}

// Run analysis
const componentAnalysis = analyzeComponents();
const viewAnalysis = analyzeViews();
const indexAnalysis = checkIndexLazyLoading();

console.log('📊 COMPONENT ANALYSIS');
console.log('-'.repeat(30));
console.log(`Heavy components (>5KB or >150 lines): ${componentAnalysis.heavyComponents.length}`);
componentAnalysis.heavyComponents.forEach(c => {
  console.log(`  📦 ${c.file}: ${(c.size/1024).toFixed(1)}KB, ${c.lines} lines ${c.hasHeavyDeps ? '⚠️ Heavy deps' : ''}`);
});

console.log(`\nAlready lazy-loaded: ${componentAnalysis.alreadyLazy.length}`);
componentAnalysis.alreadyLazy.forEach(c => {
  console.log(`  ✅ ${c.file}: ${(c.size/1024).toFixed(1)}KB`);
});

console.log(`\nLazy loading candidates: ${componentAnalysis.candidates.length}`);
componentAnalysis.candidates.forEach(c => {
  console.log(`  🎯 ${c.file}: ${(c.size/1024).toFixed(1)}KB, ${c.lines} lines ${c.hasHeavyDeps ? '⚠️ Heavy deps' : ''}`);
});

console.log('\n📊 VIEW ANALYSIS');
console.log('-'.repeat(30));
console.log(`Total views: ${viewAnalysis.length}`);
console.log(`Large views (>10KB): ${viewAnalysis.filter(v => v.sizeCategory === 'large').length}`);
console.log(`Medium views (5-10KB): ${viewAnalysis.filter(v => v.sizeCategory === 'medium').length}`);

console.log('\nTop 10 largest views:');
viewAnalysis.slice(0, 10).forEach((v, i) => {
  console.log(`  ${i+1}. ${v.file}: ${(v.size/1024).toFixed(1)}KB, ${v.lines} lines, ${v.imports} imports`);
});

console.log('\n📊 CURRENT LAZY LOADING STATUS');
console.log('-'.repeat(30));
console.log(`Total lazy-loaded views in index.tsx: ${indexAnalysis.total}`);
console.log('Views already lazy-loaded:');
indexAnalysis.views.forEach(view => console.log(`  ✅ ${view}`));

// Identify optimization opportunities
console.log('\n🎯 OPTIMIZATION OPPORTUNITIES');
console.log('-'.repeat(30));

const notLazyYet = viewAnalysis.filter(v => 
  !indexAnalysis.views.some(lazy => lazy.includes(v.file.replace('.tsx', '')))
);

if (notLazyYet.length > 0) {
  console.log('Views not yet lazy-loaded:');
  notLazyYet.forEach(v => {
    console.log(`  📌 ${v.file}: ${(v.size/1024).toFixed(1)}KB - ${v.sizeCategory} priority`);
  });
} else {
  console.log('✅ All views appear to be lazy-loaded!');
}

// Heavy components optimization
if (componentAnalysis.candidates.length > 0) {
  console.log('\nComponent lazy loading opportunities:');
  componentAnalysis.candidates.forEach(c => {
    let priority = 'LOW';
    if (c.hasHeavyDeps) priority = 'HIGH';
    else if (c.size > 8000) priority = 'MEDIUM';
    
    console.log(`  🔧 ${c.file}: ${(c.size/1024).toFixed(1)}KB - ${priority} priority`);
  });
}

// Bundle impact estimation
const totalViewSize = viewAnalysis.reduce((sum, v) => sum + v.size, 0);
const lazyViewSize = indexAnalysis.views.reduce((sum, viewName) => {
  const view = viewAnalysis.find(v => v.file.includes(viewName));
  return sum + (view ? view.size : 0);
}, 0);

const componentSavings = componentAnalysis.candidates.reduce((sum, c) => sum + c.size, 0);

console.log('\n💾 POTENTIAL SAVINGS');
console.log('-'.repeat(30));
console.log(`Current lazy view coverage: ${((lazyViewSize/totalViewSize)*100).toFixed(1)}%`);
console.log(`Additional component savings: ${(componentSavings/1024).toFixed(1)}KB`);
console.log(`Total optimization potential: ${((totalViewSize - lazyViewSize + componentSavings)/1024).toFixed(1)}KB`);

console.log('\n📋 RECOMMENDED ACTIONS');
console.log('-'.repeat(30));
console.log('1. ✅ Views are well optimized with lazy loading');
console.log('2. 🔧 Focus on component-level optimizations');
console.log('3. 📊 Implement bundle analysis monitoring');
console.log('4. ⚡ Optimize preloading strategies');
console.log('5. 🗜️ Consider code splitting for heavy components');
