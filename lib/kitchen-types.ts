export type OrderStatus = "pending" | "preparing" | "baking" | "quality-check" | "on-the-way" | "completed" | "cancelled"

export interface OrderItem {
  name: string
  quantity: number
  price: number
}

export interface KitchenOrder {
  id: string
  customerName: string
  customerPhone: string
  items: OrderItem[]
  deliveryAddress: string
  delivery_lat?: number | null
  delivery_lng?: number | null
  delivery_instructions?: string | null
  subtotal: number
  discount: number
  discountReason?: string
  total: number
  status: OrderStatus
  createdAt: Date
  branch: string
}

export const dummyOrders: KitchenOrder[] = [
  {
    id: "ORD-001",
    customerName: "Ahmed Khan",
    customerPhone: "+1234567890",
    items: [
      { name: "Large Fajita Pizza", quantity: 2, price: 500 },
      { name: "1.5L Pepsi", quantity: 1, price: 150 },
    ],
    deliveryAddress: "House 4, Block 8, Azizabad, Karachi",
    subtotal: 1150,
    discount: 230,
    discountReason: "Referral Code: PMG2024",
    total: 920,
    status: "pending",
    createdAt: new Date(Date.now() - 2 * 60000),
    branch: "Gulshan-e-Iqbal Block 2",
  },
  {
    id: "ORD-002",
    customerName: "Fatima Ali",
    customerPhone: "0321-5847291",
    items: [
      { name: "Regular Chicken Tikka Pizza", quantity: 1, price: 350 },
      { name: "Small Garlic Bread", quantity: 2, price: 100 },
    ],
    deliveryAddress: "Apartment 12, DHA Phase 2, Karachi",
    subtotal: 550,
    discount: 0,
    total: 550,
    status: "preparing",
    createdAt: new Date(Date.now() - 8 * 60000),
    branch: "Gulshan-e-Iqbal Block 2",
  },
  {
    id: "ORD-003",
    customerName: "Hassan Raza",
    customerPhone: "0333-1847562",
    items: [
      { name: "Large Supreme Pizza", quantity: 1, price: 500 },
      { name: "Medium Garlic Bread", quantity: 1, price: 150 },
      { name: "2L Sprite", quantity: 1, price: 200 },
    ],
    deliveryAddress: "Office 5, Trade Center, Zamzama, Karachi",
    subtotal: 850,
    discount: 170,
    discountReason: "Referral Code: PMG2024",
    total: 680,
    status: "on-the-way",
    createdAt: new Date(Date.now() - 15 * 60000),
    branch: "Gulshan-e-Iqbal Block 2",
  },
  {
    id: "ORD-004",
    customerName: "Sara Muhammad",
    customerPhone: "0300-9847293",
    items: [
      { name: "Small Cheese Pizza", quantity: 3, price: 130 },
      { name: "Spicy Wings (500g)", quantity: 1, price: 450 },
    ],
    deliveryAddress: "Villa 15, F.B. Area, Karachi",
    subtotal: 840,
    discount: 0,
    total: 840,
    status: "pending",
    createdAt: new Date(Date.now() - 3 * 60000),
    branch: "Gulshan-e-Iqbal Block 2",
  },
  {
    id: "ORD-005",
    customerName: "Mohammad Ali",
    customerPhone: "0331-7429384",
    items: [
      { name: "Large Chicken BBQ Pizza", quantity: 1, price: 500 },
      { name: "Regular Fajita Bread", quantity: 1, price: 100 },
    ],
    deliveryAddress: "Block A, North Karachi 11B, Karachi",
    subtotal: 600,
    discount: 120,
    discountReason: "Referral Code: PMG2024",
    total: 480,
    status: "completed",
    createdAt: new Date(Date.now() - 30 * 60000),
    branch: "Gulshan-e-Iqbal Block 2",
  },
  {
    id: "ORD-006",
    customerName: "Zainab Hassan",
    customerPhone: "0321-4928374",
    items: [
      { name: "2x Large Pepperoni Pizza", quantity: 1, price: 800 },
      { name: "Chicken Malai Boti (500g)", quantity: 1, price: 400 },
      { name: "1.5L Fanta", quantity: 1, price: 150 },
    ],
    deliveryAddress: "House 22, Defence Road, Karachi",
    subtotal: 1350,
    discount: 270,
    discountReason: "Referral Code: PMG2024",
    total: 1080,
    status: "preparing",
    createdAt: new Date(Date.now() - 5 * 60000),
    branch: "Gulshan-e-Iqbal Block 2",
  },
]

export const branches = [
  "Gulshan-e-Iqbal Block 2",
  "Gulshan-e-Iqbal 13D/2",
  "F.B. Area Sagheer Center",
  "North Karachi Anda Mor",
  "North Karachi 11B",
  "Azizabad Mukka Chowk",
]
