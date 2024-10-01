import React, { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Button } from "../ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../ui/card"
import { Input } from "../ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"
import { ArrowRight, Copy, ExternalLink, MessageCircle, Moon, Search, Share2, Sun } from "lucide-react"
import dynamic from 'next/dynamic'
import { BrushData } from '../../types/types'
import Profile from './Profile'
import Home from './Home'

interface PixelArtProps {
  updateBrushData: (data: BrushData | null) => void;
}

const PixelArt = dynamic<PixelArtProps>(() => import('../pixelminter/PixelArt'), {
  ssr: false,
  loading: () => <div>Loading PixelArt...</div>
});

interface ConnectWalletButtonProps {
  updateBrushData: (data: BrushData | null) => void;
}

const ConnectWalletButton = dynamic<ConnectWalletButtonProps>(() => import('../pixelminter/ConnectWalletButton'), {
  ssr: false,
  loading: () => <div>Cargando ConnectWalletButton...</div>
});

export default function NFTMarketplace() {
  const [currentPage, setCurrentPage] = useState("home")
  const [theme, setTheme] = useState("dark")
  const [brushData, setBrushData] = useState<BrushData | null>(null)

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "dark"
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
        <Link className="" href="#" onClick={() => setCurrentPage("home")}>
          <div className="brand my-2"></div>
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
          <ConnectWalletButton updateBrushData={updateBrushData} />
          <Button variant="ghost" size="icon" onClick={toggleTheme}>
            {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            <span className="sr-only">Cambiar tema</span>
          </Button>
        </nav>
      </header>
      <main className="flex-1">
        {currentPage === "home" && <Home />}
        {currentPage === "profile" && <Profile />}
        {currentPage === "painter" && <PainterPage updateBrushData={updateBrushData} />}
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

function PainterPage({ updateBrushData }: { updateBrushData: (data: BrushData | null) => void }) {
  return (
    <div>
      <PixelArt updateBrushData={updateBrushData} />
    </div>
  )
}