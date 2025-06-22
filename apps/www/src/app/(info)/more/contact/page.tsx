import { SiX } from "@icons-pack/react-simple-icons";
import { Button } from "@workspace/ui/components/button";
import { Mail } from "lucide-react";
import Link from "next/link";

export default function ContactPage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight mb-4">Contact Us</h1>
        <p className="text-xl text-muted-foreground mb-8">
          Get in touch with our team
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="max-w-md mx-auto">
          <div className="bg-card rounded-lg border p-6 text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <Mail className="h-6 w-6 text-primary" />
              </div>
            </div>
            <h2 className="text-xl font-semibold mb-2">Email Us</h2>
            <p className="text-muted-foreground mb-4">
              Send us an email and we'll get back to you as soon as possible.
            </p>
            <a
              href="mailto:raic_dev@proton.me"
              className="inline-flex items-center gap-2 text-primary hover:underline font-medium"
            >
              <Mail className="h-4 w-4" />
              raic_dev@proton.me
            </a>
          </div>
        </div>

        <div className="max-w-md mx-auto">
          <div className="bg-card rounded-lg border p-6 text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <SiX className="h-6 w-6 text-primary" />
              </div>
            </div>
            <h2 className="text-xl font-semibold mb-2">Contact with X</h2>
            <p className="text-muted-foreground mb-4">
              Send us a direct message and we'll get back to you as soon as
              possible.
            </p>
            <a
              href="mailto:raic_dev@proton.me"
              className="inline-flex items-center gap-2 text-primary hover:underline font-medium"
            >
              <SiX className="h-4 w-4" />
              @deniaiapp
            </a>
          </div>
        </div>
      </div>

      <div className="mt-12 text-center">
        <p className="text-muted-foreground">
          We aim to respond to all inquiries within 24-48 hours.
        </p>
      </div>

      <div className="text-center mt-16">
        <h1 className="text-4xl font-bold tracking-tight mb-4">
          Do you want to partner with us?
        </h1>
        <p className="text-xl text-muted-foreground mb-8">
          If you are interested in partnering with us, please reach out via
          email or X. We are always open to collaboration and new opportunities.
        </p>

        <Button asChild>
          <Link href="/more/partners">Learn more</Link>
        </Button>
      </div>
    </div>
  );
}
