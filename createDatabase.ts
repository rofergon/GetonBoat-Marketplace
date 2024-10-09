const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const { createClient } = require('@libsql/client');

// Configuración de dotenv
const envPath = path.resolve(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  console.error(`El archivo .env no existe en la ruta: ${envPath}`);
  process.exit(1);
}

const result = dotenv.config({ path: envPath });
if (result.error) {
  console.error('Error al cargar el archivo .env:', result.error);
  process.exit(1);
}

console.log('Contenido de .env:', result.parsed);
console.log('TURSO_DATABASE_URL:', process.env.TURSO_DATABASE_URL);
console.log('TURSO_AUTH_TOKEN:', process.env.TURSO_AUTH_TOKEN);

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function createTables() {
  try {
    // Crear la tabla LastUpdate
    await client.execute(`
      CREATE TABLE IF NOT EXISTS LastUpdate (
        owner_address TEXT PRIMARY KEY,
        last_update_block INTEGER NOT NULL,
        last_update_time INTEGER NOT NULL
      )
    `);
    console.log('Tabla LastUpdate creada o ya existente.');

    // Modificar la tabla NFTs
    await client.execute(`
      CREATE TABLE IF NOT EXISTS NFTs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        owner_address TEXT NOT NULL,
        token_id TEXT NOT NULL,
        contract_address TEXT NOT NULL,
        name TEXT,
        image TEXT,
        imageurl TEXT,
        description TEXT,
        token_uri TEXT,
        attributes TEXT,
        acquired_at INTEGER,
        updated_at INTEGER NOT NULL,
        is_listed BOOLEAN DEFAULT FALSE,
        listed_price TEXT,
        UNIQUE(owner_address, token_id, contract_address)
      )
    `);
    console.log('Tabla NFTs creada o modificada.');
  } catch (error) {
    console.error('Error al crear o modificar las tablas:', error);
  }
}

async function clearTables() {
  try {
    // Borrar todos los registros de la tabla LastUpdate
    await client.execute(`DELETE FROM LastUpdate`);
    console.log('Todos los registros de la tabla LastUpdate han sido eliminados.');

    // Borrar todos los registros de la tabla NFTs
    await client.execute(`DELETE FROM NFTs`);
    console.log('Todos los registros de la tabla NFTs han sido eliminados.');

    console.log('Todas las tablas han sido vaciadas exitosamente.');
  } catch (error) {
    console.error('Error al vaciar las tablas:', error);
  }
}

async function main() {
  try {
    await createTables();
    await clearTables();
  } catch (error) {
    console.error('Error en la ejecución principal:', error);
  } finally {
    await client.close();
    console.log('Conexión a la base de datos cerrada.');
  }
}

main();
