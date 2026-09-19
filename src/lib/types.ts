/** Shared TypeScript types for the Zedwix Clients CRM */

export interface OwnerClient {
  id: string;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  address: string | null;
  city: string | null;
  avatar_url: string | null;
  total_billed: number;
  total_paid: number;
  total_due: number;
  status: "active" | "inactive";
  last_activity: string;
  notes: string | null;
  order_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface OwnerProject {
  id: string;
  client_id: string;
  name: string;
  description: string | null;
  status: "pending" | "in_progress" | "completed" | "on_hold";
  start_date: string | null;
  deadline: string | null;
  total_amount: number;
  paid_amount: number;
  due_amount: number;
  order_id: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  client?: OwnerClient;
}

export interface OwnerMilestone {
  id: string;
  project_id: string;
  title: string;
  status: "pending" | "in_progress" | "completed";
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  project?: OwnerProject;
}

export interface OwnerPayment {
  id: string;
  client_id: string;
  project_id: string | null;
  invoice_number: string;
  amount: number;
  method: "bank_transfer" | "jazzcash" | "easypaisa" | "sadapay" | "cash" | "other";
  date: string;
  status: "paid" | "pending" | "overdue";
  transaction_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  client?: OwnerClient;
  project?: OwnerProject;
}

export interface ActivityLogEntry {
  id: string;
  entity_type: "client" | "project" | "payment" | "store" | "milestone" | "system";
  entity_id: string | null;
  action: string;
  description: string;
  actor: string;
  created_at: string;
}

export interface OwnerNote {
  id: string;
  entity_type: "client" | "project" | "payment" | "general";
  entity_id: string | null;
  content: string;
  created_at: string;
}

export interface DashboardMetrics {
  totalClients: number;
  activeProjects: number;
  amountReceived: number;
  amountDue: number;
  upcomingDeliveries: number;
  attentionProjects: number;
  clientsTrend: number;
  projectsTrend: number;
  receivedTrend: number;
  dueTrend: number;
  recentPayments: OwnerPayment[];
  upcomingMilestones: (OwnerMilestone & { project_name?: string })[];
}

export interface StoreRecord {
  id: string;
  name: string;
  slug: string;
  whatsapp_number: string | null;
  instagram_url: string | null;
  contact_number: string | null;
  created_at: string;
  updated_at: string;
  ownerEmail?: string;
  ownerId?: string;
  productCount?: number;
}

export interface StoreListItem extends StoreRecord {}

export interface Store {
  id: string;
  name: string;
  slug: string;
  whatsapp_number: string | null;
  instagram_url: string | null;
  contact_number: string | null;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  store_id: string;
  name: string;
  slug: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export type ProductStatus = "published" | "draft";

export interface Product {
  id: string;
  store_id: string;
  category_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  sale_price: number | null;
  stock_tracking_enabled: boolean;
  stock_quantity: number;
  status: ProductStatus;
  is_hero_featured?: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductImage {
  id: string;
  product_id: string;
  store_id: string;
  storage_path: string;
  alt_text: string | null;
  sort_order: number;
  created_at: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  store_id: string;
  name: string;
  stock_quantity: number;
  created_at: string;
  updated_at: string;
}

export interface ProductWithRelations extends Product {
  images: ProductImage[];
  variants: ProductVariant[];
  category: Category | null;
}

export type PaymentStatus = "unpaid" | "paid" | "refunded";
export type FulfillmentStatus = "unfulfilled" | "shipped" | "delivered" | "cancelled";
export type PaymentMethod = "cod" | "bank_transfer" | "card" | "custom";

export interface OrderItem {
  id: string;
  order_id: string;
  store_id: string;
  product_id: string | null;
  variant_id: string | null;
  product_name: string;
  variant_name: string | null;
  sku: string | null;
  price: number;
  quantity: number;
  image_url: string | null;
  line_total: number;
  created_at: string;
}

export interface ZedwixOrder {
  id: string; // e.g. 'ZW-2026-12345'
  agreementId: string;
  agreementVersion?: number;
  handoverToken: string;
  handoverStatus: "Pending Delivery" | "Store Delivered - Pending Client Sign-off" | "Accepted & Delivered";
  createdAt: string;
  status: "Payment Review" | "Payment Verified" | "In Progress" | "Delivered" | "Completed" | "Cancelled";
  liveStoreUrl?: string;
  client: {
    name: string;
    business: string;
    whatsapp: string;
    email: string;
    address: string;
  };
  purchase: {
    plan: string;
    planId: string;
    productLimit: number;
    bonusProducts?: number;
    totalProductQuota?: number;
    extraProductPrice: number;
    oneTimePrice: number;
    originalPrice: number;
    deliveryOptionId: string;
    deliveryOptionName?: string;
    deliveryMode: "Standard" | "Urgent" | string;
    deliveryFee: number;
    deliveryTurnaround: string;
    amountDueToday: number;
    managedStoreTier?: string;
    managedStoreTitle?: string;
    managedStore?: boolean;
    monthlyManagementFee?: number;
    monthlyUpdateAllowance?: number;
    domainChoice: string;
    customDomainName?: string;
    paymentMethod: string;
  };
  historicalSnapshot?: {
    includedServices: string[];
    exclusions: string[];
    originalPrice?: number;
    planName?: string;
  };
  evidence?: {
    contentHash: string;
    acceptanceTimestamp: string;
    platform?: string;
    userAgent?: string;
  };
  handoverEvidence?: {
    clientSignerName: string;
    clientDesignation?: string;
    clientIp?: string;
    platform?: string;
    acceptedAt: string;
    signatureDataUrl: string;
    handoverHash: string;
  } | null;
  paymentReceipt?: {
    dataUrl?: string;
    fileName?: string;
    fileSize?: number;
    transactionId?: string;
    uploadedAt?: string;
  } | null;
  paymentVerification?: {
    verified: boolean;
    verifiedBy?: string | null;
    verifiedAt?: string | null;
    amountVerified?: number | null;
    paymentReference?: string | null;
  };
  managedStoreTracking?: {
    active: boolean;
    tierId: string;
    tierTitle: string;
    startDate: string;
    currentMonth: string;
    updatesTotal: number;
    updatesUsed: number;
    updatesRemaining: number;
    history: Array<{
      id?: string;
      dateFormatted: string;
      type: string;
      notes?: string;
    }>;
  } | null;
  auditTrail?: Array<{
    event: string;
    timestamp: string;
    actor: string;
  }>;
}

export interface Order {
  id: string;
  store_id: string;
  order_number: number;
  order_code: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  shipping_address: string;
  city: string;
  province: string | null;
  postal_code: string | null;
  order_notes: string | null;
  subtotal: number;
  shipping_fee: number;
  discount_amount: number;
  total_price: number;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  fulfillment_status: FulfillmentStatus;
  courier_name: string | null;
  tracking_number: string | null;
  tracking_url: string | null;
  admin_notes: string | null;
  coupon_code?: string | null;
  items: OrderItem[];
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  store_id: string;
  product_id: string | null;
  variant_id: string | null;
  product_name: string;
  variant_name: string | null;
  sku: string | null;
  price: number;
  quantity: number;
  image_url: string | null;
  line_total: number;
  created_at: string;
}

export type CouponDiscountType = "percentage" | "fixed" | "free_shipping";

export interface Coupon {
  id: string;
  store_id: string;
  code: string;
  discount_type: CouponDiscountType;
  discount_value: number;
  min_order_amount: number;
  usage_limit: number | null;
  times_used: number;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AnalyticsMetrics {
  netSales: number;
  totalOrders: number;
  averageOrderValue: number;
  completionRate: number;
  dailyRevenue: { date: string; label: string; amount: number; count: number }[];
  topProducts: { id: string; name: string; unitsSold: number; revenue: number }[];
}

export interface DashboardStats {
  totalProducts: number;
  totalCategories: number;
  lowStockCount: number;
  outOfStockCount: number;
}

export interface ActionResult {
  success: boolean;
  error?: string;
}

export interface ThemeConfig {
  announcement: { enabled: boolean; text: string };
  hero: {
    eyebrow: string;
    headingLine1: string;
    headingLine2: string;
    description: string;
    primaryBtnText?: string;
    secondaryBtnText?: string;
    featuredProductId?: string | null;
  };
  branding: { accentColor: string; badgeText: string };
  socialProof: {
    enabled: boolean;
    badge: string;
    reviews: { name: string; city: string; rating: number; comment: string }[];
  };
  shipping?: {
    deliveryFee: number;
    freeShippingEnabled: boolean;
    freeShippingThreshold: number | null;
    estimatedDays?: string;
  };
}

export interface ProductFormData {
  name: string;
  price: number;
  salePrice: number | null;
  categoryId: string | null;
  description: string | null;
  stockTrackingEnabled: boolean;
  stockQuantity: number;
  status: string;
  variants: { id?: string; name: string; stockQuantity: number }[];
}

