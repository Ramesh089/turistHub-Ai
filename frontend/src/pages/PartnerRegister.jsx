import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Hotel,
  Bus,
  Plane,
  Utensils,
  Waves,
  Building2,
  CheckCircle,
  Upload,
  X,
  ChevronRight,
  ChevronLeft,
  AlertTriangle,
  FileText,
  ArrowRight,
} from 'lucide-react';
import api from '../services/api';

// ─── Constants ───────────────────────────────────────────────────────────────

const CATEGORIES = [
  {
    id: 'hotel',
    icon: Hotel,
    title: 'Hotel / Resort',
    subtitle: 'Accommodation providers including hotels, resorts & lodges',
    emoji: '🏨',
  },
  {
    id: 'bus',
    icon: Bus,
    title: 'Bus Operator',
    subtitle: 'Inter-city & tourist bus services, tempo travellers',
    emoji: '🚌',
  },
  {
    id: 'travel',
    icon: Plane,
    title: 'Tour & Travel Package',
    subtitle: 'Travel agencies offering holiday & tour packages',
    emoji: '✈️',
  },
  {
    id: 'restaurant',
    icon: Utensils,
    title: 'Restaurant / Dining',
    subtitle: 'Restaurants, cafes, food courts & dining experiences',
    emoji: '🍽️',
  },
  {
    id: 'adventure',
    icon: Waves,
    title: 'Adventure / Activity',
    subtitle: 'Adventure sports, treks, water sports & experiential activities',
    emoji: '🏄',
  },
  {
    id: 'other',
    icon: Building2,
    title: 'Other Tourism Service',
    subtitle: 'Any other tourism-related business not listed above',
    emoji: '🏢',
  },
];

const API_CATEGORY_VALUES = {
  hotel: 'Hotel',
  bus: 'Bus Operator',
  travel: 'Tour & Travel',
  restaurant: 'Restaurant',
  adventure: 'Adventure',
  other: 'Other',
};

const REQUIRED_DOCS = {
  hotel: ['GST Certificate', 'Hotel/Lodge License', 'Fire Safety Certificate', 'FSSAI License (if applicable)'],
  bus: ['Vehicle Registration Certificate', 'Route Permit', 'Vehicle Fitness Certificate', 'Insurance Certificate'],
  travel: ['GST Certificate', 'IATA/TAAI License (if applicable)', 'Company Registration Certificate'],
  restaurant: ['FSSAI License', 'GST Certificate', 'Fire Safety Certificate'],
  adventure: ['Safety Certification', 'Insurance Certificate', 'Business Registration'],
  other: ['GST Certificate', 'Business Registration Certificate'],
};

const INDIAN_STATES = [
  'Andhra Pradesh', 'Assam', 'Bihar', 'Delhi', 'Goa', 'Gujarat',
  'Himachal Pradesh', 'Jammu & Kashmir', 'Karnataka', 'Kerala',
  'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Other',
];

const STEP_LABELS = ['Email', 'Category', 'Details', 'Documents', 'Review'];

// ─── Stepper Component ────────────────────────────────────────────────────────

function Stepper({ step }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 36 }}>
      {STEP_LABELS.map((label, idx) => {
        const num = idx + 1;
        const isActive = num === step;
        const isDone = num < step;
        return (
          <div key={label} style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: 15,
                  background: isDone
                    ? '#10b981'
                    : isActive
                    ? '#0284c7'
                    : 'transparent',
                  border: isDone
                    ? '2px solid #10b981'
                    : isActive
                    ? '2px solid #0284c7'
                    : '2px solid #cbd5e1',
                  color: isDone || isActive ? '#fff' : '#94a3b8',
                  transition: 'all 0.3s ease',
                  flexShrink: 0,
                }}
              >
                {isDone ? <CheckCircle size={20} /> : num}
              </div>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? '#0284c7' : isDone ? '#10b981' : '#94a3b8',
                  whiteSpace: 'nowrap',
                }}
              >
                {label}
              </span>
            </div>
            {idx < STEP_LABELS.length - 1 && (
              <div
                style={{
                  width: 60,
                  height: 2,
                  background: num < step ? '#10b981' : '#e2e8f0',
                  marginBottom: 20,
                  marginLeft: 8,
                  marginRight: 8,
                  transition: 'background 0.3s ease',
                  flexShrink: 0,
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function StepEmail({ email, setEmail, onNext }) {
  const [error, setError] = useState('');

  const handleNext = () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }
    setError('');
    setEmail(email.trim().toLowerCase());
    onNext();
  };

  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <h1 style={{ fontFamily: "'Cinzel', serif", fontSize: '1.7rem', fontWeight: 700, color: '#1e293b', marginBottom: 8 }}>
          Start with your email
        </h1>
        <p style={{ color: '#64748b', fontSize: 14 }}>
          We’ll use this email for your application updates and, if approved, to send your secure account setup link.
        </p>
      </div>
      <label htmlFor="partner-registration-email" style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
        Email Address *
      </label>
      <input
        id="partner-registration-email"
        type="email"
        autoComplete="email"
        value={email}
        onChange={(event) => {
          setEmail(event.target.value);
          if (error) setError('');
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter') handleNext();
        }}
        placeholder="business@example.com"
        style={{
          padding: '12px 14px',
          borderRadius: 10,
          border: `1.5px solid ${error ? '#ef4444' : 'rgba(2,132,199,0.25)'}`,
          fontSize: 14,
          width: '100%',
          boxSizing: 'border-box',
          marginBottom: 6,
        }}
      />
      {error && <p style={{ color: '#ef4444', fontSize: 12, margin: '2px 0 12px' }}>{error}</p>}
      <button
        type="button"
        onClick={handleNext}
        style={{ width: '100%', padding: 12, marginTop: 16, border: 0, borderRadius: 10, background: '#0284c7', color: '#fff', fontWeight: 700, cursor: 'pointer' }}
      >
        Continue
      </button>
    </div>
  );
}

// ─── Step 2: Category Selection ───────────────────────────────────────────────

function StepCategory({ category, setCategory, onNext }) {
  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <h1
          style={{
            fontFamily: "'Cinzel', serif",
            fontSize: 'clamp(1.5rem, 4vw, 2.2rem)',
            fontWeight: 700,
            color: '#0284c7',
            marginBottom: 8,
          }}
        >
          Partner with TouristHub AI
        </h1>
        <p style={{ color: '#64748b', fontSize: 16, maxWidth: 500, margin: '0 auto' }}>
          Select your business category to get started with your partnership application.
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: 16,
          marginBottom: 32,
        }}
      >
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isSelected = category === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              style={{
                background: isSelected
                  ? 'linear-gradient(135deg, rgba(2,132,199,0.08) 0%, rgba(16,185,129,0.06) 100%)'
                  : '#fff',
                border: isSelected ? '2px solid #0284c7' : '1.5px solid rgba(2,132,199,0.15)',
                borderRadius: 16,
                padding: '20px 16px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s ease',
                outline: 'none',
                boxShadow: isSelected
                  ? '0 4px 20px rgba(2,132,199,0.15)'
                  : '0 2px 8px rgba(0,0,0,0.04)',
                transform: isSelected ? 'translateY(-2px)' : 'none',
              }}
            >
              <div style={{ fontSize: 32, marginBottom: 10 }}>{cat.emoji}</div>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: isSelected ? '#0284c7' : '#1e293b',
                  marginBottom: 6,
                }}
              >
                {cat.title}
              </div>
              <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.4 }}>
                {cat.subtitle}
              </div>
              {isSelected && (
                <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <CheckCircle size={15} color="#0284c7" />
                  <span style={{ fontSize: 12, color: '#0284c7', fontWeight: 600 }}>Selected</span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={onNext}
          disabled={!category}
          className="btn-primary"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '12px 28px',
            fontSize: 15,
            fontWeight: 600,
            borderRadius: 12,
            opacity: !category ? 0.5 : 1,
            cursor: !category ? 'not-allowed' : 'pointer',
          }}
        >
          Continue
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}

// ─── Step 3: Business Details Form ───────────────────────────────────────────

function StepDetails({ formData, setFormData, errors, setErrors, onNext, onBack }) {
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.businessName.trim()) newErrors.businessName = 'Business name is required.';
    if (!formData.contactPerson.trim()) newErrors.contactPerson = 'Contact person name is required.';
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required.';
    } else if (!/^\+?[\d\s\-]{10,}$/.test(formData.phone)) {
      newErrors.phone = 'Phone number must be at least 10 digits.';
    }
    if (!formData.address.trim()) newErrors.address = 'Full address is required.';
    if (!formData.city.trim()) newErrors.city = 'City is required.';
    if (!formData.state) newErrors.state = 'Please select a state.';
    if (!formData.pincode.trim()) {
      newErrors.pincode = 'Pincode is required.';
    } else if (!/^\d{6}$/.test(formData.pincode)) {
      newErrors.pincode = 'Pincode must be exactly 6 digits.';
    }
    return newErrors;
  };

  const handleNext = () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    onNext();
  };

  const fieldStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  };

  const labelStyle = {
    fontSize: 13,
    fontWeight: 600,
    color: '#374151',
  };

  const inputStyle = (hasError) => ({
    padding: '10px 14px',
    borderRadius: 10,
    border: `1.5px solid ${hasError ? '#ef4444' : 'rgba(2,132,199,0.25)'}`,
    fontSize: 14,
    color: '#1e293b',
    outline: 'none',
    background: '#fff',
    width: '100%',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    transition: 'border-color 0.2s',
  });

  const errorStyle = {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 2,
  };

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontFamily: "'Cinzel', serif", fontSize: '1.5rem', fontWeight: 700, color: '#1e293b', marginBottom: 6 }}>
          Business Details
        </h2>
        <p style={{ color: '#64748b', fontSize: 14 }}>
          Tell us about your business. All fields marked with * are required.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
        {/* Business Name */}
        <div style={fieldStyle}>
          <label style={labelStyle}>Business Name *</label>
          <input
            name="businessName"
            type="text"
            value={formData.businessName}
            onChange={handleChange}
            placeholder="e.g. Sunrise Hotels & Resorts"
            style={inputStyle(errors.businessName)}
          />
          {errors.businessName && <span style={errorStyle}>{errors.businessName}</span>}
        </div>

        {/* Contact Person */}
        <div style={fieldStyle}>
          <label style={labelStyle}>Contact Person Name *</label>
          <input
            name="contactPerson"
            type="text"
            value={formData.contactPerson}
            onChange={handleChange}
            placeholder="e.g. Ravi Kumar"
            style={inputStyle(errors.contactPerson)}
          />
          {errors.contactPerson && <span style={errorStyle}>{errors.contactPerson}</span>}
        </div>

        {/* Phone */}
        <div style={fieldStyle}>
          <label style={labelStyle}>Phone Number *</label>
          <input
            name="phone"
            type="tel"
            value={formData.phone}
            onChange={handleChange}
            placeholder="+91 98765 43210"
            style={inputStyle(errors.phone)}
          />
          {errors.phone && <span style={errorStyle}>{errors.phone}</span>}
        </div>

        {/* City */}
        <div style={fieldStyle}>
          <label style={labelStyle}>City *</label>
          <input
            name="city"
            type="text"
            value={formData.city}
            onChange={handleChange}
            placeholder="e.g. Mumbai"
            style={inputStyle(errors.city)}
          />
          {errors.city && <span style={errorStyle}>{errors.city}</span>}
        </div>

        {/* State */}
        <div style={fieldStyle}>
          <label style={labelStyle}>State *</label>
          <select
            name="state"
            value={formData.state}
            onChange={handleChange}
            style={{ ...inputStyle(errors.state), cursor: 'pointer' }}
          >
            <option value="">Select a state…</option>
            {INDIAN_STATES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          {errors.state && <span style={errorStyle}>{errors.state}</span>}
        </div>

        {/* Pincode */}
        <div style={fieldStyle}>
          <label style={labelStyle}>Pincode *</label>
          <input
            name="pincode"
            type="text"
            value={formData.pincode}
            onChange={handleChange}
            placeholder="6-digit pincode"
            maxLength={6}
            style={inputStyle(errors.pincode)}
          />
          {errors.pincode && <span style={errorStyle}>{errors.pincode}</span>}
        </div>

        {/* GST Number (optional) */}
        <div style={fieldStyle}>
          <label style={labelStyle}>GST Number <span style={{ color: '#94a3b8', fontWeight: 400 }}>(optional)</span></label>
          <input
            name="gstNumber"
            type="text"
            value={formData.gstNumber}
            onChange={handleChange}
            placeholder="e.g. 22AAAAA0000A1Z5"
            style={inputStyle(false)}
          />
        </div>
      </div>

      {/* Full Address – full width */}
      <div style={{ ...fieldStyle, marginTop: 20 }}>
        <label style={labelStyle}>Full Address *</label>
        <textarea
          name="address"
          value={formData.address}
          onChange={handleChange}
          placeholder="Street address, area, landmark…"
          rows={3}
          style={{ ...inputStyle(errors.address), resize: 'vertical', lineHeight: 1.6 }}
        />
        {errors.address && <span style={errorStyle}>{errors.address}</span>}
      </div>

      {/* Business Details (optional) */}
      <div style={{ ...fieldStyle, marginTop: 20 }}>
        <label style={labelStyle}>
          Business Details / Description{' '}
          <span style={{ color: '#94a3b8', fontWeight: 400 }}>(optional)</span>
        </label>
        <textarea
          name="businessDetails"
          value={formData.businessDetails}
          onChange={handleChange}
          placeholder="Briefly describe your business, services offered, years of operation, etc."
          rows={4}
          style={{ ...inputStyle(false), resize: 'vertical', lineHeight: 1.6 }}
        />
      </div>

      {/* Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 32, gap: 12 }}>
        <button
          onClick={onBack}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '11px 22px',
            borderRadius: 12,
            border: '1.5px solid rgba(2,132,199,0.3)',
            background: '#fff',
            color: '#0284c7',
            fontWeight: 600,
            fontSize: 14,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          <ChevronLeft size={17} />
          Back
        </button>
        <button
          onClick={handleNext}
          className="btn-primary"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '11px 28px',
            fontSize: 15,
            fontWeight: 600,
            borderRadius: 12,
          }}
        >
          Continue
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}

// ─── Step 3: Document Upload ──────────────────────────────────────────────────

function StepDocuments({ category, documents, setDocuments, errors, setErrors, onNext, onBack }) {
  const requiredDocs = REQUIRED_DOCS[category] || [];

  const handleFileChange = (docType, e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setErrors((prev) => ({ ...prev, [docType]: 'Only PDF files are accepted.' }));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, [docType]: 'File size must not exceed 5 MB.' }));
      return;
    }
    setDocuments((prev) => ({ ...prev, [docType]: file }));
    setErrors((prev) => ({ ...prev, [docType]: '' }));
    e.target.value = '';
  };

  const removeFile = (docType) => {
    setDocuments((prev) => {
      const next = { ...prev };
      delete next[docType];
      return next;
    });
  };

  const handleNext = () => {
    const missing = requiredDocs.filter((d) => !documents[d]);
    if (missing.length > 0) {
      const errs = {};
      missing.forEach((d) => { errs[d] = 'This document is required.'; });
      setErrors(errs);
      return;
    }
    setErrors({});
    onNext();
  };

  const UploadSlot = ({ docType, required }) => {
    const file = documents[docType];
    const error = errors[docType];
    const inputId = `doc-${docType.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '')}`;

    return (
      <div
        style={{
          border: error
            ? '1.5px solid #ef4444'
            : file
            ? '1.5px solid #10b981'
            : '1.5px dashed rgba(2,132,199,0.35)',
          borderRadius: 12,
          padding: '16px 18px',
          background: file
            ? 'rgba(16,185,129,0.04)'
            : error
            ? 'rgba(239,68,68,0.03)'
            : 'rgba(2,132,199,0.02)',
          transition: 'all 0.2s',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <FileText size={15} color={file ? '#10b981' : '#0284c7'} />
              <span style={{ fontSize: 14, fontWeight: 600, color: '#1e293b' }}>
                {docType}
                {required && <span style={{ color: '#ef4444', marginLeft: 2 }}>*</span>}
              </span>
            </div>

            {!file && (
              <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 10 }}>
                PDF only, max 5 MB
              </p>
            )}

            {file ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13, color: '#10b981', fontWeight: 500 }}>
                  ✓ {file.name}
                </span>
                <span style={{ fontSize: 11, color: '#94a3b8' }}>
                  ({(file.size / 1024).toFixed(0)} KB)
                </span>
              </div>
            ) : (
              <label
                htmlFor={inputId}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '7px 14px',
                  borderRadius: 8,
                  background: 'rgba(2,132,199,0.08)',
                  color: '#0284c7',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: '1px solid rgba(2,132,199,0.2)',
                  transition: 'background 0.2s',
                }}
              >
                <Upload size={14} />
                Choose PDF
              </label>
            )}
            <input
              id={inputId}
              type="file"
              accept=".pdf,application/pdf"
              style={{ display: 'none' }}
              onChange={(e) => handleFileChange(docType, e)}
            />
          </div>

          {file && (
            <button
              onClick={() => removeFile(docType)}
              title="Remove file"
              style={{
                background: 'rgba(239,68,68,0.08)',
                border: 'none',
                borderRadius: 8,
                padding: '6px 8px',
                cursor: 'pointer',
                color: '#ef4444',
                display: 'flex',
                alignItems: 'center',
                flexShrink: 0,
              }}
            >
              <X size={15} />
            </button>
          )}
        </div>

        {error && (
          <p style={{ fontSize: 12, color: '#ef4444', marginTop: 8 }}>{error}</p>
        )}
      </div>
    );
  };

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontFamily: "'Cinzel', serif", fontSize: '1.5rem', fontWeight: 700, color: '#1e293b', marginBottom: 6 }}>
          Document Upload
        </h2>
        <p style={{ color: '#64748b', fontSize: 14 }}>
          Upload the required documents for your business category. All documents must be in PDF format (max 5 MB each).
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 4 }}>
          Required Documents
        </p>
        {requiredDocs.map((doc) => (
          <UploadSlot key={doc} docType={doc} required />
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 8 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 4 }}>
          Additional Documents{' '}
          <span style={{ color: '#94a3b8', fontWeight: 400 }}>(optional)</span>
        </p>
        <UploadSlot docType="Additional Document" required={false} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 32, gap: 12 }}>
        <button
          onClick={onBack}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '11px 22px',
            borderRadius: 12,
            border: '1.5px solid rgba(2,132,199,0.3)',
            background: '#fff',
            color: '#0284c7',
            fontWeight: 600,
            fontSize: 14,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          <ChevronLeft size={17} />
          Back
        </button>
        <button
          onClick={handleNext}
          className="btn-primary"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '11px 28px',
            fontSize: 15,
            fontWeight: 600,
            borderRadius: 12,
          }}
        >
          Review Application
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}

// ─── Step 4: Review & Consent ─────────────────────────────────────────────────

function StepReview({
  category,
  formData,
  documents,
  privacyConsent,
  setPrivacyConsent,
  submitting,
  onSubmit,
  onBack,
  errors,
}) {
  const categoryLabel = CATEGORIES.find((c) => c.id === category)?.title || category;

  const SectionHeader = ({ title }) => (
    <h3
      style={{
        fontSize: 13,
        fontWeight: 700,
        color: '#0284c7',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        marginBottom: 12,
        paddingBottom: 8,
        borderBottom: '1px solid rgba(2,132,199,0.15)',
      }}
    >
      {title}
    </h3>
  );

  const Row = ({ label, value }) => (
    <div style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
      <span style={{ fontSize: 13, color: '#64748b', minWidth: 160, flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 13, color: '#1e293b', fontWeight: 500, wordBreak: 'break-word' }}>
        {value || <em style={{ color: '#94a3b8' }}>Not provided</em>}
      </span>
    </div>
  );

  const uploadedDocs = Object.entries(documents).filter(([, file]) => file);

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontFamily: "'Cinzel', serif", fontSize: '1.5rem', fontWeight: 700, color: '#1e293b', marginBottom: 6 }}>
          Review Your Application
        </h2>
        <p style={{ color: '#64748b', fontSize: 14 }}>
          Please verify all details before submitting. You can go back to make changes.
        </p>
      </div>

      {/* Category */}
      <div
        style={{
          background: 'rgba(2,132,199,0.04)',
          border: '1px solid rgba(2,132,199,0.12)',
          borderRadius: 14,
          padding: '18px 20px',
          marginBottom: 20,
        }}
      >
        <SectionHeader title="Business Category" />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 28 }}>{CATEGORIES.find((c) => c.id === category)?.emoji}</span>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#1e293b' }}>{categoryLabel}</div>
            <div style={{ fontSize: 13, color: '#64748b' }}>
              {CATEGORIES.find((c) => c.id === category)?.subtitle}
            </div>
          </div>
        </div>
      </div>

      {/* Business Details */}
      <div
        style={{
          background: 'rgba(2,132,199,0.04)',
          border: '1px solid rgba(2,132,199,0.12)',
          borderRadius: 14,
          padding: '18px 20px',
          marginBottom: 20,
        }}
      >
        <SectionHeader title="Business Details" />
        <Row label="Business Name" value={formData.businessName} />
        <Row label="Contact Person" value={formData.contactPerson} />
        <Row label="Email Address" value={formData.email} />
        <Row label="Phone Number" value={formData.phone} />
        <Row label="Full Address" value={formData.address} />
        <Row label="City" value={formData.city} />
        <Row label="State" value={formData.state} />
        <Row label="Pincode" value={formData.pincode} />
        <Row label="GST Number" value={formData.gstNumber} />
        <Row label="Business Description" value={formData.businessDetails} />
      </div>

      {/* Documents */}
      <div
        style={{
          background: 'rgba(2,132,199,0.04)',
          border: '1px solid rgba(2,132,199,0.12)',
          borderRadius: 14,
          padding: '18px 20px',
          marginBottom: 24,
        }}
      >
        <SectionHeader title="Uploaded Documents" />
        {uploadedDocs.length === 0 ? (
          <p style={{ fontSize: 13, color: '#94a3b8' }}>No documents uploaded.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {uploadedDocs.map(([docType, file]) => (
              <div
                key={docType}
                style={{ display: 'flex', alignItems: 'center', gap: 10 }}
              >
                <CheckCircle size={15} color="#10b981" />
                <span style={{ fontSize: 13, fontWeight: 600, color: '#374151', minWidth: 200 }}>
                  {docType}
                </span>
                <span style={{ fontSize: 12, color: '#64748b' }}>
                  {file.name} ({(file.size / 1024).toFixed(0)} KB)
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Warning notice */}
      <div
        style={{
          background: 'rgba(245,158,11,0.08)',
          border: '1.5px solid rgba(245,158,11,0.35)',
          borderRadius: 14,
          padding: '16px 20px',
          display: 'flex',
          gap: 12,
          marginBottom: 24,
          alignItems: 'flex-start',
        }}
      >
        <AlertTriangle size={20} color="#d97706" style={{ flexShrink: 0, marginTop: 2 }} />
        <div>
          <p style={{ fontSize: 14, color: '#92400e', fontWeight: 600, marginBottom: 4 }}>
            Application Review Notice
          </p>
          <p style={{ fontSize: 13, color: '#78350f', lineHeight: 1.6 }}>
            Submitting this application does not guarantee approval. Our team will review your
            application and documents within <strong>3–5 business days</strong>. You will be
            notified via email of the decision.
          </p>
        </div>
      </div>

      {/* Privacy consent */}
      <label
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 12,
          cursor: 'pointer',
          marginBottom: 28,
          padding: '14px 18px',
          border: `1.5px solid ${errors.privacyConsent ? '#ef4444' : 'rgba(2,132,199,0.2)'}`,
          borderRadius: 12,
          background: errors.privacyConsent ? 'rgba(239,68,68,0.03)' : 'rgba(2,132,199,0.03)',
        }}
      >
        <div
          style={{
            width: 20,
            height: 20,
            borderRadius: 5,
            border: `2px solid ${privacyConsent ? '#0284c7' : '#cbd5e1'}`,
            background: privacyConsent ? '#0284c7' : '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            marginTop: 1,
            transition: 'all 0.2s',
          }}
          onClick={() => setPrivacyConsent((v) => !v)}
        >
          {privacyConsent && (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 6L5 9L10 3" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
        <input
          type="checkbox"
          checked={privacyConsent}
          onChange={(e) => setPrivacyConsent(e.target.checked)}
          style={{ display: 'none' }}
        />
        <span style={{ fontSize: 14, color: '#374151', lineHeight: 1.5 }}>
          I agree to TouristHub AI's{' '}
          <a href="/privacy" style={{ color: '#0284c7', textDecoration: 'underline' }}>
            Privacy Policy
          </a>{' '}
          and{' '}
          <a href="/terms" style={{ color: '#0284c7', textDecoration: 'underline' }}>
            Terms of Service
          </a>
          .
        </span>
      </label>

      {errors.privacyConsent && (
        <p style={{ fontSize: 12, color: '#ef4444', marginTop: -20, marginBottom: 20 }}>
          {errors.privacyConsent}
        </p>
      )}

      {errors.submit && (
        <div
          style={{
            background: 'rgba(239,68,68,0.07)',
            border: '1.5px solid rgba(239,68,68,0.3)',
            borderRadius: 10,
            padding: '12px 16px',
            fontSize: 13,
            color: '#b91c1c',
            marginBottom: 20,
          }}
        >
          {errors.submit}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
        <button
          onClick={onBack}
          disabled={submitting}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '11px 22px',
            borderRadius: 12,
            border: '1.5px solid rgba(2,132,199,0.3)',
            background: '#fff',
            color: '#0284c7',
            fontWeight: 600,
            fontSize: 14,
            cursor: submitting ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit',
            opacity: submitting ? 0.6 : 1,
          }}
        >
          <ChevronLeft size={17} />
          Back
        </button>

        <button
          onClick={onSubmit}
          disabled={submitting}
          className="btn-primary"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '11px 28px',
            fontSize: 15,
            fontWeight: 600,
            borderRadius: 12,
            opacity: submitting ? 0.75 : 1,
            cursor: submitting ? 'not-allowed' : 'pointer',
          }}
        >
          {submitting ? (
            <>
              <span
                style={{
                  width: 16,
                  height: 16,
                  border: '2.5px solid rgba(255,255,255,0.35)',
                  borderTopColor: '#fff',
                  borderRadius: '50%',
                  display: 'inline-block',
                  animation: 'spin 0.75s linear infinite',
                }}
              />
              Submitting…
            </>
          ) : (
            <>
              Submit Application
              <ArrowRight size={17} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Success State ────────────────────────────────────────────────────────────

function SuccessState({ submitResult, email }) {
  return (
    <div style={{ textAlign: 'center', padding: '20px 0' }}>
      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #10b981, #059669)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px',
          boxShadow: '0 8px 32px rgba(16,185,129,0.25)',
        }}
      >
        <CheckCircle size={40} color="#fff" />
      </div>

      <h1
        style={{
          fontFamily: "'Cinzel', serif",
          fontSize: 'clamp(1.4rem, 3vw, 1.9rem)',
          fontWeight: 700,
          color: '#065f46',
          marginBottom: 12,
        }}
      >
        Application Submitted Successfully!
      </h1>

      <p style={{ color: '#374151', fontSize: 15, marginBottom: 28, lineHeight: 1.6 }}>
        Thank you for partnering with TouristHub AI. Your application is now pending admin review. You can check its status using your application ID and email.
      </p>

      {/* Application ID */}
      {submitResult?.applicationId && (
        <div
          style={{
            display: 'inline-block',
            background: 'rgba(2,132,199,0.07)',
            border: '1.5px solid rgba(2,132,199,0.2)',
            borderRadius: 12,
            padding: '14px 24px',
            marginBottom: 24,
          }}
        >
          <p style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Application ID</p>
          <p style={{ fontSize: 18, fontWeight: 700, color: '#0284c7', letterSpacing: '0.05em' }}>
            {submitResult.applicationId}
          </p>
          <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
            Save this ID to track your application
          </p>
        </div>
      )}

      {/* Review timeline */}
      <div
        style={{
          background: 'rgba(2,132,199,0.04)',
          border: '1px solid rgba(2,132,199,0.12)',
          borderRadius: 12,
          padding: '14px 18px',
          marginBottom: 32,
          fontSize: 13,
          color: '#374151',
          lineHeight: 1.6,
        }}
      >
        ⏱️ Our team will review your application within <strong>3–5 business days</strong> and
        notify you at <strong>{email}</strong>.
      </div>

      {/* Action links */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
        <Link
          to={`/partner/status?applicationId=${encodeURIComponent(submitResult?.applicationId || '')}&email=${encodeURIComponent(email)}`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 7,
            padding: '12px 24px',
            borderRadius: 12,
            background: 'linear-gradient(135deg, #0284c7, #0369a1)',
            color: '#fff',
            fontWeight: 600,
            fontSize: 14,
            textDecoration: 'none',
            boxShadow: '0 4px 14px rgba(2,132,199,0.3)',
          }}
        >
          Track / Check Application Status
          <ArrowRight size={16} />
        </Link>
        <Link
          to="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 7,
            padding: '12px 24px',
            borderRadius: 12,
            border: '1.5px solid rgba(2,132,199,0.3)',
            background: '#fff',
            color: '#0284c7',
            fontWeight: 600,
            fontSize: 14,
            textDecoration: 'none',
          }}
        >
          Return Home
        </Link>
      </div>
    </div>
  );
}

// ─── Spinner keyframe (injected once) ────────────────────────────────────────

if (typeof document !== 'undefined' && !document.getElementById('partner-register-styles')) {
  const style = document.createElement('style');
  style.id = 'partner-register-styles';
  style.textContent = `
    @keyframes spin {
      from { transform: rotate(0deg); }
      to   { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PartnerRegister() {
  const [step, setStep] = useState(1);
  const [category, setCategory] = useState('');
  const [formData, setFormData] = useState({
    businessName: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    gstNumber: '',
    businessDetails: '',
  });
  const [documents, setDocuments] = useState({});
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);

  const handleSubmit = async () => {
    const newErrors = {};
    if (!privacyConsent) {
      newErrors.privacyConsent = 'You must agree to the Privacy Policy and Terms of Service.';
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSubmitting(true);
    setErrors({});

    try {
      const fd = new FormData();
      fd.append('businessName', formData.businessName);
      fd.append('contactPerson', formData.contactPerson);
      fd.append('email', formData.email);
      fd.append('phone', formData.phone);
      fd.append('address', formData.address);
      fd.append('city', formData.city);
      fd.append('state', formData.state);
      fd.append('pincode', formData.pincode);
      fd.append('gstNumber', formData.gstNumber);
      fd.append('businessDetails', formData.businessDetails);
      const apiCategory = API_CATEGORY_VALUES[category];
      if (!apiCategory) {
        setErrors({ submit: 'Select a valid business category before submitting.' });
        return;
      }
      fd.append('category', apiCategory);
      fd.append('privacyConsent', 'true');

      Object.entries(documents).forEach(([docType, file]) => {
        if (file) {
          fd.append('documents', file, file.name);
          fd.append('documentTypes', docType);
        }
      });

      const res = await api.post('/partner/apply', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setSubmitResult(res.data);
      setSubmitted(true);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        'Submission failed. Please try again.';
      setErrors({ submit: msg });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(160deg, #f0f9ff 0%, #f8fafc 50%, #f0fdf4 100%)',
        padding: '40px 16px 80px',
      }}
    >
      {/* Decorative blobs */}
      <div
        style={{
          position: 'fixed',
          top: -100,
          left: -100,
          width: 400,
          height: 400,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(2,132,199,0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
      <div
        style={{
          position: 'fixed',
          bottom: -80,
          right: -80,
          width: 350,
          height: 350,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(16,185,129,0.07) 0%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      <div
        style={{
          maxWidth: 780,
          margin: '0 auto',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Header logo / brand */}
        {!submitted && (
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <Link
              to="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10,
                textDecoration: 'none',
              }}
            >
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, #0284c7, #10b981)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 14px rgba(2,132,199,0.3)',
                }}
              >
                <span style={{ fontSize: 22 }}>✈️</span>
              </div>
              <span
                style={{
                  fontFamily: "'Cinzel', serif",
                  fontWeight: 700,
                  fontSize: 20,
                  color: '#0284c7',
                  letterSpacing: '0.02em',
                }}
              >
                TouristHub AI
              </span>
            </Link>
          </div>
        )}

        {/* Main card */}
        <div
          style={{
            background: '#fff',
            borderRadius: 20,
            border: '1px solid rgba(2,132,199,0.15)',
            boxShadow: '0 8px 40px rgba(2,132,199,0.08)',
            padding: 'clamp(24px, 5vw, 48px)',
          }}
        >
          {submitted ? (
            <SuccessState submitResult={submitResult} email={formData.email} />
          ) : (
            <>
              <Stepper step={step} />

              {step === 1 && (
                <StepEmail
                  email={formData.email}
                  setEmail={(email) => setFormData((prev) => ({ ...prev, email }))}
                  onNext={() => setStep(2)}
                />
              )}

              {step === 2 && (
                <StepCategory
                  category={category}
                  setCategory={setCategory}
                  onNext={() => setStep(3)}
                />
              )}

              {step === 3 && (
                <StepDetails
                  formData={formData}
                  setFormData={setFormData}
                  errors={errors}
                  setErrors={setErrors}
                  onNext={() => setStep(4)}
                  onBack={() => setStep(2)}
                />
              )}

              {step === 4 && (
                <StepDocuments
                  category={category}
                  documents={documents}
                  setDocuments={setDocuments}
                  errors={errors}
                  setErrors={setErrors}
                  onNext={() => setStep(5)}
                  onBack={() => setStep(3)}
                />
              )}

              {step === 5 && (
                <StepReview
                  category={category}
                  formData={formData}
                  documents={documents}
                  privacyConsent={privacyConsent}
                  setPrivacyConsent={setPrivacyConsent}
                  submitting={submitting}
                  onSubmit={handleSubmit}
                  onBack={() => setStep(4)}
                  errors={errors}
                />
              )}
            </>
          )}
        </div>

        {/* Footer note */}
        {!submitted && (
          <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: 12, marginTop: 20 }}>
            <Link to="/partner/status" style={{ color: '#0284c7', textDecoration: 'underline', marginRight: 12 }}>
              Track / Check Application Status
            </Link>
            Already a partner?{' '}
            <Link to="/partner/login" style={{ color: '#0284c7', textDecoration: 'underline' }}>
              Sign in to your partner dashboard
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
