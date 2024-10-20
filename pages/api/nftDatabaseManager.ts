import { createClient, Row, ResultSet } from '@libsql/client';
import { OwnedNft, Nft } from 'alchemy-sdk';

// Definimos MarketItem aquí para evitar problemas de importación
interface MarketItem {
  marketItemId: bigint;
  nftContractAddress: `0x${string}`;
  tokenId: bigint;
  seller: `0x${string}`;
  buyer: `0x${string}`;
  price: bigint;
  sold: boolean;
  canceled: boolean;
  expirationTime: bigint;
}

interface RawMetadata {
  metadata?: {
    attributes?: unknown[];
  };
}

const DEFAULT_IMAGE = '/placeholder.png';

interface ExistingNFT {
  contractAddress: string;
  tokenId: string;
  name: string;
  image: string;
  description: string;
  tokenURI: string;
  attributes: any[];
  acquiredAt: string;
}

type AcquiredAt = string | Date | { blockTimestamp: string | number | Date } | { timestamp: string | number | Date };

export class NFTDatabaseManager {
  private client;

  constructor() {
    const url = process.env.TURSO_DATABASE_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;

    if (!url || !authToken) {
      console.error('Las variables de entorno TURSO_DATABASE_URL o TURSO_AUTH_TOKEN no están definidas');
      throw new Error('Configuración de base de datos incompleta');
    }

    this.client = createClient({
      url: url,
      authToken: authToken,
    });
    // Se eliminó el log "Cliente de base de datos inicializado"
  }

  async getLastUpdate(address: string): Promise<{ lastUpdateBlock: number } | null> {
    try {
      const result: ResultSet = await this.client.execute({
        sql: 'SELECT last_update_block FROM user_updates WHERE owner_address = ?',
        args: [address],
      });

      if (result.rows.length > 0) {
        const lastUpdateBlock = (result.rows[0] as Row).last_update_block;
        if (typeof lastUpdateBlock === 'number') {
          return { lastUpdateBlock };
        }
      }
      return null;
    } catch (error) {
      console.error('Error al obtener la última actualización:', error);
      throw error;
    }
  }

  async getNFTsFromDatabase(address: string): Promise<ExistingNFT[]> {
    const nftsResult = await this.client.execute({
      sql: 'SELECT * FROM NFTs WHERE owner_address = ?',
      args: [address]
    });

    return nftsResult.rows.map((row: any) => ({
      contractAddress: row.contract_address,
      name: row.name,
      tokenId: row.token_id,
      image: row.image || DEFAULT_IMAGE,
      description: row.description || '',
      tokenURI: row.token_uri || '',
      attributes: JSON.parse(row.attributes || '[]'),
      acquiredAt: new Date(row.acquired_at).toString(),
    }));
  }

  async updateNFTsInDatabase(address: string, nfts: OwnedNft | OwnedNft[], currentBlock: number) {
    const nftArray = Array.isArray(nfts) ? nfts : [nfts];

    

    try {
      for (const nft of nftArray) {
        const {
          tokenId,
          contract,
          name,
          description,
        } = nft;

        const contractAddress = contract.address;
        const image = nft.image?.cachedUrl || nft.image?.originalUrl || '';
        const imageurl = nft.image?.originalUrl || nft.image?.cachedUrl || '';
        
        // Manejo seguro de tokenUri
        let tokenUriValue = '';
        if (typeof nft.tokenUri === 'string') {
          tokenUriValue = nft.tokenUri;
        } else if (nft.tokenUri && typeof nft.tokenUri === 'object' && 'raw' in nft.tokenUri) {
          tokenUriValue = (nft.tokenUri as { raw: string }).raw;
        }

        // Manejo seguro de attributes
        let attributes = '[]';
        const rawData = (nft as unknown as { raw?: RawMetadata }).raw;
        if (rawData && rawData.metadata && Array.isArray(rawData.metadata.attributes)) {
          attributes = JSON.stringify(rawData.metadata.attributes);
        }

        

        await this.client.execute({
          sql: `
            INSERT INTO NFTs (owner_address, token_id, contract_address, name, image, imageurl, description, token_uri, attributes, acquired_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(owner_address, token_id, contract_address) DO UPDATE SET
              name = ?,
              image = ?,
              imageurl = ?,
              description = ?,
              token_uri = ?,
              attributes = ?,
              updated_at = ?
          `,
          args: [
            address, tokenId, contractAddress, name || '', image, imageurl, description || '', tokenUriValue, attributes, Date.now(), currentBlock,
            name || '', image, imageurl, description || '', tokenUriValue, attributes, currentBlock
          ]
        });
      }

      console.log(`${nftArray.length} NFTs actualizados en la base de datos.`);
    } catch (error) {
      console.error('Error durante la actualización de NFTs:', error);
      if (error instanceof Error) {
        console.error('Detalles del error:', error.message);
        console.error('Stack trace:', error.stack);
      }
      throw error;
    }
  }

  private hasNFTChanged(existingNFT: ExistingNFT, newNFT: OwnedNft): boolean {
    return (
      existingNFT.name !== (newNFT.name || `NFT #${newNFT.tokenId}`) ||
      existingNFT.image !== (newNFT.image?.cachedUrl || newNFT.image?.originalUrl || DEFAULT_IMAGE) ||
      existingNFT.description !== (newNFT.description || '') ||
      existingNFT.tokenURI !== this.getTokenUri(newNFT.tokenUri) ||
      JSON.stringify(existingNFT.attributes) !== JSON.stringify(newNFT.raw?.metadata?.attributes || [])
    );
  }

  async updateLastUpdate(address: string, currentBlock: number) {
    await this.client.execute({
      sql: 'INSERT OR REPLACE INTO user_updates (owner_address, last_update_block, last_update_time) VALUES (?, ?, ?);',
      args: [address, currentBlock, Date.now()]
    });
  }

  async close() {
    await this.client.close();
  }

  async getUniqueCollections(ownerAddress: string) {
    try {
      if (!this.client) {
        throw new Error('Cliente de base de datos no inicializado');
      }
      console.log('Obteniendo colecciones únicas para:', ownerAddress);
      const result = await this.client.execute({
        sql: 'SELECT DISTINCT contract_address, name FROM NFTs WHERE owner_address = ?',
        args: [ownerAddress]
      });
      console.log('Resultado de la consulta:', result);
      
      if (!result || !result.rows || result.rows.length === 0) {
        console.log('No se encontraron colecciones para la dirección:', ownerAddress);
        return []; 
      }
      
      return result.rows;
    } catch (error) {
      console.error('Error en getUniqueCollections:', error);
      console.error('Detalles del error:', JSON.stringify(error, null, 2));
      throw error;
    }
  }

  async getNFTsByContractAddress(contractAddress: string) {
    const result = await this.client.execute({
      sql: 'SELECT * FROM NFTs WHERE contract_address = ?',
      args: [contractAddress]
    });
    return result.rows;
  }

  private getAcquiredAtTime(acquiredAt: AcquiredAt | undefined): number {
    if (!acquiredAt) return 0;
    
    if (typeof acquiredAt === 'string') {
      return new Date(acquiredAt).getTime();
    }
    
    if (acquiredAt instanceof Date) {
      return acquiredAt.getTime();
    }
    
    if (typeof acquiredAt === 'object') {
      if ('blockTimestamp' in acquiredAt && acquiredAt.blockTimestamp) {
        return new Date(acquiredAt.blockTimestamp).getTime();
      }
      if ('timestamp' in acquiredAt && acquiredAt.timestamp) {
        if (typeof acquiredAt.timestamp === 'string' || typeof acquiredAt.timestamp === 'number') {
          return new Date(acquiredAt.timestamp).getTime();
        }
        if (acquiredAt.timestamp instanceof Date) {
          return acquiredAt.timestamp.getTime();
        }
      }
    }
    
    return 0;
  }

  private getTokenUri(tokenUri: string | { raw: string } | null | undefined): string {
    if (typeof tokenUri === 'string') {
      return tokenUri;
    } else if (tokenUri && typeof tokenUri === 'object' && 'raw' in tokenUri) {
      return tokenUri.raw;
    }
    return '';
  }

  
  private getOwnerAddress(nft: OwnedNft): string {
    
    if (nft.contract && nft.contract.address) {
      return nft.contract.address;
    }
   
    return '';
  }

  async updateNFTListingStatus(nfts: MarketItem[]) {
    console.log('Iniciando updateNFTListingStatus con', nfts.length, 'NFTs');
    for (const nft of nfts) {
      try {
        await this.client.execute({
          sql: `
            UPDATE NFTs
            SET is_listed = ?, listed_price = ?
            WHERE contract_address = ? AND token_id = ?
          `,
          args: [true, nft.price.toString(), nft.nftContractAddress, nft.tokenId.toString()]
        });
      } catch (error) {
        console.error('Error al actualizar NFT:', nft, error);
      }
    }
    console.log(`${nfts.length} NFTs actualizados con estado de listado.`);
  }

  async resetListingStatus() {
    console.log('Iniciando resetListingStatus');
    try {
      const result = await this.client.execute({
        sql: `
          UPDATE NFTs
          SET is_listed = FALSE, listed_price = NULL
        `,
        args: []
      });
      console.log('Resultado del reset de listado:', result);
    } catch (error) {
      console.error('Error al resetear el estado de listado:', error);
    }
    console.log('Estado de listado reiniciado para todos los NFTs.');
  }

  async getNFTMetadata(contractAddress: string, tokenId: string) {
    const result = await this.client.execute({
      sql: 'SELECT name, imageurl, description, attributes FROM NFTs WHERE contract_address = ? AND token_id = ?',
      args: [contractAddress, tokenId]
    });

    if (result.rows.length > 0) {
      const nft = result.rows[0];
      return {
        name: nft.name,
        imageurl: nft.imageurl,
        description: nft.description,
        attributes: JSON.parse(String(nft.attributes ?? '[]'))
      };
    }

    return null;
  }

  async updateNFTInDatabase(nft: Nft, ownerAddress: string): Promise<void> {
    const {
      contract,
      tokenId,
      name,
      description,
      image,
      tokenUri,
    } = nft;

    const contractAddress = contract.address;
    const imageUrl = image?.originalUrl || image?.cachedUrl || '';
    const tokenUriValue = typeof tokenUri === 'string' ? tokenUri : (tokenUri as any)?.raw || '';
    
    // Manejo seguro de attributes
    let attributes = '[]';
    if ('raw' in nft && typeof (nft as any).raw === 'object' && (nft as any).raw !== null) {
      const rawData = nft.raw as { metadata?: { attributes?: unknown[] } };
      if (rawData.metadata && Array.isArray(rawData.metadata.attributes)) {
        attributes = JSON.stringify(rawData.metadata.attributes);
      }
    }

    try {
      await this.client.execute({
        sql: `
          INSERT INTO NFTs (
            owner_address, token_id, contract_address, name, image, imageurl, 
            description, token_uri, attributes, acquired_at, updated_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(owner_address, token_id, contract_address) DO UPDATE SET
            name = ?,
            image = ?,
            imageurl = ?,
            description = ?,
            token_uri = ?,
            attributes = ?,
            updated_at = ?
        `,
        args: [
          ownerAddress, tokenId, contractAddress, name || '', imageUrl, imageUrl,
          description || '', tokenUriValue, attributes, Date.now(), Date.now(),
          name || '', imageUrl, imageUrl, description || '', tokenUriValue, attributes, Date.now()
        ]
      });

      console.log(`NFT actualizado en la base de datos: ${contractAddress} - ${tokenId}`);
    } catch (error) {
      console.error('Error al actualizar NFT en la base de datos:', error);
      throw error;
    }
  }

  async removeNFTFromDatabase(address: string, contractAddress: string, tokenId: string): Promise<void> {
    try {
      await this.client.execute({
        sql: `
          DELETE FROM NFTs
          WHERE owner_address = ? AND contract_address = ? AND token_id = ?
        `,
        args: [address, contractAddress, tokenId]
      });

      console.log(`NFT eliminado de la base de datos: ${contractAddress} - ${tokenId}`);
    } catch (error) {
      console.error('Error al eliminar NFT de la base de datos:', error);
      throw error;
    }
  }

  async getWalletData(address: string): Promise<boolean> {
    try {
      const result: ResultSet = await this.client.execute({
        sql: 'SELECT COUNT(*) as count FROM NFTs WHERE owner_address = ?',
        args: [address],
      });

      if (result.rows.length > 0) {
        const count = (result.rows[0] as Row).count;
        return typeof count === 'number' && count > 0;
      }
      return false;
    } catch (error) {
      console.error('Error al obtener datos de la wallet:', error);
      throw error;
    }
  }

  async getNFTsWithEmptyTokenURI(): Promise<{ contractAddress: string; tokenId: string }[]> {
    try {
      const result = await this.client.execute({
        sql: 'SELECT contract_address, token_id FROM NFTs WHERE token_uri = "" OR token_uri IS NULL',
        args: []
      });

      return result.rows.map((row: any) => ({
        contractAddress: row.contract_address,
        tokenId: row.token_id
      }));
    } catch (error) {
      console.error('Error al obtener NFTs con tokenURI vacío:', error);
      throw error;
    }
  }

  async updateNFTTokenURI(contractAddress: string, tokenId: string, tokenURI: string): Promise<void> {
    try {
      await this.client.execute({
        sql: 'UPDATE NFTs SET token_uri = ? WHERE contract_address = ? AND token_id = ?',
        args: [tokenURI, contractAddress, tokenId]
      });
      console.log(`TokenURI actualizado para NFT: ${contractAddress} - ${tokenId}`);
    } catch (error) {
      console.error('Error al actualizar tokenURI del NFT:', error);
      throw error;
    }
  }

  async getNFTsWithEmptyName(): Promise<{ contractAddress: string; tokenId: string }[]> {
    try {
      const result = await this.client.execute({
        sql: 'SELECT contract_address, token_id FROM NFTs WHERE name = "" OR name IS NULL',
        args: []
      });

      return result.rows.map((row: any) => ({
        contractAddress: row.contract_address,
        tokenId: row.token_id
      }));
    } catch (error) {
      console.error('Error al obtener NFTs con nombre vacío:', error);
      throw error;
    }
  }

  async updateNFTNameAndTokenURI(contractAddress: string, tokenId: string, name: string, tokenURI: string): Promise<void> {
    try {
      await this.client.execute({
        sql: 'UPDATE NFTs SET name = ?, token_uri = ? WHERE contract_address = ? AND token_id = ?',
        args: [name, tokenURI, contractAddress, tokenId]
      });
      console.log(`Nombre y TokenURI actualizados para NFT: ${contractAddress} - ${tokenId}`);
    } catch (error) {
      console.error('Error al actualizar nombre y tokenURI del NFT:', error);
      throw error;
    }
  }

  async getNFTsWithEmptyNameOrImage(): Promise<{ contractAddress: string; tokenId: string }[]> {
    try {
      const result = await this.client.execute({
        sql: 'SELECT contract_address, token_id FROM NFTs WHERE name = "" OR name IS NULL OR image = "" OR image IS NULL',
        args: []
      });

      return result.rows.map((row: any) => ({
        contractAddress: row.contract_address,
        tokenId: row.token_id
      }));
    } catch (error) {
      console.error('Error al obtener NFTs con nombre o imagen vacía:', error);
      throw error;
    }
  }

  async updateNFTNameImageAndTokenURI(contractAddress: string, tokenId: string, name: string, image: string, tokenURI: string): Promise<void> {
    try {
      const result = await this.client.execute({
        sql: 'UPDATE NFTs SET name = ?, image = ?, token_uri = ? WHERE contract_address = ? AND token_id = ?',
        args: [name, image, tokenURI, contractAddress, tokenId]
      });
      console.log(`Nombre, imagen y TokenURI actualizados para NFT: ${contractAddress} - ${tokenId}`, result);
      if (result.rowsAffected === 0) {
        console.warn(`No se actualizó ningún registro para NFT: ${contractAddress} - ${tokenId}`);
      }
    } catch (error) {
      console.error('Error al actualizar nombre, imagen y tokenURI del NFT:', error);
      throw error;
    }
  }

  async getNFTsWithEmptyNameOrDescription(): Promise<{ contractAddress: string; tokenId: string }[]> {
    try {
      const result = await this.client.execute({
        sql: 'SELECT contract_address, token_id FROM NFTs WHERE name = "" OR name IS NULL OR description = "" OR description IS NULL',
        args: []
      });

      return result.rows.map((row: any) => ({
        contractAddress: row.contract_address,
        tokenId: row.token_id
      }));
    } catch (error) {
      console.error('Error al obtener NFTs con nombre o descripción vacíos:', error);
      throw error;
    }
  }

  async updateNFTMetadata(contractAddress: string, tokenId: string, name: string, image: string, imageurl: string, description: string, tokenURI: string): Promise<void> {
    try {
      console.log(`Intentando actualizar metadata para NFT: ${contractAddress} - ${tokenId}`);
      console.log(`Nuevos datos: name=${name}, image=${image}, imageurl=${imageurl}, description=${description}, tokenURI=${tokenURI}`);

      const result = await this.client.execute({
        sql: 'UPDATE NFTs SET name = ?, image = ?, imageurl = ?, description = ?, token_uri = ? WHERE contract_address = ? AND token_id = ?',
        args: [name, image, imageurl, description, tokenURI, contractAddress, tokenId]
      });

      console.log(`Resultado de la actualización:`, result);

      if (result.rowsAffected === 0) {
        console.warn(`No se actualizó ningún registro para NFT: ${contractAddress} - ${tokenId}. Verificando si el NFT existe.`);
        
        const checkResult = await this.client.execute({
          sql: 'SELECT * FROM NFTs WHERE contract_address = ? AND token_id = ?',
          args: [contractAddress, tokenId]
        });

        if (checkResult.rows.length === 0) {
          console.error(`El NFT ${contractAddress} - ${tokenId} no existe en la base de datos. Insertando nuevo registro.`);
          await this.insertNewNFT(contractAddress, tokenId, name, image, imageurl, description, tokenURI);
        } else {
          console.error(`El NFT existe pero no se actualizó. Datos actuales:`, checkResult.rows[0]);
        }
      } else {
        console.log(`Metadata actualizado con éxito para NFT: ${contractAddress} - ${tokenId}`);
      }
    } catch (error) {
      console.error('Error al actualizar metadata del NFT:', error);
      throw error;
    }
  }

  async insertNewNFT(contractAddress: string, tokenId: string, name: string, image: string, imageurl: string, description: string, tokenURI: string): Promise<void> {
    try {
      const result = await this.client.execute({
        sql: 'INSERT INTO NFTs (contract_address, token_id, name, image, imageurl, description, token_uri) VALUES (?, ?, ?, ?, ?, ?, ?)',
        args: [contractAddress, tokenId, name, image, imageurl, description, tokenURI]
      });
      console.log(`Nuevo NFT insertado: ${contractAddress} - ${tokenId}`, result);
    } catch (error) {
      console.error('Error al insertar nuevo NFT:', error);
      throw error;
    }
  }

} // Añade esta llave de cierre aquí

