
import { Helmet } from "react-helmet";
import { BlogAdminLayout } from "@/components/blog/admin/BlogAdminLayout";
import { AdminRoute } from "@/components/auth/AdminRoute";

export default function BlogAdmin() {
  return (
    <AdminRoute>
      <Helmet>
        <title>Blog Admin | Dashboard</title>
      </Helmet>
      <BlogAdminLayout />
    </AdminRoute>
  );
}
