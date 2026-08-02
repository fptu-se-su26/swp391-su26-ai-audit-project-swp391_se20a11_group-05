import imageCompression from "browser-image-compression";

/**
 * Nén hình ảnh tự động nếu dung lượng lớn hơn 200KB.
 * Nếu không phải file ảnh hoặc dung lượng nhỏ, trả về file gốc.
 */
export async function compressImageIfNeeded(file: File): Promise<File> {
  // Chỉ nén các file hình ảnh, bỏ qua video hoặc các định dạng khác
  if (!file.type.startsWith("image/")) {
    return file;
  }

  // Bỏ qua nén nếu file ảnh đã nhẹ hơn 200KB
  if (file.size < 200 * 1024) {
    return file;
  }

  const options = {
    maxSizeMB: 1, // Dung lượng tối đa mong muốn (1MB)
    maxWidthOrHeight: 1920, // Kích thước tối đa chiều ngang hoặc dọc
    useWebWorker: true,
  };

  try {
    const compressedFile = await imageCompression(file, options);
    // Trả về đối tượng File mới giữ nguyên tên của file gốc
    return new File([compressedFile], file.name, {
      type: compressedFile.type,
      lastModified: Date.now(),
    });
  } catch (error) {
    console.error("[ImageCompression] Nén ảnh thất bại, dùng file gốc:", error);
    return file;
  }
}
