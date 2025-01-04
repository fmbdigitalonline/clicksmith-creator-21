import { AppLayout } from "./components/layout/AppLayout";
import Index from "./pages/Index";
import Gallery from "./pages/Gallery";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { SidebarProvider } from "@/components/ui/sidebar";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <SidebarProvider>
        <Router>
          <AppLayout>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/gallery" element={<Gallery />} />
            </Routes>
          </AppLayout>
          <Toaster />
        </Router>
      </SidebarProvider>
    </QueryClientProvider>
  );
};

export default App;