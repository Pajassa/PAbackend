--
-- PostgreSQL database dump
--

\restrict T04VR0dsVE8iFyRfWidJ7PeUVLbCzzbaBCQgobgbfZv2yXUKbaxjCSyaJCLGcAh

-- Dumped from database version 16.13 (Ubuntu 16.13-0ubuntu0.24.04.1)
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
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    check_in_date date,
    check_out_date date,
    quantity numeric DEFAULT 1,
    food_amount numeric DEFAULT 0,
    item_type character varying(255),
    food_items jsonb DEFAULT '[]'::jsonb,
    food_items_json jsonb
);


ALTER TABLE public.invoice_items OWNER TO masteruser;

--
-- Name: COLUMN invoice_items.check_in_date; Type: COMMENT; Schema: public; Owner: masteruser
--

COMMENT ON COLUMN public.invoice_items.check_in_date IS 'Check-in date for the reservation (formerly G.I.D)';


--
-- Name: COLUMN invoice_items.check_out_date; Type: COMMENT; Schema: public; Owner: masteruser
--

COMMENT ON COLUMN public.invoice_items.check_out_date IS 'Check-out date for the reservation (formerly C.G.I.D)';


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
    food_total numeric DEFAULT 0,
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
    modification_tags text,
    food_items jsonb DEFAULT '[]'::jsonb
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
    status character varying(20) DEFAULT 'active'::character varying,
    occupancy character varying(50)
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
29	87	2026-03-26	2026-03-28	Confirmed	\N	8925.00	2026-03-28 11:21:58.466323	\N	\N	{"id": 87, "taxes": "5.00", "status": "Confirmed", "base_rate": "8500.00", "client_id": 55, "occupancy": "1", "created_at": "2026-03-26T12:58:30.497Z", "food_items": [], "guest_name": "Sameer Rajwade", "admin_email": "", "guest_email": "abelina.menezes@airworks.in, ps@pajasaapartments.com, accounts@pajasaapartments.com", "property_id": 50, "tariff_type": "As Per Contract", "check_in_str": "2026-03-26", "email_status": "Sent", "payment_mode": "Bill to Company", "total_tariff": "8925.00", "check_in_date": "2026-03-25T23:00:00.000Z", "check_in_time": "14:00:00", "check_out_str": "2026-03-28", "roomSelection": ["Common Bedroom-1"], "check_out_date": "2026-03-27T23:00:00.000Z", "check_out_time": "11:00:00", "contact_number": "9766535830", "reservation_no": "PAR-26-03-0002", "chargeable_days": 2, "additionalGuests": null, "modification_tag": null, "modification_tags": null, "modification_status": null}
30	91	2026-04-06	2026-04-09	Confirmed	\N	5512.50	2026-03-31 17:00:11.520885	\N	\N	{"id": 91, "taxes": "5.00", "status": "Confirmed", "base_rate": "5250.00", "client_id": 59, "occupancy": "1", "created_at": "2026-03-31T08:14:20.305Z", "food_items": [], "guest_name": "Bappaditya Mukherjee", "admin_email": "", "guest_email": "ps@pajasaapartments.com, accounts@pajasaapartments.com", "property_id": 37, "tariff_type": "As Per Email", "check_in_str": "2026-04-06", "email_status": "Unsent", "payment_mode": "Direct Payment", "total_tariff": "5512.50", "check_in_date": "2026-04-05T22:00:00.000Z", "check_in_time": "14:00:00", "check_out_str": "2026-04-09", "roomSelection": ["Master Bedroom-1"], "check_out_date": "2026-04-08T22:00:00.000Z", "check_out_time": "11:00:00", "contact_number": "NA", "reservation_no": "PAR-26-03-0006", "chargeable_days": 3, "additionalGuests": null, "modification_tag": null, "modification_tags": null, "modification_status": null}
31	94	2026-03-31	2026-04-02	Confirmed	\N	5775.00	2026-04-01 12:28:15.746664	\N	\N	{"id": 94, "taxes": "5.00", "status": "Confirmed", "base_rate": "5500.00", "client_id": 63, "occupancy": "2", "created_at": "2026-04-01T10:27:13.378Z", "food_items": [], "guest_name": "Prashant Jadhav + 1", "admin_email": "", "guest_email": "ps@pajasaapartments.com, accounts@pajasaapartments.com", "property_id": 44, "tariff_type": "As Per Contract", "check_in_str": "2026-03-31", "email_status": "Unsent", "payment_mode": "Bill to Company", "total_tariff": "5775.00", "check_in_date": "2026-03-30T22:00:00.000Z", "check_in_time": "14:00:00", "check_out_str": "2026-04-02", "roomSelection": ["Master Bedroom-1"], "check_out_date": "2026-04-01T22:00:00.000Z", "check_out_time": "11:00:00", "contact_number": "9425468862", "reservation_no": "PAR-26-04-0009", "chargeable_days": 2, "additionalGuests": null, "modification_tag": null, "modification_tags": null, "modification_status": null}
32	106	2026-04-13	2026-04-17	Confirmed	\N	8400.00	2026-04-11 11:05:13.052105	\N	\N	{"id": 106, "taxes": "5.00", "status": "Confirmed", "base_rate": "8000.00", "client_id": 67, "occupancy": "2", "created_at": "2026-04-08T10:42:40.397Z", "food_items": [], "guest_name": "Nirmal Chudgar + Ujjay Mohan + Pranjal Goswami", "admin_email": "", "guest_email": "ps@pajasaapartments.com, accounts@pajasaapartments.com", "property_id": 47, "tariff_type": "As Per Email", "check_in_str": "2026-04-13", "email_status": "Unsent", "payment_mode": "Direct Payment", "total_tariff": "8400.00", "check_in_date": "2026-04-13T00:00:00.000Z", "check_in_time": "14:00:00", "check_out_str": "2026-04-17", "roomSelection": ["Master Bedroom-1", "Common Bedroom-1"], "check_out_date": "2026-04-17T00:00:00.000Z", "check_out_time": "11:00:00", "contact_number": "9106677061", "reservation_no": "PAR-26-04-0021", "chargeable_days": 4, "additionalGuests": null, "modification_tag": null, "modification_tags": null, "modification_status": null}
\.


--
-- Data for Name: clients; Type: TABLE DATA; Schema: public; Owner: masteruser
--

COPY public.clients (id, active, client_name, gst_no, street_address, street_address_2, city, state, zip_code, phone_number, fax_number, mobile_number, email_address, web_address, created_at, updated_at) FROM stdin;
26	t	Pajasa Apartments 1										accounts@pajasaapartments.com		2025-12-08 11:46:46.174425	2025-12-08 11:46:46.174425
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
52	t	Orchid Private Limited												2026-01-27 12:42:14.802914	2026-01-27 12:42:14.802914
53	t	Mega Suryaurja Private Limited												2026-02-02 05:23:16.158311	2026-02-02 05:23:16.158311
3	t	Green Energy Corp	GSTIN11122	78 Nehru Place	Tower B	Delhi	Delhi	110019	0112233445	0115566778	9123456780	sales@greenenergy.com	http://greenenergy.com	2025-09-11 12:49:19.981009	2026-03-16 08:09:52.705
54	t	M Moser	27AAFCM3543A1ZV											2026-03-17 16:15:42.737134	2026-03-17 16:15:42.737134
55	f	Air Works India Engineering Private Limited	27AABCA1069P1ZF	Gate No 8, Old Airport, Near Kalina Military Camp.,	Santacruz-East, 400029	Mumbai	Maharashtra	400029			98206 57167	abelina.menezes@airworks.in		2026-03-24 09:56:21.164699	2026-03-24 11:32:07.96
58	f	Hindon India Pvt. Ltd.	09AAACH8860J2Z5	Hindon House, B-18, 2nd Floor, RDC, Raj Nagar,	Ghaziabad (Delhi NCR),	Delhi	Uttar Pradesh	201001			9910040591	mktg@hindon.co.in		2026-03-24 10:31:43.323821	2026-03-24 11:32:42.493
57	f	M/s Fujitec India Private Limited	27AAACF8048A1ZX	B wing 705 , 7th Floor, CST No. 16, 16/1 to 24 & 17 Kanakia wall street,	Chakala Taluka Andheri MSD Andheri Kurla Road, Andheri East	Mumbai	Maharashtra	400093				financesupport1@fujitec.co.in		2026-03-24 10:27:42.762419	2026-03-24 11:32:54.681
66	t	Shadowfax Technologies Pvt Ltd	27AAVCS6697K1Z3											2026-03-31 17:27:44.954479	2026-03-31 17:27:44.954479
59	f	ION Exchange (India) Limited	27AAACI1726L1ZK	Fourth Floor, Ion House, Dr. E. Moses Road, Mahalaxmi,		Mumbai	Maharashtra	400011				preeti.bhat@ionexchange.co.in		2026-03-24 10:35:14.59489	2026-03-24 11:36:10.566
60	f	Jungheinrich Lift Truck India Pvt. Ltd	27AACCJ7808G1ZH	Hiranandani Business Park, A-404, 4th floor,	Delphi “A” Wing, Central Ave, Powai,	Mumbai	Maharashtra	400076			84519 00234	vinita.muluskar@jungheinrich.in		2026-03-24 10:38:26.980485	2026-03-24 10:38:26.980485
61	f	M MOSER DESIGN ASSOCIATES INDIA PVT LTD	27AAFCM3543A1ZV	3, 3rd floor, Equinox Business park,	LBS Marg, Kurla West.	Mumbai	Maharashtra	400070	+91 22 6145 0700 			NehaP@mmoser.com		2026-03-24 10:41:19.223466	2026-03-24 11:41:33.626
62	f	Manash Lifestyle Private Limited.	27AAHCM7396M1ZL	1st Floor, B 101, Raheja Plaza,	L.B.S. Marg, Opp. R. City Mall	Mumbai	Maharashtra	400086			8652120940	rupesh.more@purplle.com		2026-03-24 10:50:22.696402	2026-03-24 10:50:22.696402
63	f	Maharashtra State Electricity Transmission Co. Ltd	27AAECM2936N1Z2								836 930 1800	Kangane490@gmail.com		2026-03-24 10:52:13.982991	2026-03-24 10:52:13.982991
64	f	OneCell Diagnostics India Pvt Ltd	27AADCO6575E1Z9	210, Ganga Osian Square - Building B,	Wakad Road Kaspate Wasti, Wakad, Pimpri-Chinchwad	Pune	Maharashtra	411057			77188 16623	yogesh.jadhav@1cell.ai		2026-03-24 10:54:21.88998	2026-03-24 10:54:21.88998
65	f	First Livingspaces Private Limited	27AABCF0036F1Z6	Raheja Platinum, Road, Off Andheri - Kurla Road,	Andheri East Marol,	Mumbai	Maharashtra	400059				priyanka.sakrecha@tcgre.com		2026-03-24 10:56:46.511703	2026-03-24 10:56:46.511703
56	t	B&B Analytics Private Limited Ltd	27AAFCB1063J1ZS	08B-101A, We Work Raheja Platinum Road	Off Andheri-Kurla Road, Sag Baug Marol, Andheri East,	Mumbai	Maharashtra	400059			9820133352	maheswari.venkat@aminagroup.com		2026-03-24 09:58:58.291067	2026-03-26 11:14:58.627
67	t	Bevolve												2026-04-08 10:40:38.216352	2026-04-08 10:40:38.216352
68	t	Bevolve												2026-04-11 10:56:22.01465	2026-04-11 10:56:22.01465
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
36	63	27BOWPS5234R1ZO	2026-03-24 17:33:48.943109
37	64	27AEZPC4308Q1ZS	2026-03-24 17:35:52.871395
38	65	27AFBFS5497K1ZB	2026-03-24 17:38:48.071091
39	66	27AAECO5441Q1ZW	2026-03-24 17:41:17.772726
40	67	27DAPPK6384F1Z6	2026-03-24 17:43:11.21579
41	68	27AAAAK0187B1Z2	2026-03-24 17:45:50.790862
42	69	27ANZPM5631K1Z7	2026-03-24 17:47:04.595541
43	70	27AAOPF7963M1ZX	2026-03-24 17:49:11.571477
44	71	27AAMCM6714C1ZH	2026-03-24 17:50:41.557708
45	72	27AADFZ0474G1Z2	2026-03-24 17:52:08.999269
46	73	27ACXPD2281P2ZU	2026-03-24 17:54:17.813362
47	74	27CKQPS1067M2ZB	2026-03-24 17:56:54.747802
48	75	27AABCA1069P1ZF	2026-03-26 13:54:10.547409
49	76	123456789101123	2026-04-08 10:09:50.260397
\.


--
-- Data for Name: host_information; Type: TABLE DATA; Schema: public; Owner: masteruser
--

COPY public.host_information (host_id, host_name, host_pan_number, rating, host_email, host_contact_number, created_at, host_owner_name) FROM stdin;
63	Rely on US	BOWPS5234R	4.0	prashant@relyonservices.in	9820736442	2026-03-24 17:33:48.936381	Prashant Surve
64	Veridical Hospitality	AEZPC4308Q	4.0	booking@veridicalhospitality.com	9833168144	2026-03-24 17:35:52.863721	Anindita Chatterjee
65	Shri Shri Corporate Advisors LLP	AFBFS5497K	4.0	shrishricorporateadvisors@gmail.com	9594364440	2026-03-24 17:38:48.064809	Pranay
66	OSI HOSPITALITY PRIVATE LIMITED	AAECO5441Q	4.0	sales@osiapartments.in	9766693868	2026-03-24 17:41:17.766716	Prem Mamidi
67	WELCOME HOME AND SERVICE APARTMENT	DAPPK6384F	4.0	welcomehomeserviceapartments@gmail.com	7979762299	2026-03-24 17:43:11.210622	Stanley
68	Ashok Deluxe Apartments	AAAAK0187B	4.0	info@ashokdeluxe.com	9833787741	2026-03-24 17:45:50.782569	Heena
69	Divine Art House	ANZPM5631K	4.0	enquiry@lite-stays.com	8050890867	2026-03-24 17:47:04.585297	Eshan Mehra
70	Mint Hospitality Services	AAOPF7963M	4.0	info@minthospitalityservices.in	8122887313	2026-03-24 17:49:11.567484	Ahmed Faheem
71	MH12 Services Stay Solution Private Limited	AAMCM6714C	4.0	amit.batra@mh12services.com	9890049967	2026-03-24 17:50:41.550909	Amit Batra
72	Zenith Hospitality Services	AADFZ0474G	4.0	zenithhospitalityservices@gmail.com	7400057303	2026-03-24 17:52:08.99135	Karishma Janjirkar
73	Go BNB	ACXPD2281P	4.0	gobnbstay@gmail.com	9004391394	2026-03-24 17:54:17.807829	Susheela Rao
74	Staywood Service Apartment	CKQPS1067M	4.0	operations@staywood.in	9326845060	2026-03-24 17:56:54.743108	Megha
75	PAJASA Stay Solutions Pvt Ltd	AABCA1069P	4.0	ps@pajasaapartments.com	7738777602	2026-03-26 13:54:10.547409	Paras Sangwan
76	Bedchambers Serviced Apartments	ABCDE1234F	4.0	sales@bedchambers.in	8588888655	2026-04-08 10:09:50.260397	Abhishek
\.


--
-- Data for Name: invoice_items; Type: TABLE DATA; Schema: public; Owner: masteruser
--

COPY public.invoice_items (id, invoice_id, location, description, hsn_sac_code, days, rate, tax_amount, total_amount, created_at, updated_at, check_in_date, check_out_date, quantity, food_amount, item_type, food_items, food_items_json) FROM stdin;
60	39	Powai	Deepika Nair	\N	1	343.00	5.00	458.00	2026-02-20 18:35:19.340928	2026-02-20 18:35:19.340928	2026-02-06	2026-02-07	1	0	\N	[]	[{"foodTax": "10.00", "foodCGST": "5.00", "foodSGST": "5.00", "foodAmount": "100.00", "foodTariff": "100", "foodQuantity": "1", "foodChargeType": "Veg Lunch", "foodTaxPercentage": "10"}]
42	31	Kalina	Ankit	\N	1	4850.00	5.00	7019.80	2026-02-14 18:09:22.506379	2026-02-14 18:09:22.506379	2026-02-11	2026-02-12	1	0	\N	[]	[{"foodTax": "404.80", "foodCGST": "202.40", "foodSGST": "202.40", "foodAmount": "1760.00", "foodTariff": "440", "foodQuantity": "4", "foodChargeType": "Veg Lunch", "foodTaxPercentage": "23"}]
46	33	Mumbai	Mega + Surya	\N	6	4500.00	5.00	27005.00	2026-02-16 16:49:12.508652	2026-02-16 16:49:12.508652	2026-02-08	2026-02-14	1	0	\N	[]	[{"foodTax": "0", "foodCGST": "0", "foodSGST": "0", "foodAmount": "0", "foodTariff": "0", "foodQuantity": "1", "foodChargeType": "Veg Lunch", "foodTaxPercentage": "0"}]
47	33	Powai	Deepika Nair	\N	1	343.00	5.00	348.00	2026-02-16 16:49:12.508652	2026-02-16 16:49:12.508652	2026-02-06	2026-02-07	1	0	\N	[]	[{"foodTax": "0", "foodCGST": "0", "foodSGST": "0", "foodAmount": "0", "foodTariff": "0", "foodQuantity": "1", "foodChargeType": "Veg Lunch", "foodTaxPercentage": "0"}]
48	34	Mumbai	Mega + Surya	\N	6	4500.00	5.00	33655.00	2026-02-16 16:57:47.940375	2026-02-16 16:57:47.940375	2026-02-08	2026-02-14	1	0	\N	[]	[{"foodTax": "0.00", "foodCGST": "0.00", "foodSGST": "0.00", "foodAmount": "6650.00", "foodTariff": "6650", "foodQuantity": "1", "foodChargeType": "Veg Lunch", "foodTaxPercentage": "0"}, {"foodTax": "", "foodCGST": "", "foodSGST": "", "foodAmount": "", "foodTariff": "", "foodQuantity": "1", "foodChargeType": "Veg Lunch", "foodTaxPercentage": "0"}]
49	34	Powai	Deepika Nair	\N	1	343.00	5.00	348.00	2026-02-16 16:57:47.940375	2026-02-16 16:57:47.940375	2026-02-06	2026-02-07	1	0	\N	[]	[{"foodTax": "0", "foodCGST": "0", "foodSGST": "0", "foodAmount": "0", "foodTariff": "0", "foodQuantity": "1", "foodChargeType": "Veg Lunch", "foodTaxPercentage": "0"}]
54	35	Mumbai	harshit shukla	\N	6	4500.00	5.00	27005.00	2026-02-19 11:07:56.553116	2026-02-19 11:07:56.553116	2026-02-08	2026-02-14	1	0	\N	[]	[{"foodTax": "0", "foodCGST": "0", "foodSGST": "0", "foodAmount": "0", "foodTariff": "0", "foodQuantity": "1", "foodChargeType": "Veg Lunch", "foodTaxPercentage": "0"}]
56	37	Powai	Liliies + Daisies	\N	3	5000.00	5.00	15005.00	2026-02-19 11:38:55.962734	2026-02-19 11:38:55.962734	2026-01-26	2026-01-29	1	0	\N	[]	[{"foodTax": "0", "foodCGST": "0", "foodSGST": "0", "foodAmount": "0", "foodTariff": "0", "foodQuantity": "1", "foodChargeType": "Veg Lunch", "foodTaxPercentage": "0"}]
61	38	Santacruz	Manish Joshi	\N	4	5500.00	1100.00	23100.00	2026-03-14 10:54:30.121748	2026-03-14 10:54:30.121748	2026-03-19	2026-03-23	1	0	\N	[]	[{"foodTax": "25.00", "foodCGST": "12.50", "foodSGST": "12.50", "foodTotal": "525.00", "foodAmount": "500.00", "foodTariff": "250", "foodQuantity": "2", "foodChargeType": "Veg Lunch", "foodTaxPercentage": "5.00"}]
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
23	76
23	75
23	72
26	77
27	76
27	72
28	81
28	72
29	82
29	81
30	83
30	75
31	83
32	83
33	82
33	81
34	82
34	81
35	82
36	81
39	81
\.


--
-- Data for Name: invoices; Type: TABLE DATA; Schema: public; Owner: masteruser
--

COPY public.invoices (id, invoice_number, reservation_id, invoice_date, invoice_to, state_for_billing, pan_number, status, payment_method, currency, conversion_rate, sub_total, tax_total, grand_total, display_taxes, display_food_charge, extra_services, services_name, services_amount, pdf_password, page_break, guest_name_width, round_off_value, created_at, updated_at, food_total) FROM stdin;
31	PAR-26-02-0100	83	2026-02-14		Maharashtra		Draft	Select the Payment Method	INR	1.0000	4850.00	5.00	7019.80	SGST & CGST	t	f		0.00		5	18.00	0.00	2026-02-14 18:09:22.506379	2026-02-14 18:09:22.506379	0
39	PAR-26-01-000006	81	2026-02-21		Maharashtra		Draft	Select the Payment Method	INR	1.0000	443.00	15.00	458.00	SGST & CGST	t	f		0.00		5	18.00	0.00	2026-02-20 18:35:19.340928	2026-02-20 18:35:19.340928	0
33	PAR-26-02-000001	82	2026-02-16		Maharashtra		Draft	Select the Payment Method	INR	1.0000	27343.00	10.00	27353.00	SGST & CGST	t	f		0.00		5	18.00	0.00	2026-02-16 16:49:12.508652	2026-02-16 16:49:12.508652	0
34	PAR-26-02-000001-1	82	2026-02-16		Maharashtra		Draft	Select the Payment Method	INR	1.0000	33993.00	10.00	34003.00	SGST & CGST	t	f		0.00		5	18.00	0.00	2026-02-16 16:57:47.940375	2026-02-16 16:57:47.940375	0
35	PAR-26-02-000001-2	82	2026-02-19		Maharashtra		Draft	Select the Payment Method	INR	1.0000	330449.00	5.00	330454.00	SGST & CGST	f	t	harshithukla643883	303449.00		5	18.00	0.00	2026-02-19 10:15:30.90497	2026-02-19 11:07:56.553116	0
37	PAR-26-01-000004	\N	2026-02-19	Pajasa Agrro	Maharashtra		Draft	Select the Payment Method	INR	1.0000	15000.00	5.00	15005.00	SGST & CGST	f	f		0.00		5	18.00	0.00	2026-02-19 11:35:27.013411	2026-02-19 11:38:55.962734	0
38	RES-CONF-1769327205766-017	\N	2026-02-20	Redknee Solutions Private Limited	Maharashtra		Draft	Select the Payment Method	INR	1.0000	22500.00	1125.00	23625.00	SGST & CGST	t	f		0.00		5	18.00	0.00	2026-02-20 15:04:12.963517	2026-03-14 10:54:30.121748	0
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
33	400104	Mumbai
34	400070	Mumbai
35	411006	Pune
\.


--
-- Data for Name: properties; Type: TABLE DATA; Schema: public; Owner: masteruser
--

COPY public.properties (property_id, property_status, host_id, ivr_number, pincode_id, manual_pincode, city, location, post_id, property_type, manual_host_name, contact_person, contact_number, email_id, caretaker_name, caretaker_number, note, check_in_time, check_out_time, master_bedroom, common_bedroom, landmark, address1, address2, address3, thumbnail, property_url, updated_at) FROM stdin;
37	inactive	63		5	\N	Mumbai	Dadar		2 BHK	\N	Prashant Surve	9820736442	prashant@relyonservices.in				14:00:00	11:00:00	1	1		903,9th floor,Ram Swaroop Palai Tower	Baburao Parulekar Marg, Dadar West,	Mumbai-400028			2026-03-24 18:00:50.933221
38	inactive	64		3	\N	Mumbai	Powai		3 BHK	\N	Anindita Chatterjee	9833168144	booking@veridicalhospitality.com				14:00:00	11:00:00	2	1		504/505,5th Floor, Panch Smruti Tower	Chandivali Farm Road, Behind SM Shetty School Powai,	Mumbai-400076			2026-03-24 18:02:28.424148
39	inactive	64		2	\N	Mumbai	Bandra		2 BHK	\N	Anindita Chatterjee	9833168144	booking@veridicalhospitality.com				14:00:00	11:00:00	1	1		Flat No. 401, 4th Floor, Sindhu Ratan Building,	Opposite Guru Nanak Hospital BKC,	Mumbai-400051			2026-03-24 18:04:06.458246
40	inactive	65		2	\N	Mumbai	Bandra		4 BHK	\N	Pranay	9594364440	shrishricorporateadvisors@gmail.com				14:00:00	11:00:00	3	1		Flat No 11, Jasmine CHS, Madhusudan Kalaker Marg, 	Behind Gurunanak Hospital, Kalanagar, 	Bandra East, Mumbai 400051			2026-03-24 18:07:01.728874
41	inactive	66		23	\N	Mumbai	Powai		1 BHK	\N	Prem Mamidi	9766693868	sales@osiapartments.in				14:00:00	11:00:00	1	0		Aleta Residencies, Off, Saki Vihar Rd,	Tunga Village, Chandivali, 	Powai, Mumbai - 400072			2026-03-24 18:08:34.523165
42	inactive	66		23	\N	Mumbai	Powai		2 BHK	\N	Prem Mamidi	9766693868	sales@osiapartments.in				14:00:00	11:00:00	1	1		Aleta Residencies, Off, Saki Vihar Rd,	Tunga Village, Chandivali,	Powai, Mumbai - 400072			2026-03-24 18:10:01.780364
43	inactive	67		2	\N	Mumbai	Bandra		2 BHK	\N	Stanley	7979762299	welcomehomeserviceapartments@gmail.com				14:00:00	11:00:00	1	1		Ground floor Sai Prasad CHS Near Bandra Court	Next to Provident Fund office, Service Lane 	Bandra East, Mumbai-400051			2026-03-24 18:12:16.190963
44	inactive	67		30	\N	Mumbai	Lower Parel		2 BHK	\N	Stanley	7979762299	welcomehomeserviceapartments@gmail.com				14:00:00	11:00:00	1	1		Flat No 101, 1st Floor, Ison Heights, N M Joshi Marg,	Pragati Indl Est, Delisle Road, 	Lower Parel, Mumbai - 400011			2026-03-24 18:14:40.774336
45	inactive	68		23	\N	Mumbai	Andheri		studio	\N	Heena	9833787741	info@ashokdeluxe.com				14:00:00	11:00:00	1	0		Ashok Deluxe apartments, Ashok Nagar Bldg # 3, Off Marol Military Road,	Near Raj Oil Mill, Marol,	Andheri E, Mumbai-400072			2026-03-24 18:16:11.670814
46	inactive	68		23	\N	Mumbai	Andheri		2 BHK	\N	Heena	9833787741	info@ashokdeluxe.com				14:00:00	11:00:00	1	1		Ashok Deluxe apartments, Ashok Nagar Bldg # 3, Off Marol Military Road,	Near Raj Oil Mill, Marol	Andheri E, Mumbai-400072			2026-03-24 18:17:11.758375
47	inactive	70		23	\N	Mumbai	Powai		2 BHK	\N	Ahmed Faheem	8122887313	info@minthospitalityservices.in				14:00:00	11:00:00	1	1		Flat No-805, B-Wing, Nahar Cayenne, 	Near to D Mart Chandivali,	Powai, Mumbai 400072			2026-03-24 18:19:33.871877
48	inactive	70		23	\N	Mumbai	Powai		2 BHK	\N	Ahmed Faheem	8122887313	info@minthospitalityservices.in				14:00:00	11:00:00	1	1		Flat No-905, B-Wing, Nahar Cayenne,	Near to D Mart Chandivali, 	Powai, Mumbai, Maharashtra 400072			2026-03-24 18:20:42.727719
49	inactive	71		35	\N	Pune	Kalyani Nagar		3 BHK	\N	Amit Batra	9890049967	amit.batra@mh12services.com	Shashi 	9892188659		14:00:00	11:00:00	2	1		Flat No 302, Marvel Crescent,Lane No. 3A,	Behind Vivero international school,  Near Kalyani Nagar metro station	Kalyani Nagar, Pune -411006			2026-03-24 18:23:48.522489
50	active	75		4	\N	Mumbai	Santacruz		3 BHK	\N	Paras Sangwan	7738777602	ps@pajasaapartments.com				14:00:00	11:00:00	2	1		B-903 Sanghvi Infenia Kalina,Vidyanagari Marg,	opposite University Campus, Kalina,	Santacruz East, Mumbai 400098			2026-03-26 13:56:24.285746
51	active	64		2	\N	Mumbai	BKC		2 BHK	\N	Anindita Chatterjee	9833168144	booking@veridicalhospitality.com				14:00:00	11:00:00	2	1		Flat No. 203, 2nd Floor, Sindhu Ratan Building ,	Opposite Guru Nanak Hospital BKC, Mumbai-400051				2026-04-06 09:34:05.70319
52	active	64		3	\N	Mumbai	Powai		3 BHK	\N	Anindita Chatterjee	9833168144	booking@veridicalhospitality.com				14:00:00	11:00:00	2	1		Flat No. 601, 6th Floor, Panch Smruti Tower, Chandivali Farm Road Hiranandani Garden	Behind SM Shetty School Powai, Mumbai-400076				2026-04-08 10:06:18.508728
53	active	76		29	\N	Gurgaon	Sushant Lok		2 BHK	\N	Abhishek	8588888655	sales@bedchambers.in				14:00:00	11:00:00	1	1		1 Block-C, C-524, Block C, Sushant Lok Phase I, 	Sector 43, Gurugram, Haryana 122001				2026-04-08 10:11:29.865454
54	active	64		3	\N	Mumbai	Powai		2 BHK	\N	Anindita Chatterjee	9833168144	booking@veridicalhospitality.com				14:00:00	11:00:00	1	1		Flat No. 1002, 10th Floor, Panch Smruti Tower, Chandivali Farm Road Hiranandani Garden,	Behind SM Shetty School Powai, Mumbai-400076				2026-04-10 06:18:27.78075
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
\.


--
-- Data for Name: reservation_additional_info; Type: TABLE DATA; Schema: public; Owner: masteruser
--

COPY public.reservation_additional_info (id, reservation_id, host_name, host_email, host_base_rate, host_taxes, host_total_amount, contact_person, contact_number, comments, services, note, created_at, apartment_type, host_payment_mode) FROM stdin;
54	86	OSI HOSPITALITY PRIVATE LIMITED	sales@osiapartments.in	3850.00	5.00	4042.50	Prem Mamidi	9766693868		{"wifi": true, "vegLunch": false, "vegDinner": false, "nonVegLunch": false, "nonVegDinner": false, "morningBreakfast": true}		2026-03-26 10:19:13.996905	As Per Contract	Bill to Pajasa
55	87	PAJASA Stay Solutions Pvt Ltd	ps@pajasaapartments.com	6500.00	5.00	6825.00	Paras Sangwan			{"wifi": true, "vegLunch": false, "vegDinner": true, "nonVegLunch": false, "nonVegDinner": false, "morningBreakfast": true}		2026-03-26 13:58:30.647598	As Per Contract	Bill to Pajasa
56	88	OSI HOSPITALITY PRIVATE LIMITED	sales@osiapartments.in	3500.00	5.00	3675.00	Prem Mamidi	9766693868		{"wifi": true, "vegLunch": false, "vegDinner": false, "nonVegLunch": false, "nonVegDinner": false, "morningBreakfast": true}		2026-03-28 11:29:55.003292	As Per Contract	Bill to Pajasa
57	89	MH12 Services Stay Solution Private Limited	amit.batra@mh12services.com	3000.00	5.00	3150.00	Amit Batra	9890049967		{"wifi": true, "vegLunch": false, "vegDinner": false, "nonVegLunch": false, "nonVegDinner": false, "morningBreakfast": true}		2026-03-30 06:53:04.936674	As Per Contract	Bill to Pajasa
58	90	Mint Hospitality Services	info@minthospitalityservices.in	4500.00	5.00	4725.00	Ahmed Faheem	8122887313		{"wifi": true, "vegLunch": false, "vegDinner": false, "nonVegLunch": false, "nonVegDinner": false, "morningBreakfast": true}		2026-03-30 11:16:20.194512	As Per Contract	Bill to Pajasa
59	91	Rely on US	prashant@relyonservices.in	4000.00	5.00	4200.00	Prashant Surve			{"wifi": true, "vegLunch": false, "vegDinner": false, "nonVegLunch": false, "nonVegDinner": false, "morningBreakfast": true}		2026-03-31 10:14:21.20419	As Per Contract	Bill to Pajasa
60	92	Mint Hospitality Services	info@minthospitalityservices.in	4500.00	5.00	4725.00	Ahmed Faheem	8122887313		{"wifi": true, "vegLunch": false, "vegDinner": false, "nonVegLunch": false, "nonVegDinner": false, "morningBreakfast": true}		2026-03-31 17:29:11.992197	As Per Contract	Bill to Pajasa
61	93	MH12 Services Stay Solution Private Limited	amit.batra@mh12services.com	4500.00	5.00	4725.00	Amit Batra	9890049967		{"wifi": true, "vegLunch": false, "vegDinner": false, "nonVegLunch": false, "nonVegDinner": false, "morningBreakfast": true}		2026-04-01 11:53:06.760298	As Per Contract	Bill to Pajasa
62	94	WELCOME HOME AND SERVICE APARTMENT	welcomehomeserviceapartments@gmail.com	4000.00	5.00	4200.00	Stanley			{"wifi": true, "vegLunch": false, "vegDinner": false, "nonVegLunch": false, "nonVegDinner": false, "morningBreakfast": true}		2026-04-01 12:27:14.072627	As Per Contract	Bill to Pajasa
63	95	OSI HOSPITALITY PRIVATE LIMITED	sales@osiapartments.in	3850.00	5.00	4042.50	Prem Mamidi	9766693868		{"wifi": true, "vegLunch": false, "vegDinner": false, "nonVegLunch": false, "nonVegDinner": false, "morningBreakfast": true}		2026-04-02 12:29:53.70388	As Per Contract	Bill to Pajasa
64	96	Mint Hospitality Services	info@minthospitalityservices.in	3500.00	5.00	3675.00	Makarand	8976695050 		{"wifi": true, "vegLunch": false, "vegDinner": false, "nonVegLunch": false, "nonVegDinner": false, "morningBreakfast": true}		2026-04-03 13:55:28.27961	As Per Contract	Bill to Pajasa
65	97	PAJASA Stay Solutions Pvt Ltd	ps@pajasaapartments.com	5500.00	5.00	5775.00	Paras Sangwan	7738777602		{"wifi": true, "vegLunch": false, "vegDinner": false, "nonVegLunch": false, "nonVegDinner": false, "morningBreakfast": true}		2026-04-03 15:27:02.950088	As Per Contract	Bill to Pajasa
66	98	Veridical Hospitality	booking@veridicalhospitality.com	2500.00	5.00	2625.00	Anindita Chatterjee	9833168144		{"wifi": true, "vegLunch": false, "vegDinner": true, "nonVegLunch": false, "nonVegDinner": false, "morningBreakfast": true}		2026-04-04 11:49:53.586206	As Per Contract	Bill to Pajasa
67	99	Veridical Hospitality	booking@veridicalhospitality.com	2200.00	5.00	2310.00	Anindita Chatterjee	9833168144		{"wifi": true, "vegLunch": false, "vegDinner": false, "nonVegLunch": false, "nonVegDinner": false, "morningBreakfast": true}		2026-04-08 10:13:44.52615	As Per Contract	Bill to Pajasa
68	100	Veridical Hospitality	booking@veridicalhospitality.com	2000.00	5.00	2100.00	Anindita Chatterjee	9833168144		{"wifi": false, "vegLunch": false, "vegDinner": false, "nonVegLunch": false, "nonVegDinner": false, "morningBreakfast": false}		2026-04-08 10:15:34.388387	As Per Contract	Bill to Pajasa
69	101	Veridical Hospitality	booking@veridicalhospitality.com	2000.00	5.00	2100.00	Anindita Chatterjee	9833168144		{"wifi": false, "vegLunch": false, "vegDinner": false, "nonVegLunch": false, "nonVegDinner": false, "morningBreakfast": false}		2026-04-08 10:17:51.443534	As Per Contract	Bill to Pajasa
70	102	Veridical Hospitality	booking@veridicalhospitality.com	2000.00	5.00	2100.00	Anindita Chatterjee	9833168144		{"wifi": true, "vegLunch": false, "vegDinner": false, "nonVegLunch": false, "nonVegDinner": false, "morningBreakfast": true}		2026-04-08 10:19:41.323699	As Per Contract	Bill to Pajasa
71	103	Veridical Hospitality	booking@veridicalhospitality.com	2000.00	5.00	2100.00	Anindita Chatterjee	9833168144		{"wifi": true, "vegLunch": false, "vegDinner": false, "nonVegLunch": false, "nonVegDinner": false, "morningBreakfast": true}		2026-04-08 10:21:10.582709	As Per Contract	Bill to Pajasa
72	104	Mint Hospitality Services	info@minthospitalityservices.in	5000.00	5.00	5250.00	Ahmed Faheem	8122887313		{"wifi": true, "vegLunch": false, "vegDinner": false, "nonVegLunch": false, "nonVegDinner": false, "morningBreakfast": true}		2026-04-08 10:36:13.089034	As Per Contract	Bill to Pajasa
73	105	Bedchambers Serviced Apartments	sales@bedchambers.in	5000.00	5.00	5250.00	Abhishek	8588888655		{"wifi": true, "vegLunch": false, "vegDinner": false, "nonVegLunch": false, "nonVegDinner": false, "morningBreakfast": true}		2026-04-08 10:38:32.632203	As Per Contract	Bill to Pajasa
75	107	OSI HOSPITALITY PRIVATE LIMITED	sales@osiapartments.in	3850.00	5.00	4042.50	Prem Mamidi	9766693868		{"wifi": true, "vegLunch": false, "vegDinner": false, "nonVegLunch": false, "nonVegDinner": false, "morningBreakfast": true}		2026-04-08 10:58:57.304031	As Per Contract	Bill to Pajasa
76	108	Veridical Hospitality	booking@veridicalhospitality.com	2000.00	5.00	2100.00	Anindita Chatterjee	9833168144		{"wifi": true, "vegLunch": false, "vegDinner": false, "nonVegLunch": false, "nonVegDinner": false, "morningBreakfast": true}		2026-04-10 06:20:22.746903	As Per Contract	Bill to Pajasa
77	109	PAJASA Stay Solutions Pvt Ltd	ps@pajasaapartments.com	5000.00	5.00	5250.00	Paras Sangwan	7738777602		{"wifi": true, "vegLunch": false, "vegDinner": false, "nonVegLunch": false, "nonVegDinner": false, "morningBreakfast": true}		2026-04-11 10:42:15.699859	As Per Contract	Bill to Pajasa
78	110	Mint Hospitality Services	info@minthospitalityservices.in	3000.00	5.00	3150.00	Ahmed Faheem	8122887313		{"wifi": true, "vegLunch": false, "vegDinner": false, "nonVegLunch": false, "nonVegDinner": false, "morningBreakfast": true}		2026-04-11 10:54:58.575109	As Per Contract	Bill to Pajasa
79	111	OSI HOSPITALITY PRIVATE LIMITED	sales@osiapartments.in	3850.00	5.00	4042.50	Prem Mamidi	9766693868		{"wifi": true, "vegLunch": false, "vegDinner": false, "nonVegLunch": false, "nonVegDinner": false, "morningBreakfast": true}		2026-04-11 10:58:59.91805	As Per Contract	Bill to Pajasa
80	112	Ashok Deluxe Apartments	info@ashokdeluxe.com	3750.00	5.00	3937.50	Heena	9833787741		{"wifi": true, "vegLunch": false, "vegDinner": false, "nonVegLunch": false, "nonVegDinner": false, "morningBreakfast": true}		2026-04-11 11:01:04.446046	As Per Contract	Bill to Pajasa
74	106	Mint Hospitality Services	info@minthospitalityservices.in	6000.00	5.00	6300.00	Ahmed Faheem			{"wifi": true, "vegLunch": false, "vegDinner": false, "nonVegLunch": false, "nonVegDinner": false, "morningBreakfast": true}		2026-04-08 10:42:42.481082	As Per Contract	Bill to Pajasa
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
\.


--
-- Data for Name: reservations; Type: TABLE DATA; Schema: public; Owner: masteruser
--

COPY public.reservations (id, reservation_no, client_id, property_id, guest_name, guest_email, contact_number, check_in_date, check_out_date, check_in_time, check_out_time, occupancy, base_rate, taxes, total_tariff, payment_mode, tariff_type, chargeable_days, admin_email, status, created_at, email_status, modification_status, modification_tag, modification_tags, food_items) FROM stdin;
86	PAR-26-03-0001	56	41	Manish Soni	maheswari.venkat@aminagroup.com, ps@pajasaapartments.com, accounts@pajasaapartments.com	9782275757	2026-04-01	2026-04-02	14:00:00	11:00:00	1	4800.00	5.00	5040.00	Bill to Company	As Per Contract	1		Confirmed	2026-03-26 10:19:13.488	Unsent	\N	\N	\N	[]
103	PAR-26-04-0018	58	52	Ashutosh Sharma  	mktg@hindon.co.in, ps@pajasaapartments.com, accounts@pajasaapartments.com	NA	2026-04-29	2026-04-30	14:00:00	11:00:00	1	3500.00	5.00	3675.00	Bill to Company	As Per Contract	1		Confirmed	2026-04-08 10:21:08.497	Unsent	\N	\N	\N	[]
104	PAR-26-04-0019	56	47	Ajay Kumar + 1 + Kid	maheswari.venkat@aminagroup.com, ps@pajasaapartments.com, accounts@pajasaapartments.com	9599 600 691	2026-04-09	2026-04-13	14:00:00	11:00:00	2	5250.00	5.00	5512.50	Bill to Company	As Per Contract	4		Confirmed	2026-04-08 10:36:11.05	Unsent	\N	\N	\N	[]
92	PAR-26-03-0007	66	47	Saurabh Malhotra	ps@pajasaapartments.com, accounts@pajasaapartments.com	8269481170	2026-03-31	2026-04-02	14:00:00	11:00:00	1	5000.00	5.00	5250.00	Bill to Company	As Per Contract	2		Confirmed	2026-03-31 17:29:11.118	Sent	\N	\N	\N	[]
105	PAR-26-04-0020	57	53	Sharadh Prassad H K + Prakasha H V.	financesupport1@fujitec.co.in, ps@pajasaapartments.com, accounts@pajasaapartments.com	NA	2026-04-08	2026-05-01	14:00:00	11:00:00	2	6000.00	5.00	6300.00	Bill to Company	As Per Contract	23		Confirmed	2026-04-08 10:38:30.624	Unsent	\N	\N	\N	[]
91	PAR-26-03-0006	59	37	Bappaditya Mukherjee	ps@pajasaapartments.com, accounts@pajasaapartments.com	9820736442	2026-04-05	2026-04-09	14:00:00	11:00:00	1	5250.00	5.00	5512.50	Direct Payment	As Per Email	4		Modified	2026-03-31 10:14:20.305	Sent	\N	\N	Preponed	[]
88	PAR-26-03-0003	56	41	Amir Wani	ps@pajasaapartments.com, accounts@pajasaapartments.com	9971817009	2026-04-06	2026-04-10	14:00:00	11:00:00	1	4800.00	5.00	5040.00	Bill to Company	As Per Contract	4		Confirmed	2026-03-28 11:29:53.445	Unsent	\N	\N	\N	[]
89	PAR-26-03-0004	61	49	Gnanaguru M + Majid Khan	ps@pajasaapartments.com, accounts@pajasaapartments.com	8657509750	2026-03-30	2026-04-01	14:00:00	11:00:00	1	4000.00	5.00	4200.00	Bill to Company	As Per Contract	2		Confirmed	2026-03-30 06:53:02.548	Unsent	\N	\N	\N	[]
94	PAR-26-04-0009	63	44	Prashant Jadhav + 1	ps@pajasaapartments.com, accounts@pajasaapartments.com	7979762299	2026-03-31	2026-04-04	14:00:00	11:00:00	2	5500.00	5.00	5775.00	Bill to Company	As Per Contract	4		Modified	2026-04-01 12:27:13.378	Unsent	\N	\N	Extended	[]
93	PAR-26-04-0008	61	49	Gnananguru G + Majid Khan + 1	ps@pajasaapartments.com, accounts@pajasaapartments.com	8657509750	2026-04-06	2026-05-06	14:00:00	11:00:00	3	6000.00	5.00	6300.00	Bill to Company	As Per Contract	30		Confirmed	2026-04-01 11:53:06	Unsent	\N	\N	\N	[]
95	PAR-26-04-0010	56	41	Manish Soni	ps@pajasaapartments.com, accounts@pajasaapartments.com	9782275757	2026-04-08	2026-04-09	14:00:00	11:00:00	1	4800.00	5.00	5040.00	Bill to Company	As Per Contract	1		Confirmed	2026-04-02 12:29:53.377	Unsent	\N	\N	\N	[]
96	PAR-26-04-0011	56	47	Amit kumar Das	maheswari.venkat@aminagroup.com, ps@pajasaapartments.com, accounts@pajasaapartments.com, stay@pajasaapartments.com	NA	2026-04-05	2026-04-19	14:00:00	11:00:00	1	4800.00	5.00	5040.00	Bill to Company	As Per Contract	14		Confirmed	2026-04-03 13:55:27.021	Unsent	\N	\N	\N	[]
97	PAR-26-04-0012	55	50	Chandan Bhatnagar	abelina.menezes@airworks.in, ps@pajasaapartments.com, accounts@pajasaapartments.com	8989622557	2026-04-04	2026-04-30	14:00:00	11:00:00	1	8500.00	5.00	8925.00	Bill to Company	As Per Contract	26		Confirmed	2026-04-03 15:27:01.394	Unsent	\N	\N	\N	[]
87	PAR-26-03-0002	55	50	Sameer Rajwade	abelina.menezes@airworks.in, ps@pajasaapartments.com, accounts@pajasaapartments.com	7738777602	2026-03-26	2026-04-01	14:00:00	11:00:00	1	8500.00	5.00	8925.00	Bill to Company	As Per Contract	6		Modified	2026-03-26 13:58:30.497	Sent	\N	\N	Extended	[]
107	PAR-26-04-0022	56	41	Amir Wani	maheswari.venkat@aminagroup.com, ps@pajasaapartments.com, accounts@pajasaapartments.com	9971817009	2026-05-12	2026-05-24	14:00:00	11:00:00	1	4800.00	5.00	5040.00	Bill to Company	As Per Contract	12		Confirmed	2026-04-08 10:58:55.261	Unsent	\N	\N	\N	[]
90	PAR-26-03-0005	14	47	Tanmay Gupta	ps@pajasaapartments.com, accounts@pajasaapartments.com	NA	2026-04-06	2026-04-16	14:00:00	11:00:00	1	6000.00	5.00	6300.00	Bill to Company	As Per Contract	10		Confirmed	2026-03-30 11:16:18.226	Sent	\N	\N	\N	[]
108	PAR-26-04-0023	58	54	Sh. Ashish Dabral	mktg@hindon.co.in, ps@pajasaapartments.com, accounts@pajasaapartments.com	9818694440	2026-04-21	2026-04-30	14:00:00	11:00:00	1	3500.00	5.00	3675.00	Bill to Company	As Per Contract	9		Confirmed	2026-04-10 06:20:09.947	Unsent	\N	\N	\N	[]
98	PAR-26-04-0013	55	51	Jatin Singh + Avesh Khan	ps@pajasaapartments.com, accounts@pajasaapartments.com	NA	2026-04-07	2026-04-24	14:00:00	11:00:00	2	5250.00	5.00	5512.50	Bill to Company	As Per Contract	17		Confirmed	2026-04-04 11:49:52.054	Sent	\N	\N	\N	[]
109	PAR-26-04-0024	55	50	Amit Kumar	abelina.menezes@airworks.in, ps@pajasaapartments.com, accounts@pajasaapartments.com	9925922351	2026-04-09	2026-04-18	14:00:00	11:00:00	1	8500.00	5.00	8925.00	Bill to Company	As Per Contract	9		Confirmed	2026-04-11 10:42:14.001	Unsent	\N	\N	\N	[]
99	PAR-26-04-0014	58	52	Sh. RAGHAV SINGHAL + MUKAND GUPTA	mktg@hindon.co.in, ps@pajasaapartments.com, accounts@pajasaapartments.com	NA	2026-04-28	2026-04-30	14:00:00	11:00:00	2	4000.00	5.00	4200.00	Bill to Company	As Per Contract	2		Confirmed	2026-04-08 10:13:42.161	Unsent	\N	\N	\N	[]
100	PAR-26-04-0015	58	52	Sh. Raghav Singhal	mktg@hindon.co.in, ps@pajasaapartments.com, accounts@pajasaapartments.com	NA	2026-04-30	2026-05-01	14:00:00	11:00:00	1	3500.00	5.00	3675.00	Bill to Company	As Per Contract	1		Confirmed	2026-04-08 10:15:32.324	Unsent	\N	\N	\N	[]
101	PAR-26-04-0016	58	52	Aayush Agarwal	mktg@hindon.co.in, ps@pajasaapartments.com, accounts@pajasaapartments.com	NA	2026-04-28	2026-05-01	14:00:00	11:00:00	1	3500.00	5.00	3675.00	Bill to Company	As Per Contract	3		Confirmed	2026-04-08 10:17:49.37	Unsent	\N	\N	\N	[]
102	PAR-26-04-0017	58	52	Ajay Yadav	mktg@hindon.co.in, ps@pajasaapartments.com, accounts@pajasaapartments.com	NA	2026-04-28	2026-05-01	14:00:00	11:00:00	1	3500.00	5.00	3675.00	Bill to Company	As Per Contract	3		Confirmed	2026-04-08 10:19:39.32	Unsent	\N	\N	\N	[]
110	PAR-26-04-0025	66	48	Anish V C	ps@pajasaapartments.com, accounts@pajasaapartments.com	8088010652	2026-04-15	2026-04-17	14:00:00	11:00:00	1	4000.00	5.00	4200.00	Bill to Company	As Per Contract	2		Confirmed	2026-04-11 10:54:56.846	Unsent	\N	\N	\N	[]
111	PAR-26-04-0026	62	41	Anuj Sharma	rupesh.more@purplle.com, ps@pajasaapartments.com, accounts@pajasaapartments.com	9810830934	2026-04-13	2026-04-17	14:00:00	11:00:00	1	6000.00	5.00	6300.00	Bill to Company	As Per Contract	4		Confirmed	2026-04-11 10:58:58.161	Unsent	\N	\N	\N	[]
112	PAR-26-04-0027	66	45	Jagannivashan M	ps@pajasaapartments.com, accounts@pajasaapartments.com	7299306577	2026-04-13	2026-04-16	14:00:00	11:00:00	1	4000.00	5.00	4200.00	Bill to Company	As Per Contract	3		Confirmed	2026-04-11 11:01:02.153	Unsent	\N	\N	\N	[]
106	PAR-26-04-0021	67	47	Nirmal Chudgar + Ujjay Mohan + Pranjal Goswami	ps@pajasaapartments.com, accounts@pajasaapartments.com	8122887313	2026-04-14	2026-04-17	14:00:00	11:00:00	2	8000.00	5.00	8400.00	Direct Payment	As Per Email	3		Modified	2026-04-08 10:42:40.397	Unsent	\N	\N	Postponed	[]
\.


--
-- Data for Name: room_bookings; Type: TABLE DATA; Schema: public; Owner: masteruser
--

COPY public.room_bookings (id, reservation_id, room_type, property_id, check_in_date, check_out_date, status, occupancy) FROM stdin;
167	87	Common Bedroom-1	50	2026-03-26	2026-04-01	active	\N
173	91	Master Bedroom-1	37	2026-04-05	2026-04-09	active	\N
179	94	Master Bedroom-1	44	2026-03-31	2026-04-04	active	\N
165	86	Master Bedroom-1	41	2026-04-01	2026-04-02	Confirmed	\N
168	88	Master Bedroom-1	41	2026-04-06	2026-04-10	Confirmed	\N
169	89	Master Bedroom-1	49	2026-03-30	2026-04-01	Confirmed	\N
170	89	Master Bedroom-2	49	2026-03-30	2026-04-01	Confirmed	\N
171	90	Master Bedroom-1	47	2026-04-06	2026-04-16	Confirmed	\N
174	92	Master Bedroom-1	47	2026-03-31	2026-04-02	Confirmed	\N
175	93	Master Bedroom-1	49	2026-04-06	2026-05-06	Confirmed	\N
176	93	Master Bedroom-2	49	2026-04-06	2026-05-06	Confirmed	\N
177	93	Common Bedroom-1	49	2026-04-06	2026-05-06	Confirmed	\N
180	95	Master Bedroom-1	41	2026-04-08	2026-04-09	Confirmed	\N
181	96	Master Bedroom-1	47	2026-04-05	2026-04-19	Confirmed	\N
182	97	Master Bedroom-1	50	2026-04-04	2026-04-30	Confirmed	\N
183	98	Master Bedroom-1	51	2026-04-07	2026-04-24	Confirmed	\N
184	98	Master Bedroom-2	51	2026-04-07	2026-04-24	Confirmed	\N
187	101	Master Bedroom-1	52	2026-04-28	2026-05-01	Confirmed	1
185	99	Master Bedroom-1	52	2026-04-28	2026-04-30	Confirmed	2
186	100	Master Bedroom-1	52	2026-04-30	2026-05-01	Confirmed	1
188	102	Master Bedroom-1	52	2026-04-28	2026-05-01	Confirmed	1
189	103	Master Bedroom-1	52	2026-04-29	2026-04-30	Confirmed	1
190	104	Master Bedroom-1	47	2026-04-09	2026-04-13	Confirmed	2
191	105	Master Bedroom-1	53	2026-04-08	2026-05-01	Confirmed	2
194	107	Master Bedroom-1	41	2026-05-12	2026-05-24	Confirmed	1
195	108	Master Bedroom-1	54	2026-04-21	2026-04-30	Confirmed	1
196	109	Common Bedroom-1	50	2026-04-09	2026-04-18	Confirmed	1
197	110	Master Bedroom-1	48	2026-04-15	2026-04-17	Confirmed	1
198	111	Master Bedroom-1	41	2026-04-13	2026-04-17	Confirmed	1
199	112	Master Bedroom-1	45	2026-04-13	2026-04-16	Confirmed	1
200	106	Master Bedroom-1	47	2026-04-14	2026-04-17	Modified	2
201	106	Common Bedroom-1	47	2026-04-14	2026-04-17	Modified	1
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: masteruser
--

COPY public.users (id, username, email, password_hash, created_at) FROM stdin;
1	harshit	ps@pajasaapartments.com	$2b$10$JSX/03XBY.Ete9SEqG0kp.Db/eaU8/Un9ZpR8Q/77WGfer02FsmZK	2025-12-08 18:29:05.799664
2	Har@6388	harshitshukla6388@gmail.com	$2b$10$.tA/1.CuxdGzw9VhixG6SuhP0su2m7NG2b44KzWZ6b2O2xKi/hRdm	2025-12-20 06:21:00.046605
3	paras	paras@pajasa.com	$2b$10$lGygAzuZ5GCq/BQ0APK57eU38lz0hB3n66BFpoNVv9a4ZSrd67hTu	2026-03-15 09:46:50.087889
4	javed	javed@thecaliphhotel.com	$2b$10$m8YKIMjUdVoo7Iv2sjkioeApibx8m20Y2K/wiPOj50CWGvabRN3MW	2026-03-24 10:09:54.830859
\.


--
-- Name: booking_history_id_seq; Type: SEQUENCE SET; Schema: public; Owner: masteruser
--

SELECT pg_catalog.setval('public.booking_history_id_seq', 32, true);


--
-- Name: clients_id_seq; Type: SEQUENCE SET; Schema: public; Owner: masteruser
--

SELECT pg_catalog.setval('public.clients_id_seq', 68, true);


--
-- Name: guest_booking_timelines_id_seq; Type: SEQUENCE SET; Schema: public; Owner: masteruser
--

SELECT pg_catalog.setval('public.guest_booking_timelines_id_seq', 1, false);


--
-- Name: host_gst_numbers_gst_id_seq; Type: SEQUENCE SET; Schema: public; Owner: masteruser
--

SELECT pg_catalog.setval('public.host_gst_numbers_gst_id_seq', 49, true);


--
-- Name: host_information_host_id_seq; Type: SEQUENCE SET; Schema: public; Owner: masteruser
--

SELECT pg_catalog.setval('public.host_information_host_id_seq', 76, true);


--
-- Name: invoice_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: masteruser
--

SELECT pg_catalog.setval('public.invoice_items_id_seq', 61, true);


--
-- Name: invoices_id_seq; Type: SEQUENCE SET; Schema: public; Owner: masteruser
--

SELECT pg_catalog.setval('public.invoices_id_seq', 39, true);


--
-- Name: pincodes_pincode_id_seq; Type: SEQUENCE SET; Schema: public; Owner: masteruser
--

SELECT pg_catalog.setval('public.pincodes_pincode_id_seq', 35, true);


--
-- Name: properties_property_id_seq; Type: SEQUENCE SET; Schema: public; Owner: masteruser
--

SELECT pg_catalog.setval('public.properties_property_id_seq', 54, true);


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

SELECT pg_catalog.setval('public.reservation_additional_info_id_seq', 80, true);


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

SELECT pg_catalog.setval('public.reservations_id_seq', 112, true);


--
-- Name: room_bookings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: masteruser
--

SELECT pg_catalog.setval('public.room_bookings_id_seq', 201, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: masteruser
--

SELECT pg_catalog.setval('public.users_id_seq', 4, true);


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

\unrestrict T04VR0dsVE8iFyRfWidJ7PeUVLbCzzbaBCQgobgbfZv2yXUKbaxjCSyaJCLGcAh

