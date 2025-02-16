
export interface AdminUpdate {
  id: string;
  type: "feature" | "update" | "incident" | "announcement";
  title: string;
  description: string;
  published: boolean;
  priority: number;
  created_at: string;
  updated_at: string;
  publish_date: string | null;
  expiry_date: string | null;
  icon: string | null;
  metadata: Record<string, any>;
}
