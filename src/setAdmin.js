// Carga las variables de entorno desde el archivo .env
require('dotenv').config();

const admin = require('firebase-admin');

// Construye el objeto de credenciales
let serviceAccount;

if (process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON) {
  try {
    serviceAccount = JSON.parse(
      process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON
    );
  } catch (e) {
    console.error('Error parseando FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON', e);
    process.exit(1);
  }
} else {
  serviceAccount = {
    projectId:
      process.env.FIREBASE_PROJECT_ID ||
      process.env.FIREBASE_ADMIN_PROJECT_ID ||
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    clientEmail:
      process.env.FIREBASE_CLIENT_EMAIL ||
      process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    privateKey: (
      process.env.FIREBASE_PRIVATE_KEY ||
      process.env.FIREBASE_ADMIN_PRIVATE_KEY ||
      ''
    ).replace(/\\n/g, '\n'),
  };
}

// Verifica que todas las variables necesarias estén presentes
if (
  !serviceAccount.projectId ||
  !serviceAccount.clientEmail ||
  !serviceAccount.privateKey
) {
  console.error(
    '\x1b[31m%s\x1b[0m',
    'Error: Faltan variables de entorno. Se intentó buscar FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON o (FIREBASE_ADMIN_PROJECT_ID + Email + Key).'
  );
  console.log(
    'Asegúrate de que FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, y FIREBASE_PRIVATE_KEY estén en tu archivo .env'
  );
  process.exit(1);
}

try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  // Probar obtener UID de argumentos (prioridad 1) o variable de entorno (prioridad 2)
  const uid = process.argv[2] || process.env.NEXT_PUBLIC_ADMIN_UID;

  if (!uid) {
    throw new Error(
      'Debes proporcionar un UID. Ejemplo: node src/setAdmin.js <TU_UID_AQUI>'
    );
  }

  admin
    .auth()
    .setCustomUserClaims(uid, { admin: true })
    .then(() => {
      console.log(
        `\x1b[32m%s\x1b[0m`,
        `¡Éxito! Custom claim { admin: true } fue asignado al usuario con UID: ${uid}`
      );
      console.log(
        'Ya puedes acceder al panel de administración. Puede que necesites iniciar sesión de nuevo.'
      );
      process.exit(0);
    })
    .catch((error) => {
      console.error(
        '\x1b[31m%s\x1b[0m',
        'Error asignando el custom claim:',
        error.message
      );
      process.exit(1);
    });
} catch (error) {
  console.error(
    '\x1b[31m%s\x1b[0m',
    'Ocurrió un error inesperado al inicializar Firebase Admin:',
    error.message
  );
  process.exit(1);
}
