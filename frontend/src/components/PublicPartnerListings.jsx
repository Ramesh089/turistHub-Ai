import React, { useEffect, useState } from 'react';
import api from '../services/api';
import BookingModal from './BookingModal';
import { Bus, Clock, Star, IndianRupee, ShieldCheck } from 'lucide-react';

function imageSrc(imageUrl) {
  if (!imageUrl) return '';
  if (/^https?:\/\//i.test(imageUrl)) return imageUrl;
  const origin = (api.defaults.baseURL || '').replace(/\/api\/?$/, '');
  return `${origin}${imageUrl}`;
}

export default function PublicPartnerListings({
  categories,
  title = 'Verified partner services',
  layout = 'card'
}) {
  const [listings, setListings] = useState([]);
  const [bookingListing, setBookingListing] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [bookingMessage, setBookingMessage] = useState('');

  const isTransportLayout = layout === 'transport'
    || (categories.length === 1 && categories[0] === 'Bus Operator')
    || categories.includes('Bus Operator');

  useEffect(() => {
    let cancelled = false;
    Promise.all(categories.map(category => api.get('/listings', { params: { category, limit: 50 } })))
      .then(responses => {
        if (!cancelled) setListings(responses.flatMap(response => response.data.listings || []));
      })
      .catch(error => {
        console.error('Failed to load published partner listings:', error);
      });
    return () => { cancelled = true; };
  }, [categories.join('|'), reloadKey]);

  if (!listings.length) return null;

  const handleBookingClick = (listing, cap, booked, remaining) => {
    setBookingMessage('');
    const parts = (listing.locationOrRoute || '').split(/\s*(?:->|→|to|-)\s*/i);
    const resolvedFrom = listing.city || (parts.length >= 2 ? parts[0].trim() : '') || 'Bengaluru';
    const resolvedTo = (parts.length >= 2 ? parts[1].trim() : (listing.locationOrRoute || listing.state)) || 'Mysuru';

    setBookingListing({
      id: listing.id,
      listingTitle: listing.listingTitle,
      title: listing.listingTitle,
      name: listing.listingTitle,
      provider: listing.listingTitle,
      price: Number(listing.price || 0),
      category: listing.category,
      priceUnit: listing.category === 'Bus Operator' ? 'per person' : (listing.priceUnit || 'per person'),
      capacity: cap,
      seats_total: cap,
      bookedUnits: booked,
      remainingCapacity: remaining,
      location: listing.locationOrRoute || listing.city || '',
      locationOrRoute: listing.locationOrRoute || listing.city || '',
      from_city: resolvedFrom,
      to_city: resolvedTo,
      departure_time: listing.availability || 'Daily departures 9:00 PM',
      transport_type: listing.category === 'Bus Operator' ? 'Luxury AC Bus' : listing.category,
      destination_name: listing.city || listing.state || 'India',
      image_url: imageSrc(listing.primaryImage?.imageUrl)
    });
  };

  return (
    <section style={{ marginTop: 36, marginBottom: 28 }}>
      <h2 style={{
        marginBottom: 16,
        color: '#0f172a',
        fontSize: '1.35rem',
        fontWeight: 800,
        letterSpacing: '0.3px',
        textTransform: isTransportLayout ? 'uppercase' : 'none'
      }}>
        {title}
      </h2>

      {bookingMessage && (
        <div role="status" style={{ marginBottom: 14, padding: 12, borderRadius: 9, background: '#dcfce7', color: '#166534' }}>
          {bookingMessage}
        </div>
      )}

      {/* HORIZONTAL TRANSPORT STRIP LAYOUT (Matching existing transport options) */}
      {isTransportLayout ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {listings.map(listing => {
            const cap = Number(listing.capacity || 40);
            const booked = Number(listing.bookedUnits || 0);
            const remaining = Number(listing.remainingCapacity !== undefined ? listing.remainingCapacity : Math.max(0, cap - booked));
            const isFullyBooked = remaining <= 0 && booked >= cap;

            const parts = (listing.locationOrRoute || '').split(/\s*(?:->|→|to|-)\s*/i);
            const fromCity = listing.city || (parts.length >= 2 ? parts[0].trim() : '') || 'Bengaluru';
            const toCity = (parts.length >= 2 ? parts[1].trim() : (listing.locationOrRoute || listing.state)) || 'Mysuru';
            const departureTime = listing.availability || 'Dep: 09:00 PM • Daily Service';

            return (
              <div
                key={listing.id}
                style={{
                  background: isFullyBooked ? '#f8fafc' : '#ffffff',
                  borderRadius: 16,
                  border: '1px solid #e2e8f0',
                  padding: '20px 24px',
                  display: 'grid',
                  gridTemplateColumns: 'auto 1fr auto',
                  alignItems: 'center',
                  gap: 20,
                  opacity: isFullyBooked ? 0.6 : 1,
                  boxShadow: '0 2px 10px rgba(0, 0, 0, 0.04)',
                  transition: 'transform 0.15s, box-shadow 0.15s'
                }}
              >
                {/* Left: Mode Icon */}
                <div
                  style={{
                    width: 54,
                    height: 54,
                    borderRadius: 14,
                    background: '#fffbeb',
                    border: '1.5px solid #fde68a',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  <Bus size={26} color="#b45309" />
                </div>

                {/* Middle: Service Information */}
                <div>
                  {/* Tags */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                    <span
                      style={{
                        background: '#fffbeb',
                        color: '#b45309',
                        padding: '2px 8px',
                        borderRadius: 12,
                        fontSize: '0.72rem',
                        fontWeight: 800
                      }}
                    >
                      Bus
                    </span>
                    <span
                      style={{
                        background: '#ecfdf5',
                        color: '#047857',
                        border: '1px solid #a7f3d0',
                        padding: '2px 8px',
                        borderRadius: 12,
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4
                      }}
                    >
                      <ShieldCheck size={12} /> Verified Partner
                    </span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>
                      #{listing.id}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: '0.75rem', color: '#16a34a', fontWeight: 700 }}>
                      <Star size={13} fill="#16a34a" /> 4.90
                    </span>
                  </div>

                  {/* Title */}
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '2px 0 6px', color: '#0f172a' }}>
                    {listing.listingTitle}
                  </h3>

                  {/* Route & Times */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: '0.88rem', color: '#334155', flexWrap: 'wrap' }}>
                    <div style={{ fontWeight: 700 }}>
                      {fromCity} &rarr; {toCity}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Clock size={13} />
                      {departureTime}
                    </div>
                  </div>

                  {/* Vehicle details & amenities */}
                  <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 6, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <span style={{ background: '#f8fafc', padding: '2px 6px', borderRadius: 4, border: '1px solid #e2e8f0' }}>
                      Luxury AC Sleeper Coach
                    </span>
                    <span style={{ color: '#0284c7', fontWeight: 700 }}>
                      • Live Seat Map Available
                    </span>
                    {isFullyBooked ? (
                      <span style={{ color: '#dc2626', fontWeight: 700 }}>
                        • Fully booked
                      </span>
                    ) : (
                      <span style={{ color: '#059669', fontWeight: 600 }}>
                        • {remaining} seats available
                      </span>
                    )}
                  </div>
                </div>

                {/* Right: Fare & Action Button */}
                <div style={{ textAlign: 'right', minWidth: 150 }}>
                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                    Starting Fare / Person
                  </div>
                  <div
                    style={{
                      fontSize: '1.6rem',
                      fontWeight: 900,
                      color: '#0284c7',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      margin: '2px 0 6px'
                    }}
                  >
                    <IndianRupee size={20} />{Number(listing.price || 0).toLocaleString('en-IN')}
                  </div>

                  <button
                    type="button"
                    disabled={isFullyBooked}
                    onClick={() => handleBookingClick(listing, cap, booked, remaining)}
                    style={{
                      background: isFullyBooked
                        ? '#cbd5e1'
                        : 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                      color: isFullyBooked ? '#64748b' : '#ffffff',
                      border: 'none',
                      padding: '10px 18px',
                      borderRadius: 10,
                      fontWeight: 800,
                      fontSize: '0.85rem',
                      cursor: isFullyBooked ? 'not-allowed' : 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12)',
                      transition: 'transform 0.12s'
                    }}
                  >
                    <Bus size={15} />
                    {isFullyBooked ? 'Fully Booked' : 'Select Bus Berths / Seats'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* STANDARD 3-COLUMN CARD GRID FOR STAYS, PACKAGES, AND GUIDES */
        <div className="grid-3">
          {listings.map(listing => {
            const cap = Number(listing.capacity || (listing.category === 'Hotel' ? 15 : listing.category === 'Guide' ? 10 : 20));
            const booked = Number(listing.bookedUnits || 0);
            const remaining = Number(listing.remainingCapacity !== undefined ? listing.remainingCapacity : Math.max(0, cap - booked));
            const isFullyBooked = remaining <= 0 && booked >= cap;

            return (
              <article
                key={listing.id}
                className="card"
                style={{
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  opacity: isFullyBooked ? 0.58 : 1,
                  filter: isFullyBooked ? 'grayscale(0.65)' : 'none',
                  background: isFullyBooked ? '#f8fafc' : undefined
                }}
              >
                {listing.primaryImage?.imageUrl && (
                  <img
                    src={imageSrc(listing.primaryImage.imageUrl)}
                    alt={listing.primaryImage.altText || listing.listingTitle}
                    style={{ width: '100%', height: 190, objectFit: 'cover' }}
                    loading="lazy"
                  />
                )}
                <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 7, flex: 1 }}>
                  <span style={{ color: '#0284c7', fontSize: '0.76rem', fontWeight: 700 }}>
                    {listing.category} · {[listing.city, listing.state].filter(Boolean).join(', ')}
                  </span>
                  <h3 style={{ margin: 0, color: '#0f172a', fontSize: '1.05rem' }}>{listing.listingTitle}</h3>
                  {listing.listingDescription && <p style={{ margin: 0, color: '#475569', fontSize: '0.84rem', lineHeight: 1.5 }}>{listing.listingDescription}</p>}
                  {listing.locationOrRoute && <div style={{ color: '#64748b', fontSize: '0.82rem' }}>{listing.locationOrRoute}</div>}
                  {listing.extraInfo && (
                    <div style={{ color: '#475569', fontSize: '0.8rem' }}>
                      {typeof listing.extraInfo === 'object'
                        ? Object.entries(listing.extraInfo).map(([key, value]) => `${key}: ${value}`).join(' · ')
                        : listing.extraInfo}
                    </div>
                  )}
                  {listing.price != null && (
                    <strong style={{ color: '#0369a1', marginTop: 'auto' }}>
                      ₹{Number(listing.price).toLocaleString('en-IN')} {listing.priceUnit || ''}
                    </strong>
                  )}
                  {listing.availability && <small style={{ color: '#64748b' }}>{listing.availability}</small>}
                  {isFullyBooked
                    ? <strong style={{ color: '#dc2626', fontSize: '0.85rem' }}>Fully booked</strong>
                    : <small style={{ color: '#059669', fontWeight: 600 }}>{remaining} service units available</small>}
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={isFullyBooked}
                    style={{
                      marginTop: 10,
                      ...(isFullyBooked ? { background: '#cbd5e1', borderColor: '#cbd5e1', color: '#475569', cursor: 'not-allowed' } : {})
                    }}
                    onClick={() => handleBookingClick(listing, cap, booked, remaining)}
                  >
                    {isFullyBooked ? 'Fully booked' : 'Book this service'}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {bookingListing && (
        <BookingModal
          bookingType="partner_listing"
          item={bookingListing}
          onClose={() => setBookingListing(null)}
          onComplete={() => {
            setBookingListing(null);
            setBookingMessage('Your booking is confirmed.');
            setReloadKey(key => key + 1);
          }}
        />
      )}
    </section>
  );
}
