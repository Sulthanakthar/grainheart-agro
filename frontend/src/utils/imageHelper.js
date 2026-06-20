export const resolveImage = (imgSrc) => {
  const fallback = 'images/toor-dal.png';
  const target = imgSrc ? imgSrc : fallback;
  if (target.startsWith('http') || target.startsWith('data:')) {
    return target;
  }
  const cleanSrc = target.startsWith('/') ? target.substring(1) : target;
  const pathParts = window.location.pathname.split('/');
  if (pathParts.includes('grainheart-agro')) {
    return `/grainheart-agro/${cleanSrc}`;
  }
  return `/${cleanSrc}`;
};
