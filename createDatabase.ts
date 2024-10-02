const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Definimos la ruta correcta del archivo .env
const envPath = path.resolve(__dirname, '.env');
console.log('Ruta del archivo .env:', envPath);

// Verificamos si el archivo .env existe
if (!fs.existsSync(envPath)) {
  console.error(`El archivo .env no existe en la ruta: ${envPath}`);
  process.exit(1);
}

// Carga las variables de entorno
const result = dotenv.config({ path: envPath });

if (result.error) {
  console.error('Error al cargar el archivo .env:', result.error);
  process.exit(1);
}

console.log('Contenido de .env:', result.parsed);
console.log('TURSO_DATABASE_URL:', process.env.TURSO_DATABASE_URL);
console.log('TURSO_AUTH_TOKEN:', process.env.TURSO_AUTH_TOKEN);

const { createClient } = require('@libsql/client');

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function createTables() {
  try {
    // Eliminar la tabla anterior LastUpdate si existe
    await client.execute(`
      DROP TABLE IF EXISTS LastUpdate
    `);
    console.log('Tabla LastUpdate anterior eliminada.');

    // Crear la nueva tabla LastUpdate con last_update_block
    await client.execute(`
      CREATE TABLE IF NOT EXISTS LastUpdate (
        owner_address TEXT PRIMARY KEY,
        last_update_block INTEGER NOT NULL
      )
    `);
    console.log('Nueva tabla LastUpdate creada con last_update_block.');

    // Crear la tabla NFTs si no existe
    await client.execute(`
      CREATE TABLE IF NOT EXISTS NFTs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        owner_address TEXT NOT NULL,
        token_id TEXT NOT NULL,
        contract_address TEXT NOT NULL,
        name TEXT,
        image TEXT,
        description TEXT,
        token_uri TEXT,
        attributes TEXT,
        acquired_at INTEGER,
        updated_at INTEGER NOT NULL,
        UNIQUE(owner_address, token_id, contract_address)
      )
    `);
    console.log('Tabla NFTs creada exitosamente.');
  } catch (error) {
    console.error('Error al crear las tablas:', error);
  } finally {
    await client.close();
    console.log('Conexión a la base de datos cerrada.');
  }
}

createTables();