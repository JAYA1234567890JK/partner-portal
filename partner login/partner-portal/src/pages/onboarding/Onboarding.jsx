import { useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { Alert, Avatar, Box, Button, Checkbox, Chip, CircularProgress, Divider, FormControl, FormControlLabel, Grid, IconButton, InputLabel, LinearProgress, MenuItem, Paper, Select, Snackbar, Stack, Step, StepLabel, Stepper, Switch, TextField, Typography } from '@mui/material';
import AddPhotoAlternateRoundedIcon from '@mui/icons-material/AddPhotoAlternateRounded';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import LocationOnRoundedIcon from '@mui/icons-material/LocationOnRounded';
import PhotoCameraRoundedIcon from '@mui/icons-material/PhotoCameraRounded';
import RoomRoundedIcon from '@mui/icons-material/RoomRounded';
import { useNavigate } from 'react-router-dom';
import Brand from '../../components/common/Brand';
import { getPartnerDraft, savePartnerDraft } from '../../services/partnerData';
import { deletePropertyImage, deleteRoomImage, getOnboardingDraft, saveOnboardingDraft, submitOnboarding, updatePropertyImage, updatePropertyImageOrder, updateRoomImage, updateRoomImageOrder, uploadPropertyImages, uploadRoomImages } from '../../services/partnerApi';

const steps = ['Business details', 'Location', 'Property photos', 'Room setup', 'Hourly pricing', 'Facilities & policies', 'Bank & verification', 'Review & submit'];
const imageCategories = ['Hotel Exterior', 'Reception / Lobby', 'Bedroom', 'Bathroom', 'Restaurant / Dining', 'Swimming Pool', 'Other Facilities'];
const requiredCategories = ['Hotel Exterior', 'Bedroom', 'Bathroom'];
const propertyTypes = ['Hotel', 'Lodge', 'Resort', 'Guest House', 'Service Apartment', 'Boutique Hotel', 'Budget Stay'];
const roomCategories = ['Standard', 'Deluxe', 'Premium', 'Executive', 'Suite', 'Family Room'];
const facilityOptions = ['Wi-Fi', 'Air Conditioning', 'Parking', 'Television', 'Room Service', 'Restaurant', 'Swimming Pool', 'Power Backup', 'Hot Water', 'Laundry', 'Lift', 'Security'];
const blankRoom = () => ({ id: `room-${Date.now()}`, roomNumber: '', name: '', category: 'Standard', maxGuests: 2, beds: 1, bedType: 'Queen', size: '', bathroom: 'Attached', description: '', amenities: [], photos: [], photoCategory: 'Room', available: true, status: 'Under Review' });
const isPersistedImage = (image) => Boolean(image?.id && !image.id.startsWith('pending-'));
function removeAndSelectCover(images, imageId) {
  const removed = images.find((image) => image.id === imageId);
  const remaining = images.filter((image) => image.id !== imageId);
  if (removed?.cover && remaining.length && !remaining.some((image) => image.cover)) {
    remaining[0] = { ...remaining[0], cover: true, isCover: true };
  }
  return remaining;
}
const initialDraft = (partner) => ({ step: 0, business: { name: partner?.businessName || '', propertyType: partner?.businessType || 'Hotel', owner: partner?.fullName || '', email: partner?.email || '', phone: partner?.mobile || '', alternatePhone: '', description: '', yearEstablished: '' }, location: { address1: '', address2: '', landmark: '', city: partner?.city || '', state: partner?.state || '', pincode: '', latitude: '', longitude: '' }, images: [], rooms: [], pricing: { oneHour: '', twoHours: '', threeHours: '', sixHours: '', twelveHours: '', customDuration: '', customPrice: '', weekend: false, weekendPercent: 15, peak: false, peakPercent: 10, extraGuest: 0, tax: 5 }, policies: { facilities: ['Wi-Fi', 'Air Conditioning', 'Hot Water', 'Security'], checkIn: 'Valid government photo ID required', cancellation: 'Free cancellation up to 1 hour before check-in', idRequired: true, coupleFriendly: true, guestRestrictions: 'No restrictions', pets: 'Not allowed', smoking: 'Non-smoking property' }, bank: { accountHolder: partner?.fullName || '', bankName: '', accountNumber: '', confirmAccount: '', ifsc: '', pan: '', gst: '' }, terms: false });
const currency = (value) => `Ã¢â€šÂ¹${Number(value || 0).toLocaleString('en-IN')}`;

function textField(section, key, label, draft, setDraft, props = {}) {
  return <TextField label={label} value={draft[section][key] || ''} onChange={(event) => setDraft((current) => ({ ...current, [section]: { ...current[section], [key]: event.target.value } }))} fullWidth {...props} />;
}
function selectField(section, key, label, options, draft, setDraft) {
  return <FormControl fullWidth><InputLabel>{label}</InputLabel><Select label={label} value={draft[section][key] || ''} onChange={(event) => setDraft((current) => ({ ...current, [section]: { ...current[section], [key]: event.target.value } }))}>{options.map((option) => <MenuItem key={option} value={option}>{option}</MenuItem>)}</Select></FormControl>;
}
function fieldGrid(children) { return <Grid container spacing={2}>{children.map((child, index) => <Grid item xs={12} md={6} key={index}>{child}</Grid>)}</Grid>; }
function persistedDraft(draft) {
  const cleanImage = ({ file: _file, previewUrl: _previewUrl, ...image }) => image;
  return {
    ...draft,
    images: (draft.images || []).filter((image) => image.uploaded || image.imageUrl || image.dataUrl).map(cleanImage),
    rooms: (draft.rooms || []).map((room) => ({ ...room, photos: (room.photos || []).filter((image) => image.uploaded || image.imageUrl || image.dataUrl).map(cleanImage) })),
  };
}

function Onboarding() {
  const navigate = useNavigate(); const partner = useSelector((state) => state.auth.partner); const startNew = new URLSearchParams(window.location.search).get('new') === '1'; const savedDraft = startNew ? {} : getPartnerDraft(partner?.email); const baseDraft = initialDraft(partner); const [draft, setDraft] = useState(() => ({ ...baseDraft, ...savedDraft, business: { ...baseDraft.business, ...savedDraft.business }, location: { ...baseDraft.location, ...savedDraft.location }, pricing: { ...baseDraft.pricing, ...savedDraft.pricing }, policies: { ...baseDraft.policies, ...savedDraft.policies }, bank: { ...baseDraft.bank, ...savedDraft.bank } }));
  const [step, setStep] = useState(() => Math.min(savedDraft.step || 0, 7)); const [propertyId, setPropertyId] = useState(savedDraft.propertyId || null); const [error, setError] = useState(''); const [savingImages, setSavingImages] = useState(false); const [savingDraft, setSavingDraft] = useState(false); const [remoteDraftLoaded, setRemoteDraftLoaded] = useState(startNew); const [notice, setNotice] = useState(''); const [progress, setProgress] = useState(0); const [roomEditor, setRoomEditor] = useState(null); const [roomErrors, setRoomErrors] = useState(''); const blobUrls = useRef([]); const fileInput = useRef(null);
  const coverRequestRef = useRef('');
  function rememberPropertyId(id) {
    if (!id) return;
    setPropertyId(id);
    setDraft((current) => current.propertyId === id ? current : { ...current, propertyId: id });
  }
  useEffect(() => {
    let active = true;
    if (!startNew) getOnboardingDraft().then((remoteDraft) => {
      if (!active) return;
      if (remoteDraft) {
        setDraft((current) => ({ ...current, ...remoteDraft, business: { ...current.business, ...remoteDraft.business }, location: { ...current.location, ...remoteDraft.location }, pricing: { ...current.pricing, ...remoteDraft.pricing }, policies: { ...current.policies, ...remoteDraft.policies }, bank: { ...current.bank } }));
        if (remoteDraft.propertyId) rememberPropertyId(remoteDraft.propertyId);
        setStep(Math.min(remoteDraft.step || 0, 7));
      }
      setRemoteDraftLoaded(true);
    }).catch(() => { if (active) setRemoteDraftLoaded(true); });
    return () => { active = false; };
  }, [startNew]);
  useEffect(() => {
    savePartnerDraft(persistedDraft({ ...draft, step }), partner?.email);
    if (!remoteDraftLoaded) return undefined;
    const timeout = window.setTimeout(() => saveOnboardingDraft({ ...draft, step }).then((result) => {
      if (result.id) rememberPropertyId(result.id);
    }).catch(() => {
      setError((current) => current || 'Your latest changes could not sync to the server. They are still saved on this device.');
    }), 900);
    return () => window.clearTimeout(timeout);
  }, [draft, step, partner?.email, remoteDraftLoaded, propertyId]);
  useEffect(() => () => blobUrls.current.forEach((url) => URL.revokeObjectURL(url)), []);
  useEffect(() => {
    const selectedCover = draft.images.find((image) => image.cover && isPersistedImage(image));
    if (!propertyId || !selectedCover || coverRequestRef.current === selectedCover.id) return;
    coverRequestRef.current = selectedCover.id;
    updatePropertyImage(propertyId, selectedCover.id, { isCover: true }).catch((coverError) => {
      coverRequestRef.current = '';
      setError(coverError.response?.data?.message || 'Cover image selection could not be saved.');
    });
  }, [draft.images, propertyId]);
  const cover = useMemo(() => draft.images.find((image) => image.cover) || draft.images[0], [draft.images]);
  const setSection = (section, patch) => setDraft((current) => ({ ...current, [section]: { ...current[section], ...patch } }));

  function validateStep(index) {
    if (index === 0 && (!draft.business.name.trim() || !draft.business.owner.trim() || !draft.business.email.trim() || !draft.business.phone.trim())) return 'Complete the required business name, owner, email, and contact number.';
    if (index === 1 && (!draft.location.address1.trim() || !draft.location.city.trim() || !draft.location.state.trim() || !draft.location.pincode.trim())) return 'Add the property address, city, state, and pincode to continue.';
    if (index === 2 && requiredCategories.some((category) => !draft.images.some((image) => image.category === category))) return `Add at least one photo for each required category: ${requiredCategories.join(', ')}.`;
    if (index === 3 && !draft.rooms.length) return 'Add at least one room before continuing.';
    if (index === 4 && (!draft.pricing.oneHour || !draft.pricing.twoHours || !draft.pricing.threeHours || !draft.pricing.sixHours || !draft.pricing.twelveHours)) return 'Enter a price for each standard booking duration.';
    if (index === 6 && (!draft.bank.accountHolder.trim() || !draft.bank.bankName.trim() || !draft.bank.accountNumber.trim() || !draft.bank.ifsc.trim() || !draft.bank.pan.trim())) return 'Complete the required bank and PAN details.';
    if (index === 6 && draft.bank.accountNumber !== draft.bank.confirmAccount) return 'The account numbers do not match.';
    return '';
  }
  async function next() {
    const issue = validateStep(step);
    if (issue) { setError(issue); return; }
    setError(''); setSavingDraft(true);
    const nextStep = Math.min(step + 1, 7);
    try {
      const saved = await saveOnboardingDraft({ ...draft, step: nextStep });
      if (saved.id) rememberPropertyId(saved.id);
      savePartnerDraft(persistedDraft({ ...draft, propertyId: saved.id || propertyId, step: nextStep }), partner?.email);
      setStep(nextStep);
    } catch (saveError) {
      setError(saveError.response?.data?.message || 'Your changes could not be saved. Please check your connection and try again.');
    } finally { setSavingDraft(false); }
  }
  function back() { setError(''); setStep((value) => Math.max(value - 1, 0)); }
  function goTo(index) { setStep(index); setError(''); }
  async function saveDraft() {
    setSavingDraft(true); setError('');
    try { const saved = await saveOnboardingDraft({ ...draft, step }); if (saved.id) rememberPropertyId(saved.id); savePartnerDraft(persistedDraft({ ...draft, propertyId: saved.id || propertyId, step }), partner?.email); setNotice('Your draft has been saved.'); }
    catch (saveError) { setError(saveError.response?.data?.message || 'Your draft could not be saved to Roomly. Your local copy is still available.'); }
    finally { setSavingDraft(false); }
  }
  async function submit() {
    if (!draft.terms) { setError('Please agree to the terms and conditions before submitting.'); return; }
    if (savingDraft || savingImages) return;
    setSavingDraft(true); setError('');
    try {
      const saved = await saveOnboardingDraft({ ...draft, step: 7, propertyId: draft.propertyId || propertyId });
      const submissionDraft = { ...draft, propertyId: saved.id || propertyId || draft.propertyId, step: 7 };
      rememberPropertyId(submissionDraft.propertyId);
      const property = await submitOnboarding(submissionDraft);
      savePartnerDraft(persistedDraft({ ...submissionDraft, submittedReference: property.applicationReference }), partner?.email);
      navigate('/partner/dashboard', { replace: true });
    } catch (submitError) {
      setError(submitError.response?.data?.message || 'Your property details could not be saved. Please try again.');
    } finally { setSavingDraft(false); }
  }
  async function addImages(event, category = 'Room', targetRoomId = null) {
    const files = Array.from(event.target.files || []); event.target.value = '';
    if (!targetRoomId) category = fileInput.current?.dataset.category || category;
    else category = roomEditor?.id === targetRoomId ? (roomEditor.photoCategory || 'Room') : 'Room';
    if (!files.length) return;
    const invalid = files.find((file) => !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024);
    if (invalid) { setError(`${invalid.name}: choose JPG, PNG, or WebP images under 5 MB each.`); return; }
    const pending = files.map((file, index) => {
      const previewUrl = URL.createObjectURL(file);
      blobUrls.current.push(previewUrl);
      return { id: `pending-${Date.now()}-${index}-${Math.random().toString(16).slice(2)}`, name: file.name, category, previewUrl, uploaded: false };
    });
    setError(''); setSavingImages(true); setProgress(0);
    if (targetRoomId) {
      setDraft((current) => {
        const exists = current.rooms.some((room) => room.id === targetRoomId);
        const rooms = exists
          ? current.rooms.map((room) => room.id === targetRoomId ? { ...room, photos: [...(room.photos || []), ...pending] } : room)
          : [...current.rooms, { ...roomEditor, photos: [...(roomEditor?.photos || []), ...pending] }];
        return { ...current, rooms };
      });
      if (roomEditor?.id === targetRoomId) setRoomEditor((current) => ({ ...current, photos: [...(current.photos || []), ...pending] }));
    } else setDraft((current) => ({ ...current, images: [...current.images, ...pending] }));

    try {
      let parentId = propertyId;
      if (targetRoomId) {
        const room = roomEditor?.id === targetRoomId ? roomEditor : draft.rooms.find((item) => item.id === targetRoomId);
        if (!room) throw new Error('Save the room details before adding room photos.');
        const rooms = draft.rooms.some((item) => item.id === targetRoomId)
          ? draft.rooms.map((item) => item.id === targetRoomId ? { ...room, photos: (item.photos || []).filter((photo) => photo.uploaded) } : item)
          : [...draft.rooms, { ...room, photos: [] }];
        const saved = await saveOnboardingDraft({ ...draft, rooms });
        parentId = saved.id; rememberPropertyId(saved.id);
        if (!draft.rooms.some((item) => item.id === targetRoomId)) setDraft((current) => ({ ...current, rooms: current.rooms.some((item) => item.id === targetRoomId) ? current.rooms : [...current.rooms, { ...room, photos: pending }] }));
      } else if (!parentId) {
        const saved = await saveOnboardingDraft(draft);
        parentId = saved.id; rememberPropertyId(saved.id);
      }

      const storedImages = targetRoomId
        ? await uploadRoomImages(targetRoomId, files, category, setProgress)
        : await uploadPropertyImages(parentId, files, category, setProgress);
      const savedImages = storedImages.map((image, index) => ({
        id: image.id,
        name: image.imageDetails?.originalName || files[index]?.name || 'Property photo',
        category: image.category || category,
        imageUrl: image.imageUrl,
        cover: image.isCover,
        isCover: image.isCover,
        sortOrder: image.sortOrder,
        uploaded: true,
      }));
      pending.forEach((image) => {
        URL.revokeObjectURL(image.previewUrl);
        blobUrls.current = blobUrls.current.filter((url) => url !== image.previewUrl);
      });
      const replacePending = (photos) => [...photos.filter((photo) => !pending.some((item) => item.id === photo.id)), ...savedImages];
      if (targetRoomId) {
        setDraft((current) => ({ ...current, rooms: current.rooms.map((room) => room.id === targetRoomId ? { ...room, photos: replacePending(room.photos || []) } : room) }));
        if (roomEditor?.id === targetRoomId) setRoomEditor((current) => ({ ...current, photos: replacePending(current.photos || []) }));
      } else setDraft((current) => ({ ...current, images: replacePending(current.images) }));
      setProgress(100);
    } catch (uploadError) {
      pending.forEach((image) => {
        URL.revokeObjectURL(image.previewUrl);
        blobUrls.current = blobUrls.current.filter((url) => url !== image.previewUrl);
      });
      const removePending = (photos) => photos.filter((photo) => !pending.some((item) => item.id === photo.id));
      if (targetRoomId) {
        setDraft((current) => ({ ...current, rooms: current.rooms.map((room) => room.id === targetRoomId ? { ...room, photos: removePending(room.photos || []) } : room) }));
        if (roomEditor?.id === targetRoomId) setRoomEditor((current) => ({ ...current, photos: removePending(current.photos || []) }));
      } else setDraft((current) => ({ ...current, images: removePending(current.images) }));
      setError(uploadError.response?.data?.message || uploadError.message || 'The image upload failed. The image was not saved. Please try again.');
    } finally { setSavingImages(false); window.setTimeout(() => setProgress(0), 350); }
  }
  async function removeImage(id, roomId = null) {
    const image = roomId ? (roomEditor?.id === roomId ? roomEditor.photos?.find((item) => item.id === id) : draft.rooms.find((room) => room.id === roomId)?.photos.find((item) => item.id === id)) : draft.images.find((item) => item.id === id);
    if (isPersistedImage(image)) {
      try {
        if (roomId) await deleteRoomImage(roomId, id);
        else await deletePropertyImage(propertyId, id);
      } catch (deleteError) { setError(deleteError.response?.data?.message || 'The image could not be deleted.'); return; }
    }
    if (image?.previewUrl?.startsWith('blob:')) { URL.revokeObjectURL(image.previewUrl); blobUrls.current = blobUrls.current.filter((url) => url !== image.previewUrl); }
    if (roomId) {
      setDraft((current) => ({ ...current, rooms: current.rooms.map((room) => room.id === roomId ? { ...room, photos: removeAndSelectCover(room.photos || [], id) } : room) }));
      if (roomEditor?.id === roomId) setRoomEditor((current) => ({ ...current, photos: removeAndSelectCover(current.photos || [], id) }));
    }
    else setDraft((current) => ({ ...current, images: removeAndSelectCover(current.images, id) }));
  }
  async function reorderImage(index, delta) {
    const images = [...draft.images]; const destination = index + delta;
    if (destination < 0 || destination >= images.length) return;
    [images[index], images[destination]] = [images[destination], images[index]];
    try {
      await updatePropertyImageOrder(propertyId, images.filter(isPersistedImage).map((image) => image.id));
      setDraft((current) => ({ ...current, images }));
    } catch (orderError) { setError(orderError.response?.data?.message || 'Image order could not be saved.'); }
  }
  async function setRoomCover(roomId, imageId) {
    try {
      await updateRoomImage(roomId, imageId, { isCover: true });
      const selectCover = (photos) => photos.map((image) => ({ ...image, isCover: image.id === imageId, cover: image.id === imageId }));
      setDraft((current) => ({ ...current, rooms: current.rooms.map((room) => room.id === roomId ? { ...room, photos: selectCover(room.photos || []) } : room) }));
      if (roomEditor?.id === roomId) setRoomEditor((current) => ({ ...current, photos: selectCover(current.photos || []) }));
    } catch (coverError) { setError(coverError.response?.data?.message || 'Room cover image selection could not be saved.'); }
  }
  async function reorderRoomImage(roomId, index, delta) {
    const room = draft.rooms.find((item) => item.id === roomId) || roomEditor;
    if (!room) return;
    const photos = [...(room.photos || [])]; const destination = index + delta;
    if (destination < 0 || destination >= photos.length) return;
    [photos[index], photos[destination]] = [photos[destination], photos[index]];
    try {
      await updateRoomImageOrder(roomId, photos.filter(isPersistedImage).map((image) => image.id));
      setDraft((current) => ({ ...current, rooms: current.rooms.map((item) => item.id === roomId ? { ...item, photos } : item) }));
      if (roomEditor?.id === roomId) setRoomEditor((current) => ({ ...current, photos }));
    } catch (orderError) { setError(orderError.response?.data?.message || 'Room image order could not be saved.'); }
  }
  function closeRoomEditor() {
    if (roomEditor?.isNew) {
      const rooms = draft.rooms.filter((room) => room.id !== roomEditor.id);
      setDraft((current) => ({ ...current, rooms }));
      if (propertyId) saveOnboardingDraft({ ...draft, rooms }).catch((saveError) => setError(saveError.response?.data?.message || 'The cancelled room draft could not be removed from the server.'));
    }
    setRoomEditor(null);
  }
  function saveRoom() { if (!roomEditor?.name.trim() || !roomEditor?.roomNumber.trim()) { setRoomErrors('Room name and number are required.'); return; } setDraft((current) => ({ ...current, rooms: roomEditor.isNew ? [...current.rooms, roomEditor] : current.rooms.map((room) => room.id === roomEditor.id ? roomEditor : room) })); setRoomEditor(null); setRoomErrors(''); }
  const imageSrc = (image) => image.previewUrl && blobUrls.current.includes(image.previewUrl) ? image.previewUrl : image.imageUrl || image.dataUrl;
  const pricing = draft.pricing;
  const commission = 15;
  const netFor = (amount) => Number(amount || 0) * (1 + Number(pricing.tax || 0) / 100) * (1 - commission / 100);

  return <Box sx={{ minHeight: '100vh', bgcolor: '#F7F8FC' }}>
    <Box sx={{ height: 76, px: { xs: 2, md: 5 }, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#fff', borderBottom: '1px solid #E9EDF3', position: 'sticky', top: 0, zIndex: 4 }}><Brand /><Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}><Typography variant="body2" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>Partner setup</Typography><Avatar sx={{ width: 34, height: 34, bgcolor: 'secondary.light', color: 'secondary.main', fontSize: 13 }}>{partner?.fullName?.[0] || 'P'}</Avatar></Box></Box>
    <Box sx={{ maxWidth: 1320, mx: 'auto', p: { xs: 2, md: 4 } }}><Box sx={{ mb: 3 }}><Typography className="eyebrow">PROPERTY ONBOARDING</Typography><Typography variant="h4" sx={{ mt: .6 }}>LetÃ¢â‚¬â„¢s get your property ready</Typography><Typography color="text.secondary" sx={{ mt: .75 }}>Tell us about your property. You can save your progress and return any time.</Typography></Box>
      <Grid container spacing={3} alignItems="flex-start"><Grid item xs={12} md={3}><Paper sx={{ p: 2.5, position: { md: 'sticky' }, top: 94 }}><Typography fontWeight={800} sx={{ mb: 1.5 }}>Setup progress</Typography><Stepper activeStep={step} orientation="vertical">{steps.map((label, index) => <Step key={label} completed={index < step}><StepLabel onClick={() => index <= step && goTo(index)} sx={{ cursor: index <= step ? 'pointer' : 'default' }}><Typography variant="body2" fontWeight={index === step ? 700 : 500}>{label}</Typography></StepLabel></Step>)}</Stepper><Divider sx={{ my: 2 }} /><Typography variant="caption" color="text.secondary">Your details are saved automatically on this device.</Typography></Paper></Grid>
      <Grid item xs={12} md={9}><Paper sx={{ p: { xs: 2.25, sm: 3.5, md: 4.5 }, minHeight: 580 }}><Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}><Box><Typography className="eyebrow">STEP {step + 1} OF 8</Typography><Typography variant="h5" fontWeight={800} sx={{ mt: .5 }}>{steps[step]}</Typography></Box><Chip label={`${Math.round(((step + 1) / 8) * 100)}% complete`} color="secondary" variant="outlined" /></Box>
        {error && <Alert severity="error" sx={{ mb: 2.5 }} onClose={() => setError('')}>{error}</Alert>}
        {step === 0 && <Stack spacing={2.5}><Typography color="text.secondary">Start with the details your guests will see on your listing.</Typography>{fieldGrid([textField('business', 'name', 'Business / hotel name', draft, setDraft, { required: true }), selectField('business', 'propertyType', 'Property type', propertyTypes, draft, setDraft), textField('business', 'owner', 'Owner full name', draft, setDraft, { required: true }), textField('business', 'email', 'Business email', draft, setDraft, { type: 'email', required: true }), textField('business', 'phone', 'Contact number', draft, setDraft, { type: 'tel', required: true }), textField('business', 'alternatePhone', 'Alternate contact number', draft, setDraft, { type: 'tel' }), textField('business', 'yearEstablished', 'Year established', draft, setDraft, { type: 'number', inputProps: { min: 1800, max: new Date().getFullYear() } }), textField('business', 'description', 'Business description', draft, setDraft, { multiline: true, minRows: 3 })])}</Stack>}
        {step === 1 && <Stack spacing={2.5}><Typography color="text.secondary">Add a precise address to help guests find you.</Typography>{fieldGrid([textField('location', 'address1', 'Address line 1', draft, setDraft, { required: true }), textField('location', 'address2', 'Address line 2', draft, setDraft), textField('location', 'landmark', 'Nearby landmark', draft, setDraft), textField('location', 'city', 'City', draft, setDraft, { required: true }), textField('location', 'state', 'State', draft, setDraft, { required: true }), textField('location', 'pincode', 'Pincode', draft, setDraft, { required: true }), textField('location', 'latitude', 'Latitude (optional)', draft, setDraft), textField('location', 'longitude', 'Longitude (optional)', draft, setDraft)])}<Paper variant="outlined" sx={{ minHeight: 200, display: 'grid', placeItems: 'center', overflow: 'hidden', background: 'linear-gradient(135deg,#eef2fa,#e4eafa)', position: 'relative' }}><Box sx={{ textAlign: 'center', color: '#526782' }}><LocationOnRoundedIcon sx={{ fontSize: 38, color: 'secondary.main' }} /><Typography fontWeight={700}>Map preview</Typography><Typography variant="body2">Location selector will be available here</Typography><Typography variant="caption">{draft.location.city || 'Add your city'}{draft.location.state ? `, ${draft.location.state}` : ''}</Typography></Box><Chip icon={<RoomRoundedIcon />} label="Map placeholder" size="small" sx={{ position: 'absolute', right: 12, top: 12, bgcolor: '#fff' }} /></Paper></Stack>}
        {step === 2 && <Stack spacing={2.5}><Box><Typography color="text.secondary">Clear, well-lit photos help guests choose your property. Add JPG, PNG, or WebP images up to 5 MB each.</Typography><Typography variant="body2" sx={{ mt: 1 }}>Required photos: {requiredCategories.map((category) => <Chip key={category} size="small" label={category} color={draft.images.some((image) => image.category === category) ? 'success' : 'default'} icon={draft.images.some((image) => image.category === category) ? <CheckCircleRoundedIcon /> : undefined} sx={{ mr: .6, mt: .6 }} />)}</Typography></Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><Typography fontWeight={800}>Property gallery <Typography component="span" color="text.secondary" fontWeight={400}>({draft.images.length} photos)</Typography></Typography><Button startIcon={<AddPhotoAlternateRoundedIcon />} onClick={() => fileInput.current?.click()} variant="outlined">Add photos</Button><input ref={fileInput} hidden multiple type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => addImages(event)} /></Box>
           {savingImages && <Box><LinearProgress variant="determinate" value={progress} /><Typography variant="caption" color="text.secondary">Uploading images to Roomly StorageÃ¢â‚¬Â¦ {progress}%</Typography></Box>}
          {draft.images.length === 0 ? <Box onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); const files = { files: event.dataTransfer.files, target: { value: '' } }; addImages(files); }} sx={{ border: '1.5px dashed #C9D0DE', borderRadius: 3, minHeight: 230, display: 'grid', placeItems: 'center', textAlign: 'center', p: 3, cursor: 'pointer', bgcolor: '#FAFBFE' }} onClick={() => fileInput.current?.click()}><Box><PhotoCameraRoundedIcon sx={{ fontSize: 44, color: 'secondary.main' }} /><Typography fontWeight={800}>Drop your property photos here</Typography><Typography variant="body2" color="text.secondary" sx={{ mt: .5 }}>or browse files from your device</Typography></Box></Box> : <Grid container spacing={1.5} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); addImages({ files: event.dataTransfer.files, target: { value: '' } }); }}>{draft.images.map((image, index) => <Grid item xs={6} sm={4} lg={3} key={image.id}><Box sx={{ borderRadius: 2.5, border: '1px solid #E5E8EF', overflow: 'hidden', bgcolor: '#fff' }}><Box component="img" src={imageSrc(image)} alt={image.name} sx={{ width: '100%', height: 136, objectFit: 'cover', display: 'block' }} /><Box sx={{ p: 1.1 }}><Typography variant="caption" noWrap display="block" fontWeight={700}>{image.name}</Typography><Typography variant="caption" color="text.secondary" noWrap display="block">{image.category}</Typography><Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mt: .8 }}><Button size="small" onClick={() => setDraft((current) => ({ ...current, images: current.images.map((item) => ({ ...item, cover: item.id === image.id })) }))} color={image.cover || (!draft.images.some((item) => item.cover) && index === 0) ? 'secondary' : 'inherit'}>{image.cover || (!draft.images.some((item) => item.cover) && index === 0) ? 'Cover' : 'Set cover'}</Button><Box><IconButton size="small" disabled={index === 0} onClick={() => reorderImage(index, -1)} aria-label="Move photo earlier">Ã¢â€ â€˜</IconButton><IconButton size="small" disabled={index === draft.images.length - 1} onClick={() => reorderImage(index, 1)} aria-label="Move photo later">Ã¢â€ â€œ</IconButton><IconButton size="small" color="error" onClick={() => removeImage(image.id)} aria-label="Delete photo"><DeleteOutlineRoundedIcon fontSize="small" /></IconButton></Box></Stack></Box></Box></Grid>)}</Grid>}
          <FormControl fullWidth><InputLabel>Photo category for next upload</InputLabel><Select label="Photo category for next upload" defaultValue="Other Facilities" onChange={(event) => { fileInput.current.dataset.category = event.target.value; }} >{imageCategories.map((category) => <MenuItem value={category} key={category}>{category}{requiredCategories.includes(category) ? ' Ã‚Â· Required' : ''}</MenuItem>)}</Select></FormControl>
        </Stack>}
        {step === 3 && <Stack spacing={2.5}><Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><Typography color="text.secondary">Set up the rooms guests can book by the hour.</Typography><Button variant="contained" startIcon={<AddPhotoAlternateRoundedIcon />} onClick={() => { setRoomErrors(''); setRoomEditor({ ...blankRoom(), isNew: true }); }}>Add room</Button></Box>{draft.rooms.length === 0 ? <Paper variant="outlined" sx={{ p: 5, textAlign: 'center', bgcolor: '#FAFBFE' }}><Typography fontWeight={800}>No rooms added yet</Typography><Typography color="text.secondary" variant="body2" sx={{ mt: .5 }}>Add your first room to continue.</Typography></Paper> : draft.rooms.map((room) => <Paper key={room.id} variant="outlined" sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'center' }}><Box sx={{ width: 76, height: 68, bgcolor: '#F0EFFA', borderRadius: 2, display: 'grid', placeItems: 'center', overflow: 'hidden', flexShrink: 0 }}>{room.photos?.length ? <Box component="img" src={imageSrc(room.photos[0])} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <RoomRoundedIcon color="secondary" />}</Box><Box sx={{ flex: 1, minWidth: 0 }}><Typography fontWeight={800}>{room.name} <Typography component="span" variant="body2" color="text.secondary">Ã‚Â· Room {room.roomNumber}</Typography></Typography><Typography variant="body2" color="text.secondary">{room.category} Ã‚Â· {room.maxGuests} guests Ã‚Â· {room.photos?.length || 0} photos</Typography></Box><Chip label={room.available ? 'Available' : 'Unavailable'} color={room.available ? 'success' : 'default'} size="small" />{[<EditRoundedIcon />, <DeleteOutlineRoundedIcon />].map((icon, index) => <IconButton key={index} color={index ? 'error' : 'default'} onClick={() => index ? setDraft((current) => ({ ...current, rooms: current.rooms.filter((item) => item.id !== room.id) })) : setRoomEditor({ ...room, isNew: false })}>{icon}</IconButton>)}</Paper>)}</Stack>}
        {step === 4 && <Stack spacing={2.5}><Typography color="text.secondary">Set your base rates for the most popular stay durations. The estimated payout includes applicable tax and our sample 15% platform commission.</Typography>{fieldGrid([['oneHour', '1 hour price'], ['twoHours', '2 hours price'], ['threeHours', '3 hours price'], ['sixHours', '6 hours price'], ['twelveHours', '12 hours price']].map(([key, label]) => <TextField key={key} label={label} type="number" value={pricing[key]} onChange={(event) => setSection('pricing', { [key]: event.target.value })} InputProps={{ startAdornment: <Typography color="text.secondary" sx={{ mr: 1 }}>Ã¢â€šÂ¹</Typography> }} inputProps={{ min: 0 }} fullWidth />).concat([<TextField key="customDuration" label="Custom duration (hours)" type="number" value={pricing.customDuration} onChange={(event) => setSection('pricing', { customDuration: event.target.value })} helperText="Use a duration other than 1, 2, 3, 6, or 12 hours; standard rates take priority." />, <TextField key="customPrice" label="Custom duration price" type="number" value={pricing.customPrice} onChange={(event) => setSection('pricing', { customPrice: event.target.value })} />]))}
          <Paper variant="outlined" sx={{ p: 2.5 }}><Typography fontWeight={800} sx={{ mb: 1.5 }}>Additional pricing</Typography><Stack spacing={1}>{[['weekend', 'Weekend pricing', 'weekendPercent', 'Weekend uplift'], ['peak', 'Peak-time pricing', 'peakPercent', 'Peak-time uplift']].map(([toggle, label, fieldName, fieldLabel]) => <Box key={toggle} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}><FormControlLabel control={<Switch checked={Boolean(pricing[toggle])} onChange={(event) => setSection('pricing', { [toggle]: event.target.checked })} />} label={label} sx={{ flex: 1 }} /><TextField label={fieldLabel} type="number" size="small" disabled={!pricing[toggle]} value={pricing[fieldName]} onChange={(event) => setSection('pricing', { [fieldName]: event.target.value })} InputProps={{ endAdornment: <Typography>%</Typography> }} sx={{ maxWidth: 150 }} /></Box>)}<Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mt: 1 }}><Typography sx={{ flex: 1 }}>Extra guest charge</Typography><TextField size="small" type="number" value={pricing.extraGuest} onChange={(event) => setSection('pricing', { extraGuest: event.target.value })} InputProps={{ startAdornment: <Typography>Ã¢â€šÂ¹</Typography> }} sx={{ maxWidth: 150 }} /></Box><Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}><Typography sx={{ flex: 1 }}>Tax rate</Typography><TextField size="small" type="number" value={pricing.tax} onChange={(event) => setSection('pricing', { tax: event.target.value })} InputProps={{ endAdornment: <Typography>%</Typography> }} sx={{ maxWidth: 150 }} /></Box></Stack></Paper>
          <Paper sx={{ p: 2.5, bgcolor: '#F5F3FD' }}><Typography fontWeight={800} sx={{ mb: 1 }}>Earnings preview Ã‚Â· 6 hour stay</Typography><Stack spacing={.75}><Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography color="text.secondary">Guest pays (including {pricing.tax}% tax)</Typography><Typography>{currency(Number(pricing.sixHours || 0) * (1 + Number(pricing.tax || 0) / 100))}</Typography></Box><Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography color="text.secondary">Platform commission (15%)</Typography><Typography>Ã¢Ë†â€™ {currency(Number(pricing.sixHours || 0) * (1 + Number(pricing.tax || 0) / 100) * commission / 100)}</Typography></Box><Divider /><Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography fontWeight={800}>Estimated payout</Typography><Typography fontWeight={800} color="success.main">{currency(netFor(pricing.sixHours))}</Typography></Box></Stack></Paper>
        </Stack>}
        {step === 5 && <Stack spacing={3}><Box><Typography fontWeight={800} sx={{ mb: 1.5 }}>Property facilities</Typography><Grid container>{facilityOptions.map((facility) => <Grid item xs={6} sm={4} key={facility}><FormControlLabel control={<Checkbox checked={draft.policies.facilities.includes(facility)} onChange={(event) => setSection('policies', { facilities: event.target.checked ? [...draft.policies.facilities, facility] : draft.policies.facilities.filter((value) => value !== facility) })} />} label={<Typography variant="body2">{facility}</Typography>} /></Grid>)}</Grid></Box><Divider /><Box><Typography fontWeight={800} sx={{ mb: 2 }}>Guest policies</Typography><Stack spacing={2}>{fieldGrid([selectField('policies', 'checkIn', 'Check-in policy', ['Valid government photo ID required', 'Passport or government photo ID required', 'All adult guests must show valid ID'], draft, setDraft), selectField('policies', 'cancellation', 'Cancellation policy', ['Free cancellation up to 1 hour before check-in', 'Free cancellation up to 3 hours before check-in', 'Non-refundable'], draft, setDraft), selectField('policies', 'guestRestrictions', 'Guest restrictions', ['No restrictions', 'Adults only', 'Families only'], draft, setDraft), selectField('policies', 'pets', 'Pet policy', ['Not allowed', 'Allowed on request', 'Pets welcome'], draft, setDraft), selectField('policies', 'smoking', 'Smoking policy', ['Non-smoking property', 'Smoking rooms available', 'Smoking allowed in designated areas'], draft, setDraft)])}<Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}><FormControlLabel control={<Switch checked={draft.policies.idRequired} onChange={(event) => setSection('policies', { idRequired: event.target.checked })} />} label="ID proof required" /><FormControlLabel control={<Switch checked={draft.policies.coupleFriendly} onChange={(event) => setSection('policies', { coupleFriendly: event.target.checked })} />} label="Couple friendly" /></Stack></Stack></Box></Stack>}
        {step === 6 && <Stack spacing={2.5}><Alert severity="info">Your details are stored on this device for this demo. Account numbers are masked in all portal views.</Alert>{fieldGrid([textField('bank', 'accountHolder', 'Account holder name', draft, setDraft, { required: true }), textField('bank', 'bankName', 'Bank name', draft, setDraft, { required: true }), textField('bank', 'accountNumber', 'Account number', draft, setDraft, { required: true, type: 'password' }), textField('bank', 'confirmAccount', 'Confirm account number', draft, setDraft, { required: true, type: 'password' }), textField('bank', 'ifsc', 'IFSC code', draft, setDraft, { required: true }), textField('bank', 'pan', 'PAN number', draft, setDraft, { required: true }), textField('bank', 'gst', 'GST number (optional)', draft, setDraft)])}<Paper variant="outlined" sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}><CheckCircleRoundedIcon color="success" /><Box><Typography fontWeight={700}>Verification status</Typography><Typography variant="body2" color="text.secondary">Details will be reviewed after you submit your property.</Typography></Box><Chip label="Not verified" size="small" sx={{ ml: 'auto' }} /></Paper></Stack>}
        {step === 7 && <Stack spacing={2.5}><Typography color="text.secondary">Review your property details before submitting for partner verification.</Typography>{[[0, 'Business details', `${draft.business.name || 'Ã¢â‚¬â€'} Ã‚Â· ${draft.business.propertyType} Ã‚Â· ${draft.business.owner} Ã‚Â· ${draft.business.email}`], [1, 'Location', `${draft.location.address1 || 'Ã¢â‚¬â€'}${draft.location.address2 ? `, ${draft.location.address2}` : ''} Ã‚Â· ${draft.location.city || 'Ã¢â‚¬â€'}, ${draft.location.state || 'Ã¢â‚¬â€'} ${draft.location.pincode || ''}`], [2, 'Property photos', `${draft.images.length} photos Ã‚Â· ${draft.images.filter((image) => image.cover).length ? 'Cover photo selected' : 'First photo will be the cover'}`], [3, 'Rooms', `${draft.rooms.length} room types configured`], [4, 'Hourly pricing', `1 hour ${currency(pricing.oneHour)} Ã‚Â· 6 hours ${currency(pricing.sixHours)} Ã‚Â· 12 hours ${currency(pricing.twelveHours)}`], [5, 'Facilities & policies', `${draft.policies.facilities.length} facilities selected Ã‚Â· ${draft.policies.coupleFriendly ? 'Couple friendly' : 'Couple policy not selected'}`], [6, 'Bank & verification', `${draft.bank.bankName || 'Bank details pending'} Ã‚Â· Account ending ${draft.bank.accountNumber.slice(-4) || 'Ã¢â‚¬Â¢Ã¢â‚¬Â¢Ã¢â‚¬Â¢Ã¢â‚¬Â¢'}`]].map(([index, title, detail]) => <Paper key={title} variant="outlined" sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}><Box sx={{ width: 48, height: 42, borderRadius: 1.5, overflow: 'hidden', bgcolor: '#F3F4F8', display: 'grid', placeItems: 'center', flexShrink: 0 }}>{index === 2 && cover ? <Box component="img" src={imageSrc(cover)} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <CheckCircleRoundedIcon color="success" />}</Box><Box sx={{ flex: 1, minWidth: 0 }}><Typography fontWeight={800}>{title}</Typography><Typography variant="body2" color="text.secondary" noWrap>{detail}</Typography></Box><Button startIcon={<EditRoundedIcon />} size="small" onClick={() => goTo(index)}>Edit</Button></Paper>)}<FormControlLabel control={<Checkbox checked={draft.terms} onChange={(event) => setDraft((current) => ({ ...current, terms: event.target.checked }))} />} label={<Typography variant="body2">I confirm these details are accurate and agree to RoomlyÃ¢â‚¬â„¢s Partner Terms and Conditions.</Typography>} /></Stack>}
        <Divider sx={{ my: 3.5 }} /><Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}><Stack direction="row" spacing={1}><Button disabled={step === 0} onClick={back} startIcon={<ArrowBackRoundedIcon />}>Back</Button><Button onClick={saveDraft} disabled={savingDraft || savingImages}>{savingDraft ? 'SavingÃ¢â‚¬Â¦' : 'Save draft'}</Button></Stack>{step < 7 ? <Button variant="contained" onClick={next} disabled={savingDraft || savingImages} endIcon={savingDraft ? <CircularProgress size={17} /> : <ArrowForwardRoundedIcon />}>Save & continue</Button> : <Button variant="contained" onClick={submit} disabled={savingImages || savingDraft} endIcon={savingImages ? <CircularProgress size={17} /> : <CheckCircleRoundedIcon />}>Submit property</Button>}</Box>
      </Paper></Grid></Grid>
    </Box>
    <Snackbar open={Boolean(notice)} autoHideDuration={3500} onClose={() => setNotice('')} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}><Alert severity="success" onClose={() => setNotice('')}>{notice}</Alert></Snackbar>
    {roomEditor && <RoomEditor room={roomEditor} setRoom={setRoomEditor} onClose={closeRoomEditor} onSave={saveRoom} error={roomErrors || error} addImages={addImages} removeImage={removeImage} imageSrc={imageSrc} savingImages={savingImages} progress={progress} onSetCover={setRoomCover} onReorder={reorderRoomImage} />}
  </Box>;
}

function RoomEditor({ room, setRoom, onClose, onSave, error, addImages, removeImage, imageSrc, savingImages, progress, onSetCover, onReorder }) {
  const update = (key, value) => setRoom((current) => ({ ...current, [key]: value }));
  return <Box sx={{ position: 'fixed', inset: 0, bgcolor: 'rgba(18,31,52,.42)', zIndex: 10, display: 'grid', placeItems: 'center', p: 2 }}>
    <Paper sx={{ width: 'min(760px, 100%)', maxHeight: '92vh', overflow: 'auto', p: { xs: 2.5, md: 4 } }}>
      <Typography variant="h5" fontWeight={800}>{room.isNew ? 'Add a room' : 'Edit room'}</Typography>
      <Typography color="text.secondary" sx={{ mt: .5, mb: 2.5 }}>Guests can book each room for flexible hourly stays.</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}><TextField label="Room number" value={room.roomNumber} onChange={(event) => update('roomNumber', event.target.value)} fullWidth required /></Grid>
        <Grid item xs={12} sm={6}><TextField label="Room name" value={room.name} onChange={(event) => update('name', event.target.value)} fullWidth required /></Grid>
        <Grid item xs={12} sm={6}><FormControl fullWidth><InputLabel>Room category</InputLabel><Select label="Room category" value={room.category} onChange={(event) => update('category', event.target.value)}>{roomCategories.map((category) => <MenuItem key={category} value={category}>{category}</MenuItem>)}</Select></FormControl></Grid>
        <Grid item xs={6}><TextField type="number" label="Maximum guests" value={room.maxGuests} onChange={(event) => update('maxGuests', event.target.value)} fullWidth /></Grid>
        <Grid item xs={6}><TextField type="number" label="Number of beds" value={room.beds} onChange={(event) => update('beds', event.target.value)} fullWidth /></Grid>
        <Grid item xs={6}><FormControl fullWidth><InputLabel>Bed type</InputLabel><Select label="Bed type" value={room.bedType} onChange={(event) => update('bedType', event.target.value)}>{['Single', 'Twin', 'Double', 'Queen', 'King', 'Bunk'].map((value) => <MenuItem key={value} value={value}>{value}</MenuItem>)}</Select></FormControl></Grid>
        <Grid item xs={6}><TextField label="Room size" placeholder="e.g. 280 sq ft" value={room.size} onChange={(event) => update('size', event.target.value)} fullWidth /></Grid>
        <Grid item xs={6}><FormControl fullWidth><InputLabel>Bathroom type</InputLabel><Select label="Bathroom type" value={room.bathroom} onChange={(event) => update('bathroom', event.target.value)}>{['Attached', 'Shared', 'Accessible'].map((value) => <MenuItem key={value} value={value}>{value}</MenuItem>)}</Select></FormControl></Grid>
        <Grid item xs={12}><TextField label="Room description" value={room.description} onChange={(event) => update('description', event.target.value)} fullWidth multiline minRows={2} /></Grid>
        <Grid item xs={12}><Typography variant="body2" fontWeight={700}>Room amenities</Typography><Box>{['Wi-Fi', 'Air Conditioning', 'Television', 'Mini fridge', 'Work desk', 'Balcony'].map((item) => <FormControlLabel key={item} control={<Checkbox checked={room.amenities.includes(item)} onChange={(event) => update('amenities', event.target.checked ? [...room.amenities, item] : room.amenities.filter((value) => value !== item))} />} label={item} />)}</Box></Grid>
        <Grid item xs={12}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }}>
            <Typography fontWeight={700} sx={{ flexGrow: 1 }}>Room photos ({room.photos.length})</Typography>
            <FormControl size="small" sx={{ minWidth: 170 }}><InputLabel>Photo category</InputLabel><Select label="Photo category" value={room.photoCategory || 'Room'} onChange={(event) => update('photoCategory', event.target.value)}>{['Room', 'Bedroom', 'Bathroom', 'View', 'Other Facilities'].map((category) => <MenuItem key={category} value={category}>{category}</MenuItem>)}</Select></FormControl>
            <Button component="label" disabled={savingImages} startIcon={<AddPhotoAlternateRoundedIcon />}>Upload<input hidden multiple type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => addImages(event, room.photoCategory || 'Room', room.id)} /></Button>
          </Stack>
          {savingImages && <Box sx={{ mt: 1 }}><LinearProgress variant="determinate" value={progress} /><Typography variant="caption" color="text.secondary">Uploading to Roomly Storageâ€¦ {progress}%</Typography></Box>}
          <Stack direction="row" spacing={1} sx={{ mt: 1, overflowX: 'auto', pb: 1 }}>{room.photos.map((photo, index) => <Paper key={photo.id} variant="outlined" sx={{ position: 'relative', flex: '0 0 132px', p: .75 }}>
            <Box component="img" src={imageSrc(photo)} alt={photo.name || 'Room photo'} sx={{ width: '100%', height: 76, objectFit: 'cover', borderRadius: 1.5 }} />
            <Typography variant="caption" noWrap display="block">{photo.name || photo.category}</Typography>
            {(photo.isCover || photo.cover) && <Chip size="small" color="secondary" label="Cover" sx={{ position: 'absolute', top: 8, left: 8 }} />}
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <IconButton size="small" disabled={index === 0 || savingImages} onClick={() => onReorder(room.id, index, -1)} aria-label="Move image left"><Typography variant="caption">?</Typography></IconButton>
              <Button size="small" disabled={savingImages || !isPersistedImage(photo)} onClick={() => onSetCover(room.id, photo.id)}>Cover</Button>
              <IconButton size="small" disabled={index === room.photos.length - 1 || savingImages} onClick={() => onReorder(room.id, index, 1)} aria-label="Move image right"><Typography variant="caption">?</Typography></IconButton>
              <IconButton size="small" disabled={savingImages} onClick={() => removeImage(photo.id, room.id)} sx={{ color: 'error.main' }}><DeleteOutlineRoundedIcon fontSize="small" /></IconButton>
            </Stack>
          </Paper>)}</Stack>
        </Grid>
        <Grid item xs={12}><FormControlLabel control={<Switch checked={room.available} onChange={(event) => update('available', event.target.checked)} />} label="Room is available for booking" /></Grid>
      </Grid>
      <Stack direction="row" justifyContent="flex-end" spacing={1.5} sx={{ mt: 3 }}><Button onClick={onClose} disabled={savingImages}>Cancel</Button><Button variant="contained" onClick={onSave} disabled={savingImages}>Save room</Button></Stack>
    </Paper>
  </Box>;
}

export default Onboarding;
