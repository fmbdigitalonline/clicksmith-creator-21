
import Navigation from "@/components/Navigation";
import IndexFooter from "@/components/IndexFooter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Briefcase, MapPin, Clock } from "lucide-react";

const Careers = () => {
  const jobs = [
    {
      title: "Senior Full Stack Developer",
      location: "Remote",
      type: "Full-time",
      description: "We're looking for an experienced Full Stack Developer to join our growing team."
    },
    {
      title: "Product Designer",
      location: "Remote",
      type: "Full-time",
      description: "Join us in creating beautiful, intuitive interfaces for our AI-powered platform."
    },
    {
      title: "Marketing Manager",
      location: "Remote",
      type: "Full-time",
      description: "Lead our marketing efforts and help us reach more businesses worldwide."
    }
  ];

  return (
    <div className="flex flex-col w-full min-h-screen">
      <Navigation />
      <main className="flex-grow mt-16">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold mb-4">Join Our Team</h1>
              <p className="text-xl text-muted-foreground">
                Help us revolutionize how businesses approach marketing and growth
              </p>
            </div>

            <div className="grid gap-6">
              {jobs.map((job, index) => (
                <Card key={index} className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div className="space-y-2">
                      <h2 className="text-xl font-semibold">{job.title}</h2>
                      <div className="flex items-center gap-4 text-muted-foreground">
                        <span className="flex items-center">
                          <MapPin className="w-4 h-4 mr-1" />
                          {job.location}
                        </span>
                        <span className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {job.type}
                        </span>
                      </div>
                      <p className="text-muted-foreground">{job.description}</p>
                    </div>
                    <Button className="mt-4 md:mt-0">
                      <Briefcase className="w-4 h-4 mr-2" />
                      Apply Now
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </main>
      <IndexFooter />
    </div>
  );
};

export default Careers;
