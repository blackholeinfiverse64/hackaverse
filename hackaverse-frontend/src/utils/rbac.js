// Role definitions
export const ROLES = {
  ADMIN: 'admin',
  PARTICIPANT: 'participant',
  JUDGE: 'judge'
};

// Permission matrix
const permissions = {
  admin: {
    viewAllHackathons: true,
    viewAllTeams: true,
    viewAllParticipants: true,
    viewAllProjects: true,
    createHackathon: true,
    inviteJudge: true,
    inviteParticipant: true,
    viewActivityLogs: true,
    scoreProjects: false,
    viewLeaderboard: true
  },
  participant: {
    viewAllHackathons: false,
    viewAllTeams: false,
    viewAllParticipants: false,
    viewAllProjects: false,
    createHackathon: false,
    inviteJudge: false,
    inviteParticipant: false,
    viewActivityLogs: false,
    scoreProjects: false,
    viewLeaderboard: true
  },
  judge: {
    viewAllHackathons: false,
    viewAllTeams: false,
    viewAllParticipants: false,
    viewAllProjects: false,
    createHackathon: false,
    inviteJudge: false,
    inviteParticipant: false,
    viewActivityLogs: false,
    scoreProjects: true,
    viewLeaderboard: true
  }
};

export const hasPermission = (role, permission) => {
  return permissions[role]?.[permission] || false;
};

export const canViewResource = (userRole, resourceType, resourceOwnerId, currentUserId) => {
  if (userRole === ROLES.ADMIN) return true;
  if (userRole === ROLES.PARTICIPANT && resourceOwnerId === currentUserId) return true;
  if (userRole === ROLES.JUDGE && resourceType === 'project') return true;
  return false;
};

export const filterDataByRole = (data, userRole, userId) => {
  if (userRole === ROLES.ADMIN) return data;
  
  if (userRole === ROLES.PARTICIPANT) {
    return data.filter(item => item.userId === userId || item.teamId === userId);
  }
  
  if (userRole === ROLES.JUDGE) {
    return data.filter(item => item.assignedJudges?.includes(userId));
  }
  
  return [];
};

export const getAccessibleHackathons = (hackathons, userRole, userId) => {
  if (userRole === ROLES.ADMIN) return hackathons;
  return hackathons.filter(h => h.status === 'active' || h.status === 'upcoming');
};

export const getAccessibleTeams = (teams, userRole, userId) => {
  if (userRole === ROLES.ADMIN) return teams;
  if (userRole === ROLES.PARTICIPANT) {
    return teams.filter(t => t.members?.includes(userId) || t.leaderId === userId);
  }
  return [];
};

export const getAccessibleProjects = (projects, userRole, userId) => {
  if (userRole === ROLES.ADMIN) return projects;
  if (userRole === ROLES.PARTICIPANT) {
    return projects.filter(p => p.teamId === userId);
  }
  if (userRole === ROLES.JUDGE) {
    return projects.filter(p => p.assignedJudges?.includes(userId));
  }
  return [];
};
