-- Rebuilds the showcase set. The owner asked that no showcase brand be one
-- that supports Israel: companies on the published boycott lists (BDS targets
-- and the major grassroots boycotts) or with well-documented direct Israeli
-- operations, subsidiaries, or R&D centers are removed and replaced with other
-- large worldwide companies. The set stays at fifty, stays free, and still
-- never touches money, ranking, or billing.

-- Remove the flagged companies. Only rows seeded as showcase are touched, and
-- never one that has somehow acquired a placement.
delete from links
 where showcase
   and slug in (
     'apple','microsoft','google','amazon','nvidia','meta','tesla','samsung',
     'berkshire','jpmorgan','visa','mastercard','walmart','johnson-johnson',
     'procter-gamble','disney','coca-cola','pepsico','mcdonalds',
     'mercedes-benz','chevron','pfizer','intel','amd','oracle','salesforce',
     'adobe','ibm','cisco','sap','sony','airbnb','paypal','starbucks','lvmh'
   )
   and not exists (select 1 from placements p where p.link_id = links.id);

-- Seed the replacements, same shape as 0014: ordinary approved links flagged
-- showcase, owned by the first admin, no placements, no credit.
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
      ('honda',              'honda.com',           'Honda',              'Automobiles and motorcycles.'),
      ('hyundai',            'hyundai.com',         'Hyundai',            'Automobiles.'),
      ('kia',                'kia.com',             'Kia',                'Automobiles.'),
      ('nissan',             'nissan-global.com',   'Nissan',             'Automobiles.'),
      ('byd',                'byd.com',             'BYD',                'Electric vehicles.'),
      ('ferrari',            'ferrari.com',         'Ferrari',            'Sports cars.'),
      ('bridgestone',        'bridgestone.com',     'Bridgestone',        'Tires.'),
      ('yamaha',             'yamaha.com',          'Yamaha',             'Music and mobility.'),
      ('xiaomi',             'mi.com',              'Xiaomi',             'Electronics.'),
      ('lenovo',             'lenovo.com',          'Lenovo',             'Computers.'),
      ('oppo',               'oppo.com',            'OPPO',               'Smartphones.'),
      ('tencent',            'tencent.com',         'Tencent',            'Internet and games.'),
      ('jd',                 'jd.com',              'JD.com',             'Online retail.'),
      ('haier',              'haier.com',           'Haier',              'Home appliances.'),
      ('hisense',            'hisense.com',         'Hisense',            'Electronics.'),
      ('panasonic',          'panasonic.com',       'Panasonic',          'Electronics.'),
      ('canon',              'global.canon',        'Canon',              'Cameras and imaging.'),
      ('nikon',              'nikon.com',           'Nikon',              'Cameras.'),
      ('hitachi',            'hitachi.com',         'Hitachi',            'Industrial technology.'),
      ('lg',                 'lg.com',              'LG',                 'Electronics.'),
      ('uniqlo',             'uniqlo.com',          'Uniqlo',             'Clothing.'),
      ('asics',              'asics.com',           'ASICS',              'Sportswear.'),
      ('lego',               'lego.com',            'LEGO',               'Toys.'),
      ('rolex',              'rolex.com',           'Rolex',              'Watches.'),
      ('red-bull',           'redbull.com',         'Red Bull',           'Energy drinks.'),
      ('ferrero',            'ferrero.com',         'Ferrero',            'Confectionery.'),
      ('emirates',           'emirates.com',        'Emirates',           'Airline.'),
      ('qatar-airways',      'qatarairways.com',    'Qatar Airways',      'Airline.'),
      ('turkish-airlines',   'turkishairlines.com', 'Turkish Airlines',   'Airline.'),
      ('singapore-airlines', 'singaporeair.com',    'Singapore Airlines', 'Airline.'),
      ('aramco',             'aramco.com',          'Saudi Aramco',       'Energy.'),
      ('petronas',           'petronas.com',        'PETRONAS',           'Energy.'),
      ('adnoc',              'adnoc.ae',            'ADNOC',              'Energy.'),
      ('emaar',              'emaar.com',           'Emaar',              'Real estate.'),
      ('mercadolibre',       'mercadolibre.com',    'MercadoLibre',       'Online commerce.')
    ) as v(slug, domain, display_name, short_description)
  loop
    insert into links (owner_id, slug, destination_url, domain, display_name,
                       short_description, moderation_status, showcase)
    values (v_owner, r.slug, 'https://' || r.domain || '/', r.domain,
            r.display_name, r.short_description, 'approved', true)
    on conflict (slug) do nothing;
  end loop;
end $$;
