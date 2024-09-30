import React from "react";
import Link from "next/link";
import { Button } from "../ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { ArrowRight, Search } from "lucide-react";

export default function Home() {
  return (
    <>
      <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center space-y-4 text-center">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                Descubre, colecciona y vende NFTs extraordinarios
              </h1>
              <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                Explora el mundo de los NFTs. Compra, vende y colecciona obras de arte digitales únicas en nuestro marketplace.
              </p>
              <p className="text-2xl font-semibold mt-4">
                Get on Board. Get on Base. Get on Boat.
              </p>
            </div>
            <div className="w-full max-w-sm space-y-2">
              <form className="flex space-x-2">
                <Input className="max-w-lg flex-1" placeholder="Buscar colecciones, artistas o NFTs" type="text" />
                <Button type="submit" variant="outline">
                  <Search className="h-4 w-4" />
                  <span className="sr-only">Buscar</span>
                </Button>
              </form>
            </div>
          </div>
        </div>
      </section>
      <section className="w-full py-12 md:py-24 lg:py-32 bg-muted">
        <div className="container px-4 md:px-6">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Colección Destacada</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <img
                    alt="NFT artwork"
                    className="aspect-square object-cover rounded-lg"
                    height="200"
                    src={`/placeholder.svg?height=200&width=200&text=NFT+${i + 1}`}
                    width="200"
                  />
                </CardHeader>
                <CardContent>
                  <CardTitle>NFT #{i + 1}</CardTitle>
                  <p className="text-sm text-muted-foreground">Por Artista {i + 1}</p>
                </CardContent>
                <CardFooter>
                  <Button className="w-full">Ver detalles</Button>
                </CardFooter>
              </Card>
            ))}
          </div>
          <div className="mt-12 text-center">
            <Button>
              Ver más <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>
      <section className="w-full py-12 md:py-24 lg:py-32">
        <div className="container px-4 md:px-6">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">NFTs Populares</h2>
          <Tabs className="mt-8" defaultValue="all">
            <TabsList>
              <TabsTrigger value="all">Todos</TabsTrigger>
              <TabsTrigger value="art">Arte</TabsTrigger>
              <TabsTrigger value="collectibles">Coleccionables</TabsTrigger>
              <TabsTrigger value="music">Música</TabsTrigger>
            </TabsList>
            <TabsContent className="mt-6" value="all">
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Card key={i}>
                    <CardHeader>
                      <img
                        alt="NFT artwork"
                        className="aspect-square object-cover rounded-lg"
                        height="200"
                        src={`/placeholder.svg?height=200&width=200&text=Popular+${i + 1}`}
                        width="200"
                      />
                    </CardHeader>
                    <CardContent>
                      <CardTitle>NFT Popular #{i + 1}</CardTitle>
                      <p className="text-sm text-muted-foreground">Precio: 0.5 ETH</p>
                    </CardContent>
                    <CardFooter>
                      <Button className="w-full">Comprar ahora</Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </>
  );
}