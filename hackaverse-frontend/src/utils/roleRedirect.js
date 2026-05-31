/** Role-based home route — single source of truth for post-login redirects. */
export const getRoleHomePath = (role) => {
  switch (role) {
    case 'admin':
      return '/admin';
    case 'judge':
      return '/judge';
    default:
      return '/app';
  }
};

export const getRoleProfilePath = (role) => {
  switch (role) {
    case 'admin':
      return '/admin/settings';
    case 'judge':
      return '/judge';
    default:
      return '/app/profile';
  }
};

export const getRoleSettingsPath = (role) => {
  switch (role) {
    case 'admin':
      return '/admin/settings';
    case 'judge':
      return '/judge';
    default:
      return '/app/profile';
  }
};
