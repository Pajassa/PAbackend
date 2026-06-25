import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper function to format dates to "DD Month, YYYY"
const formatDateIndian = (dateStr) => {
  if (!dateStr) return 'N/A';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  const day = date.getDate();
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month}, ${year}`;
};

const renderSectionHTML = (title, reservations) => {
  const hasReservations = reservations && reservations.length > 0;
  const isOngoing = title.toLowerCase().includes("ongoing");

  if (!hasReservations) {
    return `
      <div style="margin-bottom: 25px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <div style="font-size: 14px; font-weight: bold; color: #2d3748; margin-bottom: 10px;">
          ${title}
        </div>
        <div style="border: 1px solid #ff0000; padding: 10px; margin-bottom: 20px; color: #ff0000; font-size: 11px; font-weight: bold; text-align: left; background-color: #fff5f5; border-radius: 4px;">
          No Records found
        </div>
      </div>
    `;
  }

  return `
    <div style="margin-bottom: 25px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      <div style="font-size: 14px; font-weight: bold; color: #2d3748; margin-bottom: 10px;">
        ${title}
      </div>
      <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #ddd; border-collapse: collapse; margin-bottom: 20px; font-size: 11px; width: 100%;">
        <thead>
          <tr style="background-color: #f8fafc; border-bottom: 1px solid #ddd;">
            <th style="border: 1px solid #ddd; padding: 8px; font-weight: bold; text-align: left; color: #2d3748;">Resv No.</th>
            <th style="border: 1px solid #ddd; padding: 8px; font-weight: bold; text-align: left; color: #2d3748;">C.I.D</th>
            <th style="border: 1px solid #ddd; padding: 8px; font-weight: bold; text-align: left; color: #2d3748;">C.O.D</th>
            <th style="border: 1px solid #ddd; padding: 8px; font-weight: bold; text-align: left; color: #2d3748;">Guest</th>
            <th style="border: 1px solid #ddd; padding: 8px; font-weight: bold; text-align: left; color: #2d3748;">Company</th>
            <th style="border: 1px solid #ddd; padding: 8px; font-weight: bold; text-align: left; color: #2d3748;">Host</th>
            <th style="border: 1px solid #ddd; padding: 8px; font-weight: bold; text-align: left; color: #2d3748;">Address</th>
            <th style="border: 1px solid #ddd; padding: 8px; font-weight: bold; text-align: left; color: #2d3748;">Contact</th>
          </tr>
        </thead>
        <tbody>
          ${reservations.map(res => {
            const cid = isOngoing ? res.check_in_date : formatDateIndian(res.check_in_date);
            const cod = isOngoing ? res.check_out_date : formatDateIndian(res.check_out_date);
            const address = [res.address1, res.address2, res.address3, res.city].filter(Boolean).join(', ');
            const contact = res.contact_number || 'NA';
            const company = res.company_name;
            const host = res.host_name || 'N/A';

            return `
              <tr style="border-bottom: 1px solid #ddd;">
                <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold; color: #1a202c; white-space: nowrap;">${res.reservation_no}</td>
                <td style="border: 1px solid #ddd; padding: 8px; color: #4a5568; white-space: nowrap;">${cid}</td>
                <td style="border: 1px solid #ddd; padding: 8px; color: #4a5568; white-space: nowrap;">${cod}</td>
                <td style="border: 1px solid #ddd; padding: 8px; color: #4a5568;">${res.guest_name}</td>
                <td style="border: 1px solid #ddd; padding: 8px; color: #4a5568;">${company}</td>
                <td style="border: 1px solid #ddd; padding: 8px; color: #4a5568;">${host}</td>
                <td style="border: 1px solid #ddd; padding: 8px; color: #4a5568;">${address}</td>
                <td style="border: 1px solid #ddd; padding: 8px; color: #2f855a; font-weight: bold;">${contact}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;
};

export const generateBookingReportEmailHTML = (clientReports, targetDate, logoExists = true) => {
  // Consolidate all reservation categories from all client reports
  const expectedCheckInToday = [];
  const expectedCheckOutToday = [];
  const expectedCheckInTomorrow = [];
  const expectedCheckOutTomorrow = [];
  const expectedCheckInYesterday = [];
  const expectedCheckOutYesterday = [];
  const ongoingBookings = [];

  clientReports.forEach(reportItem => {
    const { clientData, reportData } = reportItem;
    const clientName = clientData.client_name || 'Veridical Hospitality';

    const enrich = (res) => ({
      ...res,
      company_name: res.company_name || clientName
    });

    if (reportData.expectedCheckInToday) {
      expectedCheckInToday.push(...reportData.expectedCheckInToday.map(enrich));
    }
    if (reportData.expectedCheckOutToday) {
      expectedCheckOutToday.push(...reportData.expectedCheckOutToday.map(enrich));
    }
    if (reportData.expectedCheckInTomorrow) {
      expectedCheckInTomorrow.push(...reportData.expectedCheckInTomorrow.map(enrich));
    }
    if (reportData.expectedCheckOutTomorrow) {
      expectedCheckOutTomorrow.push(...reportData.expectedCheckOutTomorrow.map(enrich));
    }
    if (reportData.expectedCheckInYesterday) {
      expectedCheckInYesterday.push(...reportData.expectedCheckInYesterday.map(enrich));
    }
    if (reportData.expectedCheckOutYesterday) {
      expectedCheckOutYesterday.push(...reportData.expectedCheckOutYesterday.map(enrich));
    }
    if (reportData.ongoingBookings) {
      ongoingBookings.push(...reportData.ongoingBookings.map(enrich));
    }
  });

  const clientNameHeader = clientReports.length === 1 
    ? (clientReports[0].clientData.client_name || 'Veridical Hospitality')
    : "Consolidated Report";

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>PAJASA Booking Report</title>
  <style>
    @media only screen and (max-width: 600px) {
      table {
        width: 100% !important;
        font-size: 10px !important;
      }
      th, td {
        padding: 4px !important;
      }
      .hide-mobile {
        display: none !important;
      }
    }
  </style>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 20px; color: #2d3748; font-size: 12px; line-height: 1.4; background-color: #f7fafc;">
  <div style="max-width: 1000px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;">
    
    <!-- Header -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 25px;">
      <tr>
        <td align="left" style="vertical-align: middle;">
          ${logoExists ? '<img src="cid:logo" alt="PAJASA APARTMENTS- Service Apartments in India" style="height: 40px;" />' : '<div style="font-weight: 900; font-size: 20px; color: #3182ce;">PAJASA APARTMENTS</div>'}
        </td>
        <td align="right" style="vertical-align: middle; text-align: right;">
          <h1 style="font-size: 18px; font-weight: bold; letter-spacing: 0.5px; margin: 0; color: #2d3748;">BOOKING REPORT</h1>
          <h2 style="font-size: 13px; font-weight: normal; color: #718096; margin: 5px 0 0 0;">${clientNameHeader}</h2>
        </td>
      </tr>
    </table>

    <!-- Report Sections -->
    ${renderSectionHTML("Expected Check-In Today", expectedCheckInToday)}
    ${renderSectionHTML("Expected Check-Out Today", expectedCheckOutToday)}
    ${renderSectionHTML("Expected Check-In Tomorrow", expectedCheckInTomorrow)}
    ${renderSectionHTML("Expected Check-Out Tomorrow", expectedCheckOutTomorrow)}
    ${renderSectionHTML("Expected Check-In Yesterday", expectedCheckInYesterday)}
    ${renderSectionHTML("Expected Check-Out Yesterday", expectedCheckOutYesterday)}
    ${renderSectionHTML("Ongoing Bookings", ongoingBookings)}

    <div style="text-align: center; font-size: 11px; color: #a0aec0; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 15px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      &copy; 2018 Pajasa Apartments. All Rights Reserved
    </div>
  </div>
</body>
</html>
  `;
};
