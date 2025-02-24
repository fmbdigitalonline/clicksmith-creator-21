
import { Helmet } from "react-helmet";
import { AdminRoute } from "@/components/auth/AdminRoute";
import { CreateUpdateForm } from "@/components/admin/updates/CreateUpdateForm";
import { AdminUpdatesList } from "@/components/admin/updates/AdminUpdatesList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AdminUpdates() {
  return (
    <AdminRoute>
      <Helmet>
        <title>Admin Updates | Dashboard</title>
      </Helmet>
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-8">Admin Updates</h1>
        
        <Tabs defaultValue="list" className="space-y-4">
          <TabsList>
            <TabsTrigger value="list">Updates List</TabsTrigger>
            <TabsTrigger value="create">Create Update</TabsTrigger>
          </TabsList>
          
          <TabsContent value="list" className="space-y-4">
            <AdminUpdatesList />
          </TabsContent>
          
          <TabsContent value="create">
            <CreateUpdateForm />
          </TabsContent>
        </Tabs>
      </div>
    </AdminRoute>
  );
}
