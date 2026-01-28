import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type InsertClass } from "@shared/routes";

export function useClasses() {
  return useQuery({
    queryKey: [api.teacher.getClasses.path],
    queryFn: async () => {
      const res = await fetch(api.teacher.getClasses.path);
      if (!res.ok) throw new Error("Failed to fetch classes");
      return api.teacher.getClasses.responses[200].parse(await res.json());
    },
  });
}

export function useCreateClass() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertClass) => {
      const res = await fetch(api.teacher.createClass.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create class");
      return api.teacher.createClass.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.teacher.getClasses.path] });
    },
  });
}

export function useAnalytics(classId?: number) {
  return useQuery({
    queryKey: [api.teacher.getAnalytics.path, classId],
    queryFn: async () => {
      const url = classId 
        ? `${api.teacher.getAnalytics.path}?classId=${classId}` 
        : api.teacher.getAnalytics.path;
      
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch analytics");
      return api.teacher.getAnalytics.responses[200].parse(await res.json());
    },
  });
}
