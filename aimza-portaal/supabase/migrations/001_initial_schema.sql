-- ============================================
-- AIMZA VERZEKERINGSPORTAAL - DATABASE SCHEMA
-- ============================================

-- ============================================
-- GEBRUIKERS & ROLLEN
-- ============================================

-- Enum voor rollen
CREATE TYPE user_role AS ENUM ('admin', 'uploader', 'user');

-- Gebruikersprofielen (gekoppeld aan Supabase Auth)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    naam TEXT,
    role user_role NOT NULL DEFAULT 'user',
    actief BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS policies voor profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Gebruikers kunnen eigen profiel zien" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins kunnen alle profielen zien" ON profiles
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Admins kunnen profielen aanpassen" ON profiles
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Trigger voor automatisch profiel aanmaken bij registratie
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, email, naam, role)
    VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'naam', ''), 'user');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- RELATIES (Particulier + Zakelijk gecombineerd)
-- ============================================

CREATE TABLE relaties (
    id TEXT PRIMARY KEY,
    relatie_type TEXT NOT NULL DEFAULT 'particulier', -- 'particulier' of 'zakelijk'
    hoofdrelatie_jn TEXT,
    hoofdrelatie_nr TEXT,

    -- Persoonlijke/Bedrijfsgegevens
    titulatuur TEXT,
    aanhef TEXT,
    voorletters TEXT,
    voorvoegsels TEXT,
    achternaam TEXT, -- Bij zakelijk = bedrijfsnaam
    naam_tweede_deel TEXT, -- Alleen zakelijk
    roepnaam TEXT,
    geboortedatum DATE,
    geslacht TEXT,
    nationaliteit TEXT,

    -- Adres
    adres TEXT,
    huisnummer TEXT,
    huisnummer_toevoeging TEXT,
    postcode TEXT,
    woonplaats TEXT,
    land TEXT,

    -- Contact
    email TEXT,
    email_tweede TEXT,
    email_partner TEXT,
    telefoon_prive TEXT,
    telefoon_mobiel TEXT,
    telefoon_zakelijk TEXT, -- Alleen zakelijk

    -- Relatiebeheer
    producent TEXT,
    belang TEXT,
    herkomst TEXT,

    -- Partner gegevens (particulier)
    partner_titulatuur TEXT,
    partner_voorletters TEXT,
    partner_voorvoegsels TEXT,
    partner_roepnaam TEXT,
    partner_achternaam TEXT,

    -- T.a.v. contactpersoon (zakelijk)
    tav_titulatuur TEXT,
    tav_aanhef TEXT,
    tav_voorletters TEXT,
    tav_voorvoegsels TEXT,
    tav_achternaam TEXT,
    tav_roepnaam TEXT,

    -- Administratief (beide)
    burgerlijke_staat TEXT,
    arbeidsverhouding TEXT,
    mailing TEXT,
    incassowijze TEXT,
    iban_bank TEXT,
    iban_postbank TEXT,
    aantal_kinderen INTEGER,
    polisblad_per_email TEXT,
    factuur_per_email TEXT,
    aantal_polissen INTEGER,
    incassoprovisie_totaal DECIMAL(10,2),

    -- Marketing (zakelijk)
    cvbi_marketing TEXT,
    tenaamstelling_cvbi TEXT,

    -- Bedrijfsgegevens (zakelijk)
    kvk_nummer TEXT,
    rechtsvorm TEXT,
    sbi_hoofdactiviteit TEXT,
    sbi_nevenactiviteit TEXT,
    bedrijfstak TEXT,
    zzp TEXT,
    cao TEXT,
    sectorcode_uwv TEXT,

    -- Bezoek (zakelijk)
    laatste_bezoekmaand TEXT,
    volgende_bezoekdatum DATE,

    -- Naverrekening (zakelijk)
    naverrekening_jn TEXT,
    naverrekening_jaar_huidig INTEGER,
    naverrekening_jaar_laatste INTEGER,
    machtiging_boekhouder TEXT,

    -- Financieel zakelijk
    omzet DECIMAL(14,2),
    jaarloon DECIMAL(14,2),
    brutowinst DECIMAL(14,2),

    -- Personeel (zakelijk)
    aantal_medewerkers INTEGER,
    aantal_oproepkrachten INTEGER,

    -- Wagenpark (zakelijk)
    aantal_personenautos INTEGER,
    aantal_bestelautos INTEGER,
    aantal_vrachtautos INTEGER,
    aantal_werkmaterieel INTEGER,

    -- Compliance (zakelijk)
    ubo_onderzoek TEXT,

    -- Vrije velden
    vrije_tekst_1 TEXT,
    vrije_tekst_2 TEXT,
    extra_informatie TEXT,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_relaties_type ON relaties(relatie_type);
CREATE INDEX idx_relaties_achternaam ON relaties(achternaam);
CREATE INDEX idx_relaties_postcode ON relaties(postcode);
CREATE INDEX idx_relaties_email ON relaties(email);
CREATE INDEX idx_relaties_kvk ON relaties(kvk_nummer) WHERE kvk_nummer IS NOT NULL;
CREATE INDEX idx_relaties_search ON relaties USING gin(
    to_tsvector('dutch', COALESCE(achternaam, '') || ' ' || COALESCE(roepnaam, '') || ' ' || COALESCE(woonplaats, '') || ' ' || COALESCE(kvk_nummer, ''))
);

-- RLS voor relaties
ALTER TABLE relaties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ingelogde gebruikers kunnen relaties zien" ON relaties
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Uploaders en admins kunnen relaties wijzigen" ON relaties
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'uploader'))
    );

-- ============================================
-- PAKKETTEN
-- ============================================

CREATE TABLE pakketten (
    id TEXT PRIMARY KEY,
    relatie_id TEXT REFERENCES relaties(id) ON DELETE CASCADE,
    pakketsoort TEXT,
    kortingspercentage DECIMAL(5,2),
    incassowijze TEXT,
    iban TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_pakketten_relatie ON pakketten(relatie_id);

ALTER TABLE pakketten ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ingelogde gebruikers kunnen pakketten zien" ON pakketten
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Uploaders en admins kunnen pakketten wijzigen" ON pakketten
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'uploader'))
    );

-- ============================================
-- POLISSEN
-- ============================================

CREATE TABLE polissen (
    id TEXT PRIMARY KEY,
    polisnummer TEXT NOT NULL,
    volgnummer TEXT,
    relatie_id TEXT REFERENCES relaties(id) ON DELETE CASCADE,
    pakket_id TEXT REFERENCES pakketten(id) ON DELETE SET NULL,

    -- Maatschappij & Classificatie
    maatschappij_code TEXT,
    maatschappij TEXT,
    soort_polis TEXT,
    hoofdbranche TEXT,
    branche TEXT,

    -- Datums
    ingangsdatum DATE,
    wijzigingsdatum DATE,
    wijzigingsreden_code TEXT,
    wijzigingsreden TEXT,
    premievervaldatum TEXT,
    termijn INTEGER,

    -- Financieel
    premie_netto DECIMAL(12,2),
    provisie_totaal DECIMAL(12,2),
    premie_incasso DECIMAL(12,2),

    -- Incasso
    incassowijze TEXT,
    iban_polis TEXT,

    -- Risico adres
    risico_adres TEXT,
    risico_huisnummer TEXT,
    risico_huisnummer_toev TEXT,
    risico_postcode TEXT,
    risico_plaats TEXT,

    -- Verzekerd
    verzekerd_bedrag DECIMAL(14,2),
    eigen_risico DECIMAL(10,2),

    -- JSON velden
    voorwaarden JSONB DEFAULT '[]',
    clausules JSONB DEFAULT '[]',
    details JSONB DEFAULT '{}',

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_polissen_relatie ON polissen(relatie_id);
CREATE INDEX idx_polissen_pakket ON polissen(pakket_id);
CREATE INDEX idx_polissen_polisnummer ON polissen(polisnummer);
CREATE INDEX idx_polissen_branche ON polissen(hoofdbranche, branche);
CREATE INDEX idx_polissen_maatschappij ON polissen(maatschappij);
CREATE INDEX idx_polissen_details ON polissen USING GIN (details);
CREATE INDEX idx_polissen_kenteken ON polissen((details->>'kenteken')) WHERE details->>'kenteken' IS NOT NULL;
CREATE INDEX idx_polissen_risico_postcode ON polissen(risico_postcode) WHERE risico_postcode IS NOT NULL;

ALTER TABLE polissen ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ingelogde gebruikers kunnen polissen zien" ON polissen
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Uploaders en admins kunnen polissen wijzigen" ON polissen
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'uploader'))
    );

-- ============================================
-- POLIS DEKKINGEN
-- ============================================

CREATE TABLE polis_dekkingen (
    id SERIAL PRIMARY KEY,
    polis_id TEXT REFERENCES polissen(id) ON DELETE CASCADE,
    dekking_code TEXT,
    dekking_naam TEXT,
    premie_netto DECIMAL(10,2),
    provisie DECIMAL(10,2),
    incassobedrag DECIMAL(10,2),
    verzekerd_bedrag DECIMAL(14,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_dekkingen_polis ON polis_dekkingen(polis_id);

ALTER TABLE polis_dekkingen ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ingelogde gebruikers kunnen dekkingen zien" ON polis_dekkingen
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Uploaders en admins kunnen dekkingen wijzigen" ON polis_dekkingen
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'uploader'))
    );

-- ============================================
-- SYNC LOG & WIJZIGINGEN
-- ============================================

CREATE TABLE sync_log (
    id SERIAL PRIMARY KEY,
    sync_datum TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    tabel_naam TEXT NOT NULL, -- 'relaties_particulier', 'relaties_zakelijk', 'polissen'
    bestand_naam TEXT,

    records_totaal INTEGER DEFAULT 0,
    records_nieuw INTEGER DEFAULT 0,
    records_gewijzigd INTEGER DEFAULT 0,
    records_verwijderd INTEGER DEFAULT 0,
    records_ongewijzigd INTEGER DEFAULT 0,

    sync_duur_seconden DECIMAL(10,2),
    status TEXT DEFAULT 'success',
    error_message TEXT,

    uitgevoerd_door UUID REFERENCES profiles(id)
);

CREATE INDEX idx_sync_log_datum ON sync_log(sync_datum DESC);
CREATE INDEX idx_sync_log_tabel ON sync_log(tabel_naam);

CREATE TABLE sync_wijzigingen (
    id SERIAL PRIMARY KEY,
    sync_id INTEGER REFERENCES sync_log(id) ON DELETE CASCADE,
    sync_datum TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    tabel_naam TEXT NOT NULL,
    record_id TEXT NOT NULL,

    wijziging_type TEXT NOT NULL, -- 'nieuw', 'gewijzigd', 'verwijderd'
    veld_naam TEXT,
    oude_waarde TEXT,
    nieuwe_waarde TEXT,

    record_snapshot JSONB
);

CREATE INDEX idx_wijzigingen_sync ON sync_wijzigingen(sync_id);
CREATE INDEX idx_wijzigingen_datum ON sync_wijzigingen(sync_datum DESC);
CREATE INDEX idx_wijzigingen_record ON sync_wijzigingen(tabel_naam, record_id);

ALTER TABLE sync_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_wijzigingen ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ingelogde gebruikers kunnen sync logs zien" ON sync_log
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Uploaders en admins kunnen sync logs maken" ON sync_log
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'uploader'))
    );

CREATE POLICY "Ingelogde gebruikers kunnen wijzigingen zien" ON sync_wijzigingen
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Uploaders en admins kunnen wijzigingen maken" ON sync_wijzigingen
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'uploader'))
    );

-- ============================================
-- VALIDATIE FOUTEN (voorbereid voor later)
-- ============================================

CREATE TABLE validatie_fouten (
    id SERIAL PRIMARY KEY,
    aangemaakt_op TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sync_id INTEGER REFERENCES sync_log(id),

    tabel_naam TEXT NOT NULL,
    record_id TEXT NOT NULL,

    veld_naam TEXT NOT NULL,
    fout_type TEXT NOT NULL,
    fout_melding TEXT NOT NULL,
    huidige_waarde TEXT,

    status TEXT DEFAULT 'open',
    toegewezen_aan UUID REFERENCES profiles(id),
    opgelost_op TIMESTAMP WITH TIME ZONE,
    opgelost_door UUID REFERENCES profiles(id),
    notitie TEXT,

    record_snapshot JSONB
);

CREATE INDEX idx_validatie_status ON validatie_fouten(status, aangemaakt_op DESC);
CREATE INDEX idx_validatie_record ON validatie_fouten(tabel_naam, record_id);

ALTER TABLE validatie_fouten ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ingelogde gebruikers kunnen fouten zien" ON validatie_fouten
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Gebruikers kunnen fouten afhandelen" ON validatie_fouten
    FOR UPDATE USING (auth.uid() IS NOT NULL);

-- ============================================
-- VIEWS
-- ============================================

-- Relatie met aantal polissen en totaal premie
CREATE VIEW relaties_overview AS
SELECT
    r.*,
    COUNT(DISTINCT p.id) as aantal_polissen_actief,
    COALESCE(SUM(p.premie_netto), 0) as totaal_premie
FROM relaties r
LEFT JOIN polissen p ON r.id = p.relatie_id
GROUP BY r.id;

-- Polissen met relatie info (voor zoeken)
CREATE VIEW polissen_overview AS
SELECT
    p.*,
    r.achternaam as relatie_achternaam,
    r.voorletters as relatie_voorletters,
    r.voorvoegsels as relatie_voorvoegsels,
    r.woonplaats as relatie_woonplaats,
    r.relatie_type as relatie_type,
    COUNT(d.id) as aantal_dekkingen
FROM polissen p
LEFT JOIN relaties r ON p.relatie_id = r.id
LEFT JOIN polis_dekkingen d ON p.id = d.polis_id
GROUP BY p.id, r.achternaam, r.voorletters, r.voorvoegsels, r.woonplaats, r.relatie_type;

-- Dashboard stats
CREATE VIEW dashboard_stats AS
SELECT
    (SELECT COUNT(*) FROM relaties) as totaal_relaties,
    (SELECT COUNT(*) FROM relaties WHERE relatie_type = 'particulier') as totaal_particulier,
    (SELECT COUNT(*) FROM relaties WHERE relatie_type = 'zakelijk') as totaal_zakelijk,
    (SELECT COUNT(*) FROM polissen) as totaal_polissen,
    (SELECT COUNT(*) FROM pakketten) as totaal_pakketten,
    (SELECT COUNT(*) FROM sync_log WHERE sync_datum > NOW() - INTERVAL '24 hours') as imports_vandaag,
    (SELECT COALESCE(SUM(records_nieuw), 0) FROM sync_log WHERE sync_datum > NOW() - INTERVAL '7 days') as nieuwe_records_week,
    (SELECT COALESCE(SUM(records_gewijzigd), 0) FROM sync_log WHERE sync_datum > NOW() - INTERVAL '7 days') as gewijzigde_records_week;

-- Mutaties per dag (laatste 30 dagen)
CREATE VIEW mutaties_per_dag AS
SELECT
    DATE(sync_datum) as datum,
    tabel_naam,
    SUM(records_nieuw) as nieuw,
    SUM(records_gewijzigd) as gewijzigd,
    SUM(records_verwijderd) as verwijderd
FROM sync_log
WHERE sync_datum > NOW() - INTERVAL '30 days'
AND status = 'success'
GROUP BY DATE(sync_datum), tabel_naam
ORDER BY datum DESC;

-- Polissen per hoofdbranche
CREATE VIEW polissen_per_branche AS
SELECT
    hoofdbranche,
    COUNT(*) as aantal,
    SUM(premie_netto) as totaal_premie
FROM polissen
WHERE hoofdbranche IS NOT NULL AND hoofdbranche != ''
GROUP BY hoofdbranche
ORDER BY aantal DESC;

-- Relaties per type
CREATE VIEW relaties_per_type AS
SELECT
    relatie_type,
    COUNT(*) as aantal
FROM relaties
GROUP BY relatie_type;

-- ============================================
-- HELPER FUNCTIES
-- ============================================

-- Functie om gebruikersrol op te halen
CREATE OR REPLACE FUNCTION get_user_role(user_id UUID)
RETURNS user_role AS $$
    SELECT role FROM profiles WHERE id = user_id;
$$ LANGUAGE sql SECURITY DEFINER;

-- Functie om te checken of gebruiker admin is
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin');
$$ LANGUAGE sql SECURITY DEFINER;

-- Functie om te checken of gebruiker kan uploaden
CREATE OR REPLACE FUNCTION can_upload()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'uploader'));
$$ LANGUAGE sql SECURITY DEFINER;

-- Zoekfunctie voor polissen (op kenteken, polisnummer, postcode)
CREATE OR REPLACE FUNCTION search_polissen(search_term TEXT)
RETURNS SETOF polissen_overview AS $$
BEGIN
    RETURN QUERY
    SELECT po.*
    FROM polissen_overview po
    WHERE
        po.polisnummer ILIKE '%' || search_term || '%'
        OR po.details->>'kenteken' ILIKE '%' || search_term || '%'
        OR po.risico_postcode ILIKE '%' || search_term || '%'
        OR po.risico_plaats ILIKE '%' || search_term || '%'
        OR po.maatschappij ILIKE '%' || search_term || '%'
        OR po.branche ILIKE '%' || search_term || '%'
        OR po.relatie_achternaam ILIKE '%' || search_term || '%'
    ORDER BY po.polisnummer
    LIMIT 100;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Zoekfunctie voor relaties (beide types)
CREATE OR REPLACE FUNCTION search_relaties(search_term TEXT, filter_type TEXT DEFAULT NULL)
RETURNS SETOF relaties_overview AS $$
BEGIN
    RETURN QUERY
    SELECT ro.*
    FROM relaties_overview ro
    WHERE
        (filter_type IS NULL OR ro.relatie_type = filter_type)
        AND (
            ro.id ILIKE '%' || search_term || '%'
            OR ro.achternaam ILIKE '%' || search_term || '%'
            OR ro.roepnaam ILIKE '%' || search_term || '%'
            OR ro.postcode ILIKE '%' || search_term || '%'
            OR ro.woonplaats ILIKE '%' || search_term || '%'
            OR ro.email ILIKE '%' || search_term || '%'
            OR ro.kvk_nummer ILIKE '%' || search_term || '%'
        )
    ORDER BY ro.achternaam, ro.voorletters
    LIMIT 100;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
