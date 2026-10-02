"use client"

import { useEffect, useState } from "react"
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import L from "leaflet"

// Fix for default marker icon in react-leaflet
const DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})
L.Marker.prototype.options.icon = DefaultIcon

type Props = {
  onChange: (lat: number, lng: number) => void
}

function LocationMarker({ onChange }: Props) {
  const [position, setPosition] = useState<L.LatLng | null>(null)
  
  const map = useMapEvents({
    click(e) {
      setPosition(e.latlng)
      onChange(e.latlng.lat, e.latlng.lng)
    },
    locationfound(e) {
      setPosition(e.latlng)
      map.flyTo(e.latlng, map.getZoom())
      onChange(e.latlng.lat, e.latlng.lng)
    },
  })

  useEffect(() => {
    map.locate()
  }, [map])

  return position === null ? null : <Marker position={position} />
}

export default function LocationPicker({ onChange }: Props) {
  return (
    <div className="h-48 w-full overflow-hidden rounded-md border border-border">
      <MapContainer 
        center={[24.8607, 67.0011]} // Default Karachi
        zoom={13} 
        scrollWheelZoom={false} 
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationMarker onChange={onChange} />
      </MapContainer>
    </div>
  )
}
