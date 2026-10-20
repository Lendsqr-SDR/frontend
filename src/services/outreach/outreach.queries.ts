import { useMutation } from "@tanstack/react-query";
import { OutreachService } from "./outreach.service";

export function useOutreachSearch() {
  return useMutation({
    mutationFn: ({ query, accessToken }: { query: string; accessToken: string }) =>
      OutreachService.search(query, accessToken),
  });
}
