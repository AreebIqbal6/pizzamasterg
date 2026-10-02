import { LifeBuoy, Mail, Phone } from 'lucide-react'

export default function HelpPage() {
  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold text-accent">Help & Support</h1>
        <p className="text-muted-foreground mt-2">Need assistance with the Pizza Master G Admin Panel?</p>
      </div>

      <div className="bg-card border border-border rounded-xl p-8 shadow-sm">
        <div className="flex items-center gap-4 border-b border-border pb-6 mb-6">
          <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
            <LifeBuoy className="h-6 w-6 text-destructive" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Emergency Contact</h2>
            <p className="text-sm text-destructive font-medium">Contact in case of emergency</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="flex items-start gap-4 p-4 rounded-lg bg-secondary/30 border border-border">
            <Mail className="h-5 w-5 text-accent mt-0.5" />
            <div>
              <h3 className="font-semibold text-foreground mb-1">Email Support</h3>
              <p className="text-sm text-muted-foreground mb-2">For urgent issues or technical support, reach out to our team.</p>
              <a href="mailto:support@skillora.com" className="text-sm font-bold text-primary hover:underline">
                support@skillora.com
              </a>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 rounded-lg bg-secondary/30 border border-border">
            <Phone className="h-5 w-5 text-accent mt-0.5" />
            <div>
              <h3 className="font-semibold text-foreground mb-1">Phone Support</h3>
              <p className="text-sm text-muted-foreground mb-2">Available 24/7 for critical system failures.</p>
              <a href="tel:+1234567890" className="text-sm font-bold text-primary hover:underline">
                +1 (234) 567-890
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
