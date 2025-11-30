import React, { useState, useRef, useEffect } from 'react';
import { Upload, Download, Type, Grid, X, LayoutTemplate } from 'lucide-react';

export default function ImgMerger() {
  const [images, setImages] = useState([]);
  const [title, setTitle] = useState("Add a Short Heading for your image");
  const [showTitle, setShowTitle] = useState(true);
  const [bgColor, setBgColor] = useState("#ffffff");
  const [gap, setGap] = useState(20);
  const canvasRef = useRef(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Handle file uploads
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const newImages = files.map(file => {
      const reader = new FileReader();
      return new Promise((resolve) => {
        reader.onload = (e) => resolve(e.target.result);
        reader.readAsDataURL(file);
      });
    });

    Promise.all(newImages).then(imgData => {
      setImages(prev => [...prev, ...imgData].slice(0, 50)); // Limit to 4 for the grid
    });
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  // Draw on Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // A4 Portrait ratio-ish (or just a nice flexible height)
    // We'll calculate height based on content
    const canvasWidth = 1200;
    const headerHeight = showTitle ? 100 : 0;
    const padding = 40;
    
    // Calculate grid dimensions
    // We assume a 2 column layout for 4 images
    const cols = 2;
    // Calculate width of a single image slot
    const slotWidth = (canvasWidth - (padding * 2) - (gap * (cols - 1))) / cols;
    // Assume certificates are roughly 4:3 or 16:9. We'll use a fixed aspect ratio for the slot
    // to keep the grid uniform, or calculate based on the first image. 
    // Let's use 16:10 aspect ratio for standard certificates to ensure they fit nicely.
    const slotHeight = slotWidth * 0.70; 

    const rows = Math.ceil(Math.max(images.length, 1) / cols);
    const canvasHeight = headerHeight + (padding * 2) + (rows * slotHeight) + ((rows - 1) * gap);

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    // Fill Background
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Draw Title
    if (showTitle) {
      ctx.fillStyle = "#1e293b"; // Slate-800
      ctx.font = "bold 40px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(title, canvasWidth / 2, headerHeight / 2 + 20);
    }

    // Draw Images
    if (images.length > 0) {
      images.forEach((src, index) => {
        const img = new Image();
        img.src = src;
        img.onload = () => {
          const col = index % cols;
          const row = Math.floor(index / cols);

          const x = padding + (col * (slotWidth + gap));
          const y = headerHeight + padding + (row * (slotHeight + gap));

          // Draw image keeping aspect ratio 'cover' or 'contain' style
          // For certificates, 'contain' inside the slot is better so we don't cut off text, 
          // but usually we want them to fill the grid. Let's try to fit width.
          
          // Calculate scaling to fit width
          const scale = slotWidth / img.width;
          const drawHeight = img.height * scale;
          
          // If the image is taller than the slot, we might need to center it or crop it.
          // Since these are certificates, they are usually landscape.
          // We will draw them to fit the width and center vertically in the slot if needed.
          
          const yOffset = (slotHeight - drawHeight) / 2;

          // Optional: Add a subtle shadow behind each cert
          ctx.shadowColor = "rgba(0, 0, 0, 0.15)";
          ctx.shadowBlur = 15;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 4;
          
          ctx.drawImage(img, x, y + (drawHeight < slotHeight ? yOffset : 0), slotWidth, drawHeight);
          
          // Reset shadow for next elements
          ctx.shadowColor = "transparent";
          ctx.shadowBlur = 0;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;

          // Draw a clean border around the image
          ctx.strokeStyle = "#e2e8f0";
          ctx.lineWidth = 2;
          ctx.strokeRect(x, y + (drawHeight < slotHeight ? yOffset : 0), slotWidth, drawHeight);
        };
      });
    } else {
      // Draw placeholders
      ctx.strokeStyle = "#cbd5e1";
      ctx.lineWidth = 2;
      ctx.setLineDash([10, 10]);
      
      for(let i=0; i<4; i++) {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = padding + (col * (slotWidth + gap));
        const y = headerHeight + padding + (row * (slotHeight + gap));
        
        ctx.strokeRect(x, y, slotWidth, slotHeight);
        
        ctx.fillStyle = "#cbd5e1";
        ctx.font = "20px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(`Certificate ${i+1}`, x + slotWidth/2, y + slotHeight/2);
      }
      ctx.setLineDash([]);
    }

  }, [images, title, showTitle, bgColor, gap]);

  const downloadCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const link = document.createElement('a');
    link.download = 'Cert_Combiner.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans text-gray-800">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Controls Section */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h1 className="text-2xl font-bold mb-4 text-indigo-700 flex items-center gap-2">
              <LayoutTemplate className="w-6 h-6" />
              Cert Combiner
            </h1>
            <p className="text-sm text-gray-500 mb-6">
              Upload your images to merge in one place for better view add pictures in even numbers
              
            </p>

            <div className="space-y-4">
              {/* File Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Upload Images</label>
                <div className="relative border-2 border-dashed border-indigo-200 rounded-lg p-6 hover:bg-indigo-50 transition-colors text-center cursor-pointer group">
                  <input 
                    type="file" 
                    multiple 
                    accept="image/*" 
                    onChange={handleImageUpload} 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <Upload className="w-8 h-8 mx-auto text-indigo-400 mb-2 group-hover:scale-110 transition-transform" />
                  <p className="text-sm text-indigo-600 font-medium">Click to upload images</p>
                  <p className="text-xs text-gray-400 mt-1">Select files</p>
                </div>
              </div>

              {/* Title Input */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium text-gray-700">Header Title</label>
                  <label className="flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={showTitle} 
                      onChange={(e) => setShowTitle(e.target.checked)}
                      className="sr-only peer"
                      placeholder='Enter'
                    />
                    <div className="relative w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <Type className="w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    disabled={!showTitle}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Spacing Control */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Grid Spacing</label>
                <input 
                  type="range" 
                  min="0" 
                  max="50" 
                  value={gap} 
                  onChange={(e) => setGap(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>

              {/* Image List */}
              {images.length > 0 && (
                <div className="border-t border-gray-100 pt-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Loaded Images ({images.length})</p>
                  <div className="grid grid-cols-4 gap-2">
                    {images.map((img, idx) => (
                      <div key={idx} className="relative group aspect-video bg-gray-100 rounded overflow-hidden border border-gray-200">
                        <img src={img} alt={`cert-${idx}`} className="w-full h-full object-cover" />
                        <button 
                          onClick={() => removeImage(idx)}
                          className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                        >
                          <X className="w-4 h-4 text-white" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Download Button */}
              <button
                onClick={downloadCanvas}
                disabled={images.length === 0}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg mt-4"
              >
                <Download className="w-5 h-5" />
                Download Final Image
              </button>
            </div>
          </div>

          {/* <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-sm text-blue-800">
            <p className="font-semibold mb-1">💡 Pro Tip for LinkedIn:</p>
            When you post this image, mention your key learnings for each certificate (Node.js, React, etc.) in the post description to attract recruiters!
          </div> */}
        </div>

        {/* Preview Section */}
        <div className="lg:col-span-2 bg-gray-200/50 rounded-xl p-4 md:p-8 flex items-center justify-center overflow-hidden border border-gray-300">
           <div className="shadow-2xl rounded-sm overflow-hidden bg-white max-w-full">
             <canvas 
               ref={canvasRef} 
               style={{ 
                 maxWidth: '100%', 
                 height: 'auto',
                 display: 'block' 
               }}
             />
           </div>
        </div>

      </div>
    </div>
  );
}