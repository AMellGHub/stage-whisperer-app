import { useEffect } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { toast } from "@/hooks/use-toast";

export function usePwaUpdate() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  useEffect(() => {
    if (needRefresh) {
      toast({
        title: "Update available",
        description: "A new version is ready. Tap to refresh.",
        duration: Infinity,
        action: (
          <button
            onClick={() => updateServiceWorker(true)}
            className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
          >
            Refresh
          </button>
        ),
      });
    }
  }, [needRefresh, updateServiceWorker]);
}
