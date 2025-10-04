// Generate VAPID keys for web push notifications
const webpush = require('web-push');

console.log('\n🔑 Generating VAPID Keys...\n');

const vapidKeys = webpush.generateVAPIDKeys();

console.log('✅ VAPID Keys Generated Successfully!\n');
console.log('📋 Copy these to your .env file:\n');
console.log('NEXT_PUBLIC_VAPID_PUBLIC_KEY=' + vapidKeys.publicKey);
console.log('VAPID_PRIVATE_KEY=' + vapidKeys.privateKey);
console.log('VAPID_SUBJECT=mailto:mohammedarif2303@gmail.com');
console.log('\n⚠️  Important: Keep the private key secret!\n');
