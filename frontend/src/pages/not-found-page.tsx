import { ArrowLeft, Compass } from "lucide-react";
import { Link } from "react-router";

import { EmptyState } from "../components/empty-state";
import { buttonVariants } from "../components/ui/button";
import { Card } from "../components/ui/card";

export function NotFoundPage() {
  return (
    <Card className="motion-safe:animate-rise">
      <EmptyState
        icon={Compass}
        title="Page not found"
        actions={
          <Link to="/" className={buttonVariants({ size: "sm" })}>
            <ArrowLeft aria-hidden="true" /> Back to dashboard
          </Link>
        }
      >
        <span className="font-mono text-xs text-fg-muted">404</span> · The page you are looking for does not exist.
      </EmptyState>
    </Card>
  );
}
