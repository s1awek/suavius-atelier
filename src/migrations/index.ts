import * as migration_20260527_084438_initial from './20260527_084438_initial';
import * as migration_20260527_153518_add_redirects from './20260527_153518_add_redirects';
import * as migration_20260528_075929_drafts_no_catalog_status from './20260528_075929_drafts_no_catalog_status';
import * as migration_20260602_142301_add_personalization from './20260602_142301_add_personalization';
import * as migration_20260602_145307_draft_orders from './20260602_145307_draft_orders';
import * as migration_20260602_154818_add_stock_alert_consent from './20260602_154818_add_stock_alert_consent';
import * as migration_20260617_135639_add_search_events from './20260617_135639_add_search_events';
import * as migration_20260703_141024_add_product_interest_and_video from './20260703_141024_add_product_interest_and_video';

export const migrations = [
  {
    up: migration_20260527_084438_initial.up,
    down: migration_20260527_084438_initial.down,
    name: '20260527_084438_initial',
  },
  {
    up: migration_20260527_153518_add_redirects.up,
    down: migration_20260527_153518_add_redirects.down,
    name: '20260527_153518_add_redirects',
  },
  {
    up: migration_20260528_075929_drafts_no_catalog_status.up,
    down: migration_20260528_075929_drafts_no_catalog_status.down,
    name: '20260528_075929_drafts_no_catalog_status',
  },
  {
    up: migration_20260602_142301_add_personalization.up,
    down: migration_20260602_142301_add_personalization.down,
    name: '20260602_142301_add_personalization',
  },
  {
    up: migration_20260602_145307_draft_orders.up,
    down: migration_20260602_145307_draft_orders.down,
    name: '20260602_145307_draft_orders',
  },
  {
    up: migration_20260602_154818_add_stock_alert_consent.up,
    down: migration_20260602_154818_add_stock_alert_consent.down,
    name: '20260602_154818_add_stock_alert_consent',
  },
  {
    up: migration_20260617_135639_add_search_events.up,
    down: migration_20260617_135639_add_search_events.down,
    name: '20260617_135639_add_search_events',
  },
  {
    up: migration_20260703_141024_add_product_interest_and_video.up,
    down: migration_20260703_141024_add_product_interest_and_video.down,
    name: '20260703_141024_add_product_interest_and_video'
  },
];
