import puppeteer from 'puppeteer';
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

export const generateBookingReportPDF = async (clientData, targetDate, reportData) => {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();

  // Convert logo to base64
  let logoBase64 = '';
  try {
    const logoPath = path.join(__dirname, '../../logo.png');
    if (fs.existsSync(logoPath)) {
      const logoBuffer = fs.readFileSync(logoPath);
      logoBase64 = `data:image/png;base64,${logoBuffer.toString('base64')}`;
    }
  } catch (err) {
    console.error("Logo not found for booking report PDF", err);
  }

  // Format email dates
  const printedDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const printedTime = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  const formattedTargetDate = formatDateIndian(targetDate);
  const emailDateStr = new Date(targetDate).toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }) + " 6:30:08 AM +0530"; // Mocking the exact format from original

  const clientName = clientData.client_name || 'Veridical Hospitality';
  const clientEmail = clientData.email_address || 'booking@veridicalhospitality.com';

  const renderSection = (title, reservations) => {
    const hasReservations = reservations && reservations.length > 0;
    return `
      <div class="section-container">
        <div class="section-header">${title}</div>
        <div class="section-content">
          ${hasReservations ? reservations.map(res => `
            <div class="booking-card">
              <div class="booking-col">
                <div class="col-title">Booking Details</div>
                <div class="detail-row"><span class="label">Reservation No. :</span><span class="value bold-val">${res.reservation_no}</span></div>
                <div class="detail-row"><span class="label">Guest:</span><span class="value">${res.guest_name}</span></div>
                <div class="detail-row"><span class="label">Check-In Date:</span><span class="value">${formatDateIndian(res.check_in_date)}</span></div>
                <div class="detail-row"><span class="label">Check-Out Date:</span><span class="value">${formatDateIndian(res.check_out_date)}</span></div>
              </div>
              <div class="booking-col">
                <div class="col-title">Address</div>
                <div class="detail-row"><span class="label">Contact No.:</span><span class="value green-val">${res.contact_number || 'N/A'}</span></div>
                <div class="detail-row"><span class="label">Address :</span><span class="value">${[res.address1, res.address2, res.address3, res.city].filter(Boolean).join(', ')}</span></div>
              </div>
            </div>
          `).join('') : `
            <div class="no-reservation">No Reservation Found</div>
          `}
        </div>
      </div>
    `;
  };

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>PAJASA Booking Report For ${clientName}</title>
  <style>
    @page {
      size: A4;
      margin: 10mm;
      @bottom-right {
        content: counter(page) "/" counter(pages);
        font-size: 8pt;
        color: #666;
      }
    }
    body {
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 0;
      color: #333;
      font-size: 9pt;
      line-height: 1.4;
      background: white;
    }
    .print-header {
      display: flex;
      justify-content: space-between;
      font-size: 7.5pt;
      color: #555;
      border-bottom: 1px solid #ddd;
      padding-bottom: 4px;
      margin-bottom: 15px;
    }
    .report-wrapper {
      padding: 0px 5px;
    }
    .email-header-info {
      font-size: 9.5pt;
      margin-bottom: 20px;
      line-height: 1.5;
    }
    .email-header-info p {
      margin: 3px 0;
    }
    .welcome-card {
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 20px;
      background-color: #fafafa;
      margin-bottom: 25px;
      display: flex;
      flex-direction: column;
    }
    .welcome-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 15px;
      border-bottom: 1px solid #eee;
      padding-bottom: 15px;
    }
    .welcome-logo {
      height: 40px;
    }
    .welcome-logo img {
      height: 100%;
    }
    .welcome-title-area {
      text-align: right;
    }
    .report-main-title {
      font-size: 14pt;
      font-weight: bold;
      letter-spacing: 0.5px;
      margin: 0;
      color: #2c3e50;
    }
    .report-sub-title {
      font-size: 11pt;
      font-weight: bold;
      color: #555;
      margin: 3px 0 0 0;
    }
    .welcome-text {
      color: #7f8c8d;
      font-size: 9pt;
      margin: 0 0 10px 0;
    }
    .welcome-user-id {
      font-weight: bold;
      color: #27ae60;
      margin-bottom: 10px;
      font-size: 9pt;
    }
    .welcome-links {
      font-size: 8.5pt;
      font-weight: bold;
    }
    .welcome-links a {
      color: #3498db;
      text-decoration: none;
    }
    .welcome-links span {
      color: #ccc;
      margin: 0 8px;
    }
    .section-container {
      margin-bottom: 25px;
      page-break-inside: avoid;
    }
    .section-header {
      font-size: 11.5pt;
      font-weight: bold;
      color: #2c3e50;
      padding-bottom: 5px;
      border-bottom: 3.5px solid #f39c12;
      margin-bottom: 12px;
    }
    .no-reservation {
      color: #c0392b;
      font-weight: bold;
      font-size: 9.5pt;
      padding: 5px 0 15px 0;
    }
    .booking-card {
      border: 1px solid #ddd;
      border-radius: 6px;
      padding: 15px;
      margin-bottom: 15px;
      display: flex;
      justify-content: space-between;
      background: #fff;
      page-break-inside: avoid;
    }
    .booking-col {
      width: 48%;
    }
    .col-title {
      font-size: 10pt;
      font-weight: bold;
      color: #2c3e50;
      margin-bottom: 10px;
      border-bottom: 1px solid #eee;
      padding-bottom: 4px;
    }
    .detail-row {
      margin-bottom: 6px;
      font-size: 8.5pt;
      display: flex;
      align-items: flex-start;
    }
    .detail-row .label {
      font-weight: bold;
      color: #333;
      width: 110px;
      flex-shrink: 0;
    }
    .detail-row .value {
      color: #555;
      flex: 1;
    }
    .bold-val {
      font-weight: bold;
      color: #000 !important;
    }
    .green-val {
      color: #27ae60 !important;
      font-weight: bold;
    }
    .footer-rights {
      text-align: center;
      font-size: 8pt;
      color: #7f8c8d;
      margin-top: 30px;
      border-top: 1px solid #eee;
      padding-top: 15px;
    }
  </style>
</head>
<body>
  <!-- Print date/header replicating browser PDF output -->
  <div class="print-header">
    <div>${printedDate}, ${printedTime}</div>
    <div>PAJASA Booking Report For ${clientName}:${formattedTargetDate}</div>
    <div>paras &lt; paras@pajasa.com &gt;</div>
  </div>

  <div class="report-wrapper">
    <!-- Email Metadata mimicking screenshot -->
    <div class="email-header-info">
      <p><strong>PAJASA</strong> &lt; booking@pajasaapartments.com &gt;</p>
      <p style="color: #666; font-size: 8.5pt;">${emailDateStr}</p>
      <p>To "booking" &lt;${clientEmail}&gt;, "operations" &lt;operations@pajasaapartments.com&gt;</p>
    </div>

    <!-- Main Container Card -->
    <div class="welcome-card">
      <div class="welcome-top">
        <div class="welcome-logo">
          ${logoBase64 ? `<img src="${logoBase64}" alt="PAJASA Logo" />` : `<div style="font-weight: 900; font-size: 20px; color: #f39c12;">PA</div>`}
        </div>
        <div class="welcome-title-area">
          <h1 class="report-main-title">BOOKING REPORT</h1>
          <h2 class="report-sub-title">${clientName}</h2>
        </div>
      </div>
      <div class="welcome-text">Now you can manage your rooms and booking with our new web application.</div>
      <div class="welcome-user-id">Your User Id: ${clientEmail}</div>
      <div class="welcome-links">
        <a href="#">Reset Password</a>
        <span>|</span>
        <a href="#">Click here to Login</a>
      </div>
    </div>

    <!-- Report Sections -->
    ${renderSection("Expected Check-In Today", reportData.expectedCheckInToday)}
    ${renderSection("Expected Check-Out Today", reportData.expectedCheckOutToday)}
    ${renderSection("Expected Check-In Tomorrow", reportData.expectedCheckInTomorrow)}
    ${renderSection("Expected Check-Out Tomorrow", reportData.expectedCheckOutTomorrow)}
    ${renderSection("Expected Check-In Yesterday", reportData.expectedCheckInYesterday)}
    ${renderSection("Expected Check-Out Yesterday", reportData.expectedCheckOutYesterday)}
    ${renderSection("Ongoing Bookings", reportData.ongoingBookings)}

    <div class="footer-rights">
      &copy; 2018 Pajasa Apartments. All Rights Reserved
    </div>
  </div>
</body>
</html>
  `;

  await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

  const pdfBuffer = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: {
      top: '10mm',
      bottom: '10mm',
      left: '10mm',
      right: '10mm'
    }
  });

  await browser.close();
  return pdfBuffer;
};
