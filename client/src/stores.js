import { writable } from 'svelte/store';

export const panel = writable('Login'); // Login, Tests, Monitor
export const connected = writable(0);
export const debug = writable(0);
