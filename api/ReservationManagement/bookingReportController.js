import pool from "../../client.js";
import { Resend } from "resend";
import { generateBookingReportPDF } from "./bookingReportPdfGenerator.js";

// Helper function to format date to YYYY-MM-DD
const formatDateString = (d) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Internal function to retrieve and categorise reservations for a client and date
const getBookingReportDataInternal = async (client, clientId, date, user = null) => {
  let query = `
    SELECT 
      r.id,
      r.reservation_no,
      r.guest_name,
      r.contact_number,
      to_char(r.check_in_date, 'YYYY-MM-DD') as check_in_date,
      to_char(r.check_out_date, 'YYYY-MM-DD') as check_out_date,
      p.address1,
      p.address2,
      p.address3,
      p.city,
      p.location
    FROM reservations r
    LEFT JOIN properties p ON r.property_id = p.property_id
    WHERE r.client_id = $1 AND r.status != 'Cancelled'
  `;
  const params = [clientId];

  if (user && user.role === 'Read-Only Property Manager') {
    query += ` AND p.pajasa_operation_manager_email = $2`;
    params.push(user.email);
  }

  const result = await client.query(query, params);

  const targetDate = new Date(date);
  const yesterday = new Date(targetDate);
  yesterday.setDate(yesterday.getDate() - 1);
  const tomorrow = new Date(targetDate);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const targetStr = formatDateString(targetDate);
  const yesterdayStr = formatDateString(yesterday);
  const tomorrowStr = formatDateString(tomorrow);

  const reportData = {
    expectedCheckInToday: [],
    expectedCheckOutToday: [],
    expectedCheckInTomorrow: [],
    expectedCheckOutTomorrow: [],
    expectedCheckInYesterday: [],
    expectedCheckOutYesterday: [],
    ongoingBookings: []
  };

  result.rows.forEach(res => {
    const checkIn = res.check_in_date;
    const checkOut = res.check_out_date;

    if (checkIn === targetStr) {
      reportData.expectedCheckInToday.push(res);
    }
    if (checkOut === targetStr) {
      reportData.expectedCheckOutToday.push(res);
    }
    if (checkIn === tomorrowStr) {
      reportData.expectedCheckInTomorrow.push(res);
    }
    if (checkOut === tomorrowStr) {
      reportData.expectedCheckOutTomorrow.push(res);
    }
    if (checkIn === yesterdayStr) {
      reportData.expectedCheckInYesterday.push(res);
    }
    if (checkOut === yesterdayStr) {
      reportData.expectedCheckOutYesterday.push(res);
    }
    
    // Ongoing bookings are checked in before target date and checking out after target date
    if (checkIn < targetStr && checkOut > targetStr) {
      reportData.ongoingBookings.push(res);
    }
  });

  return reportData;
};

// API Endpoint to fetch Booking Report Data
export const getBookingReportData = async (req, res) => {
  const client = await pool.connect();
  try {
    const { clientId, date } = req.query;
    if (!clientId) {
      return res.status(400).json({ error: "clientId is required" });
    }

    const clientResult = await client.query('SELECT * FROM clients WHERE id = $1', [clientId]);
    if (clientResult.rows.length === 0) {
      return res.status(404).json({ error: "Client not found" });
    }
    const clientData = clientResult.rows[0];

    const targetDate = date || formatDateString(new Date());
    const reportData = await getBookingReportDataInternal(client, clientId, targetDate, req.user);

    res.status(200).json({
      success: true,
      clientData,
      targetDate,
      reportData
    });
  } catch (error) {
    console.error("Error getting booking report data:", error);
    res.status(500).json({ error: "Failed to fetch report data" });
  } finally {
    client.release();
  }
};

// API Endpoint to download Booking Report PDF
export const downloadBookingReport = async (req, res) => {
  const client = await pool.connect();
  try {
    const { clientId, date } = req.query;
    if (!clientId) {
      return res.status(400).json({ error: "clientId is required" });
    }

    const clientResult = await client.query('SELECT * FROM clients WHERE id = $1', [clientId]);
    if (clientResult.rows.length === 0) {
      return res.status(404).json({ error: "Client not found" });
    }
    const clientData = clientResult.rows[0];

    const targetDate = date || formatDateString(new Date());
    const reportData = await getBookingReportDataInternal(client, clientId, targetDate, req.user);

    const pdfBuffer = await generateBookingReportPDF(clientData, targetDate, reportData);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Booking_Report_${clientData.client_name.replace(/\s+/g, '_')}_${targetDate}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error("Error downloading booking report:", error);
    res.status(500).json({ error: "Failed to download booking report" });
  } finally {
    client.release();
  }
};

// API Endpoint to email Booking Report PDF
export const sendBookingReportEmail = async (req, res) => {
  if (req.user && req.user.role === 'Read-Only Property Manager') {
    return res.status(403).json({ error: "Access denied. Read-only users cannot send booking reports." });
  }
  const { clientId, date, recipientEmails } = req.body;
  const client = await pool.connect();
  try {
    if (!clientId) {
      return res.status(400).json({ error: "clientId is required" });
    }

    const clientResult = await client.query('SELECT * FROM clients WHERE id = $1', [clientId]);
    if (clientResult.rows.length === 0) {
      return res.status(404).json({ error: "Client not found" });
    }
    const clientData = clientResult.rows[0];

    const targetDate = date || formatDateString(new Date());
    const reportData = await getBookingReportDataInternal(client, clientId, targetDate);

    const pdfBuffer = await generateBookingReportPDF(clientData, targetDate, reportData);

    let emailsToSend = [];
    if (recipientEmails) {
      emailsToSend = Array.isArray(recipientEmails)
        ? recipientEmails
        : recipientEmails.split(',').map(e => e.trim());
    } else {
      emailsToSend = [clientData.email_address || 'booking@veridicalhospitality.com'];
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    const { data, resendError } = await resend.emails.send({
      from: "booking@pajasaapartments.com",
      to: emailsToSend,
      subject: `PAJASA Booking Report For ${clientData.client_name}:${new Date(targetDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`,
      html: `
        <div style="font-family: Arial, sans-serif; font-size: 14px; line-height: 1.5; color: #333;">
          <p>Dear Team,</p>
          <p>Please find attached the Booking Report for <strong>${clientData.client_name}</strong> for ${new Date(targetDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}.</p>
          <p>Regards,<br/><strong>Team PAJASA</strong></p>
        </div>
      `,
      attachments: [
        {
          filename: `Booking_Report_${clientData.client_name.replace(/\s+/g, '_')}_${targetDate}.pdf`,
          content: Buffer.from(pdfBuffer),
        }
      ]
    });

    if (resendError) {
      throw new Error(`Resend Error: ${resendError.message}`);
    }

    res.status(200).json({ success: true, message: "Booking report email sent successfully" });
  } catch (error) {
    console.error("Error sending booking report email:", error);
    res.status(500).json({ error: "Failed to send booking report email", message: error.message });
  } finally {
    client.release();
  }
};

// Global cron job handler called daily at 06:00 AM IST
export const sendDailyBookingReports = async () => {
  console.log("Starting daily booking reports generation...");
  
  // Calculate today's date string in Asia/Kolkata
  const options = { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' };
  const formatter = new Intl.DateTimeFormat('en-CA', options); // YYYY-MM-DD
  const targetDate = formatter.format(new Date());
  
  const client = await pool.connect();
  const resend = new Resend(process.env.RESEND_API_KEY);
  
  try {
    // 1. Fetch all clients
    const clientsResult = await client.query('SELECT * FROM clients');
    const clients = clientsResult.rows;
    
    console.log(`Found ${clients.length} clients to evaluate for date ${targetDate}.`);
    
    const operationalEmails = ['Ps@pajasaapartments.com', 'Operations@pajasaapartments.com', 'harshitshukla6388@gmail.com'];
    
    for (const clientData of clients) {
      // 2. Fetch reports for client
      const reportData = await getBookingReportDataInternal(client, clientData.id, targetDate);
      
      // 3. Count total active reservation events
      const totalEvents = 
        reportData.expectedCheckInToday.length +
        reportData.expectedCheckOutToday.length +
        reportData.expectedCheckInTomorrow.length +
        reportData.expectedCheckOutTomorrow.length +
        reportData.expectedCheckInYesterday.length +
        reportData.expectedCheckOutYesterday.length +
        reportData.ongoingBookings.length;
        
      if (totalEvents > 0) {
        console.log(`Generating report for ${clientData.client_name} (${totalEvents} events)`);
        
        // 4. Generate PDF
        const pdfBuffer = await generateBookingReportPDF(clientData, targetDate, reportData);
        
        // 5. Send report to PAJASA internal operations
        const { data, resendError } = await resend.emails.send({
          from: "booking@pajasaapartments.com",
          to: operationalEmails,
          subject: `Daily Booking Report - ${clientData.client_name} - Date: ${targetDate}`,
          html: `
            <div style="font-family: Arial, sans-serif; font-size: 14px; line-height: 1.5; color: #333;">
              <p>Hi Team,</p>
              <p>Please find attached the daily booking report for client <strong>${clientData.client_name}</strong> for ${new Date(targetDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}.</p>
              <p>This report has been automatically generated and sent at 06:00 AM IST.</p>
              <p>Regards,<br/><strong>PAJASA Automation Service</strong></p>
            </div>
          `,
          attachments: [
            {
              filename: `Daily_Report_${clientData.client_name.replace(/\s+/g, '_')}_${targetDate}.pdf`,
              content: Buffer.from(pdfBuffer),
            }
          ]
        });
        
        if (resendError) {
          console.error(`Error emailing daily report for ${clientData.client_name}:`, resendError);
        } else {
          console.log(`Daily report email sent for ${clientData.client_name}.`);
        }
      }
    }
  } catch (err) {
    console.error("Critical error running daily booking reports cron:", err);
    throw err;
  } finally {
    client.release();
  }
};
