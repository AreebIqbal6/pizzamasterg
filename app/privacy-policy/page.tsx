import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"

export default function PrivacyPolicy() {
  return (
    <main className="min-h-screen bg-background">
      <SiteHeader location="Karachi" />
      <div className="mx-auto max-w-3xl px-4 py-20 text-foreground">
        <h1 className="mb-8 text-4xl font-black text-accent">Privacy Policy</h1>
        
        <div className="space-y-8 text-sm text-muted-foreground">
          <p>Last updated: {new Date().toLocaleDateString()}</p>
          
          <section>
            <h2 className="mb-4 text-2xl font-bold text-foreground">1. Introduction</h2>
            <p>Welcome to Pizza Master G. We respect your privacy and are committed to protecting your personal data. This privacy policy will inform you as to how we look after your personal data when you visit our website.</p>
          </section>
          
          <section>
            <h2 className="mb-4 text-2xl font-bold text-foreground">2. Data We Collect</h2>
            <p className="mb-3">We may collect, use, store and transfer different kinds of personal data about you which we have grouped together follows:</p>
            <ul className="list-inside list-disc space-y-2 ml-4">
              <li><strong>Identity Data</strong> includes first name, last name, username or similar identifier.</li>
              <li><strong>Contact Data</strong> includes delivery address, email address and telephone numbers.</li>
              <li><strong>Technical Data</strong> includes internet protocol (IP) address, browser type and version, time zone setting and location.</li>
              <li><strong>Transaction Data</strong> includes details about payments to and from you and other details of products you have purchased from us.</li>
            </ul>
          </section>
          
          <section>
            <h2 className="mb-4 text-2xl font-bold text-foreground">3. How We Use Your Data</h2>
            <p>We will only use your personal data when the law allows us to. Most commonly, we will use your personal data to process and deliver your orders, manage our relationship with you, and improve our website, products/services, marketing or customer relationships.</p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-bold text-foreground">4. Cookies</h2>
            <p>You can set your browser to refuse all or some browser cookies, or to alert you when websites set or access cookies. If you disable or refuse cookies, please note that some parts of this website may become inaccessible or not function properly.</p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-bold text-foreground">5. Data Security</h2>
            <p>We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used or accessed in an unauthorised way, altered or disclosed.</p>
          </section>
        </div>
      </div>
      <SiteFooter />
    </main>
  )
}
