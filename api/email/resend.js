import { Resend } from "resend";
import { formatDateExact } from "../../helpers/formatDate.js";
import { formatServices } from "../../helpers/formatServices.js";
import pool from "../../client.js";
import puppeteer from "puppeteer";

const resend = new Resend(process.env.RESEND_API_KEY); // ✅ Load from .env

const formatOccupancy = (occ) => {
    const map = { 1: "SO", 2: "DO", 3: "TO" };
    return map[Number(occ)] || occ;
};

const formatRoomSelection = (roomSelection, roomtype, property_type) => {
    let rooms = roomSelection;
    if (typeof rooms === 'string') {
        try { rooms = JSON.parse(rooms); } catch (e) { rooms = []; }
    }

    if (rooms && Array.isArray(rooms) && rooms.length > 0) {
        return [...rooms]
            .sort((a, b) => {
                const nameA = (typeof a === 'string' ? a : (a.roomType || a.room_type || "")).toLowerCase();
                const nameB = (typeof b === 'string' ? b : (b.roomType || b.room_type || "")).toLowerCase();

                const getPriority = (name) => {
                    const n = name.toLowerCase();
                    if (n.includes('master') && n.includes('1')) return 1;
                    if (n.includes('common')) return 3;
                    return 2;
                };

                const prioA = getPriority(nameA);
                const prioB = getPriority(nameB);

                if (prioA !== prioB) return prioA - prioB;
                return nameA.localeCompare(nameB);
            })
            .map((r) => {
                const name = typeof r === 'string' ? r : (r.roomType || r.room_type || "");
                const occ = typeof r === 'string' ? '' : r.occupancy;
                const label = occ === '1' ? 'SO' : occ === '2' ? 'DO' : occ === '3' ? 'TO' : occ;
                return label ? `${name} (${label})` : name;
            }).join(", ");
    }
    return (property_type === '1 BHK' ? 'Entire Apartment' : roomtype);
};

const generatePdfBuffer = async (html) => {
    const browser = await puppeteer.launch({
        headless: "new",
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    try {
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: "networkidle0" });
        await page.evaluate(() => document.fonts.ready);
        const pdfBuffer = await page.pdf({
            format: "A4",
            printBackground: true,
            margin: { top: "10mm", bottom: "10mm", left: "10mm", right: "10mm" },
        });
        return pdfBuffer;
    } finally {
        await browser.close();
    }
};

const generateGuestPdfHtml = ({
    guestname,
    reservationNo,
    formatted,
    checkin,
    checkout,
    check_in_time,
    check_out_time,
    contactnumberguest,
    additionalGuestsHtml,
    chargeabledays,
    occupancy,
    address1,
    address2,
    address3,
    fetchedPropertyType,
    apartment_type,
    roomtype,
    services,
    modeofpayment,
    amount,
    base_rate,
    taxes,
    tariff_type,
    clientName,
    guestemail,
    originalBooking,
    modificationType,
    Title
}) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap');
        body {
            margin: 0;
            padding: 40px;
            background-color: #ffffff;
            font-family: 'Inter', system-ui, -apple-system, sans-serif;
            color: #0f172a;
        }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            border-bottom: 3px solid #1e293b;
            padding-bottom: 28px;
            margin-bottom: 40px;
        }
        .logo-box {
            display: flex;
            align-items: center;
            gap: 16px;
        }
        .logo-pa {
            width: 44px;
            height: 44px;
            background: #f4a01e;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: 900;
            font-size: 22px;
            flex-shrink: 0;
        }
        .welcome-box {
            margin-bottom: 35px;
            padding: 25px;
            background: #f8fafc;
            border-radius: 16px;
            border-left: 6px solid #f4a01e;
        }
        .section-box {
            border: 2px solid #cbd5e1;
            border-radius: 16px;
            overflow: hidden;
            margin-bottom: 32px;
        }
        .section-header {
            background: #f1f5f9;
            padding: 16px 24px;
            border-bottom: 2px solid #cbd5e1;
        }
        .section-content {
            padding: 24px;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 24px;
        }
        .billing-box {
            background: #f59e0b;
            border-radius: 24px;
            padding: 40px;
            color: white;
            display: flex;
            justify-content: space-between;
            align-items: center;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2);
        }
        .label {
            display: block;
            font-size: 12px;
            font-weight: 800;
            color: #475569;
            text-transform: uppercase;
            margin-bottom: 6px;
        }
        .value {
            font-size: 16px;
            font-weight: 700;
            color: #0f172a;
        }
        .stat-box {
            padding: 24px;
            border-radius: 16px;
            text-align: center;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo-box">
            <div class="logo-pa">PA</div>
            <div>
                <h1 style="margin: 0; font-size: 32px; font-weight: 900; color: #f4a01e; letter-spacing: -0.02em;">GUEST ${Title} </h1>
                <p style="margin: 6px 0 0 0; color: #334155; font-size: 16px; font-weight: 600;">Extended Stay Apartment </p>
            </div>
        </div>
        <div style="text-align: right;">
            <p style="margin: 0; font-size: 12px; font-weight: 800; color: #f4a01e; text-transform: uppercase; letter-spacing: 0.12em;">Reservation ID</p>
            <p style="margin: 4px 0 0 0; font-size: 22px; font-weight: 900; color: #0f172a;">${reservationNo}</p>
            <p style="margin: 10px 0 0 0; font-size: 13px; font-weight: 600; color: #475569;">Booked: ${formatted}</p>
        </div>
    </div>

    <div class="welcome-box">
        <p style="margin: 0; font-size: 18px; color: #1e293b; line-height: 1.5; font-weight: 700;">
            Hi <span style="color: #f4a01e;">${guestname}</span>,
        </p>
        <p style="margin: 10px 0 0 0; font-size: 15px; color: #475569; line-height: 1.6;">
            PAJASA has successfully updated a booking at <strong>our property</strong>. We are delighted to host you on <strong>${formatDateExact(checkin, false)}</strong>.
        </p>
    </div>

    <div class="section-box">
        <div class="section-header">
            <h2 style="margin: 0; font-size: 15px; font-weight: 800; color: #1e293b; text-transform: uppercase;">1. Guest Profile</h2>
        </div>
        <div class="section-content">
            <div>
                <label class="label">Guest Name</label>
                <div class="value">${guestname}</div>
            </div>
            <div>
                <label class="label">Contact Number</label>
                <div class="value">${contactnumberguest || 'N/A'}</div>
            </div>
            <div style="grid-column: span 2;">
                <label class="label">Company / Business Name</label>
                <div class="value">${clientName}</div>
            </div>
        </div>
    </div>

    <div style="display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 32px; margin-bottom: 32px;">
        <div class="section-box" style="margin-bottom: 0;">
            <div class="section-header">
                <h2 style="margin: 0; font-size: 15px; font-weight: 800; color: #1e293b; text-transform: uppercase;">2. Stay Schedule</h2>
            </div>
            <div style="padding: 24px;">
                <div style="margin-bottom: 20px;">
                    <label class="label">Check-in Date & Time</label>
                    ${originalBooking && (modificationType === 'preponed' || modificationType === 'postponed') ? `
                        <div style="font-size: 14px; color: #94a3b8; text-decoration: line-through; margin-bottom: 4px;">${formatDateExact(originalBooking.old_check_in_date, true)}</div>
                        <div style="font-size: 16px; font-weight: 700; color: #b91c1c;">${formatDateExact(checkin, true)}</div>
                    ` : `
                        <div class="value">${formatDateExact(checkin, true)}</div>
                    `}
                    <div style="font-size: 14px; color: #f4a01e; font-weight: 800; margin-top: 4px;">Time: ${check_in_time}</div>
                </div>
                <div style="padding-top: 16px; border-top: 2px dashed #e2e8f0;">
                    <label class="label">Check-out Date & Time</label>
                    ${originalBooking && (modificationType === 'extended' || modificationType === 'shortened') ? `
                        <div style="font-size: 14px; color: #94a3b8; text-decoration: line-through; margin-bottom: 4px;">${formatDateExact(originalBooking.old_check_out_date, false)}</div>
                        <div style="font-size: 16px; font-weight: 700; color: #b91c1c;">${formatDateExact(checkout, false)}</div>
                    ` : additionalGuestsHtml ? `
                        <div class="value">${additionalGuestsHtml}</div>
                    ` : `
                        <div class="value">${formatDateExact(checkout, false)}</div>
                    `}
                    <div style="font-size: 14px; color: #b91c1c; font-weight: 800; margin-top: 4px;">Time: ${check_out_time}</div>
                </div>
            </div>
        </div>

        <div style="display: flex; flex-direction: column; gap: 24px;">
            <div class="stat-box" style="border: 2px solid #f4a01e; background: #fffbeb;">
                <div style="font-size: 13px; font-weight: 900; color: #f4a01e; text-transform: uppercase; margin-bottom: 8px;">Total Stay</div>
                <div style="font-size: 28px; font-weight: 900; color: #92400e;">${chargeabledays} <span style="font-size: 16px;">Nights</span></div>
            </div>
            <div class="stat-box" style="border: 2px solid #7e22ce; background: #f5f3ff;">
                <div style="font-size: 13px; font-weight: 900; color: #7e22ce; text-transform: uppercase; margin-bottom: 8px;">Guest Count</div>
                <div style="font-size: 28px; font-weight: 900; color: #581c87;">${formatOccupancy(occupancy)}</div>
            </div>
        </div>
    </div>

    <div class="section-box">
        <div class="section-header">
            <h2 style="margin: 0; font-size: 15px; font-weight: 800; color: #1e293b; text-transform: uppercase;">3. Residence Information</h2>
        </div>
        <div class="section-content">
            <div style="grid-column: span 2;">
                <label class="label">Apartment Full Address</label>
                <div class="value">${address1}, ${address2}, ${address3}</div>
            </div>
            <div>
                <label class="label">Property Type</label>
                <div class="value">${fetchedPropertyType || apartment_type}</div>
            </div>
            <div>
                <label class="label">Room Selection</label>
                <div class="value">${(fetchedPropertyType || apartment_type) === '1 BHK' ? 'Entire Apartment' : roomtype}</div>
            </div>
        </div>
    </div>
    
    <div class="section-box">
        <div class="section-header">
            <h2 style="margin: 0; font-size: 15px; font-weight: 800; color: #1e293b; text-transform: uppercase;">4. Package Includes</h2>
        </div>
        <div style="padding: 24px; display: flex; flex-wrap: wrap; gap: 12px;">
            <div style="display: inline-block; background: #fffbeb; border: 1px solid #fef3c7; padding: 10px 20px; border-radius: 12px; font-size: 14px; font-weight: 800; color: #92400e; margin-right: 12px; margin-bottom: 12px;">
                <span style="color: #f4a01e;">✦</span> Accommodation
            </div>
            ${formatServices(services).split(',').filter(s => s.trim()).map(s => `
                <div style="display: inline-block; background: #fffbeb; border: 1px solid #fef3c7; padding: 10px 20px; border-radius: 12px; font-size: 14px; font-weight: 800; color: #92400e; margin-right: 12px; margin-bottom: 12px;">
                    <span style="color: #f4a01e;">✦</span> ${s.trim()}
                </div>
            `).join('')}
        </div>
    </div>

    <div class="billing-box">
        <div style="text-align: left; display: flex; flex-direction: column; gap: 15px;">
            <div style="background: rgba(255, 255, 255, 0.15); border: 2px solid rgba(255, 255, 255, 0.3); padding: 15px 30px; border-radius: 16px; display: table;">
                <span style="font-size: 16px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em;">Mode Of Payment: ${modeofpayment}</span>
            </div>
            
        </div>
        <div style="text-align: right; ${modeofpayment === 'Bill to Company' ? 'display: none;' : ''}">
            <h3 style="margin: 12px 0 0 0; font-size: 44px; font-weight: 900; color: #ffffff; letter-spacing: -0.02em;">₹ ${(amount * chargeabledays).toLocaleString('en-IN')}</h3>
            <div style="margin-top: 12px; font-size: 14px; color: rgba(255,255,255,0.8); font-weight: 600;">
                Base: ₹ ${base_rate} • Tax: ${taxes}% (₹ ${(base_rate * taxes / 100).toFixed(2)}) • Per Night: ₹ ${amount}
            </div>
        </div>
    </div>

    <div class="welcome-box" style="margin-top: 40px; border-left: none; border: 1px solid #e2e8f0;">
        <h3 style="margin: 0 0 15px 0; font-size: 14px; font-weight: 800; color: #1e293b; text-transform: uppercase;">Terms & Conditions</h3>
        <div style="font-size: 13px; color: #475569; line-height: 1.8;">
            1. Check in & Check out Time 14:00 PM & 11:00 AM<br>
            2. Every guest will have to carry a print of the confirmation along with the company and government photo ID at the time of checking in.<br>
            3. Visitors are permitted in the apartment only between 10:00 AM and 7:00 PM. Maximum of One visitor per day.<br>
            4. Cancellation Terms: Kindly visit <span style="color: #f4a01e;">pajasaapartments.com/terms-and-conditions/</span>
        </div>
    </div>

    <!-- Footer Links -->
    <div style="background-color: #f59e0b; padding: 20px; border-radius: 12px; text-align: center; margin-top: 40px;">
        <div style="margin-bottom: 10px;">
            <a href="https://www.pajasaapartments.com/in/mumbai/" style="font-size: 13px; color: white; margin: 0 8px; text-decoration: none; font-weight: 700;">Mumbai</a>
            <a href="https://www.pajasaapartments.com/in/pune/" style="font-size: 13px; color: white; margin: 0 8px; text-decoration: none; font-weight: 700;">Pune</a>
            <a href="https://www.pajasaapartments.com/in/bengaluru/" style="font-size: 13px; color: white; margin: 0 8px; text-decoration: none; font-weight: 700;">Bangalore</a>
            <a href="https://www.pajasaapartments.com/in/hyderabad/" style="font-size: 13px; color: white; margin: 0 8px; text-decoration: none; font-weight: 700;">Hyderabad</a>
        </div>
        <div>
            <a href="http://pajasaapartments.com/in/noida/" style="font-size: 13px; color: white; margin: 0 8px; text-decoration: none; font-weight: 700;">Noida</a>
            <a href="https://www.pajasaapartments.com/in/new-delhi/" style="font-size: 13px; color: white; margin: 0 8px; text-decoration: none; font-weight: 700;">Delhi</a>
            <a href="https://www.pajasaapartments.com/in/gurugram/" style="font-size: 13px; color: white; margin: 0 8px; text-decoration: none; font-weight: 700;">Gurgaon</a>
            <a href="https://www.pajasaapartments.com/in/chennai/" style="font-size: 13px; color: white; margin: 0 8px; text-decoration: none; font-weight: 700;">Chennai</a>
        </div>
    </div>

   
</body>
</html>
`;

const generateApartmentPdfHtml = ({
    reservationNo,
    hostName,
    Title,
    address1,
    address2,
    address3,
    contactperson,
    contactnumber,
    guestname,
    contactnumberguest,
    guesttype,
    originalBooking,
    modificationType,
    checkin,
    checkout,
    chargeabledays,
    fetchedPropertyType,
    apartment_type,
    roomtype,
    occupancy,
    host_payment_mode,
    hostPaymentDetails,
    services,
    check_in_time,
    check_out_time
}) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap');
        body {
            margin: 0;
            padding: 40px;
            background-color: #ffffff;
            font-family: 'Inter', system-ui, -apple-system, sans-serif;
            color: #0f172a;
        }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            border-bottom: 3px solid #1e293b;
            padding-bottom: 28px;
            margin-bottom: 40px;
        }
        .logo-box {
            display: flex;
            align-items: center;
            gap: 16px;
        }
        .logo-pa {
            width: 44px;
            height: 44px;
            background: #f4a01e;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: 900;
            font-size: 22px;
            flex-shrink: 0;
        }
        .welcome-box {
            margin-bottom: 35px;
            padding: 25px;
            background: #f8fafc;
            border-radius: 16px;
            border-left: 6px solid #f4a01e;
        }
        .section-box {
            border: 2px solid #cbd5e1;
            border-radius: 16px;
            overflow: hidden;
            margin-bottom: 32px;
        }
        .section-header {
            background: #f1f5f9;
            padding: 16px 24px;
            border-bottom: 2px solid #cbd5e1;
        }
        .section-content {
            padding: 24px;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 24px;
        }
        .billing-box {
            background: #f59e0b;
            border-radius: 24px;
            padding: 40px;
            color: white;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .label {
            display: block;
            font-size: 12px;
            font-weight: 800;
            color: #475569;
            text-transform: uppercase;
            margin-bottom: 6px;
        }
        .value {
            font-size: 16px;
            font-weight: 700;
            color: #0f172a;
        }
        .stat-box {
            padding: 24px;
            border-radius: 16px;
            text-align: center;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo-box">
            <div class="logo-pa">PA</div>
            <div>
                <h1 style="margin: 0; font-size: 32px; font-weight: 900; color: #f4a01e; letter-spacing: -0.02em;">APARTMENT BOOKING</h1>
                <p style="margin: 6px 0 0 0; color: #334155; font-size: 16px; font-weight: 600;">Apartment ${Title}</p>
            </div>
        </div>
        <div style="text-align: right;">
            <p style="margin: 0; font-size: 12px; font-weight: 800; color: #f4a01e; text-transform: uppercase; letter-spacing: 0.12em;">Reservation ID</p>
            <p style="margin: 4px 0 0 0; font-size: 22px; font-weight: 900; color: #0f172a;">${reservationNo}</p>
        </div>
    </div>

    <div class="welcome-box">
        <p style="margin: 0; font-size: 18px; color: #1e293b; line-height: 1.5; font-weight: 700;">
            Hi <span style="color: #f4a01e;">${hostName}</span>,
        </p>
        <p style="margin: 10px 0 0 0; font-size: 15px; color: #475569; line-height: 1.6;">
            PAJASA has successfully created a new booking at your property. The guest will be arriving on <strong>${formatDateExact(checkin, false)}</strong>. Please ensure the apartment is ready.
        </p>
    </div>

    <div class="section-box">
        <div class="section-header">
            <h2 style="margin: 0; font-size: 15px; font-weight: 800; color: #1e293b; text-transform: uppercase;">1. Host & Residence</h2>
        </div>
        <div class="section-content">
            <div>
                <label class="label">Host Name</label>
                <div class="value">${hostName}</div>
            </div>
            <div>
                <label class="label">Contact Person</label>
                <div class="value">${contactperson}</div>
            </div>
            <div>
                <label class="label">Contact Number</label>
                <div class="value">${contactnumber}</div>
            </div>
            <div>
                <label class="label">Property Type</label>
                <div class="value">${fetchedPropertyType || apartment_type}</div>
            </div>
            <div style="grid-column: span 2;">
                <label class="label">Apartment Full Address</label>
                <div class="value">${address1}, ${address2}, ${address3}</div>
            </div>
        </div>
    </div>

    <div style="display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 32px; margin-bottom: 32px;">
        <div class="section-box" style="margin-bottom: 0;">
            <div class="section-header">
                <h2 style="margin: 0; font-size: 15px; font-weight: 800; color: #1e293b; text-transform: uppercase;">2. Stay Schedule</h2>
            </div>
            <div style="padding: 24px;">
                <div style="margin-bottom: 20px;">
                    <label class="label">Check-in Date & Time</label>
                    ${originalBooking && (modificationType === 'preponed' || modificationType === 'postponed') ? `
                        <div style="font-size: 14px; color: #94a3b8; text-decoration: line-through; margin-bottom: 4px;">${formatDateExact(originalBooking.old_check_in_date, true)}</div>
                        <div style="font-size: 16px; font-weight: 700; color: #b91c1c;">${formatDateExact(checkin, true)}</div>
                    ` : `
                        <div class="value">${formatDateExact(checkin, true)}</div>
                    `}
                    <div style="font-size: 14px; color: #f4a01e; font-weight: 800; margin-top: 4px;">Time: ${check_in_time}</div>
                </div>
                <div style="padding-top: 16px; border-top: 2px dashed #e2e8f0;">
                    <label class="label">Check-out Date & Time</label>
                    ${originalBooking && (modificationType === 'extended' || modificationType === 'shortened') ? `
                        <div style="font-size: 14px; color: #94a3b8; text-decoration: line-through; margin-bottom: 4px;">${formatDateExact(originalBooking.old_check_out_date, false)}</div>
                        <div style="font-size: 16px; font-weight: 700; color: #b91c1c;">${formatDateExact(checkout, false)}</div>
                    ` : `
                        <div class="value">${formatDateExact(checkout, false)}</div>
                    `}
                    <div style="font-size: 14px; color: #b91c1c; font-weight: 800; margin-top: 4px;">Time: ${check_out_time}</div>
                </div>
            </div>
        </div>

        <div style="display: flex; flex-direction: column; gap: 24px;">
            <div class="stat-box" style="border: 2px solid #f4a01e; background: #fffbeb;">
                <div style="font-size: 13px; font-weight: 900; color: #f4a01e; text-transform: uppercase; margin-bottom: 8px;">Total Stay</div>
                <div style="font-size: 28px; font-weight: 900; color: #92400e;">${chargeabledays} <span style="font-size: 16px;">Nights</span></div>
            </div>
            <div class="stat-box" style="border: 2px solid #7e22ce; background: #f5f3ff;">
                <div style="font-size: 13px; font-weight: 900; color: #7e22ce; text-transform: uppercase; margin-bottom: 8px;">Guest Count</div>
                <div style="font-size: 28px; font-weight: 900; color: #581c87;">${formatOccupancy(occupancy)}</div>
            </div>
        </div>
    </div>

    <div class="section-box">
        <div class="section-header">
            <h2 style="margin: 0; font-size: 15px; font-weight: 800; color: #1e293b; text-transform: uppercase;">3. Guest Profile</h2>
        </div>
        <div class="section-content">
            <div>
                <label class="label">Guest Name</label>
                <div class="value">${guestname}</div>
            </div>
            <div>
                <label class="label">Contact Number</label>
                <div class="value">${contactnumberguest || 'N/A'}</div>
            </div>
            <div style="grid-column: span 2;">
                <label class="label">Guest Type / Client</label>
                <div class="value">${guesttype}</div>
            </div>
        </div>
    </div>

    <div class="section-box">
        <div class="section-header">
            <h2 style="margin: 0; font-size: 15px; font-weight: 800; color: #1e293b; text-transform: uppercase;">4. Package Includes</h2>
        </div>
        <div style="padding: 24px;">
            <div style="display: inline-block; background: #fffbeb; border: 1px solid #fef3c7; padding: 10px 20px; border-radius: 12px; font-size: 14px; font-weight: 800; color: #92400e; margin-right: 12px; margin-bottom: 12px;">
                <span style="color: #f4a01e;">✦</span> Accommodation
            </div>
            ${formatServices(services).split(',').filter(s => s.trim()).map(s => `
                <div style="display: inline-block; background: #fffbeb; border: 1px solid #fef3c7; padding: 10px 20px; border-radius: 12px; font-size: 14px; font-weight: 800; color: #92400e; margin-right: 12px; margin-bottom: 12px;">
                    <span style="color: #f4a01e;">✦</span> ${s.trim()}
                </div>
            `).join('')}
        </div>
    </div>

     <div class="billing-box" style="padding: 40px; border-radius: 24px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);">
        <div style="text-align: left; display: flex; flex-direction: column; gap: 15px;">
            <div style="background: rgba(255, 255, 255, 0.15); border: 2px solid rgba(255, 255, 255, 0.3); padding: 15px 30px; border-radius: 16px; display: table;">
                <span style="font-size: 16px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em;">Mode Of Payment: ${host_payment_mode}</span>
            </div>
            
        </div>
        <div style="text-align: right;">
            <p style="margin: 0; font-size: 14px; font-weight: 800; color: rgba(255,255,255,0.9); text-transform: uppercase; letter-spacing: 0.1em;">Host Payment Summary</p>
            <div style="margin-top: 12px; font-size: 16px; color: #ffffff; font-weight: 600; line-height: 1.6;">
                ${hostPaymentDetails}
            </div>
        </div>
    </div>

    <!-- Footer Links -->
    <div style="background-color: #f59e0b; padding: 20px; border-radius: 12px; text-align: center; margin-top: 40px;">
        <div style="margin-bottom: 10px;">
            <a href="https://www.pajasaapartments.com/in/mumbai/" style="font-size: 13px; color: white; margin: 0 8px; text-decoration: none; font-weight: 700;">Mumbai</a>
            <a href="https://www.pajasaapartments.com/in/pune/" style="font-size: 13px; color: white; margin: 0 8px; text-decoration: none; font-weight: 700;">Pune</a>
            <a href="https://www.pajasaapartments.com/in/bengaluru/" style="font-size: 13px; color: white; margin: 0 8px; text-decoration: none; font-weight: 700;">Bangalore</a>
            <a href="https://www.pajasaapartments.com/in/hyderabad/" style="font-size: 13px; color: white; margin: 0 8px; text-decoration: none; font-weight: 700;">Hyderabad</a>
        </div>
        <div>
            <a href="http://pajasaapartments.com/in/noida/" style="font-size: 13px; color: white; margin: 0 8px; text-decoration: none; font-weight: 700;">Noida</a>
            <a href="https://www.pajasaapartments.com/in/new-delhi/" style="font-size: 13px; color: white; margin: 0 8px; text-decoration: none; font-weight: 700;">Delhi</a>
            <a href="https://www.pajasaapartments.com/in/gurugram/" style="font-size: 13px; color: white; margin: 0 8px; text-decoration: none; font-weight: 700;">Gurgaon</a>
            <a href="https://www.pajasaapartments.com/in/chennai/" style="font-size: 13px; color: white; margin: 0 8px; text-decoration: none; font-weight: 700;">Chennai</a>
        </div>
    </div>

</body>
</html>
`;

const generateGuestEmailHtml = ({
    guestname,
    reservationNo,
    formatted,
    checkin,
    checkout,
    check_in_time,
    check_out_time,
    contactnumberguest,
    additionalGuestsHtml,
    chargeabledays,
    occupancy,
    address1,
    address2,
    address3,
    fetchedPropertyType,
    apartment_type,
    roomtype,
    services,
    modeofpayment,
    amount,
    base_rate,
    taxes,
    tariff_type,
    clientName,
    guestemail,
    originalBooking,
    modificationType,
    Title
}) => `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Booking Confirmation</title>
    <style>
        body { margin: 0; padding: 0; background-color: #ffffff; font-family: 'Inter', Arial, sans-serif; color: #0f172a; }
        .container { width: 100%; max-width: 700px; margin: 0 auto; background-color: #ffffff; }
        @media only screen and (max-width: 600px) {
            .container { width: 100% !important; }
            .grid-col { display: block !important; width: 100% !important; margin-bottom: 20px; }
            .stack-cell { display: block !important; width: 100% !important; text-align: left !important; padding: 10px 0 !important; }
            .mobile-hide { display: none !important; }
            .mobile-text-left { text-align: left !important; }
            .billing-content { padding: 25px !important; }
            .billing-title { font-size: 32px !important; }
        }
    </style>
</head>
<body style="margin: 0; padding: 0; background-color: #ffffff; font-family: 'Inter', Arial, sans-serif; color: #0f172a;">
    <div class="container" style="width: 100%; max-width: 700px; margin: 0 auto; background-color: #ffffff; padding: 20px;">
        <!-- Header -->
        <table width="100%" border="0" cellpadding="0" cellspacing="0" style="border-bottom: 3px solid #1e293b; padding-bottom: 28px; margin-bottom: 40px;">
            <tr>
                <td align="left" valign="bottom">
                    <div style="display: flex; align-items: center; gap: 16px;">
                        <div style="width: 44px; height: 44px; background: #f4a01e; border-radius: 10px; display: inline-block; text-align: center; line-height: 44px; color: white; font-weight: 900; font-size: 22px; vertical-align: middle;">PA</div>
                        <div style="display: inline-block; vertical-align: middle; margin-left: 10px;">
                            <h1 style="margin: 0; font-size: 28px; font-weight: 900; color: #f4a01e; letter-spacing: -0.02em; text-transform: uppercase;">GUEST ${Title}</h1>
                            <p style="margin: 4px 0 0 0; color: #334155; font-size: 14px; font-weight: 600;">Extended Stay Apartment</p>
                        </div>
                    </div>
                </td>
                <td align="right" valign="bottom">
                    <p style="margin: 0; font-size: 11px; font-weight: 800; color: #f4a01e; text-transform: uppercase; letter-spacing: 0.12em;">Reservation ID</p>
                    <p style="margin: 4px 0 0 0; font-size: 20px; font-weight: 900; color: #0f172a;">${reservationNo}</p>
                    <p style="margin: 8px 0 0 0; font-size: 12px; font-weight: 600; color: #475569;">Booked: ${formatted}</p>
                </td>
            </tr>
        </table>

        <!-- Welcome Message -->
        <div style="margin-bottom: 35px; padding: 25px; background: #f8fafc; border-radius: 16px; border-left: 6px solid #f4a01e;">
            <p style="margin: 0; font-size: 18px; color: #1e293b; line-height: 1.5; font-weight: 700;">
                Hi <span style="color: #f4a01e;">${guestname}</span>,
            </p>
            <p style="margin: 10px 0 0 0; font-size: 15px; color: #475569; line-height: 1.6;">
                PAJASA has successfully created a new booking at <strong>our property</strong>. We are excited to host you on <strong>${formatDateExact(checkin, false)}</strong>.
            </p>
        </div>

        <!-- Section 1: Guest Profile -->
        <div style="border: 2px solid #cbd5e1; border-radius: 16px; overflow: hidden; margin-bottom: 32px;">
            <div style="background: #f1f5f9; padding: 16px 24px; border-bottom: 2px solid #cbd5e1;">
                <h2 style="margin: 0; font-size: 14px; font-weight: 800; color: #1e293b; text-transform: uppercase; letter-spacing: 0.08em;">1. Guest Profile</h2>
            </div>
            <div style="padding: 24px;">
                <table width="100%" border="0" cellpadding="0" cellspacing="0">
                    <tr>
                        <td width="50%" valign="top" style="padding-bottom: 20px;">
                            <label style="display: block; font-size: 11px; font-weight: 800; color: #475569; text-transform: uppercase; margin-bottom: 6px;">Guest Name</label>
                            <div style="font-size: 16px; font-weight: 700; color: #0f172a;">${guestname}</div>
                        </td>
                        <td width="50%" valign="top" style="padding-bottom: 20px;">
                            <label style="display: block; font-size: 11px; font-weight: 800; color: #475569; text-transform: uppercase; margin-bottom: 6px;">Contact Number</label>
                            <div style="font-size: 16px; font-weight: 700; color: #0f172a;">${contactnumberguest || 'N/A'}</div>
                        </td>
                    </tr>
                    <tr>
                        <td width="50%" valign="top">
                            <label style="display: block; font-size: 11px; font-weight: 800; color: #475569; text-transform: uppercase; margin-bottom: 6px;">Company / Business Name</label>
                            <div style="font-size: 16px; font-weight: 700; color: #0f172a;">${clientName}</div>
                        </td>
                    </tr>
                </table>
            </div>
        </div>

        <!-- Section 2: Stay Schedule -->
        <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 32px;">
            <tr>
                <td width="65%" valign="top" style="padding-right: 20px;">
                    <div style="border: 2px solid #cbd5e1; border-radius: 16px; overflow: hidden; height: 100%;">
                        <div style="background: #f1f5f9; padding: 16px 24px; border-bottom: 2px solid #cbd5e1;">
                            <h2 style="margin: 0; font-size: 14px; font-weight: 800; color: #1e293b; text-transform: uppercase; letter-spacing: 0.08em;">2. Stay Schedule</h2>
                        </div>
                        <div style="padding: 24px;">
                            <div style="margin-bottom: 20px;">
                                <label style="display: block; font-size: 11px; font-weight: 800; color: #475569; text-transform: uppercase; margin-bottom: 4px;">Check-in Date & Time</label>
                                ${originalBooking && (modificationType === 'preponed' || modificationType === 'postponed') ? `
                                    <div style="font-size: 14px; color: #94a3b8; text-decoration: line-through; margin-bottom: 4px;">${formatDateExact(originalBooking.old_check_in_date, true)}</div>
                                    <div style="font-size: 16px; font-weight: 700; color: #b91c1c;">${formatDateExact(checkin, true)}</div>
                                ` : `
                                    <div style="font-size: 16px; font-weight: 700; color: #0f172a;">${formatDateExact(checkin, true)}</div>
                                `}
                                <div style="font-size: 13px; color: #f4a01e; font-weight: 700; margin-top: 4px;">Time: ${check_in_time}</div>
                            </div>
                            <div style="border-top: 2px dashed #e2e8f0; padding-top: 16px;">
                                <label style="display: block; font-size: 11px; font-weight: 800; color: #475569; text-transform: uppercase; margin-bottom: 4px;">Check-out Date & Time</label>
                                ${additionalGuestsHtml ? `
                                    <div style="font-size: 14px; color: #94a3b8; text-decoration: line-through; margin-bottom: 4px;">${formatDateExact(checkout, false)}</div>
                                    <div style="font-size: 16px; font-weight: 700; color: #b91c1c;">${additionalGuestsHtml}</div>
                                ` : originalBooking && (modificationType === 'extended' || modificationType === 'shortened') ? `
                                    <div style="font-size: 14px; color: #94a3b8; text-decoration: line-through; margin-bottom: 4px;">${formatDateExact(originalBooking.old_check_out_date, false)}</div>
                                    <div style="font-size: 16px; font-weight: 700; color: #b91c1c;">${formatDateExact(checkout, false)}</div>
                                ` : `
                                    <div style="font-size: 16px; font-weight: 700; color: #0f172a;">${formatDateExact(checkout, false)}</div>
                                `}
                                <div style="font-size: 13px; color: #475569; font-weight: 700; margin-top: 4px;">Time: ${check_out_time}</div>
                            </div>
                        </div>
                    </div>
                </td>
                <td width="35%" valign="top">
                    <div style="border: 2px solid #f4a01e; border-radius: 16px; padding: 20px; text-align: center; background: #fffbeb; margin-bottom: 16px;">
                        <div style="font-size: 11px; font-weight: 900; color: #f4a01e; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px;">Total Stay</div>
                        <div style="font-size: 24px; font-weight: 900; color: #92400e;">${chargeabledays} <span style="font-size: 14px; font-weight: 700;">Nights</span></div>
                    </div>
                    <div style="border: 2px solid #7e22ce; border-radius: 16px; padding: 20px; text-align: center; background: #f5f3ff;">
                        <div style="font-size: 11px; font-weight: 900; color: #7e22ce; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px;">Guest Count</div>
                        <div style="font-size: 24px; font-weight: 900; color: #581c87;">${formatOccupancy(occupancy)}</div>
                    </div>
                </td>
            </tr>
        </table>

        <!-- Section 3: Residence & Features -->
        <div style="border: 2px solid #cbd5e1; border-radius: 16px; overflow: hidden; margin-bottom: 32px;">
            <div style="background: #f1f5f9; padding: 16px 24px; border-bottom: 2px solid #cbd5e1;">
                <h2 style="margin: 0; font-size: 14px; font-weight: 800; color: #1e293b; text-transform: uppercase; letter-spacing: 0.08em;">3. Residence Information</h2>
            </div>
            <div style="padding: 24px;">
                <table width="100%" border="0" cellpadding="0" cellspacing="0">
                    <tr>
                        <td colspan="2" style="padding-bottom: 20px;">
                            <label style="display: block; font-size: 11px; font-weight: 800; color: #475569; text-transform: uppercase; margin-bottom: 6px;">Apartment Full Address</label>
                            <div style="font-size: 16px; font-weight: 700; color: #0f172a; line-height: 1.5;">${address1}, ${address2}, ${address3}</div>
                        </td>
                    </tr>
                    <tr>
                        <td width="50%">
                            <label style="display: block; font-size: 11px; font-weight: 800; color: #475569; text-transform: uppercase; margin-bottom: 6px;">Property Type</label>
                            <div style="font-size: 15px; font-weight: 700; color: #b91c1c;">${fetchedPropertyType || apartment_type}</div>
                        </td>
                        <td width="50%">
                            <label style="display: block; font-size: 11px; font-weight: 800; color: #475569; text-transform: uppercase; margin-bottom: 6px;">Room Selection</label>
                            <div style="font-size: 15px; font-weight: 700; color: #0f172a;">${roomtype}</div>
                        </td>
                    </tr>
                </table>
                <div style="margin-top: 24px; padding-top: 20px; border-top: 2px solid #f1f5f9;">
                    <label style="display: block; font-size: 11px; font-weight: 800; color: #475569; text-transform: uppercase; margin-bottom: 12px;">Package Includes</label>
                    <div style="font-size: 14px; font-weight: 700; color: #0f172a; line-height: 1.6;">
                        <span style="color: #f4a01e; margin-right: 8px;">✦</span> Accommodation<br>
                        ${formatServices(services).split(',').map(s => `<span style="color: #f4a01e; margin-right: 8px;">✦</span> ${s.trim()}`).join('<br>')}
                    </div>
                </div>
            </div>
        </div>

        <!-- Section 4: Billing -->
        <div style="background: #f59e0b; border-radius: 24px; padding: 40px; color: white; margin-bottom: 40px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);">
            <table width="100%" border="0" cellpadding="0" cellspacing="0">
                <tr>
                    <td align="left" valign="top" class="stack-cell">
                        <div style="display: inline-block; background: rgba(255, 255, 255, 0.2); color: white; padding: 10px 20px; border-radius: 12px; font-size: 13px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; border: 1px solid rgba(255, 255, 255, 0.4);">
                            Mode Of Payment: ${modeofpayment}
                        </div>
                        
                        <div style="margin-top: 16px; text-align: left;">
                             
                        </div>
                    </td>
                    <td align="right" valign="top" class="stack-cell mobile-text-left" style="padding-top: 20px;">
                        <p style="margin: 0; font-size: 12px; font-weight: 900; color: rgba(255,255,255,0.9); text-transform: uppercase; letter-spacing: 0.2em;">Billing Summary</p>
                        ${modeofpayment === "Bill to Company" ?
        `<h3 style="margin: 12px 0 0 0; font-size: 32px; font-weight: 900; color: #ffffff;">${tariff_type}</h3>` :
        `
                            <h3 style="margin: 12px 0 0 0; font-size: 44px; font-weight: 900; color: #ffffff; letter-spacing: -0.02em;">₹ ${(amount * chargeabledays).toLocaleString('en-IN')}</h3>
                            <div style="margin-top: 12px; font-size: 14px; color: rgba(255,255,255,0.8); font-weight: 600;">
                                Base: ₹ ${base_rate} • Tax: ${taxes}% (₹ ${(base_rate * taxes / 100).toFixed(2)}) • Per Night: ₹ ${amount}
                            </div>
                            `
    }
                    </td>
                </tr>
            </table>
        </div>

        <!-- Terms & Conditions -->
        <div style="padding: 25px; background: #f8fafc; border-radius: 16px; border: 1px solid #e2e8f0; margin-bottom: 40px;">
            <h3 style="margin: 0 0 15px 0; font-size: 13px; font-weight: 800; color: #1e293b; text-transform: uppercase; letter-spacing: 0.1em;">Terms & Conditions</h3>
            <div style="font-size: 12px; color: #475569; line-height: 1.8;">
                1. Check in & Check out Time 14:00 PM & 11:00 AM<br>
                2. Every guest will have to carry a print of the confirmation along with the company and government photo ID at the time of checking in.<br>
                3. Visitors are permitted in the apartment only between 10:00 AM and 7:00 PM and maximum of One visitor per day is allowed. Prior email approval from the company admin is required.<br>
                4. Cancellation Terms: Kindly visit <a href="https://www.pajasaapartments.com/terms-and-conditions/" style="color: #f4a01e; text-decoration: none; font-weight: 700;">pajasaapartments.com/terms-and-conditions</a>
            </div>
        </div>

        <!-- Footer Links -->
        <div style="background-color: #f59e0b; padding: 20px; border-radius: 12px; text-align: center;">
            <div style="margin-bottom: 10px;">
                <a href="https://www.pajasaapartments.com/in/mumbai/" style="font-size: 13px; color: white; margin: 0 8px; text-decoration: none; font-weight: 700;">Mumbai</a>
                <a href="https://www.pajasaapartments.com/in/pune/" style="font-size: 13px; color: white; margin: 0 8px; text-decoration: none; font-weight: 700;">Pune</a>
                <a href="https://www.pajasaapartments.com/in/bengaluru/" style="font-size: 13px; color: white; margin: 0 8px; text-decoration: none; font-weight: 700;">Bangalore</a>
                <a href="https://www.pajasaapartments.com/in/hyderabad/" style="font-size: 13px; color: white; margin: 0 8px; text-decoration: none; font-weight: 700;">Hyderabad</a>
            </div>
            <div>
                <a href="http://pajasaapartments.com/in/noida/" style="font-size: 13px; color: white; margin: 0 8px; text-decoration: none; font-weight: 700;">Noida</a>
                <a href="https://www.pajasaapartments.com/in/new-delhi/" style="font-size: 13px; color: white; margin: 0 8px; text-decoration: none; font-weight: 700;">Delhi</a>
                <a href="https://www.pajasaapartments.com/in/gurugram/" style="font-size: 13px; color: white; margin: 0 8px; text-decoration: none; font-weight: 700;">Gurgaon</a>
                <a href="https://www.pajasaapartments.com/in/chennai/" style="font-size: 13px; color: white; margin: 0 8px; text-decoration: none; font-weight: 700;">Chennai</a>
            </div>
        </div>

       
    </div>
</body>
</html>`;

const generateApartmentEmailHtml = ({
    reservationNo,
    hostName,
    Title,
    address1,
    address2,
    address3,
    contactperson,
    contactnumber,
    guestname,
    contactnumberguest,
    guesttype,
    originalBooking,
    modificationType,
    checkin,
    checkout,
    chargeabledays,
    fetchedPropertyType,
    apartment_type,
    roomtype,
    occupancy,
    host_payment_mode,
    hostPaymentDetails,
    services
}) => `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Booking Confirmation</title>
    <style>
        body { margin: 0; padding: 0; background-color: #ffffff; font-family: 'Inter', Arial, sans-serif; color: #0f172a; }
        .container { width: 100%; max-width: 700px; margin: 0 auto; background-color: #ffffff; }
        @media only screen and (max-width: 600px) {
            .container { width: 100% !important; }
            .grid-col { display: block !important; width: 100% !important; margin-bottom: 20px; }
            .stack-cell { display: block !important; width: 100% !important; text-align: left !important; padding: 10px 0 !important; }
            .mobile-hide { display: none !important; }
            .mobile-text-left { text-align: left !important; }
            .billing-content { padding: 25px !important; }
            .billing-title { font-size: 32px !important; }
        }
    </style>
</head>
<body style="margin: 0; padding: 0; background-color: #ffffff; font-family: 'Inter', Arial, sans-serif; color: #0f172a;">
    <div class="container" style="width: 100%; max-width: 700px; margin: 0 auto; background-color: #ffffff; padding: 20px;">
        <!-- Header -->
        <table width="100%" border="0" cellpadding="0" cellspacing="0" style="border-bottom: 3px solid #1e293b; padding-bottom: 28px; margin-bottom: 40px;">
            <tr>
                <td align="left" valign="bottom">
                    <div style="display: flex; align-items: center; gap: 16px;">
                        <div style="width: 44px; height: 44px; background: #f4a01e; border-radius: 10px; display: inline-block; text-align: center; line-height: 44px; color: white; font-weight: 900; font-size: 22px; vertical-align: middle;">PA</div>
                        <div style="display: inline-block; vertical-align: middle; margin-left: 10px;">
                            <h1 style="margin: 0; font-size: 28px; font-weight: 900; color: #f4a01e; letter-spacing: -0.02em; text-transform: uppercase;">APARTMENT ${Title}</h1>
                            <p style="margin: 4px 0 0 0; color: #334155; font-size: 14px; font-weight: 600;">Extended Stay Apartment</p>
                        </div>
                    </div>
                </td>
                <td align="right" valign="bottom">
                    <p style="margin: 0; font-size: 11px; font-weight: 800; color: #f4a01e; text-transform: uppercase; letter-spacing: 0.12em;">Reservation ID</p>
                    <p style="margin: 4px 0 0 0; font-size: 20px; font-weight: 900; color: #0f172a;">${reservationNo}</p>
                </td>
            </tr>
        </table>

        <!-- Welcome Message -->
        <div style="margin-bottom: 35px; padding: 25px; background: #f8fafc; border-radius: 16px; border-left: 6px solid #f4a01e;">
            <p style="margin: 0; font-size: 18px; color: #1e293b; line-height: 1.5; font-weight: 700;">
                Hi <span style="color: #f4a01e;">${hostName}</span>,
            </p>
            <p style="margin: 10px 0 0 0; font-size: 15px; color: #475569; line-height: 1.6;">
                PAJASA has successfully updated a booking at your property. ${Title}. We are happy to confirm the booking with the following details.
            </p>
        </div>

        <!-- Section 1: Host & Property Profile -->
        <div style="border: 2px solid #cbd5e1; border-radius: 16px; overflow: hidden; margin-bottom: 32px;">
            <div style="background: #f1f5f9; padding: 16px 24px; border-bottom: 2px solid #cbd5e1;">
                <h2 style="margin: 0; font-size: 14px; font-weight: 800; color: #1e293b; text-transform: uppercase; letter-spacing: 0.08em;">1. Host & Property Profile</h2>
            </div>
            <div style="padding: 24px;">
                <table width="100%" border="0" cellpadding="0" cellspacing="0">
                    <tr>
                        <td width="50%" valign="top" style="padding-bottom: 20px;">
                            <label style="display: block; font-size: 11px; font-weight: 800; color: #475569; text-transform: uppercase; margin-bottom: 6px;">Host Name</label>
                            <div style="font-size: 16px; font-weight: 700; color: #0f172a;">${hostName}</div>
                        </td>
                        <td width="50%" valign="top" style="padding-bottom: 20px;">
                            <label style="display: block; font-size: 11px; font-weight: 800; color: #475569; text-transform: uppercase; margin-bottom: 6px;">Contact Person</label>
                            <div style="font-size: 16px; font-weight: 700; color: #0f172a;">${contactperson}</div>
                        </td>
                    </tr>
                    <tr>
                        <td width="50%" valign="top">
                            <label style="display: block; font-size: 11px; font-weight: 800; color: #475569; text-transform: uppercase; margin-bottom: 6px;">Contact Number</label>
                            <div style="font-size: 16px; font-weight: 700; color: #f4a01e;">${contactnumber}</div>
                        </td>
                        <td width="50%" valign="top">
                            <label style="display: block; font-size: 11px; font-weight: 800; color: #475569; text-transform: uppercase; margin-bottom: 6px;">Apartment Address</label>
                            <div style="font-size: 14px; font-weight: 700; color: #0f172a;">${address1}, ${address2}</div>
                        </td>
                    </tr>
                </table>
            </div>
        </div>

        <!-- Section 2: Stay Schedule -->
        <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 32px;">
            <tr>
                <td width="65%" valign="top" style="padding-right: 20px;">
                    <div style="border: 2px solid #cbd5e1; border-radius: 16px; overflow: hidden; height: 100%;">
                        <div style="background: #f1f5f9; padding: 16px 24px; border-bottom: 2px solid #cbd5e1;">
                            <h2 style="margin: 0; font-size: 14px; font-weight: 800; color: #1e293b; text-transform: uppercase; letter-spacing: 0.08em;">2. Stay Schedule</h2>
                        </div>
                        <div style="padding: 24px;">
                            <div style="margin-bottom: 20px;">
                                <label style="display: block; font-size: 11px; font-weight: 800; color: #475569; text-transform: uppercase; margin-bottom: 4px;">Check-in Date & Time</label>
                                ${originalBooking && (modificationType === 'preponed' || modificationType === 'postponed') ? `
                                    <div style="font-size: 14px; color: #94a3b8; text-decoration: line-through; margin-bottom: 4px;">${formatDateExact(originalBooking.old_check_in_date, true)}</div>
                                    <div style="font-size: 16px; font-weight: 700; color: #b91c1c;">${formatDateExact(checkin, true)}</div>
                                ` : `
                                    <div style="font-size: 16px; font-weight: 700; color: #0f172a;">${formatDateExact(checkin, true)}</div>
                                `}
                            </div>
                            <div style="border-top: 2px dashed #e2e8f0; padding-top: 16px;">
                                <label style="display: block; font-size: 11px; font-weight: 800; color: #475569; text-transform: uppercase; margin-bottom: 4px;">Check-out Date & Time</label>
                                ${originalBooking && (modificationType === 'extended' || modificationType === 'shortened') ? `
                                    <div style="font-size: 14px; color: #94a3b8; text-decoration: line-through; margin-bottom: 4px;">${formatDateExact(originalBooking.old_check_out_date, false)}</div>
                                    <div style="font-size: 16px; font-weight: 700; color: #b91c1c;">${formatDateExact(checkout, false)}</div>
                                ` : `
                                    <div style="font-size: 16px; font-weight: 700; color: #0f172a;">${formatDateExact(checkout, false)}</div>
                                `}
                            </div>
                        </div>
                    </div>
                </td>
                <td width="35%" valign="top">
                    <div style="border: 2px solid #f4a01e; border-radius: 16px; padding: 20px; text-align: center; background: #fffbeb; margin-bottom: 16px;">
                        <div style="font-size: 11px; font-weight: 900; color: #f4a01e; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px;">Total Stay</div>
                        <div style="font-size: 24px; font-weight: 900; color: #92400e;">${chargeabledays} <span style="font-size: 14px; font-weight: 700;">Nights</span></div>
                    </div>
                    <div style="border: 2px solid #7e22ce; border-radius: 16px; padding: 20px; text-align: center; background: #f5f3ff;">
                        <div style="font-size: 11px; font-weight: 900; color: #7e22ce; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px;">Guest Count</div>
                        <div style="font-size: 24px; font-weight: 900; color: #581c87;">${formatOccupancy(occupancy)}</div>
                    </div>
                </td>
            </tr>
        </table>

        <!-- Section 3: Booking Details -->
        <div style="border: 2px solid #cbd5e1; border-radius: 16px; overflow: hidden; margin-bottom: 32px;">
            <div style="background: #f1f5f9; padding: 16px 24px; border-bottom: 2px solid #cbd5e1;">
                <h2 style="margin: 0; font-size: 14px; font-weight: 800; color: #1e293b; text-transform: uppercase; letter-spacing: 0.08em;">3. Guest & Residence Information</h2>
            </div>
            <div style="padding: 24px;">
                <table width="100%" border="0" cellpadding="0" cellspacing="0">
                    <tr>
                        <td width="50%" valign="top" style="padding-bottom: 20px;">
                            <label style="display: block; font-size: 11px; font-weight: 800; color: #475569; text-transform: uppercase; margin-bottom: 6px;">Guest Name</label>
                            <div style="font-size: 16px; font-weight: 700; color: #0f172a;">${guestname}</div>
                        </td>
                        <td width="50%" valign="top" style="padding-bottom: 20px;">
                            <label style="display: block; font-size: 11px; font-weight: 800; color: #475569; text-transform: uppercase; margin-bottom: 6px;">Guest Contact</label>
                            <div style="font-size: 16px; font-weight: 700; color: #0f172a;">${contactnumberguest || 'N/A'}</div>
                        </td>
                    </tr>
                    <tr>
                        <td width="50%" valign="top">
                            <label style="display: block; font-size: 11px; font-weight: 800; color: #475569; text-transform: uppercase; margin-bottom: 6px;">Guest Type</label>
                            <div style="font-size: 15px; font-weight: 700; color: #0f172a;">${guesttype}</div>
                        </td>
                        <td width="50%" valign="top">
                            <label style="display: block; font-size: 11px; font-weight: 800; color: #475569; text-transform: uppercase; margin-bottom: 6px;">Room Selection / Property Type</label>
                            <div style="font-size: 15px; font-weight: 700; color: #b91c1c;">${(fetchedPropertyType || apartment_type) === '1 BHK' ? 'Enter Apartment' : roomtype} / ${fetchedPropertyType || apartment_type}</div>
                        </td>
                    </tr>
                </table>
                <div style="margin-top: 24px; padding-top: 20px; border-top: 2px solid #f1f5f9;">
                    <label style="display: block; font-size: 11px; font-weight: 800; color: #475569; text-transform: uppercase; margin-bottom: 12px;">Package Includes</label>
                    <div style="font-size: 14px; font-weight: 700; color: #0f172a; line-height: 1.6;">
                        <span style="color: #f4a01e; margin-right: 8px;">✦</span> Accommodation<br>
                        ${formatServices(services).split(',').map(s => `<span style="color: #f4a01e; margin-right: 8px;">✦</span> ${s.trim()}`).join('<br>')}
                    </div>
                </div>
            </div>
        </div>

        <!-- Section 4: Billing -->
        <div style="background: #f59e0b; border-radius: 24px; padding: 40px; color: white; margin-bottom: 40px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);">
            <table width="100%" border="0" cellpadding="0" cellspacing="0">
                <tr>
                    <td align="left" valign="top" class="stack-cell">
                        <div style="display: inline-block; background: rgba(255, 255, 255, 0.2); color: white; padding: 10px 20px; border-radius: 12px; font-size: 13px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; border: 1px solid rgba(255, 255, 255, 0.4);">
                            Mode Of Payment: ${host_payment_mode}
                        </div>
                       
                        <div style="margin-top: 16px; text-align: left;">
                             
                        </div>
                    </td>
                    <td align="right" valign="top" class="stack-cell mobile-text-left" style="padding-top: 20px;">
                        <p style="margin: 0; font-size: 12px; font-weight: 900; color: rgba(255,255,255,0.9); text-transform: uppercase; letter-spacing: 0.2em;">Billing Summary</p>
                        <div style="margin-top: 12px; font-size: 15px; color: #ffffff; font-weight: 600; line-height: 1.6;">
                            ${hostPaymentDetails}
                        </div>
                    </td>
                </tr>
            </table>
        </div>

        <!-- Terms & Conditions -->
        <div style="padding: 25px; background: #f8fafc; border-radius: 16px; border: 1px solid #e2e8f0; margin-bottom: 40px;">
            <h3 style="margin: 0 0 15px 0; font-size: 13px; font-weight: 800; color: #1e293b; text-transform: uppercase; letter-spacing: 0.1em;">Terms & Conditions</h3>
            <div style="font-size: 12px; color: #475569; line-height: 1.8;">
                1. Check in & Check out Time 14:00 PM & 11:00 AM<br>
                2. Every guest will have to carry a print of the confirmation along with government photo ID at the time of checking in.<br>
                3. Visitors are permitted in the apartment only between 10:00 AM and 7:00 PM and maximum of One visitor per day is authorized.<br>
                4. Cancellation Terms: Kindly visit <a href="https://www.pajasaapartments.com/terms-and-conditions/" style="color: #f4a01e; text-decoration: none; font-weight: 700;">pajasaapartments.com/terms-and-conditions</a>
            </div>
        </div>

        <!-- Footer Links -->
        <div style="background-color: #f4a01e; padding: 20px; border-radius: 12px; text-align: center;">
            <div style="margin-bottom: 10px;">
                <a href="https://www.pajasaapartments.com/in/mumbai/" style="font-size: 13px; color: white; margin: 0 8px; text-decoration: none; font-weight: 700;">Mumbai</a>
                <a href="https://www.pajasaapartments.com/in/pune/" style="font-size: 13px; color: white; margin: 0 8px; text-decoration: none; font-weight: 700;">Pune</a>
                <a href="https://www.pajasaapartments.com/in/bengaluru/" style="font-size: 13px; color: white; margin: 0 8px; text-decoration: none; font-weight: 700;">Bangalore</a>
                <a href="https://www.pajasaapartments.com/in/hyderabad/" style="font-size: 13px; color: white; margin: 0 8px; text-decoration: none; font-weight: 700;">Hyderabad</a>
            </div>
            <div>
                <a href="http://pajasaapartments.com/in/noida/" style="font-size: 13px; color: white; margin: 0 8px; text-decoration: none; font-weight: 700;">Noida</a>
                <a href="https://www.pajasaapartments.com/in/new-delhi/" style="font-size: 13px; color: white; margin: 0 8px; text-decoration: none; font-weight: 700;">Delhi</a>
                <a href="https://www.pajasaapartments.com/in/gurugram/" style="font-size: 13px; color: white; margin: 0 8px; text-decoration: none; font-weight: 700;">Gurgaon</a>
                <a href="https://www.pajasaapartments.com/in/chennai/" style="font-size: 13px; color: white; margin: 0 8px; text-decoration: none; font-weight: 700;">Chennai</a>
            </div>
        </div>

        
    </div>
</body>
</html>`;

export async function sendEmail(req, res) {
    try {
        const {
            guestemail,
            apartmentname,
            contactperson,
            contactnumber,
            guestname,
            host_base_rate,
            host_taxes,
            host_total_amount,
            contactnumberguest,
            checkin,
            checkout,
            check_in_time,
            check_out_time,
            chargeabledays,
            amount,
            modeofpayment,
            guesttype,
            roomtype,
            inclusions,
            reservationNo,
            apartment_type,
            created_at,
            host_email,
            clientName,
            address1,
            address2,
            address3,
            occupancy,
            base_rate,
            tariff_type,
            taxes,
            host_payment_mode,
            services,
            additionalGuests,
            status,
            attachments,
            modification_tags,
            roomSelection
        } = req.body;

        // ✅ FETCH HOST NAME FROM DB
        let fetchedHostName = null;
        try {
            const hostQuery = `
                SELECT rai.host_name 
                FROM reservation_additional_info rai
                JOIN reservations r ON rai.reservation_id = r.id
                WHERE r.reservation_no = $1
            `;
            const hostResult = await pool.query(hostQuery, [reservationNo]);
            if (hostResult.rows.length > 0) {
                fetchedHostName = hostResult.rows[0].host_name;
            }
        } catch (err) {
            console.error('Error fetching host_name:', err);
        }

        // ✅ FETCH PROPERTY TYPE FROM DB
        let fetchedPropertyType = null;
        try {
            const propertyQuery = `
                SELECT p.property_type 
                FROM properties p
                JOIN reservations r ON p.property_id = r.property_id
                WHERE r.reservation_no = $1
            `;
            const propertyResult = await pool.query(propertyQuery, [reservationNo]);
            if (propertyResult.rows.length > 0) {
                fetchedPropertyType = propertyResult.rows[0].property_type;
            }
        } catch (err) {
            console.error('Error fetching property_type:', err);
        }

        // ✅ FETCH ROOM SELECTION FROM DB IF MISSING
        let finalRoomSelection = roomSelection;
        if (!finalRoomSelection || (Array.isArray(finalRoomSelection) && finalRoomSelection.length === 0)) {
            try {
                const roomQuery = `
                    SELECT JSON_AGG(JSON_BUILD_OBJECT('roomType', rb.room_type, 'occupancy', rb.occupancy)) as "roomSelection"
                    FROM room_bookings rb
                    JOIN reservations r ON rb.reservation_id = r.id
                    WHERE r.reservation_no = $1
                `;
                const roomResult = await pool.query(roomQuery, [reservationNo]);
                if (roomResult.rows.length > 0 && roomResult.rows[0].roomSelection) {
                    finalRoomSelection = roomResult.rows[0].roomSelection;
                }
            } catch (err) {
                console.error('Error fetching roomSelection:', err);
            }
        }

        const formattedRoomType = formatRoomSelection(finalRoomSelection, roomtype, fetchedPropertyType || apartment_type);

        // ✅ Fetch LAST updated version from history (most recent before current)
        let originalBooking = null;
        try {
            const historyQuery = `
                SELECT 
                    check_in_date as old_check_in_date, 
                    check_out_date as old_check_out_date,
                    snapshot_data->>'check_in_time' as old_check_in_time,
                    snapshot_data->>'check_out_time' as old_check_out_time,
                    changed_at
                FROM booking_history
                WHERE reservation_id = (SELECT id FROM reservations WHERE reservation_no = $1)
                ORDER BY changed_at DESC  -- ✅ Get LAST updated version (most recent)
                LIMIT 1
            `;
            const historyResult = await pool.query(historyQuery, [reservationNo]);
            if (historyResult.rows.length > 0) {
                originalBooking = historyResult.rows[0];
                console.log('📜 Found LAST updated booking from history:', originalBooking);
                console.log('   Changed at:', originalBooking.changed_at);
            } else {
                console.log('⚠️ No booking history found for reservation:', reservationNo);
            }
        } catch (histError) {
            console.log('⚠️ Error fetching booking history:', histError.message);
        }

        // Convert guestemail -> array

        const additionalGuestsDate = additionalGuests?.length ? additionalGuests.map(g => new Date(g.cod)) : []
        let Preponed = false

        if (additionalGuestsDate.length > 0) {
            const checkoutDate = new Date(checkout)
            Preponed = additionalGuestsDate.some(date => date < checkoutDate)
        }



        // ✅ Determine modification type based on originalBooking
        let modificationType = null;
        let Title = 'Booking Confirmed';
        let subject = `Guest Booking Confirmation (${reservationNo})`;

        console.log('🔍 DEBUG - Email Title Logic:');
        console.log('  - originalBooking:', originalBooking ? 'EXISTS' : 'NULL');
        console.log('  - modification_tags:', modification_tags);
        console.log('  - status:', status);
        console.log('  - checkin:', checkin);
        console.log('  - checkin:', checkin);
        console.log('  - checkout:', checkout);

        // ✅ Handle Cancellation Email Explicitly
        if (status === 'Cancelled') {
            const cancellationResult = await sendCancellationEmail({
                guest_email: guestemail,
                guest_name: guestname,
                reservation_no: reservationNo,
                check_in_date: checkin,
                check_out_date: checkout,
                created_at: created_at,
                contact_number: contactnumber
            });

            // If sendCancellationEmail handles the response (it currently doesn't, so we send it here)
            // But checking sendCancellationEmail, it acts as a helper.
            // Let's assume we return JSON here.
            return res.json({
                success: true,
                message: "Cancellation email sent",
                data: cancellationResult
            });
        }

        if (originalBooking) {
            const oldCheckIn = new Date(originalBooking.old_check_in_date);
            const oldCheckOut = new Date(originalBooking.old_check_out_date);
            const newCheckIn = new Date(checkin);
            const newCheckOut = new Date(checkout);

            console.log('  - Old Check-In:', oldCheckIn.toISOString());
            console.log('  - New Check-In:', newCheckIn.toISOString());
            console.log('  - Old Check-Out:', oldCheckOut.toISOString());
            console.log('  - New Check-Out:', newCheckOut.toISOString());

            const checkInChanged = oldCheckIn.getTime() !== newCheckIn.getTime();
            const checkOutChanged = oldCheckOut.getTime() !== newCheckOut.getTime();

            console.log('  - Check-In Changed:', checkInChanged);
            console.log('  - Check-Out Changed:', checkOutChanged);

            if (checkInChanged && newCheckIn < oldCheckIn) {
                modificationType = 'preponed';
                Title = 'Booking Preponed';
                subject = `Guest Booking Preponed (${reservationNo})`;
            } else if (checkInChanged && newCheckIn > oldCheckIn) {
                modificationType = 'postponed';
                Title = 'Booking Postponed';
                subject = `Guest Booking Postponed (${reservationNo})`;
            } else if (checkOutChanged && newCheckOut > oldCheckOut) {
                modificationType = 'extended';
                Title = 'Booking Extended';
                subject = `Guest Booking Extension Confirmation (${reservationNo})`;
            } else if (checkOutChanged && newCheckOut < oldCheckOut) {
                modificationType = 'shortened';
                Title = 'Booking Shortened';
                subject = `Guest Booking Shortened (${reservationNo})`;
            } else if (checkInChanged || checkOutChanged) {
                modificationType = 'modified';
                Title = 'Booking Modified';
                subject = `Guest Booking Modified (${reservationNo})`;
            }
        } else if (modification_tags) {
            // ✅ Fallback: Use modification_tags if no booking history
            const tags = modification_tags.toLowerCase();
            console.log('📋 Using modification_tags fallback:', modification_tags);

            if (tags.includes('extended')) {
                modificationType = 'extended';
                Title = 'Booking Extended';
                subject = `Guest Booking Extension Confirmation (${reservationNo})`;
            } else if (tags.includes('shortened')) {
                modificationType = 'shortened';
                Title = 'Booking Shortened';
                subject = `Guest Booking Shortened (${reservationNo})`;
            } else if (tags.includes('preponed')) {
                modificationType = 'preponed';
                Title = 'Booking Preponed';
                subject = `Guest Booking Preponed (${reservationNo})`;
            } else if (tags.includes('postponed')) {
                modificationType = 'postponed';
                Title = 'Booking Postponed';
                subject = `Guest Booking Postponed (${reservationNo})`;
            }
        }

        console.log('✅ FINAL RESULT:');
        console.log('  - modificationType:', modificationType);
        console.log('  - Title:', Title);
        console.log('  - Subject:', subject);

        const isExtended = modificationType === 'extended' || (status === 'Extended' || status === 'extended') || (additionalGuests?.length > 0 && !Preponed);

        const emailList = guestemail
            .split(",")
            .map(e => e.trim())
            .filter(e => e);

        const taxAmount = (base_rate * taxes) / 100;

        const date = new Date(created_at)
        const formatted = date.toISOString().split("T")[0]



        const paymentDetails = modeofpayment === "Bill to Company"
            ? `${tariff_type}`
            : `
                                <div>Base Rate: Rs ${base_rate}</div>
                                <div>Tax (${taxes}%): Rs ${taxAmount}</div>
                                <div>
                                    <strong style="color: black;">
                                    Chargeable Amount (Per Night): Rs ${amount}
                                    </strong>
                                </div>
                                <div>
                                    <strong style="color: red;">
                                    Amount to Pay: Rs ${amount * chargeabledays}
                                    </strong>
                                </div>
                                `;


        const additionalGuestsHtml =
            additionalGuests?.length
                ? additionalGuests.map(g => formatDateExact(g.cod, false)).join("<br>")
                : "";

        const guestHtml = generateGuestEmailHtml({
            guestname,
            reservationNo,
            formatted,
            checkin,
            checkout,
            check_in_time,
            check_out_time,
            contactnumberguest,
            additionalGuestsHtml,
            chargeabledays,
            occupancy,
            address1,
            address2,
            address3,
            fetchedPropertyType,
            apartment_type,
            roomtype: formattedRoomType,
            services,
            modeofpayment,
            amount,
            base_rate,
            taxes,
            tariff_type,
            clientName,
            guestemail,
            originalBooking,
            modificationType,
            Title
        });



        // -----------------------------
        // 1️⃣ SEND EMAIL TO APARTMENT
        // -----------------------------
        const aptResult = await sendEmailtoApartment(
            subject,
            apartmentname,
            contactperson,
            contactnumber,
            guestname,
            contactnumberguest,
            checkin,
            checkout,
            chargeabledays,
            amount,
            modeofpayment,
            guesttype,
            apartment_type,
            formattedRoomType,
            inclusions,
            reservationNo,
            formatted,
            host_email,
            address1,
            address2,
            address3,
            occupancy,
            services,
            additionalGuests,
            host_payment_mode,
            Title,
            Preponed,
            originalBooking,
            check_in_time,
            check_out_time,
            modificationType,
            host_base_rate,
            host_taxes,
            host_total_amount,
            fetchedHostName,
            fetchedPropertyType
        );

        if (aptResult.error) {
            console.log("Apartment email error:", aptResult.error);
        }

        // -----------------------------
        // -----------------------------
        const guestPdfHtml = generateGuestPdfHtml({
            guestname,
            reservationNo,
            formatted,
            checkin,
            checkout,
            check_in_time,
            check_out_time,
            contactnumberguest,
            additionalGuestsHtml,
            chargeabledays,
            occupancy,
            address1,
            address2,
            address3,
            fetchedPropertyType,
            apartment_type,
            roomtype: formattedRoomType,
            services,
            modeofpayment,
            amount,
            base_rate,
            taxes,
            tariff_type,
            clientName,
            guestemail,
            originalBooking,
            modificationType,
            Title
        });

        const guestPdfBuffer = await generatePdfBuffer(guestPdfHtml);
        console.log(`✅ Guest PDF generated. Size: ${guestPdfBuffer.length} bytes`);

        // Fetch creator and parent admin for CC
        let ccEmails = [];
        try {
            const hierarchyResult = await pool.query(`
                SELECT u.email as creator_email, p.email as parent_email 
                FROM users u
                LEFT JOIN users p ON u.parent_admin_id = p.id
                WHERE u.id = (SELECT created_by FROM reservations WHERE reservation_no = $1)
            `, [reservationNo]);

            if (hierarchyResult.rows.length > 0) {
                const { creator_email, parent_email } = hierarchyResult.rows[0];
                if (creator_email) ccEmails.push(creator_email);
                if (parent_email) ccEmails.push(parent_email);
            }
        } catch (hierarchyErr) {
            console.error("Error fetching hierarchy for CC:", hierarchyErr);
        }

        const guestResult = await resend.emails.send({
            from: "booking@pajasaapartments.com",
            // to: emailList,
            to: ["harshitshukla6388@gmail.com"],
            cc: ccEmails.length > 0 ? ccEmails : undefined,
            subject,
            html: guestHtml,
            attachments: [
                {
                    filename: `Guest_Booking_${reservationNo}.pdf`,
                    content: Buffer.from(guestPdfBuffer),
                },
            ],
        });

        console.log("Resend Guest Email Result:", JSON.stringify(guestResult, null, 2));

        if (guestResult.error) {
            console.error("Resend Guest Email Error:", guestResult.error);
            return res.status(400).json({ error: guestResult.error });
        }

        // -----------------------------
        // 3️⃣ SUCCESS RESPONSE
        // -----------------------------

        // ✅ Update Email Status in DB
        await pool.query(
            "UPDATE reservations SET email_status = 'Sent' WHERE reservation_no = $1",
            [reservationNo]
        );

        res.json({
            success: true,
            apartmentEmail: aptResult.data,
            guestEmail: guestResult.data,
        });

    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
}

async function sendEmailtoApartment(
    subject,
    apartmentname,
    contactperson,
    contactnumber,
    guestname,
    contactnumberguest,
    checkin,
    checkout,
    chargeabledays,
    amount,
    modeofpayment,
    guesttype,
    apartment_type,
    roomtype,
    inclusions,
    reservationNo,
    formatted,
    host_email,
    address1,
    address2,
    address3,
    occupancy,
    services,
    additionalGuests,
    host_payment_mode,
    Title,
    Preponed,
    originalBooking,
    check_in_time,
    check_out_time,
    modificationType,
    host_base_rate,
    host_taxes,
    host_total_amount,
    fetchedHostName,
    fetchedPropertyType
) {
    const hostTaxAmount = (host_base_rate * host_taxes) / 100;
    const hostName = fetchedHostName || "";
    const hostPaymentDetails = host_payment_mode === "Bill to Pajasa"
        ? `${apartment_type}`
        : `
                                <div>Base Rate: Rs ${host_base_rate}</div>
                                <div>Tax (${host_taxes}%): Rs ${hostTaxAmount}</div>
                                <div>
                                    <strong style="color: black;">
                                    Chargeable Amount (Per Night): Rs ${host_total_amount}
                                    </strong>
                                </div>
                                <div>
                                    <strong style="color: red;">
                                    Amount to Pay: Rs ${host_total_amount * chargeabledays}
                                    </strong>
                                </div>
                                `;
    const additionalGuestsHtml =
        additionalGuests?.length
            ? additionalGuests.map(g => formatDateExact(g.cod, false)).join("<br>")
            : "";
    let subject2 = `Apartments Booking Confirmation (${reservationNo})`;

    if (Preponed) {
        subject2 = `Apartments Booking Check out Preponed (${reservationNo})`;
    } else if (Title.includes("Extended")) {
        subject2 = `Apartments Booking Extension Confirmation (${reservationNo})`;
    } else if (Title.includes("Preponed")) {
        subject2 = `Apartments Booking Preponed (${reservationNo})`;
    } else if (Title.includes("Postponed")) {
        subject2 = `Apartments Booking Postponed (${reservationNo})`;
    } else if (Title.includes("Shortened")) {
        subject2 = `Apartments Booking Shortened (${reservationNo})`;
    } else if (Title.includes("Modified")) {
        subject2 = `Apartments Booking Modified (${reservationNo})`;
    }
    const html = generateApartmentEmailHtml({
        reservationNo,
        hostName,
        Title,
        address1,
        address2,
        address3,
        contactperson,
        contactnumber,
        guestname,
        contactnumberguest,
        guesttype,
        originalBooking,
        modificationType,
        checkin,
        checkout,
        chargeabledays,
        roomtype: (fetchedPropertyType === '1 BHK' ? 'Entire Apartment' : roomtype),
        occupancy,
        host_payment_mode,
        hostPaymentDetails,
        services
    });

    const pdfHtml = generateApartmentPdfHtml({
        reservationNo,
        hostName,
        Title,
        address1,
        address2,
        address3,
        contactperson,
        contactnumber,
        guestname,
        contactnumberguest,
        guesttype,
        originalBooking,
        modificationType,
        checkin,
        checkout,
        chargeabledays,
        roomtype: (fetchedPropertyType === '1 BHK' ? 'Entire Apartment' : roomtype),
        occupancy,
        host_payment_mode,
        hostPaymentDetails,
        services,
        check_in_time,
        check_out_time
    });

    try {
        const aptPdfBuffer = await generatePdfBuffer(pdfHtml);
        console.log(`✅ Apartment PDF generated. Size: ${aptPdfBuffer.length} bytes`);

        // Fetch creator and parent admin for CC
        let ccEmails = [];
        try {
            const hierarchyResult = await pool.query(`
                SELECT u.email as creator_email, p.email as parent_email 
                FROM users u
                LEFT JOIN users p ON u.parent_admin_id = p.id
                WHERE u.id = (SELECT created_by FROM reservations WHERE reservation_no = $1)
            `, [reservationNo]);

            if (hierarchyResult.rows.length > 0) {
                const { creator_email, parent_email } = hierarchyResult.rows[0];
                if (creator_email) ccEmails.push(creator_email);
                if (parent_email) ccEmails.push(parent_email);
            }
        } catch (hierarchyErr) {
            console.error("Error fetching hierarchy for CC:", hierarchyErr);
        }

        const aptResult = await resend.emails.send({
            from: "booking@pajasaapartments.com",
            // to: [host_email, "accounts@pajasaapartments.com", "ps@pajasaapartments.com"],
            to: "harshitshukla6388@gmail.com",
            cc: ccEmails.length > 0 ? ccEmails : undefined,
            subject: subject2,
            html,
            // attachments: [
            //     {
            //         filename: `Apartment_Booking_${reservationNo}.pdf`,
            //         content: Buffer.from(aptPdfBuffer),
            //     },
            // ],
        });

        console.log("Resend Apartment Email Result:", JSON.stringify(aptResult, null, 2));

        if (aptResult.error) {
            console.error("Resend API Error (Apartment):", JSON.stringify(aptResult.error, null, 2));
        }

        return aptResult;
    } catch (err) {
        console.error("sendEmailtoApartment Exception:", err);
        return { data: null, error: err };
    }
}

export async function sendCancellationEmail({
    guest_email,
    guest_name,
    reservation_no,
    check_in_date,
    check_out_date,
    created_at,
    contact_number
}) {
    try {
        const formatted = formatDateExact(created_at, false);
        const checkinFormatted = formatDateExact(check_in_date, true);
        const checkoutFormatted = formatDateExact(check_out_date, false);
        const subject = `Booking Cancelled (${reservation_no})`;

        const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Booking Cancelled</title>
    <style>
        @media only screen and (max-width: 600px) {
            .main-t { width: 100% !important; max-width: 100% !important; }
            .stack-t { width: 100% !important; display: block !important; margin-bottom: 10px; }
            .img-fix { max-width: 100% !important; height: auto !important; }
            .pad-fix { padding: 10px !important; }
            .center-m { text-align: center !important; }
        }
    </style>
</head>
<body style="margin: 0; padding: 0;">
    <div class="email-container" style="background-color:#ffffff; width:100%;">
        <table width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="#ffffff">
            <tr>
                <td align="center">
                    
                    <!-- HEADER -->
                    <table class="main-t" width="630" align="center" border="0" cellpadding="0" cellspacing="0">
                        <tbody>
                            <tr>
                                <td width="100%">
                                    <table width="100%" align="left" border="0" cellpadding="0" cellspacing="0">
                                        <tbody>
                                            <tr>
                                                <td class="stack-c center-m" align="left" bgcolor="#ffffff" width="40%">
                                                    <a>
                                                        <img width="120" border="0" alt="" style="display:block;border:none;outline:none;text-decoration:none" src="https://ci3.googleusercontent.com/meips/ADKq_NYKoMISuvorFIpkwyNeleh158If7bBLNRWg1Ad_3zcs0sq0ivLeKz6svCPsRAdZvz3cXQ65U1--NOMCpIoKot9DPz6V7JAtvgsxKwJ8OFa2IRjJ2lgYhFKs4A=s0-d-e1-ft#https://www.pajasaapartments.com/wp-content/uploads/2019/08/logo.png" class="CToWUd">
                                                    </a>
                                                </td>
                                                <td class="stack-c center-m" width="45%" valign="middle" align="right">
                                                    <p style="font:bold 12px tahoma;color:#333333;margin:0;padding-bottom:5px">Booked on: <span style="font-size:12px tahoma;color:#858585;margin:0;padding-bottom:5px">${formatted}</span></p>
                                                    <p style="font:bold 12px tahoma;color:#333333;margin:0;padding-bottom:5px">Reservation No.: <span style="color:#f59f0d;font-weight:bold;font-size:12px tahoma">${reservation_no}</span></p>
                                                </td>
                                            </tr>
                                        </tbody>
                                        <tr><td><hr></td></tr>
                                    </table>
                                </td>
                            </tr>
                        </tbody>
                    </table>

                     <!-- Main Body -->
                     <table class="main-t" width="630" align="center" border="0" cellpadding="0" cellspacing="0">
                        <tbody>
                             <tr>
                                <td width="100%" style="padding:20px 0">
                                     <h1 style="font-family:tahoma;font-size:35px;color:#333333;text-align:left;line-height:1.3">Booking Cancelled</h1>
                                     <p style="font:bold 12px tahoma;color:#333333;margin:0;padding-bottom:5px">Hi,</p>
                                     <br>
                                     <p style="font-family:tahoma;font-size:14px;color:#858585;margin:0;padding-bottom:5px">Your Booking has been cancelled with following details..</p>
                                     <br>
                                     <hr style="border: 0; border-top: 1px solid #eee;">
                                </td>
                             </tr>
                             <tr>
                                <td width="100%">
                                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                        <tr>
                                            <td width="50%" valign="top" style="padding-bottom: 20px;">
                                                <p style="font:bold 12px tahoma;color:#333333;margin:0 0 5px 0;">Guest Name</p>
                                                <table cellpadding="0" cellspacing="0" border="0">
                                                    <tr>
                                                        <td valign="middle" style="padding-right: 10px;">
                                                            <span style="color: #f4a01e; font-size: 18px;">✦</span>
                                                        </td>
                                                        <td valign="middle">
                                                            <span style="font-family:tahoma;font-size:14px;color:#858585;">${guest_name}</span>
                                                        </td>
                                                    </tr>
                                                </table>
                                            </td>
                                            <td width="50%" valign="top" style="padding-bottom: 20px;">
                                                <p style="font:bold 12px tahoma;color:#333333;margin:0 0 5px 0;">Contact Number</p>
                                                <span style="font-family:tahoma;font-size:14px;color:#858585;">${contact_number || 'NA'}</span>
                                            </td>
                                        </tr>
                                         <tr>
                                             <td colspan="2"><hr style="border: 0; border-top: 1px solid #eee; margin: 10px 0;"></td>
                                         </tr>
                                        <tr>
                                            <td width="50%" valign="top" style="padding-bottom: 20px;">
                                                <p style="font:bold 12px tahoma;color:#333333;margin:0 0 5px 0;">Check In</p>
                                                <span style="font-family:tahoma;font-size:14px;color:#858585;">${checkinFormatted}</span>
                                            </td>
                                            <td width="50%" valign="top" style="padding-bottom: 20px;">
                                                <p style="font:bold 12px tahoma;color:#333333;margin:0 0 5px 0;">Check Out</p>
                                                <span style="font-family:tahoma;font-size:14px;color:#858585;">${checkoutFormatted}</span>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                             </tr>
                        </tbody>
                     </table>

                    <!-- FOOTER -->
                    <table class="main-t" width="630" align="center" border="0" cellpadding="0" cellspacing="0" style="background-color:#f59f0d; margin-top:20px;">
                         <tbody>
                            <tr>
                                <td align="center" style="padding: 15px;">
                                     <div style="display:-webkit-box; display:flex; flex-wrap:wrap; justify-content:center; gap: 10px;">
                                        <a href="https://www.pajasaapartments.com/in/mumbai/" style="font-family:tahoma;font-size:14px;color:white;margin:0;padding-bottom:4px;text-decoration:none" target="_blank">Mumbai</a>&nbsp;&nbsp;
                                        <a href="https://www.pajasaapartments.com/in/pune/" style="font-family:tahoma;font-size:14px;color:white;margin:0;padding-bottom:4px;text-decoration:none" target="_blank">Pune</a>&nbsp;&nbsp;
                                        <a href="https://www.pajasaapartments.com/in/bengaluru/" style="font-family:tahoma;font-size:14px;color:white;margin:0;padding-bottom:4px;text-decoration:none" target="_blank">Bangalore</a>&nbsp;&nbsp;
                                        <a href="https://www.pajasaapartments.com/in/hyderabad/" style="font-family:tahoma;font-size:14px;color:white;margin:0;padding-bottom:4px;text-decoration:none" target="_blank">Hyderabad</a>&nbsp;&nbsp;
                                        <a href="http://pajasaapartments.com/in/noida/" style="font-family:tahoma;font-size:14px;color:white;margin:0;padding-bottom:4px;text-decoration:none" target="_blank">Noida</a>&nbsp;&nbsp;
                                        <a href="https://www.pajasaapartments.com/in/new-delhi/" style="font-family:tahoma;font-size:14px;color:white;margin:0;padding-bottom:4px;text-decoration:none" target="_blank">Delhi</a>&nbsp;&nbsp;
                                        <a href="https://www.pajasaapartments.com/in/gurugram/" style="font-family:tahoma;font-size:14px;color:white;margin:0;padding-bottom:4px;text-decoration:none" target="_blank">Gurgaon</a>&nbsp;&nbsp;
                                        <a href="https://www.pajasaapartments.com/in/chennai/" style="font-family:tahoma;font-size:14px;color:white;margin:0;padding-bottom:4px;text-decoration:none" target="_blank">Chennai</a>
                                    </div>
                                </td>
                            </tr>
                         </tbody>
                    </table>

                </td>
            </tr>
        </table>
    </div>
</body>
</html>`;

        // Fetch creator and parent admin for CC
        let ccEmails = [];
        try {
            const hierarchyResult = await pool.query(`
                SELECT u.email as creator_email, p.email as parent_email 
                FROM users u
                LEFT JOIN users p ON u.parent_admin_id = p.id
                WHERE u.id = (SELECT created_by FROM reservations WHERE reservation_no = $1)
            `, [reservation_no]);

            if (hierarchyResult.rows.length > 0) {
                const { creator_email, parent_email } = hierarchyResult.rows[0];
                if (creator_email) ccEmails.push(creator_email);
                if (parent_email) ccEmails.push(parent_email);
            }
        } catch (hierarchyErr) {
            console.error("Error fetching hierarchy for CC:", hierarchyErr);
        }

        const result = await resend.emails.send({
            from: "booking@pajasaapartments.com",
            // to: guest_email.split(',').map(e => e.trim()),
            to: ["harshitshukla6388@gmail.com"],
            cc: ccEmails.length > 0 ? ccEmails : undefined,
            subject: subject,
            html: html
        });

        console.log(`Cancellation email sent.`);
        return result;
    } catch (error) {
        console.error("Error sending cancellation email:", error);
        return { error };
    }
}
