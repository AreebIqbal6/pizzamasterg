"use client"

import { useEffect, useRef, useState } from "react"
import { LocationModal } from "@/components/location-modal"
import { SiteHeader } from "@/components/site-header"
import { HeroBanner } from "@/components/hero-banner"
import { CategoryNav } from "@/components/category-nav"
import { MenuSections } from "@/components/menu-sections"
import { SiteFooter } from "@/components/site-footer"
import { CartDrawer } from "@/components/cart/cart-drawer"
import { AuthModal } from "@/components/auth/auth-modal"
import { AccountModal } from "@/components/account/account-modal"
import { CheckoutModal } from "@/components/checkout/checkout-modal"
import { OrdersModal } from "@/components/orders/orders-modal"
import { WelcomeLocationModal } from "@/components/welcome-location-modal"
import { Category, fetchMenu, menu as defaultMenu } from "@/lib/menu-data"
import { useStore } from "@/components/cart/cart-context"

export default function Page() {
  const { openOverlay } = useStore()
  const [located, setLocated] = useState(true)
  const [location, setLocation] = useState("")
  const [showWelcome, setShowWelcome] = useState(false) // Start false to prevent flash
  const [active, setActive] = useState(defaultMenu[0].id)
  const [menuData, setMenuData] = useState<Category[]>([])
  
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({})
  const clickScrolling = useRef(false)

  // Initialization effect for location and cart
  useEffect(() => {
    // 1. Restore location from sessionStorage or keep it empty
    const savedLocation = sessionStorage.getItem("pmg_location")
    if (savedLocation) {
      setLocation(savedLocation)
    } else {
      setLocation("")
    }
    setLocated(true)
    setShowWelcome(false)

    // 2. Open cart or checkout if redirected from login
    if (typeof window !== "undefined") {
      if (window.location.search.includes("openCheckout=true")) {
        setTimeout(() => openOverlay("checkout"), 300)
        window.history.replaceState(null, "", "/")
      } else if (window.location.search.includes("openCart=true")) {
        setTimeout(() => openOverlay("cart"), 300)
        window.history.replaceState(null, "", "/")
      }
    }
  }, [openOverlay])

  useEffect(() => {
    async function loadMenu() {
      const branch = sessionStorage.getItem("pmg_branch")
      const data = await fetchMenu(branch || undefined)
      setMenuData(data)
      if (data.length > 0 && !active) {
        setActive(data[0].id)
      }
    }
    loadMenu()
  }, [])

  const registerRef = (id: string, el: HTMLElement | null) => {
    sectionRefs.current[id] = el
  }

  const handleSelectCategory = (id: string) => {
    setActive(id)
    clickScrolling.current = true
    sectionRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" })
    window.setTimeout(() => {
      clickScrolling.current = false
    }, 800)
  }

  useEffect(() => {
    if (!located || menuData.length === 0) return
    const onScroll = () => {
      if (clickScrolling.current) return
      const offset = 220
      let current = menuData[0]?.id || active
      for (const cat of menuData) {
        const el = sectionRefs.current[cat.id]
        if (el && el.getBoundingClientRect().top <= offset) {
          current = cat.id
        }
      }
      setActive(current)
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [located, menuData])

  return (
    <main className="min-h-screen bg-background">
      {showWelcome && (
        <WelcomeLocationModal
          onLocationSelected={(branch, address) => {
            const locStr = `${branch} ~ eta 30 minutes.`
            setLocation(locStr)
            setLocated(true)
            setShowWelcome(false)
            sessionStorage.setItem("pmg_location", locStr)
            sessionStorage.setItem("pmg_branch", branch)
            window.location.reload() // Reload to fetch branch-specific menu
          }}
        />
      )}

      {!located && !showWelcome && (
        <LocationModal
          onSelect={(orderType, city, area) => {
            const locStr = `${area.split(" ~")[0]}, ${city} ~ eta 30 minutes.`
            setLocation(locStr)
            setLocated(true)
            sessionStorage.setItem("pmg_location", locStr)
          }}
        />
      )}

      <SiteHeader 
        location={location || "Select your location"} 
        onChangeLocation={() => {
          sessionStorage.removeItem("pmg_location");
          sessionStorage.removeItem("pmg_branch");
          setLocated(false);
          setShowWelcome(true);
        }}
      />
      <HeroBanner />
      
      {menuData.length > 0 ? (
        <>
          <CategoryNav active={active} categories={menuData} onSelect={handleSelectCategory} />
          <MenuSections categories={menuData} registerRef={registerRef} />
        </>
      ) : (
        <div className="flex justify-center py-20 text-muted-foreground">Loading Menu...</div>
      )}
      
      <SiteFooter />

      <CartDrawer />
      <AuthModal />
      <AccountModal />
      <CheckoutModal />
      <OrdersModal />
    </main>
  )
}
