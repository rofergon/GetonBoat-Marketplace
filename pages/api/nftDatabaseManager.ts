import { createClient } from '@libsql/client';
import { OwnedNft, AcquiredAt } from 'alchemy-sdk';

const DEFAULT_IMAGE = '/placeholder.png';

export class NFTDatabaseManager {
  private client;

  constructor() {
    this.client = createClient({
      url: process.env.TURSO_DATABASE_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN!,
    });
    console.log('Cliente de base de datos inicializado');
  }

  async getLastUpdate(address: string) {
    const result = await this.client.execute({
      sql: 'SELECT last_update_block, last_update_time FROM LastUpdate WHERE owner_address = ?',
      args: [address]
    });
    return {
      lastUpdateBlock: result.rows[0]?.last_update_block as number || 0,
      lastUpdateTime: result.rows[0]?.last_update_time as number || 0
    };
  }

  async getNFTsFromDatabase(address: string) {
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

  async updateNFTsInDatabase(address: string, nfts: OwnedNft[], currentBlock: number) {
    for (const nft of nfts) {
      await this.client.execute({
        sql: `INSERT OR REPLACE INTO NFTs (
          owner_address, token_id, contract_address, name, image, description, 
          token_uri, attributes, acquired_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          address,
          nft.tokenId,
          nft.contract.address,
          nft.name || `NFT #${nft.tokenId}`,
          nft.image?.cachedUrl || nft.image?.originalUrl || DEFAULT_IMAGE,
          nft.description || '',
          this.getTokenUri(nft.tokenUri),
          JSON.stringify(nft.raw?.metadata?.attributes || []),
          this.getAcquiredAtTime(nft.acquiredAt),
          currentBlock
        ]
      });
    }
  }

  async updateLastUpdate(address: string, currentBlock: number) {
    await this.client.execute({
      sql: 'INSERT OR REPLACE INTO LastUpdate (owner_address, last_update_block, last_update_time) VALUES (?, ?, ?)',
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
        return []; // Devuelve un array vacío en lugar de lanzar un error
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
}