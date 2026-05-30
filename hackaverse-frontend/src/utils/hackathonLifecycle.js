export const HACKATHON_STATUS = {
  UPCOMING: 'upcoming',
  ACTIVE: 'active',
  JUDGING: 'judging',
  COMPLETED: 'completed'
};

export const getHackathonStatus = (startDate, endDate, judgingEndDate) => {
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);
  const judgingEnd = judgingEndDate ? new Date(judgingEndDate) : null;

  if (now < start) return HACKATHON_STATUS.UPCOMING;
  if (now >= start && now <= end) return HACKATHON_STATUS.ACTIVE;
  if (now > end && (!judgingEnd || now <= judgingEnd)) return HACKATHON_STATUS.JUDGING;
  return HACKATHON_STATUS.COMPLETED;
};

export const updateHackathonStatuses = (hackathons) => {
  return hackathons.map(h => ({
    ...h,
    status: getHackathonStatus(h.start_date, h.end_date, h.judging_end_date)
  }));
};

export const isHackathonActive = (hackathon) => {
  return getHackathonStatus(hackathon.start_date, hackathon.end_date) === HACKATHON_STATUS.ACTIVE;
};

export const isHackathonInJudging = (hackathon) => {
  return getHackathonStatus(hackathon.start_date, hackathon.end_date) === HACKATHON_STATUS.JUDGING;
};

export const canSubmitProject = (hackathon) => {
  return isHackathonActive(hackathon);
};

export const canJudgeProject = (hackathon) => {
  return isHackathonInJudging(hackathon);
};

export const getTimeRemaining = (endDate) => {
  const now = new Date();
  const end = new Date(endDate);
  const diff = end - now;
  
  if (diff <= 0) return null;
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  return { days, hours, minutes };
};

export const formatTimeRemaining = (endDate) => {
  const time = getTimeRemaining(endDate);
  if (!time) return 'Ended';
  
  if (time.days > 0) return `${time.days}d ${time.hours}h`;
  if (time.hours > 0) return `${time.hours}h ${time.minutes}m`;
  return `${time.minutes}m`;
};
