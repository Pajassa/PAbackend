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

  const enrich = (res) => ({
    ...res,
    company_name: res.company_name || clientName
  });

  const renderSection = (title, reservations) => {
    const hasReservations = reservations && reservations.length > 0;
    const isOngoing = title.toLowerCase().includes("ongoing");

    if (!hasReservations) {
      return `
        <div class="section-container">
          <div class="section-header">${title}</div>
          <div class="no-records-box">No Records found</div>
        </div>
      `;
    }

    const enrichedReservations = reservations.map(enrich);

    return `
      <div class="section-container">
        <div class="section-header">${title}</div>
        <table class="report-table">
          <thead>
            <tr>
              <th>Resv No.</th>
              <th>C.I.D</th>
              <th>C.O.D</th>
              <th>Guest</th>
              <th>Company</th>
              <th>Host</th>
              <th>Address</th>
              <th>Contact</th>
            </tr>
          </thead>
          <tbody>
            ${enrichedReservations.map(res => {
              const cid = isOngoing ? res.check_in_date : formatDateIndian(res.check_in_date);
              const cod = isOngoing ? res.check_out_date : formatDateIndian(res.check_out_date);
              const address = [res.address1, res.address2, res.address3, res.city].filter(Boolean).join(', ');
              const contact = res.contact_number || 'NA';
              const company = res.company_name;
              const host = res.host_name || 'N/A';

              return `
                <tr>
                  <td class="bold-val nowrap">${res.reservation_no}</td>
                  <td class="nowrap">${cid}</td>
                  <td class="nowrap">${cod}</td>
                  <td>${res.guest_name}</td>
                  <td>${company}</td>
                  <td>${host}</td>
                  <td>${address}</td>
                  <td class="green-val font-mono">${contact}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
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
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 0;
      color: #2d3748;
      font-size: 8.5pt;
      line-height: 1.4;
      background: white;
    }
    .print-header {
      display: flex;
      justify-content: space-between;
      font-size: 7.5pt;
      color: #718096;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 4px;
      margin-bottom: 15px;
    }
    .report-wrapper {
      padding: 0px 5px;
    }
    .email-header-info {
      font-size: 8.5pt;
      margin-bottom: 20px;
      line-height: 1.5;
      color: #4a5568;
    }
    .email-header-info p {
      margin: 3px 0;
    }
    .welcome-header-table {
      width: 100%;
      margin-bottom: 25px;
      border-collapse: collapse;
    }
    .welcome-logo {
      height: 40px;
    }
    .welcome-logo img {
      height: 100%;
    }
    .report-main-title {
      font-size: 16pt;
      font-weight: bold;
      letter-spacing: 0.5px;
      margin: 0;
      color: #2d3748;
    }
    .report-sub-title {
      font-size: 11pt;
      font-weight: normal;
      color: #718096;
      margin: 5px 0 0 0;
    }
    .section-container {
      margin-bottom: 25px;
      page-break-inside: avoid;
    }
    .section-header {
      font-size: 11pt;
      font-weight: bold;
      color: #2d3748;
      margin-bottom: 10px;
    }
    .no-records-box {
      border: 1px solid #ff0000;
      padding: 10px;
      margin-bottom: 20px;
      color: #ff0000;
      font-size: 8.5pt;
      font-weight: bold;
      text-align: left;
      background-color: #fff5f5;
      border-radius: 4px;
    }
    .report-table {
      width: 100%;
      border: 1px solid #ddd;
      border-collapse: collapse;
      margin-bottom: 20px;
      font-size: 8pt;
    }
    .report-table th, .report-table td {
      border: 1px solid #ddd;
      padding: 6px;
      text-align: left;
    }
    .report-table th {
      background-color: #f8fafc;
      font-weight: bold;
      color: #2d3748;
    }
    .report-table td {
      color: #4a5568;
    }
    .bold-val {
      font-weight: bold;
      color: #1a202c !important;
    }
    .green-val {
      color: #2f855a !important;
      font-weight: bold;
    }
    .nowrap {
      white-space: nowrap;
    }
    .footer-rights {
      text-align: center;
      font-size: 8pt;
      color: #a0aec0;
      margin-top: 30px;
      border-top: 1px solid #e2e8f0;
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

    <!-- Header -->
    <table class="welcome-header-table">
      <tr>
        <td align="left" style="vertical-align: middle;">
          <div class="welcome-logo">
            ${logoBase64 ? `<img src="${logoBase64}" alt="PAJASA APARTMENTS- Service Apartments in India" />` : `<div style="font-weight: 900; font-size: 20px; color: #3182ce;">PAJASA APARTMENTS</div>`}
          </div>
        </td>
        <td align="right" style="vertical-align: middle; text-align: right;">
          <h1 class="report-main-title">BOOKING REPORT</h1>
          <h2 class="report-sub-title">${clientName}</h2>
        </td>
      </tr>
    </table>

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
