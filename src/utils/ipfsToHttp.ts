export function ipfsToHttp(ipfsUrl: string): string {
  if (ipfsUrl.startsWith('ipfs://')) {
    const cid = ipfsUrl.replace('ipfs://', '');
    return `/ipfs-image/${cid}`;
  }
  return ipfsUrl;
}

