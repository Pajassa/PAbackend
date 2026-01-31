import { Resend } from "resend";
import { formatDateExact } from "../../helpers/formatDate.js";
import { formatServices } from "../../helpers/formatServices.js";
import pool from "../../client.js";

const resend = new Resend(process.env.RESEND_API_KEY); // ✅ Load from .env

const formatOccupancy = (occ) => {
    const map = { 1: "Single", 2: "Double", 3: "Triple", 4: "Quadruple", 5: "Quintuple", 6: "Sextuple" };
    return map[Number(occ)] || occ;
};

export async function sendEmail(req, res) {
    try {
        const {
            guestemail,
            apartmentname,
            contactperson,
            contactnumber,
            guestname,
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
            created_at,
            host_email,
            clientName,
            address1,
            address2,
            address3,
            occupancy,
            base_rate,
            taxes,
            host_payment_mode,
            services,
            additionalGuests,
            status,
            attachments,
            modification_tags
        } = req.body;

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
        console.log('  - checkout:', checkout);

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
            ? "As Per Contract"
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

        console.log("additionalGuestsHtml", additionalGuestsHtml);







        const GUEST_TEMPLATE_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
    <style>
        @media only screen and (max-width: 600px) {
            .main-t { width: 100% !important; max-width: 100% !important; }
            .stack-t { width: 100% !important; display: block !important; margin-bottom: 10px; }
            .stack-c { display: block !important; width: 100% !important; box-sizing: border-box; }
            .img-fix { max-width: 100% !important; height: auto !important; }
            .pad-fix { padding: 10px !important; }
            .center-m { text-align: center !important; }
        }
    </style>
</head>
<body style="margin: 0; padding: 0;">
    <table width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="#ffffff">
        <tr>
            <td align="center">
                
                <!-- HEADER (Logo & Date) -->
                <table class="main-t" width="630" align="center" border="0" cellpadding="0" cellspacing="0">
                    <tbody>
                        <tr>
                            <td width="100%">
                                <table width="100%" align="left" border="0" cellpadding="0" cellspacing="0">
                                    <tbody>
                                        <tr>
                                            <td class="stack-c center-m" align="left" bgcolor="#ffffff" width="40%">
                                                <a>
                                                    <img width="120" border="0" alt="" style="display:block;border:none;outline:none;text-decoration:none" src="https://ci3.googleusercontent.com/meips/ADKq_NYKoMISuvorFIpkwyNeleh158If7bBLNRWg1Ad_3zcs0sq0ivLeKz6svCPsRAdZvz3cXQ65U1--NOMCpIoKot9DPz6V7JAtvgsxKwJ8OFa2IRjJ2lgYhFKs4A=s0-d-e1-ft#https://www.pajasaapartments.com/wp-content/uploads/2019/08/logo.png" class="CToWUd" data-bit="iit" jslog="138226; u014N:xr6bB; 53:WzAsMl0.">
                                                </a>
                                            </td>
                                            <td class="stack-c center-m" width="45%" valign="middle" align="right">
                                                <p style="font:bold 12px tahoma;color:#333333;margin:0;padding-bottom:5px">Booked on: <span style="font-size:12px tahoma;color:#858585;margin:0;padding-bottom:5px">${formatted}</span></p>
                                                <p style="font:bold 12px tahoma;color:#333333;margin:0;padding-bottom:5px">Reservation No.: <span style="color:#f59f0d;font-weight:bold;font-size:12px tahoma">${reservationNo}</span>
                                                </p>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </td>
                        </tr>
                        <tr><td><hr></td></tr>
                    </tbody>
                </table>

                <!-- MAIN CONTENT -->
                <table class="main-t" width="630" cellpadding="0" cellspacing="0" border="0" align="center" style="background:#ffffff;margin:0 auto">
                    <tbody>
                        <tr>
                            <td width="100%" style="padding:20px">
                                <table width="100%" align="left" cellpadding="0" cellspacing="0" border="0">
                                    <tbody>
                                        <tr>
                                            <td>
                                                <h1 style="font-family:tahoma;font-size:35px;color:#333333;text-align:left;line-height:1.3">
                                                    ${Title}
                                                </h1>
                                                <p style="font:bold 12px tahoma;color:#333333;margin:0;padding-bottom:5px">Hi, <br><br>Thank you for choosing this Apartment</p><br>
                                                <p style="font-family:tahoma;font-size:14px;color:#858585;margin:0;padding-bottom:5px">
                                                    We are happy to confirm booking with following details :
                                                </p>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </td>
                        </tr>
                    </tbody>

                    <tbody>
                        <tr>
                            <td style="padding:0 30px" width="100%">
                                <table cellpadding="0" cellspacing="0" border="0" width="100%">
                                    <tbody>
                                        <tr>
                                            <td width="100%" style="padding:0px 0">
                                                <!-- Address Table -->
                                                <table class="stack-t" width="270" align="left" border="0" cellpadding="0" cellspacing="0" id="m_-127422732672041899m_-4314589597065577272">
                                                    <tbody>
                                                        <tr>
                                                            <td width="100%" align="left" style="padding:5px;color:#858585">
                                                                <p style="color:#3b7dc0;font-family:Arial,Helvetica,sans-serif;font-size:18px;line-height:20px;margin-top:0;margin-bottom:5px;font-weight:normal"><a style="color:#f59f0d;font-weight:bold">Apartment Address</a></p>
                                                                <p style="font-family:tahoma;font-size:14px;color:#858585;margin:0;padding-bottom:5px">${address1},${address2}, <br>${address3}</p>
                                                                <p style="font-family:tahoma;font-size:14px;color:#858585;margin:0;padding-bottom:5px">Contact Person: ${contactperson} </p>
                                                                <p style="font-family:tahoma;font-size:14px;color:#858585;margin:0;padding-bottom:5px">Contact Number: <a style="color:#858585"></a><a href="tel:%207669990203" target="_blank"> <span style="font-family:tahoma;font-size:14px;color:#858585">NA</span></a></p>
                                                            </td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                                <!-- Image Table -->
                                                <table class="stack-t" width="270" align="left" border="0" cellpadding="0" cellspacing="0">
                                                    <tbody>
                                                        <tr>
                                                            <td width="100%" align="left" style="padding:5px 20px 5px 0">
                                                                <a href="https://www.pajasaapartments.com/?p=8825" target="_blank" data-saferedirecturl="https://www.google.com/url?q=https://www.pajasaapartments.com/?p%3D8825&amp;source=gmail&amp;ust=1765384314609000&amp;usg=AOvVaw1gIXtdl-yTOJ_HhrsP_LEN">
                                                                    <img class="img-fix" id="m_-127422732672041899m_-4314589597065577272abc" src="https://ci3.googleusercontent.com/meips/ADKq_Nan-x-C5r-OHd8YR-3NqovJfgaFO0gQmT4ULFq13R2wS5p2jEI08z4Ko_ATD0PUvdQar4Yf-0NIp0XMGZpEnRCxluu1XfVjAq4nYbyjYUVZ1zhJD2TDthP8ChOck3aKWHoOA3qVF9Uo_HEjefi_XkXBu-LRR0TFY8vRVZRnWp1kia87ZNe1A4g4HdD2Ah8phfTaPVSCK7om=s0-d-e1-ft#https://www.pajasaapartments.com/wp-content/uploads/2019/04/3-BHK-Service-Apartment-in-Kanjurmarg-west-in-Mumbai-living-room1.jpg" width="260" alt="Service Apartment" class="CToWUd" data-bit="iit" jslog="138226; u014N:xr6bB; 53:WzAsMl0.">
                                                                </a>
                                                            </td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </td>
                        </tr>

                        <tr>
                            <td style="padding:0 30px" width="100%">
                                <table cellpadding="0" cellspacing="0" border="0" width="100%">
                                    <tbody>
                                        <tr>
                                            <td width="100%" style="border-bottom:1px solid #d8d8d8;padding:15px 0">
                                                <!-- Guest Name -->
                                                <table class="stack-t" width="270" align="left" border="0" cellpadding="0" cellspacing="0">
                                                    <tbody>
                                                        <tr>
                                                            <td width="270" align="left">
                                                                <table width="100%" cellspacing="0" cellpadding="0">
                                                                    <tbody>
                                                                        <tr>
                                                                            <td width="45%">
                                                                                <img style="float:left;padding-right:10px" src="https://ci3.googleusercontent.com/meips/ADKq_NbRo2H3Om_l08yyqDfKMG-HDwxSimiG6UhMkLlaa6e4Uck3degXgdbVVBncdRlOkf-t2KieZgzx326aKca1lVijDqLD7rMiLKYT2CQ=s0-d-e1-ft#http://gos3.ibcdn.com/hjuls8bqkp4op248fja84esc003i.png" class="CToWUd" data-bit="iit">
                                                                                <p style="font:bold 12px tahoma;color:#333333">Guest Name</p>
                                                                                <span style="font-family:tahoma;font-size:14px;color:#858585;margin:0;padding-bottom:5px">${guestname}</span>
                                                                                <br>
                                                                            </td>
                                                                        </tr>
                                                                    </tbody>
                                                                </table>
                                                            </td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                                <!-- Contact Number -->
                                                <table class="stack-t" width="270" align="left" border="0" cellpadding="0" cellspacing="0">
                                                    <tbody>
                                                        <tr>
                                                            <td width="270" align="left">
                                                                <table width="100%" cellspacing="0" cellpadding="0">
                                                                    <tbody>
                                                                        <tr>
                                                                            <td>
                                                                                <p style="font:bold 12px tahoma;color:#333333">Contact Number</p>
                                                                                <p style="font-family:tahoma;font-size:14px;color:#858585;margin:0;padding-bottom:5px">${contactnumberguest}</p>
                                                                            </td>
                                                                        </tr>
                                                                    </tbody>
                                                                </table>
                                                            </td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </td>
                        </tr>

                        <tr>
                            <td style="padding:0 30px" width="100%">
                                <table cellpadding="0" cellspacing="0" border="0" width="100%">
                                    <tbody>
                                        <tr>
                                            <td width="100%" style="border-bottom:1px solid #d8d8d8;padding:15px 0">
                                                <!-- Check In -->
                                                <table class="stack-t" width="270" align="left" border="0" cellpadding="0" cellspacing="0">
                                                    <tbody>
                                                        <tr>
                                                            <td width="270" align="left" style="padding:5px 0">
                                                                <table width="100%" cellspacing="0" cellpadding="0">
                                                                    <tbody>
                                                                        <tr>
                                                                            <td>
                                                                                <p style="font:bold 12px tahoma;color:#333333">Check In</p>
                                                                                ${originalBooking && (modificationType === 'preponed' || modificationType === 'postponed') ? `
                                                                                    <div style="border:2px solid #f59f0d;border-radius:8px;padding:12px;margin-top:8px;background:#fff9f0">
                                                                                        <p style="font:bold 10px tahoma;color:#666;margin:0 0 8px 0">Previous:</p>
                                                                                        <span style="font-family:tahoma;font-size:13px;color:#999;text-decoration:line-through;display:block;margin-bottom:12px">
                                                                                            ${formatDateExact(originalBooking.old_check_in_date, true)}
                                                                                        </span>
                                                                                        <p style="font:bold 10px tahoma;color:red;margin:0 0 8px 0">Current:</p>
                                                                                        <span style="font-family:tahoma;font-size:16px;color:red;font-weight:bold;display:block">
                                                                                            ${formatDateExact(checkin, true)}
                                                                                        </span>
                                                                                    </div>
                                                                                ` : `
                                                                                    <span style="font-family:tahoma;font-size:14px;color:#858585;margin:0;padding-bottom:5px">
                                                                                        ${formatDateExact(checkin, true)} 
                                                                                    </span>
                                                                                `}
                                                                                <br>
                                                                            </td>
                                                                        </tr>
                                                                    </tbody>
                                                                </table>
                                                            </td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                                <!-- Check Out -->
                                                ${additionalGuestsHtml ? `
                                                        <table class="stack-t" width="270" align="left" border="0" cellpadding="0" cellspacing="0">
                                                        <tbody>
                                                            <tr>
                                                                <td width="270" align="left" style="padding:5px 0">
                                                                    <table width="100%" cellspacing="0" cellpadding="0">
                                                                        <tbody>
                                                                            <tr>
                                                                                <td width="45%">
                                                                                    <p style="font:bold 12px tahoma;color:${(Preponed || isExtended) ? 'red' : '#333333'}">${Preponed ? 'Preponed Check Out Date' : 'Extended Check Out Date'}</p>
                                                                                    <span style="font-family:tahoma;font-size:14px;color:#858585;margin:0;padding-bottom:5px">${additionalGuestsHtml}</span>
                                                                                    <br>
                                                                                    <p style="font:bold 12px tahoma;color:#333333">Previous Check Out</p>
                                                                                    <span style="font-family:tahoma;font-size:14px;color:#858585;margin:0;padding-bottom:5px">${formatDateExact(checkout, false)}</span>
                                                                                    <br>
                                                                                </td>
                                                                            </tr>
                                                                        </tbody>
                                                                    </table>
                                                                </td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                `: `
                                                <table class="stack-t" width="270" align="left" border="0" cellpadding="0" cellspacing="0">
                                                    <tbody>
                                                        <tr>
                                                            <td width="270" align="left" style="padding:5px 0">
                                                                <table width="100%" cellspacing="0" cellpadding="0">
                                                                    <tbody>
                                                                        <tr>
                                                                            <td width="45%">
                                                                                <p style="font:bold 12px tahoma;color:#333333">Check Out</p>
                                                                                ${originalBooking && (modificationType === 'extended' || modificationType === 'shortened') ? `
                                                                                    <div style="border:2px solid #f59f0d;border-radius:8px;padding:12px;margin-top:8px;background:#fff9f0">
                                                                                        <p style="font:bold 10px tahoma;color:#666;margin:0 0 8px 0">Previous:</p>
                                                                                        <span style="font-family:tahoma;font-size:13px;color:#999;text-decoration:line-through;display:block;margin-bottom:12px">
                                                                                            ${formatDateExact(originalBooking.old_check_out_date, false)}
                                                                                        </span>
                                                                                        <p style="font:bold 10px tahoma;color:red;margin:0 0 8px 0">Current:</p>
                                                                                        <span style="font-family:tahoma;font-size:16px;color:red;font-weight:bold;display:block">
                                                                                            ${formatDateExact(checkout, false)}
                                                                                        </span>
                                                                                    </div>
                                                                                ` : `
                                                                                    <span style="font-family:tahoma;font-size:14px;color:#858585;margin:0;padding-bottom:5px">
                                                                                        ${formatDateExact(checkout, false)}
                                                                                    </span>
                                                                                `}
                                                                                <br>
                                                                            </td>
                                                                        </tr>
                                                                    </tbody>
                                                                </table>
                                                            </td>
                                                        </tr>
                                                    </tbody>
                                                </table>`}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </td>
                        </tr>

                        <tr>
                            <td style="padding:0 30px" width="100%">
                                <table cellpadding="0" cellspacing="0" border="0" width="100%">
                                    <tbody>
                                        <tr>
                                            <td width="100%" style="border-bottom:1px solid #d8d8d8;padding:15px 0">
                                                <!-- Chargeable Days -->
                                                <table class="stack-t" width="270" align="left" border="0" cellpadding="0" cellspacing="0">
                                                    <tbody>
                                                        <tr>
                                                            <td width="100%" align="left" style="padding:5px 0">
                                                                <table width="100%" cellspacing="0" cellpadding="0">
                                                                    <tbody>
                                                                        <tr>
                                                                            <td width="45%">
                                                                                <p style="font:bold 12px tahoma;color:#333333">Chargeable Days</p>
                                                                                <span style="font-family:tahoma;font-size:14px;color:#858585;margin:0;padding-bottom:5px">${chargeabledays}</span>
                                                                            </td>
                                                                        </tr>
                                                                    </tbody>
                                                                </table>
                                                            </td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                                <!-- Amount -->
                                                <table class="stack-t" width="270" align="left" border="0" cellpadding="0" cellspacing="0">
                                                    <tbody>
                                                        <tr>
                                                            <td width="100%" align="left" style="padding:5px 0">
                                                                <table width="100%" cellspacing="0" cellpadding="0">
                                                                    <tbody>
                                                                        <tr>
                                                                            <td>
                                                                                <p style="font:bold 12px tahoma;color:#333333">Amount</p>
                                                                                <span style="font-family:tahoma;font-size:14px;color:#858585;margin:0;padding-bottom:5px">${paymentDetails}
                                                                                </span>
                                                                            </td>
                                                                        </tr>
                                                                    </tbody>
                                                                </table>
                                                            </td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </td>
                        </tr>

                        <tr>
                            <td style="padding:0 30px" width="100%">
                                <table cellpadding="0" cellspacing="0" border="0" width="100%">
                                    <tbody>
                                        <tr>
                                            <td width="100%" style="border-bottom:1px solid #d8d8d8;padding:15px 0">
                                                <!-- Mode of Payment -->
                                                <table class="stack-t" width="270" align="left" border="0" cellpadding="0" cellspacing="0">
                                                    <tbody>
                                                        <tr>
                                                            <td width="100%" align="left" style="padding:5px 0">
                                                                <table width="100%" cellspacing="0" cellpadding="0">
                                                                    <tbody>
                                                                        <tr>
                                                                            <td width="45%">
                                                                                <p style="font:bold 12px tahoma;color:#333333">Mode of Payment</p>
                                                                                <span style="font-family:tahoma;font-size:14px;color:#858585;margin:0;padding-bottom:5px">${modeofpayment}</span>
                                                                            </td>
                                                                        </tr>
                                                                    </tbody>
                                                                </table>
                                                            </td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                                <!-- Client Name -->
                                                <table class="stack-t" width="270" align="left" border="0" cellpadding="0" cellspacing="0">
                                                    <tbody>
                                                        <tr>
                                                            <td width="100%" align="left" style="padding:5px 0">
                                                                <table width="100%" cellspacing="0" cellpadding="0">
                                                                    <tbody>
                                                                        <tr>
                                                                            <td>
                                                                                <p style="font:bold 12px tahoma;color:#333333">Client Name</p>
                                                                                <span style="font-family:tahoma;font-size:14px;color:#858585;margin:0;padding-bottom:5px">${clientName}</span>
                                                                            </td>
                                                                        </tr>
                                                                    </tbody>
                                                                </table>
                                                            </td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </td>
                        </tr>

                        <tr>
                            <td style="padding:0 30px" width="100%">
                                <table cellpadding="0" cellspacing="0" border="0" width="100%">
                                    <tbody>
                                        <tr>
                                            <td width="100%" style="border-bottom:1px solid #d8d8d8;padding:15px 0">
                                                <!-- Room Type -->
                                                <table class="stack-t" width="270" align="left" border="0" cellpadding="0" cellspacing="0">
                                                    <tbody>
                                                        <tr>
                                                            <td width="100%" align="left" style="padding:5px 0">
                                                                <table width="100%" cellspacing="0" cellpadding="0">
                                                                    <tbody>
                                                                        <tr>
                                                                            <td width="45%">
                                                                                <p style="font:bold 12px tahoma;color:#333333">Room Type</p>
                                                                                <span style="font-family:tahoma;font-size:14px;color:#858585;margin:0;padding-bottom:5px">${roomtype}</span>
                                                                                <br>
                                                                            </td>
                                                                        </tr>
                                                                    </tbody>
                                                                </table>
                                                            </td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                                <!-- Occupancy -->
                                                <table class="stack-t" width="270" align="left" border="0" cellpadding="0" cellspacing="0">
                                                    <tbody>
                                                        <tr>
                                                            <td width="100%" align="left" style="padding:5px 0">
                                                                <table width="100%" cellspacing="0" cellpadding="0">
                                                                    <tbody>
                                                                        <tr>
                                                                            <td width="45%">
                                                                                <p style="font:bold 12px tahoma;color:#333333">Occupancy</p>
                                                                                <span style="font-family:tahoma;font-size:14px;color:#858585;margin:0;padding-bottom:5px">${formatOccupancy(occupancy)}</span>
                                                                                <br>
                                                                            </td>
                                                                        </tr>
                                                                    </tbody>
                                                                </table>
                                                            </td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </td>
                        </tr>

                        <!-- Inclusions - 170 and 370 px tables -->
                        <tr>
                            <td width="100%" style="padding:0 30.0px">
                                <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                    <tbody>
                                        <tr>
                                            <td style="border-bottom:1.0px solid rgb(216,216,216);padding:15.0px 0" width="100%">
                                                <table class="stack-t" cellspacing="0" cellpadding="0" border="0" align="left" width="170">
                                                    <tbody>
                                                        <tr>
                                                            <td style="padding:5.0px 0" align="left" width="100%">
                                                                <table cellpadding="0" cellspacing="0" width="100%">
                                                                    <tbody>
                                                                        <tr>
                                                                            <td width="30%"><span style="color:rgb(74,74,74)"><b><span style="font-family:Helvetica,arial,sans-serif"><span style="color:#f59f0d;font-weight:bold">Inclusions</span></span></b></span><br></td>
                                                                        </tr>
                                                                    </tbody>
                                                                </table>
                                                            </td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                                <table class="stack-t" cellspacing="0" cellpadding="0" border="0" align="left" width="370">
                                                    <tbody>
                                                        <tr>
                                                            <td style="padding:5.0px 0" align="left" width="100%">
                                                                <table cellpadding="0" cellspacing="0" width="100%">
                                                                    <tbody>
                                                                        <tr>
                                                                            <td>
                                                                                <span style="color:rgb(74,74,74)"><span style="font-family:tahoma;font-size:13px;color:#858585;margin:0;padding-bottom:5px">Accommodation,${formatServices(services)} </span></span><br>
                                                                            </td>
                                                                        </tr>
                                                                    </tbody>
                                                                </table>
                                                            </td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </td>
                        </tr>
                        <!-- Terms & Conditions -->
                        <tr>
                            <td width="100%" style="padding:0 30.0px">
                                <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                    <tbody>
                                        <tr>
                                            <td style="padding:15.0px 0" width="100%">
                                                <table class="stack-t" cellspacing="0" cellpadding="0" border="0" align="left" width="170">
                                                    <tbody>
                                                        <tr>
                                                            <td style="padding:5.0px 0" align="left" width="100%">
                                                                <table cellpadding="0" cellspacing="0" width="100%">
                                                                    <tbody>
                                                                        <tr>
                                                                            <td width="30%"><span style="color:rgb(74,74,74)"><b><span style="font-family:Helvetica,arial,sans-serif"><span style="color:#f59f0d;font-weight:bold">Terms &amp; Conditions :</span></span></b></span><br></td>
                                                                        </tr>
                                                                    </tbody>
                                                                </table>
                                                            </td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                                <table class="stack-t" cellspacing="0" cellpadding="0" border="0" align="left" width="370">
                                                    <tbody>
                                                        <tr>
                                                            <td style="padding-bottom:5.0px" align="left" width="100%">
                                                                <table cellpadding="0" cellspacing="0" width="100%">
                                                                    <tbody>
                                                                        <tr>
                                                                            <td>
                                                                                <p style="font-family:tahoma;font-size:13px;color:#858585;margin:0;padding-bottom:5px;text-align:justify">
                                                                                    <span style="color:rgb(74,74,74)"><span style="font-family:Helvetica,arial,sans-serif"><span style="font-family:tahoma;font-size:13px;color:#858585;margin:0;padding-bottom:5px">
                                                                                        1. Check in & Check out Time 14:00 PM & 11:00 AM <br>
                                                                                        2. Every guest will have to carry a print of the confirmation along with the company and government photo ID at the time of checking in.<br>
                                                                                        3. Visitors are permitted in the apartment only between 10:00 AM and 7:00 PM  and maximum of One visitors per day is allowed for each apartment. With Prior email approval from the concerned company admin is required for any visitor entry.<br>
                                                                                        4. Cancellation Terms: Kindly visit PAJASA website for cancelation terms & Conditions.  https://www.pajasaapartments.com/terms-and-conditions/
                                                                                    </span></span></span><br>
                                                                                </p>
                                                                            </td>
                                                                        </tr>
                                                                    </tbody>
                                                                </table>
                                                            </td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </td>
                        </tr>

                        <!-- Footer Links -->
                        <tr>
                            <td style="padding:0 30px"></td>
                        </tr>
                        <tr style="background-color:#f59f0d">
                            <td style="padding:0 30px" width="100%">
                                <table cellpadding="0" cellspacing="0" border="0" width="100%">
                                    <tbody>
                                        <tr>
                                            <td width="100%" style="padding:15px 0">
                                                <table width="100%" align="left" border="0" cellpadding="0" cellspacing="0">
                                                    <tbody>
                                                        <tr>
                                                            <td width="100%" align="left" style="padding:5px 0;color:black;text-align:-webkit-center">
                                                                <table width="90%" cellspacing="0" cellpadding="0">
                                                                    <tbody>
                                                                        <tr style="text-align:-webkit-center">
                                                                            <td>
                                                                                <div>
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
                                                                                </div>
                                                                            </td>
                                                                        </tr>
                                                                    </tbody>
                                                                </table>
                                                            </td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </td>
                        </tr>

                    </tbody>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;

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
            modificationType  // ✅ Add this
        );

        if (aptResult.error) {
            console.log("Apartment email error:", aptResult.error);
        }

        // -----------------------------
        // 2️⃣ SEND EMAIL TO GUEST
        // -----------------------------
        const guestResult = await resend.emails.send({
            from: "hosting@pajasa.com",
            // to: emailList,
            to: ["harshitshukla6388@gmail.com"],
            subject,
            html: GUEST_TEMPLATE_HTML,
            attachments
        });

        if (guestResult.error) {
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
    modificationType  // ✅ Add this
) {
    const additionalGuestsHtml =
        additionalGuests?.length
            ? additionalGuests.map(g => formatDateExact(g.cod, false)).join("<br>")
            : "";
    const isExtendedTitle = Title.includes("Extended");
    const subject2 = Preponed ? `Apartments Booking Check out Preponed (${reservationNo}) ` : (isExtendedTitle ? `Apartments Booking Extension Confirmation (${reservationNo})` : `Apartments Booking Confirmation (${reservationNo})`);
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
    <style>
        @media only screen and (max-width: 600px) {
            .main-t { width: 100% !important; max-width: 100% !important; }
            .stack-t { width: 100% !important; display: block !important; margin-bottom: 10px; }
            .stack-c { display: block !important; width: 100% !important; box-sizing: border-box; }
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
                                                        <img width="120" border="0" alt="" style="display:block;border:none;outline:none;text-decoration:none" src="https://ci3.googleusercontent.com/meips/ADKq_NYKoMISuvorFIpkwyNeleh158If7bBLNRWg1Ad_3zcs0sq0ivLeKz6svCPsRAdZvz3cXQ65U1--NOMCpIoKot9DPz6V7JAtvgsxKwJ8OFa2IRjJ2lgYhFKs4A=s0-d-e1-ft#https://www.pajasaapartments.com/wp-content/uploads/2019/08/logo.png" class="CToWUd" data-bit="iit" jslog="138226; u014N:xr6bB; 53:WzAsMl0.">
                                                    </a>
                                                </td>
                                                <td class="stack-c center-m" width="45%" valign="middle" align="right">
                                                    <p style="font:bold 12px tahoma;color:#333333;margin:0;padding-bottom:5px">Booked on: <span style="font-size:12px tahoma;color:#858585;margin:0;padding-bottom:5px">${formatted}</span></p>
                                                    <p style="font:bold 12px tahoma;color:#333333;margin:0;padding-bottom:5px">Reservation No.: <span style="color:#f59f0d;font-weight:bold;font-size:12px tahoma">${reservationNo}</span></p>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </td>
                            </tr>
                            <tr><td><hr></td></tr>
                        </tbody>
                    </table>

                    <!-- MAIN CONTENT -->
                    <table class="main-t" width="630" cellpadding="0" cellspacing="0" border="0" align="center" style="background:#ffffff;margin:0 auto">
                        <tbody>
                            <tr>
                                <td width="100%" style="padding:20px">
                                    <table width="100%" align="left" cellpadding="0" cellspacing="0" border="0">
                                        <tbody>
                                            <tr>
                                                <td>
                                                    <h1 style="font-family:tahoma;font-size:35px;color:#333333;text-align:left;line-height:1.3">
                                                        ${Title}
                                                    </h1>
                                                    <p style="font:bold 12px tahoma;color:#333333;margin:0;padding-bottom:5px">Hi,Veridical Hospitality <br>
                                                    <br>Thank you for the confirmation</p><br>
                                                    <p style="font-family:tahoma;font-size:14px;color:#858585;margin:0;padding-bottom:5px">
                                                        We are happy to confirm booking with following details :
                                                    </p>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </td>
                            </tr>
                        </tbody>

                        <tbody>
                            <tr>
                                <td style="padding:0 30px" width="100%">
                                    <table cellpadding="0" cellspacing="0" border="0" width="100%">
                                        <tbody>
                                            <tr>
                                                <td width="100%" style="padding:0px 0">
                                                    <!-- Address -->
                                                    <table class="stack-t" width="290" align="left" border="0" cellpadding="0" cellspacing="0" id="m_2450834815802175052m_-6000102758310738402">
                                                        <tbody>
                                                            <tr>
                                                                <td width="100%" align="left" style="padding:5px;color:#858585">
                                                                    <p style="color:#3b7dc0;font-family:Arial,Helvetica,sans-serif;font-size:18px;line-height:20px;margin-top:0;margin-bottom:5px;font-weight:normal"><a style="color:#f59f0d;font-weight:bold">Apartment Address</a></p>
                                                                    <p style="font-family:tahoma;font-size:14px;color:#858585;margin:0;padding-bottom:5px">${address1},${address2} <br> ${address3}</p>
                                                                    <p style="font-family:tahoma;font-size:14px;color:#858585;margin:0;padding-bottom:5px">Contact Person: ${contactperson} </p>
                                                                    <p style="font-family:tahoma;font-size:14px;color:#858585;margin:0;padding-bottom:5px">Contact Number: <a style="color:#858585"></a><a href="tel:${contactnumber}" target="_blank"> <span style="font-family:tahoma;font-size:14px;color:#858585">${contactnumber}</span></a></p>
                                                                </td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                    <!-- Image -->
                                                    <table class="stack-t" width="270" align="left" border="0" cellpadding="0" cellspacing="0">
                                                        <tbody>
                                                            <tr>
                                                                <td width="100%" align="left" style="padding:5px 20px 5px 0">
                                                                    <a href="https://www.pajasaapartments.com/?p=8825" target="_blank" data-saferedirecturl="https://www.google.com/url?q=https://www.pajasaapartments.com/?p%3D8825&amp;source=gmail&amp;ust=1765475165922000&amp;usg=AOvVaw1mVcIzWsoVD9OwdnFrW9N-">
                                                                        <img class="img-fix" id="m_2450834815802175052m_-6000102758310738402abc" src="https://ci3.googleusercontent.com/meips/ADKq_Nan-x-C5r-OHd8YR-3NqovJfgaFO0gQmT4ULFq13R2wS5p2jEI08z4Ko_ATD0PUvdQar4Yf-0NIp0XMGZpEnRCxluu1XfVjAq4nYbyjYUVZ1zhJD2TDthP8ChOck3aKWHoOA3qVF9Uo_HEjefi_XkXBu-LRR0TFY8vRVZRnWp1kia87ZNe1A4g4HdD2Ah8phfTaPVSCK7om=s0-d-e1-ft#https://www.pajasaapartments.com/wp-content/uploads/2019/04/3-BHK-Service-Apartment-in-Kanjurmarg-west-in-Mumbai-living-room1.jpg" width="260" alt="Service Apartment" class="CToWUd" data-bit="iit" jslog="138226; u014N:xr6bB; 53:WzAsMl0.">
                                                                    </a>
                                                                </td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </td>
                            </tr>

                            <tr>
                                <td style="padding:0 30px" width="100%">
                                    <table cellpadding="0" cellspacing="0" border="0" width="100%">
                                        <tbody>
                                            <tr>
                                                <td width="100%" style="border-bottom:1px solid #d8d8d8;padding:15px 0">
                                                    <!-- Guest Name -->
                                                    <table class="stack-t" width="270" align="left" border="0" cellpadding="0" cellspacing="0">
                                                        <tbody>
                                                            <tr>
                                                                <td width="270" align="left">
                                                                    <table width="100%" cellspacing="0" cellpadding="0">
                                                                        <tbody>
                                                                            <tr>
                                                                                <td width="45%">
                                                                                    <img style="float:left;padding-right:10px" src="https://ci3.googleusercontent.com/meips/ADKq_NbRo2H3Om_l08yyqDfKMG-HDwxSimiG6UhMkLlaa6e4Uck3degXgdbVVBncdRlOkf-t2KieZgzx326aKca1lVijDqLD7rMiLKYT2CQ=s0-d-e1-ft#http://gos3.ibcdn.com/hjuls8bqkp4op248fja84esc003i.png" class="CToWUd" data-bit="iit">
                                                                                    <p style="font:bold 12px tahoma;color:#333333">Guest Name</p>
                                                                                    <span style="font-family:tahoma;font-size:14px;color:#858585;margin:0;padding-bottom:5px">${guestname}</span>
                                                                                    <br>
                                                                                </td>
                                                                            </tr>
                                                                        </tbody>
                                                                    </table>
                                                                </td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                    <!-- Contact Number -->
                                                    <table class="stack-t" width="270" align="left" border="0" cellpadding="0" cellspacing="0">
                                                        <tbody>
                                                            <tr>
                                                                <td width="270" align="left">
                                                                    <table width="100%" cellspacing="0" cellpadding="0">
                                                                        <tbody>
                                                                            <tr>
                                                                                <td>
                                                                                    <p style="font:bold 12px tahoma;color:#333333">Contact Number</p>
                                                                                    <p style="font-family:tahoma;font-size:14px;color:#858585;margin:0;padding-bottom:5px">${contactnumberguest}</p>
                                                                                </td>
                                                                            </tr>
                                                                        </tbody>
                                                                    </table>
                                                                </td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </td>
                            </tr>

                            <tr>
                                <td style="padding:0 30px" width="100%">
                                    <table cellpadding="0" cellspacing="0" border="0" width="100%">
                                        <tbody>
                                            <tr>
                                                <td width="100%" style="border-bottom:1px solid #d8d8d8;padding:15px 0">
                                                    <!-- Check In -->
                                                    <table class="stack-t" width="270" align="left" border="0" cellpadding="0" cellspacing="0">
                                                        <tbody>
                                                            <tr>
                                                                <td width="270" align="left" style="padding:5px 0">
                                                                    <table width="100%" cellspacing="0" cellpadding="0">
                                                                        <tbody>
                                                                            <tr>
                                                                                <td>
                                                                                    <p style="font:bold 12px tahoma;color:#333333">Check In</p>
                                                                                    ${originalBooking && (modificationType === 'preponed' || modificationType === 'postponed') ? `
                                                                                        <div style="border:2px solid #f59f0d;border-radius:8px;padding:12px;margin-top:8px;background:#fff9f0">
                                                                                            <p style="font:bold 10px tahoma;color:#666;margin:0 0 8px 0">Previous:</p>
                                                                                            <span style="font-family:tahoma;font-size:13px;color:#999;text-decoration:line-through;display:block;margin-bottom:12px">
                                                                                                ${formatDateExact(originalBooking.old_check_in_date, true)}
                                                                                            </span>
                                                                                            <p style="font:bold 10px tahoma;color:red;margin:0 0 8px 0">Current:</p>
                                                                                            <span style="font-family:tahoma;font-size:16px;color:red;font-weight:bold;display:block">
                                                                                                ${formatDateExact(checkin, true)}
                                                                                            </span>
                                                                                        </div>
                                                                                    ` : `
                                                                                        <span style="font-family:tahoma;font-size:14px;color:#858585;margin:0;padding-bottom:5px">
                                                                                            ${formatDateExact(checkin, true)} 
                                                                                        </span>
                                                                                    `} <br>
                                                                                </td>
                                                                            </tr>
                                                                        </tbody>
                                                                    </table>
                                                                </td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                    <!-- Check Out -->
                                                    ${additionalGuestsHtml ? `
                                                        <table class="stack-t" width="270" align="left" border="0" cellpadding="0" cellspacing="0">
                                                        <tbody>
                                                            <tr>
                                                                <td width="270" align="left" style="padding:5px 0">
                                                                    <table width="100%" cellspacing="0" cellpadding="0">
                                                                        <tbody>
                                                                            <tr>
                                                                                <td width="45%">
                                                                                    <p style="font:bold 12px tahoma;color:${(Preponed || Title.includes('Extended')) ? 'red' : '#333333'}">${Preponed ? 'Preponed Check Out Date' : 'Extended Check Out Date'}</p>
                                                                                    <span style="font-family:tahoma;font-size:14px;color:#858585;margin:0;padding-bottom:5px">${additionalGuestsHtml}</span>
                                                                                    <br>
                                                                                    <p style="font:bold 12px tahoma;color:#333333">Previous Check Out</p>
                                                                                    <span style="font-family:tahoma;font-size:14px;color:#858585;margin:0;padding-bottom:5px">${formatDateExact(checkout, false)}</span>
                                                                                    <br>
                                                                                </td>
                                                                            </tr>
                                                                        </tbody>
                                                                    </table>
                                                                </td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                    `: `
                                                <table class="stack-t" width="270" align="left" border="0" cellpadding="0" cellspacing="0">
                                                    <tbody>
                                                        <tr>
                                                            <td width="270" align="left" style="padding:5px 0">
                                                                <table width="100%" cellspacing="0" cellpadding="0">
                                                                    <tbody>
                                                                        <tr>
                                                                            <td width="45%">
                                                                                <p style="font:bold 12px tahoma;color:#333333">Check Out</p>
                                                                                ${originalBooking && (modificationType === 'extended' || modificationType === 'shortened') ? `
                                                                                    <div style="border:2px solid #f59f0d;border-radius:8px;padding:12px;margin-top:8px;background:#fff9f0">
                                                                                        <p style="font:bold 10px tahoma;color:#666;margin:0 0 8px 0">Previous:</p>
                                                                                        <span style="font-family:tahoma;font-size:13px;color:#999;text-decoration:line-through;display:block;margin-bottom:12px">
                                                                                            ${formatDateExact(originalBooking.old_check_out_date, false)}
                                                                                        </span>
                                                                                        <p style="font:bold 10px tahoma;color:red;margin:0 0 8px 0">Current:</p>
                                                                                        <span style="font-family:tahoma;font-size:16px;color:red;font-weight:bold;display:block">
                                                                                            ${formatDateExact(checkout, false)}
                                                                                        </span>
                                                                                    </div>
                                                                                ` : `
                                                                                    <span style="font-family:tahoma;font-size:14px;color:#858585;margin:0;padding-bottom:5px">
                                                                                        ${formatDateExact(checkout, false)} 
                                                                                    </span>
                                                                                `}
                                                                                <br>
                                                                            </td>
                                                                        </tr>
                                                                    </tbody>
                                                                </table>
                                                            </td>
                                                        </tr>
                                                    </tbody>
                                                </table>`}
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </td>
                            </tr>
                            <tr>
                                <td style="padding:0 30px" width="100%">
                                    <table cellpadding="0" cellspacing="0" border="0" width="100%">
                                        <tbody>
                                            <tr>
                                                <td width="100%" style="border-bottom:1px solid #d8d8d8;padding:15px 0">
                                                    <!-- Chargeable Days -->
                                                    <table class="stack-t" width="270" align="left" border="0" cellpadding="0" cellspacing="0">
                                                        <tbody>
                                                            <tr>
                                                                <td width="100%" align="left" style="padding:5px 0">
                                                                    <table width="100%" cellspacing="0" cellpadding="0">
                                                                        <tbody>
                                                                            <tr>
                                                                                <td width="45%">
                                                                                    <p style="font:bold 12px tahoma;color:#333333">Chargeable Days</p>
                                                                                    <span style="font-family:tahoma;font-size:14px;color:#858585;margin:0;padding-bottom:5px">${chargeabledays}</span>
                                                                                </td>
                                                                            </tr>
                                                                        </tbody>
                                                                    </table>
                                                                </td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                    <!-- Amount -->
                                                    <table class="stack-t" width="270" align="left" border="0" cellpadding="0" cellspacing="0">
                                                        <tbody>
                                                            <tr>
                                                                <td width="100%" align="left" style="padding:5px 0">
                                                                    <table width="100%" cellspacing="0" cellpadding="0">
                                                                        <tbody>
                                                                            <tr>
                                                                                <td>
                                                                                    <p style="font:bold 12px tahoma;color:#333333">Amount</p>
                                                                                    <span style="font-family:tahoma;font-size:14px;color:#858585;margin:0;padding-bottom:5px">${host_payment_mode === "Bill to Pajasa" ? "As Per Contract" : amount}</span>
                                                                                </td>
                                                                            </tr>
                                                                        </tbody>
                                                                    </table>
                                                                </td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </td>
                            </tr>

                            <tr>
                                <td style="padding:0 30px" width="100%">
                                    <table cellpadding="0" cellspacing="0" border="0" width="100%">
                                        <tbody>
                                            <tr>
                                                <td width="100%" style="border-bottom:1px solid #d8d8d8;padding:15px 0">
                                                    <!-- Mode of Payment -->
                                                    <table class="stack-t" width="270" align="left" border="0" cellpadding="0" cellspacing="0">
                                                        <tbody>
                                                            <tr>
                                                                <td width="100%" align="left" style="padding:5px 0">
                                                                    <table width="100%" cellspacing="0" cellpadding="0">
                                                                        <tbody>
                                                                            <tr>
                                                                                <td width="45%">
                                                                                    <p style="font:bold 12px tahoma;color:#333333">Mode of Payment</p>
                                                                                    <span style="font-family:tahoma;font-size:14px;color:#858585;margin:0;padding-bottom:5px">${host_payment_mode}</span>
                                                                                </td>
                                                                            </tr>
                                                                        </tbody>
                                                                    </table>
                                                                </td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                    <!-- Guest Type -->
                                                    <table class="stack-t" width="270" align="left" border="0" cellpadding="0" cellspacing="0">
                                                        <tbody>
                                                            <tr>
                                                                <td width="100%" align="left" style="padding:5px 0">
                                                                    <table width="100%" cellspacing="0" cellpadding="0">
                                                                        <tbody>
                                                                            <tr>
                                                                                <td>
                                                                                    <p style="font:bold 12px tahoma;color:#333333">Guest Type</p>
                                                                                    <span style="font-family:tahoma;font-size:14px;color:#858585;margin:0;padding-bottom:5px">${guesttype}</span>
                                                                                </td>
                                                                            </tr>
                                                                        </tbody>
                                                                    </table>
                                                                </td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </td>
                            </tr>

                            <tr>
                                <td style="padding:0 30px" width="100%">
                                    <table cellpadding="0" cellspacing="0" border="0" width="100%">
                                        <tbody>
                                            <tr>
                                                <td width="100%" style="border-bottom:1px solid #d8d8d8;padding:15px 0">
                                                    <!-- Room Type -->
                                                    <table class="stack-t" width="270" align="left" border="0" cellpadding="0" cellspacing="0">
                                                        <tbody>
                                                            <tr>
                                                                <td width="100%" align="left" style="padding:5px 0">
                                                                    <table width="100%" cellspacing="0" cellpadding="0">
                                                                        <tbody>
                                                                            <tr>
                                                                                <td width="45%">
                                                                                    <p style="font:bold 12px tahoma;color:#333333">Room Type</p>
                                                                                    <span style="font-family:tahoma;font-size:14px;color:#858585;margin:0;padding-bottom:5px">${roomtype}</span>
                                                                                    <br>
                                                                                </td>
                                                                            </tr>
                                                                        </tbody>
                                                                    </table>
                                                                </td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                    <!-- Occupancy -->
                                                    <table class="stack-t" width="270" align="left" border="0" cellpadding="0" cellspacing="0">
                                                        <tbody>
                                                            <tr>
                                                                <td width="100%" align="left" style="padding:5px 0">
                                                                    <table width="100%" cellspacing="0" cellpadding="0">
                                                                        <tbody>
                                                                            <tr>
                                                                                <td width="45%">
                                                                                    <p style="font:bold 12px tahoma;color:#333333">Occupancy</p>
                                                                                    <span style="font-family:tahoma;font-size:14px;color:#858585;margin:0;padding-bottom:5px">${formatOccupancy(occupancy)}</span>
                                                                                    <br>
                                                                                </td>
                                                                            </tr>
                                                                        </tbody>
                                                                    </table>
                                                                </td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </td>
                            </tr>

                            <!-- Inclusions -->
                            <tr>
                                <td width="100%" style="padding:0 30.0px">
                                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                        <tbody>
                                            <tr>
                                                <td style="border-bottom:1.0px solid rgb(216,216,216);padding:15.0px 0" width="100%">
                                                    <table class="stack-t" cellspacing="0" cellpadding="0" border="0" align="left" width="170">
                                                        <tbody>
                                                            <tr>
                                                                <td style="padding:5.0px 0" align="left" width="100%">
                                                                    <table cellpadding="0" cellspacing="0" width="100%">
                                                                        <tbody>
                                                                            <tr>
                                                                                <td width="30%"><span style="color:rgb(74,74,74)"><b><span style="font-family:Helvetica,arial,sans-serif"><span style="color:#f59f0d;font-weight:bold">Inclusions</span></span></b></span><br></td>
                                                                            </tr>
                                                                        </tbody>
                                                                    </table>
                                                                </td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                    <table class="stack-t" cellspacing="0" cellpadding="0" border="0" align="left" width="370">
                                                        <tbody>
                                                            <tr>
                                                                <td style="padding:5.0px 0" align="left" width="100%">
                                                                    <table cellpadding="0" cellspacing="0" width="100%">
                                                                        <tbody>
                                                                            <tr>
                                                                                <td>
                                                                                    <span style="color:rgb(74,74,74)"><span style="font-family:tahoma;font-size:13px;color:#858585;margin:0;padding-bottom:5px">Accommodation,${formatServices(services)}</span></span><br>
                                                                                </td>
                                                                            </tr>
                                                                        </tbody>
                                                                    </table>
                                                                </td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </td>
                            </tr>

                            <!-- Terms & Conditions -->
                            <tr>
                                <td width="100%" style="padding:0 30.0px">
                                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                        <tbody>
                                            <tr>
                                                <td style="padding:15.0px 0" width="100%">
                                                    <table class="stack-t" cellspacing="0" cellpadding="0" border="0" align="left" width="170">
                                                        <tbody>
                                                            <tr>
                                                                <td style="padding:5.0px 0" align="left" width="100%">
                                                                    <table cellpadding="0" cellspacing="0" width="100%">
                                                                        <tbody>
                                                                            <tr>
                                                                                <td width="30%"><span style="color:rgb(74,74,74)"><b><span style="font-family:Helvetica,arial,sans-serif"><span style="color:#f59f0d;font-weight:bold">Terms &amp; Conditions :</span></span></b></span><br></td>
                                                                            </tr>
                                                                        </tbody>
                                                                    </table>
                                                                </td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                    <table class="stack-t" cellspacing="0" cellpadding="0" border="0" align="left" width="370">
                                                        <tbody>
                                                            <tr>
                                                                <td style="padding-bottom:5.0px" align="left" width="100%">
                                                                    <table cellpadding="0" cellspacing="0" width="100%">
                                                                        <tbody>
                                                                            <tr>
                                                                                <td>
                                                                                    <p style="font-family:tahoma;font-size:13px;color:#858585;margin:0;padding-bottom:5px;text-align:justify">
                                                                                        <span style="color:rgb(74,74,74)"><span style="font-family:Helvetica,arial,sans-serif"><span style="font-family:tahoma;font-size:13px;color:#858585;margin:0;padding-bottom:5px">
                                                                                            1. Check in & Check out Time 14:00 PM & 11:00 AM <br>
                                                                                            2. Every guest will have to carry a print of the confirmation along with the company and government photo ID at the time of checking in. <br>
                                                                                            3. Visitors are permitted in the apartment only between 10:00 AM and 7:00 PM  and maximum of One visitors per day is allowed for each apartment. With Prior email approval from the concerned company admin is required for any visitor entry.<br>
                                                                                            4. Cancellation Terms: Kindly visit PAJASA website for cancelation terms & Conditions.  https://www.pajasaapartments.com/terms-and-conditions/  
                                                                                        </span></span></span><br>
                                                                                    </p>
                                                                                </td>
                                                                            </tr>
                                                                        </tbody>
                                                                    </table>
                                                                </td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </td>
                            </tr>

                            <!-- Footer -->
                            <tr>
                                <td style="padding:0 30px"></td>
                            </tr>
                            <tr style="background-color:#f59f0d">
                                <td style="padding:0 30px" width="100%">
                                    <table cellpadding="0" cellspacing="0" border="0" width="100%">
                                        <tbody>
                                            <tr>
                                                <td width="100%" style="padding:15px 0">
                                                    <table width="100%" align="left" border="0" cellpadding="0" cellspacing="0">
                                                        <tbody>
                                                            <tr>
                                                                <td width="100%" align="left" style="padding:5px 0;color:black;text-align:-webkit-center">
                                                                    <table width="90%" cellspacing="0" cellpadding="0">
                                                                        <tbody>
                                                                            <tr style="text-align:-webkit-center">
                                                                                <td>
                                                                                    <div>
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
                                                                                    </div>
                                                                                </td>
                                                                            </tr>
                                                                        </tbody>
                                                                    </table>
                                                                </td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
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

    const { data, error } = await resend.emails.send({
        from: "hosting@pajasa.com",
        // to: [host_email, "accounts@pajasaapartments.com", "ps@pajasaapartments.com"],
        to: ["harshitshukla6388@gmail.com"],
        subject: subject2,
        html,
    });

    return { data, error };
}