"use client"

import { useState } from "react"
import Image from "next/image"
import { Crosshair, ChevronDown } from "lucide-react"
import { cities, areas } from "@/lib/menu-data"

type Props = {
  onSelect: (orderType: string, city: string, area: string) => void
}

export function LocationModal({ onSelect }: Props) {
  const [orderType, setOrderType] = useState<"Delivery" | "Pick-Up">("Delivery")
  const [city, setCity] = useState("")
  const [area, setArea] = useState("")
  const [cityOpen, setCityOpen] = useState(false)
  const [areaOpen, setAreaOpen] = useState(false)

  const canSelect = city && area

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 px-4 py-10">
      <div className="w-full max-w-md rounded-2xl bg-card p-6 shadow-2xl sm:p-8">
        <div className="flex justify-center">
          <Image
            src="/chef-logo-removebg-preview.png"
            alt="Pizza Master G logo"
            width={84}
            height={84}
            className="h-20 w-20 rounded-full object-contain ring-2 ring-accent"
          />
        </div>
        <h2 className="mt-3 text-center text-xl font-extrabold text-foreground">Select your order type</h2>

        <div className="mt-4 flex items-center justify-center gap-3">
          <button
            onClick={() => setOrderType("Delivery")}
            className={`rounded-full px-7 py-2 text-sm font-bold transition ${
              orderType === "Delivery"
                ? "bg-primary text-primary-foreground"
                : "border border-border bg-card text-foreground"
            }`}
          >
            Delivery
          </button>
          <button
            onClick={() => setOrderType("Pick-Up")}
            className={`rounded-full px-7 py-2 text-sm font-bold transition ${
              orderType === "Pick-Up"
                ? "bg-primary text-primary-foreground"
                : "border border-border bg-card text-foreground"
            }`}
          >
            Pick-Up
          </button>
        </div>

        <div className="my-5 border-t border-border" />

        <p className="text-center text-sm font-bold text-foreground">Please select your location</p>

        <div className="mt-3 flex justify-center">
          <button className="flex items-center gap-2 rounded-md border border-border bg-secondary px-4 py-2 text-sm font-medium text-muted-foreground">
            <Crosshair className="h-4 w-4" />
            Use Current Location
          </button>
        </div>

        <div className="mt-5 space-y-1">
          <label className="text-sm font-bold text-foreground">Select City / Region</label>
          <div className="relative">
            <button
              onClick={() => setCityOpen((o) => !o)}
              className="flex w-full items-center justify-between rounded-md border border-border bg-card px-4 py-3 text-left text-sm"
            >
              <span className={city ? "text-foreground" : "text-muted-foreground"}>
                {city || "Select City / Region"}
              </span>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </button>
            {cityOpen && (
              <div className="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-md border border-border bg-card shadow-lg">
                {cities.map((c) => (
                  <button
                    key={c}
                    onClick={() => {
                      setCity(c)
                      setCityOpen(false)
                    }}
                    className="block w-full px-4 py-2 text-left text-sm hover:bg-secondary"
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 space-y-1">
          <label className="text-sm font-bold text-foreground">Select Area / Sub Region</label>
          <div className="relative">
            <button
              onClick={() => city && setAreaOpen((o) => !o)}
              className="flex w-full items-center justify-between rounded-md border border-border bg-card px-4 py-3 text-left text-sm disabled:opacity-60"
              disabled={!city}
            >
              <span className={area ? "text-foreground" : "text-muted-foreground"}>
                {area || "Select Area / Sub Region"}
              </span>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </button>
            {areaOpen && (
              <div className="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-md border border-border bg-card shadow-lg">
                {areas.map((a) => (
                  <button
                    key={a}
                    onClick={() => {
                      setArea(`${a} ~ eta 30 min.`)
                      setAreaOpen(false)
                    }}
                    className="block w-full px-4 py-2 text-left text-sm hover:bg-secondary"
                  >
                    {a}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <button
          disabled={!canSelect}
          onClick={() => onSelect(orderType, city, area)}
          className="mt-6 w-full rounded-md bg-accent py-3 text-sm font-bold text-accent-foreground transition disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
        >
          Select
        </button>
      </div>
    </div>
  )
}
