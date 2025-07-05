import { Metadata } from "next";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Badge } from "@workspace/ui/components/badge";
import { ExternalLink, Globe } from "lucide-react";
import Link from "next/link";
import { Button } from "@workspace/ui/components/button";
import { BRAND_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: `Partners | ${BRAND_NAME}`,
  description:
    `Our trusted partners and collaborators who help make ${BRAND_NAME} possible.`,
};

const partners = [
  {
    id: 1,
    name: "No Partners",
    description:
      "Still looking for partners to help us build the future of AI.",
    category: "?",
    website: "#",
    established: "?",
    partnership: "?",
  },
  {
    id: 2,
    name: "No Partners",
    description:
      "Still looking for partners to help us build the future of AI.",
    category: "?",
    website: "#",
    established: "?",
    partnership: "?",
  },
  {
    id: 3,
    name: "No Partners",
    description:
      "Still looking for partners to help us build the future of AI.",
    category: "?",
    website: "#",
    established: "?",
    partnership: "?",
  },
];

const partnerCategories = [
  "All",
  "AI Technology",
  "Cloud Infrastructure",
  "Cloud Services",
  "AI Safety",
];

export default function PartnersPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Our Partners</h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          We collaborate with industry-leading organizations to deliver
          cutting-edge AI solutions and ensure the highest standards of
          innovation, security, and reliability.
        </p>
      </div>

      {/* Stats */}
      {/* <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-primary mb-2">{partners.length}+</div>
            <div className="text-sm text-muted-foreground">
              Technology Partners
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-primary mb-2">2+</div>
            <div className="text-sm text-muted-foreground">Cloud Providers</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-primary mb-2">100%</div>
            <div className="text-sm text-muted-foreground">Uptime SLA</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-primary mb-2">24/7</div>
            <div className="text-sm text-muted-foreground">
              Support Coverage
            </div>
          </CardContent>
        </Card>
      </div> */}

      {/* Partners Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {partners.map((partner) => (
          <Card key={partner.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                  <Globe className="w-6 h-6" />
                </div>
                <Badge variant="secondary">{partner.category}</Badge>
              </div>
              <CardTitle className="text-xl">{partner.name}</CardTitle>
              <CardDescription className="text-sm">
                {partner.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Partnership:</span>
                  <span className="font-medium">{partner.partnership}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Established:</span>
                  <span className="font-medium">{partner.established}</span>
                </div>
                <div className="pt-3 border-t">
                  <a
                    href={partner.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-sm text-primary hover:underline"
                  >
                    Visit Website
                    <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Partnership Benefits */}
      <div className="mb-12">
        <h2 className="text-3xl font-bold text-center mb-8">
          Partnership Benefits
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Private Compute Cloud</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Dedicated private cloud infrastructure for secure and efficient AI
                workloads.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Free and Unlimited Uses</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Enjoy free and unlimited usage of our AI services with no hidden
                costs.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Custom API</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Access to a custom API tailored to your specific needs and
                integration requirements.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Partnership Inquiry */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-8 text-center">
          <h3 className="text-2xl font-bold mb-4">
            Interested in Partnership?
          </h3>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            We're always looking for innovative partners to collaborate with. If
            you're interested in exploring partnership opportunities, we'd love
            to hear from you.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button disabled>
              {/* <Link href="mailto:partnerships@deni-ai.com"> */}
                Contact Partnerships Team <Badge variant="secondary">Soon</Badge>
              {/* </Link> */}
            </Button>
            <Button variant="outline" asChild>
              <Link href="/contact">General Inquiry</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
