

"use client";
import { useState } from "react";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [devotionalImages, setDevotionalImages] = useState<{ [key: string]: File }>({});

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    setLoading(true);

    try {
      const response = await fetch("/api/uploadDevotionals", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error("Error uploading file:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (day: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setDevotionalImages((prev) => ({
        ...prev,
        [day]: e.target.files[0],
      }));
    }
  };

  const handleUploadDevotional = async (devotional: any) => {
    const formData = new FormData();
    formData.append("day", devotional.day);
    formData.append("content", devotional.content);
    if (devotionalImages[devotional.day]) {
      formData.append("image", devotionalImages[devotional.day]);
    }
    try {
      const response = await fetch("/api/uploadDevotional", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      console.log("Uploaded devotional:", data);
    } catch (error) {
      console.error("Error uploading devotional:", error);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Devotional Uploader</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input type="file" name="file" accept=".docx" onChange={handleFileChange} className="border p-2 rounded-md" />
        <button type="submit" className="bg-green-500 text-white py-2 px-4 rounded-md">
          Upload and Process
        </button>
      </form>
      {loading && <p>Processing file...</p>}
      {result && (
        <div className="mt-4">
          <h2 className="text-xl font-semibold mb-2">Processed Devotionals:</h2>
          {/* <pre className="bg-gray-100 text-black p-4 rounded whitespace-pre-wrap">{JSON.stringify(result, null, 2)}</pre> */}
          {result.map((devotional) => (
        <div key={devotional.day} className="bg-black text-white p-4 rounded whitespace-pre-wrap mb-4">
          <strong>Day {devotional.day}:</strong>
          <div>{devotional.content}</div>
          <input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageChange(devotional.day, e)}
                className="border p-2 mt-2 rounded-md"
              />
              <button
                onClick={() => handleUploadDevotional(devotional)}
                className="bg-green-500 text-white py-1 px-3 rounded-md mt-2 mx-10"
              >
                Upload Devotional
              </button>
        </div>
  ))}
        </div>
      )}
    </div>
  );
}
