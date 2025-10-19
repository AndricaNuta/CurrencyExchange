import mitt from 'mitt';

export type TourEvents = {
  'tour.starToWatchlist.step2': undefined;   // show tab tooltip
  'tour.starToWatchlist.clear': undefined;
  'tour.runGuided': undefined;               // 👈 NEW: open the first step now
  'alerts.open.forPair': { base: string; quote: string; fromTour?: boolean };
};

export const events = mitt<TourEvents>();

export const runGuidedTour = () => events.emit('tour.runGuided');
