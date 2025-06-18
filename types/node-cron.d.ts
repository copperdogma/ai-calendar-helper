declare module 'node-cron' {
  interface ScheduledTask {
    start: () => void;
    stop: () => void;
    destroy: () => void;
  }

  type ScheduleOptions = {
    scheduled?: boolean;
    timezone?: string;
  };

  function schedule(expression: string, func: () => void, options?: ScheduleOptions): ScheduledTask;

  namespace schedule {
    // nothing
  }

  const _default: {
    schedule: typeof schedule;
  };

  export = _default;
}
