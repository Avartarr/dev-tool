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
  const [devotionalImages, setDevotionalImages] = useState<Record<number, File>>({});

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

  const handleImageChange = (day: number, e: React.ChangeEvent<HTMLInputElement>) => {
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

  // const handleUploadDevotional = async (devotional: Devotional) => {
  //   const formData = new FormData();
  
  //   // Map your parsed fields into the API structure:
  //   formData.append("content", devotional.content || "");
  //   // Use the devotional's date if available; otherwise, use the current ISO date.
  //   formData.append("date", devotional.day.toString());
  //   formData.append("declaration", devotional.declaration || "");
  //   // If your devotional object has textual versions, you can send them as JSON strings.
  //   // If the API expects objects, ensure you send valid JSON.
  //   formData.append("focus", JSON.stringify(devotional.focus || {}));
  //   formData.append("furtherReading", JSON.stringify(devotional.furtherReading || {}));
  //   formData.append("scriptureReading", JSON.stringify(devotional.scriptureReading || {}));
  //   formData.append("memoryVerse", JSON.stringify(devotional.memoryVerse || {}));
  //   formData.append("title", devotional.title || "");
    
  //   // Append the image file (cover image)
  //   // if (devotional.image) {
  //   //   if (devotional.image instanceof File) {
  //   //     formData.append("coverImage", devotional.image);
  //   //   } else if (typeof devotional.image === 'string') {
  //   //     // If it's a string URL, you might want to handle it differently
  //   //     formData.append("coverImageUrl", devotional.image);
  //   //   }
  //   // }

  //   const imageFile = devotionalImages[devotional.day];
  //   if (imageFile) {
  //     formData.append("coverImage", imageFile);
  //   }
    
  //   // If you already have a URL for the cover image (perhaps from a previous upload), include it.
  //   // Otherwise, leave it blank (the API might update it after processing the file).
  //   formData.append("coverImageUrl", devotional.coverImageUrl || "image");
    
  //   // You can also include an author – adjust this as needed.
  //   formData.append("author", devotional.author || "Default Author");
    
  //   // isLegacy is expected as a boolean – convert to string
  //   formData.append("isLegacy", (devotional.isLegacy !== undefined ? devotional.isLegacy : true).toString());
  
  //   try {
  //     const response = await fetch("https://api.streamsofjoy.app/devotional", {
  //       method: "POST",
  //       body: formData,
  //     });
  //     const data = await response.json();
  //     console.log("Uploaded devotional:", data);
  //   } catch (error) {
  //     console.error("Error uploading devotional:", error);
  //   }
  // };
  
  const handleUploadDevotional = async (devotional: Devotional) => {
    const formData = new FormData();
  
    formData.append("content", devotional.content || "");
    formData.append("date", devotional.day.toString());
    formData.append("declaration", devotional.declaration || "");
  
    // Convert string values into objects per API schema
    const focusObj =
      typeof devotional.focus === "string"
        ? { title: devotional.focus }
        : devotional.focus || {};
    formData.append("focus", JSON.stringify(focusObj));
  
    const furtherReadingObj =
      typeof devotional.furtherReading === "string"
        ? { reference: devotional.furtherReading }
        : devotional.furtherReading || {};
    formData.append("furtherReading", JSON.stringify(furtherReadingObj));
  
    const scriptureReadingObj =
      typeof devotional.scriptureReading === "string"
        ? { reference: devotional.scriptureReading }
        : devotional.scriptureReading || {};
    formData.append("scriptureReading", JSON.stringify(scriptureReadingObj));
  
    const memoryVerseObj =
      typeof devotional.memoryVerse === "string"
        ? { reference: devotional.memoryVerse }
        : devotional.memoryVerse || {};
    formData.append("memoryVerse", JSON.stringify(memoryVerseObj));
  
    formData.append("title", devotional.title || "");
  
    // Use the image file stored in devotionalImages (from the file input)
    const imageFile = devotionalImages[devotional.day];
  if (imageFile) {
    try {
      const base64Image = await convertFileToBase64(imageFile);
      const coverImageObj = {
        name: imageFile.name,
        type: imageFile.type,
        data: base64Image, // This is a base64-encoded string (e.g., "data:image/png;base64,...")
      };
      formData.append("coverImage", JSON.stringify(coverImageObj));
    } catch (error) {
      console.error("Error converting file to base64", error);
      formData.append("coverImage", JSON.stringify({}));
    }
  } else {
    formData.append("coverImage", JSON.stringify({}));
  }
  
    // Append coverImageUrl only once
    formData.append("coverImageUrl", devotional.coverImageUrl || "image");
  
    formData.append("author", devotional.author || "Default Author");
    formData.append("isLegacy", (devotional.isLegacy !== undefined ? devotional.isLegacy : true).toString());
  
    try {
      // const response = await fetch("https://api.streamsofjoy.app/devotional", {
      const response = await fetch("https://api.dukiapreciousmetals.co/api/devo", {

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
          {/* <pre className="bg-gray-800 text-white p-4 rounded mb-4 whitespace-pre-wrap">
            {JSON.stringify(result, null, 2)}
          </pre> */}
          {/* {result.map((devotional) => (
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
          ))} */}
          {result && result.map((devotional) => (
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
