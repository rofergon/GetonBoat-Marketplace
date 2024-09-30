import React, { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Button } from "../src/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../src/components/ui/card"
import { Input } from "../src/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../src/components/ui/tabs"
import { ArrowRight, Copy, ExternalLink, MessageCircle, Moon, Search, Share2, Sun, Zap } from "lucide-react"
import dynamic from 'next/dynamic'
import ConnectWalletButton from '../src/components/ConnectWalletButton'
import { BrushData } from '../src/types/types'

const PixelArt = dynamic(() => import('../src/components/PixelArt'), {
  ssr: false,
  loading: () => <div>Cargando PixelArt...</div>
});

export default function NFTMarketplace() {
  const [currentPage, setCurrentPage] = useState("home")
  const [theme, setTheme] = useState("light")
  const [brushData, setBrushData] = useState<BrushData | null>(null)

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "light"
    setTheme(savedTheme)
    document.documentElement.classList.toggle("dark", savedTheme === "dark")

    if (typeof window !== 'undefined') {
      window.Buffer = Buffer;

      const originalSetItem = localStorage.setItem;
      localStorage.setItem = function(key, value) {
        try {
          originalSetItem.apply(this, [key, value]);
        } catch (e) {
          console.error("Error al almacenar en localStorage:", e);
        }
      };
    }
  }, [])

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light"
    setTheme(newTheme)
    localStorage.setItem("theme", newTheme)
    document.documentElement.classList.toggle("dark", newTheme === "dark")
  }

  const updateBrushData = useCallback((data: BrushData | null) => {
    setBrushData(data)
  }, [])

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <header className="px-4 lg:px-6 h-14 flex items-center">
        <Link className="flex items-center justify-center" href="#" onClick={() => setCurrentPage("home")}>
          <Zap className="h-6 w-6" />
          <span className="sr-only">NFT Marketplace</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link
            className="text-sm font-medium hover:underline underline-offset-4"
            href="#"
            onClick={() => setCurrentPage("home")}
          >
            Explorar
          </Link>
          <Link className="text-sm font-medium hover:underline underline-offset-4" href="#">
            Crear
          </Link>
          <Link className="text-sm font-medium hover:underline underline-offset-4" href="#">
            Colecciones
          </Link>
          <Link
            className="text-sm font-medium hover:underline underline-offset-4"
            href="#"
            onClick={() => setCurrentPage("profile")}
          >
            Perfil
          </Link>
          <Link
            className="text-sm font-medium hover:underline underline-offset-4"
            href="#"
            onClick={() => setCurrentPage("painter")}
          >
            Painter
          </Link>
          <ConnectWalletButton />
          <Button variant="ghost" size="icon" onClick={toggleTheme}>
            {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            <span className="sr-only">Cambiar tema</span>
          </Button>
        </nav>
      </header>
      <main className="flex-1">
        {currentPage === "home" && <HomePage />}
        {currentPage === "profile" && <ProfilePage />}
        {currentPage === "painter" && <PainterPage />}
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-muted-foreground">© 2024 NFT Marketplace. Todos los derechos reservados.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link className="text-xs hover:underline underline-offset-4" href="#">
            Términos de Servicio
          </Link>
          <Link className="text-xs hover:underline underline-offset-4" href="#">
            Privacidad
          </Link>
        </nav>
      </footer>
    </div>
  )
}

function HomePage() {
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
  )
}

function ProfilePage() {
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
  )
}

function PainterPage() {
  return (
    <div>
      <PixelArt />
    </div>
  )
}