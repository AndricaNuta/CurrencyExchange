import mitt from 'mitt';

export type TourEvents = {
  'tour.starToWatchlist.step2': undefined;
  'tour.starToWatchlist.clear': undefined;
  'tour.runGuided': undefined;
  'alerts.open.forPair': { base: string; quote: string; fromTour?: boolean };
};

export const events = mitt<TourEvents>();

export const runGuidedTour = () => events.emit('tour.runGuided');
