import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiUploadCloud, FiMapPin, FiInfo, FiCheck, FiArrowLeft, FiArrowRight } from 'react-icons/fi';
import exifr from 'exifr';
import axios from '../api/axios';
import DashboardLayout from '../components/layout/DashboardLayout';
import GlassCard from '../components/ui/GlassCard';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import MapView from '../components/map/MapView';
import toast from 'react-hot-toast';

export default function NewReport() {
  const routerLocation = useLocation();
  const navigate = useNavigate();

  // Prefilled states from AI Detection page
  const prefilledImage = routerLocation.state?.prefilledImage;
  const detectionId = routerLocation.state?.detectionId;
  const prefilledGps = routerLocation.state?.gps;

  const [step, setStep] = useState(1);
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [locationCoords, setLocationCoords] = useState(prefilledGps || null);
  const [address, setAddress] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState('medium');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Address lookup map options
  const [mapCenter, setMapCenter] = useState([20.5937, 78.9629]); // India center default
  const [mapZoom, setMapZoom] = useState(5);
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    if (prefilledImage) {
      setImages([prefilledImage]);
      const url = URL.createObjectURL(prefilledImage);
      setImagePreviews([url]);
    }
    if (prefilledGps) {
      setLocationCoords(prefilledGps);
      setMapCenter([prefilledGps.lat, prefilledGps.lng]);
      setMapZoom(14);
      reverseGeocode(prefilledGps.lat, prefilledGps.lng);
    }
  }, [prefilledImage, prefilledGps]);

  // Watch user location for accuracy circle and pulsing dot
  useEffect(() => {
    if (!navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude, accuracy });
      },
      (err) => {
        console.warn('NewReport geolocation watch error:', err);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  const handleImageChange = async (e) => {
    const files = Array.from(e.target.files);
    if (!files || files.length === 0) return;

    const validFiles = files.filter(file => file.type.startsWith('image/'));
    if (validFiles.length !== files.length) {
      toast.error('Only image files are allowed');
    }

    setImages(prev => [...prev, ...validFiles]);
    const urls = validFiles.map(file => URL.createObjectURL(file));
    setImagePreviews(prev => [...prev, ...urls]);

    // Try to read GPS from the first uploaded image if not already set
    if (!locationCoords && validFiles[0]) {
      try {
        const gps = await exifr.gps(validFiles[0]);
        if (gps && gps.latitude && gps.longitude) {
          setLocationCoords({ lat: gps.latitude, lng: gps.longitude });
          setMapCenter([gps.latitude, gps.longitude]);
          setMapZoom(14);
          reverseGeocode(gps.latitude, gps.longitude);
          toast.success('Extracted GPS location from image EXIF!');
        }
      } catch (err) {
        console.log('No EXIF GPS in uploaded image');
      }
    }
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const detectLiveLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    if (userLocation) {
      setLocationCoords({ lat: userLocation.lat, lng: userLocation.lng });
      setMapCenter([userLocation.lat, userLocation.lng]);
      setMapZoom(16);
      reverseGeocode(userLocation.lat, userLocation.lng);
      toast.success('Centered on your live location!');
    } else {
      const toastId = toast.loading('Detecting your live location...');
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude, accuracy });
          setLocationCoords({ lat: latitude, lng: longitude });
          setMapCenter([latitude, longitude]);
          setMapZoom(16);
          reverseGeocode(latitude, longitude);
          toast.success('Live location updated!', { id: toastId });
        },
        (error) => {
          console.error(error);
          toast.error('Could not retrieve your live location. Try clicking the map instead.', { id: toastId });
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  };

  const handleMapClick = (latlng) => {
    setLocationCoords(latlng);
    reverseGeocode(latlng.lat, latlng.lng);
  };

  const reverseGeocode = async (lat, lng) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      const data = await response.json();
      if (data && data.display_name) {
        setAddress(data.display_name);
      } else {
        setAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
      }
    } catch (err) {
      console.warn('Geocoder failed, using coordinates instead.');
      setAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !description || !locationCoords || images.length === 0) {
      toast.error('Please fill in all details and set location');
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading('Submitting road complaint report...');

    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('severity', severity);
    formData.append('address', address);
    formData.append('coordinates', JSON.stringify([locationCoords.lng, locationCoords.lat])); // GeoJSON: [lng, lat]
    
    if (detectionId) {
      formData.append('detectionResults', detectionId);
    }

    images.forEach(img => {
      formData.append('images', img);
    });

    try {
      const response = await axios.post('/reports', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (response.data.success) {
        toast.success('Report submitted successfully! Municipal administrators have been notified.', { id: toastId });
        navigate('/reports');
      } else {
        throw new Error(response.data.message || 'Submission failed');
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Error submitting report', { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step Navigations
  const nextStep = () => {
    if (step === 1 && images.length === 0) {
      toast.error('Please upload at least one image');
      return;
    }
    if (step === 2 && !locationCoords) {
      toast.error('Please pin the location on the map');
      return;
    }
    setStep(prev => prev + 1);
  };

  const prevStep = () => {
    setStep(prev => prev - 1);
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 max-w-4xl mx-auto">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Submit New Road Report</h1>
          <p className="text-white/60 mt-1">Help the city municipality. Report damaged lanes, potholes, or structural cracks.</p>
        </div>

        {/* Steps Progress */}
        <div className="relative">
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/10 -translate-y-1/2 z-0" />
          <div
            className="absolute top-1/2 left-0 h-0.5 bg-primary-500 -translate-y-1/2 z-0 transition-all duration-300"
            style={{ width: `${((step - 1) / 3) * 100}%` }}
          />
          <div className="relative flex justify-between z-10">
            {[1, 2, 3, 4].map((num) => (
              <div
                key={num}
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-all duration-300 ${
                  step > num
                    ? 'bg-primary-500 border-primary-500 text-white'
                    : step === num
                    ? 'bg-dark-100 border-accent-400 text-accent-400 shadow-lg shadow-accent-500/10'
                    : 'bg-dark-200 border-white/10 text-white/40'
                }`}
              >
                {step > num ? <FiCheck className="w-5 h-5" /> : num}
              </div>
            ))}
          </div>
        </div>

        <GlassCard className="p-8 min-h-[450px]">
          {/* Step 1: Images */}
          {step === 1 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
              <div>
                <h3 className="text-lg font-bold">Step 1: Upload Damage Photos</h3>
                <p className="text-sm text-white/50 mt-1">Upload clear images of the damaged street surface.</p>
              </div>

              <div className="relative border-2 border-dashed border-white/10 rounded-2xl p-10 hover:border-accent-400 hover:bg-white/5 transition-all text-center flex flex-col items-center justify-center group">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <FiUploadCloud className="w-12 h-12 text-white/30 group-hover:text-accent-400 transition-colors mb-3" />
                <p className="font-bold text-sm text-white/80">Click or Drag images here to upload</p>
                <p className="text-xs text-white/40 mt-1.5">JPEG, JPG, PNG, WEBP files up to 10MB each</p>
              </div>

              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
                  {imagePreviews.map((url, idx) => (
                    <div key={idx} className="relative aspect-square rounded-xl overflow-hidden group border border-white/10">
                      <img src={url} alt="Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 hover:bg-rose-600 text-white transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-end pt-4">
                <Button variant="primary" onClick={nextStep} className="flex items-center gap-2">
                  Next Step <FiArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 2: Location */}
          {step === 2 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
              <div>
                <h3 className="text-lg font-bold">Step 2: Pin Location</h3>
                <p className="text-sm text-white/50 mt-1">Provide exact coordinates. Use your live GPS or select manually on the map.</p>
              </div>

              <div className="flex gap-4">
                <Button variant="secondary" onClick={detectLiveLocation} className="flex items-center gap-2">
                  <FiMapPin className="w-4 h-4" /> Detect My Live GPS
                </Button>
              </div>

              <div className="h-[350px] rounded-2xl overflow-hidden border border-white/10">
                <MapView
                  center={mapCenter}
                  zoom={mapZoom}
                  onLocationSelect={handleMapClick}
                  selectedLocation={locationCoords}
                  userLocation={userLocation}
                />
              </div>

              {locationCoords && (
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-1.5">
                  <p className="text-xs text-white/40">Reverse Geocoded Address:</p>
                  <p className="text-sm font-medium text-white">{address || 'Geocoding...'}</p>
                  <p className="text-[10px] text-white/30">
                    Lat: {locationCoords.lat.toFixed(6)} | Lng: {locationCoords.lng.toFixed(6)}
                  </p>
                </div>
              )}

              <div className="flex justify-between pt-4">
                <Button variant="ghost" onClick={prevStep} className="flex items-center gap-2">
                  <FiArrowLeft className="w-4 h-4" /> Back
                </Button>
                <Button variant="primary" onClick={nextStep} className="flex items-center gap-2" disabled={!locationCoords}>
                  Next Step <FiArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Details */}
          {step === 3 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
              <div>
                <h3 className="text-lg font-bold">Step 3: Enter Damage Description</h3>
                <p className="text-sm text-white/50 mt-1">Specify severity and provide auxiliary details for public safety workers.</p>
              </div>

              <div className="space-y-5">
                <Input
                  label="Report Title"
                  placeholder="e.g. Major deep pothole near Andheri subway"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-white/50">Severity Level</label>
                  <div className="grid grid-cols-3 gap-4">
                    {['low', 'medium', 'high'].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setSeverity(val)}
                        className={`py-3 rounded-xl border font-semibold text-sm capitalize transition-all ${
                          severity === val
                            ? val === 'low'
                              ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 shadow-md shadow-emerald-500/5'
                              : val === 'medium'
                              ? 'bg-amber-500/10 border-amber-500 text-amber-400 shadow-md shadow-amber-500/5'
                              : 'bg-rose-500/10 border-rose-500 text-rose-400 shadow-md shadow-rose-500/5'
                            : 'bg-white/5 border-white/10 hover:bg-white/10 text-white/60'
                        }`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-white/50">Describe Damage Detail</label>
                  <textarea
                    placeholder="Provide details of the damaged surface, hazard level, approximate size or depth, impact on flow, etc."
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full rounded-xl bg-white/5 border border-white/10 focus:border-accent-400 focus:ring-0 p-4 text-white text-sm"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="ghost" onClick={prevStep} className="flex items-center gap-2">
                  <FiArrowLeft className="w-4 h-4" /> Back
                </Button>
                <Button variant="primary" onClick={nextStep} className="flex items-center gap-2" disabled={!title || !description}>
                  Next Step <FiArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 4: Review & Submit */}
          {step === 4 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
              <div>
                <h3 className="text-lg font-bold">Step 4: Review & Submit Report</h3>
                <p className="text-sm text-white/50 mt-1">Review the details before pushing it to the municipal system.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-y border-white/10 py-6 text-sm">
                <div className="space-y-4">
                  <div>
                    <span className="text-xs text-white/40 block">Report Title:</span>
                    <span className="font-bold text-white text-base">{title}</span>
                  </div>
                  <div>
                    <span className="text-xs text-white/40 block">Damage Severity:</span>
                    <span className={`font-bold capitalize text-sm ${
                      severity === 'high' ? 'text-rose-400' : severity === 'medium' ? 'text-amber-400' : 'text-emerald-400'
                    }`}>
                      {severity} Severity
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-white/40 block">Location Coordinates & Address:</span>
                    <span className="text-white/80 block mt-1 leading-relaxed">{address}</span>
                    <span className="text-xs text-white/30 block mt-0.5">Lat: {locationCoords?.lat.toFixed(6)} | Lng: {locationCoords?.lng.toFixed(6)}</span>
                  </div>
                  <div>
                    <span className="text-xs text-white/40 block">Description Notes:</span>
                    <p className="text-white/70 leading-relaxed mt-1">{description}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <span className="text-xs text-white/40 block">Report Images:</span>
                  <div className="grid grid-cols-3 gap-2">
                    {imagePreviews.map((url, idx) => (
                      <div key={idx} className="aspect-square rounded-xl overflow-hidden border border-white/10 bg-white/5">
                        <img src={url} alt="Confirm" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                  {detectionId && (
                    <div className="flex items-center gap-2 p-3.5 rounded-xl bg-accent-500/10 border border-accent-500/20 text-accent-400 text-xs">
                      <FiInfo className="w-5 h-5 shrink-0" />
                      <span>Linked with AI Detection model results. Bounding boxes are stored.</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="ghost" onClick={prevStep} className="flex items-center gap-2">
                  <FiArrowLeft className="w-4 h-4" /> Back
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSubmit}
                  loading={isSubmitting}
                  className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500"
                >
                  <FiCheck className="w-5 h-5" /> Submit Complaint
                </Button>
              </div>
            </motion.div>
          )}
        </GlassCard>
      </div>
    </DashboardLayout>
  );
}
