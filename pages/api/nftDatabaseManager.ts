import { MarketItem } from '@/hooks/useFetchMarketItems';
import { createClient } from '@libsql/client';
import { OwnedNft } from 'alchemy-sdk';

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

    if (nftArray.length === 0) {
      console.log('No hay NFTs para actualizar');
      return;
    }

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

        if (!tokenId || !contractAddress) {
          console.warn(`NFT con datos incompletos será omitido:`, nft);
          continue;
        }

        console.log('Inserting/Updating NFT:', { address, tokenId, contractAddress, name, image, description, tokenUriValue, attributes });

        await this.client.execute({
          sql: `
            INSERT INTO NFTs (owner_address, token_id, contract_address, name, image, description, token_uri, attributes, acquired_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(owner_address, token_id, contract_address) DO UPDATE SET
              name = ?,
              image = ?,
              description = ?,
              token_uri = ?,
              attributes = ?,
              updated_at = ?
          `,
          args: [
            address, tokenId, contractAddress, name || '', image, description || '', tokenUriValue, attributes, Date.now(), currentBlock,
            name || '', image, description || '', tokenUriValue, attributes, currentBlock
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
      sql: 'INSERT OR REPLACE INTO LastUpdate (owner_address, last_update_block, last_update_time) VALUES (?, ?, ?);',
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

  // Método auxiliar para obtener la dirección del propietario
  private getOwnerAddress(nft: OwnedNft): string {
    // Asumimos que la dirección del propietario está en alguna parte del objeto nft
    // Puede que necesites ajustar esto según la estructura real de OwnedNft
    if (nft.contract && nft.contract.address) {
      return nft.contract.address;
    }
    // Si no puedes obtener la dirección del propietario del objeto nft,
    // considera pasar la dirección como un parámetro separado a este método
    return '';
  }

  async updateNFTListingStatus(nfts: MarketItem[]) {
    for (const nft of nfts) {
      await this.client.execute({
        sql: `
          UPDATE NFTs
          SET is_listed = ?, listed_price = ?
          WHERE contract_address = ? AND token_id = ?
        `,
        args: [true, nft.price.toString(), nft.nftContractAddress, nft.tokenId.toString()]
      });
    }
    console.log(`${nfts.length} NFTs actualizados con estado de listado.`);
  }

  async resetListingStatus() {
    await this.client.execute({
      sql: `
        UPDATE NFTs
        SET is_listed = FALSE, listed_price = NULL
      `,
      args: []
    });
    console.log('Estado de listado reiniciado para todos los NFTs.');
  }

} // Añade esta llave de cierre aquí
