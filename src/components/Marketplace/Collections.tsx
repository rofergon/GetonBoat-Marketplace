import React, { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Search, Filter } from "lucide-react";

interface Collection {
  id: string;
  name: string;
  creator: string;
  imageUrl: string;
  itemCount: number;
  floorPrice: number;
}

export default function Collections() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    // Simular la carga de colecciones
    setTimeout(() => {
      setCollections([
        { id: "1", name: "Crypto Punks", creator: "LarvaLabs", imageUrl: "/placeholder.svg?height=200&width=200&text=CryptoPunks", itemCount: 10000, floorPrice: 5 },
        { id: "2", name: "Bored Ape Yacht Club", creator: "YugaLabs", imageUrl: "/placeholder.svg?height=200&width=200&text=BAYC", itemCount: 10000, floorPrice: 30 },
        { id: "3", name: "Azuki", creator: "Azuki", imageUrl: "/placeholder.svg?height=200&width=200&text=Azuki", itemCount: 10000, floorPrice: 10 },
        // Añade más colecciones aquí
      ]);
      setIsLoading(false);
    }, 1000);
  }, []);

  const filteredCollections = collections.filter(collection =>
    collection.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    collection.creator.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Colecciones</h1>
      
      <div className="flex items-center space-x-4 mb-6">
        <div className="relative flex-grow">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-10"
            placeholder="Buscar colecciones..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline">
          <Filter className="mr-2 h-4 w-4" />
          Filtrar
        </Button>
      </div>

      <Tabs defaultValue="todas">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="todas">Todas</TabsTrigger>
          <TabsTrigger value="trending">Trending</TabsTrigger>
          <TabsTrigger value="top">Top</TabsTrigger>
        </TabsList>
        
        <TabsContent value="todas">
          {isLoading ? (
            <p>Cargando colecciones...</p>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredCollections.map((collection) => (
                <Card key={collection.id}>
                  <CardHeader>
                    <img
                      alt={collection.name}
                      className="aspect-square object-cover rounded-lg"
                      height="200"
                      src={collection.imageUrl}
                      width="200"
                    />
                  </CardHeader>
                  <CardContent>
                    <CardTitle>{collection.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">por {collection.creator}</p>
                    <div className="mt-2 flex justify-between text-sm">
                      <span>Items: {collection.itemCount}</span>
                      <span>Precio mínimo: {collection.floorPrice} ETH</span>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" className="w-full">Ver Colección</Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="trending">
          <p>Contenido para colecciones en tendencia...</p>
        </TabsContent>
        
        <TabsContent value="top">
          <p>Contenido para las mejores colecciones...</p>
        </TabsContent>
      </Tabs>
    </div>
  );
}