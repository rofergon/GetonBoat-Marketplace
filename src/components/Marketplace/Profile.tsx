import React from "react";
import Link from "next/link";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Copy, ExternalLink, MessageCircle, Share2 } from "lucide-react";

export default function Profile() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader className="relative">
              <img
                alt="Banner de perfil"
                className="absolute inset-0 w-full h-32 object-cover rounded-t-lg"
                height="128"
                src="/placeholder.svg?height=128&width=384&text=Banner"
                style={{
                  aspectRatio: "384/128",
                  objectFit: "cover",
                }}
                width="384"
              />
              <img
                alt="Avatar del usuario"
                className="relative w-24 h-24 rounded-full border-4 border-background mt-16"
                height="96"
                src="/placeholder.svg?height=96&width=96&text=Avatar"
                style={{
                  aspectRatio: "96/96",
                  objectFit: "cover",
                }}
                width="96"
              />
            </CardHeader>
            <CardContent className="pt-4">
              <h2 className="text-2xl font-bold">CryptoArtista</h2>
              <p className="text-sm text-muted-foreground">@cryptoartista</p>
              <div className="flex items-center mt-2 space-x-2">
                <Button size="sm" variant="outline">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Mensaje
                </Button>
                <Button size="icon" variant="outline">
                  <Share2 className="w-4 h-4" />
                  <span className="sr-only">Compartir perfil</span>
                </Button>
              </div>
              <div className="mt-4">
                <h3 className="font-semibold">Bio</h3>
                <p className="text-sm mt-1">
                  Artista digital especializado en arte generativo y NFTs. Explorando los límites entre la tecnología y la creatividad.
                </p>
              </div>
              <div className="mt-4 flex items-center space-x-4 text-sm">
                <div>
                  <span className="font-bold">10k</span> Seguidores
                </div>
                <div>
                  <span className="font-bold">5k</span> Siguiendo
                </div>
              </div>
              <div className="mt-4">
                <h3 className="font-semibold">Dirección de la billetera</h3>
                <div className="flex items-center mt-1">
                  <code className="text-xs bg-muted p-1 rounded">0x1234...5678</code>
                  <Button size="icon" variant="ghost" className="ml-2">
                    <Copy className="w-4 h-4" />
                    <span className="sr-only">Copiar dirección de la billetera</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-2">
          <Tabs defaultValue="creados">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="creados">Creados</TabsTrigger>
              <TabsTrigger value="coleccionados">Coleccionados</TabsTrigger>
              <TabsTrigger value="actividad">Actividad</TabsTrigger>
            </TabsList>
            <TabsContent value="creados" className="mt-6">
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i}>
                    <CardHeader className="p-0">
                      <img
                        alt={`NFT creado #${i + 1}`}
                        className="w-full h-48 object-cover rounded-t-lg"
                        height="192"
                        src={`/placeholder.svg?height=192&width=256&text=NFT+${i + 1}`}
                        style={{
                          aspectRatio: "256/192",
                          objectFit: "cover",
                        }}
                        width="256"
                      />
                    </CardHeader>
                    <CardContent className="p-4">
                      <CardTitle className="text-lg">NFT Creado #{i + 1}</CardTitle>
                      <p className="text-sm text-muted-foreground">Precio: 0.5 ETH</p>
                      <Button className="w-full mt-2" size="sm">
                        Ver detalles
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
            <TabsContent value="coleccionados" className="mt-6">
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i}>
                    <CardHeader className="p-0">
                      <img
                        alt={`NFT coleccionado #${i + 1}`}
                        className="w-full h-48 object-cover rounded-t-lg"
                        height="192"
                        src={`/placeholder.svg?height=192&width=256&text=Coleccionado+${i + 1}`}
                        style={{
                          aspectRatio: "256/192",
                          objectFit: "cover",
                        }}
                        width="256"
                      />
                    </CardHeader>
                    <CardContent className="p-4">
                      <CardTitle className="text-lg">NFT Coleccionado #{i + 1}</CardTitle>
                      <p className="text-sm text-muted-foreground">Adquirido por: 0.3 ETH</p>
                      <Button className="w-full mt-2" size="sm">
                        Ver detalles
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
            <TabsContent value="actividad" className="mt-6">
              <Card>
                <CardContent className="p-4">
                  <ul className="space-y-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <li key={i} className="flex items-center space-x-4">
                        <div className="bg-primary/10 p-2 rounded-full">
                          <ExternalLink className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            {i % 2 === 0 ? "Vendió" : "Compró"} NFT #{i + 1}
                          </p>
                          <p className="text-xs text-muted-foreground">Hace {i + 1} días</p>
                        </div>
                        <div className="text-sm font-medium">{(0.1 * (i + 1)).toFixed(1)} ETH</div>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}