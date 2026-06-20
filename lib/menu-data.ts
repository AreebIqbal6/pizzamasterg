export type Product = {
  name: string
  description?: string
  price: string
  oldPrice?: string
  from?: boolean
  badge?: string
}

export type Category = {
  id: string
  title: string
  note?: string
  products: Product[]
}

export const STANDARD_PRICES = "Small Rs. 130 | Regular Rs. 350 | Large Rs. 500 | Extra Large Rs. 800"
export const SPECIAL_PRICES = "Regular Rs. 400 | Large Rs. 600 | Extra Large Rs. 1000"

const standardFlavours = [
  "Chicken Tikka",
  "Chicken BBQ",
  "Chicken Fajita Spicy",
  "Chicken Chargah Spicy",
  "Chicken Sicilian Spicy",
  "Chicken Malai Boti",
  "Chicken Afghani",
  "Chicken Combo",
  "Chicken Arabic Green",
  "Chicken Tandoori",
  "Chicken Behari",
  "Chicken Shawarma",
  "Veggie Lover",
]

const specialFlavours = [
  "Italian Delight",
  "Special Fajita",
  "Chicken Mughlai",
  "Creamy Tikka",
  "Special Afghani Feast",
  "Chicken Creamy Fajita Spicy",
  "Chicken Creamy Mac Olive",
  "Chicken Supreme",
  "Pizza Master Hot & Spicy",
  "Pepperoni Hot & Spicy",
  "Cheesy Margretta",
]

export const menu: Category[] = [
  {
    id: "special-flavours",
    title: "Special Flavours",
    note: "Regular Rs. 400  •  Large Rs. 600  •  Extra Large Rs. 1000",
    products: [
      {
        name: "Kabab Chaska",
        description: "Premium special flavour",
        price: "700.00",
        badge: "Premium",
      },
      {
        name: "Kabab Fantum",
        description: "Premium special flavour",
        price: "800.00",
        badge: "Premium",
      },
      ...specialFlavours.map((name) => ({
        name,
        description: "Regular Rs. 400 / Large Rs. 600 / Extra Large Rs. 1000",
        price: "400.00",
        from: true,
      })),
    ],
  },
  {
    id: "standard-flavours",
    title: "Standard Flavours",
    note: "Small Rs. 130  •  Regular Rs. 350  •  Large Rs. 500  •  Extra Large Rs. 800",
    products: standardFlavours.map((name) => ({
      name,
      description: "Small Rs. 130 / Regular Rs. 350 / Large Rs. 500 / Extra Large Rs. 800",
      price: "130.00",
      from: true,
    })),
  },
  {
    id: "deals",
    title: "Deals",
    products: [
      { name: "Deal 1", description: "10 Small Pizzas + 1 Litre Drink", price: "1,300.00" },
      { name: "Deal 2", description: "2 Regular Pizzas + 1 Litre Drink", price: "800.00" },
      { name: "Deal 3", description: "3 Regular Pizzas + 1 Litre Drink", price: "1,200.00" },
      { name: "Deal 4", description: "2 Large Pizzas + 1 Litre Drink", price: "1,100.00" },
      { name: "Deal 5", description: "1 Large Pizza + 2 Small Pizzas + 1 Litre Drink", price: "850.00" },
      { name: "Deal 6", description: "1 Large Pizza + 345ml Drink", price: "550.00" },
      { name: "Deal 7", description: "3 Large Pizzas + 1 Litre Drink", price: "1,650.00" },
      { name: "Deal 8", description: "4 Large Pizzas + 1.5 Litre Drink", price: "2,150.00" },
      { name: "Deal 9", description: "5 Large Pizzas + 1 Jumbo Drink", price: "2,650.00" },
      { name: "Deal 10", description: "6 Large Pizzas + 1 Jumbo Drink", price: "3,150.00" },
      { name: "Deal 11", description: "1 XL Pizza + 1 Small Pizza + 1 Litre Drink", price: "1,050.00" },
    ],
  },
  {
    id: "extra-toppings",
    title: "Extra Toppings",
    products: [
      { name: "Extra Topping (Extra Large)", description: "Add an extra topping to your Extra Large pizza", price: "200.00" },
      { name: "Extra Topping (Large)", description: "Add an extra topping to your Large pizza", price: "150.00" },
      { name: "Extra Topping (Regular)", description: "Add an extra topping to your Regular pizza", price: "100.00" },
    ],
  },
]

export function imageForCategory(id: string): string {
  const map: Record<string, string> = {
    "standard-flavours": "/food/pizza.png",
    "special-flavours": "/food/pizza-special.png",
    deals: "/food/deal.png",
    "extra-toppings": "/food/toppings.png",
  }
  return map[id] ?? "/food/pizza.png"
}

export const cities = ["Karachi"]

export const areas = [
  "Azizabad (Mukka Chowk)",
  "Gulshan-e-Iqbal",
  "Federal B Area",
]

import { createClient } from '@/lib/supabase/client'

export async function fetchMenu(branchName?: string): Promise<Category[]> {
  try {
    const supabase = createClient()
    const { data: items, error } = await supabase
      .from('menu_items')
      .select('*')
      .eq('available', true) // Global availability check
      
    if (error || !items) {
      return menu // Fallback to dummy data
    }

    let filteredItems = items
    if (branchName) {
      const { data: branch } = await supabase.from('branches').select('id').eq('name', branchName).single()
      if (branch) {
        const { data: overrides } = await supabase.from('branch_menu_overrides').select('menu_item_id').eq('branch_id', branch.id).eq('is_86ed', true)
        if (overrides && overrides.length > 0) {
          const skipIds = new Set(overrides.map(o => o.menu_item_id))
          filteredItems = items.filter(item => !skipIds.has(item.id))
        }
      }
    }
    
    // Group by category
    const categoryMap: Record<string, Category> = {}
    
    filteredItems.forEach(item => {
      if (!categoryMap[item.category]) {
        categoryMap[item.category] = {
          id: item.category.toLowerCase().replace(/\s+/g, '-'),
          title: item.category,
          products: []
        }
      }
      
      categoryMap[item.category].products.push({
        id: item.id,
        name: item.name,
        description: item.description,
        price: Number(item.price).toFixed(2),
      })
    })
    
    const fetchedMenu = Object.values(categoryMap)
    
    // Sort categories explicitly
    const order = ["Special Flavours", "Standard Flavours", "Deals", "Extra Toppings"]
    fetchedMenu.sort((a, b) => {
      const idxA = order.indexOf(a.title)
      const idxB = order.indexOf(b.title)
      if (idxA !== -1 && idxB !== -1) return idxA - idxB
      if (idxA !== -1) return -1
      if (idxB !== -1) return 1
      return a.title.localeCompare(b.title)
    })
    
    return fetchedMenu.length > 0 ? fetchedMenu : menu
  } catch (err) {
    console.error("Failed to fetch menu from Supabase", err)
    return menu
  }
}
