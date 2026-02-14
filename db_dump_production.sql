--
-- PostgreSQL database dump
--

\restrict du9ei23wcaBUmc5TO2zhrC6pHh5uxbz1XUgEllaHqEkLQSaxcjlLEUw0c2NTmnD

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: masteruser
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO masteruser;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: masteruser
--

COMMENT ON SCHEMA public IS '';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: booking_history; Type: TABLE; Schema: public; Owner: masteruser
--

CREATE TABLE public.booking_history (
    id integer NOT NULL,
    reservation_id integer,
    check_in_date date,
    check_out_date date,
    status character varying(50),
    modification_tags text,
    total_tariff numeric(10,2),
    changed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    changed_by character varying(255),
    snapshot jsonb,
    snapshot_data jsonb
);


ALTER TABLE public.booking_history OWNER TO masteruser;

--
-- Name: booking_history_id_seq; Type: SEQUENCE; Schema: public; Owner: masteruser
--

CREATE SEQUENCE public.booking_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.booking_history_id_seq OWNER TO masteruser;

--
-- Name: booking_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: masteruser
--

ALTER SEQUENCE public.booking_history_id_seq OWNED BY public.booking_history.id;


--
-- Name: clients; Type: TABLE; Schema: public; Owner: masteruser
--

CREATE TABLE public.clients (
    id integer NOT NULL,
    active boolean DEFAULT true,
    client_name character varying(255),
    gst_no character varying(50),
    street_address text,
    street_address_2 text,
    city character varying(100),
    state character varying(100),
    zip_code character varying(20),
    phone_number character varying(20),
    fax_number character varying(20),
    mobile_number character varying(20),
    email_address character varying(255),
    web_address character varying(255),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.clients OWNER TO masteruser;

--
-- Name: clients_id_seq; Type: SEQUENCE; Schema: public; Owner: masteruser
--

CREATE SEQUENCE public.clients_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.clients_id_seq OWNER TO masteruser;

--
-- Name: clients_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: masteruser
--

ALTER SEQUENCE public.clients_id_seq OWNED BY public.clients.id;


--
-- Name: guest_booking_timelines; Type: TABLE; Schema: public; Owner: masteruser
--

CREATE TABLE public.guest_booking_timelines (
    id integer NOT NULL,
    reservation_id integer NOT NULL,
    guest_id integer,
    guest_name character varying(255),
    previous_checkout_date date,
    new_checkout_date date,
    status character varying(50),
    changed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    changed_by character varying(255) DEFAULT 'System'::character varying
);


ALTER TABLE public.guest_booking_timelines OWNER TO masteruser;

--
-- Name: guest_booking_timelines_id_seq; Type: SEQUENCE; Schema: public; Owner: masteruser
--

CREATE SEQUENCE public.guest_booking_timelines_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.guest_booking_timelines_id_seq OWNER TO masteruser;

--
-- Name: guest_booking_timelines_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: masteruser
--

ALTER SEQUENCE public.guest_booking_timelines_id_seq OWNED BY public.guest_booking_timelines.id;


--
-- Name: host_gst_numbers; Type: TABLE; Schema: public; Owner: masteruser
--

CREATE TABLE public.host_gst_numbers (
    gst_id integer NOT NULL,
    host_id integer NOT NULL,
    gst_number character varying(20) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.host_gst_numbers OWNER TO masteruser;

--
-- Name: host_gst_numbers_gst_id_seq; Type: SEQUENCE; Schema: public; Owner: masteruser
--

CREATE SEQUENCE public.host_gst_numbers_gst_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.host_gst_numbers_gst_id_seq OWNER TO masteruser;

--
-- Name: host_gst_numbers_gst_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: masteruser
--

ALTER SEQUENCE public.host_gst_numbers_gst_id_seq OWNED BY public.host_gst_numbers.gst_id;


--
-- Name: host_information; Type: TABLE; Schema: public; Owner: masteruser
--

CREATE TABLE public.host_information (
    host_id integer NOT NULL,
    host_name character varying(100) NOT NULL,
    host_pan_number character varying(20) NOT NULL,
    rating numeric(2,1),
    host_email character varying(100) NOT NULL,
    host_contact_number character varying(15) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    host_owner_name character varying(100),
    CONSTRAINT host_information_rating_check CHECK (((rating >= (0)::numeric) AND (rating <= (5)::numeric)))
);


ALTER TABLE public.host_information OWNER TO masteruser;

--
-- Name: host_information_host_id_seq; Type: SEQUENCE; Schema: public; Owner: masteruser
--

CREATE SEQUENCE public.host_information_host_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.host_information_host_id_seq OWNER TO masteruser;

--
-- Name: host_information_host_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: masteruser
--

ALTER SEQUENCE public.host_information_host_id_seq OWNED BY public.host_information.host_id;


--
-- Name: invoice_items; Type: TABLE; Schema: public; Owner: masteruser
--

CREATE TABLE public.invoice_items (
    id bigint NOT NULL,
    invoice_id bigint NOT NULL,
    location character varying(255),
    description character varying(255),
    hsn_sac_code character varying(50),
    days integer DEFAULT 0,
    rate numeric(15,2) DEFAULT 0.00,
    tax_amount numeric(15,2) DEFAULT 0.00,
    total_amount numeric(15,2) DEFAULT 0.00,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.invoice_items OWNER TO masteruser;

--
-- Name: invoice_items_id_seq; Type: SEQUENCE; Schema: public; Owner: masteruser
--

CREATE SEQUENCE public.invoice_items_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.invoice_items_id_seq OWNER TO masteruser;

--
-- Name: invoice_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: masteruser
--

ALTER SEQUENCE public.invoice_items_id_seq OWNED BY public.invoice_items.id;


--
-- Name: invoice_reservations; Type: TABLE; Schema: public; Owner: masteruser
--

CREATE TABLE public.invoice_reservations (
    invoice_id integer NOT NULL,
    reservation_id integer NOT NULL
);


ALTER TABLE public.invoice_reservations OWNER TO masteruser;

--
-- Name: invoices; Type: TABLE; Schema: public; Owner: masteruser
--

CREATE TABLE public.invoices (
    id bigint NOT NULL,
    invoice_number character varying(255),
    reservation_id bigint,
    invoice_date date,
    invoice_to character varying(255),
    state_for_billing character varying(255) DEFAULT 'Maharashtra'::character varying,
    pan_number character varying(50),
    status character varying(20) DEFAULT 'Draft'::character varying,
    payment_method character varying(50),
    currency character varying(10) DEFAULT 'INR'::character varying,
    conversion_rate numeric(10,4) DEFAULT 1.0000,
    sub_total numeric(15,2) DEFAULT 0.00,
    tax_total numeric(15,2) DEFAULT 0.00,
    grand_total numeric(15,2) DEFAULT 0.00,
    display_taxes character varying(50) DEFAULT 'SGST & CGST'::character varying,
    display_food_charge boolean DEFAULT true,
    extra_services boolean DEFAULT false,
    services_name character varying(255),
    services_amount numeric(15,2) DEFAULT 0.00,
    pdf_password character varying(255),
    page_break integer DEFAULT 5,
    guest_name_width numeric(5,2) DEFAULT 18.00,
    round_off_value numeric(5,2) DEFAULT 0.00,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT invoices_status_check CHECK (((status)::text = ANY (ARRAY[('Draft'::character varying)::text, ('Sent'::character varying)::text, ('Paid'::character varying)::text, ('Cancelled'::character varying)::text])))
);


ALTER TABLE public.invoices OWNER TO masteruser;

--
-- Name: invoices_id_seq; Type: SEQUENCE; Schema: public; Owner: masteruser
--

CREATE SEQUENCE public.invoices_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.invoices_id_seq OWNER TO masteruser;

--
-- Name: invoices_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: masteruser
--

ALTER SEQUENCE public.invoices_id_seq OWNED BY public.invoices.id;


--
-- Name: pincodes; Type: TABLE; Schema: public; Owner: masteruser
--

CREATE TABLE public.pincodes (
    pincode_id integer NOT NULL,
    pincode integer NOT NULL,
    city character varying(100)
);


ALTER TABLE public.pincodes OWNER TO masteruser;

--
-- Name: pincodes_pincode_id_seq; Type: SEQUENCE; Schema: public; Owner: masteruser
--

CREATE SEQUENCE public.pincodes_pincode_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pincodes_pincode_id_seq OWNER TO masteruser;

--
-- Name: pincodes_pincode_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: masteruser
--

ALTER SEQUENCE public.pincodes_pincode_id_seq OWNED BY public.pincodes.pincode_id;


--
-- Name: properties; Type: TABLE; Schema: public; Owner: masteruser
--

CREATE TABLE public.properties (
    property_id integer NOT NULL,
    property_status character varying(50) NOT NULL,
    host_id integer NOT NULL,
    ivr_number character varying(50),
    pincode_id integer NOT NULL,
    manual_pincode character varying(10),
    city character varying(100),
    location character varying(255),
    post_id character varying(100),
    property_type character varying(50),
    manual_host_name character varying(255),
    contact_person character varying(100),
    contact_number character varying(15),
    email_id character varying(255),
    caretaker_name character varying(100),
    caretaker_number character varying(15),
    note text,
    check_in_time time without time zone,
    check_out_time time without time zone,
    master_bedroom integer,
    common_bedroom integer,
    landmark character varying(255),
    address1 character varying(255),
    address2 character varying(255),
    address3 character varying(255),
    thumbnail text,
    property_url text,
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.properties OWNER TO masteruser;

--
-- Name: properties_property_id_seq; Type: SEQUENCE; Schema: public; Owner: masteruser
--

CREATE SEQUENCE public.properties_property_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.properties_property_id_seq OWNER TO masteruser;

--
-- Name: properties_property_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: masteruser
--

ALTER SEQUENCE public.properties_property_id_seq OWNED BY public.properties.property_id;


--
-- Name: property_rooms; Type: TABLE; Schema: public; Owner: masteruser
--

CREATE TABLE public.property_rooms (
    id integer NOT NULL,
    property_id integer,
    room_type character varying(50) NOT NULL,
    room_name character varying(100),
    max_occupancy integer DEFAULT 2,
    is_active boolean DEFAULT true
);


ALTER TABLE public.property_rooms OWNER TO masteruser;

--
-- Name: property_rooms_id_seq; Type: SEQUENCE; Schema: public; Owner: masteruser
--

CREATE SEQUENCE public.property_rooms_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.property_rooms_id_seq OWNER TO masteruser;

--
-- Name: property_rooms_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: masteruser
--

ALTER SEQUENCE public.property_rooms_id_seq OWNED BY public.property_rooms.id;


--
-- Name: reservation_additional_guests; Type: TABLE; Schema: public; Owner: masteruser
--

CREATE TABLE public.reservation_additional_guests (
    id integer NOT NULL,
    reservation_id integer,
    guest_name character varying(255),
    cid date,
    cod date,
    room_type character varying(100),
    occupancy character varying(50),
    address text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    email character varying(255),
    contact_number character varying(20),
    status character varying(50) DEFAULT 'active'::character varying
);


ALTER TABLE public.reservation_additional_guests OWNER TO masteruser;

--
-- Name: reservation_additional_guests_id_seq; Type: SEQUENCE; Schema: public; Owner: masteruser
--

CREATE SEQUENCE public.reservation_additional_guests_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.reservation_additional_guests_id_seq OWNER TO masteruser;

--
-- Name: reservation_additional_guests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: masteruser
--

ALTER SEQUENCE public.reservation_additional_guests_id_seq OWNED BY public.reservation_additional_guests.id;


--
-- Name: reservation_additional_info; Type: TABLE; Schema: public; Owner: masteruser
--

CREATE TABLE public.reservation_additional_info (
    id integer NOT NULL,
    reservation_id integer,
    host_name character varying(255),
    host_email character varying(255),
    host_base_rate numeric(10,2),
    host_taxes numeric(10,2),
    host_total_amount numeric(10,2),
    contact_person character varying(255),
    contact_number character varying(20),
    comments text,
    services jsonb,
    note text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    apartment_type character varying(255) DEFAULT ''::character varying NOT NULL,
    host_payment_mode character varying(255) DEFAULT ''::character varying NOT NULL
);


ALTER TABLE public.reservation_additional_info OWNER TO masteruser;

--
-- Name: reservation_additional_info_id_seq; Type: SEQUENCE; Schema: public; Owner: masteruser
--

CREATE SEQUENCE public.reservation_additional_info_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.reservation_additional_info_id_seq OWNER TO masteruser;

--
-- Name: reservation_additional_info_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: masteruser
--

ALTER SEQUENCE public.reservation_additional_info_id_seq OWNED BY public.reservation_additional_info.id;


--
-- Name: reservation_history; Type: TABLE; Schema: public; Owner: masteruser
--

CREATE TABLE public.reservation_history (
    history_id integer NOT NULL,
    reservation_id integer,
    action_type character varying(50),
    modification_tag character varying(100),
    previous_check_in date,
    previous_check_out date,
    previous_total_tariff numeric(10,2),
    previous_status character varying(50),
    previous_guest_name character varying(255),
    previous_occupancy integer,
    changed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.reservation_history OWNER TO masteruser;

--
-- Name: reservation_history_history_id_seq; Type: SEQUENCE; Schema: public; Owner: masteruser
--

CREATE SEQUENCE public.reservation_history_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.reservation_history_history_id_seq OWNER TO masteruser;

--
-- Name: reservation_history_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: masteruser
--

ALTER SEQUENCE public.reservation_history_history_id_seq OWNED BY public.reservation_history.history_id;


--
-- Name: reservation_versions; Type: TABLE; Schema: public; Owner: masteruser
--

CREATE TABLE public.reservation_versions (
    id integer NOT NULL,
    reservation_id integer,
    change_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    snapshot_data jsonb,
    changed_by character varying(255)
);


ALTER TABLE public.reservation_versions OWNER TO masteruser;

--
-- Name: reservation_versions_id_seq; Type: SEQUENCE; Schema: public; Owner: masteruser
--

CREATE SEQUENCE public.reservation_versions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.reservation_versions_id_seq OWNER TO masteruser;

--
-- Name: reservation_versions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: masteruser
--

ALTER SEQUENCE public.reservation_versions_id_seq OWNED BY public.reservation_versions.id;


--
-- Name: reservations; Type: TABLE; Schema: public; Owner: masteruser
--

CREATE TABLE public.reservations (
    id integer NOT NULL,
    reservation_no character varying(50) NOT NULL,
    client_id integer,
    property_id integer,
    guest_name character varying(255) NOT NULL,
    guest_email text,
    contact_number character varying(20),
    check_in_date date NOT NULL,
    check_out_date date NOT NULL,
    check_in_time time without time zone DEFAULT '12:00:00'::time without time zone,
    check_out_time time without time zone DEFAULT '11:00:00'::time without time zone,
    occupancy character varying,
    base_rate numeric(10,2),
    taxes numeric(10,2),
    total_tariff numeric(10,2),
    payment_mode character varying(50),
    tariff_type character varying(50),
    chargeable_days integer,
    admin_email character varying(255),
    status character varying(20) DEFAULT 'active'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    email_status character varying(50) DEFAULT 'Unsent'::character varying,
    modification_status character varying(50),
    modification_tag character varying(50),
    modification_tags text
);


ALTER TABLE public.reservations OWNER TO masteruser;

--
-- Name: reservations_id_seq; Type: SEQUENCE; Schema: public; Owner: masteruser
--

CREATE SEQUENCE public.reservations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.reservations_id_seq OWNER TO masteruser;

--
-- Name: reservations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: masteruser
--

ALTER SEQUENCE public.reservations_id_seq OWNED BY public.reservations.id;


--
-- Name: room_bookings; Type: TABLE; Schema: public; Owner: masteruser
--

CREATE TABLE public.room_bookings (
    id integer NOT NULL,
    reservation_id integer,
    room_type character varying(50) NOT NULL,
    property_id integer,
    check_in_date date NOT NULL,
    check_out_date date NOT NULL,
    status character varying(20) DEFAULT 'active'::character varying
);


ALTER TABLE public.room_bookings OWNER TO masteruser;

--
-- Name: room_bookings_id_seq; Type: SEQUENCE; Schema: public; Owner: masteruser
--

CREATE SEQUENCE public.room_bookings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.room_bookings_id_seq OWNER TO masteruser;

--
-- Name: room_bookings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: masteruser
--

ALTER SEQUENCE public.room_bookings_id_seq OWNED BY public.room_bookings.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: masteruser
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.users OWNER TO masteruser;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: masteruser
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO masteruser;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: masteruser
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: booking_history id; Type: DEFAULT; Schema: public; Owner: masteruser
--

ALTER TABLE ONLY public.booking_history ALTER COLUMN id SET DEFAULT nextval('public.booking_history_id_seq'::regclass);


--
-- Name: clients id; Type: DEFAULT; Schema: public; Owner: masteruser
--

ALTER TABLE ONLY public.clients ALTER COLUMN id SET DEFAULT nextval('public.clients_id_seq'::regclass);


--
-- Name: guest_booking_timelines id; Type: DEFAULT; Schema: public; Owner: masteruser
--

ALTER TABLE ONLY public.guest_booking_timelines ALTER COLUMN id SET DEFAULT nextval('public.guest_booking_timelines_id_seq'::regclass);


--
-- Name: host_gst_numbers gst_id; Type: DEFAULT; Schema: public; Owner: masteruser
--

ALTER TABLE ONLY public.host_gst_numbers ALTER COLUMN gst_id SET DEFAULT nextval('public.host_gst_numbers_gst_id_seq'::regclass);


--
-- Name: host_information host_id; Type: DEFAULT; Schema: public; Owner: masteruser
--

ALTER TABLE ONLY public.host_information ALTER COLUMN host_id SET DEFAULT nextval('public.host_information_host_id_seq'::regclass);


--
-- Name: invoice_items id; Type: DEFAULT; Schema: public; Owner: masteruser
--

ALTER TABLE ONLY public.invoice_items ALTER COLUMN id SET DEFAULT nextval('public.invoice_items_id_seq'::regclass);


--
-- Name: invoices id; Type: DEFAULT; Schema: public; Owner: masteruser
--

ALTER TABLE ONLY public.invoices ALTER COLUMN id SET DEFAULT nextval('public.invoices_id_seq'::regclass);


--
-- Name: pincodes pincode_id; Type: DEFAULT; Schema: public; Owner: masteruser
--

ALTER TABLE ONLY public.pincodes ALTER COLUMN pincode_id SET DEFAULT nextval('public.pincodes_pincode_id_seq'::regclass);


--
-- Name: properties property_id; Type: DEFAULT; Schema: public; Owner: masteruser
--

ALTER TABLE ONLY public.properties ALTER COLUMN property_id SET DEFAULT nextval('public.properties_property_id_seq'::regclass);


--
-- Name: property_rooms id; Type: DEFAULT; Schema: public; Owner: masteruser
--

ALTER TABLE ONLY public.property_rooms ALTER COLUMN id SET DEFAULT nextval('public.property_rooms_id_seq'::regclass);


--
-- Name: reservation_additional_guests id; Type: DEFAULT; Schema: public; Owner: masteruser
--

ALTER TABLE ONLY public.reservation_additional_guests ALTER COLUMN id SET DEFAULT nextval('public.reservation_additional_guests_id_seq'::regclass);


--
-- Name: reservation_additional_info id; Type: DEFAULT; Schema: public; Owner: masteruser
--

ALTER TABLE ONLY public.reservation_additional_info ALTER COLUMN id SET DEFAULT nextval('public.reservation_additional_info_id_seq'::regclass);


--
-- Name: reservation_history history_id; Type: DEFAULT; Schema: public; Owner: masteruser
--

ALTER TABLE ONLY public.reservation_history ALTER COLUMN history_id SET DEFAULT nextval('public.reservation_history_history_id_seq'::regclass);


--
-- Name: reservation_versions id; Type: DEFAULT; Schema: public; Owner: masteruser
--

ALTER TABLE ONLY public.reservation_versions ALTER COLUMN id SET DEFAULT nextval('public.reservation_versions_id_seq'::regclass);


--
-- Name: reservations id; Type: DEFAULT; Schema: public; Owner: masteruser
--

ALTER TABLE ONLY public.reservations ALTER COLUMN id SET DEFAULT nextval('public.reservations_id_seq'::regclass);


--
-- Name: room_bookings id; Type: DEFAULT; Schema: public; Owner: masteruser
--

ALTER TABLE ONLY public.room_bookings ALTER COLUMN id SET DEFAULT nextval('public.room_bookings_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: masteruser
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: booking_history; Type: TABLE DATA; Schema: public; Owner: masteruser
--

COPY public.booking_history (id, reservation_id, check_in_date, check_out_date, status, modification_tags, total_tariff, changed_at, changed_by, snapshot, snapshot_data) FROM stdin;
4	50	2026-01-12	2026-01-13	Extended	\N	0.00	2026-01-24 16:33:31.419037	\N	\N	{"id": 50, "taxes": "0.00", "status": "Extended", "base_rate": "0.00", "client_id": 2, "occupancy": "", "created_at": "2026-01-13T11:09:02.350Z", "guest_name": "Seed Guest 10", "admin_email": "", "guest_email": "", "property_id": 9, "tariff_type": "", "email_status": "Sent", "payment_mode": "", "total_tariff": "0.00", "check_in_date": "2026-01-11T18:30:00.000Z", "check_in_time": "12:00:00", "roomSelection": null, "check_out_date": "2026-01-12T18:30:00.000Z", "check_out_time": "11:00:00", "contact_number": "", "reservation_no": "RES-SEED-1768322342621-9", "chargeable_days": 0, "additionalGuests": [{"id": 32, "cid": "2026-01-13", "cod": "2026-01-17", "email": null, "address": null, "roomType": null, "guestName": "sp", "occupancy": null, "contactNumber": null}], "modification_tag": null, "modification_tags": null, "modification_status": null}
6	41	2026-01-13	2026-01-14	Confirmed	\N	\N	2026-01-24 17:10:01.660774	\N	\N	{"id": 41, "taxes": null, "status": "Confirmed", "base_rate": null, "client_id": 2, "occupancy": null, "created_at": "2026-01-13T11:08:59.629Z", "guest_name": "Seed Guest 1", "admin_email": null, "guest_email": null, "property_id": 9, "tariff_type": null, "check_in_str": "2026-01-13", "email_status": "Unsent", "payment_mode": null, "total_tariff": null, "check_in_date": "2026-01-12T18:30:00.000Z", "check_in_time": "12:00:00", "check_out_str": "2026-01-14", "roomSelection": null, "check_out_date": "2026-01-13T18:30:00.000Z", "check_out_time": "11:00:00", "contact_number": null, "reservation_no": "PAR-25-12-000099", "chargeable_days": null, "additionalGuests": null, "modification_tag": null, "modification_tags": null, "modification_status": null}
7	41	2026-01-02	2026-01-14	Modified	Preponed	11.00	2026-01-24 17:13:42.412929	\N	\N	{"id": 41, "taxes": "0.00", "status": "Modified", "base_rate": "11.00", "client_id": 2, "occupancy": "1", "created_at": "2026-01-13T11:08:59.629Z", "guest_name": "Seed Guest 1", "admin_email": "", "guest_email": "info@brightfuture.com, ps@pajasaapartments.com, accounts@pajasaapartments.com", "property_id": 9, "tariff_type": "As Per Contract", "check_in_str": "2026-01-02", "email_status": "Unsent", "payment_mode": "Direct Payment", "total_tariff": "11.00", "check_in_date": "2026-01-01T18:30:00.000Z", "check_in_time": "12:00:00", "check_out_str": "2026-01-14", "roomSelection": ["Master Bedroom-1"], "check_out_date": "2026-01-13T18:30:00.000Z", "check_out_time": "11:00:00", "contact_number": "9001122334", "reservation_no": "PAR-25-12-000099", "chargeable_days": 12, "additionalGuests": null, "modification_tag": null, "modification_tags": "Preponed", "modification_status": null}
8	44	2026-01-10	2026-01-14	Modified	\N	0.00	2026-01-24 17:45:45.01342	\N	\N	{"id": 44, "taxes": "0.00", "status": "Modified", "base_rate": "0.00", "client_id": 2, "occupancy": "1", "created_at": "2026-01-13T11:09:00.549Z", "guest_name": "Seed Guest 4", "admin_email": "fgfdgfdgfd", "guest_email": "info@brightfuture.com, ps@pajasaapartments.com, accounts@pajasaapartments.com", "property_id": 9, "tariff_type": "As Per Contract", "check_in_str": "2026-01-10", "email_status": "Sent", "payment_mode": "Direct Payment", "total_tariff": "0.00", "check_in_date": "2026-01-09T18:30:00.000Z", "check_in_time": "12:00:00", "check_out_str": "2026-01-14", "roomSelection": ["Master Bedroom-1"], "check_out_date": "2026-01-13T18:30:00.000Z", "check_out_time": "11:00:00", "contact_number": "dfgdfggdgfg", "reservation_no": "RES-SEED-1768322340843-3", "chargeable_days": 4, "additionalGuests": null, "modification_tag": null, "modification_tags": null, "modification_status": "Preponed"}
9	44	2026-01-02	2026-01-14	Modified	Preponed	0.00	2026-01-24 17:50:19.554332	\N	\N	{"id": 44, "taxes": "0.00", "status": "Modified", "base_rate": "0.00", "client_id": 2, "occupancy": "1", "created_at": "2026-01-13T11:09:00.549Z", "guest_name": "Seed Guest 4", "admin_email": "fgfdgfdgfd", "guest_email": "info@brightfuture.com, ps@pajasaapartments.com, accounts@pajasaapartments.com", "property_id": 9, "tariff_type": "As Per Contract", "check_in_str": "2026-01-02", "email_status": "Sent", "payment_mode": "Direct Payment", "total_tariff": "0.00", "check_in_date": "2026-01-01T18:30:00.000Z", "check_in_time": "12:00:00", "check_out_str": "2026-01-14", "roomSelection": ["Master Bedroom-3"], "check_out_date": "2026-01-13T18:30:00.000Z", "check_out_time": "11:00:00", "contact_number": "9001122334", "reservation_no": "RES-SEED-1768322340843-3", "chargeable_days": 12, "additionalGuests": null, "modification_tag": null, "modification_tags": "Preponed", "modification_status": "Preponed"}
10	51	2026-01-01	2026-01-21	Confirmed	\N	13.20	2026-01-24 18:01:45.343652	\N	\N	{"id": 51, "taxes": "10.00", "status": "Confirmed", "base_rate": "12.00", "client_id": 14, "occupancy": "2", "created_at": "2026-01-24T12:28:41.642Z", "guest_name": "shubham", "admin_email": "", "guest_email": "ps@pajasaapartments.com, accounts@pajasaapartments.com", "property_id": 17, "tariff_type": "As Per Contract", "check_in_str": "2026-01-01", "email_status": "Sent", "payment_mode": "Direct Payment", "total_tariff": "13.20", "check_in_date": "2025-12-31T18:30:00.000Z", "check_in_time": "14:00:00", "check_out_str": "2026-01-21", "roomSelection": ["Master Bedroom-1"], "check_out_date": "2026-01-20T18:30:00.000Z", "check_out_time": "11:00:00", "contact_number": "9001122334", "reservation_no": "PAR-26-01-000005", "chargeable_days": 20, "additionalGuests": null, "modification_tag": null, "modification_tags": null, "modification_status": null}
11	51	2026-01-13	2026-01-23	Modified	Postponed, Extended	13.20	2026-01-24 18:02:45.718798	\N	\N	{"id": 51, "taxes": "10.00", "status": "Modified", "base_rate": "12.00", "client_id": 14, "occupancy": "2", "created_at": "2026-01-24T12:28:41.642Z", "guest_name": "shubham", "admin_email": "", "guest_email": "ps@pajasaapartments.com, accounts@pajasaapartments.com", "property_id": 17, "tariff_type": "As Per Contract", "check_in_str": "2026-01-13", "email_status": "Sent", "payment_mode": "Direct Payment", "total_tariff": "13.20", "check_in_date": "2026-01-12T18:30:00.000Z", "check_in_time": "14:00:00", "check_out_str": "2026-01-23", "roomSelection": ["Master Bedroom-1"], "check_out_date": "2026-01-22T18:30:00.000Z", "check_out_time": "11:00:00", "contact_number": "7738777602", "reservation_no": "PAR-26-01-000005", "chargeable_days": 10, "additionalGuests": null, "modification_tag": null, "modification_tags": "Postponed, Extended", "modification_status": null}
12	50	2026-01-03	2026-01-12	Cancelled	Preponed, Shortened	0.00	2026-01-24 18:22:03.906003	\N	\N	{"id": 50, "taxes": "0.00", "status": "Cancelled", "base_rate": "0.00", "client_id": 2, "occupancy": "1", "created_at": "2026-01-13T11:09:02.350Z", "guest_name": "Seed Guest 10", "admin_email": "", "guest_email": "fd.kglkf", "property_id": 9, "tariff_type": "As Per Contract", "check_in_str": "2026-01-03", "email_status": "Sent", "payment_mode": "Direct Payment", "total_tariff": "0.00", "check_in_date": "2026-01-02T18:30:00.000Z", "check_in_time": "12:00:00", "check_out_str": "2026-01-12", "roomSelection": null, "check_out_date": "2026-01-11T18:30:00.000Z", "check_out_time": "11:00:00", "contact_number": "893434983439", "reservation_no": "RES-SEED-1768322342621-9", "chargeable_days": 9, "additionalGuests": [{"id": 37, "cid": "2026-01-13", "cod": "2026-01-17", "email": null, "address": null, "roomType": null, "guestName": "sp", "occupancy": null, "contactNumber": null}], "modification_tag": null, "modification_tags": "Preponed, Shortened", "modification_status": null}
13	72	2026-03-22	2026-03-27	active	\N	7434.00	2026-01-25 07:49:03.773068	\N	\N	{"id": 72, "taxes": "18.00", "status": "active", "base_rate": "6300.00", "client_id": 3, "occupancy": "2", "created_at": "2026-01-25T02:17:01.529Z", "guest_name": "Deepika Nair", "admin_email": "ps@pajasaapartments.com", "guest_email": "deepika.nair@solutions.com", "property_id": 20, "tariff_type": "As Per Email", "check_in_str": "2026-03-22", "email_status": "Unsent", "payment_mode": "Direct Payment", "total_tariff": "7434.00", "check_in_date": "2026-03-21T18:30:00.000Z", "check_in_time": "14:00:00", "check_out_str": "2026-03-27", "roomSelection": ["Master Bedroom-1"], "check_out_date": "2026-03-26T18:30:00.000Z", "check_out_time": "11:00:00", "contact_number": "+919876543318", "reservation_no": "RES-CONF-1769327205766-018", "chargeable_days": 5, "additionalGuests": null, "modification_tag": null, "modification_tags": null, "modification_status": null}
14	72	2026-03-07	2026-03-27	Modified	Preponed	7434.00	2026-01-25 07:49:35.114999	\N	\N	{"id": 72, "taxes": "18.00", "status": "Modified", "base_rate": "6300.00", "client_id": 3, "occupancy": "2", "created_at": "2026-01-25T02:17:01.529Z", "guest_name": "Deepika Nair", "admin_email": "ps@pajasaapartments.com", "guest_email": "deepika.nair@solutions.com", "property_id": 20, "tariff_type": "As Per Email", "check_in_str": "2026-03-07", "email_status": "Unsent", "payment_mode": "Direct Payment", "total_tariff": "7434.00", "check_in_date": "2026-03-06T18:30:00.000Z", "check_in_time": "14:00:00", "check_out_str": "2026-03-27", "roomSelection": ["Master Bedroom-1"], "check_out_date": "2026-03-26T18:30:00.000Z", "check_out_time": "11:00:00", "contact_number": "9820736442", "reservation_no": "RES-CONF-1769327205766-018", "chargeable_days": 20, "additionalGuests": null, "modification_tag": null, "modification_tags": "Preponed", "modification_status": null}
15	41	2026-01-10	2026-01-14	Modified	Postponed	11.00	2026-01-25 07:53:52.254054	\N	\N	{"id": 41, "taxes": "0.00", "status": "Modified", "base_rate": "11.00", "client_id": 2, "occupancy": "1", "created_at": "2026-01-13T11:08:59.629Z", "guest_name": "Seed Guest 1", "admin_email": "", "guest_email": "info@brightfuture.com, ps@pajasaapartments.com, accounts@pajasaapartments.com", "property_id": 9, "tariff_type": "As Per Contract", "check_in_str": "2026-01-10", "email_status": "Sent", "payment_mode": "Direct Payment", "total_tariff": "11.00", "check_in_date": "2026-01-09T18:30:00.000Z", "check_in_time": "12:00:00", "check_out_str": "2026-01-14", "roomSelection": ["Master Bedroom-1"], "check_out_date": "2026-01-13T18:30:00.000Z", "check_out_time": "11:00:00", "contact_number": "9001122334", "reservation_no": "PAR-25-12-000099", "chargeable_days": 4, "additionalGuests": null, "modification_tag": null, "modification_tags": "Postponed", "modification_status": null}
16	67	2026-03-07	2026-03-13	active	\N	8850.00	2026-01-26 17:56:08.208662	\N	\N	{"id": 67, "taxes": "18.00", "status": "active", "base_rate": "7500.00", "client_id": 3, "occupancy": "2", "created_at": "2026-01-25T02:16:53.106Z", "guest_name": "Amit Kumar", "admin_email": "ps@pajasaapartments.com", "guest_email": "amit.kumar@solutions.com", "property_id": 14, "tariff_type": "As Per Contract", "check_in_str": "2026-03-07", "email_status": "Unsent", "payment_mode": "Bill to Company", "total_tariff": "8850.00", "check_in_date": "2026-03-06T18:30:00.000Z", "check_in_time": "14:00:00", "check_out_str": "2026-03-13", "roomSelection": ["Master Bedroom-1"], "check_out_date": "2026-03-12T18:30:00.000Z", "check_out_time": "11:00:00", "contact_number": "+919876543313", "reservation_no": "RES-CONF-1769327205766-013", "chargeable_days": 6, "additionalGuests": null, "modification_tag": null, "modification_tags": null, "modification_status": null}
17	75	2026-01-07	2026-01-29	Confirmed	\N	159.60	2026-01-26 18:22:36.876269	\N	\N	{"id": 75, "taxes": "33.00", "status": "Confirmed", "base_rate": "120.00", "client_id": 26, "occupancy": "1", "created_at": "2026-01-26T18:21:30.299Z", "guest_name": "shubham", "admin_email": "harshitshukla6388@gmail.com", "guest_email": "accounts@pajasaapartments.com, ps@pajasaapartments.com, accounts@pajasaapartments.com", "property_id": 32, "tariff_type": "As Per Contract", "check_in_str": "2026-01-07", "email_status": "Unsent", "payment_mode": "Direct Payment", "total_tariff": "159.60", "check_in_date": "2026-01-07T00:00:00.000Z", "check_in_time": "14:00:00", "check_out_str": "2026-01-29", "roomSelection": ["Master Bedroom-1"], "check_out_date": "2026-01-29T00:00:00.000Z", "check_out_time": "11:00:00", "contact_number": "06388293612", "reservation_no": "PAR-26-01-000002", "chargeable_days": 22, "additionalGuests": null, "modification_tag": null, "modification_tags": null, "modification_status": null}
18	75	2026-01-07	2026-01-29	Confirmed		159.60	2026-01-26 18:23:51.926464	\N	\N	{"id": 75, "taxes": "33.00", "status": "Confirmed", "base_rate": "120.00", "client_id": 26, "occupancy": "1", "created_at": "2026-01-26T18:21:30.299Z", "guest_name": "shubham", "admin_email": "harshitshukla6388@gmail.com", "guest_email": "accounts@pajasaapartments.com, ps@pajasaapartments.com, accounts@pajasaapartments.com, spstudytec@gmail.com", "property_id": 32, "tariff_type": "As Per Contract", "check_in_str": "2026-01-07", "email_status": "Sent", "payment_mode": "Direct Payment", "total_tariff": "159.60", "check_in_date": "2026-01-07T00:00:00.000Z", "check_in_time": "14:00:00", "check_out_str": "2026-01-29", "roomSelection": ["Master Bedroom-1"], "check_out_date": "2026-01-29T00:00:00.000Z", "check_out_time": "11:00:00", "contact_number": "9877897988", "reservation_no": "PAR-26-01-000002", "chargeable_days": 22, "additionalGuests": null, "modification_tag": null, "modification_tags": "", "modification_status": null}
19	77	2026-01-27	2026-01-28	Confirmed	\N	5250.00	2026-01-27 12:47:12.537838	\N	\N	{"id": 77, "taxes": "5.00", "status": "Confirmed", "base_rate": "5000.00", "client_id": 52, "occupancy": "2", "created_at": "2026-01-27T12:43:39.720Z", "guest_name": "Liliies + Daisies", "admin_email": "", "guest_email": "ps@pajasaapartments.com, accounts@pajasaapartments.com", "property_id": 34, "tariff_type": "As Per Contract", "check_in_str": "2026-01-27", "email_status": "Sent", "payment_mode": "Bill to Company", "total_tariff": "5250.00", "check_in_date": "2026-01-27T00:00:00.000Z", "check_in_time": "14:00:00", "check_out_str": "2026-01-28", "roomSelection": ["Master Bedroom-1"], "check_out_date": "2026-01-28T00:00:00.000Z", "check_out_time": "11:00:00", "contact_number": "7894567878", "reservation_no": "PAR-26-01-000004", "chargeable_days": 1, "additionalGuests": null, "modification_tag": null, "modification_tags": null, "modification_status": null}
20	77	2026-01-27	2026-01-29	Modified	Extended	5250.00	2026-01-27 12:49:26.217797	\N	\N	{"id": 77, "taxes": "5.00", "status": "Modified", "base_rate": "5000.00", "client_id": 52, "occupancy": "2", "created_at": "2026-01-27T12:43:39.720Z", "guest_name": "Liliies + Daisies", "admin_email": "", "guest_email": "ps@pajasaapartments.com, accounts@pajasaapartments.com", "property_id": 34, "tariff_type": "As Per Contract", "check_in_str": "2026-01-27", "email_status": "Sent", "payment_mode": "Bill to Company", "total_tariff": "5250.00", "check_in_date": "2026-01-27T00:00:00.000Z", "check_in_time": "14:00:00", "check_out_str": "2026-01-29", "roomSelection": ["Master Bedroom-1"], "check_out_date": "2026-01-29T00:00:00.000Z", "check_out_time": "11:00:00", "contact_number": "1234567891", "reservation_no": "PAR-26-01-000004", "chargeable_days": 2, "additionalGuests": null, "modification_tag": null, "modification_tags": "Extended", "modification_status": null}
21	70	2026-03-16	2026-03-23	active	\N	11210.00	2026-01-31 17:05:08.688813	\N	\N	{"id": 70, "taxes": "18.00", "status": "active", "base_rate": "9500.00", "client_id": 1, "occupancy": "2", "created_at": "2026-01-25T02:17:00.133Z", "guest_name": "Riya Singh", "admin_email": "ps@pajasaapartments.com", "guest_email": "riya.singh@techcorp.com", "property_id": 18, "tariff_type": "As Per Email", "check_in_str": "2026-03-16", "email_status": "Sent", "payment_mode": "Direct Payment", "total_tariff": "11210.00", "check_in_date": "2026-03-15T18:30:00.000Z", "check_in_time": "14:00:00", "check_out_str": "2026-03-23", "roomSelection": ["Master Bedroom-1"], "check_out_date": "2026-03-22T18:30:00.000Z", "check_out_time": "11:00:00", "contact_number": "+919876543316", "reservation_no": "RES-CONF-1769327205766-016", "chargeable_days": 7, "additionalGuests": null, "modification_tag": null, "modification_tags": null, "modification_status": null}
22	81	2026-02-03	2026-02-07	Confirmed	\N	360.15	2026-01-31 20:46:22.381353	\N	\N	{"id": 81, "taxes": "5.00", "status": "Confirmed", "base_rate": "343.00", "client_id": 49, "occupancy": "2", "created_at": "2026-01-31T12:18:09.216Z", "guest_name": "Deepika Nair", "admin_email": "", "guest_email": "ps@pajasaapartments.com, accounts@pajasaapartments.com", "property_id": 18, "tariff_type": "As Per Email", "check_in_str": "2026-02-03", "email_status": "Sent", "payment_mode": "Direct Payment", "total_tariff": "360.15", "check_in_date": "2026-02-02T18:30:00.000Z", "check_in_time": "14:00:00", "check_out_str": "2026-02-07", "roomSelection": ["Master Bedroom-1"], "check_out_date": "2026-02-06T18:30:00.000Z", "check_out_time": "11:00:00", "contact_number": "9820736442", "reservation_no": "PAR-26-01-000006", "chargeable_days": 4, "additionalGuests": null, "modification_tag": null, "modification_tags": null, "modification_status": null}
\.


--
-- Data for Name: clients; Type: TABLE DATA; Schema: public; Owner: masteruser
--

COPY public.clients (id, active, client_name, gst_no, street_address, street_address_2, city, state, zip_code, phone_number, fax_number, mobile_number, email_address, web_address, created_at, updated_at) FROM stdin;
3	f	Green Energy Corp	GSTIN11122	78 Nehru Place	Tower B	Delhi	Delhi	110019	0112233445	0115566778	9123456780	sales@greenenergy.com	http://greenenergy.com	2025-09-11 12:49:19.981009	2025-09-11 12:49:19.981009
7	f	Skyline Constructions	GSTIN99900	88 Builders Colony	Sector 9	Pune	Maharashtra	411001	0206677889	0209988776	9776655443	info@skylineconst.com	http://skylineconst.com	2025-09-11 12:49:19.981009	2025-12-05 01:11:00.478
26	t	Pajasa Apartments 1										accounts@pajasaapartments.com		2025-12-08 11:46:46.174425	2025-12-08 11:46:46.174425
49	f	Sugar Cosmetics												2026-01-03 08:31:31.950705	2026-01-08 17:03:51.525
50	t	Redknee Solutions Private Limited												2026-01-09 12:38:05.440585	2026-01-09 12:38:05.440585
51	t	OneCell Diagnostics India Pvt Ltd												2026-01-12 11:51:54.10376	2026-01-12 11:51:54.10376
22	t	Pajasa Agrro	27AABCF003	307, 3rd Floor	Powai Plaza,	Mumbai	Maharashtra	400076	7738777602		7506024682	pajasaapartments@gmail.com	https://www.pajasaagro.com/	2025-12-08 11:42:19.002647	2025-12-08 11:53:06.273
14	t	First Livingspaces Private Limited	27AABCF0036F1Z6	Raheja Platinum, Road, Off Andheri - Kurla Road, 	Andheri East Marol	Mumbai	Maharashtra	400059						2025-10-10 10:08:59.320037	2025-12-10 08:45:57.412
33	t	BBH communica	27DAPPK6384F1Z6	fghfhj	ghjgh	basti	up	400059	3456789087	45433	46758798	dhsf@gmail.com	hfajdfhjad	2025-12-17 10:37:18.896862	2025-12-17 10:37:18.896862
38	t	Mitsubishi Chemical India Private Limited	27AABCF0045F1Z6	Kasarvadavli	GB Road	Thane	Maharashtra	4000615	124567890		1234567894	jyoti@gmail.com		2025-12-22 11:00:53.663628	2025-12-22 11:01:24.204
43	t	First Livingspaces Prit	27AABCF0036F1Z6	Raheja Platinum, Road, Off Andheri - Kurla Road, 	Andheri East Marol	basti	Maharashtra	400059	3456789087	45433	3456789767	dttthsf@gmail.com	hfajdfhjad	2025-12-22 16:06:41.764602	2025-12-22 16:06:41.764602
45	t	First Livingspaces Private Limited	27AABCF0036F1Z6								3456789767			2025-12-25 07:47:37.751198	2025-12-25 07:47:37.751198
46	t	First Livingspaces Prit	27DAPPK6384F1Z6								3456789767			2025-12-25 07:47:59.985305	2025-12-25 07:47:59.985305
47	t	First Livingspaces Prit			Andheri East Marol									2025-12-25 07:48:20.97597	2025-12-25 07:48:20.97597
48	t	Sokrati Technologies Pvt Ltd												2025-12-26 09:49:54.728877	2025-12-26 09:49:54.728877
2	t	Bright Future Ltd	27AAPFU0939F1ZV	45 Park Street	Opp. City Mall	Mumbai	Maharashtra	400001	0223344577	0226655443	9988776655	info@brightfuture.com	http://brightfuture.com	2025-09-11 12:49:19.981009	2026-01-17 10:55:41.758
1	f	Tech Solutions Pvt Ltd	GSTIN12345	12 MG Road	Near Metro Station	Bangalore	Karnataka	560001	0801234567	0807654321	9876543210	contact@techsolutions.com	http://techsolutions.com	2025-09-11 12:49:19.981009	2026-01-17 10:56:49.742
52	t	Orchid Private Limited												2026-01-27 12:42:14.802914	2026-01-27 12:42:14.802914
\.


--
-- Data for Name: guest_booking_timelines; Type: TABLE DATA; Schema: public; Owner: masteruser
--

COPY public.guest_booking_timelines (id, reservation_id, guest_id, guest_name, previous_checkout_date, new_checkout_date, status, changed_at, changed_by) FROM stdin;
\.


--
-- Data for Name: host_gst_numbers; Type: TABLE DATA; Schema: public; Owner: masteruser
--

COPY public.host_gst_numbers (gst_id, host_id, gst_number, created_at) FROM stdin;
9	18	27ABCDE1234F1Z5	2025-09-08 19:17:14.448819
10	18	29ABCDE1234F1Z7	2025-09-08 19:17:14.486137
13	21	27AAJCS4517L1ZY	2025-09-19 08:55:21.851444
16	26	27AAAAK0187B1Z2	2025-09-20 10:04:13.644697
17	27	27CKQPS1067M2ZB	2025-09-20 10:05:58.422065
18	28	27BOWPS5234R1ZO	2025-09-20 10:06:44.402763
19	29	27AAECO5441Q1ZW	2025-09-20 10:07:32.734831
20	30	27DAPPK6384F1Z6	2025-09-20 10:09:02.559288
22	40	457742584257280	2025-12-07 11:32:22.523551
23	41	27AAHCP7561R1ZH	2025-12-07 12:57:54.791772
24	42	27AFBFS5497K1ZB	2025-12-16 07:12:33.298272
25	43	123456789456125	2026-01-03 08:23:44.114821
26	44	123456789012345	2026-01-09 12:36:00.043093
27	45	22ASMCM6714C1ZH	2026-01-12 11:48:11.543014
28	46	123456789101123	2026-01-27 12:39:58.415115
\.


--
-- Data for Name: host_information; Type: TABLE DATA; Schema: public; Owner: masteruser
--

COPY public.host_information (host_id, host_name, host_pan_number, rating, host_email, host_contact_number, created_at, host_owner_name) FROM stdin;
18	Green Stay Pvt Ltd	AGCDE1234F	4.5	greenstay@example.com	9455315007	2025-09-08 19:17:14.440757	Amit Sharma
20	harshit	ABCDE1234H	1.0	fajhfdklr@gamil.com	7482037594	2025-09-08 19:46:52.958343	poorent shukla
21	PAJASA	AAHCP7561R	3.0	paras@pajasa.com	7738777602	2025-09-19 08:55:21.693253	Paras Sangwan
26	Ashok Deluxe Apartment	AAAAK0187B	4.0	info@ashokdeluxe.com	9833787741	2025-09-20 10:04:13.488774	Heena Mam
23	Veridical Hospitality	AEZPC4308Q	4.0	booking@veridicalhospitality.com	9833168145	2025-09-19 17:23:22.809339	Anindita Mam
27	Staywood Business Accomodation Solution	CKQPS1067M	4.0	operations@staywood.in	9326845060	2025-09-20 10:05:58.262715	Megha Mam
28	Rely On Us	BOWPS5234R	4.0	prashant@relyonservices.in	9820736442	2025-09-20 10:06:44.246525	Prashant Sir
29	OSI Apartments Powai	AAECO5441Q	3.0	sales@osiapartments.in	9766693868	2025-09-20 10:07:32.576018	Prem Sir
30	Welcome Home & Service Apartments	DAPPK6384F	4.0	welcomehomeserviceapartments@gmail.com	7979762299	2025-09-20 10:09:02.401115	Shravan Sir
34	Divine Art House	ANZPM5631K	3.0	emehra00@gmail.com	8050890867	2025-10-10 10:06:20.83362	Eshan Mehra
40	dfjadfhja	DAPPK6384F	2.0	dsfbdsfda@gmail.com	4567890765	2025-12-07 11:32:22.366561	harthist
41	Jyoti Enterprises	AAHCP7561R	4.0	paras@pajasa.com	7293332020	2025-12-07 12:57:54.635693	Jyoti Rajput
42	Shri Shri Corporate Advisors LLP	AFBFS5497K	4.0	accounts@pajasaapartments.com	7506024682	2025-12-16 07:12:33.130105	Pranay
43	Pooja Hospitality	ABCDE1234E	4.0	pooja@gmail.comm	1234567890	2026-01-03 08:23:43.946421	Pooja
44	Ashiana Apartments	ASHUT2364H	3.0	ashu@gmail.com	7894561230	2026-01-09 12:35:59.857309	Ashutosh
45	MH 12 Services	AAMCM6714C	4.0	amit@gmail.com	9877897977	2026-01-12 11:48:11.382533	Amit Batra
46	Daffodil Apartments	ABCDE2436F	3.0	dafff@gmail.com	1234567891	2026-01-27 12:39:58.256988	Daff
\.


--
-- Data for Name: invoice_items; Type: TABLE DATA; Schema: public; Owner: masteruser
--

COPY public.invoice_items (id, invoice_id, location, description, hsn_sac_code, days, rate, tax_amount, total_amount, created_at, updated_at) FROM stdin;
1	1	Powai	0	0	2	4250.00	5.00	4462.50	2025-11-30 23:08:10.784271	2025-11-30 23:08:10.784271
11	11	Dadar	0	0	3	5500.00	5.00	5775.00	2026-01-11 06:04:17.694505	2026-01-11 06:04:17.694505
12	12	Connaught Place	\N	\N	0	0.00	0.00	0.00	2026-01-17 06:19:53.510685	2026-01-17 06:19:53.510685
13	13	Connaught Place	\N	\N	0	0.00	0.00	0.00	2026-01-17 06:19:56.62617	2026-01-17 06:19:56.62617
14	14	Powai	\N	\N	1	4250.00	5.00	4462.50	2026-01-17 06:56:03.29993	2026-01-17 06:56:03.29993
15	15	Powai	\N	\N	1	4250.00	5.00	4462.50	2026-01-17 06:56:05.144228	2026-01-17 06:56:05.144228
16	16	Powai	0	0	6	343.00	5.00	360.15	2026-01-31 21:15:22.929039	2026-01-31 21:15:22.929039
17	17	Powai	0	0	6	343.00	5.00	360.15	2026-01-31 21:15:26.893599	2026-01-31 21:15:26.893599
18	18	Powai	0	0	6	343.00	5.00	360.15	2026-01-31 21:15:26.895057	2026-01-31 21:15:26.895057
19	19	Powai	0	0	6	343.00	5.00	360.15	2026-01-31 21:15:27.701441	2026-01-31 21:15:27.701441
20	20	Powai	0	0	6	343.00	5.00	360.15	2026-01-31 21:15:27.863027	2026-01-31 21:15:27.863027
21	21	Powai	0	0	3	5000.00	5.00	5250.00	2026-01-31 21:36:10.728398	2026-01-31 21:36:10.728398
22	21	Powai	0	0	3	6000.00	5.00	6300.00	2026-01-31 21:36:10.728398	2026-01-31 21:36:10.728398
23	21	Undri	0	0	29	120.00	33.00	159.60	2026-01-31 21:36:10.728398	2026-01-31 21:36:10.728398
24	21	Powai	0	0	3	6000.00	5.00	6300.00	2026-01-31 21:36:10.728398	2026-01-31 21:36:10.728398
25	22	Undri	0	0	29	120.00	33.00	159.60	2026-01-31 21:37:05.228543	2026-01-31 21:37:05.228543
26	22	Dadar	0	0	23	6300.00	18.00	7434.00	2026-01-31 21:37:05.228543	2026-01-31 21:37:05.228543
27	22	Dadar	0	0	23	6300.00	18.00	7434.00	2026-01-31 21:37:05.228543	2026-01-31 21:37:05.228543
\.


--
-- Data for Name: invoice_reservations; Type: TABLE DATA; Schema: public; Owner: masteruser
--

COPY public.invoice_reservations (invoice_id, reservation_id) FROM stdin;
21	77
21	76
21	75
22	75
22	72
\.


--
-- Data for Name: invoices; Type: TABLE DATA; Schema: public; Owner: masteruser
--

COPY public.invoices (id, invoice_number, reservation_id, invoice_date, invoice_to, state_for_billing, pan_number, status, payment_method, currency, conversion_rate, sub_total, tax_total, grand_total, display_taxes, display_food_charge, extra_services, services_name, services_amount, pdf_password, page_break, guest_name_width, round_off_value, created_at, updated_at) FROM stdin;
1	RES1760091410056	5	2025-11-10	Jyoti	Maharashtra		Draft	Select the Payment Method	INR	1.0000	4250.00	5.00	4462.50	SGST & CGST	t	f		0.00		5	18.00	0.00	2025-11-30 23:08:10.784271	2025-11-30 23:08:10.784271
11	PAR-25-12-000006	36	2025-12-24	Makarand	up		Draft	Select the Payment Method	INR	1.0000	5500.00	5.00	5775.00	SGST & CGST	t	f		0.00		5	18.00	0.00	2026-01-11 06:04:17.694505	2026-01-11 06:04:17.694505
12	RES-SEED-1768322342621-9	50	2026-01-12	Seed Guest 10	Maharashtra	\N	Draft	Select the Payment Method	INR	0.0000	0.00	0.00	0.00	SGST & CGST	t	f		0.00		0	18.00	0.00	2026-01-17 06:19:53.510685	2026-01-17 06:19:53.510685
13	RES-SEED-1768322342621-9	50	2026-01-12	Seed Guest 10	Maharashtra	\N	Draft	Select the Payment Method	INR	0.0000	0.00	0.00	0.00	SGST & CGST	t	f		0.00		0	18.00	0.00	2026-01-17 06:19:56.62617	2026-01-17 06:19:56.62617
14	RES1760678996198	6	2025-10-17	Jyoti	Maharashtra	\N	Draft	Select the Payment Method	INR	0.0000	4250.00	5.00	4462.50	SGST & CGST	t	t		0.00		0	18.00	0.00	2026-01-17 06:56:03.29993	2026-01-17 06:56:03.29993
15	RES1760678996198	6	2025-10-17	Jyoti	Maharashtra	\N	Draft	Select the Payment Method	INR	0.0000	4250.00	5.00	4462.50	SGST & CGST	t	t		0.00		0	18.00	0.00	2026-01-17 06:56:05.144228	2026-01-17 06:56:05.144228
16	PAR-26-01-000006	81	2020-02-01	Deepika Nair	Maharashtra		Draft	Select the Payment Method	INR	1.0000	343.00	5.00	360.15	SGST & CGST	t	f		0.00		5	18.00	0.00	2026-01-31 21:15:22.929039	2026-01-31 21:15:22.929039
17	PAR-26-01-000006	81	2020-02-01	Deepika Nair	Maharashtra		Draft	Select the Payment Method	INR	1.0000	343.00	5.00	360.15	SGST & CGST	t	f		0.00		5	18.00	0.00	2026-01-31 21:15:26.893599	2026-01-31 21:15:26.893599
18	PAR-26-01-000006	81	2020-02-01	Deepika Nair	Maharashtra		Draft	Select the Payment Method	INR	1.0000	343.00	5.00	360.15	SGST & CGST	t	f		0.00		5	18.00	0.00	2026-01-31 21:15:26.895057	2026-01-31 21:15:26.895057
19	PAR-26-01-000006	81	2020-02-01	Deepika Nair	Maharashtra		Draft	Select the Payment Method	INR	1.0000	343.00	5.00	360.15	SGST & CGST	t	f		0.00		5	18.00	0.00	2026-01-31 21:15:27.701441	2026-01-31 21:15:27.701441
20	PAR-26-01-000006	81	2020-02-01	Deepika Nair	Maharashtra		Draft	Select the Payment Method	INR	1.0000	343.00	5.00	360.15	SGST & CGST	t	f		0.00		5	18.00	0.00	2026-01-31 21:15:27.863027	2026-01-31 21:15:27.863027
21	PAR-26-01-000004	77	2026-01-26		Maharashtra		Draft	Select the Payment Method	INR	1.0000	17120.00	48.00	18009.60	SGST & CGST	t	f		0.00		5	18.00	0.00	2026-01-31 21:36:10.728398	2026-01-31 21:36:10.728398
22	PAR-26-01-000002	75	2026-01-07		Maharashtra		Draft	Select the Payment Method	INR	1.0000	12720.00	69.00	15027.60	SGST & CGST	t	f		0.00		5	18.00	0.00	2026-01-31 21:37:05.228543	2026-01-31 21:37:05.228543
\.


--
-- Data for Name: pincodes; Type: TABLE DATA; Schema: public; Owner: masteruser
--

COPY public.pincodes (pincode_id, pincode, city) FROM stdin;
2	400051	Mumbai
3	400076	Mumbai
4	400098	Mumbai
5	400028	Mumbai
6	411019	Pune
7	411057	Pune
8	110048	Delhi
9	110024	Delhi
10	560034	Bengaluru
11	500034	Hyderabad
12	500084	Hyderabad
13	500081	Hyderabad
14	122016	Gurugram
15	122009	Gurugram
16	700091	Kolkata
17	700014	Kolkata
18	600040	Chennai
19	600028	Chennai
20	380015	Ahmedabad
21	382213	Ahmedabad
23	400072	Mumbai
25	4000615	Thane
28	560017	Bengaluru
29	122001	Gurgaon
30	400011	Mumbai
32	411060	Pune
\.


--
-- Data for Name: properties; Type: TABLE DATA; Schema: public; Owner: masteruser
--

COPY public.properties (property_id, property_status, host_id, ivr_number, pincode_id, manual_pincode, city, location, post_id, property_type, manual_host_name, contact_person, contact_number, email_id, caretaker_name, caretaker_number, note, check_in_time, check_out_time, master_bedroom, common_bedroom, landmark, address1, address2, address3, thumbnail, property_url, updated_at) FROM stdin;
9	Inactive	20	IVR003	3	\N	Delhi	Connaught Place	POST003	Guest House	\N	Aman Verma	9001122334	aman@example.com	Ravi Singh	9334455667	In the heart of Delhi	13:00:00	09:00:00	4	1	Near Rajiv Chowk Metro	56 Janpath	Opp. Central Park	Block C	thumb3.jpg	http://example.com/property3	2025-12-06 23:39:42.061118
11	active	23		3	\N	Mumbai	powai		3 BHK	\N	Anindita Mam	9833168145	booking@veridicalhospitality.com	Anand	9867105819		11:27:00	10:29:00	1	1	iuoerur	dsfjkdjfdklsf					2025-12-06 23:39:42.061118
14	active	30		11	\N	Hyderabad				\N	Shravan Sir	7979762299	welcomehomeserviceapartments@gmail.com				\N	\N	0	0							2025-12-06 23:39:42.061118
16	active	27		17	\N	Kolkata				\N	Megha Mam	9326845060	operations@staywood.in				\N	\N	0	0							2025-12-06 23:39:42.061118
17	active	21		4	\N	Mumbai	Kalina		3 BHK	\N	Paras Sangwan	7738777602	paras@pajasa.com	Suresh	97692 14725		14:00:00	11:00:00	2	1	Opposite University Campus	B-903 Sanghvi Infenia Kalina,Vidyanagari Marg	Opposite University Campus, Kalina	Santacruz East, Mumbai - 400098			2025-12-06 23:39:42.061118
18	active	23		3	\N	Mumbai	Powai		3 BHK	\N	Anindita Mam	9833168145	booking@veridicalhospitality.com	Anand	98671 05819		14:00:00	11:00:00	3	0	Behind SM Shetty School Powa	504/505,5th Floor, Panch Smruti Tower	Chandivali Farm Road, Behind SM Shetty School 	Powai, Mumbai-400076		https://www.pajasaapartments.com/in/mumbai/powai/3-bhk-service-apartments-in-powai-mumbai/	2025-12-06 23:39:42.061118
19	active	27		4	\N	Mumbai	Santacruz		2 BHK	\N	Megha Mam	9326845060	operations@staywood.in				14:00:00	11:00:00	1	1	Next to Allcargo office	Sunshine Height, Flat No 1002,  Opp Golden Square	Sunder Nagar Road No.3, Next to Allcargo office	Santacruz  East Mumbai-400098			2025-12-06 23:39:42.061118
20	active	28		5	\N	Mumbai	Dadar		2 BHK	\N	Prashant Sir	9820736442	prashant@relyonservices.in				14:00:00	11:00:00	1	1		903,9th floor,Ram Swaroop Palai Towe	Dadar West, Baburao Parulekar Marg	Dadar West,Mumbai-400028			2025-12-06 23:39:42.061118
23	active	26		23	\N	Mumbai	Andheri		studio	\N	Heena Mam	9833787741	info@ashokdeluxe.com				14:00:00	11:00:00	1	0		Ashok Deluxe apartments, Ashok Nagar Bldg # 3,	Off Marol Military Road, Near Raj Oil Mill,	Marol, Andheri E, Mumbai-400072			2025-12-06 23:39:42.061118
22	active	29		23	\N	Mumbai	Powai		1 BHK	\N	Prem Sir	9766693868	sales@osiapartments.in				14:00:00	11:00:00	1	0		Aleta Residencies, Off, Saki Vihar Rd	Tunga Village, Chandivali, Powai, Mumbai - 400072				2025-12-06 23:40:01.742751
24	active	41		8	\N	Delhi	Greater Kailash		1 BHK	\N	Jyoti Rajput	7293332020	paras@pajasa.com	ABC	7506024682		14:00:00	11:00:00	1	0		Block – B, House Number – 18	Behind Pamposh Enclave, Greater Kailash	Enclave 1,New Delhi 110048			2025-12-07 13:51:45.075648
25	active	41		28	\N	Bengaluru	Wind Tunnel Road		studio	\N	Jyoti Rajput	7293332020	paras@pajasa.com	ABC	7506024682		14:00:00	11:00:00	1	0		# 11/4, S.R. Layout, Murugeshpalya	off Airport/Wind Tunnel Road 	Bangalore 560 017 			2025-12-07 13:54:43.064372
26	active	41		29	\N	Gurgaon			2 BHK	\N	Jyoti Rajput	7293332020	paras@pajasa.com	ABC	7506024682		14:00:00	11:00:00	1	1		Tower No. 6, Apartment No. 1103	Uniworld Gardens, Sector 47	Sohna Road, Gurgaon, Haryana 122001			2025-12-07 13:58:04.046732
27	active	41		30	\N	Mumbai			3 BHK	\N	Jyoti Rajput	7293332020	paras@pajasa.com	ABC	7506024682		14:00:00	11:00:00	2	1		Flat No 902,  Ison Heights, N M Joshi Marg	Pragati Indl Est, Delisle Road	Lower Parel, Mumbai - 400011			2025-12-07 14:02:31.689873
28	active	42		2	\N	Mumbai	Kala Nagar		4 BHK	\N	Pranay	7506024682	accounts@pajasaapartments.com	Jooo	1234567890		14:00:00	11:00:00	3	1		Flat No 11, Jasmine CHS, Madhusudan Kalaker Marg,	Behind Gurunanak Hospital, Kalanagar, Bandra East 				2025-12-16 07:17:15.958385
29	active	43		3	\N	Mumbai	Powai		1 BHK	\N	Pooja	1234567890	pooja@gmail.comm				11:00:00	14:00:00	1	0		Powai Street	Mumbai 400076				2026-01-03 08:30:50.436498
31	active	44		3	\N	Mumbai	Powai		2 BHK	\N	Ashutosh	7894561230	ashu@gmail.com				14:00:00	11:00:00	1	1		Ashiana Apartments, 1st Floor, Flat no. 105,	Opp IIT Main Gate	Powai, Mumbai 400076			2026-01-09 12:37:43.363678
32	active	45		32	\N	Pune	Undri		2 BHK	\N	Amit Batra	9877897988	amit@gmail.com				14:00:00	11:00:00	1	1	Test Landmark 123	Flat No. 1, 1st Fllor, Abc Road, 	XYZ Marg, Pune				2026-01-17 05:36:21.496206
33	active	46		3	\N	Mumbai	Powai		3 BHK	\N	Daff	1234567891	dafff@gmail.com				14:00:00	11:00:00	2	1		Daffodil Apartments	Near Dmart, Powai	Powai 400076			2026-01-27 12:41:49.193052
34	active	46		3	\N	Mumbai	Powai		3 BHK	\N	Daff	1234567891	dafff@gmail.com				14:00:00	11:00:00	2	1		Daffodil Apartments	Near Dmart, Powai	Powai 400076			2026-01-27 12:41:50.093782
\.


--
-- Data for Name: property_rooms; Type: TABLE DATA; Schema: public; Owner: masteruser
--

COPY public.property_rooms (id, property_id, room_type, room_name, max_occupancy, is_active) FROM stdin;
\.


--
-- Data for Name: reservation_additional_guests; Type: TABLE DATA; Schema: public; Owner: masteruser
--

COPY public.reservation_additional_guests (id, reservation_id, guest_name, cid, cod, room_type, occupancy, address, created_at, email, contact_number, status) FROM stdin;
7	18	harshit	2025-12-23	2025-12-26	hjdshfjs	1	hajsdhjas	2025-12-12 15:37:34.924355	dhjfds@dhjs	643789023847	active
9	1	harshit	2025-12-26	2025-12-31	jfdjgfd	1	gjifjgkds fgkdfs	2025-12-12 15:40:35.454229	fngjkdf@djfdg	768954038579	active
10	5	jkdsahfjsa	2026-01-05	2026-01-09	dfjsd	1	dsjhfjasd	2025-12-12 17:55:50.538678	dfhjas@gmail	573245803	active
11	6	dfjsdf	2025-12-17	2025-12-31	dsfhjsd	1	dsfjds	2025-12-12 18:13:08.284013	djfnjds	dsfkjdsjf	active
20	34	hello harshit	2025-12-23	2026-01-07	\N	\N	\N	2025-12-25 09:06:38.636205	\N	\N	active
21	36	guset name	2025-12-22	2025-12-31	\N	\N	\N	2025-12-26 09:49:32.786211	\N	\N	active
15	31	hsdjfhut	2025-12-20	2025-12-19	hdhfjds	2	djhfjds	2025-12-17 09:52:05.032492	hfajshdf@gmaiul.com	837589342	active
23	33	harshita	2025-12-14	2025-12-22	\N	\N	\N	2026-01-11 08:20:10.253887	\N	\N	active
30	20	sushil	2025-12-19	2025-12-27	\N	\N	\N	2026-01-11 10:11:30.967439	\N	\N	active
31	19	sp	2026-01-10	2026-01-11	\N	\N	\N	2026-01-11 10:13:15.537637	\N	\N	active
38	50	sp	2026-01-13	2026-01-17	\N	\N	\N	2026-01-24 18:22:03.906003	\N	\N	active
\.


--
-- Data for Name: reservation_additional_info; Type: TABLE DATA; Schema: public; Owner: masteruser
--

COPY public.reservation_additional_info (id, reservation_id, host_name, host_email, host_base_rate, host_taxes, host_total_amount, contact_person, contact_number, comments, services, note, created_at, apartment_type, host_payment_mode) FROM stdin;
2	2			0.00	0.00	0.00				{"wifi": false, "vegLunch": false, "vegDinner": false, "nonVegLunch": false, "nonVegDinner": false, "morningBreakfast": false}		2025-09-27 08:26:51.075347		
1	1			0.00	0.00	0.00				{"wifi": false, "vegLunch": false, "vegDinner": false, "nonVegLunch": false, "nonVegDinner": false, "morningBreakfast": false}		2025-09-27 07:15:17.468261		
6	6	Veridical Hospitalty	ps@pajasaapartments.com	2500.00	5.00	2625.00	Anindita Mam	9833168145		{"wifi": true, "vegLunch": false, "vegDinner": false, "nonVegLunch": false, "nonVegDinner": false, "morningBreakfast": true}		2025-10-17 05:29:56.120022		
41	50	harshit	fajhfdklr@gamil.com	12.00	0.00	12.00	Aman Verma			{"wifi": false, "vegLunch": false, "vegDinner": false, "nonVegLunch": false, "nonVegDinner": false, "morningBreakfast": false}		2026-01-24 18:22:03.906003	Standard	Bill to Pajasa
8	18	PAJASA	paras@pajasa.com	55.00	748.00	466.40	Paras Sangwan	7738777602		{"wifi": true, "vegLunch": false, "vegDinner": false, "nonVegLunch": false, "nonVegDinner": false, "morningBreakfast": true}		2025-12-07 15:19:42.590529		
21	32	Shri Shri Corporate Advisors LLP	accounts@pajasaapartments.com	4000.00	12.00	4480.00	Pranay	7506024682		{"wifi": true, "vegLunch": true, "vegDinner": false, "nonVegLunch": false, "nonVegDinner": false, "morningBreakfast": true}		2025-12-16 07:27:18.093301	Standard	Bill to Pajasa
42	72	Rely On Us	prashant@relyonservices.in	12.00	0.00	12.00	Prashant Sir			{"wifi": false, "vegLunch": false, "vegDinner": false, "nonVegLunch": false, "nonVegDinner": false, "morningBreakfast": false}		2026-01-25 07:49:03.773068	Standard	Bill to Pajasa
39	41	harshit	fajhfdklr@gamil.com	11.00	0.00	11.00	Aman Verma			{"wifi": false, "vegLunch": false, "vegDinner": false, "nonVegLunch": false, "nonVegDinner": false, "morningBreakfast": false}		2026-01-24 17:10:01.660774	Standard	Bill to Pajasa
43	67	Welcome Home & Service Apartments	welcomehomeserviceapartments@gmail.com	23.00	0.00	23.00	Shravan Sir			{"wifi": false, "vegLunch": false, "vegDinner": false, "nonVegLunch": false, "nonVegDinner": false, "morningBreakfast": true}	uhgiuh	2026-01-26 17:56:08.208662	Standard	Bill to Pajasa
37	43	gdgg	fgdgdgdg	0.00	0.00	0.00	fdgdgdg	dgfdgdgfg		{"wifi": false, "vegLunch": false, "vegDinner": false, "nonVegLunch": false, "nonVegDinner": false, "morningBreakfast": true}	fgdgg	2026-01-22 19:22:27.444606	Standard	Bill to Pajasa
44	75	MH 12 Services	amit@gmail.com	34.00	45.00	49.30	Amit Batra			{"wifi": true, "vegLunch": false, "vegDinner": false, "nonVegLunch": false, "nonVegDinner": false, "morningBreakfast": true}	i want food	2026-01-26 18:21:32.990769	Standard	Bill to Pajasa
45	76	Veridical Hospitality	booking@veridicalhospitality.com	4500.00	5.00	4725.00	Anindita Mam	9833168145		{"wifi": true, "vegLunch": false, "vegDinner": false, "nonVegLunch": false, "nonVegDinner": false, "morningBreakfast": true}		2026-01-27 12:32:41.035356	Standard	Bill to Pajasa
46	77	Daffodil Apartments	dafff@gmail.com	4000.00	5.00	4200.00	Daff			{"wifi": true, "vegLunch": false, "vegDinner": false, "nonVegLunch": false, "nonVegDinner": false, "morningBreakfast": true}		2026-01-27 12:43:41.234546	Standard	Direct payment
47	70	Veridical Hospitality	booking@veridicalhospitality.com	57667.00	7.00	61703.69	Anindita Mam			{"wifi": false, "vegLunch": false, "vegDinner": false, "nonVegLunch": false, "nonVegDinner": false, "morningBreakfast": false}		2026-01-31 17:05:08.688813	Standard	Bill to Pajasa
36	44	harshit	fajhfdklr@gamil.com	0.00	0.00	0.00	Aman Verma			{"wifi": false, "vegLunch": false, "vegDinner": false, "nonVegLunch": false, "nonVegDinner": false, "morningBreakfast": true}	dfgdgdf	2026-01-22 19:07:23.010752	Standard	Bill to Pajasa
40	51	PAJASA	paras@pajasa.com	12.00	34.00	16.08	Paras Sangwan			{"wifi": true, "vegLunch": false, "vegDinner": false, "nonVegLunch": false, "nonVegDinner": false, "morningBreakfast": true}		2026-01-24 17:58:44.855524	Standard	Direct payment
48	81	Veridical Hospitality	booking@veridicalhospitality.com	66.00	7.00	70.62	Anindita Mam			{"wifi": true, "vegLunch": false, "vegDinner": false, "nonVegLunch": true, "nonVegDinner": false, "morningBreakfast": true}		2026-01-31 17:48:12.061051	as per email	Direct payment
\.


--
-- Data for Name: reservation_history; Type: TABLE DATA; Schema: public; Owner: masteruser
--

COPY public.reservation_history (history_id, reservation_id, action_type, modification_tag, previous_check_in, previous_check_out, previous_total_tariff, previous_status, previous_guest_name, previous_occupancy, changed_at) FROM stdin;
\.


--
-- Data for Name: reservation_versions; Type: TABLE DATA; Schema: public; Owner: masteruser
--

COPY public.reservation_versions (id, reservation_id, change_date, snapshot_data, changed_by) FROM stdin;
3	20	2025-12-12 15:35:12.582005	{"id": 20, "city": "Mumbai", "note": "", "taxes": "4.00", "status": "active", "address1": "B-903 Sanghvi Infenia Kalina,Vidyanagari Marg", "comments": "", "location": "Kalina", "services": {"wifi": true, "vegLunch": false, "vegDinner": false, "nonVegLunch": false, "nonVegDinner": false, "morningBreakfast": true}, "base_rate": "748344.00", "client_id": 2, "host_name": "PAJASA", "occupancy": 0, "thumbnail": "", "created_at": "2025-12-07T10:09:35.632Z", "guest_name": "hajhrusht", "host_email": "paras@pajasa.com", "host_taxes": "55.00", "admin_email": "jhgdjf@gasg.com", "client_name": "Bright Future Ltd", "guest_email": "fdhgjdsf@hgjg.com", "property_id": 17, "tariff_type": "", "payment_mode": "", "property_url": "", "total_tariff": "778277.76", "check_in_date": "2025-12-10T18:30:00.000Z", "check_in_time": "14:00:00", "property_type": "3 BHK", "roomSelection": ["Master Bedroom-2"], "apartment_type": "", "check_out_date": "2025-12-18T18:30:00.000Z", "check_out_time": "11:00:00", "contact_number": "646748378423", "contact_person": "Paras Sangwan", "host_base_rate": "7345683.00", "reservation_no": "RES1765121977293", "chargeable_days": 8, "additionalGuests": null, "host_payment_mode": "", "host_total_amount": "11385808.65", "contact_person_number": "7738777602"}	\N
4	20	2025-12-12 15:35:20.79151	{"id": 20, "city": "Mumbai", "note": "", "taxes": "4.00", "status": "active", "address1": "B-903 Sanghvi Infenia Kalina,Vidyanagari Marg", "comments": "", "location": "Kalina", "services": {"wifi": true, "vegLunch": false, "vegDinner": false, "nonVegLunch": false, "nonVegDinner": false, "morningBreakfast": true}, "base_rate": "748344.00", "client_id": 2, "host_name": "PAJASA", "occupancy": 0, "thumbnail": "", "created_at": "2025-12-07T10:09:35.632Z", "guest_name": "hajhrusht", "host_email": "paras@pajasa.com", "host_taxes": "55.00", "admin_email": "jhgdjf@gasg.com", "client_name": "Bright Future Ltd", "guest_email": "fdhgjdsf@hgjg.com", "property_id": 17, "tariff_type": "", "payment_mode": "", "property_url": "", "total_tariff": "778277.76", "check_in_date": "2025-12-09T18:30:00.000Z", "check_in_time": "14:00:00", "property_type": "3 BHK", "roomSelection": ["Master Bedroom-2"], "apartment_type": "", "check_out_date": "2025-12-17T18:30:00.000Z", "check_out_time": "11:00:00", "contact_number": "646748378423", "contact_person": "Paras Sangwan", "host_base_rate": "7345683.00", "reservation_no": "RES1765121977293", "chargeable_days": 8, "additionalGuests": [{"id": 4, "cid": "2025-12-24", "cod": "2025-12-29", "email": "hdaskds@gmail", "address": "dfhjasd ", "roomType": "tellle ", "guestName": "harshit", "occupancy": "1", "contactNumber": "5467890456"}], "host_payment_mode": "", "host_total_amount": "11385808.65", "contact_person_number": "7738777602"}	\N
5	18	2025-12-12 15:37:30.403894	{"id": 18, "city": "Mumbai", "note": "", "taxes": "58.00", "status": "active", "address1": "B-903 Sanghvi Infenia Kalina,Vidyanagari Marg", "comments": "", "location": "Kalina", "services": {"wifi": true, "vegLunch": false, "vegDinner": false, "nonVegLunch": false, "nonVegDinner": false, "morningBreakfast": true}, "base_rate": "4757.00", "client_id": 2, "host_name": "PAJASA", "occupancy": 0, "thumbnail": "", "created_at": "2025-12-07T09:49:39.395Z", "guest_name": "hejwhdfsj", "host_email": "paras@pajasa.com", "host_taxes": "748.00", "admin_email": "jdsfgsj@fghjfd.com", "client_name": "Bright Future Ltd", "guest_email": "Harshit@gmail", "property_id": 17, "tariff_type": "", "payment_mode": "", "property_url": "", "total_tariff": "7516.06", "check_in_date": "2025-12-08T18:30:00.000Z", "check_in_time": "14:00:00", "property_type": "3 BHK", "roomSelection": ["Master Bedroom-1"], "apartment_type": "", "check_out_date": "2025-12-12T18:30:00.000Z", "check_out_time": "11:00:00", "contact_number": "123456789876543", "contact_person": "Paras Sangwan", "host_base_rate": "55.00", "reservation_no": "RES1765120782414", "chargeable_days": 4, "additionalGuests": null, "host_payment_mode": "", "host_total_amount": "466.40", "contact_person_number": "7738777602"}	\N
6	18	2025-12-12 15:37:34.924355	{"id": 18, "city": "Mumbai", "note": "", "taxes": "58.00", "status": "active", "address1": "B-903 Sanghvi Infenia Kalina,Vidyanagari Marg", "comments": "", "location": "Kalina", "services": {"wifi": true, "vegLunch": false, "vegDinner": false, "nonVegLunch": false, "nonVegDinner": false, "morningBreakfast": true}, "base_rate": "4757.00", "client_id": 2, "host_name": "PAJASA", "occupancy": 0, "thumbnail": "", "created_at": "2025-12-07T09:49:39.395Z", "guest_name": "hejwhdfsj", "host_email": "paras@pajasa.com", "host_taxes": "748.00", "admin_email": "jdsfgsj@fghjfd.com", "client_name": "Bright Future Ltd", "guest_email": "Harshit@gmail", "property_id": 17, "tariff_type": "", "payment_mode": "", "property_url": "", "total_tariff": "7516.06", "check_in_date": "2025-12-07T18:30:00.000Z", "check_in_time": "14:00:00", "property_type": "3 BHK", "roomSelection": ["Master Bedroom-1"], "apartment_type": "", "check_out_date": "2025-12-11T18:30:00.000Z", "check_out_time": "11:00:00", "contact_number": "123456789876543", "contact_person": "Paras Sangwan", "host_base_rate": "55.00", "reservation_no": "RES1765120782414", "chargeable_days": 4, "additionalGuests": [{"id": 6, "cid": "2025-12-23", "cod": "2025-12-26", "email": "dhjfds@dhjs", "address": "hajsdhjas", "roomType": "hjdshfjs", "guestName": "harshit", "occupancy": "1", "contactNumber": "643789023847"}], "host_payment_mode": "", "host_total_amount": "466.40", "contact_person_number": "7738777602"}	\N
7	1	2025-12-12 15:40:18.863593	{"id": 1, "city": "Mumbai", "note": "", "taxes": "0.00", "status": "active", "address1": "B-903 Sanghvi Infenia Kalina,Vidyanagari Marg", "comments": "", "location": "Kalina", "services": {"wifi": false, "vegLunch": false, "vegDinner": false, "nonVegLunch": false, "nonVegDinner": false, "morningBreakfast": false}, "base_rate": "0.00", "client_id": 1, "host_name": "", "occupancy": 0, "thumbnail": "", "created_at": "2025-09-27T01:45:15.539Z", "guest_name": "gjfkjshdjfsa", "host_email": "", "host_taxes": "0.00", "admin_email": "Harshitshukl6388@gmail.com", "client_name": "Tech Solutions Pvt Ltd", "guest_email": "Harshitshukl6388@gmail.com", "property_id": 17, "tariff_type": "", "payment_mode": "", "property_url": "", "total_tariff": "0.00", "check_in_date": "2025-09-23T18:30:00.000Z", "check_in_time": "12:00:00", "property_type": "3 BHK", "roomSelection": null, "apartment_type": "", "check_out_date": "2025-09-14T18:30:00.000Z", "check_out_time": "11:00:00", "contact_number": "34567896543", "contact_person": "", "host_base_rate": "0.00", "reservation_no": "RES1758957317373", "chargeable_days": 0, "additionalGuests": null, "host_payment_mode": "", "host_total_amount": "0.00", "contact_person_number": ""}	\N
8	1	2025-12-12 15:40:35.454229	{"id": 1, "city": "Mumbai", "note": "", "taxes": "0.00", "status": "active", "address1": "B-903 Sanghvi Infenia Kalina,Vidyanagari Marg", "comments": "", "location": "Kalina", "services": {"wifi": false, "vegLunch": false, "vegDinner": false, "nonVegLunch": false, "nonVegDinner": false, "morningBreakfast": false}, "base_rate": "0.00", "client_id": 1, "host_name": "", "occupancy": 0, "thumbnail": "", "created_at": "2025-09-27T01:45:15.539Z", "guest_name": "gjfkjshdjfsa", "host_email": "", "host_taxes": "0.00", "admin_email": "Harshitshukl6388@gmail.com", "client_name": "Tech Solutions Pvt Ltd", "guest_email": "Harshitshukl6388@gmail.com", "property_id": 17, "tariff_type": "", "payment_mode": "", "property_url": "", "total_tariff": "0.00", "check_in_date": "2025-09-22T18:30:00.000Z", "check_in_time": "12:00:00", "property_type": "3 BHK", "roomSelection": null, "apartment_type": "", "check_out_date": "2025-09-13T18:30:00.000Z", "check_out_time": "11:00:00", "contact_number": "34567896543", "contact_person": "", "host_base_rate": "0.00", "reservation_no": "RES1758957317373", "chargeable_days": 0, "additionalGuests": [{"id": 8, "cid": "2025-12-26", "cod": "2025-12-31", "email": "fngjkdf@djfdg", "address": "gjifjgkds fgkdfs", "roomType": "jfdjgfd", "guestName": "harshit", "occupancy": "1", "contactNumber": "768954038579"}], "host_payment_mode": "", "host_total_amount": "0.00", "contact_person_number": ""}	\N
9	5	2025-12-12 17:55:50.538678	{"id": 5, "city": "Mumbai", "note": "", "taxes": "5.00", "status": "active", "address1": "504/505,5th Floor, Panch Smruti Tower", "comments": "", "location": "Powai", "services": {"wifi": true, "vegLunch": false, "vegDinner": false, "nonVegLunch": false, "nonVegDinner": true, "morningBreakfast": true}, "base_rate": "4250.00", "client_id": 14, "host_name": "", "occupancy": 1, "thumbnail": "", "created_at": "2025-10-10T04:46:48.656Z", "guest_name": "Jyoti", "host_email": "Ps@pajasaapartments.com", "host_taxes": "5.00", "admin_email": "Ps@pajasaapartments.com", "client_name": "First Livingspaces Private Limited", "guest_email": "accounts@pajasaapartments.com", "property_id": 18, "tariff_type": "As Per Contract", "payment_mode": "BTC", "property_url": "https://www.pajasaapartments.com/in/mumbai/powai/3-bhk-service-apartments-in-powai-mumbai/", "total_tariff": "4462.50", "check_in_date": "2025-10-10T18:30:00.000Z", "check_in_time": "14:00:00", "property_type": "3 BHK", "roomSelection": ["Master Bedroom-1"], "apartment_type": "", "check_out_date": "2025-10-12T18:30:00.000Z", "check_out_time": "11:00:00", "contact_number": "7506024682", "contact_person": "Anindita Mam", "host_base_rate": "2500.00", "reservation_no": "RES1760091410056", "chargeable_days": 2, "additionalGuests": null, "host_payment_mode": "", "host_total_amount": "2625.00", "contact_person_number": "9833168145"}	\N
10	6	2025-12-12 18:13:08.284013	{"id": 6, "city": "Mumbai", "note": "", "taxes": "5.00", "status": "active", "address1": "504/505,5th Floor, Panch Smruti Tower", "comments": "", "location": "Powai", "services": {"wifi": true, "vegLunch": false, "vegDinner": false, "nonVegLunch": false, "nonVegDinner": false, "morningBreakfast": true}, "base_rate": "4250.00", "client_id": 14, "host_name": "Veridical Hospitalty", "occupancy": 1, "thumbnail": "", "created_at": "2025-10-16T23:59:53.656Z", "guest_name": "Jyoti", "host_email": "ps@pajasaapartments.com", "host_taxes": "5.00", "admin_email": "", "client_name": "First Livingspaces Private Limited", "guest_email": "accounts@pajasaapartments.com", "property_id": 18, "tariff_type": "As Per Contract", "payment_mode": "BTC", "property_url": "https://www.pajasaapartments.com/in/mumbai/powai/3-bhk-service-apartments-in-powai-mumbai/", "total_tariff": "0.00", "check_in_date": "2025-10-17T18:30:00.000Z", "check_in_time": "12:00:00", "property_type": "3 BHK", "roomSelection": ["Master Bedroom-1"], "apartment_type": "", "check_out_date": "2025-10-18T18:30:00.000Z", "check_out_time": "11:00:00", "contact_number": "7506024682", "contact_person": "Anindita Mam", "host_base_rate": "2500.00", "reservation_no": "RES1760678996198", "chargeable_days": 1, "additionalGuests": null, "host_payment_mode": "", "host_total_amount": "0.00", "contact_person_number": "9833168145"}	\N
11	32	2025-12-16 07:35:07.400466	{"id": 32, "city": "Mumbai", "note": "", "taxes": "5.00", "status": "active", "address1": "Flat No 11, Jasmine CHS, Madhusudan Kalaker Marg,", "comments": "", "location": "Kala Nagar", "services": {"wifi": true, "vegLunch": false, "vegDinner": false, "nonVegLunch": false, "nonVegDinner": false, "morningBreakfast": true}, "base_rate": "4000.00", "client_id": 2, "host_name": "Shri Shri Corporate Advisors LLP", "occupancy": 1, "thumbnail": "", "created_at": "2025-12-16T07:32:37.845Z", "guest_name": "Prajakta", "host_email": "accounts@pajasaapartments.com", "host_taxes": "5.00", "admin_email": "paras.sangwan@gmail.com", "client_name": "Bright Future Ltd", "guest_email": "ps@pajasaapartments.com, accounts@pajasaapartments.com", "property_id": 28, "tariff_type": "As Per Email", "payment_mode": "Direct Payment", "property_url": "", "total_tariff": "4200.00", "check_in_date": "2025-12-20T00:00:00.000Z", "check_in_time": "14:00:00", "property_type": "4 BHK", "roomSelection": ["Master Bedroom-1"], "apartment_type": "Standard", "check_out_date": "2025-12-21T00:00:00.000Z", "check_out_time": "11:00:00", "contact_number": "456789412", "contact_person": "Pranay", "host_base_rate": "3000.00", "reservation_no": "PAR-25-12-000002", "chargeable_days": 1, "additionalGuests": null, "host_payment_mode": "Direct payment", "host_total_amount": "3150.00", "contact_person_number": "7506024682"}	\N
12	32	2025-12-16 07:35:46.608056	{"id": 32, "city": "Mumbai", "note": "", "taxes": "5.00", "status": "active", "address1": "Flat No 11, Jasmine CHS, Madhusudan Kalaker Marg,", "comments": "", "location": "Kala Nagar", "services": {"wifi": true, "vegLunch": false, "vegDinner": false, "nonVegLunch": false, "nonVegDinner": false, "morningBreakfast": true}, "base_rate": "4000.00", "client_id": 2, "host_name": "Shri Shri Corporate Advisors LLP", "occupancy": 1, "thumbnail": "", "created_at": "2025-12-16T07:32:37.845Z", "guest_name": "Prajakta", "host_email": "accounts@pajasaapartments.com", "host_taxes": "5.00", "admin_email": "", "client_name": "Bright Future Ltd", "guest_email": "paras@pajasa.com,ps@pajasaapartments.com, accounts@pajasaapartments.com", "property_id": 28, "tariff_type": "As Per Email", "payment_mode": "Direct Payment", "property_url": "", "total_tariff": "4200.00", "check_in_date": "2025-12-20T00:00:00.000Z", "check_in_time": "14:00:00", "property_type": "4 BHK", "roomSelection": ["Master Bedroom-1"], "apartment_type": "Standard", "check_out_date": "2025-12-21T00:00:00.000Z", "check_out_time": "11:00:00", "contact_number": "456789412", "contact_person": "Pranay", "host_base_rate": "3000.00", "reservation_no": "PAR-25-12-000002", "chargeable_days": 1, "additionalGuests": null, "host_payment_mode": "Direct payment", "host_total_amount": "3150.00", "contact_person_number": "7506024682"}	\N
18	31	2025-12-17 09:49:14.672559	{"id": 31, "city": "Mumbai", "note": "", "taxes": "5.00", "status": "active", "address1": "Flat No 11, Jasmine CHS, Madhusudan Kalaker Marg,", "comments": "", "location": "Kala Nagar", "services": {"wifi": true, "vegLunch": true, "vegDinner": false, "nonVegLunch": false, "nonVegDinner": false, "morningBreakfast": true}, "base_rate": "5500.00", "client_id": 14, "host_name": "Shri Shri Corporate Advisors LLP", "occupancy": 1, "thumbnail": "", "created_at": "2025-12-16T01:57:14.906Z", "guest_name": "Rohan + 1", "host_email": "accounts@pajasaapartments.com", "host_taxes": "12.00", "admin_email": "paras@pajasa.com", "client_name": "First Livingspaces Private Limited", "guest_email": "ps@pajasaapartments.com, accounts@pajasaapartments.com", "property_id": 28, "tariff_type": "As Per Contract", "payment_mode": "Bill to Company", "property_url": "", "total_tariff": "5775.00", "check_in_date": "2025-12-17T18:30:00.000Z", "check_in_time": "14:00:00", "property_type": "4 BHK", "roomSelection": ["Master Bedroom-1", "Master Bedroom-2"], "apartment_type": "Standard", "check_out_date": "2025-12-22T18:30:00.000Z", "check_out_time": "11:00:00", "contact_number": "7506024682", "contact_person": "Pranay", "host_base_rate": "4000.00", "reservation_no": "PAR-25-12-000001", "chargeable_days": 5, "additionalGuests": null, "host_payment_mode": "Bill to Pajasa", "host_total_amount": "4480.00", "contact_person_number": "7506024682"}	\N
19	31	2025-12-17 09:52:03.120122	{"id": 31, "city": "Mumbai", "note": "", "taxes": "5.00", "status": "Extendes", "address1": "Flat No 11, Jasmine CHS, Madhusudan Kalaker Marg,", "comments": "", "location": "Kala Nagar", "services": {"wifi": true, "vegLunch": true, "vegDinner": false, "nonVegLunch": false, "nonVegDinner": false, "morningBreakfast": true}, "base_rate": "5500.00", "client_id": 14, "host_name": "Shri Shri Corporate Advisors LLP", "occupancy": 1, "thumbnail": "", "created_at": "2025-12-16T01:57:14.906Z", "guest_name": "Rohan + 1", "host_email": "accounts@pajasaapartments.com", "host_taxes": "12.00", "admin_email": "paras@pajasa.com", "client_name": "First Livingspaces Private Limited", "guest_email": "ps@pajasaapartments.com, accounts@pajasaapartments.com", "property_id": 28, "tariff_type": "As Per Contract", "payment_mode": "Bill to Company", "property_url": "", "total_tariff": "5775.00", "check_in_date": "2025-12-16T18:30:00.000Z", "check_in_time": "14:00:00", "property_type": "4 BHK", "roomSelection": ["Master Bedroom-1", "Master Bedroom-2"], "apartment_type": "Standard", "check_out_date": "2025-12-21T18:30:00.000Z", "check_out_time": "11:00:00", "contact_number": "7506024682", "contact_person": "Pranay", "host_base_rate": "4000.00", "reservation_no": "PAR-25-12-000001", "chargeable_days": 5, "additionalGuests": [{"id": 12, "cid": "2025-12-20", "cod": "2025-12-31", "email": "hfajshdf@gmaiul.com", "address": "djhfjds", "roomType": "hdhfjds", "guestName": "hsdjfhut", "occupancy": "2", "contactNumber": "837589342"}], "host_payment_mode": "Bill to Pajasa", "host_total_amount": "4480.00", "contact_person_number": "7506024682"}	\N
25	34	2025-12-25 09:06:38.636205	{"id": 34, "city": "Mumbai", "note": "", "taxes": "5.00", "status": "Extended", "address1": "Flat No 11, Jasmine CHS, Madhusudan Kalaker Marg,", "comments": "", "location": "Kala Nagar", "services": {"wifi": true, "vegLunch": true, "vegDinner": false, "nonVegLunch": true, "nonVegDinner": false, "morningBreakfast": true}, "base_rate": "1200.00", "client_id": 2, "host_name": "Shri Shri Corporate Advisors LLP", "occupancy": "2", "thumbnail": "", "created_at": "2025-12-17T10:13:37.782Z", "guest_name": "harshit", "host_email": "accounts@pajasaapartments.com", "host_taxes": "5.00", "admin_email": "", "client_name": "Bright Future Ltd", "guest_email": "info@brightfuture.com, ps@pajasaapartments.com, accounts@pajasaapartments.com", "property_id": 28, "tariff_type": "As Per Contract", "payment_mode": "Direct Payment", "property_url": "", "total_tariff": "1260.00", "check_in_date": "2025-12-20T18:30:00.000Z", "check_in_time": "14:00:00", "property_type": "4 BHK", "roomSelection": ["Master Bedroom-2", "Master Bedroom-1"], "apartment_type": "Standard", "check_out_date": "2025-12-23T18:30:00.000Z", "check_out_time": "11:00:00", "contact_number": "4875932444", "contact_person": "Pranay", "host_base_rate": "1500.00", "reservation_no": "PAR-25-12-000004", "chargeable_days": 3, "additionalGuests": [{"id": 19, "cid": "2025-12-23", "cod": "2026-01-07", "email": null, "address": null, "roomType": null, "guestName": "hello harshit", "occupancy": null, "contactNumber": null}], "host_payment_mode": "Bill to Pajasa", "host_total_amount": "1575.00", "contact_person_number": "7506024682"}	\N
20	31	2025-12-17 09:52:05.032492	{"id": 31, "city": "Mumbai", "note": "", "taxes": "5.00", "status": "Extended", "address1": "Flat No 11, Jasmine CHS, Madhusudan Kalaker Marg,", "comments": "", "location": "Kala Nagar", "services": {"wifi": true, "vegLunch": true, "vegDinner": false, "nonVegLunch": false, "nonVegDinner": false, "morningBreakfast": true}, "base_rate": "5500.00", "client_id": 14, "host_name": "Shri Shri Corporate Advisors LLP", "occupancy": 1, "thumbnail": "", "created_at": "2025-12-16T01:57:14.906Z", "guest_name": "Rohan + 1", "host_email": "accounts@pajasaapartments.com", "host_taxes": "12.00", "admin_email": "paras@pajasa.com", "client_name": "First Livingspaces Private Limited", "guest_email": "ps@pajasaapartments.com, accounts@pajasaapartments.com", "property_id": 28, "tariff_type": "As Per Contract", "payment_mode": "Bill to Company", "property_url": "", "total_tariff": "5775.00", "check_in_date": "2025-12-15T18:30:00.000Z", "check_in_time": "14:00:00", "property_type": "4 BHK", "roomSelection": ["Master Bedroom-1", "Master Bedroom-2"], "apartment_type": "Standard", "check_out_date": "2025-12-20T18:30:00.000Z", "check_out_time": "11:00:00", "contact_number": "7506024682", "contact_person": "Pranay", "host_base_rate": "4000.00", "reservation_no": "PAR-25-12-000001", "chargeable_days": 5, "additionalGuests": [{"id": 13, "cid": "2025-12-20", "cod": "2025-12-31", "email": "hfajshdf@gmaiul.com", "address": "djhfjds", "roomType": "hdhfjds", "guestName": "hsdjfhut", "occupancy": "2", "contactNumber": "837589342"}, {"id": 14, "cid": "2025-12-20", "cod": "2025-12-24", "email": "hgjfdhu@hfjdsahg", "address": "fhgjkds", "roomType": "dghjkdf", "guestName": "hdfjghdf", "occupancy": "2", "contactNumber": "e7r7we8r7ew"}], "host_payment_mode": "Bill to Pajasa", "host_total_amount": "4480.00", "contact_person_number": "7506024682"}	\N
21	35	2025-12-22 11:06:49.254693	{"id": 35, "city": "Mumbai", "note": "", "taxes": "5.00", "status": "Confiremed", "address1": "903,9th floor,Ram Swaroop Palai Towe", "comments": "", "location": "Dadar", "services": {"wifi": true, "vegLunch": false, "vegDinner": false, "nonVegLunch": false, "nonVegDinner": false, "morningBreakfast": true}, "base_rate": "6000.00", "client_id": 38, "host_name": "Rely On Us", "occupancy": "1", "thumbnail": "", "created_at": "2025-12-22T11:04:00.296Z", "guest_name": "Gaurav + 1", "host_email": "prashant@relyonservices.in", "host_taxes": "5.00", "admin_email": "", "client_name": "Mitsubishi Chemical India Private Limited", "guest_email": "jyoti@gmail.com, ps@pajasaapartments.com, accounts@pajasaapartments.com", "property_id": 20, "tariff_type": "As Per Contract", "payment_mode": "Bill to Company", "property_url": "", "total_tariff": "6300.00", "check_in_date": "2025-12-25T00:00:00.000Z", "check_in_time": "14:00:00", "property_type": "2 BHK", "roomSelection": ["Master Bedroom-1", "Master Bedroom-2"], "apartment_type": "Standard", "check_out_date": "2025-12-31T00:00:00.000Z", "check_out_time": "11:00:00", "contact_number": "1234567890", "contact_person": "Prashant Sir", "host_base_rate": "4500.00", "reservation_no": "PAR-25-12-000005", "chargeable_days": 6, "additionalGuests": null, "host_payment_mode": "Bill to Pajasa", "host_total_amount": "4725.00", "contact_person_number": ""}	\N
22	36	2025-12-25 09:00:38.393262	{"id": 36, "city": "Mumbai", "note": "", "taxes": "5.00", "status": "Confiremed", "address1": "903,9th floor,Ram Swaroop Palai Towe", "comments": "", "location": "Dadar", "services": {"wifi": true, "vegLunch": false, "vegDinner": false, "nonVegLunch": false, "nonVegDinner": false, "morningBreakfast": true}, "base_rate": "5500.00", "client_id": 33, "host_name": "Rely On Us", "occupancy": "1", "thumbnail": "", "created_at": "2025-12-22T11:35:34.119Z", "guest_name": "Makarand", "host_email": "prashant@relyonservices.in", "host_taxes": "5.00", "admin_email": "", "client_name": "BBH communica", "guest_email": "dhsf@gmail.com, ps@pajasaapartments.com, accounts@pajasaapartments.com", "property_id": 20, "tariff_type": "As Per Email", "payment_mode": "Direct Payment", "property_url": "", "total_tariff": "5775.00", "check_in_date": "2025-12-25T18:30:00.000Z", "check_in_time": "14:00:00", "property_type": "2 BHK", "roomSelection": ["Master Bedroom-3"], "apartment_type": "Standard", "check_out_date": "2025-12-27T18:30:00.000Z", "check_out_time": "11:00:00", "contact_number": "4567891135", "contact_person": "Prashant Sir", "host_base_rate": "4000.00", "reservation_no": "PAR-25-12-000006", "chargeable_days": 2, "additionalGuests": null, "host_payment_mode": "Bill to Pajasa", "host_total_amount": "4200.00", "contact_person_number": "9820736442"}	\N
23	36	2025-12-25 09:00:43.783268	{"id": 36, "city": "Mumbai", "note": "", "taxes": "5.00", "status": "Extended", "address1": "903,9th floor,Ram Swaroop Palai Towe", "comments": "", "location": "Dadar", "services": {"wifi": true, "vegLunch": false, "vegDinner": false, "nonVegLunch": false, "nonVegDinner": false, "morningBreakfast": true}, "base_rate": "5500.00", "client_id": 33, "host_name": "Rely On Us", "occupancy": "1", "thumbnail": "", "created_at": "2025-12-22T11:35:34.119Z", "guest_name": "Makarand", "host_email": "prashant@relyonservices.in", "host_taxes": "5.00", "admin_email": "", "client_name": "BBH communica", "guest_email": "dhsf@gmail.com, ps@pajasaapartments.com, accounts@pajasaapartments.com", "property_id": 20, "tariff_type": "As Per Email", "payment_mode": "Direct Payment", "property_url": "", "total_tariff": "5775.00", "check_in_date": "2025-12-24T18:30:00.000Z", "check_in_time": "14:00:00", "property_type": "2 BHK", "roomSelection": ["Master Bedroom-3"], "apartment_type": "Standard", "check_out_date": "2025-12-26T18:30:00.000Z", "check_out_time": "11:00:00", "contact_number": "4567891135", "contact_person": "Prashant Sir", "host_base_rate": "4000.00", "reservation_no": "PAR-25-12-000006", "chargeable_days": 2, "additionalGuests": [{"id": 17, "cid": "2025-12-22", "cod": "2025-12-31", "email": null, "address": null, "roomType": null, "guestName": "guset name", "occupancy": null, "contactNumber": null}], "host_payment_mode": "Bill to Pajasa", "host_total_amount": "4200.00", "contact_person_number": "9820736442"}	\N
24	34	2025-12-25 09:06:36.447078	{"id": 34, "city": "Mumbai", "note": "", "taxes": "5.00", "status": "Confiremed", "address1": "Flat No 11, Jasmine CHS, Madhusudan Kalaker Marg,", "comments": "", "location": "Kala Nagar", "services": {"wifi": true, "vegLunch": true, "vegDinner": false, "nonVegLunch": true, "nonVegDinner": false, "morningBreakfast": true}, "base_rate": "1200.00", "client_id": 2, "host_name": "Shri Shri Corporate Advisors LLP", "occupancy": "2", "thumbnail": "", "created_at": "2025-12-17T10:13:37.782Z", "guest_name": "harshit", "host_email": "accounts@pajasaapartments.com", "host_taxes": "5.00", "admin_email": "", "client_name": "Bright Future Ltd", "guest_email": "info@brightfuture.com, ps@pajasaapartments.com, accounts@pajasaapartments.com", "property_id": 28, "tariff_type": "As Per Contract", "payment_mode": "Direct Payment", "property_url": "", "total_tariff": "1260.00", "check_in_date": "2025-12-21T18:30:00.000Z", "check_in_time": "14:00:00", "property_type": "4 BHK", "roomSelection": ["Master Bedroom-2", "Master Bedroom-1"], "apartment_type": "Standard", "check_out_date": "2025-12-24T18:30:00.000Z", "check_out_time": "11:00:00", "contact_number": "4875932444", "contact_person": "Pranay", "host_base_rate": "1500.00", "reservation_no": "PAR-25-12-000004", "chargeable_days": 3, "additionalGuests": null, "host_payment_mode": "Bill to Pajasa", "host_total_amount": "1575.00", "contact_person_number": "7506024682"}	\N
42	44	2026-01-22 19:07:23.010752	{"id": 44, "city": "Delhi", "note": null, "taxes": null, "status": "Confirmed", "address1": "56 Janpath", "comments": null, "location": "Connaught Place", "services": null, "base_rate": null, "client_id": 2, "host_name": null, "occupancy": null, "thumbnail": "thumb3.jpg", "created_at": "2026-01-13T11:09:00.549Z", "guest_name": "Seed Guest 4", "host_email": null, "host_taxes": null, "admin_email": null, "client_name": "Bright Future Ltd", "guest_email": null, "property_id": 9, "tariff_type": null, "email_status": "Sent", "payment_mode": null, "property_url": "http://example.com/property3", "total_tariff": null, "check_in_date": "2026-01-13", "check_in_time": "12:00:00", "property_type": "Guest House", "roomSelection": null, "apartment_type": null, "check_out_date": "2026-01-14", "check_out_time": "11:00:00", "contact_number": null, "contact_person": null, "host_base_rate": null, "reservation_no": "RES-SEED-1768322340843-3", "chargeable_days": null, "additionalGuests": null, "host_payment_mode": null, "host_total_amount": null, "modification_status": null, "contact_person_number": null}	System
45	43	2026-01-22 19:22:27.444606	{"id": 43, "city": "Delhi", "note": null, "taxes": null, "status": "Confirmed", "address1": "56 Janpath", "comments": null, "location": "Connaught Place", "services": null, "base_rate": null, "client_id": 2, "host_name": null, "occupancy": null, "thumbnail": "thumb3.jpg", "created_at": "2026-01-13T11:09:00.250Z", "guest_name": "Seed Guest 3", "host_email": null, "host_taxes": null, "admin_email": null, "client_name": "Bright Future Ltd", "guest_email": null, "property_id": 9, "tariff_type": null, "email_status": "Sent", "payment_mode": null, "property_url": "http://example.com/property3", "total_tariff": null, "check_in_date": "2026-01-13", "check_in_time": "12:00:00", "property_type": "Guest House", "roomSelection": null, "apartment_type": null, "check_out_date": "2026-01-14", "check_out_time": "11:00:00", "contact_number": null, "contact_person": null, "host_base_rate": null, "reservation_no": "RES-SEED-1768322340526-2", "chargeable_days": null, "additionalGuests": null, "host_payment_mode": null, "host_total_amount": null, "modification_status": null, "contact_person_number": null}	System
\.


--
-- Data for Name: reservations; Type: TABLE DATA; Schema: public; Owner: masteruser
--

COPY public.reservations (id, reservation_no, client_id, property_id, guest_name, guest_email, contact_number, check_in_date, check_out_date, check_in_time, check_out_time, occupancy, base_rate, taxes, total_tariff, payment_mode, tariff_type, chargeable_days, admin_email, status, created_at, email_status, modification_status, modification_tag, modification_tags) FROM stdin;
32	PAR-25-12-000002	2	28	Prajakta	paras@pajasa.com,ps@pajasaapartments.com, accounts@pajasaapartments.com	456789412	2025-12-20	2025-12-22	14:00:00	11:00:00	1	4000.00	5.00	4200.00	Direct Payment	As Per Email	2		Cancelled	2025-12-16 07:32:37.845	Unsent	\N	\N	\N
35	PAR-25-12-000005	38	20	Gaurav + 1	jyoti@gmail.com, ps@pajasaapartments.com, accounts@pajasaapartments.com	1234567890	2025-12-24	2025-12-31	14:00:00	11:00:00	1	6000.00	5.00	6300.00	Bill to Company	As Per Contract	7		Cancelled	2025-12-22 11:04:00.296	Unsent	\N	\N	\N
36	PAR-25-12-000006	33	20	Makarand	dhsf@gmail.com, ps@pajasaapartments.com, accounts@pajasaapartments.com	4567891135	2025-12-24	2025-12-27	14:00:00	11:00:00	1	5500.00	5.00	5775.00	Direct Payment	As Per Email	3		Cancelled	2025-12-22 17:05:34.119	Unsent	\N	\N	\N
34	PAR-25-12-000004	2	28	harshit	info@brightfuture.com, ps@pajasaapartments.com, accounts@pajasaapartments.com	4875932444	2025-12-21	2025-12-24	14:00:00	11:00:00	2	1200.00	5.00	1260.00	Direct Payment	As Per Contract	3		Cancelled	2025-12-17 15:43:37.782	Sent	\N	\N	\N
19	RES1765120783234	2	17	hejwhdfsj	Harshit@gmail	123456789876543	2025-12-08	2025-12-12	14:00:00	11:00:00	0	4757.00	58.00	7516.06			4	jdsfgsj@fghjfd.com	Cancelled	2025-12-07 15:19:41.11	Sent	\N	\N	\N
3	RES1758961718544	1	17	harsitn shuka;	hfdsafhj@gamil.com	456765650987	2025-09-29	2025-10-10	12:00:00	11:00:00	0	0.00	0.00	0.00			0	hfdsafhj@gamil.com	Cancelled	2025-09-27 08:28:38.35	Unsent	\N	\N	\N
50	RES-SEED-1768322342621-9	2	9	Seed Guest 10	info@brightfuture.com, ps@pajasaapartments.com, accounts@pajasaapartments.com	9001122334	2026-01-06	2026-01-12	12:00:00	11:00:00	1	0.00	0.00	0.00	Direct Payment	As Per Contract	6		Modified	2026-01-13 16:39:02.350625	Sent	\N	\N	Postponed
31	PAR-25-12-000001	14	28	Rohan + 1	ps@pajasaapartments.com, accounts@pajasaapartments.com	7506024682	2025-12-16	2025-12-21	14:00:00	11:00:00	1	5500.00	5.00	5775.00	Bill to Company	As Per Contract	5	paras@pajasa.com	Cancelled	2025-12-16 07:27:14.906	Unsent	\N	\N	\N
20	RES1765121977293	2	17	hajhrusht	fdhgjdsf@hgjg.com	646748378423	2025-12-08	2025-12-16	14:00:00	11:00:00	0	748344.00	4.00	778277.76			8	jhgdjf@gasg.com	Cancelled	2025-12-07 15:39:35.632	Unsent	\N	\N	\N
51	PAR-26-01-000005	14	17	shubham	ps@pajasaapartments.com, accounts@pajasaapartments.com	7738777602	2026-01-08	2026-01-23	14:00:00	11:00:00	2	12.00	10.00	13.20	Direct Payment	As Per Contract	15		Modified	2026-01-24 17:58:41.642	Sent	\N	\N	Preponed
43	RES-SEED-1768322340526-2	2	9	Seed Guest 3	info@brightfuture.com, ps@pajasaapartments.com, accounts@pajasaapartments.com	343453435	2026-01-02	2026-01-14	12:00:00	11:00:00	1	0.00	45.00	0.00	Direct Payment	As Per Contract	12		Modified	2026-01-13 16:39:00.250068	Sent	Preponed	\N	\N
41	PAR-25-12-000099	2	9	Seed Guest 1	info@brightfuture.com, ps@pajasaapartments.com, accounts@pajasaapartments.com	9001122334	2026-01-10	2026-01-12	12:00:00	11:00:00	1	11.00	0.00	11.00	Direct Payment	As Per Contract	2		Modified	2026-01-13 16:38:59.629706	Sent	\N	\N	Shortened
44	RES-SEED-1768322340843-3	2	9	Seed Guest 4	info@brightfuture.com, ps@pajasaapartments.com, accounts@pajasaapartments.com	9001122334	2026-01-02	2026-01-28	12:00:00	11:00:00	1	0.00	0.00	0.00	Direct Payment	As Per Contract	26	fgfdgfdgfd	Modified	2026-01-13 16:39:00.549415	Sent	Preponed	\N	Extended
5	RES1760091410056	14	18	Jyoti	accounts@pajasaapartments.com	7506024682	2025-10-10	2025-10-12	14:00:00	11:00:00	1	4250.00	5.00	4462.50	BTC	As Per Contract	2	Ps@pajasaapartments.com	Cancelled	2025-10-10 10:16:48.656	Unsent	\N	\N	\N
18	RES1765120782414	2	17	hejwhdfsj	Harshit@gmail	123456789876543	2025-12-08	2025-12-12	14:00:00	11:00:00	0	4757.00	58.00	7516.06			4	jdsfgsj@fghjfd.com	Confirmed	2025-12-07 15:19:39.395	Sent	\N	\N	\N
33	PAR-25-12-000003	2	28	harshit	spstudytec@gmail.com, ps@pajasaapartments.com, accounts@pajasaapartments.com	4875932444	2025-12-21	2025-12-24	14:00:00	11:00:00	2	1200.00	5.00	1260.00	Direct Payment	As Per Contract	3		Cancelled	2025-12-17 15:43:35.093	Sent	\N	\N	\N
6	RES1760678996198	14	18	Jyoti	accounts@pajasaapartments.com	7506024682	2025-10-17	2025-10-18	12:00:00	11:00:00	1	4250.00	5.00	4462.50	BTC	As Per Contract	1		Confirmed	2025-10-17 05:29:53.656	Sent	\N	\N	\N
1	RES1758957317373	1	17	gjfkjshdjfsa	Harshitshukl6388@gmail.com	34567896543	2025-09-23	2025-09-14	12:00:00	11:00:00	0	0.00	0.00	0.00			0	Harshitshukl6388@gmail.com	Confirmed	2025-09-27 07:15:15.539	Unsent	\N	\N	\N
2	RES1758961610875	2	17	harshit shula 	fdhsafja@gmail.com	46789765	2025-09-27	2025-10-01	12:00:00	11:00:00	0	0.00	0.00	0.00			0	fdhsafja@gmail.com	Confirmed	2025-09-27 08:26:49.343	Sent	\N	\N	\N
56	RES-CONF-1769326764575-002	2	11	Kavya Sharma	guest2@example.com	+919876543302	2026-01-31	2026-02-04	14:00:00	11:00:00	2	5500.00	18.00	6490.00	Bill to Company	As Per Contract	4	ps@pajasaapartments.com	active	2026-01-25 07:39:30.778192	Unsent	\N	\N	\N
57	RES-CONF-1769326764575-003	3	14	Rohan Patel	guest3@example.com	+919876543303	2026-02-03	2026-02-07	14:00:00	11:00:00	2	5500.00	18.00	6490.00	Bill to Company	As Per Contract	4	ps@pajasaapartments.com	active	2026-01-25 07:39:31.058221	Unsent	\N	\N	\N
60	RES-CONF-1769326764575-006	1	18	Neha Gupta	guest6@example.com	+919876543306	2026-02-12	2026-02-16	14:00:00	11:00:00	2	5500.00	18.00	6490.00	Bill to Company	As Per Contract	4	ps@pajasaapartments.com	active	2026-01-25 07:39:36.898743	Unsent	\N	\N	\N
61	RES-CONF-1769326764575-007	2	19	Vikram Nair	guest7@example.com	+919876543307	2026-02-15	2026-02-19	14:00:00	11:00:00	2	5500.00	18.00	6490.00	Bill to Company	As Per Contract	4	ps@pajasaapartments.com	active	2026-01-25 07:39:37.318611	Unsent	\N	\N	\N
62	RES-CONF-1769326764575-008	3	20	Ananya Reddy	guest8@example.com	+919876543308	2026-02-18	2026-02-22	14:00:00	11:00:00	2	5500.00	18.00	6490.00	Bill to Company	As Per Contract	4	ps@pajasaapartments.com	active	2026-01-25 07:39:37.619273	Unsent	\N	\N	\N
66	RES-CONF-1769327205766-012	2	11	Sneha Patel	sneha.patel@innovate.com	+919876543312	2026-03-04	2026-03-08	14:00:00	11:00:00	2	5800.00	18.00	6844.00	Direct Payment	As Per Email	4	ps@pajasaapartments.com	active	2026-01-25 07:46:52.541398	Unsent	\N	\N	\N
71	RES-CONF-1769327205766-017	2	19	Manish Joshi	manish.joshi@innovate.com	+919876543317	2026-03-19	2026-03-23	14:00:00	11:00:00	2	5500.00	18.00	6490.00	Bill to Company	As Per Contract	4	ps@pajasaapartments.com	active	2026-01-25 07:47:00.864064	Unsent	\N	\N	\N
75	PAR-26-01-000002	26	32	shubham	accounts@pajasaapartments.com, ps@pajasaapartments.com, accounts@pajasaapartments.com, spstudytec@gmail.com	9877897988	2026-01-07	2026-02-05	14:00:00	11:00:00	1	120.00	33.00	159.60	Direct Payment	As Per Contract	29	harshitshukla6388@gmail.com	Modified	2026-01-26 18:21:30.299	Sent	\N	\N	Extended
70	RES-CONF-1769327205766-016	1	18	Riya Singh	riya.singh@techcorp.com	9833168145	2026-03-12	2026-03-23	14:00:00	11:00:00	2	9500.00	18.00	11210.00	Direct Payment	As Per Email	11	ps@pajasaapartments.com	Modified	2026-01-25 07:47:00.133907	Sent	\N	\N	Preponed
67	RES-CONF-1769327205766-013	3	14	Amit Kumar	sales@greenenergy.com, ps@pajasaapartments.com, accounts@pajasaapartments.com	7979762299	2026-03-04	2026-03-13	14:00:00	11:00:00	2	7500.00	18.00	8850.00	Bill to Company	As Per Contract	9	ps@pajasaapartments.com	Modified	2026-01-25 07:46:53.106522	Unsent	\N	\N	Preponed
72	RES-CONF-1769327205766-018	3	20	Deepika Nair	deepika.nair@solutions.com	9820736442	2026-03-07	2026-03-30	14:00:00	11:00:00	2	6300.00	18.00	7434.00	Direct Payment	As Per Email	23	ps@pajasaapartments.com	Modified	2026-01-25 07:47:01.529352	Sent	\N	\N	Extended
77	PAR-26-01-000004	52	34	Liliies + Daisies	ps@pajasaapartments.com, accounts@pajasaapartments.com	1234567891	2026-01-26	2026-01-29	14:00:00	11:00:00	2	5000.00	5.00	5250.00	Bill to Company	As Per Contract	3		Modified	2026-01-27 12:43:39.72	Sent	\N	\N	Preponed
76	PAR-26-01-000003	51	18	Dr Anand + Dr Shiva	ps@pajasaapartments.com, accounts@pajasaapartments.com	7506024682	2026-01-28	2026-01-31	14:00:00	11:00:00	1	6000.00	5.00	6300.00	Direct Payment	As Per Email	3		Confirmed	2026-01-27 12:32:39.436	Sent	\N	\N	\N
81	PAR-26-01-000006	49	18	Deepika Nair	ps@pajasaapartments.com, accounts@pajasaapartments.com	9833168145	2026-02-01	2026-02-07	14:00:00	11:00:00	2	343.00	5.00	360.15	Direct Payment	As Per Email	6		Modified	2026-01-31 17:48:09.216	Sent	\N	\N	Preponed
\.


--
-- Data for Name: room_bookings; Type: TABLE DATA; Schema: public; Owner: masteruser
--

COPY public.room_bookings (id, reservation_id, room_type, property_id, check_in_date, check_out_date, status) FROM stdin;
124	44	Master Bedroom-3	9	2026-01-02	2026-01-28	active
127	51	Master Bedroom-1	17	2026-01-08	2026-01-23	active
128	50	Master Bedroom-2	9	2026-01-06	2026-01-12	active
129	66	Master Bedroom-1	11	2026-03-04	2026-03-08	active
132	71	Master Bedroom-1	19	2026-03-19	2026-03-23	active
135	72	Master Bedroom-1	20	2026-03-07	2026-03-30	active
136	41	Master Bedroom-1	9	2026-01-10	2026-01-12	active
137	67	Master Bedroom-1	14	2026-03-04	2026-03-13	active
140	75	Master Bedroom-1	32	2026-01-07	2026-02-05	active
141	76	Master Bedroom-1	\N	2026-01-28	2026-01-31	Confirmed
142	76	Master Bedroom-2	\N	2026-01-28	2026-01-31	Confirmed
145	77	Master Bedroom-1	34	2026-01-26	2026-01-29	active
146	70	Master Bedroom-1	18	2026-03-12	2026-03-23	active
38	18	Master Bedroom-1	17	2025-12-08	2025-12-12	active
148	81	Master Bedroom-1	18	2026-02-01	2026-02-07	active
40	6	Master Bedroom-1	18	2025-10-17	2025-10-18	active
115	43	Master Bedroom-1	9	2026-01-02	2026-01-14	Modified
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: masteruser
--

COPY public.users (id, username, email, password_hash, created_at) FROM stdin;
1	harshit	ps@pajasaapartments.com	$2b$10$JSX/03XBY.Ete9SEqG0kp.Db/eaU8/Un9ZpR8Q/77WGfer02FsmZK	2025-12-08 18:29:05.799664
2	Har@6388	harshitshukla6388@gmail.com	$2b$10$.tA/1.CuxdGzw9VhixG6SuhP0su2m7NG2b44KzWZ6b2O2xKi/hRdm	2025-12-20 06:21:00.046605
\.


--
-- Name: booking_history_id_seq; Type: SEQUENCE SET; Schema: public; Owner: masteruser
--

SELECT pg_catalog.setval('public.booking_history_id_seq', 22, true);


--
-- Name: clients_id_seq; Type: SEQUENCE SET; Schema: public; Owner: masteruser
--

SELECT pg_catalog.setval('public.clients_id_seq', 52, true);


--
-- Name: guest_booking_timelines_id_seq; Type: SEQUENCE SET; Schema: public; Owner: masteruser
--

SELECT pg_catalog.setval('public.guest_booking_timelines_id_seq', 1, false);


--
-- Name: host_gst_numbers_gst_id_seq; Type: SEQUENCE SET; Schema: public; Owner: masteruser
--

SELECT pg_catalog.setval('public.host_gst_numbers_gst_id_seq', 28, true);


--
-- Name: host_information_host_id_seq; Type: SEQUENCE SET; Schema: public; Owner: masteruser
--

SELECT pg_catalog.setval('public.host_information_host_id_seq', 46, true);


--
-- Name: invoice_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: masteruser
--

SELECT pg_catalog.setval('public.invoice_items_id_seq', 27, true);


--
-- Name: invoices_id_seq; Type: SEQUENCE SET; Schema: public; Owner: masteruser
--

SELECT pg_catalog.setval('public.invoices_id_seq', 22, true);


--
-- Name: pincodes_pincode_id_seq; Type: SEQUENCE SET; Schema: public; Owner: masteruser
--

SELECT pg_catalog.setval('public.pincodes_pincode_id_seq', 32, true);


--
-- Name: properties_property_id_seq; Type: SEQUENCE SET; Schema: public; Owner: masteruser
--

SELECT pg_catalog.setval('public.properties_property_id_seq', 34, true);


--
-- Name: property_rooms_id_seq; Type: SEQUENCE SET; Schema: public; Owner: masteruser
--

SELECT pg_catalog.setval('public.property_rooms_id_seq', 1, false);


--
-- Name: reservation_additional_guests_id_seq; Type: SEQUENCE SET; Schema: public; Owner: masteruser
--

SELECT pg_catalog.setval('public.reservation_additional_guests_id_seq', 38, true);


--
-- Name: reservation_additional_info_id_seq; Type: SEQUENCE SET; Schema: public; Owner: masteruser
--

SELECT pg_catalog.setval('public.reservation_additional_info_id_seq', 48, true);


--
-- Name: reservation_history_history_id_seq; Type: SEQUENCE SET; Schema: public; Owner: masteruser
--

SELECT pg_catalog.setval('public.reservation_history_history_id_seq', 1, false);


--
-- Name: reservation_versions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: masteruser
--

SELECT pg_catalog.setval('public.reservation_versions_id_seq', 45, true);


--
-- Name: reservations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: masteruser
--

SELECT pg_catalog.setval('public.reservations_id_seq', 81, true);


--
-- Name: room_bookings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: masteruser
--

SELECT pg_catalog.setval('public.room_bookings_id_seq', 148, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: masteruser
--

SELECT pg_catalog.setval('public.users_id_seq', 2, true);


--
-- Name: booking_history booking_history_pkey; Type: CONSTRAINT; Schema: public; Owner: masteruser
--

ALTER TABLE ONLY public.booking_history
    ADD CONSTRAINT booking_history_pkey PRIMARY KEY (id);


--
-- Name: clients clients_pkey; Type: CONSTRAINT; Schema: public; Owner: masteruser
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_pkey PRIMARY KEY (id);


--
-- Name: guest_booking_timelines guest_booking_timelines_pkey; Type: CONSTRAINT; Schema: public; Owner: masteruser
--

ALTER TABLE ONLY public.guest_booking_timelines
    ADD CONSTRAINT guest_booking_timelines_pkey PRIMARY KEY (id);


--
-- Name: host_gst_numbers host_gst_numbers_pkey; Type: CONSTRAINT; Schema: public; Owner: masteruser
--

ALTER TABLE ONLY public.host_gst_numbers
    ADD CONSTRAINT host_gst_numbers_pkey PRIMARY KEY (gst_id);


--
-- Name: host_information host_information_host_contact_number_key; Type: CONSTRAINT; Schema: public; Owner: masteruser
--

ALTER TABLE ONLY public.host_information
    ADD CONSTRAINT host_information_host_contact_number_key UNIQUE (host_contact_number);


--
-- Name: host_information host_information_pkey; Type: CONSTRAINT; Schema: public; Owner: masteruser
--

ALTER TABLE ONLY public.host_information
    ADD CONSTRAINT host_information_pkey PRIMARY KEY (host_id);


--
-- Name: invoice_items invoice_items_pkey; Type: CONSTRAINT; Schema: public; Owner: masteruser
--

ALTER TABLE ONLY public.invoice_items
    ADD CONSTRAINT invoice_items_pkey PRIMARY KEY (id);


--
-- Name: invoice_reservations invoice_reservations_pkey; Type: CONSTRAINT; Schema: public; Owner: masteruser
--

ALTER TABLE ONLY public.invoice_reservations
    ADD CONSTRAINT invoice_reservations_pkey PRIMARY KEY (invoice_id, reservation_id);


--
-- Name: invoices invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: masteruser
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_pkey PRIMARY KEY (id);


--
-- Name: pincodes pincodes_pincode_key; Type: CONSTRAINT; Schema: public; Owner: masteruser
--

ALTER TABLE ONLY public.pincodes
    ADD CONSTRAINT pincodes_pincode_key UNIQUE (pincode);


--
-- Name: pincodes pincodes_pkey; Type: CONSTRAINT; Schema: public; Owner: masteruser
--

ALTER TABLE ONLY public.pincodes
    ADD CONSTRAINT pincodes_pkey PRIMARY KEY (pincode_id);


--
-- Name: properties properties_pkey; Type: CONSTRAINT; Schema: public; Owner: masteruser
--

ALTER TABLE ONLY public.properties
    ADD CONSTRAINT properties_pkey PRIMARY KEY (property_id);


--
-- Name: property_rooms property_rooms_pkey; Type: CONSTRAINT; Schema: public; Owner: masteruser
--

ALTER TABLE ONLY public.property_rooms
    ADD CONSTRAINT property_rooms_pkey PRIMARY KEY (id);


--
-- Name: reservation_additional_guests reservation_additional_guests_pkey; Type: CONSTRAINT; Schema: public; Owner: masteruser
--

ALTER TABLE ONLY public.reservation_additional_guests
    ADD CONSTRAINT reservation_additional_guests_pkey PRIMARY KEY (id);


--
-- Name: reservation_additional_info reservation_additional_info_pkey; Type: CONSTRAINT; Schema: public; Owner: masteruser
--

ALTER TABLE ONLY public.reservation_additional_info
    ADD CONSTRAINT reservation_additional_info_pkey PRIMARY KEY (id);


--
-- Name: reservation_history reservation_history_pkey; Type: CONSTRAINT; Schema: public; Owner: masteruser
--

ALTER TABLE ONLY public.reservation_history
    ADD CONSTRAINT reservation_history_pkey PRIMARY KEY (history_id);


--
-- Name: reservation_versions reservation_versions_pkey; Type: CONSTRAINT; Schema: public; Owner: masteruser
--

ALTER TABLE ONLY public.reservation_versions
    ADD CONSTRAINT reservation_versions_pkey PRIMARY KEY (id);


--
-- Name: reservations reservations_pkey; Type: CONSTRAINT; Schema: public; Owner: masteruser
--

ALTER TABLE ONLY public.reservations
    ADD CONSTRAINT reservations_pkey PRIMARY KEY (id);


--
-- Name: reservations reservations_reservation_no_key; Type: CONSTRAINT; Schema: public; Owner: masteruser
--

ALTER TABLE ONLY public.reservations
    ADD CONSTRAINT reservations_reservation_no_key UNIQUE (reservation_no);


--
-- Name: room_bookings room_bookings_pkey; Type: CONSTRAINT; Schema: public; Owner: masteruser
--

ALTER TABLE ONLY public.room_bookings
    ADD CONSTRAINT room_bookings_pkey PRIMARY KEY (id);


--
-- Name: host_gst_numbers unique_gst_number; Type: CONSTRAINT; Schema: public; Owner: masteruser
--

ALTER TABLE ONLY public.host_gst_numbers
    ADD CONSTRAINT unique_gst_number UNIQUE (gst_number);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: masteruser
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: masteruser
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: booking_history booking_history_reservation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: masteruser
--

ALTER TABLE ONLY public.booking_history
    ADD CONSTRAINT booking_history_reservation_id_fkey FOREIGN KEY (reservation_id) REFERENCES public.reservations(id) ON DELETE CASCADE;


--
-- Name: host_gst_numbers fk_host; Type: FK CONSTRAINT; Schema: public; Owner: masteruser
--

ALTER TABLE ONLY public.host_gst_numbers
    ADD CONSTRAINT fk_host FOREIGN KEY (host_id) REFERENCES public.host_information(host_id) ON DELETE CASCADE;


--
-- Name: properties fk_host; Type: FK CONSTRAINT; Schema: public; Owner: masteruser
--

ALTER TABLE ONLY public.properties
    ADD CONSTRAINT fk_host FOREIGN KEY (host_id) REFERENCES public.host_information(host_id) ON DELETE CASCADE;


--
-- Name: properties fk_pincode; Type: FK CONSTRAINT; Schema: public; Owner: masteruser
--

ALTER TABLE ONLY public.properties
    ADD CONSTRAINT fk_pincode FOREIGN KEY (pincode_id) REFERENCES public.pincodes(pincode_id) ON DELETE CASCADE;


--
-- Name: invoice_items invoice_items_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: masteruser
--

ALTER TABLE ONLY public.invoice_items
    ADD CONSTRAINT invoice_items_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON DELETE CASCADE;


--
-- Name: property_rooms property_rooms_property_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: masteruser
--

ALTER TABLE ONLY public.property_rooms
    ADD CONSTRAINT property_rooms_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.properties(property_id);


--
-- Name: reservation_additional_guests reservation_additional_guests_reservation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: masteruser
--

ALTER TABLE ONLY public.reservation_additional_guests
    ADD CONSTRAINT reservation_additional_guests_reservation_id_fkey FOREIGN KEY (reservation_id) REFERENCES public.reservations(id) ON DELETE CASCADE;


--
-- Name: reservation_additional_info reservation_additional_info_reservation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: masteruser
--

ALTER TABLE ONLY public.reservation_additional_info
    ADD CONSTRAINT reservation_additional_info_reservation_id_fkey FOREIGN KEY (reservation_id) REFERENCES public.reservations(id);


--
-- Name: reservation_history reservation_history_reservation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: masteruser
--

ALTER TABLE ONLY public.reservation_history
    ADD CONSTRAINT reservation_history_reservation_id_fkey FOREIGN KEY (reservation_id) REFERENCES public.reservations(id) ON DELETE CASCADE;


--
-- Name: reservation_versions reservation_versions_reservation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: masteruser
--

ALTER TABLE ONLY public.reservation_versions
    ADD CONSTRAINT reservation_versions_reservation_id_fkey FOREIGN KEY (reservation_id) REFERENCES public.reservations(id) ON DELETE CASCADE;


--
-- Name: reservations reservations_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: masteruser
--

ALTER TABLE ONLY public.reservations
    ADD CONSTRAINT reservations_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id);


--
-- Name: reservations reservations_property_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: masteruser
--

ALTER TABLE ONLY public.reservations
    ADD CONSTRAINT reservations_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.properties(property_id);


--
-- Name: room_bookings room_bookings_property_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: masteruser
--

ALTER TABLE ONLY public.room_bookings
    ADD CONSTRAINT room_bookings_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.properties(property_id);


--
-- Name: room_bookings room_bookings_reservation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: masteruser
--

ALTER TABLE ONLY public.room_bookings
    ADD CONSTRAINT room_bookings_reservation_id_fkey FOREIGN KEY (reservation_id) REFERENCES public.reservations(id);


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: masteruser
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

\unrestrict du9ei23wcaBUmc5TO2zhrC6pHh5uxbz1XUgEllaHqEkLQSaxcjlLEUw0c2NTmnD

