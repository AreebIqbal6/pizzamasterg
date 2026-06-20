"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import 'leaflet/dist/leaflet.css'

// Dynamically import Leaflet components because they require the window object
const MapContainer = dynamic(() => import('react-leaflet').then(m => m.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import('react-leaflet').then(m => m.TileLayer), { ssr: false })
const Marker = dynamic(() => import('react-leaflet').then(m => m.Marker), { ssr: false })
// useMapEvents is a hook — must be imported directly, not via dynamic()
import { useMapEvents } from 'react-leaflet'

// Center of Karachi
const defaultCenter = {
  lat: 24.8607,
  lng: 67.0011
}

interface MapPickerProps {
  onLocationSelect: (lat: number, lng: number) => void
  initialLocation?: { lat: number, lng: number }
}

function LocationMarker({ position, setPosition, onLocationSelect }: any) {
  const [L, setL] = useState<any>(null)
  
  useEffect(() => {
    import('leaflet').then(leaflet => {
      // Fix leaflet default icon issue in Next.js
      delete (leaflet.Icon.Default.prototype as any)._getIconUrl;
      leaflet.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      });
      setL(leaflet)
    })
  }, [])

  const map = useMapEvents({
    click(e: any) {
      setPosition(e.latlng)
      onLocationSelect(e.latlng.lat, e.latlng.lng)
    },
  })

  if (!L || !position) return null

  return (
    <Marker 
      position={position} 
      draggable={true}
      eventHandlers={{
        dragend: (e: any) => {
          const marker = e.target
          const pos = marker.getLatLng()
          setPosition(pos)
          onLocationSelect(pos.lat, pos.lng)
        },
      }}
    />
  )
}

export default function MapPicker({ onLocationSelect, initialLocation }: MapPickerProps) {
  const [markerPos, setMarkerPos] = useState(initialLocation || defaultCenter)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return (
      <div className="flex h-[300px] w-full items-center justify-center rounded-lg border border-border bg-muted/20 text-muted-foreground text-sm font-medium p-4 animate-pulse">
        Loading interactive map...
      </div>
    )
  }

  return (
    <div className="relative w-full rounded-lg border border-border shadow-sm overflow-hidden z-0" style={{ height: '300px' }}>
      <MapContainer 
        center={[markerPos.lat, markerPos.lng]} 
        zoom={13} 
        style={{ height: '100%', width: '100%', zIndex: 0 }}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationMarker 
          position={markerPos} 
          setPosition={setMarkerPos} 
          onLocationSelect={onLocationSelect} 
        />
      </MapContainer>
      <div className="absolute bottom-2 left-2 right-2 rounded-md bg-background/90 backdrop-blur px-3 py-2 text-xs text-foreground shadow-md text-center pointer-events-none border border-border/50" style={{ zIndex: 1000 }}>
        Drag the pin or click on the map to set your exact delivery location
      </div>
    </div>
  )
}
