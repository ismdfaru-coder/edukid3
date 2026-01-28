import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";

export function useTopics(stage?: string, subjectId?: number) {
  return useQuery({
    queryKey: [api.learning.getTopics.path, stage, subjectId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (stage) params.append("stage", stage);
      if (subjectId) params.append("subjectId", String(subjectId));
      
      const url = params.toString() 
        ? `${api.learning.getTopics.path}?${params.toString()}` 
        : api.learning.getTopics.path;
      
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch topics");
      return api.learning.getTopics.responses[200].parse(await res.json());
    },
  });
}

export function useQuestion(topicId: number) {
  return useQuery({
    queryKey: [api.learning.getNextQuestion.path, topicId],
    queryFn: async () => {
      const url = buildUrl(api.learning.getNextQuestion.path) + `?topicId=${topicId}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch question");
      return api.learning.getNextQuestion.responses[200].parse(await res.json());
    },
    enabled: !!topicId,
    staleTime: 0, // Always get a fresh question
  });
}

export function useSubmitAnswer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { questionId: number; answer: string; timeTaken: number }) => {
      const res = await fetch(api.learning.submitAnswer.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to submit answer");
      return api.learning.submitAnswer.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      // Invalidate questions so we get a new one next time
      queryClient.invalidateQueries({ queryKey: [api.learning.getNextQuestion.path] });
      // Update topics to reflect new mastery scores
      queryClient.invalidateQueries({ queryKey: [api.learning.getTopics.path] });
      // Update user coins
      queryClient.invalidateQueries({ queryKey: [api.auth.me.path] });
    },
  });
}
