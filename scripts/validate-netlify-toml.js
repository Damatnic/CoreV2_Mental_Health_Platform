const fs = require('fs');
const path = require('path');
const toml = require('toml');

const validateNetlifyConfig = () => {
  const configPath = path.join(process.cwd(), 'netlify.toml');
  
  try {
    // Read the file
    const configContent = fs.readFileSync(configPath, 'utf-8');
    
    // Parse TOML
    const config = toml.parse(configContent);
    
    console.log('✅ netlify.toml syntax is valid!');
    
    // Validate critical sections
    const issues = [];
    
    // Check build configuration
    if (!config.build) {
      issues.push('❌ Missing [build] section');
    } else {
      if (!config.build.command) issues.push('❌ Missing build.command');
      if (!config.build.publish) issues.push('❌ Missing build.publish');
      if (!config.build.functions) issues.push('❌ Missing build.functions');
      
      console.log(`✅ Build command: ${config.build.command}`);
      console.log(`✅ Publish directory: ${config.build.publish}`);
      console.log(`✅ Functions directory: ${config.build.functions}`);
    }
    
    // Check for environment variables
    if (config.build?.environment) {
      const env = config.build.environment;
      if (env.NODE_VERSION) console.log(`✅ Node version: ${env.NODE_VERSION}`);
      if (env.VITE_CRISIS_HOTLINE) console.log(`✅ Crisis hotline configured: ${env.VITE_CRISIS_HOTLINE}`);
    }
    
    // Check plugins
    if (config.plugins) {
      console.log(`✅ ${config.plugins.length} plugin(s) configured:`);
      config.plugins.forEach(plugin => {
        console.log(`   - ${plugin.package}`);
      });
    }
    
    // Check redirects
    if (config.redirects) {
      console.log(`✅ ${config.redirects.length} redirect rule(s) configured`);
    }
    
    // Check headers
    if (config.headers) {
      console.log(`✅ ${config.headers.length} header rule(s) configured`);
    }
    
    // Report issues
    if (issues.length > 0) {
      console.log('\n⚠️  Issues found:');
      issues.forEach(issue => console.log(issue));
      process.exit(1);
    } else {
      console.log('\n✅ All critical configurations are present!');
    }
    
  } catch (error) {
    console.error('❌ Failed to parse netlify.toml:', error.message);
    if (error.line && error.column) {
      console.error(`   Line ${error.line}, Column ${error.column}`);
    }
    process.exit(1);
  }
};

validateNetlifyConfig();