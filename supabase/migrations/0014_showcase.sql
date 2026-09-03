-- Showcase ads: a curated set of links to famous companies that the admin can
-- switch on to fill the screen while the paid inventory grows, and off again
-- with one click. They are ordinary links flagged `showcase`, owned by the
-- first admin, with no placements and no credit — they never touch money,
-- ranking, or billing, and paid ads always take priority over them.

alter table links add column if not exists showcase boolean not null default false;
create index if not exists links_showcase_idx on links (showcase) where showcase;

insert into app_settings (key, value) values ('feature_showcase_ads', to_jsonb('false'::text))
on conflict (key) do nothing;

do $$
declare
  v_owner uuid;
  r record;
begin
  select id into v_owner from profiles where role = 'admin' order by created_at limit 1;
  if v_owner is null then
    raise notice 'no admin profile; showcase links not seeded';
    return;
  end if;

  for r in
    select * from (values
      ('apple',           'apple.com',            'Apple',              'Consumer technology.'),
      ('microsoft',       'microsoft.com',        'Microsoft',          'Software and cloud.'),
      ('google',          'google.com',           'Google',             'Search and services.'),
      ('amazon',          'amazon.com',           'Amazon',             'Everything store and cloud.'),
      ('nvidia',          'nvidia.com',           'NVIDIA',             'Accelerated computing.'),
      ('meta',            'meta.com',             'Meta',               'Social platforms.'),
      ('tesla',           'tesla.com',            'Tesla',              'Electric vehicles and energy.'),
      ('samsung',         'samsung.com',          'Samsung',            'Electronics.'),
      ('tsmc',            'tsmc.com',             'TSMC',               'Semiconductor manufacturing.'),
      ('berkshire',       'berkshirehathaway.com','Berkshire Hathaway', 'Holding company.'),
      ('jpmorgan',        'jpmorganchase.com',    'JPMorgan Chase',     'Banking and finance.'),
      ('visa',            'visa.com',             'Visa',               'Payments network.'),
      ('mastercard',      'mastercard.com',       'Mastercard',         'Payments network.'),
      ('walmart',         'walmart.com',          'Walmart',            'Retail.'),
      ('exxonmobil',      'exxonmobil.com',       'ExxonMobil',         'Energy.'),
      ('unitedhealth',    'unitedhealthgroup.com','UnitedHealth',       'Healthcare.'),
      ('johnson-johnson', 'jnj.com',              'Johnson & Johnson',  'Healthcare products.'),
      ('procter-gamble',  'pg.com',               'Procter & Gamble',   'Consumer goods.'),
      ('netflix',         'netflix.com',          'Netflix',            'Streaming.'),
      ('disney',          'disney.com',           'Disney',             'Entertainment.'),
      ('coca-cola',       'coca-cola.com',        'Coca-Cola',          'Beverages.'),
      ('pepsico',         'pepsico.com',          'PepsiCo',            'Food and beverages.'),
      ('mcdonalds',       'mcdonalds.com',        'McDonald''s',        'Restaurants.'),
      ('nike',            'nike.com',             'Nike',               'Sportswear.'),
      ('adidas',          'adidas.com',           'adidas',             'Sportswear.'),
      ('toyota',          'toyota.com',           'Toyota',             'Automobiles.'),
      ('bmw',             'bmw.com',              'BMW',                'Automobiles.'),
      ('mercedes-benz',   'mercedes-benz.com',    'Mercedes-Benz',      'Automobiles.'),
      ('shell',           'shell.com',            'Shell',              'Energy.'),
      ('chevron',         'chevron.com',          'Chevron',            'Energy.'),
      ('pfizer',          'pfizer.com',           'Pfizer',             'Pharmaceuticals.'),
      ('roche',           'roche.com',            'Roche',              'Pharmaceuticals.'),
      ('novartis',        'novartis.com',         'Novartis',           'Pharmaceuticals.'),
      ('intel',           'intel.com',            'Intel',              'Semiconductors.'),
      ('amd',             'amd.com',              'AMD',                'Semiconductors.'),
      ('oracle',          'oracle.com',           'Oracle',             'Enterprise software.'),
      ('salesforce',      'salesforce.com',       'Salesforce',         'Business software.'),
      ('adobe',           'adobe.com',            'Adobe',              'Creative software.'),
      ('ibm',             'ibm.com',              'IBM',                'Enterprise technology.'),
      ('cisco',           'cisco.com',            'Cisco',              'Networking.'),
      ('sap',             'sap.com',              'SAP',                'Enterprise software.'),
      ('sony',            'sony.com',             'Sony',               'Electronics and entertainment.'),
      ('nintendo',        'nintendo.com',         'Nintendo',           'Games.'),
      ('spotify',         'spotify.com',          'Spotify',            'Music streaming.'),
      ('airbnb',          'airbnb.com',           'Airbnb',             'Stays and experiences.'),
      ('uber',            'uber.com',             'Uber',               'Mobility.'),
      ('paypal',          'paypal.com',           'PayPal',             'Payments.'),
      ('stripe',          'stripe.com',           'Stripe',             'Payments infrastructure.'),
      ('starbucks',       'starbucks.com',        'Starbucks',          'Coffee.'),
      ('lvmh',            'lvmh.com',             'LVMH',               'Luxury goods.')
    ) as v(slug, domain, display_name, short_description)
  loop
    insert into links (owner_id, slug, destination_url, domain, display_name,
                       short_description, moderation_status, showcase)
    values (v_owner, r.slug, 'https://' || r.domain || '/', r.domain,
            r.display_name, r.short_description, 'approved', true)
    on conflict (slug) do nothing;
  end loop;
end $$;
