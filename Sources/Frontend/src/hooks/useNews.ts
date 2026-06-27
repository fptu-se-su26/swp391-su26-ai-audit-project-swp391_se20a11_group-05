import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { newsApi, type NewsRequest } from "@/lib/api";
import { toast } from "sonner";

export function useNewsList(page = 0, size = 10, category?: string, keyword?: string) {
  return useQuery({
    queryKey: ["news", page, size, category, keyword],
    queryFn: () => newsApi.getAll(page, size, category, keyword),
    placeholderData: (previousData) => previousData,
    retry: false,
  });
}

export function useNewsDetail(id: number | string) {
  return useQuery({
    queryKey: ["news", id],
    queryFn: () => newsApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateNews() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: NewsRequest) => newsApi.create(data),
    onSuccess: () => {
      toast.success("Tạo tin tức thành công");
      queryClient.invalidateQueries({ queryKey: ["news"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Không thể tạo tin tức");
    },
  });
}

export function useUpdateNews() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number | string; data: NewsRequest }) =>
      newsApi.update(id, data),
    onSuccess: () => {
      toast.success("Cập nhật tin tức thành công");
      queryClient.invalidateQueries({ queryKey: ["news"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Không thể cập nhật tin tức");
    },
  });
}

export function useDeleteNews() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number | string) => newsApi.delete(id),
    onSuccess: () => {
      toast.success("Xóa tin tức thành công");
      queryClient.invalidateQueries({ queryKey: ["news"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Không thể xóa tin tức");
    },
  });
}
