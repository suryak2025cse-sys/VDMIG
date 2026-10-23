import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { dataService } from '../services/dataService';
import { cloudinaryUpload } from '../services/cloudinaryService';
import LoadingSpinner from '../components/LoadingSpinner';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import EmptyState from '../components/EmptyState';
import {
  Image as GalleryIcon,
  Trash2,
  X,
  Maximize2,
  Play,
  Film,
  FolderPlus,
  ArrowLeft,
  Edit3,
  Check,
  AlertCircle,
  UploadCloud,
  ChevronLeft,
  ChevronRight,
  Layers,
  Search,
} from 'lucide-react';

export default function Gallery() {
  const { user, isLeader, isSuperAdmin } = useAuth();
  const { t } = useLanguage();
  const canManage = isLeader || isSuperAdmin;

  // View & Album state
  const [albums, setAlbums] = useState([]);
  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const [albumMedia, setAlbumMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mediaFilter, setMediaFilter] = useState('all'); // 'all', 'image', 'video'
  const [toastMessage, setToastMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Album Create / Edit Modal State
  const [showAlbumModal, setShowAlbumModal] = useState(false);
  const [isEditingAlbum, setIsEditingAlbum] = useState(false);
  const [albumName, setAlbumName] = useState('');
  const [albumDesc, setAlbumDesc] = useState('');
  const [albumCoverFile, setAlbumCoverFile] = useState(null);
  const [albumCoverPreview, setAlbumCoverPreview] = useState('');
  const [albumSaving, setAlbumSaving] = useState(false);

  // Multi-File Media Upload State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [pendingFiles, setPendingFiles] = useState([]);
  const [commonCaption, setCommonCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0, percent: 0, currentName: '' });

  // Delete Modals State
  const [albumToDelete, setAlbumToDelete] = useState(null);
  const [isDeleteAlbumOpen, setIsDeleteAlbumOpen] = useState(false);
  const [deletingAlbum, setDeletingAlbum] = useState(false);

  const [mediaToDelete, setMediaToDelete] = useState(null);
  const [isDeleteMediaOpen, setIsDeleteMediaOpen] = useState(false);
  const [deletingMedia, setDeletingMedia] = useState(false);

  // Lightbox / Media Viewer State
  const [lightboxIndex, setLightboxIndex] = useState(null);

  const loadAlbums = async () => {
    setLoading(true);
    try {
      const data = await dataService.getAlbums();
      setAlbums(data || []);
    } catch (err) {
      console.error('Error fetching albums:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlbums();
  }, []);

  const handleOpenAlbum = async (album) => {
    setSelectedAlbum(album);
    setMediaLoading(true);
    setMediaFilter('all');
    try {
      const media = await dataService.getAlbumMedia(album.id, album.name);
      setAlbumMedia(media || []);
    } catch (err) {
      console.error('Error fetching album media:', err);
    } finally {
      setMediaLoading(false);
    }
  };

  const handleBackToAlbums = async () => {
    setSelectedAlbum(null);
    setAlbumMedia([]);
    setLightboxIndex(null);
    await loadAlbums();
  };

  // -------------------------------------------------------------
  // ALBUM CREATION & EDITING
  // -------------------------------------------------------------
  const handleOpenCreateAlbum = () => {
    setIsEditingAlbum(false);
    setAlbumName('');
    setAlbumDesc('');
    setAlbumCoverFile(null);
    setAlbumCoverPreview('');
    setShowAlbumModal(true);
  };

  const handleOpenEditAlbum = (album, e) => {
    if (e) e.stopPropagation();
    setIsEditingAlbum(true);
    setAlbumName(album.name);
    setAlbumDesc(album.description || '');
    setAlbumCoverFile(null);
    setAlbumCoverPreview(album.cover_image_url || '');
    setShowAlbumModal(true);
  };

  const handleCoverFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAlbumCoverFile(file);
      setAlbumCoverPreview(URL.createObjectURL(file));
    }
  };

  const handleSaveAlbum = async (e) => {
    e.preventDefault();
    if (!albumName.trim()) {
      alert('ஆல்பம் பெயர் தேவை (Album name required)');
      return;
    }

    setAlbumSaving(true);
    setErrorMessage('');
    try {
      let coverUrl = albumCoverPreview;
      if (albumCoverFile) {
        coverUrl = await dataService.uploadFile('albums', albumCoverFile, `album-cover-${Date.now()}`);
      }

      if (isEditingAlbum && selectedAlbum) {
        const updated = await dataService.updateAlbum(selectedAlbum.id, {
          name: albumName.trim(),
          description: albumDesc.trim(),
          cover_image_url: coverUrl,
        });
        if (updated) {
          setSelectedAlbum(prev => ({ ...prev, ...updated }));
        }
        setToastMessage('ஆல்பம் தகவல்கள் வெற்றிகரமாக புதுப்பிக்கப்பட்டன!');
      } else {
        await dataService.createAlbum({
          name: albumName.trim(),
          description: albumDesc.trim(),
          cover_image_url: coverUrl,
          created_by: user?.id,
        });
        setToastMessage('புதிய ஆல்பம் வெற்றிகரமாக உருவாக்கப்பட்டது!');
      }

      setShowAlbumModal(false);
      await loadAlbums();
      setTimeout(() => setToastMessage(''), 4000);
    } catch (err) {
      setErrorMessage('Failed to save album: ' + err.message);
    } finally {
      setAlbumSaving(false);
    }
  };

  // -------------------------------------------------------------
  // ALBUM DELETION
  // -------------------------------------------------------------
  const handleOpenDeleteAlbum = (album, e) => {
    if (e) e.stopPropagation();
    setAlbumToDelete(album);
    setIsDeleteAlbumOpen(true);
  };

  const handleConfirmDeleteAlbum = async () => {
    if (!albumToDelete) return;
    setDeletingAlbum(true);
    try {
      await dataService.deleteAlbum(albumToDelete.id, albumToDelete.name);
      setIsDeleteAlbumOpen(false);
      if (selectedAlbum?.id === albumToDelete.id) {
        setSelectedAlbum(null);
      }
      setToastMessage('ஆல்பம் வெற்றிகரமாக நீக்கப்பட்டது.');
      await loadAlbums();
      setTimeout(() => setToastMessage(''), 4000);
    } catch (err) {
      alert('Delete failed: ' + err.message);
    } finally {
      setDeletingAlbum(false);
    }
  };

  // -------------------------------------------------------------
  // MULTI-FILE MEDIA SELECTION & UPLOAD
  // -------------------------------------------------------------
  const handleOpenUploadModal = () => {
    setPendingFiles([]);
    setCommonCaption('');
    setErrorMessage('');
    setShowUploadModal(true);
  };

  const handleFilesSelect = (e) => {
    const files = Array.from(e.target.files);
    if (!files || files.length === 0) return;

    const newPending = files.map(file => {
      const isVideo = file.type.startsWith('video/') || /\.(mp4|mov|webm|m4v)$/i.test(file.name);
      return {
        id: `pending-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        isVideo,
        previewUrl: isVideo ? null : URL.createObjectURL(file),
        title: file.name.replace(/\.[^/.]+$/, ''),
      };
    });

    setPendingFiles(prev => [...prev, ...newPending]);
  };

  const handleRemovePendingFile = (id) => {
    setPendingFiles(prev => prev.filter(p => p.id !== id));
  };

  const handleUploadMediaFiles = async (e) => {
    e.preventDefault();
    if (!selectedAlbum) return;
    if (pendingFiles.length === 0) {
      alert('தயவுசெய்து பதிவேற்ற புகைப்படங்கள் அல்லது காணொளிகளைத் தேர்வு செய்யவும்.');
      return;
    }

    setUploading(true);
    setErrorMessage('');
    const total = pendingFiles.length;
    let completedCount = 0;
    const errors = [];

    for (let i = 0; i < total; i++) {
      const item = pendingFiles[i];
      setUploadProgress({
        current: i + 1,
        total,
        percent: Math.round(((i) / total) * 100),
        currentName: item.name,
      });

      try {
        const uploadResult = await cloudinaryUpload({
          file: item.file,
          bucket: 'gallery',
          customName: `${selectedAlbum.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}`,
        });

        await dataService.addAlbumMedia({
          album_id: selectedAlbum.id,
          event_name: selectedAlbum.name,
          title: commonCaption.trim() || item.title,
          file_url: uploadResult.url,
          media_type: item.isVideo ? 'video' : 'image',
          file_type: item.file.type,
          file_size: item.size,
          public_id: uploadResult.publicId,
          uploaded_by: user?.id,
        });

        completedCount++;
      } catch (err) {
        console.error(`Failed to upload ${item.name}:`, err);
        errors.push(`${item.name}: ${err.message}`);
      }
    }

    setUploadProgress({
      current: total,
      total,
      percent: 100,
      currentName: 'Completed!',
    });

    setUploading(false);
    setShowUploadModal(false);
    setPendingFiles([]);
    setCommonCaption('');

    if (errors.length > 0) {
      setErrorMessage(`${completedCount} கோப்புகள் பதிவேற்றப்பட்டன. ${errors.length} கோப்புகளில் பிழை: ${errors[0]}`);
    } else {
      setToastMessage(`${completedCount} கோப்புகள் வெற்றிகரமாக ஆல்பத்தில் சேர்க்கப்பட்டன!`);
      setTimeout(() => setToastMessage(''), 4000);
    }

    // Refresh album media
    try {
      const freshMedia = await dataService.getAlbumMedia(selectedAlbum.id, selectedAlbum.name);
      setAlbumMedia(freshMedia || []);
    } catch (fetchErr) {
      console.warn('Could not refresh album media:', fetchErr);
    }
  };

  // -------------------------------------------------------------
  // INDIVIDUAL MEDIA DELETION
  // -------------------------------------------------------------
  const handleOpenDeleteMedia = (media, e) => {
    if (e) e.stopPropagation();
    setMediaToDelete(media);
    setIsDeleteMediaOpen(true);
  };

  const handleConfirmDeleteMedia = async () => {
    if (!mediaToDelete) return;
    setDeletingMedia(true);
    try {
      await dataService.deleteAlbumMedia(mediaToDelete.id);
      setAlbumMedia(prev => prev.filter(m => m.id !== mediaToDelete.id));
      setIsDeleteMediaOpen(false);
      setToastMessage('கோப்பு வெற்றிகரமாக நீக்கப்பட்டது.');
      setTimeout(() => setToastMessage(''), 4000);
    } catch (err) {
      alert('Delete failed: ' + err.message);
    } finally {
      setDeletingMedia(false);
    }
  };

  // -------------------------------------------------------------
  // LIGHTBOX NAVIGATION
  // -------------------------------------------------------------
  const visibleMedia = albumMedia.filter(m => {
    if (mediaFilter === 'image') return m.media_type !== 'video';
    if (mediaFilter === 'video') return m.media_type === 'video';
    return true;
  });

  const handlePrevMedia = (e) => {
    if (e) e.stopPropagation();
    if (lightboxIndex === null || lightboxIndex <= 0) {
      setLightboxIndex(visibleMedia.length - 1);
    } else {
      setLightboxIndex(lightboxIndex - 1);
    }
  };

  const handleNextMedia = (e) => {
    if (e) e.stopPropagation();
    if (lightboxIndex === null || lightboxIndex >= visibleMedia.length - 1) {
      setLightboxIndex(0);
    } else {
      setLightboxIndex(lightboxIndex + 1);
    }
  };

  const currentLightboxItem = lightboxIndex !== null ? visibleMedia[lightboxIndex] : null;

  // Filtered albums for main album grid
  const filteredAlbums = albums.filter(a =>
    a.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-semibold flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button type="button" onClick={() => setToastMessage('')} className="p-1 text-emerald-700 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Error Alert */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm font-semibold flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button type="button" onClick={() => setErrorMessage('')} className="p-1 text-rose-700 hover:text-rose-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          {selectedAlbum ? (
            <div>
              <button
                type="button"
                onClick={handleBackToAlbums}
                className="flex items-center gap-1.5 text-amber-600 hover:text-amber-700 text-xs font-bold uppercase tracking-wider mb-2 cursor-pointer transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{t('gallery.backToAlbums')}</span>
              </button>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                {selectedAlbum.name}
              </h1>
              {selectedAlbum.description && (
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  {selectedAlbum.description}
                </p>
              )}
            </div>
          ) : (
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
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {selectedAlbum ? (
            <>
              {canManage && (
                <>
                  <button
                    type="button"
                    onClick={(e) => handleOpenEditAlbum(selectedAlbum, e)}
                    className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                    title={t('gallery.editAlbum')}
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{t('gallery.editAlbum')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleOpenUploadModal}
                    className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm shadow-md shadow-amber-500/20 flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <UploadCloud className="w-4 h-4" />
                    <span>{t('gallery.addMedia')}</span>
                  </button>
                </>
              )}
            </>
          ) : (
            <>
              {canManage && (
                <button
                  type="button"
                  onClick={handleOpenCreateAlbum}
                  className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm shadow-md shadow-amber-500/20 flex items-center gap-2 transition-all cursor-pointer"
                >
                  <FolderPlus className="w-4 h-4" />
                  <span>{t('gallery.createAlbum')}</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* VIEW 1: ALBUM MEDIA LIST (INSIDE AN ALBUM)                */}
      {/* ========================================================= */}
      {selectedAlbum ? (
        <div className="space-y-6">
          {/* Filter Pills for Inside Album */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setMediaFilter('all')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  mediaFilter === 'all'
                    ? 'bg-amber-500 text-slate-950 shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {t('gallery.allMedia')} ({albumMedia.length})
              </button>

              <button
                type="button"
                onClick={() => setMediaFilter('image')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  mediaFilter === 'image'
                    ? 'bg-amber-500 text-slate-950 shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <GalleryIcon className="w-3.5 h-3.5" />
                <span>{t('gallery.photos')} ({albumMedia.filter(m => m.media_type !== 'video').length})</span>
              </button>

              <button
                type="button"
                onClick={() => setMediaFilter('video')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  mediaFilter === 'video'
                    ? 'bg-amber-500 text-slate-950 shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Film className="w-3.5 h-3.5" />
                <span>{t('gallery.videos')} ({albumMedia.filter(m => m.media_type === 'video').length})</span>
              </button>
            </div>

            <div className="text-xs font-semibold text-slate-500">
              {visibleMedia.length} {t('gallery.mediaCount')}
            </div>
          </div>

          {/* Media Grid */}
          {mediaLoading ? (
            <LoadingSpinner text="ஆல்பத்தின் ஊடகங்கள் ஏற்றப்படுகின்றன..." />
          ) : visibleMedia.length === 0 ? (
            <EmptyState
              icon={GalleryIcon}
              title={t('gallery.noMedia')}
              description="இந்த ஆல்பத்தில் புகைப்படங்கள் அல்லது வீடியோக்களை பதிவேற்ற 'ஊடகம் சேர்க்க' பொத்தானை அழுத்தவும்."
              actionButton={
                canManage && (
                  <button
                    type="button"
                    onClick={handleOpenUploadModal}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-xs"
                  >
                    <UploadCloud className="w-4 h-4" />
                    <span>{t('gallery.addMedia')}</span>
                  </button>
                )
              }
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {visibleMedia.map((item, idx) => {
                const isVideo = item.media_type === 'video';

                return (
                  <div
                    key={item.id}
                    className="group relative bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col"
                  >
                    {/* Media Preview Thumbnail / Container */}
                    <div
                      onClick={() => setLightboxIndex(idx)}
                      className="relative aspect-4/3 w-full bg-slate-950 overflow-hidden cursor-pointer"
                    >
                      {isVideo ? (
                        <div className="w-full h-full relative flex items-center justify-center bg-slate-900">
                          <video
                            src={item.file_url}
                            className="w-full h-full object-cover opacity-80"
                            preload="metadata"
                          />
                          {/* Play overlay button */}
                          <div className="absolute inset-0 flex items-center justify-center bg-slate-950/30 group-hover:bg-slate-950/20 transition-colors">
                            <div className="w-12 h-12 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                              <Play className="w-6 h-6 ml-0.5 fill-current" />
                            </div>
                          </div>
                          {/* Video Badge */}
                          <div className="absolute top-3 left-3 px-2 py-0.5 rounded-lg bg-slate-950/70 backdrop-blur-xs text-white text-[10px] font-bold flex items-center gap-1">
                            <Film className="w-3 h-3 text-amber-400" />
                            <span>{t('gallery.videos')}</span>
                          </div>
                        </div>
                      ) : (
                        <>
                          <img
                            src={item.file_url}
                            alt={item.title || selectedAlbum.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-linear-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                            <span className="text-white text-xs font-semibold flex items-center gap-1.5">
                              <Maximize2 className="w-3.5 h-3.5" />
                              <span>{t('gallery.fullscreen')}</span>
                            </span>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Footer Info & Actions */}
                    <div className="p-3.5 flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-bold text-slate-800 truncate">
                          {item.title || (isVideo ? 'காணொளி' : 'புகைப்படம்')}
                        </h4>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          {item.created_at ? new Date(item.created_at).toLocaleDateString() : ''}
                        </span>
                      </div>

                      {canManage && (
                        <button
                          type="button"
                          onClick={(e) => handleOpenDeleteMedia(item, e)}
                          className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer shrink-0"
                          title={t('common.delete')}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* ========================================================= */
        /* VIEW 2: ALBUMS LIST / ALBUM CARDS GRID                    */
        /* ========================================================= */
        <div className="space-y-6">
          {/* Search bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ஆல்பம் தேடுக (Search albums e.g. 2026, Pongal)..."
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 bg-slate-50/50"
              />
            </div>
            <div className="text-xs font-semibold text-slate-500">
              {filteredAlbums.length} {t('gallery.albums')}
            </div>
          </div>

          {/* Album Cards */}
          {loading ? (
            <LoadingSpinner text="ஆல்பங்கள் ஏற்றப்படுகின்றன..." />
          ) : filteredAlbums.length === 0 ? (
            <EmptyState
              icon={Layers}
              title={t('gallery.noAlbums')}
              description="கிராம விழாக்கள், கொண்டாட்டங்கள் மற்றும் புகைப்படங்களை வகைப்படுத்த புதிய ஆல்பத்தை உருவாக்கவும்."
              actionButton={
                canManage && (
                  <button
                    type="button"
                    onClick={handleOpenCreateAlbum}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-xs"
                  >
                    <FolderPlus className="w-4 h-4" />
                    <span>{t('gallery.createAlbum')}</span>
                  </button>
                )
              }
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAlbums.map((album) => {
                const totalFiles = album.media_count || 0;
                const imageCount = album.image_count || 0;
                const videoCount = album.video_count || 0;

                return (
                  <div
                    key={album.id}
                    onClick={() => handleOpenAlbum(album)}
                    className="group relative bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-xs hover:shadow-xl hover:border-amber-300 transition-all cursor-pointer flex flex-col"
                  >
                    {/* Album Cover Thumbnail */}
                    <div className="relative aspect-16/10 w-full bg-slate-900 overflow-hidden">
                      {album.cover_image_url ? (
                        <img
                          src={album.cover_image_url}
                          alt={album.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full bg-linear-to-tr from-amber-600 via-amber-500 to-amber-700 flex flex-col items-center justify-center p-6 text-white text-center">
                          <Layers className="w-12 h-12 text-white/80 mb-2" />
                          <span className="font-extrabold text-base tracking-wide drop-shadow-xs">
                            {album.name}
                          </span>
                        </div>
                      )}

                      {/* File Count Floating Badge */}
                      <div className="absolute top-3 right-3 px-2.5 py-1 rounded-xl bg-slate-950/70 backdrop-blur-md text-white text-xs font-bold flex items-center gap-1.5 shadow-xs">
                        <Layers className="w-3.5 h-3.5 text-amber-400" />
                        <span>{totalFiles} {t('gallery.mediaCount')}</span>
                      </div>
                    </div>

                    {/* Album Details */}
                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-base font-extrabold text-slate-900 group-hover:text-amber-600 transition-colors">
                            {album.name}
                          </h3>
                        </div>

                        {album.description && (
                          <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                            {album.description}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-4 mt-3 border-t border-slate-100">
                        {/* Media Breakdown */}
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
                          {imageCount > 0 && (
                            <span className="flex items-center gap-1">
                              <GalleryIcon className="w-3 h-3 text-amber-600" />
                              <span>{imageCount} {t('gallery.photos')}</span>
                            </span>
                          )}
                          {imageCount > 0 && videoCount > 0 && <span>•</span>}
                          {videoCount > 0 && (
                            <span className="flex items-center gap-1">
                              <Film className="w-3 h-3 text-amber-600" />
                              <span>{videoCount} {t('gallery.videos')}</span>
                            </span>
                          )}
                          {totalFiles === 0 && (
                            <span className="text-slate-400">கோப்புகள் இல்லை</span>
                          )}
                        </div>

                        {/* Admin Action Menu */}
                        {canManage && (
                          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={(e) => handleOpenEditAlbum(album, e)}
                              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                              title={t('gallery.editAlbum')}
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleOpenDeleteAlbum(album, e)}
                              className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                              title={t('gallery.deleteAlbum')}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 1: CREATE / EDIT ALBUM MODAL                        */}
      {/* ========================================================= */}
      {showAlbumModal && (
        <Modal
          isOpen={showAlbumModal}
          onClose={() => setShowAlbumModal(false)}
          title={isEditingAlbum ? t('gallery.editAlbum') : t('gallery.createAlbum')}
          maxWidth="max-w-md"
        >
          <form onSubmit={handleSaveAlbum} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('gallery.albumName')} * (எ.கா: 2026, பொங்கல் 2026, கலை விழா 2025)
              </label>
              <input
                type="text"
                required
                value={albumName}
                onChange={(e) => setAlbumName(e.target.value)}
                placeholder="எ.கா: 2026 அல்லது Pongal 2026"
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 bg-slate-50/50 font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('gallery.albumDesc')}
              </label>
              <textarea
                rows={2}
                value={albumDesc}
                onChange={(e) => setAlbumDesc(e.target.value)}
                placeholder="ஆல்பம் பற்றிய சிறு குறிப்பு..."
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 bg-slate-50/50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('gallery.coverImage')} (விருப்பத்தேர்வு)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleCoverFileChange}
                className="text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-amber-50 file:text-amber-700 cursor-pointer"
              />
              {albumCoverPreview && (
                <div className="mt-3 aspect-16/9 w-full rounded-2xl overflow-hidden border border-slate-200 bg-slate-900">
                  <img src={albumCoverPreview} alt="Cover Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowAlbumModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-xl cursor-pointer"
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                disabled={albumSaving}
                className="px-4 py-2 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-xl shadow-xs cursor-pointer"
              >
                {albumSaving ? t('common.loading') : t('common.save')}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: MULTI-FILE MEDIA UPLOAD MODAL                    */}
      {/* ========================================================= */}
      {showUploadModal && selectedAlbum && (
        <Modal
          isOpen={showUploadModal}
          onClose={() => {
            if (!uploading) setShowUploadModal(false);
          }}
          title={`${t('gallery.addMedia')} - ${selectedAlbum.name}`}
          maxWidth="max-w-2xl"
        >
          <form onSubmit={handleUploadMediaFiles} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                பொது விளக்கம் / தலைப்பு (விருப்பத்தேர்வு)
              </label>
              <input
                type="text"
                value={commonCaption}
                onChange={(e) => setCommonCaption(e.target.value)}
                placeholder="எ.கா: கிராமிய கலை நிகழ்ச்சி 2026"
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 bg-slate-50/50"
              />
            </div>

            {/* File Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('gallery.selectFiles')} * (Multi-file: Images & Videos)
              </label>
              <div className="border-2 border-dashed border-slate-200 hover:border-amber-400 rounded-2xl p-6 text-center bg-slate-50/50 transition-colors">
                <input
                  type="file"
                  id="multi-media-upload"
                  multiple
                  accept="image/jpeg,image/png,image/webp,image/jpg,video/mp4,video/quicktime,video/webm"
                  onChange={handleFilesSelect}
                  className="hidden"
                />
                <label
                  htmlFor="multi-media-upload"
                  className="cursor-pointer flex flex-col items-center justify-center gap-2"
                >
                  <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shadow-xs">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-slate-800">
                    கோப்புகளைத் தேர்ந்தெடுக்க இங்கே சொடுக்கவும்
                  </span>
                  <span className="text-[11px] text-slate-400">
                    ஆதரிக்கப்படும் வடிவங்கள்: JPG, PNG, WEBP, MP4, MOV (ஒரே நேரத்தில் பல கோப்புகளைத் தேர்ந்தெடுக்கலாம்)
                  </span>
                </label>
              </div>
            </div>

            {/* Selected Files Preview Grid */}
            {pendingFiles.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                  <span>தேர்ந்தெடுக்கப்பட்ட கோப்புகள் ({pendingFiles.length})</span>
                  <button
                    type="button"
                    onClick={() => setPendingFiles([])}
                    className="text-rose-600 hover:text-rose-700 text-[11px]"
                  >
                    அனைத்தையும் நீக்கு
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-60 overflow-y-auto p-2 border border-slate-100 rounded-2xl bg-slate-50">
                  {pendingFiles.map((pf) => (
                    <div
                      key={pf.id}
                      className="relative rounded-xl overflow-hidden border border-slate-200 bg-white shadow-2xs group flex flex-col"
                    >
                      <div className="aspect-square w-full bg-slate-900 relative flex items-center justify-center overflow-hidden">
                        {pf.isVideo ? (
                          <div className="flex flex-col items-center justify-center text-amber-400 p-2 text-center">
                            <Film className="w-8 h-8 mb-1" />
                            <span className="text-[9px] font-bold uppercase tracking-wider text-white">
                              காணொளி (Video)
                            </span>
                          </div>
                        ) : (
                          <img
                            src={pf.previewUrl}
                            alt={pf.name}
                            className="w-full h-full object-cover"
                          />
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemovePendingFile(pf.id)}
                          className="absolute top-1 right-1 p-1 rounded-full bg-slate-950/70 hover:bg-rose-600 text-white transition-colors"
                          title="நீக்கு"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="p-1.5 text-[10px] text-slate-600 truncate">
                        <p className="truncate font-medium">{pf.name}</p>
                        <span className="text-[9px] text-slate-400">
                          {(pf.size / (1024 * 1024)).toFixed(1)} MB
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upload Progress Bar */}
            {uploading && (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-amber-900">
                  <span>{t('gallery.uploadingMedia')}</span>
                  <span>{uploadProgress.percent}% ({uploadProgress.current}/{uploadProgress.total})</span>
                </div>
                <div className="w-full bg-amber-200 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-amber-600 h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress.percent}%` }}
                  />
                </div>
                <p className="text-[11px] text-amber-700 truncate">
                  பதிவேற்றப்படுகிறது: {uploadProgress.currentName}
                </p>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                disabled={uploading}
                onClick={() => setShowUploadModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-xl cursor-pointer disabled:opacity-50"
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                disabled={uploading || pendingFiles.length === 0}
                className="px-4 py-2 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-xl shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                {uploading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>பதிவேற்றப்படுகிறது...</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-4 h-4" />
                    <span>{pendingFiles.length} {t('gallery.uploadMedia')}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: LIGHTBOX / IN-APP FULLSCREEN VIEWER & PLAYER     */}
      {/* ========================================================= */}
      {currentLightboxItem && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4 select-none"
          onClick={() => setLightboxIndex(null)}
        >
          {/* Close Button */}
          <button
            type="button"
            onClick={() => setLightboxIndex(null)}
            className="absolute top-4 right-4 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white z-50 cursor-pointer transition-colors"
            title="மூடுக"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Previous Button */}
          {visibleMedia.length > 1 && (
            <button
              type="button"
              onClick={handlePrevMedia}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/25 text-white z-50 cursor-pointer transition-colors"
              title="முந்தையது"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          {/* Next Button */}
          {visibleMedia.length > 1 && (
            <button
              type="button"
              onClick={handleNextMedia}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/25 text-white z-50 cursor-pointer transition-colors"
              title="அடுத்தது"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}

          {/* Media Container */}
          <div
            className="max-w-5xl max-h-[85vh] w-full flex flex-col items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {currentLightboxItem.media_type === 'video' ? (
              <div className="w-full flex justify-center">
                <video
                  src={currentLightboxItem.file_url}
                  controls
                  autoPlay
                  className="max-h-[75vh] max-w-full rounded-2xl shadow-2xl bg-black"
                >
                  உங்கள் உலாவி வீடியோ இயக்கத்தை ஆதரிக்கவில்லை.
                </video>
              </div>
            ) : (
              <img
                src={currentLightboxItem.file_url}
                alt={currentLightboxItem.title}
                className="max-w-full max-h-[75vh] object-contain rounded-2xl shadow-2xl"
              />
            )}

            {/* Caption & Counter */}
            <div className="text-center text-white mt-4 max-w-lg">
              <h3 className="text-sm sm:text-base font-bold">
                {currentLightboxItem.title || (currentLightboxItem.media_type === 'video' ? 'காணொளி' : 'புகைப்படம்')}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {lightboxIndex + 1} / {visibleMedia.length}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* CONFIRMATION DIALOGS                                      */}
      {/* ========================================================= */}
      {/* Delete Album Confirm */}
      <ConfirmDialog
        isOpen={isDeleteAlbumOpen}
        onClose={() => setIsDeleteAlbumOpen(false)}
        onConfirm={handleConfirmDeleteAlbum}
        isLoading={deletingAlbum}
        title={t('gallery.deleteAlbum')}
        message={
          albumToDelete
            ? `"${albumToDelete.name}" என்ற ஆல்பத்தையும், அதில் உள்ள அனைத்து புகைப்படங்கள் மற்றும் வீடியோக்களையும் நிரந்தரமாக நீக்க விரும்புகிறீர்களா?`
            : t('gallery.confirmDeleteAlbum')
        }
        isDestructive={true}
      />

      {/* Delete Individual Media Confirm */}
      <ConfirmDialog
        isOpen={isDeleteMediaOpen}
        onClose={() => setIsDeleteMediaOpen(false)}
        onConfirm={handleConfirmDeleteMedia}
        isLoading={deletingMedia}
        title={t('common.delete')}
        message={t('gallery.confirmDeleteMedia')}
        isDestructive={true}
      />
    </div>
  );
}
