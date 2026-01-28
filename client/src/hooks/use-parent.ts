import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";

export function useChildren() {
  return useQuery({
    queryKey: [api.parent.getChildren.path],
    queryFn: async () => {
      const res = await fetch(api.parent.getChildren.path);
      if (!res.ok) throw new Error("Failed to fetch children");
      return api.parent.getChildren.responses[200].parse(await res.json());
    },
  });
}
