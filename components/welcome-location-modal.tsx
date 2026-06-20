"use client"

import { useState } from "react"
import Image from "next/image"
import { ChevronDown } from "lucide-react"
import { useStore } from "@/components/cart/cart-context"

import { Crosshair } from "lucide-react"
import { toast } from "sonner"

const BRANCHES = [
  { name: "Gulshan-e-Iqbal Block 2", lat: 24.918, lng: 67.097 },
  { name: "Gulshan e Iqbal", lat: 24.922, lng: 67.085 },
  { name: "F.B. Area Sagheer Center", lat: 24.935, lng: 67.068 },
  { name: "North Karachi Anda Mor", lat: 24.981, lng: 67.064 },
  { name: "North Karachi", lat: 24.992, lng: 67.058 },
  { name: "Mukka Chowk", lat: 24.931, lng: 67.060 },
  { name: "Nazimabad", lat: 24.913, lng: 67.035 },
  { name: "Malir", lat: 24.896, lng: 67.195 },
  { name: "Gulistan e Jauhar", lat: 24.919, lng: 67.140 },
]

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

type Props = {
  onLocationSelected: (branch: string, address: string) => void
}

export function WelcomeLocationModal({ onLocationSelected }: Props) {
  const { user, openOverlay } = useStore()
  const [step, setStep] = useState<"guest-location">("guest-location")
  const [selectedBranch, setSelectedBranch] = useState("")
  const [deliveryAddress, setDeliveryAddress] = useState("")
  const [branchOpen, setBranchOpen] = useState(false)
  const [locating, setLocating] = useState(false)

  const autoLocate = () => {
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords
        let nearest = BRANCHES[0]
        let minDist = Infinity
        for (const b of BRANCHES) {
          const d = getDistance(latitude, longitude, b.lat, b.lng)
          if (d < minDist) {
            minDist = d
            nearest = b
          }
        }
        setSelectedBranch(nearest.name)
        setLocating(false)
      },
      (err) => {
        setLocating(false)
        toast.error("Could not access your location. Please ensure location services are enabled or select manually.", { duration: 4000 })
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    )
  }

  const canProceed = selectedBranch && deliveryAddress.trim()

  const handleStartOrdering = () => {
    if (canProceed) {
      onLocationSelected(selectedBranch, deliveryAddress)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 px-4 py-8">
      <div className="w-full max-w-md rounded-3xl bg-card p-8 shadow-2xl">
        {/* Guest Location Screen */}
        {step === "guest-location" && (
          <div>
            <h2 className="text-2xl font-black text-accent">Delivery Details</h2>
            <p className="mt-2 text-sm text-muted-foreground">Tell us where to find you</p>

            <div className="mt-6 space-y-4">
              {/* Branch Selector */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-foreground">Choose Your Nearest Branch</label>
                  <button
                    onClick={autoLocate}
                    disabled={locating}
                    className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-bold text-accent bg-accent/10 transition hover:bg-accent/20 disabled:opacity-50"
                  >
                    <Crosshair className="h-3 w-3" />
                    {locating ? "Locating..." : "Auto-Locate"}
                  </button>
                </div>
                <div className="relative">
                  <button
                    onClick={() => setBranchOpen((o) => !o)}
                    className="flex w-full items-center justify-between rounded-xl border-2 border-border bg-card px-4 py-3 text-left text-sm font-semibold text-foreground transition hover:border-accent"
                  >
                    <span>{selectedBranch || "Select a branch..."}</span>
                    <ChevronDown
                      className={`h-4 w-4 text-accent transition ${branchOpen ? "rotate-180" : ""}`}
                    />
                  </button>
                  {branchOpen && (
                    <div className="absolute top-full left-0 right-0 z-10 mt-1 max-h-48 overflow-y-auto rounded-xl border-2 border-border bg-card shadow-lg">
                      {BRANCHES.map((b) => (
                        <button
                          key={b.name}
                          onClick={() => {
                            setSelectedBranch(b.name)
                            setBranchOpen(false)
                          }}
                          className={`block w-full px-4 py-3 text-left text-sm font-medium transition ${
                            selectedBranch === b.name
                              ? "bg-accent text-accent-foreground"
                              : "text-foreground hover:bg-secondary"
                          }`}
                        >
                          {b.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Delivery Address */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-foreground">Delivery Address</label>
                <textarea
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="e.g., House 5, Block 2, Gulshan-e-Iqbal..."
                  className="w-full rounded-xl border-2 border-border bg-card px-4 py-3 text-sm font-medium text-foreground placeholder:text-muted-foreground transition focus:border-accent focus:outline-none"
                  rows={3}
                />
              </div>

              {/* CTA Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleStartOrdering}
                  disabled={!canProceed}
                  className="flex-1 rounded-xl bg-accent py-3 text-sm font-bold text-accent-foreground transition disabled:opacity-50 hover:opacity-90"
                >
                  Start Ordering
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
