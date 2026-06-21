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
  return `
    <div style="margin-bottom: 25px;">
      <div style="font-size: 15px; font-weight: bold; color: #2c3e50; padding-bottom: 5px; border-bottom: 3.5px solid #f39c12; margin-bottom: 12px;">
        ${title}
      </div>
      <div>
        ${hasReservations ? reservations.map(res => `
          <!-- Booking Card as table to prevent layout break in email clients -->
          <table class="booking-card-table" width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #ddd; border-radius: 6px; background-color: #ffffff; margin-bottom: 15px; border-collapse: collapse;">
            <tr>
              <!-- Col 1: Booking Details -->
              <td class="booking-col-td" width="48%" style="padding: 15px; vertical-align: top;">
                <div style="font-size: 13px; font-weight: bold; color: #2c3e50; margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 4px;">
                  Booking Details
                </div>
                
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td width="110" style="font-weight: bold; color: #333; font-size: 11px; vertical-align: top; padding-bottom: 6px;">Reservation No. :</td>
                    <td style="color: #000; font-weight: bold; font-size: 11px; vertical-align: top; padding-bottom: 6px;">${res.reservation_no}</td>
                  </tr>
                  <tr>
                    <td width="110" style="font-weight: bold; color: #333; font-size: 11px; vertical-align: top; padding-bottom: 6px;">Guest:</td>
                    <td style="color: #555; font-size: 11px; vertical-align: top; padding-bottom: 6px;">${res.guest_name}</td>
                  </tr>
                  <tr>
                    <td width="110" style="font-weight: bold; color: #333; font-size: 11px; vertical-align: top; padding-bottom: 6px;">Check-In Date:</td>
                    <td style="color: #555; font-size: 11px; vertical-align: top; padding-bottom: 6px;">${formatDateIndian(res.check_in_date)}</td>
                  </tr>
                  <tr>
                    <td width="110" style="font-weight: bold; color: #333; font-size: 11px; vertical-align: top; padding-bottom: 6px;">Check-Out Date:</td>
                    <td style="color: #555; font-size: 11px; vertical-align: top; padding-bottom: 6px;">${formatDateIndian(res.check_out_date)}</td>
                  </tr>
                </table>
              </td>
              
              <!-- Spacer Col -->
              <td class="booking-spacer-td" width="4%">&nbsp;</td>
              
              <!-- Col 2: Address -->
              <td class="booking-col-td" width="48%" style="padding: 15px; vertical-align: top;">
                <div style="font-size: 13px; font-weight: bold; color: #2c3e50; margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 4px;">
                  Address
                </div>
                
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td width="110" style="font-weight: bold; color: #333; font-size: 11px; vertical-align: top; padding-bottom: 6px;">Contact No.:</td>
                    <td style="color: #27ae60; font-weight: bold; font-size: 11px; vertical-align: top; padding-bottom: 6px;">${res.contact_number || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td width="110" style="font-weight: bold; color: #333; font-size: 11px; vertical-align: top; padding-bottom: 6px;">Address :</td>
                    <td style="color: #555; font-size: 11px; vertical-align: top; padding-bottom: 6px;">${[res.address1, res.address2, res.address3, res.city].filter(Boolean).join(', ')}</td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        `).join('') : `
          <div style="color: #c0392b; font-weight: bold; font-size: 12px; padding: 5px 0 15px 0;">No Reservation Found</div>
        `}
      </div>
    </div>
  `;
};

export const generateBookingReportEmailHTML = (clientReports, targetDate, logoExists = true) => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>PAJASA Booking Report</title>
  <style>
    @media only screen and (max-width: 600px) {
      .booking-card-table {
        width: 100% !important;
      }
      .booking-col-td {
        display: block !important;
        width: 100% !important;
        padding: 10px !important;
      }
      .booking-spacer-td {
        display: none !important;
      }
    }
  </style>
</head>
<body style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; margin: 0; padding: 20px; color: #333; font-size: 12px; line-height: 1.4; background-color: #f5f5f5;">
  <div style="max-width: 800px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;">
    
    ${clientReports.map((reportItem, index) => {
      const { clientData, reportData } = reportItem;
      const clientName = clientData.client_name || 'Veridical Hospitality';
      const clientEmail = clientData.email_address || 'booking@veridicalhospitality.com';
      
      return `
        ${index > 0 ? '<div style="margin-top: 40px; margin-bottom: 40px; border-top: 2px dashed #ddd; height: 1px;"></div>' : ''}
        
        <!-- Welcome Card -->
        <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e2e8f0; border-radius: 12px; background-color: #fafafa; margin-bottom: 25px; border-collapse: separate;">
          <tr>
            <td style="padding: 20px;">
              <!-- Welcome Top -->
              <table width="100%" cellpadding="0" cellspacing="0" style="border-bottom: 1px solid #eee; padding-bottom: 15px;">
                <tr>
                   <td align="left" style="vertical-align: middle;">
                     ${logoExists ? '<img src="cid:logo" alt="PAJASA Logo" style="height: 40px;" />' : '<div style="font-weight: 900; font-size: 20px; color: #f39c12;">PA</div>'}
                   </td>
                   <td align="right" style="vertical-align: middle;">
                     <h1 style="font-size: 18px; font-weight: bold; letter-spacing: 0.5px; margin: 0; color: #2c3e50;">BOOKING REPORT</h1>
                     <h2 style="font-size: 14px; font-weight: bold; color: #555; margin: 3px 0 0 0;">${clientName}</h2>
                   </td>
                </tr>
              </table>
              
              <!-- Welcome Info -->
              <div style="color: #7f8c8d; font-size: 12px; margin: 15px 0 10px 0;">Now you can manage your rooms and booking with our new web application.</div>
              <div style="font-weight: bold; color: #27ae60; margin-bottom: 10px; font-size: 12px;">Your User Id: ${clientEmail}</div>
              <div style="font-size: 11px; font-weight: bold;">
                <a href="#" style="color: #3498db; text-decoration: none;">Reset Password</a>
                <span style="color: #ccc; margin: 0 8px;">|</span>
                <a href="#" style="color: #3498db; text-decoration: none;">Click here to Login</a>
              </div>
            </td>
          </tr>
        </table>

        <!-- Report Sections -->
        ${renderSectionHTML("Expected Check-In Today", reportData.expectedCheckInToday)}
        ${renderSectionHTML("Expected Check-Out Today", reportData.expectedCheckOutToday)}
        ${renderSectionHTML("Expected Check-In Tomorrow", reportData.expectedCheckInTomorrow)}
        ${renderSectionHTML("Expected Check-Out Tomorrow", reportData.expectedCheckOutTomorrow)}
        ${renderSectionHTML("Expected Check-In Yesterday", reportData.expectedCheckInYesterday)}
        ${renderSectionHTML("Expected Check-Out Yesterday", reportData.expectedCheckOutYesterday)}
        ${renderSectionHTML("Ongoing Bookings", reportData.ongoingBookings)}
      `;
    }).join('')}

    <div style="text-align: center; font-size: 11px; color: #7f8c8d; margin-top: 30px; border-top: 1px solid #eee; padding-top: 15px;">
      &copy; 2018 Pajasa Apartments. All Rights Reserved
    </div>
  </div>
</body>
</html>
  `;
};
