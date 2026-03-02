import { ROLES } from '../shared/constants';

export function getAvatarForRole(role) {
  switch (role) {
    case ROLES.HACKER:
      return 'https://api.dicebear.com/7.x/bottts/svg?seed=Hacker&baseColor=ff3366&eyes=bulging,dizzy,glow';
    case ROLES.ADMIN:
      return 'https://api.dicebear.com/7.x/bottts/svg?seed=Admin&baseColor=00ff88&eyes=glow,happy';
    case ROLES.SECURITY_LEAD:
      return 'https://api.dicebear.com/7.x/bottts/svg?seed=Security&baseColor=ffcc00&eyes=sensor';
    case ROLES.DEVELOPER:
      return 'https://api.dicebear.com/7.x/bottts/svg?seed=Dev&baseColor=00bbff&eyes=round,happy';
    default:
      return 'https://api.dicebear.com/7.x/bottts/svg?seed=Unknown&baseColor=888888&eyes=robocop';
  }
}

export function getAvatarForPlayer(name) {
  // Use their name as seed so it's consistent
  return `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}`;
}
