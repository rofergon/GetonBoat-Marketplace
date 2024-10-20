import type { NextApiRequest, NextApiResponse } from 'next'
import axios from 'axios'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { cid } = req.query

  if (!cid || typeof cid !== 'string') {
    return res.status(400).json({ error: 'CID inválido' })
  }

  try {
    const response = await axios.get(`https://ipfs.io/ipfs/${cid}`, {
      responseType: 'arraybuffer'
    })

    res.setHeader('Content-Type', response.headers['content-type'])
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
    res.send(response.data)
  } catch (error) {
    console.error('Error al obtener la imagen de IPFS:', error)
    res.status(500).json({ error: 'Error al obtener la imagen' })
  }
}