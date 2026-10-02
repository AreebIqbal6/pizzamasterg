export type OrderStatus = 'Pending' | 'Preparing' | 'On the Way' | 'Completed' | 'Cancelled'
export type PaymentMethod = 'Cash on Delivery' | 'JazzCash' | 'EasyPaisa' | 'Bank Transfer'

export interface AdminTransaction {
  id: string
  orderId: string
  branch: string
  customer: string
  totalAmount: number
  paymentMethod: PaymentMethod
  status: OrderStatus
  timestamp: Date
}

export interface BranchRevenue {
  branch: string
  revenue: number
}

export interface KPIMetrics {
  totalRevenue: number
  totalOrders: number
  activeOrders: number
  completedOrders: number
  avgDeliveryTime: number
}

// Dummy data for dashboard
export const dummyKPIs: KPIMetrics = {
  totalRevenue: 45500,
  totalOrders: 96,
  activeOrders: 12,
  completedOrders: 84,
  avgDeliveryTime: 38,
}

export const dummyBranchRevenue: BranchRevenue[] = [
  { branch: 'Gulshan Block 2', revenue: 8500 },
  { branch: 'Gulshan 13D/2', revenue: 7200 },
  { branch: 'F.B. Area', revenue: 6800 },
  { branch: 'Anda Mor', revenue: 9100 },
  { branch: 'North Karachi 11B', revenue: 7900 },
  { branch: 'Azizabad', revenue: 6000 },
]

export const dummyTransactions: AdminTransaction[] = [
  {
    id: 'TXN001',
    orderId: '#PMG-1001',
    branch: 'Gulshan Block 2',
    customer: 'Ali Khan',
    totalAmount: 1850,
    paymentMethod: 'JazzCash',
    status: 'Completed',
    timestamp: new Date('2024-06-10T14:30:00'),
  },
  {
    id: 'TXN002',
    orderId: '#PMG-1002',
    branch: 'Anda Mor',
    customer: 'Fatima Ahmed',
    totalAmount: 2150,
    paymentMethod: 'Cash on Delivery',
    status: 'Completed',
    timestamp: new Date('2024-06-10T13:45:00'),
  },
  {
    id: 'TXN003',
    orderId: '#PMG-1003',
    branch: 'F.B. Area',
    customer: 'Hassan Malik',
    totalAmount: 950,
    paymentMethod: 'EasyPaisa',
    status: 'Completed',
    timestamp: new Date('2024-06-10T12:20:00'),
  },
  {
    id: 'TXN004',
    orderId: '#PMG-1004',
    branch: 'Gulshan 13D/2',
    customer: 'Zara Khan',
    totalAmount: 1250,
    paymentMethod: 'Bank Transfer',
    status: 'Completed',
    timestamp: new Date('2024-06-10T11:15:00'),
  },
  {
    id: 'TXN005',
    orderId: '#PMG-1005',
    branch: 'North Karachi 11B',
    customer: 'Omar Hassan',
    totalAmount: 1680,
    paymentMethod: 'JazzCash',
    status: 'Cancelled',
    timestamp: new Date('2024-06-10T10:00:00'),
  },
  {
    id: 'TXN006',
    orderId: '#PMG-1006',
    branch: 'Azizabad',
    customer: 'Saira Amir',
    totalAmount: 2300,
    paymentMethod: 'Cash on Delivery',
    status: 'Completed',
    timestamp: new Date('2024-06-09T18:30:00'),
  },
]
