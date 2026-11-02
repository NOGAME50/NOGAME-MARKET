export type UserRole = 'buyer' | 'merchant' | 'wholesaler' | 'admin';
export type AccountStatus = 'active' | 'suspended';
export interface Profile { id: string; full_name: string | null; role: UserRole; phone: string | null; account_status?: AccountStatus; trust_level?: 'new'|'verified'|'trusted'; }
export interface Shop { id: string; owner_id: string; name: string; description: string | null; logo_url: string | null; is_active: boolean; phone: string | null; latitude: number | null; longitude: number | null; zone: string | null; moderation_status?: string; }
export interface Product { id: string; shop_id: string; name: string; description: string | null; price: number; currency: string; stock: number; image_url: string | null; category: string | null; is_active: boolean; shops?: Pick<Shop,'id'|'name'> | null; }
export interface Report { id:string; reporter_id:string; target_type:'shop'|'product'|'user'; target_id:string; reason:string; details:string|null; status:'open'|'reviewing'|'resolved'|'dismissed'; created_at:string; }
