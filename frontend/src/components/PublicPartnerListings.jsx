import React, { useEffect, useState } from 'react';
import api from '../services/api';
import BookingModal from './BookingModal';

function imageSrc(imageUrl) {
  if (!imageUrl) return '';
  if (/^https?:\/\//i.test(imageUrl)) return imageUrl;
  const origin = (api.defaults.baseURL || '').replace(/\/api\/?$/, '');
  return `${origin}${imageUrl}`;
}

export default function PublicPartnerListings({ categories, title = 'Verified partner services' }) {
  const [listings, setListings] = useState([]);
  const [bookingListing, setBookingListing] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [bookingMessage, setBookingMessage] = useState('');

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

  return (
    <section style={{ marginTop: 42 }}>
      <h2 style={{ marginBottom: 16, color: '#0f172a' }}>{title}</h2>
      {bookingMessage && <div role="status" style={{ marginBottom: 14, padding: 12, borderRadius: 9, background: '#dcfce7', color: '#166534' }}>{bookingMessage}</div>}
      <div className="grid-3">
        {listings.map(listing => {
          const cap = Number(listing.capacity || (listing.category === 'Bus Operator' ? 40 : listing.category === 'Hotel' ? 15 : listing.category === 'Guide' ? 10 : 20));
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
                    ₹{Number(listing.price).toLocaleString('en-IN')} {listing.category === 'Bus Operator' ? 'per person' : (listing.priceUnit || '')}
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
                  onClick={() => {
                    if (isFullyBooked) return;
                    setBookingMessage('');
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
                      from_city: listing.city || 'Origin',
                      to_city: listing.locationOrRoute || listing.state || 'Destination',
                      departure_time: listing.availability || 'Daily departures 9:00 PM',
                      transport_type: listing.category === 'Bus Operator' ? 'Luxury AC Bus' : listing.category,
                      destination_name: listing.city || listing.state || 'India',
                      image_url: imageSrc(listing.primaryImage?.imageUrl)
                    });
                  }}
                >
                  {isFullyBooked ? 'Fully booked' : (listing.category === 'Bus Operator' ? 'Select Bus Berths / Seats' : 'Book this service')}
                </button>
              </div>
            </article>
          );
        })}
      </div>
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
