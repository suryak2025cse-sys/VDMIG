import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { dataService } from '../services/dataService';
import LoadingSpinner from '../components/LoadingSpinner';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import EmptyState from '../components/EmptyState';
import {
  Image as GalleryIcon,
  PlusCircle,
  Trash2,
  Calendar,
  X,
  Maximize2,
} from 'lucide-react';

export default function Gallery() {
  const { user, isLeader, isSuperAdmin } = useAuth();
  const { t, isTamil } = useLanguage();

  const [gallery, setGallery] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAlbum, setSelectedAlbum] = useState('all');

  // Upload Modal State
  const [showModal, setShowModal] = useState(false);
  const [eventName, setEventName] = useState('');
  const [title, setTitle] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [uploading, setUploading] = useState(false);

  // Lightbox View State
  const [lightboxImage, setLightboxImage] = useState(null);

  // Delete State
  const [imgToDelete, setImgToDelete] = useState(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const canManage = isLeader || isSuperAdmin;

  useEffect(() => {
    loadGallery();
  }, []);

  const loadGallery = async () => {
    setLoading(true);
    try {
      const data = await dataService.getGallery();
      setGallery(data || []);
    } catch (err) {
      console.error('Error fetching gallery:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      if (!title) {
        setTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!imageFile) {
      alert('Please choose an image file');
      return;
    }
    setUploading(true);
    try {
      const imageUrl = await dataService.uploadFile('gallery', imageFile, `gallery-${Date.now()}`);
      await dataService.addGalleryImage({
        event_name: eventName,
        title,
        image_url: imageUrl,
        uploaded_by: user?.id,
      });

      setShowModal(false);
      setImageFile(null);
      setImagePreview('');
      setTitle('');
      await loadGallery();
    } catch (err) {
      alert('Upload failed: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!imgToDelete) return;
    setDeleting(true);
    try {
      await dataService.deleteGalleryImage(imgToDelete.id);
      setIsDeleteOpen(false);
      await loadGallery();
    } catch (err) {
      alert('Delete failed: ' + err.message);
    } finally {
      setDeleting(false);
    }
  };

  // Distinct albums
  const albums = ['all', ...Array.from(new Set(gallery.map(g => g.event_name).filter(Boolean)))];

  const filteredGallery = gallery.filter(g =>
    selectedAlbum === 'all' || g.event_name === selectedAlbum
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-amber-600 text-xs font-bold uppercase tracking-wider mb-1">
            <GalleryIcon className="w-4 h-4" />
            <span>{t('gallery.title')}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            {t('gallery.title')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {t('gallery.subtitle')}
          </p>
        </div>

        {canManage && (
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{t('gallery.uploadPhoto')}</span>
          </button>
        )}
      </div>

      {/* Album Filters */}
      {albums.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {albums.map((alb) => (
            <button
              key={alb}
              type="button"
              onClick={() => setSelectedAlbum(alb)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedAlbum === alb
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {alb === 'all' ? t('common.all') : alb}
            </button>
          ))}
        </div>
      )}

      {/* Gallery Grid */}
      {loading ? (
        <LoadingSpinner text="புகைப்படங்கள் ஏற்றப்படுகின்றன..." />
      ) : filteredGallery.length === 0 ? (
        <EmptyState
          icon={GalleryIcon}
          title={t('gallery.noPhotos')}
          description="கிராம விழா கொண்டாட்ட புகைப்படங்களை இங்கே பதிவேற்றலாம்."
          actionButton={
            canManage && (
              <button
                type="button"
                onClick={() => setShowModal(true)}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold"
              >
                {t('gallery.uploadPhoto')}
              </button>
            )
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredGallery.map((img) => (
            <div
              key={img.id}
              className="group relative bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col"
            >
              <div
                onClick={() => setLightboxImage(img)}
                className="relative aspect-4/3 w-full bg-slate-950 overflow-hidden cursor-pointer"
              >
                <img
                  src={img.image_url}
                  alt={img.title || img.event_name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-linear-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                  <span className="text-white text-xs font-semibold flex items-center gap-1.5">
                    <Maximize2 className="w-4 h-4" />
                    <span>பெரிதாக்குக</span>
                  </span>
                </div>
              </div>

              <div className="p-4 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase text-amber-700 block">
                    {img.event_name}
                  </span>
                  <h4 className="text-xs font-bold text-slate-800 mt-0.5 truncate">
                    {img.title || 'புகைப்படம்'}
                  </h4>
                </div>

                {canManage && (
                  <button
                    type="button"
                    onClick={() => {
                      setImgToDelete(img);
                      setIsDeleteOpen(true);
                    }}
                    className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                    title={t('common.delete')}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Image Modal */}
      {showModal && (
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={t('gallery.uploadPhoto')}
          maxWidth="max-w-md"
        >
          <form onSubmit={handleUpload} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('gallery.eventAlbum')} *
              </label>
              <input
                type="text"
                required
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                placeholder="எ.கா: கிராமிய கலை விழா 2026"
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 bg-slate-50/50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('gallery.photoTitle')}
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="புகைப்பட விளக்கம் / தலைப்பு"
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 bg-slate-50/50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                புகைப்படத்தைத் தேர்ந்தெடுக்கவும் *
              </label>
              <input
                type="file"
                accept="image/*"
                required
                onChange={handleFileChange}
                className="text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-amber-50 file:text-amber-700"
              />
              {imagePreview && (
                <div className="mt-3 aspect-video w-full rounded-2xl overflow-hidden border border-slate-200 bg-slate-900">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-contain" />
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-xl cursor-pointer"
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                disabled={uploading}
                className="px-4 py-2 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-xl shadow-xs cursor-pointer"
              >
                {uploading ? t('common.loading') : t('common.upload')}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Lightbox Modal */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setLightboxImage(null)}
        >
          <button
            type="button"
            onClick={() => setLightboxImage(null)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white"
          >
            <X className="w-6 h-6" />
          </button>
          <div className="max-w-4xl max-h-[85vh] flex flex-col items-center">
            <img
              src={lightboxImage.image_url}
              alt={lightboxImage.title}
              className="max-w-full max-h-[75vh] object-contain rounded-2xl shadow-2xl"
            />
            <div className="text-center text-white mt-3">
              <p className="text-sm font-bold">{lightboxImage.title || lightboxImage.event_name}</p>
              <p className="text-xs text-slate-400">{lightboxImage.event_name}</p>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        isLoading={deleting}
        title={t('common.delete')}
        message="இந்த புகைப்படத்தை நிச்சயமாக நீக்க விரும்புகிறீர்களா?"
        isDestructive={true}
      />
    </div>
  );
}
