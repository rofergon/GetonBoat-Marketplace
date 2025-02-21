/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import dynamic from 'next/dynamic'
import { BrushData } from '../../types/types'
import Profile from './Profile'
import Home from './Home'
import Create from './Create'
import Collections from './Collections'
import Roadmap from './Roadmap'

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
  loading: () => <div>Loading ConnectWalletButton...</div>
});

export default function NFTMarketplace() {
  const [currentPage, setCurrentPage] = useState("home")
  const [theme, setTheme] = useState("dark")
  const [brushData, setBrushData] = useState<BrushData | null>(null)
  const showFooter = currentPage !== "painter";

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
          console.error("Error storing in localStorage:", e);
        }
      };
    }
  }, [])

  const updateBrushData = useCallback((data: BrushData | null) => {
    setBrushData(data)
  }, [])

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <header className="fixed top-0 left-0 right-0 z-50 bg-background shadow-md">
        <div className="max-w-[1920px] h-full mx-auto px-2 sm:px-4 lg:px-6 flex justify-between items-center">
          <Link className="" href="#" onClick={() => setCurrentPage("home")}>
            <div className="brand my-2"></div>
          </Link>
          <nav className="flex items-center space-x-4">
            <Link
              className="text-sm font-medium hover:underline underline-offset-4"
              href="#"
              onClick={() => setCurrentPage("home")}
            >
              Explore
            </Link>
            <Link
              className="text-sm font-medium hover:underline underline-offset-4"
              href="#"
              onClick={() => setCurrentPage("create")}
            >
              Create
            </Link>
            <Link
              className="text-sm font-medium hover:underline underline-offset-4"
              href="#"
              onClick={() => setCurrentPage("collections")}
            >
              Collections
            </Link>
            <Link
              className="text-sm font-medium hover:underline underline-offset-4"
              href="#"
              onClick={() => setCurrentPage("profile")}
            >
              Profile
            </Link>
            <Link
              className="text-sm font-medium hover:underline underline-offset-4"
              href="#"
              onClick={() => setCurrentPage("painter")}
            >
              Painter
            </Link>
            <Link
              className="text-sm font-medium hover:underline underline-offset-4"
              href="#"
              onClick={() => setCurrentPage("roadmap")}
            >
              Roadmap
            </Link>
            <ConnectWalletButton updateBrushData={updateBrushData} />
          </nav>
        </div>
      </header>
      <main className={`flex-1 ${currentPage}`}>
        {currentPage === "home" && <Home />}
        {currentPage === "profile" && <Profile />}
        {currentPage === "painter" && <PainterPage updateBrushData={updateBrushData} />}
        {currentPage === "create" && <Create />}
        {currentPage === "collections" && <Collections />}
        {currentPage === "roadmap" && <Roadmap />}
      </main>
      {showFooter && (
        <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
          <p className="text-xs text-muted-foreground">© 2024 NFT GetOnBoat Marketplace. All rights reserved.</p>
          <nav className="sm:ml-auto flex gap-4 sm:gap-6">
            <Link className="text-xs hover:underline underline-offset-4" href="#">
              Terms of Service
            </Link>
            <Link className="text-xs hover:underline underline-offset-4" href="#">
              Privacy
            </Link>
          </nav>
        </footer>
      )}
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
