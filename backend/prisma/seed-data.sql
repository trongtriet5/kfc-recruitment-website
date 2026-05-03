-- ============================================================
-- KFC Recruitment Database - Full Schema + Seed Data
-- Generated at 2026-05-03T11:30:14.264Z
-- ============================================================

SET statement_timeout = 0;
SET client_encoding = 'UTF8';

-- Roles
INSERT INTO roles (id, name, code, description, permissions, is_system, is_active, created_at, updated_at) 
VALUES ('cmopo8prs0000p4xh6bc545yl', 'Quß║ún trß╗ï vi├¬n', 'ADMIN', NULL, '["CANDIDATE_CREATE","CANDIDATE_READ","CANDIDATE_UPDATE","CANDIDATE_DELETE","CANDIDATE_STATUS_CHANGE","CANDIDATE_ASSIGN_PIC","CANDIDATE_TRANSFER_CAMPAIGN","CANDIDATE_BLACKLIST","PROPOSAL_CREATE","PROPOSAL_READ","PROPOSAL_UPDATE","PROPOSAL_DELETE","PROPOSAL_SUBMIT","PROPOSAL_REVIEW","PROPOSAL_APPROVE","PROPOSAL_REJECT","PROPOSAL_CANCEL","CAMPAIGN_CREATE","CAMPAIGN_READ","CAMPAIGN_UPDATE","CAMPAIGN_DELETE","CAMPAIGN_MANAGE","INTERVIEW_CREATE","INTERVIEW_READ","INTERVIEW_UPDATE","INTERVIEW_DELETE","OFFER_CREATE","OFFER_READ","OFFER_UPDATE","OFFER_DELETE","OFFER_SEND","REPORT_VIEW","REPORT_EXPORT","SETTINGS_MANAGE","USER_MANAGE"]', true, true, '2026-05-03T11:12:38.008Z', '2026-05-03T11:12:38.008Z')
ON CONFLICT (code) DO UPDATE SET permissions = EXCLUDED.permissions, name = EXCLUDED.name;
INSERT INTO roles (id, name, code, description, permissions, is_system, is_active, created_at, updated_at) 
VALUES ('cmopo8ps30001p4xhueeaqogf', 'Nh├ón vi├¬n tuyß╗ân dß╗Ñng', 'RECRUITER', NULL, '["CANDIDATE_CREATE","CANDIDATE_READ","CANDIDATE_UPDATE","CANDIDATE_STATUS_CHANGE","CANDIDATE_ASSIGN_PIC","CANDIDATE_TRANSFER_CAMPAIGN","PROPOSAL_READ","CAMPAIGN_CREATE","CAMPAIGN_READ","CAMPAIGN_UPDATE","CAMPAIGN_MANAGE","INTERVIEW_CREATE","INTERVIEW_READ","INTERVIEW_UPDATE","OFFER_CREATE","OFFER_READ","OFFER_UPDATE","OFFER_SEND","REPORT_VIEW","REPORT_EXPORT"]', true, true, '2026-05-03T11:12:38.019Z', '2026-05-03T11:12:38.019Z')
ON CONFLICT (code) DO UPDATE SET permissions = EXCLUDED.permissions, name = EXCLUDED.name;
INSERT INTO roles (id, name, code, description, permissions, is_system, is_active, created_at, updated_at) 
VALUES ('cmopo8ps80003p4xh81nxmi49', 'Quß║ún l├╜ khu vß╗▒c (AM)', 'AM', NULL, '["CANDIDATE_READ","CANDIDATE_UPDATE","CANDIDATE_STATUS_CHANGE","PROPOSAL_CREATE","PROPOSAL_READ","PROPOSAL_UPDATE","PROPOSAL_SUBMIT","PROPOSAL_REVIEW","PROPOSAL_APPROVE","PROPOSAL_REJECT","PROPOSAL_CANCEL","CAMPAIGN_READ","INTERVIEW_CREATE","INTERVIEW_READ","INTERVIEW_UPDATE","OFFER_READ","REPORT_VIEW"]', true, true, '2026-05-03T11:12:38.024Z', '2026-05-03T11:12:38.024Z')
ON CONFLICT (code) DO UPDATE SET permissions = EXCLUDED.permissions, name = EXCLUDED.name;
INSERT INTO roles (id, name, code, description, permissions, is_system, is_active, created_at, updated_at) 
VALUES ('cmopo8psa0004p4xhd3ioaldr', 'Quß║ún l├╜ cß╗¡a h├áng (SM)', 'SM', NULL, '["CANDIDATE_READ","CANDIDATE_STATUS_CHANGE","PROPOSAL_CREATE","PROPOSAL_READ","PROPOSAL_UPDATE","PROPOSAL_SUBMIT","PROPOSAL_CANCEL","CAMPAIGN_READ","INTERVIEW_READ","OFFER_READ","REPORT_VIEW"]', true, true, '2026-05-03T11:12:38.027Z', '2026-05-03T11:12:38.027Z')
ON CONFLICT (code) DO UPDATE SET permissions = EXCLUDED.permissions, name = EXCLUDED.name;

-- Candidate Statuses
INSERT INTO candidate_statuses (id, name, code, color, "group", "order", is_active) 
VALUES ('cmo9j6ua30000oracm11ky996', 'Lß╗ìc CV', 'CV_FILTERING', '#FCD34D', 'application', 1, true)
ON CONFLICT (code) DO NOTHING;
INSERT INTO candidate_statuses (id, name, code, color, "group", "order", is_active) 
VALUES ('cmo9j6uen0003oracdcxbr69b', 'Blacklist', 'BLACKLIST', '#111827', 'application', 4, true)
ON CONFLICT (code) DO NOTHING;
INSERT INTO candidate_statuses (id, name, code, color, "group", "order", is_active) 
VALUES ('cmo9j6ufs0004oracsij4nhtf', 'Kh├┤ng li├¬n hß╗ç ─æ╞░ß╗úc', 'CANNOT_CONTACT', '#9CA3AF', 'application', 5, true)
ON CONFLICT (code) DO NOTHING;
INSERT INTO candidate_statuses (id, name, code, color, "group", "order", is_active) 
VALUES ('cmo9j6uhg0005orac65zebhh8', 'Khu vß╗▒c ch╞░a tuyß╗ân dß╗Ñng', 'AREA_NOT_RECRUITING', '#D1D5DB', 'application', 6, true)
ON CONFLICT (code) DO NOTHING;
INSERT INTO candidate_statuses (id, name, code, color, "group", "order", is_active) 
VALUES ('cmo9j6uju0007orac7kyncce9', 'HR s╞í vß║Ñn ─æß║ít', 'HR_INTERVIEW_PASSED', '#059669', 'interview', 7, true)
ON CONFLICT (code) DO NOTHING;
INSERT INTO candidate_statuses (id, name, code, color, "group", "order", is_active) 
VALUES ('cmo9j6ukv0008oracli3ss5lb', 'HR s╞í vß║Ñn loß║íi', 'HR_INTERVIEW_FAILED', '#DC2626', 'interview', 8, true)
ON CONFLICT (code) DO NOTHING;
INSERT INTO candidate_statuses (id, name, code, color, "group", "order", is_active) 
VALUES ('cmo9j6uig0006oracnn4ar4pu', 'Chß╗¥ phß╗Ång vß║Ñn', 'WAITING_INTERVIEW', '#60A5FA', 'interview', 9, true)
ON CONFLICT (code) DO NOTHING;
INSERT INTO candidate_statuses (id, name, code, color, "group", "order", is_active) 
VALUES ('cmo9j6ulw0009oracu82gciey', 'SM/AM PV ─Éß║ít', 'SM_AM_INTERVIEW_PASSED', '#059669', 'interview', 10, true)
ON CONFLICT (code) DO NOTHING;
INSERT INTO candidate_statuses (id, name, code, color, "group", "order", is_active) 
VALUES ('cmo9j6un3000aorachtwdha1x', 'SM/AM PV Loß║íi', 'SM_AM_INTERVIEW_FAILED', '#DC2626', 'interview', 11, true)
ON CONFLICT (code) DO NOTHING;
INSERT INTO candidate_statuses (id, name, code, color, "group", "order", is_active) 
VALUES ('cmo9j6up2000corac88sm96ik', 'OM PV ─Éß║ít', 'OM_PV_INTERVIEW_PASSED', '#059669', 'interview', 12, true)
ON CONFLICT (code) DO NOTHING;
INSERT INTO candidate_statuses (id, name, code, color, "group", "order", is_active) 
VALUES ('cmo9j6uq4000doracqsuidrjw', 'OM PV Loß║íi', 'OM_PV_INTERVIEW_FAILED', '#DC2626', 'interview', 13, true)
ON CONFLICT (code) DO NOTHING;
INSERT INTO candidate_statuses (id, name, code, color, "group", "order", is_active) 
VALUES ('cmo9j6ur5000eoracg9j57ghe', 'Kh├┤ng ─æß║┐n phß╗Ång vß║Ñn', 'NO_INTERVIEW', '#4B5563', 'interview', 14, true)
ON CONFLICT (code) DO NOTHING;
INSERT INTO candidate_statuses (id, name, code, color, "group", "order", is_active) 
VALUES ('cmo9j6us8000foracodfvqb2z', '─É├ú gß╗¡i offer letter', 'OFFER_SENT', '#818CF8', 'offer', 15, true)
ON CONFLICT (code) DO NOTHING;
INSERT INTO candidate_statuses (id, name, code, color, "group", "order", is_active) 
VALUES ('cmo9j6ut8000goracyswnghhh', '─Éß╗ông ├╜ offer letter', 'OFFER_ACCEPTED', '#10B981', 'offer', 16, true)
ON CONFLICT (code) DO NOTHING;
INSERT INTO candidate_statuses (id, name, code, color, "group", "order", is_active) 
VALUES ('cmo9j6uuc000horac5ucqn03t', 'Tß╗½ chß╗æi offer letter', 'OFFER_REJECTED', '#F43F5E', 'offer', 17, true)
ON CONFLICT (code) DO NOTHING;
INSERT INTO candidate_statuses (id, name, code, color, "group", "order", is_active) 
VALUES ('cmo9j6uvc000ioracc1bqlm3m', 'Chß╗¥ nhß║¡n viß╗çc', 'WAITING_ONBOARDING', '#F97316', 'onboarding', 18, true)
ON CONFLICT (code) DO NOTHING;
INSERT INTO candidate_statuses (id, name, code, color, "group", "order", is_active) 
VALUES ('cmo9j6uwd000jorac5vhvewyu', '─Éß╗ông ├╜ nhß║¡n viß╗çc', 'ONBOARDING_ACCEPTED', '#059669', 'onboarding', 19, true)
ON CONFLICT (code) DO NOTHING;
INSERT INTO candidate_statuses (id, name, code, color, "group", "order", is_active) 
VALUES ('cmo9j6uxd000koracfuug2hkv', 'Tß╗½ chß╗æi nhß║¡n viß╗çc', 'ONBOARDING_REJECTED', '#B91C1C', 'onboarding', 20, true)
ON CONFLICT (code) DO NOTHING;

-- Positions
INSERT INTO positions (id, name, code, description, is_active) 
VALUES ('cmo9q837l000010ct2y4s57fd', 'All Star', 'ALL_STAR', 'Vß╗ï tr├¡ KFC', true)
ON CONFLICT (code) DO NOTHING;
INSERT INTO positions (id, name, code, description, is_active) 
VALUES ('cmo8fpsk0000511loampgfa3p', 'Nh├ón vi├¬n', 'CREW', 'Vß╗ï tr├¡ KFC', true)
ON CONFLICT (code) DO NOTHING;
INSERT INTO positions (id, name, code, description, is_active) 
VALUES ('cmo9q83eq000110ctee3w5u1v', 'H-Junior', 'H-JUNIOR', 'Vß╗ï tr├¡ KFC', true)
ON CONFLICT (code) DO NOTHING;
INSERT INTO positions (id, name, code, description, is_active) 
VALUES ('cmo9q83ie000210ctoy8qv5a3', 'H-Master', 'H-MASTER', 'Vß╗ï tr├¡ KFC', true)
ON CONFLICT (code) DO NOTHING;
INSERT INTO positions (id, name, code, description, is_active) 
VALUES ('cmo9q83ly000310ctp5jexo1v', 'H-Senior', 'H-SENIOR', 'Vß╗ï tr├¡ KFC', true)
ON CONFLICT (code) DO NOTHING;
INSERT INTO positions (id, name, code, description, is_active) 
VALUES ('cmo9q83pk000410ct0d3xlx3j', 'RGM Level 1', 'RGM_LEVEL_1', 'Vß╗ï tr├¡ KFC', true)
ON CONFLICT (code) DO NOTHING;
INSERT INTO positions (id, name, code, description, is_active) 
VALUES ('cmo9q83t6000510ctghs3aeia', 'RGM Level 2', 'RGM_LEVEL_2', 'Vß╗ï tr├¡ KFC', true)
ON CONFLICT (code) DO NOTHING;
INSERT INTO positions (id, name, code, description, is_active) 
VALUES ('cmo9q83wi000610ct65uabkgf', 'RGM Level 3', 'RGM_LEVEL_3', 'Vß╗ï tr├¡ KFC', true)
ON CONFLICT (code) DO NOTHING;
INSERT INTO positions (id, name, code, description, is_active) 
VALUES ('cmo9q83zv000710ctkmlsa8r0', 'Shift Supervisor', 'SHIFT_SUPERVISOR', 'Vß╗ï tr├¡ KFC', true)
ON CONFLICT (code) DO NOTHING;
INSERT INTO positions (id, name, code, description, is_active) 
VALUES ('cmo9q8439000810ctbug95rn3', 'Shift Supervisor Trainee', 'SHIFT_SUPERVISOR_TRAINEE', 'Vß╗ï tr├¡ KFC', true)
ON CONFLICT (code) DO NOTHING;
INSERT INTO positions (id, name, code, description, is_active) 
VALUES ('cmo9q846l000910ct3ic2knyu', 'Staff', 'STAFF', 'Vß╗ï tr├¡ KFC', true)
ON CONFLICT (code) DO NOTHING;
INSERT INTO positions (id, name, code, description, is_active) 
VALUES ('cmo9q84a2000a10ctlrb5jisd', 'Star', 'STAR', 'Vß╗ï tr├¡ KFC', true)
ON CONFLICT (code) DO NOTHING;

-- Sources
INSERT INTO sources (id, name, code, description, is_active) 
VALUES ('cmo9t2vuu0001votskejmoado', 'Seeding', 'SEEDING', 'Seeding tß╗½ TA', true)
ON CONFLICT (code) DO NOTHING;
INSERT INTO sources (id, name, code, description, is_active) 
VALUES ('cmo9t2t3i0000vots5t1e4kxo', 'Facebook Ads', 'FACEBOOK_ADS', 'Nguß╗ôn ads tß╗½ Facebook', true)
ON CONFLICT (code) DO NOTHING;
INSERT INTO sources (id, name, code, description, is_active) 
VALUES ('976aa176-0329-4ce7-aeda-1867e144d18f', 'Facebook Group', 'FACEBOOK_GROUP', 'Nguß╗ôn tß╗½ c├íc b├ái viß║┐t kh├┤ng ads tr├¬n Facebook', true)
ON CONFLICT (code) DO NOTHING;
INSERT INTO sources (id, name, code, description, is_active) 
VALUES ('cmo9t329y0003vots9sloghrj', 'Referral', 'REFERRAL', 'Giß╗¢i thiß╗çu nß╗Öi bß╗Ö', true)
ON CONFLICT (code) DO NOTHING;
INSERT INTO sources (id, name, code, description, is_active) 
VALUES ('cmo9t2yxf0002votsidja4k6q', 'Website', 'WEBSITE', 'Website KFC', true)
ON CONFLICT (code) DO NOTHING;

-- Users
INSERT INTO users (id, email, password, "fullName", phone, role, "roleId", is_active) 
VALUES ('cmoe9kadl0002s6hgovv3z70y', 'thucdh@kfcvietnam.com.vn', '$2a$10$zMDUrNtAJtLc56JPzlYEaetPt1zQlcfHN.8vHU/Yr7otSUG.kPU8y', 'Hß╗ô ─É├┤ng Thß╗⌐c', '0909888777', 'RECRUITER', 'cmopo8ps30001p4xhueeaqogf', true)
ON CONFLICT (email) DO NOTHING;
INSERT INTO users (id, email, password, "fullName", phone, role, "roleId", is_active) 
VALUES ('cmo8fpr6k000011lo37xr2fjo', 'admin@kfcvietnam.com.vn', '$2a$10$zMDUrNtAJtLc56JPzlYEaetPt1zQlcfHN.8vHU/Yr7otSUG.kPU8y', 'Nguyß╗àn Trß╗ìng Triß║┐t', '0772086453', 'ADMIN', 'cmopo8prs0000p4xh6bc545yl', true)
ON CONFLICT (email) DO NOTHING;

-- Administrative Regions
INSERT INTO administrative_regions (id, name, name_en, code_name, code_name_en) 
VALUES (1, '─É├┤ng Bß║»c Bß╗Ö', 'Northeast', 'dong_bac_bo', 'northest')
ON CONFLICT (id) DO NOTHING;
INSERT INTO administrative_regions (id, name, name_en, code_name, code_name_en) 
VALUES (2, 'T├óy Bß║»c Bß╗Ö', 'Northwest', 'tay_bac_bo', 'northwest')
ON CONFLICT (id) DO NOTHING;
INSERT INTO administrative_regions (id, name, name_en, code_name, code_name_en) 
VALUES (3, '─Éß╗ông bß║▒ng s├┤ng Hß╗ông', 'Red River Delta', 'dong_bang_song_hong', 'red_river_delta')
ON CONFLICT (id) DO NOTHING;
INSERT INTO administrative_regions (id, name, name_en, code_name, code_name_en) 
VALUES (4, 'Bß║»c Trung Bß╗Ö', 'North Central Coast', 'bac_trung_bo', 'north_central_coast')
ON CONFLICT (id) DO NOTHING;
INSERT INTO administrative_regions (id, name, name_en, code_name, code_name_en) 
VALUES (5, 'Duy├¬n hß║úi Nam Trung Bß╗Ö', 'South Central Coast', 'duyen_hai_nam_trung_bo', 'south_central_coast')
ON CONFLICT (id) DO NOTHING;
INSERT INTO administrative_regions (id, name, name_en, code_name, code_name_en) 
VALUES (6, 'T├óy Nguy├¬n', 'Central Highlands', 'tay_nguyen', 'central_highlands')
ON CONFLICT (id) DO NOTHING;
INSERT INTO administrative_regions (id, name, name_en, code_name, code_name_en) 
VALUES (7, '─É├┤ng Nam Bß╗Ö', 'Southeast', 'dong_nam_bo', 'southeast')
ON CONFLICT (id) DO NOTHING;
INSERT INTO administrative_regions (id, name, name_en, code_name, code_name_en) 
VALUES (8, '─Éß╗ông bß║▒ng s├┤ng Cß╗¡u Long', 'Mekong River Delta', 'dong_bang_song_cuu_long', 'southwest')
ON CONFLICT (id) DO NOTHING;

-- Administrative Units
INSERT INTO administrative_units (id, full_name, full_name_en, short_name, short_name_en, code_name, code_name_en) 
VALUES (1, 'Th├ánh phß╗æ trß╗▒c thuß╗Öc trung ╞░╞íng', 'Municipality', 'Th├ánh phß╗æ', 'City', 'thanh_pho_truc_thuoc_trung_uong', 'municipality')
ON CONFLICT (id) DO NOTHING;
INSERT INTO administrative_units (id, full_name, full_name_en, short_name, short_name_en, code_name, code_name_en) 
VALUES (2, 'Tß╗ënh', 'Province', 'Tß╗ënh', 'Province', 'tinh', 'province')
ON CONFLICT (id) DO NOTHING;
INSERT INTO administrative_units (id, full_name, full_name_en, short_name, short_name_en, code_name, code_name_en) 
VALUES (3, 'Ph╞░ß╗¥ng', 'Ward', 'Ph╞░ß╗¥ng', 'Ward', 'phuong', 'ward')
ON CONFLICT (id) DO NOTHING;
INSERT INTO administrative_units (id, full_name, full_name_en, short_name, short_name_en, code_name, code_name_en) 
VALUES (4, 'X├ú', 'Commune', 'X├ú', 'Commune', 'xa', 'commune')
ON CONFLICT (id) DO NOTHING;
INSERT INTO administrative_units (id, full_name, full_name_en, short_name, short_name_en, code_name, code_name_en) 
VALUES (5, '─Éß║╖c khu tß║íi hß║úi ─æß║úo', 'Special administrative region', '─Éß║╖c khu', 'Special administrative region', 'dac_khu', 'special_administrative_region')
ON CONFLICT (id) DO NOTHING;

-- Provinces
INSERT INTO provinces (code, name, name_en, full_name, full_name_en, code_name, administrative_unit_id) 
VALUES ('01', 'H├á Nß╗Öi', 'Ha Noi', 'Th├ánh phß╗æ H├á Nß╗Öi', 'Ha Noi City', 'ha_noi', 1)
ON CONFLICT (code) DO NOTHING;
INSERT INTO provinces (code, name, name_en, full_name, full_name_en, code_name, administrative_unit_id) 
VALUES ('04', 'Cao Bß║▒ng', 'Cao Bang', 'Tß╗ënh Cao Bß║▒ng', 'Cao Bang Province', 'cao_bang', 2)
ON CONFLICT (code) DO NOTHING;
INSERT INTO provinces (code, name, name_en, full_name, full_name_en, code_name, administrative_unit_id) 
VALUES ('08', 'Tuy├¬n Quang', 'Tuyen Quang', 'Tß╗ënh Tuy├¬n Quang', 'Tuyen Quang Province', 'tuyen_quang', 2)
ON CONFLICT (code) DO NOTHING;
INSERT INTO provinces (code, name, name_en, full_name, full_name_en, code_name, administrative_unit_id) 
VALUES ('11', '─Éiß╗çn Bi├¬n', 'Dien Bien', 'Tß╗ënh ─Éiß╗çn Bi├¬n', 'Dien Bien Province', 'dien_bien', 2)
ON CONFLICT (code) DO NOTHING;
INSERT INTO provinces (code, name, name_en, full_name, full_name_en, code_name, administrative_unit_id) 
VALUES ('12', 'Lai Ch├óu', 'Lai Chau', 'Tß╗ënh Lai Ch├óu', 'Lai Chau Province', 'lai_chau', 2)
ON CONFLICT (code) DO NOTHING;
INSERT INTO provinces (code, name, name_en, full_name, full_name_en, code_name, administrative_unit_id) 
VALUES ('14', 'S╞ín La', 'Son La', 'Tß╗ënh S╞ín La', 'Son La Province', 'son_la', 2)
ON CONFLICT (code) DO NOTHING;
INSERT INTO provinces (code, name, name_en, full_name, full_name_en, code_name, administrative_unit_id) 
VALUES ('15', 'L├áo Cai', 'Lao Cai', 'Tß╗ënh L├áo Cai', 'Lao Cai Province', 'lao_cai', 2)
ON CONFLICT (code) DO NOTHING;
INSERT INTO provinces (code, name, name_en, full_name, full_name_en, code_name, administrative_unit_id) 
VALUES ('19', 'Th├íi Nguy├¬n', 'Thai Nguyen', 'Tß╗ënh Th├íi Nguy├¬n', 'Thai Nguyen Province', 'thai_nguyen', 2)
ON CONFLICT (code) DO NOTHING;
INSERT INTO provinces (code, name, name_en, full_name, full_name_en, code_name, administrative_unit_id) 
VALUES ('20', 'Lß║íng S╞ín', 'Lang Son', 'Tß╗ënh Lß║íng S╞ín', 'Lang Son Province', 'lang_son', 2)
ON CONFLICT (code) DO NOTHING;
INSERT INTO provinces (code, name, name_en, full_name, full_name_en, code_name, administrative_unit_id) 
VALUES ('22', 'Quß║úng Ninh', 'Quang Ninh', 'Tß╗ënh Quß║úng Ninh', 'Quang Ninh Province', 'quang_ninh', 2)
ON CONFLICT (code) DO NOTHING;
INSERT INTO provinces (code, name, name_en, full_name, full_name_en, code_name, administrative_unit_id) 
VALUES ('24', 'Bß║»c Ninh', 'Bac Ninh', 'Tß╗ënh Bß║»c Ninh', 'Bac Ninh Province', 'bac_ninh', 2)
ON CONFLICT (code) DO NOTHING;
INSERT INTO provinces (code, name, name_en, full_name, full_name_en, code_name, administrative_unit_id) 
VALUES ('25', 'Ph├║ Thß╗ì', 'Phu Tho', 'Tß╗ënh Ph├║ Thß╗ì', 'Phu Tho Province', 'phu_tho', 2)
ON CONFLICT (code) DO NOTHING;
INSERT INTO provinces (code, name, name_en, full_name, full_name_en, code_name, administrative_unit_id) 
VALUES ('31', 'Hß║úi Ph├▓ng', 'Hai Phong', 'Th├ánh phß╗æ Hß║úi Ph├▓ng', 'Hai Phong City', 'hai_phong', 1)
ON CONFLICT (code) DO NOTHING;
INSERT INTO provinces (code, name, name_en, full_name, full_name_en, code_name, administrative_unit_id) 
VALUES ('33', 'H╞░ng Y├¬n', 'Hung Yen', 'Tß╗ënh H╞░ng Y├¬n', 'Hung Yen Province', 'hung_yen', 2)
ON CONFLICT (code) DO NOTHING;
INSERT INTO provinces (code, name, name_en, full_name, full_name_en, code_name, administrative_unit_id) 
VALUES ('37', 'Ninh B├¼nh', 'Ninh Binh', 'Tß╗ënh Ninh B├¼nh', 'Ninh Binh Province', 'ninh_binh', 2)
ON CONFLICT (code) DO NOTHING;
INSERT INTO provinces (code, name, name_en, full_name, full_name_en, code_name, administrative_unit_id) 
VALUES ('38', 'Thanh H├│a', 'Thanh Hoa', 'Tß╗ënh Thanh H├│a', 'Thanh Hoa Province', 'thanh_hoa', 2)
ON CONFLICT (code) DO NOTHING;
INSERT INTO provinces (code, name, name_en, full_name, full_name_en, code_name, administrative_unit_id) 
VALUES ('40', 'Nghß╗ç An', 'Nghe An', 'Tß╗ënh Nghß╗ç An', 'Nghe An Province', 'nghe_an', 2)
ON CONFLICT (code) DO NOTHING;
INSERT INTO provinces (code, name, name_en, full_name, full_name_en, code_name, administrative_unit_id) 
VALUES ('42', 'H├á T─⌐nh', 'Ha Tinh', 'Tß╗ënh H├á T─⌐nh', 'Ha Tinh Province', 'ha_tinh', 2)
ON CONFLICT (code) DO NOTHING;
INSERT INTO provinces (code, name, name_en, full_name, full_name_en, code_name, administrative_unit_id) 
VALUES ('44', 'Quß║úng Trß╗ï', 'Quang Tri', 'Tß╗ënh Quß║úng Trß╗ï', 'Quang Tri Province', 'quang_tri', 2)
ON CONFLICT (code) DO NOTHING;
INSERT INTO provinces (code, name, name_en, full_name, full_name_en, code_name, administrative_unit_id) 
VALUES ('46', 'Huß║┐', 'Hue', 'Th├ánh phß╗æ Huß║┐', 'Hue City', 'hue', 1)
ON CONFLICT (code) DO NOTHING;
INSERT INTO provinces (code, name, name_en, full_name, full_name_en, code_name, administrative_unit_id) 
VALUES ('48', '─É├á Nß║╡ng', 'Da Nang', 'Th├ánh phß╗æ ─É├á Nß║╡ng', 'Da Nang City', 'da_nang', 1)
ON CONFLICT (code) DO NOTHING;
INSERT INTO provinces (code, name, name_en, full_name, full_name_en, code_name, administrative_unit_id) 
VALUES ('51', 'Quß║úng Ng├úi', 'Quang Ngai', 'Tß╗ënh Quß║úng Ng├úi', 'Quang Ngai Province', 'quang_ngai', 2)
ON CONFLICT (code) DO NOTHING;
INSERT INTO provinces (code, name, name_en, full_name, full_name_en, code_name, administrative_unit_id) 
VALUES ('52', 'Gia Lai', 'Gia Lai', 'Tß╗ënh Gia Lai', 'Gia Lai Province', 'gia_lai', 2)
ON CONFLICT (code) DO NOTHING;
INSERT INTO provinces (code, name, name_en, full_name, full_name_en, code_name, administrative_unit_id) 
VALUES ('56', 'Kh├ính H├▓a', 'Khanh Hoa', 'Tß╗ënh Kh├ính H├▓a', 'Khanh Hoa Province', 'khanh_hoa', 2)
ON CONFLICT (code) DO NOTHING;
INSERT INTO provinces (code, name, name_en, full_name, full_name_en, code_name, administrative_unit_id) 
VALUES ('66', '─Éß║»k Lß║»k', 'Dak Lak', 'Tß╗ënh ─Éß║»k Lß║»k', 'Dak Lak Province', 'dak_lak', 2)
ON CONFLICT (code) DO NOTHING;
INSERT INTO provinces (code, name, name_en, full_name, full_name_en, code_name, administrative_unit_id) 
VALUES ('68', 'L├óm ─Éß╗ông', 'Lam Dong', 'Tß╗ënh L├óm ─Éß╗ông', 'Lam Dong Province', 'lam_dong', 2)
ON CONFLICT (code) DO NOTHING;
INSERT INTO provinces (code, name, name_en, full_name, full_name_en, code_name, administrative_unit_id) 
VALUES ('75', '─Éß╗ông Nai', 'Dong Nai', 'Tß╗ënh ─Éß╗ông Nai', 'Dong Nai Province', 'dong_nai', 2)
ON CONFLICT (code) DO NOTHING;
INSERT INTO provinces (code, name, name_en, full_name, full_name_en, code_name, administrative_unit_id) 
VALUES ('79', 'Hß╗ô Ch├¡ Minh', 'Ho Chi Minh', 'Th├ánh phß╗æ Hß╗ô Ch├¡ Minh', 'Ho Chi Minh City', 'ho_chi_minh', 1)
ON CONFLICT (code) DO NOTHING;
INSERT INTO provinces (code, name, name_en, full_name, full_name_en, code_name, administrative_unit_id) 
VALUES ('80', 'T├óy Ninh', 'Tay Ninh', 'Tß╗ënh T├óy Ninh', 'Tay Ninh Province', 'tay_ninh', 2)
ON CONFLICT (code) DO NOTHING;
INSERT INTO provinces (code, name, name_en, full_name, full_name_en, code_name, administrative_unit_id) 
VALUES ('82', '─Éß╗ông Th├íp', 'Dong Thap', 'Tß╗ënh ─Éß╗ông Th├íp', 'Dong Thap Province', 'dong_thap', 2)
ON CONFLICT (code) DO NOTHING;
INSERT INTO provinces (code, name, name_en, full_name, full_name_en, code_name, administrative_unit_id) 
VALUES ('86', 'V─⌐nh Long', 'Vinh Long', 'Tß╗ënh V─⌐nh Long', 'Vinh Long Province', 'vinh_long', 2)
ON CONFLICT (code) DO NOTHING;
INSERT INTO provinces (code, name, name_en, full_name, full_name_en, code_name, administrative_unit_id) 
VALUES ('91', 'An Giang', 'An Giang', 'Tß╗ënh An Giang', 'An Giang Province', 'an_giang', 2)
ON CONFLICT (code) DO NOTHING;
INSERT INTO provinces (code, name, name_en, full_name, full_name_en, code_name, administrative_unit_id) 
VALUES ('92', 'Cß║ºn Th╞í', 'Can Tho', 'Th├ánh phß╗æ Cß║ºn Th╞í', 'Can Tho City', 'can_tho', 1)
ON CONFLICT (code) DO NOTHING;
INSERT INTO provinces (code, name, name_en, full_name, full_name_en, code_name, administrative_unit_id) 
VALUES ('96', 'C├á Mau', 'Ca Mau', 'Tß╗ënh C├á Mau', 'Ca Mau Province', 'ca_mau', 2)
ON CONFLICT (code) DO NOTHING;
