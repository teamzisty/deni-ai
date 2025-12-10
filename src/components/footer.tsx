import Link from "next/link";

const Footer = () => {
  return (
    <footer className="bg-background text-muted-foreground py-12 px-4">
      <div className="max-w-7xl mx-auto mt-8 pt-8 border-t border-border flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">© 2025 Zisty.</span>
        </div>
        <Link
          href="/status"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          Status
        </Link>
      </div>
    </footer>
  );
};

export default Footer;
