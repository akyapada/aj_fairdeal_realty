-- =====================================================================
-- Hyderabad localities — seed data
-- Run this AFTER schema.sql, in the Supabase SQL Editor.
--
-- 54 localities that matter for residential real estate in Hyderabad,
-- grouped by the zones buyers actually think in.
--
-- Coordinates are approximate locality centroids — good enough for
-- sorting, grouping and a map pin. Verify any you rely on precisely.
--
-- Pincodes are left null on purpose. Fill them in only if you need
-- them; wrong pincodes in a database are worse than absent ones.
--
-- `description` is null for all of these. That column is your SEO
-- content — one honest paragraph per locality, written by you. Those
-- paragraphs are what will rank for "is Tellapur good for end use",
-- which is the kind of query you can actually win.
-- =====================================================================

insert into localities (name, slug, zone, latitude, longitude) values

-- ---------- WEST: the IT corridor. Most of your demand lives here. ----------
('Gachibowli',          'gachibowli',          'West', 17.440000, 78.348900),
('Kondapur',            'kondapur',            'West', 17.464700, 78.363900),
('Madhapur',            'madhapur',            'West', 17.448500, 78.390800),
('HITEC City',          'hitec-city',          'West', 17.443500, 78.377200),
('Raidurg',             'raidurg',             'West', 17.432000, 78.383000),
('Financial District',  'financial-district',  'West', 17.415500, 78.341000),
('Nanakramguda',        'nanakramguda',        'West', 17.418000, 78.343000),
('Kokapet',             'kokapet',             'West', 17.404600, 78.329800),
('Narsingi',            'narsingi',            'West', 17.394400, 78.347900),
('Manikonda',           'manikonda',           'West', 17.405800, 78.386600),
('Puppalaguda',         'puppalaguda',         'West', 17.409000, 78.369000),
('Tellapur',            'tellapur',            'West', 17.487000, 78.297000),
('Nallagandla',         'nallagandla',         'West', 17.470000, 78.312000),
('Gopanpally',          'gopanpally',          'West', 17.453000, 78.318000),
('Lingampally',         'lingampally',         'West', 17.489000, 78.317000),
('Chanda Nagar',        'chanda-nagar',        'West', 17.497000, 78.330000),
('Miyapur',             'miyapur',             'West', 17.494800, 78.357800),
('Kollur',              'kollur',              'West', 17.496000, 78.257000),
('Ameenpur',            'ameenpur',            'West', 17.528000, 78.324000),
('Patancheru',          'patancheru',          'West', 17.530000, 78.265000),

-- ---------- NORTH: value belt, strong end-user demand ----------
('Kukatpally',          'kukatpally',          'North', 17.494800, 78.400000),
('Nizampet',            'nizampet',            'North', 17.515000, 78.389000),
('Bachupally',          'bachupally',          'North', 17.545000, 78.387000),
('Bowrampet',           'bowrampet',           'North', 17.548000, 78.372000),
('Kompally',            'kompally',            'North', 17.545000, 78.487000),
('Suchitra',            'suchitra',            'North', 17.518000, 78.470000),
('Quthbullapur',        'quthbullapur',        'North', 17.510000, 78.455000),
('Jeedimetla',          'jeedimetla',          'North', 17.510000, 78.440000),
('Alwal',               'alwal',               'North', 17.501000, 78.508000),
('Medchal',             'medchal',             'North', 17.629000, 78.481000),
('Shamirpet',           'shamirpet',           'North', 17.620000, 78.568000),

-- ---------- EAST: Uppal / ORR east, affordable and improving ----------
('Uppal',               'uppal',               'East', 17.398000, 78.559000),
('Boduppal',            'boduppal',            'East', 17.409000, 78.590000),
('Peerzadiguda',        'peerzadiguda',        'East', 17.402000, 78.576000),
('Pocharam',            'pocharam',            'East', 17.428000, 78.634000),
('Ghatkesar',           'ghatkesar',           'East', 17.450000, 78.685000),
('Keesara',             'keesara',             'East', 17.504000, 78.632000),
('Nagole',              'nagole',              'East', 17.370000, 78.558000),

-- ---------- SOUTH: airport corridor, the long-term bet ----------
('LB Nagar',            'lb-nagar',            'South', 17.345000, 78.552000),
('Attapur',             'attapur',             'South', 17.362000, 78.425000),
('Rajendranagar',       'rajendranagar',       'South', 17.322000, 78.402000),
('Shamshabad',          'shamshabad',          'South', 17.240000, 78.430000),
('Tukkuguda',           'tukkuguda',           'South', 17.227000, 78.500000),
('Adibatla',            'adibatla',            'South', 17.225000, 78.557000),
('Maheshwaram',         'maheshwaram',         'South', 17.170000, 78.430000),
('Shadnagar',           'shadnagar',           'South', 17.090000, 78.210000),

-- ---------- CENTRAL: premium and legacy stock, mostly resale ----------
('Banjara Hills',       'banjara-hills',       'Central', 17.412000, 78.438000),
('Jubilee Hills',       'jubilee-hills',       'Central', 17.431000, 78.407000),
('Begumpet',            'begumpet',            'Central', 17.444000, 78.464000),
('Somajiguda',          'somajiguda',          'Central', 17.426000, 78.459000),
('Ameerpet',            'ameerpet',            'Central', 17.437000, 78.448000),
('Secunderabad',        'secunderabad',        'Central', 17.440000, 78.498000),
('Himayatnagar',        'himayatnagar',        'Central', 17.403000, 78.483000),
('Malakpet',            'malakpet',            'Central', 17.374000, 78.503000);


-- ---------------------------------------------------------------------
-- Check it worked: should print 54 rows grouped by zone
-- ---------------------------------------------------------------------
select zone, count(*) as localities
from localities
group by zone
order by localities desc;
