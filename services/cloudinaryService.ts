const CLOUD_NAME = "dkd1atopq";
const UPLOAD_PRESET = "Courses"; // Ensure this Unsigned preset exists in your Cloudinary settings

export const uploadToCloudinary = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);
  formData.append('cloud_name', CLOUD_NAME);

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Cloudinary upload failed:", errorData);
      throw new Error(`Upload failed: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.secure_url; // Returns the URL of the uploaded asset
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    throw error;
  }
};