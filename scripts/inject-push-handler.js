// Script to inject push notification handlers into generated service worker
const fs = require('fs');
const path = require('path');

const swPath = path.join(__dirname, '../public/sw.js');
const marker = '// PUSH_HANDLER_INJECTED';

try {
  // Read the generated service worker
  let swContent = fs.readFileSync(swPath, 'utf8');
  
  // Check if push handler is already injected
  if (swContent.includes(marker)) {
    console.log('✅ Push handler already injected in sw.js');
    process.exit(0);
  }
  
  // Inject importScripts at the very beginning
  const injectionCode = `${marker}\ntry{importScripts('/sw-push-handler.js');console.log('[SW] Push handler loaded')}catch(e){console.error('[SW] Push handler error:',e)}\n`;
  
  // Prepend to the file
  swContent = injectionCode + swContent;
  
  // Write back
  fs.writeFileSync(swPath, swContent);
  
  console.log('✅ Successfully injected push handler into sw.js');
  console.log('   Location: public/sw.js');
  console.log('   Handler: sw-push-handler.js');
  
} catch (error) {
  console.error('❌ Error injecting push handler:', error.message);
  process.exit(1);
}
