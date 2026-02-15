import express from "express";
import createHost from "./api/Hostapi/HostInfo.js";
import { getAllHosts, deleteHost, updateHost } from "./api/Hostapi/hostListPage.js"
import { signup, signin, logout } from "./api/Auth/authController.js";
import { getPinCode, getHost, createProperty } from "./api/Property/propertyinfo.js"
import { Pincode } from "./api/Pincode/Pincodeinfo.js";
import { AllPinCode } from "./api/Pincode/PincodeListPage.js"
import { getallProperty, deleteProperty, getPropertyById, UpdateProperty } from "./api/Property/propertyListPage.js";
import { insertClient } from "./api/Client/Clientinfo.js"
import { ClientListPage, deleteClient, updateClient } from "./api/Client/ClientListPage.js"
import { getClientById } from "./api/Client/ClientListPage.js";
import { ClientList, getProperty, checkRoomAvailability, saveReservation, getReservationById, updateReservation } from "./api/ReservationManagement/ReservationInfo.js"
import { getAllReservations, deleteReservation } from "./api/ReservationManagement/ReservationListPage.js"
import { sendEmail } from "./api/email/resend.js";
import { createInvoice } from "./api/invioce/invioceform.js"
import { getAllInvoices, deleteInvoice, getInvoiceById, updateInvoice, downloadInvoice } from "./api/invioce/invoiceListPage.js"
import { sendInvoiceEmail } from "./api/invioce/invoiceEmail.js";

const router = express.Router();


// Auth
router.post("/signup", signup);
router.post("/signin", signin);
router.post("/logout", logout);



// Host 
router.post("/hosts", createHost);
router.get("/hostsList", getAllHosts);
router.delete("/deleteHost/:id", deleteHost);
router.put("/updateHost/:id", updateHost);


// property


// pinc
router.post("/Pincode", Pincode)
router.get("/AllPinCode", AllPinCode)





router.get("/PinCode", getPinCode);
router.get("/host", getHost);

router.post("/properties", createProperty);


router.get("/properties", getallProperty);
router.get("/property/:id", getPropertyById);
router.put("/updateProperty/:id", UpdateProperty);

router.delete("/deleteProperty/:id", deleteProperty)


// client


router.post("/insertClient", insertClient);

router.get("/clients", ClientListPage);
router.delete("/deleteClient/:id", deleteClient);
router.put("/updateClient/:id", updateClient);
router.get("/client/:id", getClientById);


// Reservation

router.get("/clientRM", ClientList);
router.get("/Property", getProperty);
router.post("/checkRoomAvailability", checkRoomAvailability);
router.post("/Reservation", saveReservation);
router.get("/getReservationById", getReservationById);
router.put("/updateReservation", updateReservation);


// Reservation List

router.get("/getAllReservations", getAllReservations);
router.delete("/deleteReservation", deleteReservation)
router.post("/sendemail", sendEmail);


router.post("/createInvoice", createInvoice)
router.get("/getAllInvoices", getAllInvoices)
router.delete("/deleteInvoice/:id", deleteInvoice)
router.get("/getInvoiceById/:id", getInvoiceById)
router.put("/updateInvoice/:id", updateInvoice)
router.get("/downloadInvoice/:id", downloadInvoice)
router.post("/invoices/send-email", sendInvoiceEmail);



export default router;
