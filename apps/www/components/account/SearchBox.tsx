"use client";

import * as React from "react";
import { ArrowLeft, LogOut, Notebook, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@repo/ui/components/dialog";
import { Link } from "@/i18n/navigation";

// Define navigation items for searchable content

type NavigationItem = {
    id: string;
    href?: string;
    icon: React.ElementType;
    label?: string;
    translationKey?: string;
    action?: string;
    className?: string;
}

const navigationItems: NavigationItem[] = [
    { id: "home", href: "/home", icon: ArrowLeft, translationKey: "returnToDeniAI" },
    { id: "docs", href: "https://voids.top/docs", icon: Notebook, label: "Voids API Docs" },
];

const genericItems: NavigationItem[] = [
    { id: "logout", icon: LogOut, translationKey: "logout", action: "logout", className: "text-red-500" },
];

export function SearchBox() {
    const t = useTranslations("account.searchBox");
    const [open, setOpen] = React.useState(false);
    const [searchQuery, setSearchQuery] = React.useState("");
    const [filteredNavItems, setFilteredNavItems] = React.useState(navigationItems);
    const [filteredGenericItems, setFilteredGenericItems] = React.useState(genericItems);

    // Implement search logic
    React.useEffect(() => {
        if (!searchQuery.trim()) {
            // If search is empty, show all items
            setFilteredNavItems(navigationItems);
            setFilteredGenericItems(genericItems);
            return;
        }

        const lowerQuery = searchQuery.toLowerCase().trim();
        
        // Filter navigation items
        const navResults = navigationItems.filter(item => {
            const label = item.label || t(item.translationKey || "unknown");
            return label.toLowerCase().includes(lowerQuery);
        });
        
        // Filter generic items
        const genericResults = genericItems.filter(item => {
            const label = item.label || t(item.translationKey || "unknown");
            return label.toLowerCase().includes(lowerQuery);
        });
        
        setFilteredNavItems(navResults);
        setFilteredGenericItems(genericResults);
    }, [searchQuery, t]);

    // Handle logout action
    const handleLogout = () => {
        // TODO: Implement actual logout logic
        console.log("Logging out...");
        setOpen(false);
    };

    // Handle keyboard shortcuts
    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Open search dialog with Cmd+K or Ctrl+K
            if ((e.metaKey || e.ctrlKey) && e.key === "k") {
                e.preventDefault();
                setOpen(prev => !prev);
            }

            // Close with Escape
            if (e.key === "Escape" && open) {
                setOpen(false);
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [open]);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="outline"
                    className="w-[200px] justify-start text-sm text-muted-foreground"
                >
                    <Search className="mr-2 h-4 w-4" />
                    <span className="truncate">{t("triggerPlaceholder")}</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="p-0 border rounded-lg shadow-lg max-w-md w-full">
                <DialogTitle className="sr-only">Action menu</DialogTitle>
                <div className="border-b px-3 py-2">
                    <div className="flex items-center gap-2 bg-card rounded-md px-2 py-1">
                        <Search className="h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={t("triggerPlaceholder")}
                            className="bg-card py-2 text-sm text-muted-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-0 flex-1"
                            autoFocus
                        />
                    </div>
                </div>

                {filteredNavItems.length > 0 && (
                    <div className="px-3 py-2">
                        <div className="text-xs font-medium text-muted-foreground mb-2">
                            Navigation
                        </div>
                        <nav className="flex flex-col gap-1">
                            {filteredNavItems.map(item => {
                                const Icon = item.icon;
                                const label = item.label || t(item.translationKey || "unknown");
                                return (
                                    <Button 
                                        key={item.id}
                                        variant="ghost" 
                                        asChild 
                                        className="justify-start text-sm h-9"
                                        onClick={() => setOpen(false)}
                                    >
                                        <Link href={item.href || "#"}>
                                            <Icon className="mr-2 h-4 w-4" /> {label}
                                        </Link>
                                    </Button>
                                );
                            })}
                        </nav>
                    </div>
                )}

                {filteredGenericItems.length > 0 && (
                    <div className="px-3 py-2">
                        <div className="text-xs font-medium text-muted-foreground mb-2">
                            Generics
                        </div>
                        <nav className="flex flex-col gap-1">
                            {filteredGenericItems.map(item => {
                                const Icon = item.icon;
                                const label = item.label || t(item.translationKey || "unknown");
                                return (
                                    <Button
                                        key={item.id}
                                        variant="ghost"
                                        className={`justify-start text-sm h-9 ${item.className || ''}`}
                                        onClick={item.id === "logout" ? handleLogout : undefined}
                                    >
                                        <Icon className="mr-2 h-4 w-4" /> {label}
                                    </Button>
                                );
                            })}
                        </nav>
                    </div>
                )}

                {filteredNavItems.length === 0 && filteredGenericItems.length === 0 && (
                    <div className="px-3 py-6 text-center">
                        <p className="text-sm text-muted-foreground">
                            {t("noResults")}
                        </p>
                    </div>
                )}

                <div className="flex items-center justify-between border-t px-3 py-2">
                    <kbd className="inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                        <span className="text-xs">⌘</span>K
                    </kbd>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Go</span>
                        <kbd className="inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                            Enter
                        </kbd>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
