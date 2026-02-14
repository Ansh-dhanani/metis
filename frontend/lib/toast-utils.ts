import { toast } from "sonner";

export const showFeatureNotImplemented = () => {
  toast.info("Feature not implemented yet", {
    description: "This feature is coming soon!",
    duration: 3000,
  });
};

export const showComingSoon = (feature?: string) => {
  toast.info(feature ? `${feature} - Coming Soon` : "Coming Soon", {
    description: "We're working hard to bring you this feature!",
    duration: 3000,
  });
};
