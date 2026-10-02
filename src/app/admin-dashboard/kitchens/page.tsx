import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { getKitchens } from "./actions"
import KitchenList from "./kitchen-list"

export default async function KitchensPage() {
  const kitchens = await getKitchens()

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <main className="flex-1 overflow-auto">
        <div className="bg-card border-b border-border sticky top-0 z-10">
          <div className="px-8 py-6">
            <h2 className="text-3xl font-heading font-bold text-accent">Kitchen Accounts</h2>
            <p className="text-muted-foreground mt-1">Manage branch emails, passwords, and details.</p>
          </div>
        </div>

        <div className="p-8">
          <KitchenList initialKitchens={kitchens} />
        </div>
      </main>
    </div>
  )
}
