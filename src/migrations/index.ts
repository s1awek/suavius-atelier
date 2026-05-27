import * as migration_20260527_084438_initial from './20260527_084438_initial';

export const migrations = [
  {
    up: migration_20260527_084438_initial.up,
    down: migration_20260527_084438_initial.down,
    name: '20260527_084438_initial'
  },
];
