export function AppFooter() {
  return (
    <footer className="py-6 md:px-8 md:py-0 border-t border-border/40 bg-background">
      <div className="container flex flex-col items-center justify-between gap-4 md:h-20 md:flex-row">
        <p className="text-balance text-center text-sm leading-loose text-muted-foreground md:text-left">
          Built for demonstration purposes. The source code is available on GitHub (placeholder).
        </p>
        <p className="text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Crotos. All Rights Reserved. This is a simulation, no real money is involved.
        </p>
      </div>
    </footer>
  );
}
