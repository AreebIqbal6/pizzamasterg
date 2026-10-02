"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import 'leaflet/dist/leaflet.css'

const MapContainer = dynamic(() => import('react-leaflet').then(m => m.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import('react-leaflet').then(m => m.TileLayer), { ssr: false })
const Marker = dynamic(() => import('react-leaflet').then(m => m.Marker), { ssr: false })

interface MiniMapProps {
  lat: number
  lng: number
}

function StaticMarker({ position }: { position: { lat: number; lng: number } }) {
  const [L, setL] = useState<any>(null)
  
  useEffect(() => {
    import('leaflet').then(leaflet => {
      // Fix leaflet default icon issue
      delete (leaflet.Icon.Default.prototype as any)._getIconUrl;
      leaflet.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      });
      setL(leaflet)
    })
  }, [])

  if (!L) return null

  return <Marker position={position} />
}

export default function MiniMap({ lat, lng }: MiniMapProps) {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return (
      <div className="h-full w-full bg-muted/20 animate-pulse flex items-center justify-center text-xs text-muted-foreground">
        Loading Map...
      </div>
    )
  }

  return (
    <div className="h-full w-full z-0 relative">
      <MapContainer 
        center={[lat, lng]} 
        zoom={15} 
        style={{ height: '100%', width: '100%', zIndex: 0 }}
        zoomControl={false}
        dragging={false}
        scrollWheelZoom={false}
        doubleClickZoom={false}
        touchZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <StaticMarker position={{ lat, lng }} />
      </MapContainer>
    </div>
  )
}
