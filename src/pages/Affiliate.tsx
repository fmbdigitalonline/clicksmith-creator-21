
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DollarSign, BadgeCheck, Rocket, ArrowRight } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/components/ui/use-toast";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  website: z.string().url("Please enter a valid website URL"),
  reason: z.string().min(10, "Please provide more details about why you want to join")
});

const Affiliate = () => {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      website: "",
      reason: ""
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    console.log(values);
    toast({
      title: "Application submitted!",
      description: "We'll review your application and get back to you soon.",
    });
    setOpen(false);
    form.reset();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-6 flex items-center gap-2">
        <DollarSign className="h-8 w-8 text-primary" />
        Affiliate Program
      </h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              20% Commission
            </CardTitle>
            <CardDescription>Earn for every referred sale</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Earn 20% commission on all referral sales, paid out monthly.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BadgeCheck className="h-5 w-5 text-primary" />
              Lifetime Attribution
            </CardTitle>
            <CardDescription>Long-term earnings</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Earn from all future purchases made by your referred customers.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Rocket className="h-5 w-5 text-primary" />
              Instant Approval
            </CardTitle>
            <CardDescription>Start earning today</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Get approved instantly and start promoting right away.</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>How to Get Started</CardTitle>
          <CardDescription>Follow these simple steps to begin earning</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ol className="space-y-4">
            <li className="flex items-start gap-4">
              <div className="rounded-full bg-primary/10 p-2 text-primary font-bold">1</div>
              <div>
                <h3 className="font-semibold">Sign Up as an Affiliate</h3>
                <p className="text-muted-foreground">Complete the registration form to join our program</p>
              </div>
            </li>
            <li className="flex items-start gap-4">
              <div className="rounded-full bg-primary/10 p-2 text-primary font-bold">2</div>
              <div>
                <h3 className="font-semibold">Get Your Unique Links</h3>
                <p className="text-muted-foreground">Access your dashboard to get your affiliate links and materials</p>
              </div>
            </li>
            <li className="flex items-start gap-4">
              <div className="rounded-full bg-primary/10 p-2 text-primary font-bold">3</div>
              <div>
                <h3 className="font-semibold">Start Promoting</h3>
                <p className="text-muted-foreground">Share your links and start earning commissions</p>
              </div>
            </li>
          </ol>
        </CardContent>
      </Card>

      <div className="flex justify-center">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="gap-2">
              Apply Now <ArrowRight className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Affiliate Program Application</DialogTitle>
              <DialogDescription>
                Fill out this form to join our affiliate program. We'll review your application and get back to you shortly.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Your name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="your@email.com" type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website</FormLabel>
                      <FormControl>
                        <Input placeholder="https://your-website.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Why do you want to join?</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Tell us about your audience and how you plan to promote our platform" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end">
                  <Button type="submit">Submit Application</Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Affiliate;
