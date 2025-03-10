import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { supabase } from '@/integrations/supabase/client';
import { useUser } from '@/hooks/useUser';
import { DatePicker } from '@/components/ui/date-picker';
import AdSelectionGallery from './AdSelectionGallery';
import { toast } from 'sonner';
import { FacebookPage } from '@/types/platformConnection';
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Campaign name must be at least 2 characters.",
  }),
  objective: z.string().min(1, {
    message: "Please select a campaign objective.",
  }),
  budget: z.string().refine((value) => {
    try {
      const num = parseFloat(value);
      return !isNaN(num) && num > 0;
    } catch (e) {
      return false;
    }
  }, {
    message: "Budget must be a valid number greater than zero.",
  }),
  start_date: z.date(),
  end_date: z.date().optional(),
  age_min: z.string().min(1, {
    message: "Please select a minimum age.",
  }),
  age_max: z.string().min(1, {
    message: "Please select a maximum age.",
  }),
  gender: z.string().min(1, {
    message: "Please select a gender.",
  }),
  locations: z.string().optional(),
  additional_notes: z.string().optional(),
  bid_strategy: z.string().optional(),
  bid_amount: z.string().optional(),
  page_id: z.string().min(1, {
    message: "Please select a Facebook page.",
  }),
});

interface FacebookCampaignFormProps {
  projectId?: string;
  onSuccess?: (campaignId: string) => void;
  onCancel?: () => void;
}

export default function FacebookCampaignForm({
  projectId,
  onSuccess,
  onCancel,
}: FacebookCampaignFormProps) {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [selectedAds, setSelectedAds] = useState<string[]>([]);
  const [facebookPages, setFacebookPages] = useState<FacebookPage[]>([]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      objective: "",
      budget: "10.00",
      start_date: new Date(),
      end_date: undefined,
      age_min: "18",
      age_max: "65",
      gender: "ALL",
      locations: "US",
      additional_notes: "",
      bid_strategy: "LOWEST_COST_WITHOUT_CAP",
      bid_amount: undefined,
      page_id: "",
    },
  });

  // Fetch Facebook pages
  useEffect(() => {
    async function fetchFacebookPages() {
      if (!user?.id) return;
      
      try {
        const { data, error } = await supabase
          .from('platform_connections')
          .select('metadata')
          .eq('user_id', user.id)
          .eq('platform', 'facebook')
          .single();
          
        if (error) {
          console.error('Error fetching Facebook pages:', error);
          return;
        }
        
        if (data?.metadata?.pages && Array.isArray(data.metadata.pages)) {
          setFacebookPages(data.metadata.pages);
        }
      } catch (error) {
        console.error('Error fetching Facebook pages:', error);
      }
    }
    
    fetchFacebookPages();
  }, [user?.id]);
  
  // Define the bid strategies
  const bidStrategies = [
    { value: 'LOWEST_COST_WITHOUT_CAP', label: 'Lowest Cost (No Cap)' },
    { value: 'LOWEST_COST_WITH_BID_CAP', label: 'Lowest Cost with Bid Cap' },
    { value: 'COST_CAP', label: 'Cost Cap' }
  ];

  // Function to submit the campaign
  const onSubmit = async (formData: any) => {
    if (selectedAds.length === 0) {
      toast.error('Please select at least one ad');
      return;
    }
    
    setLoading(true);
    
    try {
      // Convert budget to number
      const budget = parseFloat(formData.budget);
      if (isNaN(budget) || budget <= 0) {
        throw new Error('Invalid budget amount');
      }
      
      // Convert bid amount if present
      let bidAmount = undefined;
      if (formData.bid_amount) {
        bidAmount = parseFloat(formData.bid_amount);
        if (isNaN(bidAmount) || bidAmount <= 0) {
          throw new Error('Invalid bid amount');
        }
      }
      
      // Include selected page ID in the campaign data
      const campaignData = {
        name: formData.name,
        objective: formData.objective,
        budget: budget,
        start_date: formData.start_date.toISOString(),
        end_date: formData.end_date ? formData.end_date.toISOString() : undefined,
        targeting: {
          age_min: parseInt(formData.age_min, 10),
          age_max: parseInt(formData.age_max, 10),
          gender: formData.gender,
          locations: formData.locations ? [formData.locations] : ['US'],
        },
        status: 'PAUSED',
        ads: selectedAds,
        project_id: projectId,
        creation_mode: 'manual',
        type: 'facebook',
        additional_notes: formData.additional_notes,
        bid_strategy: formData.bid_strategy,
        bid_amount: bidAmount,
        selected_page_id: formData.page_id
      };
      
      console.log('Creating campaign with data:', campaignData);
      
      const { data, error } = await supabase.functions.invoke('facebook-campaign-manager', {
        body: {
          operation: 'create_campaign',
          campaign_data: campaignData
        }
      });
      
      if (error) {
        throw new Error(`Error creating campaign: ${error.message}`);
      }
      
      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to create campaign');
      }
      
      toast.success('Campaign created successfully');
      
      if (onSuccess) {
        onSuccess(data.campaign_id);
      }
    } catch (error: any) {
      console.error('Error creating campaign:', error);
      toast.error(`Failed to create campaign: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">Create Facebook Campaign</h2>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Campaign Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter campaign name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="objective"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Campaign Objective</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an objective" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="OUTCOME_AWARENESS">Awareness</SelectItem>
                        <SelectItem value="OUTCOME_TRAFFIC">Traffic</SelectItem>
                        <SelectItem value="OUTCOME_ENGAGEMENT">Engagement</SelectItem>
                        <SelectItem value="OUTCOME_LEADS">Lead Generation</SelectItem>
                        <SelectItem value="OUTCOME_SALES">Sales</SelectItem>
                        <SelectItem value="OUTCOME_APP_PROMOTION">App Promotion</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="budget"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Daily Budget (USD)</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" step="0.01" placeholder="10.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Start Date</FormLabel>
                    <DatePicker
                      date={field.value}
                      setDate={field.onChange}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="end_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>End Date (Optional)</FormLabel>
                    <DatePicker
                      date={field.value}
                      setDate={field.onChange}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="age_min"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Minimum Age</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Min age" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Array.from({ length: 48 }, (_, i) => i + 18).map((age) => (
                          <SelectItem key={age} value={age.toString()}>
                            {age}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="age_max"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Maximum Age</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Max age" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Array.from({ length: 48 }, (_, i) => i + 18).map((age) => (
                          <SelectItem key={age} value={age.toString()}>
                            {age}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gender</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ALL">All</SelectItem>
                        <SelectItem value="MALE">Male</SelectItem>
                        <SelectItem value="FEMALE">Female</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="locations"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location (Country Code)</FormLabel>
                  <FormControl>
                    <Input placeholder="US" {...field} />
                  </FormControl>
                  <FormDescription>
                    Enter a 2-letter country code (e.g., US, CA, UK)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Add Facebook Page selection */}
            <FormField
              control={form.control}
              name="page_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Facebook Page</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a Facebook page" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {facebookPages.length > 0 ? (
                        facebookPages.map((page) => (
                          <SelectItem key={page.id} value={page.id}>
                            {page.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="none" disabled>
                          No pages available
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Select a Facebook page to associate with your ads
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Bid Strategy */}
            <FormField
              control={form.control}
              name="bid_strategy"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bid Strategy</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a bid strategy" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {bidStrategies.map((strategy) => (
                        <SelectItem key={strategy.value} value={strategy.value}>
                          {strategy.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    How you want Facebook to optimize your ad spending
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Conditional Bid Amount based on bid strategy */}
            {(form.watch('bid_strategy') === 'LOWEST_COST_WITH_BID_CAP' || 
             form.watch('bid_strategy') === 'COST_CAP') && (
              <FormField
                control={form.control}
                name="bid_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bid Amount (USD)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0.01" 
                        step="0.01" 
                        placeholder="1.00" 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      The maximum amount you're willing to pay per result
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            <FormField
              control={form.control}
              name="additional_notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Add any additional information about this campaign..." 
                      className="h-24"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="space-y-2">
              <Label>Select Ads</Label>
              <AdSelectionGallery 
                projectId={projectId}
                selectedAds={selectedAds}
                onSelectAds={setSelectedAds}
              />
              {selectedAds.length === 0 && (
                <p className="text-sm text-destructive">Please select at least one ad</p>
              )}
            </div>
            
            <div className="flex justify-end space-x-2 pt-4">
              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
              )}
              <Button type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create Campaign'}
              </Button>
            </div>
          </form>
        </Form>
      </Card>
    </div>
  );
}
