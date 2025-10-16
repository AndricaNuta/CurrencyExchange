import mitt from 'mitt';

export type TourEvents = {
    'tour.starToWatchlist.step2': undefined;   // show tab tooltip
    'tour.starToWatchlist.clear': undefined;   // cancel if needed
  };

export const events = mitt<TourEvents>();
