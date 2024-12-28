const mockAudiences = [
  {
    name: "Young Urban Professionals",
    description: "Career-focused individuals aged 25-35 living in metropolitan areas",
    demographics: "Age: 25-35, Urban areas, College educated, Income: $60k-100k",
    painPoints: [
      "Limited time for personal life",
      "High stress levels",
      "Work-life balance challenges"
    ],
    icp: "Sarah, 28, Marketing Manager in NYC",
    coreMessage: "Efficiency and productivity without sacrificing personal time",
    positioning: "Premium solution for busy professionals",
    marketingAngle: "Time-saving benefits with professional quality",
    messagingApproach: "Professional, direct, benefit-focused",
    marketingChannels: ["LinkedIn", "Instagram", "Professional Networks"]
  },
  {
    name: "Small Business Owners",
    description: "Entrepreneurs and small business owners seeking growth",
    demographics: "Age: 30-50, Mixed urban/suburban, Business owners",
    painPoints: [
      "Limited resources",
      "Competitive market",
      "Time management"
    ],
    icp: "Mike, 42, Local Restaurant Owner",
    coreMessage: "Grow your business without growing your overhead",
    positioning: "Smart solution for ambitious entrepreneurs",
    marketingAngle: "Cost-effective growth enablement",
    messagingApproach: "Practical, ROI-focused, supportive",
    marketingChannels: ["Facebook", "Local Business Networks", "LinkedIn"]
  }
];

export async function generateAudiences(businessIdea: any, regenerationCount = 0, forceRegenerate = false) {
  console.log('Generating audiences for:', businessIdea);
  
  // For now, return mock data
  return {
    audiences: mockAudiences,
    message: "Generated 2 audience profiles based on your business idea"
  };
}