/**
 * Prefijos de las query keys del registro de actividad. En su propio archivo,
 * como las de GPS, para que otras mutaciones puedan invalidarlas sin importar
 * el barrel.
 */
export const ACTIVITY_FEED_QUERY_KEY = 'activityFeed';
export const ENTITY_ACTIVITY_QUERY_KEY = 'entityActivity';
