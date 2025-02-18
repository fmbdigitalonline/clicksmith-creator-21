
import type { SectionContentMap } from "../types/landingPageTypes";

interface Project {
  id: string;
  title: string;
  name?: string;
  business_idea: {
    description: string;
    valueProposition?: string;
  };
}

export const transformEdgeResponse = (data: any, project: Project): SectionContentMap => {
  // Ensure we have valid data
  if (!data) {
    throw new Error('No content received from edge function');
  }

  console.log('Transforming edge response:', data);

  // Transform hero section
  const hero = {
    content: {
      title: data.hero?.title || project.title || 'Welcome',
      subtitle: data.hero?.subtitle || data.hero?.title || 'Transform Your Business',
      description: data.hero?.description || project.business_idea?.description || '',
      cta: data.hero?.cta || 'Get Started',
      image: data.hero?.image || 'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b'
    },
    layout: "centered"
  };

  // Transform value proposition section
  const valueProposition = {
    content: {
      title: data.value_proposition?.title || 'Why Choose Us',
      subtitle: data.value_proposition?.subtitle || '',
      cards: Array.isArray(data.value_proposition?.items) 
        ? data.value_proposition.items 
        : []
    },
    layout: "grid"
  };

  // Transform features section
  const features = {
    content: {
      title: data.features?.title || 'Key Features',
      subtitle: data.features?.subtitle || 'Everything you need to succeed',
      items: Array.isArray(data.features?.items) 
        ? data.features.items 
        : []
    },
    layout: "grid"
  };

  // Transform proof/testimonials section
  const proof = {
    content: {
      title: data.proof?.title || 'What Our Clients Say',
      subtitle: data.proof?.subtitle || 'Success Stories',
      testimonials: Array.isArray(data.proof?.testimonials) 
        ? data.proof.testimonials 
        : []
    },
    layout: "grid"
  };

  // Transform pricing section
  const pricing = {
    content: {
      title: data.pricing?.title || 'Pricing Plans',
      subtitle: data.pricing?.subtitle || 'Choose the plan that works for you',
      plans: Array.isArray(data.pricing?.plans) 
        ? data.pricing.plans 
        : [
            {
              name: 'Basic',
              price: 'Free',
              features: ['Basic features']
            },
            {
              name: 'Pro',
              price: '$49/mo',
              features: ['All features']
            }
          ]
    },
    layout: "grid"
  };

  // Transform final CTA section
  const finalCta = {
    content: {
      title: data.finalCta?.title || 'Ready to Get Started?',
      description: data.finalCta?.description || 'Begin your journey today',
      buttonText: data.finalCta?.buttonText || 'Get Started'
    },
    layout: "centered"
  };

  // Transform footer section
  const footer = {
    content: {
      companyName: project.title || 'My Business',
      description: project.business_idea?.description || '',
      links: data.footer?.links || {
        product: ['Features', 'Pricing', 'Documentation'],
        company: ['About', 'Blog', 'Contact'],
        resources: ['Support', 'Privacy', 'Terms']
      }
    },
    layout: "grid"
  };

  return {
    hero,
    value_proposition: valueProposition,
    features,
    proof,
    pricing,
    finalCta,
    footer
  };
};
