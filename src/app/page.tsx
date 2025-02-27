"use client";
import { useState } from "react";

interface Scripture {
  reference: string;
  text?: string;
}

interface Focus {
  title?: string;
  points?: string[];
}

interface Devotional {
  day: number;
  content: string;
  image: File | string | null;
  title?: string;
  declaration?: string;
  focus?: Focus;
  furtherReading?: Scripture;
  scriptureReading?: Scripture;
  memoryVerse?: Scripture;
  coverImageUrl?: string;
  author?: string;
  isLegacy?: boolean;
}

interface ApiResponse {
  devotionals: Devotional[];
}

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<Devotional[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [devotionalImages, setDevotionalImages] = useState<
    Record<number, File>
  >({});

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
      const data: ApiResponse = await response.json();
      console.log("API Response:", data);
      setResult(data.devotionals);
    } catch (error) {
      console.error("Error uploading file:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (
    day: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (e.target.files) {
      setDevotionalImages((prev) => ({
        ...prev,
        [day]: e.target.files![0],
      }));
    }
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleUploadDevotional = async (devotional: Devotional) => {
    const imageFile = devotionalImages[devotional.day];
    let coverImageObj = {};
    if (imageFile) {
      try {
        const base64Image = await convertFileToBase64(imageFile);
        coverImageObj = {
          name: imageFile.name,
          type: imageFile.type,
          data: base64Image,
        };
      } catch (error) {
        console.error("Error converting file to base64", error);
      }
    }

    const payload = {
      content: devotional.content || "",
      date: devotional.day.toString(),
      declaration: devotional.declaration || "",
      focus:
        typeof devotional.focus === "string"
          ? { title: devotional.focus }
          : devotional.focus || {},
      furtherReading:
        typeof devotional.furtherReading === "string"
          ? { reference: devotional.furtherReading }
          : devotional.furtherReading || {},
      scriptureReading:
        typeof devotional.scriptureReading === "string"
          ? { reference: devotional.scriptureReading }
          : devotional.scriptureReading || {},
      memoryVerse:
        typeof devotional.memoryVerse === "string"
          ? { reference: devotional.memoryVerse }
          : devotional.memoryVerse || {},
      title: devotional.title || "",
      coverImage: coverImageObj,
      coverImageUrl: devotional.coverImageUrl || "Image",
      author: devotional.author || "Default Author",
      isLegacy: devotional.isLegacy !== undefined ? devotional.isLegacy : true,
    };

    try {
      const response = await fetch("https://api.streamsofjoy.app/devotional", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
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
        <input
          type="file"
          name="file"
          accept=".docx"
          onChange={handleFileChange}
          className="border p-2 rounded-md"
        />
        <button
          type="submit"
          className="bg-blue-500 text-white py-2 px-4 rounded-md"
        >
          Upload and Process
        </button>
      </form>
      {loading && <p>Processing file...</p>}
      {result && (
        <div className="mt-4">
          <h2 className="text-xl font-semibold mb-2">Processed Devotionals:</h2>

          {result &&
            result.map((devotional) => (
              <div key={devotional.day} className="mb-4">
                <pre className=" p-2 rounded whitespace-pre-wrap">
                  {JSON.stringify(devotional, null, 2)}
                </pre>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageChange(devotional.day, e)}
                  className="border p-2 mt-2 rounded-md"
                />
                <button
                  onClick={() => handleUploadDevotional(devotional)}
                  className="bg-blue-500 text-white py-1 px-3 rounded-md mt-2 ml-5"
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
