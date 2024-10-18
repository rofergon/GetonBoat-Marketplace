import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

interface RoadmapItem {
  title: string;
  description: string;
  status: 'planned' | 'in-progress' | 'completed';
}

interface RoadmapSection {
  title: string;
  items: RoadmapItem[];
}

const roadmapData: RoadmapSection[] = [
  {
    title: "Zona Educativa",
    items: [
      { title: "Guía de introducción a NFTs", description: "Crear contenido educativo sobre los fundamentos de los NFTs", status: 'in-progress' },
      { title: "Tutoriales de minting", description: "Desarrollar tutoriales paso a paso sobre cómo crear y mintear NFTs", status: 'planned' },
      { title: "Webinars con artistas establecidos", description: "Organizar sesiones en vivo con artistas exitosos en el espacio NFT", status: 'planned' },
      { title: "Recursos de marketing digital", description: "Proporcionar guías sobre cómo promocionar NFTs en redes sociales", status: 'planned' },
      { title: "Programa de mentoría", description: "Lanzar un programa de mentoría para artistas emergentes", status: 'planned' },
    ]
  },
  {
    title: "NFTs",
    items: [
      { title: "Lanzamiento de colección inicial", description: "Lanzar nuestra primera colección de NFTs exclusivos", status: 'completed' },
      { title: "Integración con wallets populares", description: "Añadir soporte para MetaMask, WalletConnect, etc.", status: 'in-progress' },
      { title: "Implementar minting dinámico", description: "Permitir a los usuarios crear sus propios NFTs en la plataforma", status: 'planned' },
      { title: "Integracion Estandar ERC 1155", description: "Permite la creación de copias de NFTs y colecciones", status: 'planned' },
    ]
  },
  {
    title: "Subastas",
    items: [
      { title: "Sistema de subastas básico", description: "Implementar funcionalidad de subasta para NFTs", status: 'in-progress' },
      { title: "Subastas con tiempo limitado", description: "Añadir subastas con cuenta regresiva", status: 'planned' },
      { title: "Subastas silenciosas", description: "Implementar sistema de subastas silenciosas", status: 'planned' },
    ]
  },
  {
    title: "DAO",
    items: [
      { title: "Lanzamiento de token de gobernanza", description: "Crear y distribuir tokens para la gobernanza de la DAO", status: 'planned' },
      { title: "Sistema de propuestas", description: "Implementar sistema para que los miembros puedan hacer y votar propuestas", status: 'planned' },
      { title: "Integración con Snapshot", description: "Utilizar Snapshot para votaciones off-chain", status: 'planned' },
    ]
  }
];

const Roadmap: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8 bg-background">
      <h2 className="text-3xl font-bold mb-8 text-center">Roadmap</h2>
      <div className="grid grid-cols-1 gap-6">
        {roadmapData.map((section, index) => (
          <Card key={index} className="bg-muted">
            <CardHeader>
              <CardTitle>{section.title}</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {section.items.map((item, itemIndex) => (
                <div key={itemIndex} className="border-b border-background pb-2">
                  <span className={`text-xs font-medium px-2 py-1 mb-2 rounded-full ${
                    item.status === 'completed' ? 'bg-green-600 text-white' :
                    item.status === 'in-progress' ? 'bg-yellow-500 text-black' :
                    'bg-blue-500 text-white'
                  }`}>
                    {item.status === 'completed' ? 'Completado' :
                      item.status === 'in-progress' ? 'En progreso' :
                      'Planeado'}
                  </span>
                  <h4 className="mt-1 font-semibold">{item.title}</h4>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Roadmap;
