export type UserRole = "buyer" | "merchant" | "wholesaler" | "admin";
export interface Profile { id: string; full_name: string | null; role: UserRole; phone: string | null; }
export interface Shop { id: string; owner_id: string; name: string; description: string | null; logo_url: string | null; is_active: boolean; }
export interface Product {
  id: string; shop_id: string; name: string; description: string | null; price: number;
  currency: string; stock: number; image_url: string | null; category: string | null;
  shops?: Pick<Shop, "id" | "name"> | null;
}
export interface SubscriptionPlan { id: string; name: string; duration_months: number; price: number; currency: string; }
