import Timestamp from "timestamp-nano";

export var timeNow = function (): Timestamp {
  return Timestamp.fromDate(new Date());
};

export var timeSince = function (since: Timestamp): number {
  return timeNow().toDate().getTime() - since.toDate().getTime();
};

export function setTimeNow(now: string): void {
  timeNow = function () {
    return Timestamp.fromString(now);
  };
}

export function setTimeSince(elapsed: number): void {
  timeSince = function (since: Timestamp): number {
    return elapsed;
  };
}
