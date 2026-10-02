"use client"

import { useState } from "react"
import { X, Star, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { submitReview } from "@/app/actions/reviews"

interface ReviewModalProps {
  isOpen: boolean
  orderId: string | null
  onClose: () => void
}

export default function ReviewModal({ isOpen, orderId, onClose }: ReviewModalProps) {
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [comment, setComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (rating === 0) {
      toast.error("Please select a star rating")
      return
    }

    setIsSubmitting(true)
    try {
      await submitReview(orderId!, rating, comment)

      toast.success("Thank you for your review!")
      setTimeout(() => {
        setRating(0)
        setComment("")
        onClose()
      }, 500)
    } catch (e: any) {
      console.error(e)
      toast.error(e.message || "Failed to submit review. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="font-heading text-lg font-bold text-accent">Leave a Review</h2>
          <button 
            onClick={onClose} 
            className="rounded-full p-1 text-muted-foreground hover:bg-accent/10 hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-5">
          <div className="flex flex-col items-center gap-2">
            <p className="text-sm font-semibold text-muted-foreground">How was your experience?</p>
            <div className="flex gap-1" onMouseLeave={() => setHoveredRating(0)}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  className="p-1 transition-transform hover:scale-110 focus:outline-none"
                >
                  <Star
                    className={`h-8 w-8 ${
                      star <= (hoveredRating || rating)
                        ? "fill-accent text-accent"
                        : "fill-muted text-muted-foreground"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold">Tell us more (Optional)</label>
            <textarea
              maxLength={500}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="What did you love? How can we improve?"
              className="w-full min-h-[100px] resize-none rounded-md border border-border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-accent placeholder:text-muted-foreground"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || rating === 0}
            className="w-full flex items-center justify-center gap-2 rounded-md bg-accent py-3 text-sm font-bold text-accent-foreground shadow-md transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Submit Review"}
          </button>
        </form>
      </div>
    </div>
  )
}
