// ✅ Load .env file
import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env') });

import { encryptWhatsApp } from '../src/lib/whatsapp-crypto';

// ⚠️ EJECUTAR SOLO UNA VEZ PARA GENERAR EL NÚMERO ENCRIPTADO
// Tu número de WhatsApp de ventas (Colombia)

const sellerPhone = '+573113114357';

try {
    const encrypted = encryptWhatsApp(sellerPhone);

    console.log('\n✅ Número de WhatsApp encriptado exitosamente!');
    console.log('\n📋 Copia este valor COMPLETO a tu .env:');
    console.log('\nWHATSAPP_SELLER_ENCRYPTED=' + encrypted);
    console.log('\n⚠️ IMPORTANTE: No commitees este valor a Git!');
    console.log('   Ya está protegido en .env (ignorado por Git)\n');
} catch (error) {
    console.error('\n❌ Error:', (error as Error).message);
    console.error('\n💡 Verifica que WHATSAPP_ENCRYPTION_KEY esté en .env');
    process.exit(1);
}
