import { Compass } from "lucide-react";
import { Link } from "react-router";

import { buttonVariants } from "../components/ui/button";
import { Card } from "../components/ui/card";

export function NotFoundPage() {
  return (
    <Card className="flex flex-col items-center gap-3 px-6 py-16 text-center">
      <Compass className="size-7 text-ink-muted" aria-hidden="true" />
      <h1 className="text-lg font-semibold text-ink">Page not found</h1>
      <p className="text-sm text-ink-muted">The page you are looking for does not exist.</p>
      <Link to="/" className={buttonVariants({ size: "sm", className: "mt-2" })}>
        Back to dashboard
      </Link>
    </Card>
  );
}
