import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUploadCloud, FiImage, FiX } from 'react-icons/fi';
import { formatFileSize } from '../../utils/helpers';

const ImageUploader = ({ onUpload, preview, onClear, uploading = false, progress = 0 }) => {
  const onDrop = useCallback(
    (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        onUpload(acceptedFiles[0]);
      }
    },
    [onUpload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] },
    maxSize: 10 * 1024 * 1024,
    multiple: false,
    disabled: uploading,
  });

  return (
    <div className="w-full">
      <AnimatePresence mode="wait">
        {preview ? (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative glass-card p-2 group"
          >
            <img
              src={preview}
              alt="Upload preview"
              className="w-full max-h-96 object-contain rounded-xl"
            />
            {!uploading && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClear();
                }}
                className="absolute top-4 right-4 p-2 rounded-full bg-dark-100/80 hover:bg-rose-500/80 text-white transition-all opacity-0 group-hover:opacity-100"
                aria-label="Remove image"
              >
                <FiX className="w-4 h-4" />
              </button>
            )}
            {uploading && (
              <div className="absolute inset-0 bg-dark-200/60 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center">
                <div className="w-48 h-2 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-primary-500 to-accent-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                <p className="text-sm text-white/70 mt-3">Analyzing image... {progress}%</p>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            {...getRootProps()}
            className={`glass-card p-12 cursor-pointer transition-all duration-300 text-center ${
              isDragActive
                ? 'border-primary-500 bg-primary-500/10 shadow-lg shadow-primary-500/10'
                : 'hover:bg-white/10 hover:border-white/20'
            }`}
          >
            <input {...getInputProps()} />
            <motion.div
              animate={isDragActive ? { scale: 1.1, y: -8 } : { scale: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="flex flex-col items-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500/20 to-accent-500/20 flex items-center justify-center mb-4">
                {isDragActive ? (
                  <FiImage className="w-8 h-8 text-primary-400" />
                ) : (
                  <FiUploadCloud className="w-8 h-8 text-white/50" />
                )}
              </div>
              <p className="text-sm font-medium text-white/80 mb-1">
                {isDragActive ? 'Drop your image here' : 'Drag & drop an image, or click to browse'}
              </p>
              <p className="text-xs text-white/40">
                JPEG, PNG, WebP • Max 10MB
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ImageUploader;
