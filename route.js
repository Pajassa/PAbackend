import express from "express";
import createHost from "./api/Hostapi/HostInfo.js";
import { getAllHosts, deleteHost, updateHost } from "./api/Hostapi/hostListPage.js"
import { signup, signin, logout } from "./api/Auth/authController.js";
import { getAllUsers, createUser, updateUser, deleteUser, getPendingUsers, approveUser } from "./api/Auth/userManagementController.js";
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
import { authMiddleware, checkModuleAccess, checkSuperAdmin, checkAdmin } from "./middleware/auth.js";

const router = express.Router();


// Auth (Public)
router.post("/signup", signup);
router.post("/signin", signin);
router.post("/logout", logout);



// Host 
router.post("/hosts", authMiddleware, checkModuleAccess("host"), createHost);
router.get("/hostsList", authMiddleware, checkModuleAccess("host"), getAllHosts);
router.delete("/deleteHost/:id", authMiddleware, checkModuleAccess("host"), deleteHost);
router.put("/updateHost/:id", authMiddleware, checkModuleAccess("host"), updateHost);


// property
router.post("/Pincode", authMiddleware, checkModuleAccess("property"), Pincode)
router.get("/AllPinCode", authMiddleware, checkModuleAccess("property"), AllPinCode)
router.get("/PinCode", authMiddleware, checkModuleAccess("property"), getPinCode);
router.get("/host", authMiddleware, checkModuleAccess("property"), getHost);
router.post("/properties", authMiddleware, checkModuleAccess("property"), createProperty);
router.get("/properties", authMiddleware, checkModuleAccess("property"), getallProperty);
router.get("/property/:id", authMiddleware, checkModuleAccess("property"), getPropertyById);
router.put("/updateProperty/:id", authMiddleware, checkModuleAccess("property"), UpdateProperty);
router.delete("/deleteProperty/:id", authMiddleware, checkModuleAccess("property"), deleteProperty)


// client
router.post("/insertClient", authMiddleware, checkModuleAccess("client"), insertClient);
router.get("/clients", authMiddleware, checkModuleAccess("client"), ClientListPage);
router.delete("/deleteClient/:id", authMiddleware, checkModuleAccess("client"), deleteClient);
router.put("/updateClient/:id", authMiddleware, checkModuleAccess("client"), updateClient);
router.get("/client/:id", authMiddleware, checkModuleAccess("client"), getClientById);


// Reservation
router.get("/clientRM", authMiddleware, checkModuleAccess("reservation"), ClientList);
router.get("/Property", authMiddleware, checkModuleAccess("reservation"), getProperty);
router.post("/checkRoomAvailability", authMiddleware, checkModuleAccess("reservation"), checkRoomAvailability);
router.post("/Reservation", authMiddleware, checkModuleAccess("reservation"), saveReservation);
router.get("/getReservationById", authMiddleware, checkModuleAccess("reservation"), getReservationById);
router.put("/updateReservation", authMiddleware, checkModuleAccess("reservation"), updateReservation);


// Reservation List
router.get("/getAllReservations", authMiddleware, checkModuleAccess("reservation"), getAllReservations);
router.delete("/deleteReservation", authMiddleware, checkModuleAccess("reservation"), deleteReservation)
router.post("/sendemail", authMiddleware, checkModuleAccess("reservation"), sendEmail);


// Invoice
router.post("/createInvoice", authMiddleware, checkModuleAccess("invoice"), createInvoice)
router.get("/getAllInvoices", authMiddleware, checkModuleAccess("invoice"), getAllInvoices)
router.delete("/deleteInvoice/:id", authMiddleware, checkModuleAccess("invoice"), deleteInvoice)
router.get("/getInvoiceById/:id", authMiddleware, checkModuleAccess("invoice"), getInvoiceById)
router.put("/updateInvoice/:id", authMiddleware, checkModuleAccess("invoice"), updateInvoice)
router.get("/downloadInvoice/:id", authMiddleware, checkModuleAccess("invoice"), downloadInvoice)
router.post("/invoices/send-email", authMiddleware, checkModuleAccess("invoice"), sendInvoiceEmail);



// User Management
router.get("/users", authMiddleware, checkAdmin, getAllUsers);
router.post("/users", authMiddleware, checkAdmin, createUser);
router.put("/users/:id", authMiddleware, checkAdmin, updateUser);
router.delete("/users/:id", authMiddleware, checkAdmin, deleteUser);

// User Approvals (Super Admin Only)
router.get("/users/pending", authMiddleware, checkSuperAdmin, getPendingUsers);
router.post("/users/:id/approve", authMiddleware, checkSuperAdmin, approveUser);

export default router;
