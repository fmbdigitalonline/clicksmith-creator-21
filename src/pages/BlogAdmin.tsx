
import { Helmet } from "react-helmet";
import { BlogAdminLayout } from "@/components/blog/admin/BlogAdminLayout";

export default function BlogAdmin() {
  return (
    <>
      <Helmet>
        <title>Blog Admin | Dashboard</title>
      </Helmet>
      <BlogAdminLayout />
    </>
  );
}
