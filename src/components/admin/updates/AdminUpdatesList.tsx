
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, Edit, Trash2, Calendar, Info, AlertTriangle, CheckCircle2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type AdminUpdate = {
  id: string;
  type: 'announcement' | 'feature' | 'incident';
  title: string;
  description: string;
  published: boolean;
  priority: number;
  created_at: string;
  publish_date: string | null;
  expiry_date: string | null;
};

const getTypeIcon = (type: AdminUpdate['type']) => {
  switch (type) {
    case 'announcement':
      return <Bell className="h-5 w-5 text-blue-500" />;
    case 'feature':
      return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    case 'incident':
      return <AlertTriangle className="h-5 w-5 text-red-500" />;
    default:
      return <Info className="h-5 w-5 text-gray-500" />;
  }
};

export function AdminUpdatesList() {
  const { data: updates, isLoading } = useQuery({
    queryKey: ["admin-updates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_updates")
        .select("*")
        .order("priority", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as AdminUpdate[];
    },
  });

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from("admin_updates")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting update:", error);
    }
  };

  if (isLoading) {
    return <div>Loading updates...</div>;
  }

  return (
    <div className="space-y-4">
      {updates?.map((update) => (
        <Card key={update.id} className="relative">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getTypeIcon(update.type)}
                <div>
                  <CardTitle className="text-lg">{update.title}</CardTitle>
                  <CardDescription>
                    Posted {formatDistanceToNow(new Date(update.created_at), { addSuffix: true })}
                  </CardDescription>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm">
                  <Edit className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => handleDelete(update.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{update.description}</p>
            {(update.publish_date || update.expiry_date) && (
              <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>
                  {update.publish_date && `Scheduled for: ${new Date(update.publish_date).toLocaleDateString()}`}
                  {update.expiry_date && ` - Expires: ${new Date(update.expiry_date).toLocaleDateString()}`}
                </span>
              </div>
            )}
            <div className="mt-2">
              <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                update.published ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
              }`}>
                {update.published ? 'Published' : 'Draft'}
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
