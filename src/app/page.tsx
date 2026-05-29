"use client";

import { useState } from "react";

export default function Home() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageBase64, setImageBase64] = useState<string>("");
  const [keywords, setKeywords] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string>("");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string>("");

  // Helper function to convert the image to Base64
  // Helper function to handle the image selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 1. Store the file object (needed for advanced features later)
      setImageFile(file);

      // 2. Generate a temporary URL for browser preview
      const previewUrl = URL.createObjectURL(file);
      setImagePreviewUrl(previewUrl);

      // 3. Convert to Base64 for the API call
      const reader = new FileReader();
      reader.onloadend = () => {
        // Strip the data URL prefix so we just send the raw base64 string
        const base64String = (reader.result as string).split(",")[1];
        setImageBase64(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  // New function to clear the image state and revoke the URL
  const handleRemoveImage = () => {
    // Revoke the object URL to avoid memory leaks
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
    }
    // Clear all image-related state
    setImageFile(null);
    setImagePreviewUrl("");
    setImageBase64("");
  };

  const handleGenerate = async () => {
    if (!imageBase64) {
      setError("Hãy tải lên một hình ảnh sản phẩm.");
      return;
    }

    setLoading(true);
    setError("");
    setResults(null);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64, keywords }),
      });

      if (!response.ok) throw new Error("Failed to generate content");

      const data = await response.json();
      setResults(data);
    } catch (err) {
      setError("Đã xảy ra lỗi. Vui lòng thử lại.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Helper to copy text to clipboard
  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);

    // Reset back to "Copy" after 2 seconds
    setTimeout(() => {
      setCopiedIndex(null);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans text-gray-900">
      <div className="max-w-2xl mx-auto space-y-8">

        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Công Cụ Viết Content Bán Hàng AI</h1>
          <p className="text-gray-500">Tải ảnh sản phẩm lên để tạo ngay tiêu đề chuẩn SEO, bài đăng và hashtag.</p>
        </div>

        {/* Input Form */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Hình Ảnh Sản Phẩm</label>

            {/* Image Preview Box - Shows only if a URL exists */}
            {imagePreviewUrl ? (
              <div className="relative border p-2 rounded mb-3 bg-gray-50 flex items-center justify-center min-h-37.5">
                <img
                  src={imagePreviewUrl}
                  alt="Preview"
                  className="max-h-50 rounded object-contain"
                />
                <button
                  onClick={handleRemoveImage}
                  className="absolute top-2 right-2 bg-white/80 hover:bg-white text-gray-700 p-1 rounded-full shadow-sm"
                  title="Remove image"
                >
                  {/* Small X icon */}
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              // Show the standard file input if no image is selected
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="w-full text-sm border p-2 rounded cursor-pointer file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:bg-gray-100 file:text-gray-700 file:hover:bg-gray-200"
              />
            )}
          </div>




          <div>
            <label className="block text-sm font-medium mb-1">Từ Khóa (Tùy chọn)</label>
            <input
              type="text"
              placeholder="VD: Váy mùa hè, họa tiết hoa, vintage"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              className="w-full border p-2 rounded text-sm"
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition disabled:bg-gray-400"
          >
            {loading ? "Đang tạo..." : "Tạo Content"}
          </button>

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
        </div>

        {/* Results Section */}
        {results && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold border-b pb-2">Kết Quả Đã Tạo</h2>

            {/* Map through the results to create boxes */}
            {[
              { label: "Shopee Title", value: results.shopeeTitle },
              { label: "Product Description", value: results.productDescription },
              { label: "Facebook Caption", value: results.facebookCaption },
              { label: "TikTok Caption", value: results.tikTokCaption },
              { label: "Hashtags", value: results.hashtags },
            ].map((item, index) => (
              <div key={index} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold text-sm text-gray-700">{item.label}</h3>
                  <button
                    onClick={() => copyToClipboard(item.value, index)}
                    className={`text-xs px-2 py-1 rounded transition-colors ${copiedIndex === index
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 hover:bg-gray-200 text-gray-600"
                      }`}
                  >
                    {copiedIndex === index ? "Đã copy!" : "Copy"}
                  </button>
                </div>
                <p className="text-sm whitespace-pre-wrap">{item.value}</p>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}