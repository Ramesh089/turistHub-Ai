const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const state = {
  listing: null,
  applicationStatus: 'Approved',
  statusApplication: null,
  snapshots: [],
  audit: [],
  serviceChangeRequests: [],
  partnerQueries: [],
  submittedDocuments: [],
  uploadedFilePaths: [],
  activationApplication: null,
  setupEvents: [],
  sentEmails: [],
  partnerAudit: [],
  emailFailure: false,
  createdUser: null,
  temporaryPasswordUser: null,
  authUser: null,
  lastQuery: null
};

const listingImagesDir = path.join(__dirname, 'uploads', 'listing-images');

function baseListing(status = 'Submitted') {
  return {
    id: 17,
    application_id: 9,
    partner_user_id: 4,
    business_name: 'Sample Partner',
    partner_email: 'partner@example.test',
    contact_person: 'Partner User',
    listing_title: 'Sample service',
    listing_description: 'A sample public description',
    category: 'hotel',
    location_or_route: 'Central area',
    city: 'Mysuru',
    state: 'Karnataka',
    price: 1000,
    price_unit: 'per night',
    availability: 'Daily',
    terms: 'Standard terms',
    primary_image_id: null,
    status,
    admin_note: null,
    created_by_admin_id: null,
    published_by_admin_id: null,
    published_at: null,
    created_at: new Date('2026-01-01T00:00:00.000Z'),
    updated_at: new Date('2026-01-01T00:00:00.000Z')
  };
}

function rows(result) {
  return [result, []];
}

const fakePool = {
  async query(sql, params = []) {
    state.lastQuery = { sql, params };
    if (/SELECT \* FROM users\s+WHERE LOWER\(email\) = \? OR LOWER\(username\) = \?/i.test(sql)) {
      const user = state.authUser;
      return rows(user && (user.email.toLowerCase() === params[0] || user.username.toLowerCase() === params[1]) ? [{ ...user }] : []);
    }
    if (/UPDATE users SET failed_attempts = 0, lock_until = NULL WHERE id = \?/i.test(sql)) {
      if (state.authUser?.id === params[0]) {
        state.authUser.failed_attempts = 0;
        state.authUser.lock_until = null;
      }
      return rows({ affectedRows: 1 });
    }
    if (/SELECT id, password_hash FROM users\s+WHERE id = \? AND role = 'Business Partner' AND must_change_password = 1/i.test(sql)) {
      const user = state.authUser;
      return rows(user?.id === params[0] && user.must_change_password && user.temporary_password_expires_at > new Date()
        ? [{ id: user.id, password_hash: user.password_hash }]
        : []);
    }
    if (/UPDATE users\s+SET password_hash = \?, must_change_password = 0/i.test(sql)) {
      if (state.authUser?.id === params[1] && state.authUser.must_change_password) {
        state.authUser.password_hash = params[0];
        state.authUser.must_change_password = 0;
        state.authUser.temporary_password_expires_at = null;
      }
      return rows({ affectedRows: state.authUser?.id === params[1] ? 1 : 0 });
    }
    if (/SELECT id, status, email, business_name, user_id FROM partner_applications WHERE id = \?/i.test(sql)) {
      return rows(state.activationApplication?.id === params[0] ? [{ ...state.activationApplication }] : []);
    }
    if (/SELECT id, business_name, email, status, user_id\s+FROM partner_applications WHERE id = \?/i.test(sql)) {
      return rows(state.activationApplication?.id === params[0] ? [{ ...state.activationApplication }] : []);
    }
    if (/SELECT id, application_id, business_name, email, status, user_id\s+FROM partner_applications/i.test(sql)) {
      const app = state.statusApplication;
      return rows(app && (String(app.id) === params[0] || app.application_id === params[1])
        && app.email.toLowerCase() === params[2] ? [{ ...app }] : []);
    }
    if (/SELECT created_at\s+FROM partner_account_setup_events\s+WHERE application_id = \?\s+AND actor_role = 'Partner'/i.test(sql)) {
      const event = [...state.setupEvents].reverse().find(item =>
        item.applicationId === params[0] && item.actorRole === 'Partner' && item.eventType === 'account_setup_link_requested'
      );
      return rows(event ? [{ created_at: event.createdAt }] : []);
    }
    if (/UPDATE partner_applications\s+SET account_setup_token_hash = \?, account_setup_token_expires_at = \?,\s+account_setup_token_used_at = NULL\s+WHERE id = \? AND status = 'Approved' AND user_id IS NULL/i.test(sql)) {
      const app = state.statusApplication?.id === params[2] ? state.statusApplication : state.activationApplication;
      if (app) {
        app.account_setup_token_hash = params[0];
        app.setup_token_hash = params[0];
        app.account_setup_token_expires_at = params[1];
        app.account_setup_token_used_at = null;
        app.setup_token_valid = true;
      }
      return rows({ affectedRows: app ? 1 : 0 });
    }
    if (/UPDATE partner_applications\s+SET account_setup_token_hash = NULL, account_setup_token_expires_at = NULL\s+WHERE id = \? AND account_setup_token_hash = \?/i.test(sql)) {
      const app = state.statusApplication?.id === params[0] ? state.statusApplication : state.activationApplication;
      if (app?.account_setup_token_hash === params[1]) {
        app.account_setup_token_hash = null;
        app.setup_token_hash = null;
        app.account_setup_token_expires_at = null;
        app.setup_token_valid = false;
      }
      return rows({ affectedRows: 1 });
    }
    if (/UPDATE partner_applications\s+SET status = \?, admin_note = \?, reviewed_by = \?, reviewed_at = NOW\(\)/i.test(sql)) {
      if (state.activationApplication?.id === params[3]) {
        state.activationApplication.status = params[0];
        state.activationApplication.admin_note = params[1];
        state.activationApplication.reviewed_by = params[2];
      }
      return rows({ affectedRows: 1 });
    }
    if (/INSERT INTO partner_audit_logs/i.test(sql)) {
      state.partnerAudit.push({ action: params[2], previousStatus: params[3], newStatus: params[4] });
      return rows({ insertId: state.partnerAudit.length });
    }
    if (/SELECT id, business_name, category, contact_person, email, phone, city, state,/i.test(sql)
      && /FROM partner_applications WHERE id = \?/i.test(sql)) {
      const app = state.activationApplication;
      return rows(app?.id === params[0] ? [{
        id: app.id,
        business_name: app.business_name,
        category: app.category,
        contact_person: app.contact_person,
        email: app.email,
        phone: app.phone,
        city: app.city,
        state: app.state,
        status: app.status,
        admin_note: app.admin_note,
        reviewed_by: app.reviewed_by,
        reviewed_at: app.reviewed_at,
        created_at: app.created_at,
        updated_at: app.updated_at
      }] : []);
    }
    if (/SELECT business_name\s+FROM partner_applications\s+WHERE account_setup_token_hash = \?/i.test(sql)) {
      const app = state.activationApplication;
      return rows(app && app.setup_token_hash === params[0] && app.setup_token_valid !== false && app.status === 'Approved' && !app.user_id
        ? [{ business_name: app.business_name }]
        : []);
    }
    if (/SELECT id, business_name, contact_person, email, phone, status, user_id\s+FROM partner_applications\s+WHERE account_setup_token_hash = \?/i.test(sql)) {
      const app = state.activationApplication;
      return rows(app && app.setup_token_hash === params[0] && app.setup_token_valid !== false
        && app.status === 'Approved' && !app.user_id
        ? [{ ...app }]
        : []);
    }
    if (/SELECT id, business_name, status, admin_note, created_at, email\s+FROM partner_applications\s+WHERE \(CAST\(id AS CHAR\) = \? OR application_id = \?\) AND LOWER\(email\) = \?/i.test(sql)) {
      const app = state.statusApplication;
      return rows(app && (String(app.id) === params[0] || app.application_id === params[1])
        && app.email.toLowerCase() === params[2] ? [{
        id: app.id,
        business_name: app.business_name,
        status: app.status,
        admin_note: app.admin_note,
        created_at: app.created_at,
        email: app.email
      }] : []);
    }
    if (/SELECT event_type\s+FROM partner_account_setup_events\s+WHERE application_id = \?\s+AND event_type IN/i.test(sql)) {
      const eventTypes = /temporary_password_email_sent/i.test(sql)
        ? ['temporary_password_email_sent', 'temporary_password_email_failed']
        : ['account_setup_email_sent', 'account_setup_email_failed'];
      const event = [...state.setupEvents].reverse().find(item =>
        item.applicationId === params[0] && eventTypes.includes(item.eventType)
      );
      return rows(event ? [{ event_type: event.eventType }] : []);
    }
    if (/SELECT must_change_password FROM users WHERE id = \? LIMIT 1/i.test(sql)) {
      return rows(state.temporaryPasswordUser?.id === params[0]
        ? [{ must_change_password: state.temporaryPasswordUser.must_change_password }]
        : []);
    }
    if (/UPDATE partner_applications\s+SET account_setup_token_hash = NULL, account_setup_token_expires_at = NULL,/i.test(sql)) {
      if (state.statusApplication?.id === params[0] && state.statusApplication.user_id === params[1]) {
        state.statusApplication.account_setup_token_hash = null;
        state.statusApplication.account_setup_token_expires_at = null;
      }
      return rows({ affectedRows: 1 });
    }
    if (/SELECT id, application_id, business_name, category, contact_person, email, city, state,\s+status, admin_note, user_id, created_at, updated_at\s+FROM partner_applications/i.test(sql)) {
      const app = state.statusApplication;
      return rows(app && (String(app.id) === params[0] || app.application_id === params[1])
        && app.email.toLowerCase() === params[2] ? [{ ...app }] : []);
    }
    if (/SELECT id FROM users WHERE LOWER\(email\) = \? OR username = \?/i.test(sql)) {
      return rows(state.createdUser && (state.createdUser.email.toLowerCase() === params[0] || state.createdUser.username === params[1])
        ? [{ id: state.createdUser.id }]
        : []);
    }
    if (/SELECT id FROM users WHERE username = \?/i.test(sql)) {
      return rows(state.createdUser?.username === params[0] ? [{ id: state.createdUser.id }] : []);
    }
    if (/SELECT id FROM users WHERE email = \?/i.test(sql)) {
      return rows(state.createdUser?.email === params[0] ? [{ id: state.createdUser.id }] : []);
    }
    if (/INSERT INTO users \(full_name, username, email, phone, password_hash, role, is_active, failed_attempts\)/i.test(sql)) {
      state.createdUser = {
        id: 42,
        full_name: params[0],
        username: params[1],
        email: params[2],
        password_hash: params[4],
        role: 'Business Partner',
        is_active: 1
      };
      return rows({ insertId: state.createdUser.id });
    }
    if (/UPDATE partner_applications\s+SET user_id = \?, account_setup_token_hash = NULL/i.test(sql)) {
      if (state.activationApplication?.id === params[1]) {
        state.activationApplication.user_id = params[0];
        state.activationApplication.setup_token_hash = null;
        state.activationApplication.setup_token_valid = false;
        state.activationApplication.account_setup_token_hash = null;
      }
      return rows({ affectedRows: 1 });
    }
    if (/INSERT INTO partner_account_setup_events/i.test(sql)) {
      const eventType = params[2] || (/account_setup_completed/i.test(sql)
        ? 'account_setup_completed'
        : /account_setup_link_resent/i.test(sql)
          ? 'account_setup_link_resent'
          : /account_setup_link_requested/i.test(sql)
            ? 'account_setup_link_requested'
          : /account_setup_email_sent/i.test(sql)
            ? 'account_setup_email_sent'
            : /account_setup_email_failed/i.test(sql)
              ? 'account_setup_email_failed'
                : /temporary_password_requested/i.test(sql)
                  ? 'temporary_password_requested'
                  : /temporary_password_email_sent/i.test(sql)
                    ? 'temporary_password_email_sent'
                    : /temporary_password_email_failed/i.test(sql)
                      ? 'temporary_password_email_failed'
                : 'account_setup_link_generated');
      const actorRole = /'Partner'/.test(sql) ? 'Partner' : 'Admin';
      state.setupEvents.push({ applicationId: params[0], actorUserId: params[1], actorRole, eventType, createdAt: new Date() });
      return rows({ insertId: state.setupEvents.length });
    }
    if (/UPDATE partner_applications\s+SET account_setup_token_hash = \?, account_setup_token_expires_at = \?, account_setup_token_used_at = NULL/i.test(sql)) {
      if (state.activationApplication?.id === params[2]) {
        state.activationApplication.setup_token_hash = params[0];
        state.activationApplication.account_setup_token_hash = params[0];
        state.activationApplication.setup_token_valid = true;
      }
      return rows({ affectedRows: 1 });
    }
    if (/SELECT \* FROM users WHERE id = \?/i.test(sql)) {
      return rows(state.createdUser?.id === params[0] ? [{ ...state.createdUser }] : []);
    }
    if (/FROM partner_queries WHERE partner_user_id = \?/i.test(sql)) {
      return rows(state.partnerQueries.filter(query => query.partner_user_id === params[0]));
    }
    if (/FROM partner_queries q/i.test(sql)) {
      return rows(state.partnerQueries.map(query => ({
        ...query,
        partnerName: 'Partner User',
        partnerEmail: 'partner@example.test',
        businessName: 'Sample Partner'
      })));
    }
    if (/UPDATE partner_queries SET admin_reply = \?/i.test(sql)) {
      const query = state.partnerQueries.find(item => item.id === params[2]);
      if (query) {
        query.adminReply = params[0];
        query.status = 'Replied';
        query.replied_by = params[1];
      }
      return rows({ affectedRows: query ? 1 : 0 });
    }
    if (/INSERT INTO partner_queries/i.test(sql)) {
      const query = {
        id: state.partnerQueries.length + 1,
        partner_user_id: params[0],
        application_id: params[1],
        subject: params[2],
        question: params[3],
        status: 'Open'
      };
      state.partnerQueries.push(query);
      return rows({ insertId: query.id });
    }
    if (/FROM partner_service_change_requests r/i.test(sql)) {
      if (/WHERE r\.id = \?/i.test(sql)) {
        const changeRequest = state.serviceChangeRequests.find(item => item.id === params[0]);
        return rows(changeRequest ? [{
          ...changeRequest,
          listing_status: state.listing.status,
          listing_title: state.listing.listing_title,
          listing_description: state.listing.listing_description,
          category: state.listing.category,
          location_or_route: state.listing.location_or_route,
          city: state.listing.city,
          state: state.listing.state,
          price: state.listing.price,
          price_unit: state.listing.price_unit,
          availability: state.listing.availability,
          terms: state.listing.terms
        }] : []);
      }
      return rows(state.serviceChangeRequests.filter(item =>
        !/WHERE r\.partner_user_id = \?/i.test(sql) || item.partner_user_id === params[0]
      ).map(item => ({
        ...item,
        listing_id: item.listing_id,
        listingId: item.listing_id,
        partner_user_id: item.partner_user_id,
        proposed_data: item.proposed_data,
        proposedData: item.proposed_data,
        status: item.status,
        admin_note: item.admin_note || null,
        adminNote: item.admin_note || null,
        createdAt: item.created_at,
        listingTitle: state.listing.listing_title,
        listingDescription: state.listing.listing_description,
        category: state.listing.category,
        locationOrRoute: state.listing.location_or_route,
        city: state.listing.city,
        state: state.listing.state,
        price: state.listing.price,
        priceUnit: state.listing.price_unit,
        availability: state.listing.availability,
        terms: state.listing.terms,
        listingStatus: state.listing.status,
        businessName: 'Sample Partner',
        partnerEmail: 'partner@example.test'
      })));
    }
    if (/FROM partner_applications\s+WHERE \(CAST\(id AS CHAR\) = \? OR application_id = \?\) AND LOWER\(email\) = \?/i.test(sql)) {
      const app = state.statusApplication;
      return rows(app && (String(app.id) === params[0] || app.application_id === params[1])
        && app.email.toLowerCase() === params[2]
        ? [{ ...app }]
        : []);
    }
    if (/SELECT id FROM partner_applications WHERE user_id/i.test(sql)) {
      return rows(params[0] === 4 ? [{ id: 9 }] : []);
    }
    if (/SELECT id, listing_title, listing_description/i.test(sql)) {
      return rows(state.listing && params[0] === 9 && params[1] === 4 ? [{
        ...state.listing,
        listing_title: state.listing.listing_title,
        listing_description: state.listing.listing_description
      }] : []);
    }
    if (/WHERE id = \? AND partner_user_id = \?/i.test(sql)) {
      return rows(state.listing && params[0] === state.listing.id && params[1] === state.listing.partner_user_id
        ? [{ ...state.listing }]
        : []);
    }
    if (/FROM partner_listing_submissions/i.test(sql)) {
      return rows(state.snapshots);
    }
    if (/FROM listing_audit_logs/i.test(sql)) {
      return rows(state.audit);
    }
    if (/FROM listing_images WHERE listing_id/i.test(sql)) {
      return rows([]);
    }
    if (/FROM listing_images WHERE id = \?/i.test(sql)) {
      return rows([]);
    }
    if (/FROM listing_images WHERE stored_filename = \?/i.test(sql)) {
      return rows([{ id: 1 }]);
    }
    if (/FROM listing_images li/i.test(sql)) {
      return rows(state.listing?.status === 'Published' && state.applicationStatus === 'Approved' ? [{ id: 1 }] : []);
    }
    if (/SELECT COUNT\(\*\) AS total/i.test(sql)) {
      return rows([{ total: state.listing?.status === 'Published' && state.applicationStatus === 'Approved' ? 1 : 0 }]);
    }
    if (/SELECT psl\.\*, pa\.status AS application_status/i.test(sql)) {
      return rows(state.listing ? [{
        ...state.listing,
        application_status: state.applicationStatus,
        partner_active: 1
      }] : []);
    }
    if (/SELECT psl\.\*, pa\.business_name/i.test(sql)) {
      if (/psl\.status = 'Published'/i.test(sql)) {
        return rows(state.listing?.status === 'Published' && state.applicationStatus === 'Approved'
          ? [{ ...state.listing, business_name: 'Sample Partner', partner_email: 'partner@example.test' }]
          : []);
      }
      return rows(state.listing ? [{ ...state.listing, business_name: 'Sample Partner', partner_email: 'partner@example.test' }] : []);
    }
    if (/SELECT psl\.\*/i.test(sql) && /psl\.status = 'Published'/i.test(sql)) {
      return rows(state.listing?.status === 'Published' && state.applicationStatus === 'Approved'
        ? [{ ...state.listing }]
        : []);
    }
    if (/SELECT psl\.\*/i.test(sql)) {
      return rows(state.listing?.status === 'Published' && state.applicationStatus === 'Approved' ? [{ ...state.listing }] : []);
    }
    if (/SELECT id, status FROM partner_service_listings/i.test(sql)) {
      return rows(state.listing ? [{ id: state.listing.id, status: state.listing.status }] : []);
    }
    if (/SELECT \* FROM partner_service_listings WHERE id = \?/i.test(sql)) {
      return rows(state.listing && params[0] === state.listing.id ? [{ ...state.listing }] : []);
    }
    if (/SELECT stored_filename, alt_text FROM listing_images/i.test(sql)) {
      return rows([]);
    }
    if (/SELECT pd\.file_path/i.test(sql)) {
      return rows([]);
    }
    throw new Error(`Unexpected test SQL: ${sql}`);
  },
  async getConnection() {
    return {
      async beginTransaction() {},
      async commit() {},
      async rollback() {},
      release() {},
      async query(sql, params = []) {
        state.lastQuery = { sql, params };
        if (/SELECT id, application_id, business_name, contact_person, email, phone, status, user_id\s+FROM partner_applications/i.test(sql)) {
          const app = state.statusApplication;
          return rows(app && (String(app.id) === params[0] || app.application_id === params[1])
            && app.email.toLowerCase() === params[2] ? [{ ...app }] : []);
        }
        if (/SELECT created_at\s+FROM partner_account_setup_events\s+WHERE application_id = \?\s+AND actor_role = 'Partner'\s+AND event_type = 'temporary_password_requested'/i.test(sql)) {
          const event = [...state.setupEvents].reverse().find(item =>
            item.applicationId === params[0] && item.actorRole === 'Partner' && item.eventType === 'temporary_password_requested'
          );
          return rows(event ? [{ created_at: event.createdAt }] : []);
        }
        if (/SELECT id, role, is_active, must_change_password, password_hash, temporary_password_expires_at,\s+failed_attempts, lock_until\s+FROM users WHERE id = \? LIMIT 1 FOR UPDATE/i.test(sql)) {
          const user = state.temporaryPasswordUser?.id === params[0] ? state.temporaryPasswordUser : null;
          return rows(user ? [{ ...user }] : []);
        }
        if (/SELECT id FROM users WHERE LOWER\(email\) = \? OR username = \? LIMIT 1 FOR UPDATE/i.test(sql)) {
          const user = state.temporaryPasswordUser;
          return rows(user && (user.email.toLowerCase() === params[0] || user.username === params[1]) ? [{ id: user.id }] : []);
        }
        if (/INSERT INTO users\s+\(full_name, username, email, phone, password_hash, role, is_active, failed_attempts,\s+must_change_password, temporary_password_expires_at\)/i.test(sql)) {
          state.temporaryPasswordUser = {
            id: 81,
            full_name: params[0],
            username: params[1],
            email: params[2],
            phone: params[3],
            password_hash: params[4],
            role: 'Business Partner',
            is_active: 1,
            must_change_password: 1,
            temporary_password_expires_at: params[5]
          };
          return rows({ insertId: state.temporaryPasswordUser.id });
        }
        if (/UPDATE partner_applications SET user_id = \? WHERE id = \? AND status = 'Approved' AND user_id IS NULL/i.test(sql)) {
          if (state.statusApplication?.id === params[1]) state.statusApplication.user_id = params[0];
          return rows({ affectedRows: 1 });
        }
        if (/UPDATE partner_applications SET user_id = NULL WHERE id = \? AND user_id = \?/i.test(sql)) {
          if (state.statusApplication?.id === params[0]) state.statusApplication.user_id = null;
          return rows({ affectedRows: 1 });
        }
        if (/DELETE FROM users WHERE id = \? AND must_change_password = 1/i.test(sql)) {
          if (state.temporaryPasswordUser?.id === params[0]) state.temporaryPasswordUser = null;
          return rows({ affectedRows: 1 });
        }
        if (/INSERT INTO partner_account_setup_events/i.test(sql) && /temporary_password_(?:requested|email_sent|email_failed)/i.test(sql)) {
          const eventType = /temporary_password_requested/i.test(sql)
            ? 'temporary_password_requested'
            : /temporary_password_email_sent/i.test(sql)
              ? 'temporary_password_email_sent'
              : /temporary_password_email_failed/i.test(sql)
                ? 'temporary_password_email_failed'
                : 'account_setup_link_generated';
          state.setupEvents.push({ applicationId: params[0], actorUserId: params[1], actorRole: 'Partner', eventType, createdAt: new Date() });
          return rows({ insertId: state.setupEvents.length });
        }
        if (/SELECT id FROM partner_applications WHERE user_id/i.test(sql)) {
          return rows(params[0] === 4 ? [{ id: 9, status: 'Approved' }] : []);
        }
        if (/INSERT INTO partner_queries/i.test(sql)) {
          const query = {
            id: state.partnerQueries.length + 1,
            partner_user_id: params[0],
            application_id: params[1],
            subject: params[2],
            question: params[3],
            status: 'Open'
          };
          state.partnerQueries.push(query);
          return rows({ insertId: query.id });
        }
        if (/SELECT psl\.\*, pa\.status AS application_status/i.test(sql) && /psl\.partner_user_id = \?/i.test(sql)) {
          return rows(state.listing && params[0] === state.listing.id && params[1] === state.listing.partner_user_id
            ? [{ ...state.listing, application_status: state.applicationStatus }]
            : []);
        }
        if (/SELECT id FROM partner_service_change_requests/i.test(sql)) {
          return rows(state.serviceChangeRequests.some(item =>
            item.listing_id === params[0] && item.partner_user_id === params[1] && item.status === 'Pending'
          ) ? [{ id: 1 }] : []);
        }
        if (/INSERT INTO partner_service_change_requests/i.test(sql)) {
          const changeRequest = {
            id: state.serviceChangeRequests.length + 1,
            listing_id: params[0],
            partner_user_id: params[1],
            proposed_data: params[2],
            status: 'Pending',
            created_at: new Date()
          };
          state.serviceChangeRequests.push(changeRequest);
          return rows({ insertId: changeRequest.id });
        }
        if (/UPDATE partner_service_listings\s+SET listing_title = \?, listing_description = \?/i.test(sql)
          && !/status = 'Submitted'/i.test(sql)) {
          [
            state.listing.listing_title,
            state.listing.listing_description,
            state.listing.category,
            state.listing.location_or_route,
            state.listing.city,
            state.listing.state,
            state.listing.price,
            state.listing.price_unit,
            state.listing.availability,
            state.listing.terms
          ] = params.slice(0, 10);
          return rows({ affectedRows: 1 });
        }
        if (/UPDATE partner_service_change_requests\s+SET status = \?/i.test(sql)) {
          const changeRequest = state.serviceChangeRequests.find(item => item.id === params[3]);
          if (changeRequest) {
            changeRequest.status = params[0];
            changeRequest.admin_note = params[1];
            changeRequest.reviewed_by = params[2];
          }
          return rows({ affectedRows: changeRequest ? 1 : 0 });
        }
        if (/SELECT id FROM partner_applications WHERE email = \?/i.test(sql)) {
          return rows([]);
        }
        if (/INSERT INTO partner_applications/i.test(sql)) {
          state.applicationInsert = { sql, params };
          return rows({ insertId: 31 });
        }
        if (/INSERT INTO partner_documents/i.test(sql)) {
          state.submittedDocuments.push({ sql, params });
          state.uploadedFilePaths.push(params[4]);
          return rows({ insertId: state.submittedDocuments.length });
        }
        if (/UPDATE partner_service_listings\s+SET status = \?, admin_note = \?/i.test(sql)) {
          state.listing.status = params[0];
          state.listing.admin_note = params[1];
          return rows({ affectedRows: 1 });
        }
        if (/SET status = 'Published'/i.test(sql)) {
          state.listing.status = 'Published';
          state.listing.published_at = new Date();
          return rows({ affectedRows: 1 });
        }
        if (/UPDATE partner_service_listings\s+SET listing_title/i.test(sql) && /status = 'Submitted'/i.test(sql)) {
          state.listing.listing_title = params[0];
          state.listing.listing_description = params[1];
          state.listing.category = params[2];
          state.listing.status = 'Submitted';
          state.listing.admin_note = null;
          return rows({ affectedRows: 1 });
        }
        if (/UPDATE partner_service_listings\s+SET listing_title = \?/i.test(sql)) {
          state.listing.listing_title = params[0];
          return rows({ affectedRows: 1 });
        }
        if (/INSERT INTO listing_audit_logs/i.test(sql)) {
          const isPartner = /'Business Partner'/i.test(sql);
          state.audit.unshift({
            id: state.audit.length + 1,
            actor_user_id: params[1],
            actor_role: isPartner ? 'Business Partner' : params[3],
            action: isPartner ? params[2] : params[4],
            previous_status: isPartner ? params[3] : params[5],
            new_status: isPartner ? params[4] : params[6],
            note: isPartner ? params[5] : params[7],
            created_at: new Date()
          });
          return rows({ insertId: state.audit.length });
        }
        if (/INSERT INTO partner_listing_submissions/i.test(sql)) {
          state.snapshots.unshift({
            submission_data: JSON.parse(params[2]),
            submitted_at: new Date()
          });
          return rows({ insertId: state.snapshots.length });
        }
        return fakePool.query(sql, params);
      }
    };
  }
};

require('mysql2/promise').createPool = () => fakePool;
const partnerEmail = require('./services/partnerEmail');
partnerEmail.sendPartnerAccountSetupEmail = async (...emailArgs) => {
  if (state.emailFailure) throw new Error('SMTP unavailable');
  state.sentEmails.push({ kind: 'account_setup', args: emailArgs });
};
partnerEmail.sendPartnerTemporaryPasswordEmail = async (...emailArgs) => {
  if (state.emailFailure) throw new Error('SMTP unavailable');
  state.sentEmails.push({ kind: 'temporary_password', args: emailArgs });
};
const { JWT_SECRET } = require('./middleware/auth');
const app = express();
app.use(express.json());
app.use('/api/auth', require('./routes/auth'));
app.use('/api/listings', require('./routes/listings'));
app.use('/api/partner', require('./routes/partner'));

let server;
let origin;

function token(role, id = 4) {
  return jwt.sign({ id, email: 'test@example.test', role }, JWT_SECRET);
}

async function request(pathname, options = {}) {
  if (options.adminAuth) {
    const headers = new Headers(options.headers);
    headers.set('Authorization', `Bearer ${token('Admin')}`);
    options = { ...options, headers };
    delete options.adminAuth;
  }
  return fetch(`${origin}${pathname}`, options);
}

test.before(async () => {
  fs.mkdirSync(listingImagesDir, { recursive: true });
  server = app.listen(0);
  await new Promise(resolve => server.once('listening', resolve));
  origin = `http://127.0.0.1:${server.address().port}`;
});

test.after(async () => {
  await new Promise(resolve => server.close(resolve));
});

test.beforeEach(() => {
  state.listing = baseListing();
  state.applicationStatus = 'Approved';
  state.statusApplication = {
    id: 8,
    application_id: null,
    business_name: 'Sample Bus Services',
    category: 'Bus Operator',
    contact_person: 'Partner User',
    email: 'bus-partner@example.test',
    city: 'Mysuru',
    state: 'Karnataka',
    status: 'Pending',
    admin_note: null,
    email_verified: 1,
    created_at: new Date('2026-01-01T00:00:00.000Z'),
    updated_at: new Date('2026-01-02T00:00:00.000Z')
  };
  state.snapshots = [{ submission_data: { listingTitle: 'Partner-submitted title' }, submitted_at: new Date('2026-01-01') }];
  state.audit = [];
  state.serviceChangeRequests = [];
  state.partnerQueries = [];
  state.submittedDocuments = [];
  state.uploadedFilePaths = [];
  state.activationApplication = null;
  state.createdUser = null;
  state.temporaryPasswordUser = null;
  state.authUser = null;
  state.setupEvents = [];
  state.sentEmails = [];
  state.partnerAudit = [];
  state.emailFailure = false;
  state.applicationInsert = null;
  state.lastQuery = null;
});

test('business partners see only listings owned by their linked application', async () => {
  const own = await request('/api/listings/my', { headers: { Authorization: `Bearer ${token('Business Partner')}` } });
  assert.equal(own.status, 200);

  const tourist = await request('/api/listings/my', { headers: { Authorization: `Bearer ${token('Tourist', 99)}` } });
  assert.equal(tourist.status, 403);

  const foreign = await request('/api/listings/my/17', {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token('Business Partner', 99)}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ listingTitle: 'Attempted takeover' })
  });
  assert.equal(foreign.status, 404);
  assert.match(state.lastQuery.sql, /partner_user_id = \?/i);
  assert.equal(state.lastQuery.params[1], 99);
});

test('partner questions are owner-scoped and administrators can reply', async () => {
  const forbiddenList = await request('/api/partner/admin/queries', {
    headers: { Authorization: `Bearer ${token('Business Partner')}` }
  });
  assert.equal(forbiddenList.status, 403);

  const submitted = await request('/api/partner/my/queries', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token('Business Partner')}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ subject: 'Bus listing update', question: 'How long does review take?' })
  });
  assert.equal(submitted.status, 201);

  const otherPartner = await request('/api/partner/my/queries', {
    headers: { Authorization: `Bearer ${token('Business Partner', 99)}` }
  });
  assert.equal(otherPartner.status, 200);
  assert.deepEqual((await otherPartner.json()).queries, []);

  const adminList = await request('/api/partner/admin/queries', {
    headers: { Authorization: `Bearer ${token('Admin')}` }
  });
  assert.equal(adminList.status, 200);
  const adminData = await adminList.json();
  assert.equal(adminData.queries[0].partner_user_id, 4);

  const reply = await request('/api/partner/admin/queries/1/reply', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token('Admin')}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ reply: 'We will review your submission shortly.' })
  });
  assert.equal(reply.status, 200);

  const partnerList = await request('/api/partner/my/queries', {
    headers: { Authorization: `Bearer ${token('Business Partner')}` }
  });
  assert.equal((await partnerList.json()).queries[0].adminReply, 'We will review your submission shortly.');
});

test('partner status lookup requires the matching application ID and email', async () => {
  const response = await request('/api/partner/status?applicationId=8&email=bus-partner%40example.test');
  assert.equal(response.status, 200);
  const data = await response.json();
  assert.equal(data.application.applicationId, '8');
  assert.equal(data.application.category, 'Bus Operator');
  assert.equal(data.application.status, 'pending');
  assert.equal(data.application.setupEmailStatus, 'unknown');

  const mismatch = await request('/api/partner/status?applicationId=8&email=someone-else%40example.test');
  assert.equal(mismatch.status, 404);
  const missingEmail = await request('/api/partner/status?applicationId=8');
  assert.equal(missingEmail.status, 400);

  const emailOnlyLookup = await request('/api/partner/check-status', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'bus-partner@example.test' })
  });
  assert.equal(emailOnlyLookup.status, 400);
  const verifiedLookup = await request('/api/partner/check-status', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ applicationId: '8', email: 'bus-partner@example.test' })
  });
  assert.equal(verifiedLookup.status, 200);
  const privateEmailMismatch = await request('/api/partner/check-status', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ applicationId: '8', email: 'other@example.test' })
  });
  assert.equal(privateEmailMismatch.status, 404);
});

test('approved partner status generates a random temporary password', async () => {
  state.statusApplication.status = 'Approved';
  state.statusApplication.phone = '9876543210';

  const response = await request('/api/partner/status/request-temporary-password?applicationId=8&email=bus-partner%40example.test', {
    method: 'POST'
  });
  assert.equal(response.status, 200);
  const responseData = await response.json();
  assert.equal(responseData.success, true);
  assert.match(responseData.message, /Temporary password generated successfully/);
  const temporaryPassword = responseData.temporaryPassword;
  assert.equal(typeof temporaryPassword, 'string');
  assert.equal(temporaryPassword.length, 8);
  assert.match(temporaryPassword, /[A-Z]/);
  assert.match(temporaryPassword, /[a-z]/);
  assert.match(temporaryPassword, /\d/);
  assert.match(temporaryPassword, /[!@#$%^&*]/);
  assert.notEqual(state.temporaryPasswordUser.password_hash, temporaryPassword);
  assert.equal(state.temporaryPasswordUser.must_change_password, 1);
  assert.equal(state.statusApplication.user_id, state.temporaryPasswordUser.id);
  assert.equal(state.setupEvents.at(-1).eventType, 'temporary_password_email_sent');

  const status = await request('/api/partner/status?applicationId=8&email=bus-partner%40example.test');
  assert.equal((await status.json()).application.temporaryPasswordStatus, 'sent');

  const throttled = await request('/api/partner/status/request-temporary-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ applicationId: 8, email: 'bus-partner@example.test' })
  });
  assert.equal(throttled.status, 429);
});

test('temporary password requests require an approved matching application and succeed without email dependency', async () => {
  const wrongOwner = await request('/api/partner/status/request-temporary-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ applicationId: 8, email: 'other@example.test' })
  });
  assert.equal(wrongOwner.status, 404);

  const pending = await request('/api/partner/status/request-temporary-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ applicationId: 8, email: 'bus-partner@example.test' })
  });
  assert.equal(pending.status, 409);

  state.statusApplication.status = 'Approved';
  state.statusApplication.phone = '9876543210';
  state.emailFailure = true;
  const emailFailure = await request('/api/partner/status/request-temporary-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ applicationId: 8, email: 'bus-partner@example.test' })
  });
  assert.equal(emailFailure.status, 200);
  assert.equal(state.statusApplication.user_id, state.temporaryPasswordUser.id);
  assert.equal(state.setupEvents.at(-1).eventType, 'temporary_password_email_failed');
});

test('temporary-password sign-in is limited to the required password change', async () => {
  const temporaryPassword = 'TempPartner9!';
  state.authUser = {
    id: 90,
    full_name: 'Partner User',
    username: 'partner_8',
    email: 'bus-partner@example.test',
    role: 'Business Partner',
    is_active: 1,
    failed_attempts: 0,
    lock_until: null,
    must_change_password: 1,
    temporary_password_expires_at: new Date(Date.now() + 60_000),
    password_hash: await bcrypt.hash(temporaryPassword, 10)
  };

  const login = await request('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      account: state.authUser.email,
      password: temporaryPassword,
      role: 'Business Partner',
      sliderVerified: true
    })
  });
  assert.equal(login.status, 200);
  const loginData = await login.json();
  assert.equal(loginData.requiresPasswordChange, true);
  assert.equal(loginData.token, undefined);
  assert.equal(loginData.user, undefined);

  const blockedRequest = await request('/api/partner/my-application', {
    headers: { Authorization: `Bearer ${loginData.passwordChangeToken}` }
  });
  assert.equal(blockedRequest.status, 403);

  const unchangedPassword = await request('/api/auth/complete-required-password-change', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      passwordChangeToken: loginData.passwordChangeToken,
      newPassword: temporaryPassword,
      confirmPassword: temporaryPassword
    })
  });
  assert.equal(unchangedPassword.status, 400);

  const changed = await request('/api/auth/complete-required-password-change', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      passwordChangeToken: loginData.passwordChangeToken,
      newPassword: 'NewPartner9!',
      confirmPassword: 'NewPartner9!'
    })
  });
  assert.equal(changed.status, 200);
  assert.equal(state.authUser.must_change_password, 0);
  assert.equal(state.authUser.temporary_password_expires_at, null);
  assert.equal(await bcrypt.compare('NewPartner9!', state.authUser.password_hash), true);

  const replay = await request('/api/auth/complete-required-password-change', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      passwordChangeToken: loginData.passwordChangeToken,
      newPassword: 'OtherPartner9!',
      confirmPassword: 'OtherPartner9!'
    })
  });
  assert.equal(replay.status, 409);
});

test('partner setup links are expiring, one-time, and only create approved accounts', async () => {
  state.activationApplication = {
    id: 8,
    business_name: 'Sample Bus Services',
    contact_person: 'Partner User',
    email: 'bus-partner@example.test',
    phone: '9876543210',
    category: 'Bus Operator',
    status: 'Pending',
    email_verified: 0,
    email_verify_token: 'verify-token',
    user_id: null
  };
  const pendingSetupLink = await request('/api/partner/account-setup?token=not-a-valid-token');
  assert.equal(pendingSetupLink.status, 400);

  const pendingApproval = await request('/api/partner/admin/applications/8/review', {
    method: 'POST',
    headers: { Authorization: `******'Admin')}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'approve' })
  });
  assert.equal(pendingApproval.status, 404); // review endpoint uses PATCH; wrong method must not create an account
  assert.equal(state.createdUser, null);

  const approval = await request('/api/partner/admin/applications/8/review', {
    method: 'PATCH',
    adminAuth: true,
    headers: { Authorization: `******'Admin')}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'approve' })
  });
  const approvalText = await approval.text();
  assert.equal(approval.status, 200, approvalText);
  const approvalData = JSON.parse(approvalText);
  assert.equal(approvalData.success, true);
  assert.equal(state.activationApplication.email_verified, 0);
  assert.equal(state.sentEmails.length, 0);
  assert.equal(state.activationApplication.account_setup_token_hash, undefined);
  assert.equal(state.partnerAudit[0].action, 'approve');

  state.statusApplication = state.activationApplication;
  const setupLinkRequest = await request('/api/partner/status/request-account-setup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ applicationId: 8, email: 'bus-partner@example.test' })
  });
  assert.equal(setupLinkRequest.status, 200);
  assert.equal(state.sentEmails.at(-1).kind, 'account_setup');
  assert.equal(state.activationApplication.account_setup_token_hash.length, 64);

  const firstSetupToken = state.sentEmails.at(-1).args[2];
  assert.equal(state.activationApplication.account_setup_token_hash, crypto.createHash('sha256').update(firstSetupToken).digest('hex'));
  assert.notEqual(state.activationApplication.account_setup_token_hash, firstSetupToken);
  const nonAdminResend = await request('/api/partner/admin/applications/8/setup-link', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token('Tourist')}` }
  });
  assert.equal(nonAdminResend.status, 404);

  const resend = await request('/api/partner/admin/applications/8/setup-link', {
    method: 'POST',
    adminAuth: true
  });
  assert.equal(resend.status, 404);
  const setupToken = firstSetupToken;

  state.activationApplication.setup_token_valid = false;
  const expiredLink = await request(`/api/partner/account-setup?token=${setupToken}`);
  assert.equal(expiredLink.status, 410);
  state.activationApplication.setup_token_valid = true;

  const setupLookup = await request(`/api/partner/account-setup?token=${setupToken}`);
  assert.equal(setupLookup.status, 200);
  assert.equal((await setupLookup.json()).businessName, 'Sample Bus Services');

  const badToken = await request('/api/partner/complete-account-setup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      token: 'f'.repeat(64),
      password: 'Password9!',
      confirmPassword: 'Password9!'
    })
  });
  assert.equal(badToken.status, 410);
  assert.equal(state.createdUser, null);

  const activation = await request('/api/partner/complete-account-setup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      token: setupToken,
      password: 'Password9!',
      confirmPassword: 'Password9!'
    })
  });
  assert.equal(activation.status, 201);
  const data = await activation.json();
  assert.equal(data.success, true);
  assert.equal(data.token, undefined);
  assert.equal(state.createdUser.username, 'partner_8');
  assert.equal(state.createdUser.full_name, 'Partner User');
  assert.notEqual(state.createdUser.password_hash, 'Password9!');
  assert.equal(state.activationApplication.user_id, 42);
  assert.equal(state.activationApplication.account_setup_token_hash, null);
  assert.equal(state.setupEvents.at(-1).eventType, 'account_setup_completed');

  const replay = await request('/api/partner/complete-account-setup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: setupToken, password: 'Password9!', confirmPassword: 'Password9!' })
  });
  assert.equal(replay.status, 410);
});

test('approved partners request one-time setup links through status using matching application ID and email', async () => {
  state.activationApplication = {
    id: 12,
    business_name: 'Verified Travel Co',
    contact_person: 'Partner User',
    email: 'verified@example.test',
    phone: '9876543210',
    category: 'Tour & Travel',
    status: 'Pending',
    email_verified: 1,
    user_id: null
  };
  state.statusApplication = {
    id: 12,
    application_id: null,
    business_name: 'Verified Travel Co',
    category: 'Tour & Travel',
    contact_person: 'Partner User',
    email: 'verified@example.test',
    city: 'Mysuru',
    state: 'Karnataka',
    status: 'Approved',
    admin_note: null,
    user_id: null,
    created_at: new Date('2026-01-01T00:00:00.000Z'),
    updated_at: new Date('2026-01-02T00:00:00.000Z')
  };
  state.emailFailure = true;
  const approval = await request('/api/partner/admin/applications/12/review', {
    method: 'PATCH',
    adminAuth: true,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'approve' })
  });
  assert.equal(approval.status, 200);
  const approvalData = await approval.json();
  assert.equal(approvalData.success, true);
  assert.equal(approvalData.setupUrl, undefined);
  assert.equal(state.activationApplication.status, 'Approved');
  assert.equal(state.setupEvents.some(event => event.eventType === 'account_setup_email_failed'), false);
  const failedStatus = await request('/api/partner/status?applicationId=12&email=verified%40example.test');
  const failedStatusBody = await failedStatus.text();
  assert.equal(JSON.parse(failedStatusBody).application.setupEmailStatus, 'unknown');

  state.emailFailure = false;
  const wrongOwner = await request('/api/partner/status/request-account-setup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ applicationId: 12, email: 'someone-else@example.test' })
  });
  assert.equal(wrongOwner.status, 404);

  state.emailFailure = true;
  const failedSetupRequest = await request('/api/partner/status/request-account-setup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ applicationId: 12, email: 'verified@example.test' })
  });
  assert.equal(failedSetupRequest.status, 503);
  const failedSetupBody = await failedSetupRequest.text();
  assert.equal(failedSetupBody.includes('setupUrl'), false);
  assert.equal(failedSetupBody.includes('account_setup_token_hash'), false);
  state.setupEvents.findLast(event => event.eventType === 'account_setup_link_requested').createdAt = new Date(Date.now() - 120_000);
  state.emailFailure = false;

  const setupRequest = await request('/api/partner/status/request-account-setup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ applicationId: 12, email: 'verified@example.test' })
  });
  assert.equal(setupRequest.status, 200);
  const setupResponseText = await setupRequest.text();
  assert.equal(JSON.parse(setupResponseText).success, true);
  assert.equal(setupResponseText.includes(state.activationApplication.account_setup_token_hash), false);
  assert.equal(state.sentEmails.at(-1).kind, 'account_setup');
  const setupToken = state.sentEmails.at(-1).args[2];
  assert.equal(state.statusApplication.account_setup_token_hash, crypto.createHash('sha256').update(setupToken).digest('hex'));
  assert.equal(state.setupEvents.some(event => event.eventType === 'account_setup_link_requested' && event.actorRole === 'Partner'), true);
  assert.equal(state.setupEvents.at(-1).eventType, 'account_setup_email_sent');

  const repeatedRequest = await request('/api/partner/status/request-account-setup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ applicationId: 12, email: 'verified@example.test' })
  });
  assert.equal(repeatedRequest.status, 429);

  const sentStatus = await request('/api/partner/status?applicationId=12&email=verified%40example.test');
  assert.equal((await sentStatus.json()).application.setupEmailStatus, 'sent');
});

test('service change requests keep published listings unchanged until approved', async () => {
  state.listing.status = 'Published';
  const payload = {
    listingTitle: 'Updated bus service',
    listingDescription: 'Updated route description',
    category: 'Bus Operator',
    locationOrRoute: 'Mysuru to Bengaluru',
    city: 'Mysuru',
    state: 'Karnataka',
    price: 850,
    priceUnit: 'per trip',
    availability: 'Daily',
    terms: 'Updated booking terms'
  };
  const forbidden = await request('/api/listings/my/17/change-requests', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token('Tourist', 99)}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  assert.equal(forbidden.status, 403);

  const foreign = await request('/api/listings/my/17/change-requests', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token('Business Partner', 99)}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  assert.equal(foreign.status, 404);

  const originalTitle = state.listing.listing_title;
  const originalPrice = state.listing.price;
  const submitted = await request('/api/listings/my/17/change-requests', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token('Business Partner')}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  assert.equal(submitted.status, 201);
  assert.equal(state.listing.listing_title, originalTitle);
  assert.equal(state.listing.price, originalPrice);

  const reject = await request('/api/listings/admin/change-requests/1/review', {
    method: 'PATCH',
    headers: { authorization: `Bearer ${token('Admin')}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'reject', note: 'Confirm the route permit first.' })
  });
  assert.equal(reject.status, 200);
  assert.equal(state.listing.listing_title, originalTitle);
  assert.equal(state.listing.price, originalPrice);

  const nextRequest = await request('/api/listings/my/17/change-requests', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token('Business Partner')}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  assert.equal(nextRequest.status, 201);

  const approve = await request('/api/listings/admin/change-requests/2/review', {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token('Admin')}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'approve', note: 'Verified.' })
  });
  assert.equal(approve.status, 200);
  assert.equal(state.listing.listing_title, payload.listingTitle);
  assert.equal(state.listing.price, payload.price);
  assert.equal(state.listing.status, 'Published');
});

test('admin review endpoints reject non-admin roles and require decision notes', async () => {
  const forbidden = await request('/api/listings/admin', { headers: { Authorization: `Bearer ${token('Business Partner')}` } });
  assert.equal(forbidden.status, 403);

  const noNote = await request('/api/listings/admin/17/review', {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token('Admin')}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'request_changes', note: '' })
  });
  assert.equal(noNote.status, 400);
});

test('administrator correction requests are audited and partner corrections can be resubmitted', async () => {
  const review = await request('/api/listings/admin/17/review', {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token('Admin')}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'request_changes', note: 'Add accurate availability details.' })
  });
  assert.equal(review.status, 200);
  assert.equal(state.listing.status, 'Changes Requested');
  assert.equal(state.listing.admin_note, 'Add accurate availability details.');

  const correction = await request('/api/listings/my/17', {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token('Business Partner')}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ listingTitle: 'Corrected title', category: 'Hotel', price: 1200 })
  });
  assert.equal(correction.status, 200);
  assert.equal(state.listing.status, 'Submitted');
  assert.equal(state.listing.listing_title, 'Corrected title');
  assert.equal(state.snapshots.length, 2);
});

test('administrator edits are persisted with an audit trail', async () => {
  const response = await request('/api/listings/admin/17', {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token('Admin')}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ listingTitle: 'Admin-formatted listing' })
  });
  assert.equal(response.status, 200);
  assert.equal(state.listing.listing_title, 'Admin-formatted listing');
  assert.equal(state.audit.some(entry => entry.action === 'edit'), true);
});

test('only the owning partner or an administrator can retrieve a verification PDF', async () => {
  const anonymous = await request('/api/partner/admin/documents/1');
  assert.equal(anonymous.status, 401);

  const tourist = await request('/api/partner/admin/documents/1', {
    headers: { Authorization: `Bearer ${token('Tourist', 99)}` }
  });
  assert.equal(tourist.status, 403);

  const partner = await request('/api/partner/my-documents/1', {
    headers: { Authorization: `Bearer ${token('Business Partner', 99)}` }
  });
  assert.equal(partner.status, 404);
  assert.match(state.lastQuery.sql, /pa\.user_id = \?/i);
  assert.equal(state.lastQuery.params[1], 99);
});

test('partner application submission requires the category-specific verification documents', async () => {
  const form = new FormData();
  for (const [key, value] of Object.entries({
    businessName: 'Sample Hotel',
    category: 'Hotel',
    contactPerson: 'Partner User',
    email: 'hotel@example.test',
    phone: '9876543210',
    address: '1 Main Road',
    city: 'Mysuru',
    state: 'Karnataka',
    pincode: '570001',
    privacyConsent: 'true'
  })) {
    form.append(key, value);
  }
  const response = await request('/api/partner/apply', { method: 'POST', body: form });
  assert.equal(response.status, 400);
  const data = await response.json();
  assert.equal(data.field, 'documents');
});

test('bus partner applications accept all required verification documents', async () => {
  const form = new FormData();
  for (const [key, value] of Object.entries({
    businessName: 'Sample Bus Services',
    category: 'Bus Operator',
    contactPerson: 'Partner User',
    email: 'bus-partner@example.test',
    phone: '9876543210',
    address: '1 Main Road',
    city: 'Mysuru',
    state: 'Karnataka',
    pincode: '570001',
    privacyConsent: 'true'
  })) {
    form.append(key, value);
  }
  for (const [documentType, fileName] of [
    ['Vehicle Registration Certificate', 'registration.pdf'],
    ['Route Permit', 'route-permit.pdf'],
    ['Vehicle Fitness Certificate', 'fitness.pdf'],
    ['Insurance Certificate', 'insurance.pdf']
  ]) {
    form.append('documents', new Blob(['%PDF-1.4\n'], { type: 'application/pdf' }), fileName);
    form.append('documentTypes', documentType);
  }

  try {
    const response = await request('/api/partner/apply', { method: 'POST', body: form });
    assert.equal(response.status, 201);
    assert.equal(state.applicationInsert.params[1], 'Bus Operator');
    assert.equal(state.submittedDocuments.length, 4);
    assert.ok(state.submittedDocuments.every(({ sql }) => /document_type, original_name, stored_filename, file_path/i.test(sql)));
    const responseData = await response.json();
    assert.equal(responseData.success, true);
    assert.equal(responseData.message.includes('verification'), false);
    assert.equal(state.sentEmails.length, 0);
  } finally {
    state.uploadedFilePaths.forEach(filePath => {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    });
  }
});

test('image uploads reject invalid file signatures and unpublished images stay private', async () => {
  const form = new FormData();
  form.append('images', new Blob(['not an image'], { type: 'image/png' }), 'bad.png');
  const upload = await request('/api/listings/admin/17/images', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token('Admin')}` },
    body: form
  });
  assert.equal(upload.status, 400);

  const privateImage = await request('/api/listings/images/not-published.png');
  assert.equal(privateImage.status, 404);
  assert.match(state.lastQuery.sql, /psl\.status = 'Published'/i);
});

test('admin image preview is protected and only serves an image attached to a listing', async () => {
  const filename = `preview-${Date.now()}.png`;
  const filepath = path.join(listingImagesDir, filename);
  const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  fs.writeFileSync(filepath, png);
  try {
    const forbidden = await request(`/api/listings/admin/images/${filename}`);
    assert.equal(forbidden.status, 401);

    const preview = await request(`/api/listings/admin/images/${filename}`, {
      headers: { Authorization: `Bearer ${token('Admin')}` }
    });
    assert.equal(preview.status, 200);
    assert.deepEqual(Buffer.from(await preview.arrayBuffer()), png);
  } finally {
    fs.unlinkSync(filepath);
  }
});

test('administrator detail exposes the immutable partner submission snapshot for comparison', async () => {
  const response = await request('/api/listings/admin/17', {
    headers: { Authorization: `Bearer ${token('Admin')}` }
  });
  assert.equal(response.status, 200);
  const data = await response.json();
  assert.equal(data.submissionHistory[0].data.listingTitle, 'Partner-submitted title');
});

test('approved draft listing can be published and then appears in the tourist catalogue', async () => {
  state.listing.status = 'Draft';
  const publish = await request('/api/listings/admin/17/publish', {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token('Admin')}` }
  });
  assert.equal(publish.status, 200);

  const publicList = await request('/api/listings?category=Hotel');
  assert.equal(publicList.status, 200);
  const data = await publicList.json();
  assert.equal(data.listings.length, 1);
  assert.equal(data.listings[0].listingTitle, 'Sample service');
  const details = await request('/api/listings/17');
  assert.equal(details.status, 200);
  const detailData = await details.json();
  assert.equal(detailData.listing.partnerUserId, undefined);
});

test('published listings are hidden if partner approval is withdrawn', async () => {
  state.listing.status = 'Published';
  state.applicationStatus = 'Rejected';
  const response = await request('/api/listings?category=Hotel');
  assert.equal(response.status, 200);
  const data = await response.json();
  assert.equal(data.listings.length, 0);
  const detail = await request('/api/listings/17');
  assert.equal(detail.status, 404);
});

test('submitted listings cannot be published before administrator approval', async () => {
  const response = await request('/api/listings/admin/17/publish', {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token('Admin')}` }
  });
  assert.equal(response.status, 400);
  assert.equal(state.listing.status, 'Submitted');
});
