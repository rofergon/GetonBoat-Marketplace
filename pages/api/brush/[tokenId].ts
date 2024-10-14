import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('API handler iniciado');
  const { tokenId } = req.query

  if (typeof tokenId !== 'string') {
    console.log('Token ID inválido:', tokenId);
    return res.status(400).json({ error: 'Token ID inválido' })
  }

  const brushUrl = `https://basepaint.xyz/api/brush/${tokenId}`
  console.log('URL del pincel:', brushUrl);

  try {
    console.log('Iniciando solicitud a BasePaint API');
    const response = await fetch(brushUrl)
    if (!response.ok) {
      console.log('Error en la respuesta de BasePaint:', response.status, response.statusText);
      throw new Error('Error al obtener datos del pincel')
    }
    const brushData = await response.json()
    console.log('Datos del pincel recibidos:', brushData);

    res.status(200).json(brushData)
  } catch (error) {
    console.error('Error al obtener datos del pincel:', error);
    res.status(500).json({ error: 'Error al obtener datos del pincel', details: error instanceof Error ? error.message : 'Error desconocido' })
  }
  console.log('API handler completado');
}
