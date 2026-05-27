import * as migration_20260527_084438_initial from './20260527_084438_initial';
import * as migration_20260527_153518_add_redirects from './20260527_153518_add_redirects';

export const migrations = [
  {
    up: migration_20260527_084438_initial.up,
    down: migration_20260527_084438_initial.down,
    name: '20260527_084438_initial',
  },
  {
    up: migration_20260527_153518_add_redirects.up,
    down: migration_20260527_153518_add_redirects.down,
    name: '20260527_153518_add_redirects'
  },
];
